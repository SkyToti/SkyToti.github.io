/**
 * La muela esmerilada (BRIEF.md §3.1): una muela modelada con funciones de distancia (SDF),
 * dibujada con WebGL2 en tres pasadas:
 *   1. trazado de rayos de la muela: mate, en escala de grises, con la niebla por altura «horneada»
 *      (la corona nítida; las raíces se disuelven en blanco);
 *   2 y 3. desenfoque separable cuyo radio crece hacia abajo (el vidrio esmerilado) y grano fino.
 * Geometría propia: no usa modelos de terceros. Sin three.js.
 *
 * La misma cámara y el mismo giro se replican en `proyectar()` para que las llamadas (§3.1)
 * sigan a sus puntos sobre la muela.
 */

const VERT = `#version 300 es
in vec2 p;
out vec2 vUv;
void main(){ vUv = p*0.5+0.5; gl_Position = vec4(p,0.0,1.0); }`;

/** Pasada 1: la muela */
const FRAG_MUELA = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;
uniform vec2 uRes;
uniform mat3 uRot;     // modelo → mundo
uniform vec3 uCam;     // posición de la cámara
uniform vec3 uMira;    // a dónde mira
uniform float uFoco;   // distancia focal (en alturas de pantalla)
uniform float uNiebla; // 0 = la niebla normal; 1 = todo niebla (la entrada)
uniform float uNivel;  // altura (modelo) donde empieza a disolverse
uniform float uTiempo;
// la forma de cada unidad (0–1, se interpola al cambiar): §3.2
uniform float uImplante; // Centro: la corona sobre un implante
uniform float uCorona;   // Laboratorio: la corona se levanta de su muñón
uniform float uBrackets; // Sucursales: bracket y arco
uniform float uEscaneo;  // Imagen Dental: cortes que la recorren
uniform float uFantasma; // Especialidades: por mapear
// Colores clínicos (BRIEF-4 §3): cada zona anatómica, rgb + fuerza (0–1).
// 0 oclusal · 1 mesial (+x) · 2 distal (−x: hacia allá se curvan las raíces) · 3 vestibular (+z, donde va el
// bracket) · 4 palatina o lingual (−z) · 5 cervical · 6 radicular · 7 periapical
uniform vec4 uZona[8];
uniform float uTrama[8];     // 1 = sugerido por la IA: trama y pulso, nunca relleno
uniform vec4 uConducto;      // la endodoncia: el conducto dentro de la raíz, visto a través del vidrio
uniform float uConductoTrama;
uniform float uHayColor;     // 0 = nada que teñir (atajo)
uniform float uPulso;        // 0–1: el latido de lo sugerido (quieto con movimiento reducido)
// El tipo de pieza (BRIEF-4 §4.B), fracciones que suman 1 y se funden al cambiar:
// 0 molar superior (3 raíces) · 1 molar inferior (2 raíces) · 2 premolar · 3 canino · 4 incisivo
uniform float uTipo[5];
uniform vec3 uPunta[3];     // las puntas de las raíces (espacio de la muela), según el tipo
uniform float uPuntas;      // cuántas

float smin(float a, float b, float k){ float h = max(k-abs(a-b),0.0)/k; return min(a,b) - h*h*k*0.25; }
float smax(float a, float b, float k){ float h = max(k-abs(a-b),0.0)/k; return max(a,b) + h*h*k*0.25; }
float sdEli(vec3 p, vec3 r){ float k0 = length(p/r); float k1 = length(p/(r*r)); return k0*(k0-1.0)/k1; }
// Cono redondeado entre dos puntos (Inigo Quilez, «distance functions», MIT)
float sdCono(vec3 p, vec3 a, vec3 b, float r1, float r2){
  vec3 ba = b-a; float l2 = dot(ba,ba); float rr = r1-r2; float a2 = l2-rr*rr; float il2 = 1.0/l2;
  vec3 pa = p-a; float y = dot(pa,ba); float z = y-l2;
  vec3 xv = pa*l2-ba*y; float x2 = dot(xv,xv); float y2 = y*y*l2; float z2 = z*z*l2;
  float k = sign(rr)*rr*rr*x2;
  if (sign(z)*a2*z2 > k) return sqrt(x2+z2)*il2-r2;
  if (sign(y)*a2*y2 < k) return sqrt(x2+y2)*il2-r1;
  return (sqrt(x2*a2*il2)+y*rr)*il2-r1;
}

// La corona: cuatro cúspides y fisuras en cruz que serpentean
float corona(vec3 p){
  float d = sdEli(p-vec3(0.0,0.40,0.0), vec3(0.98,0.50,0.84));
  float c = length(p-vec3( 0.43,0.80, 0.33))-0.37;
  c = min(c, length(p-vec3(-0.42,0.78, 0.34))-0.35);
  c = min(c, length(p-vec3( 0.42,0.82,-0.32))-0.39);
  c = min(c, length(p-vec3(-0.44,0.76,-0.30))-0.34);
  d = smin(d, c, 0.26);
  float g = min(abs(p.x+0.05*sin(p.z*5.0)), abs(p.z-0.03+0.04*sin(p.x*4.0)))-0.022;
  g = max(g, 0.86-p.y);
  return smax(d, -g, 0.12);
}

// El implante: un tornillo con rosca bajo la corona, con su pilar
float implante(vec3 p){
  float r = mix(0.30, 0.2, clamp((-0.35-p.y)/1.6, 0.0, 1.0));
  float rosca = 0.035*sin(p.y*26.0);
  float cuerpo = max(length(p.xz)-(r+rosca), max(p.y+0.35, -1.95-p.y));
  cuerpo = smin(cuerpo, length(p-vec3(0.0,-1.95,0.0))-0.2, 0.12);
  float pilar = max(length(p.xz)-0.34, max(p.y-0.1, -0.38-p.y));
  return min(cuerpo, pilar);
}

// Las otras coronas (BRIEF-4 §4.B): el premolar con dos cúspides, el canino con su punta y el incisivo
// como una pala con el borde recto y la cara palatina cóncava
float coronaPremolar(vec3 p){
  float d = sdEli(p-vec3(0.0,0.42,0.0), vec3(0.66,0.52,0.78));
  float c = length(p-vec3(0.0,0.84, 0.30))-0.36;
  c = min(c, length(p-vec3(0.0,0.76,-0.30))-0.32);
  d = smin(d, c, 0.24);
  float g = abs(p.z-0.02+0.03*sin(p.x*5.0))-0.02;
  g = max(g, 0.9-p.y);
  return smax(d, -g, 0.1);
}
float coronaCanino(vec3 p){
  float d = sdEli(p-vec3(0.0,0.48,0.0), vec3(0.56,0.62,0.6));
  float punta = sdCono(p, vec3(0.0,0.66,0.04), vec3(0.0,1.3,0.08), 0.42, 0.05);
  return smin(d, punta, 0.22);
}
float coronaIncisivo(vec3 p){
  float d = sdEli(p-vec3(0.0,0.62,0.0), vec3(0.62,0.74,0.34));
  d = smax(d, p.y-1.2, 0.08);
  return smax(d, -(length(p-vec3(0.0,0.78,-0.52))-0.36), 0.12);
}
// una sola raíz (premolar, canino, incisivo): larga, que se adelgaza y se curva poco hacia distal
float raizUna(vec3 p, float largo, float ancho){
  vec3 q = p; float t = clamp(-(p.y+0.3), 0.0, 2.6); q.x += 0.05*t*t;
  return sdCono(q, vec3(0.0,-0.24,0.0), vec3(0.0,-0.24-largo,0.03), ancho, 0.06);
}
// el molar de abajo: dos raíces, mesial y distal, curvadas hacia distal
float raicesDos(vec3 p){
  vec3 q = p; float t = clamp(-(p.y+0.3), 0.0, 2.2); q.x += 0.08*t*t;
  float r = sdCono(q, vec3( 0.42,-0.30,0.0), vec3( 0.50,-2.05,0.02), 0.34, 0.07);
  return min(r, sdCono(q, vec3(-0.40,-0.30,0.0), vec3(-0.44,-1.95,0.0), 0.32, 0.07));
}

// Muela superior (primer molar): corona, cuello y tres raíces curvadas hacia distal.
// Cada unidad la transforma (§3.2): implante, corona alzada sobre su muñón o bracket con su arco.
float muela(vec3 p){
  float alza = 0.34*uCorona;
  vec3 pc = p-vec3(0.0,alza,0.0);
  // la corona según el tipo de pieza: los tipos activos se mezclan (solo se calcula lo que pesa).
  // SOLO_MOLAR es el programa rápido (el primer molar superior de siempre): sin ramas por tipo, porque en un
  // rasterizador por software las ramas no se saltan y el cuadro costaba 2.3 veces más (medido, §10)
#ifdef SOLO_MOLAR
  float d = corona(pc);
#else
  float wMolar = uTipo[0]+uTipo[1];
  float d = 0.0;
  if (wMolar > 0.001) d += wMolar*corona(pc);
  if (uTipo[2] > 0.001) d += uTipo[2]*coronaPremolar(pc);
  if (uTipo[3] > 0.001) d += uTipo[3]*coronaCanino(pc);
  if (uTipo[4] > 0.001) d += uTipo[4]*coronaIncisivo(pc);
#endif
  if (uCorona > 0.001){
    // la corona es una funda: hueca por dentro, con la forma del muñón
    float cavidad = sdCono(pc, vec3(0.0,0.02,0.0), vec3(0.0,0.64,0.0), 0.67, 0.47);
    d = mix(d, smax(d, -cavidad, 0.05), uCorona);
  }
  // cuello y raíces
#ifdef SOLO_MOLAR
  float n = sdCono(p, vec3(0.0,0.16,0.0), vec3(0.0,-0.40,0.0), 0.76, 0.56);
  vec3 q = p; float t = clamp(-(p.y+0.3), 0.0, 2.2); q.x += 0.11*t*t; q.z -= 0.03*t*t;
  float r = sdCono(q, vec3( 0.38,-0.32, 0.25), vec3( 0.52,-2.10, 0.36), 0.30, 0.06);
  r = min(r, sdCono(q, vec3(-0.39,-0.32, 0.25), vec3(-0.58,-1.95, 0.33), 0.28, 0.06));
  r = min(r, sdCono(q, vec3( 0.00,-0.32,-0.31), vec3( 0.08,-2.16,-0.62), 0.33, 0.07));
#else
  float cuello1 = wMolar*0.76 + uTipo[2]*0.54 + uTipo[3]*0.5 + uTipo[4]*0.46;
  float cuello2 = wMolar*0.56 + uTipo[2]*0.42 + uTipo[3]*0.4 + uTipo[4]*0.34;
  float n = sdCono(p, vec3(0.0,0.16,0.0), vec3(0.0,-0.40,0.0), cuello1, cuello2);
  float r = 0.0;
  if (uTipo[0] > 0.001){
    vec3 q = p; float t = clamp(-(p.y+0.3), 0.0, 2.2); q.x += 0.11*t*t; q.z -= 0.03*t*t;
    float r3 = sdCono(q, vec3( 0.38,-0.32, 0.25), vec3( 0.52,-2.10, 0.36), 0.30, 0.06);
    r3 = min(r3, sdCono(q, vec3(-0.39,-0.32, 0.25), vec3(-0.58,-1.95, 0.33), 0.28, 0.06));
    r3 = min(r3, sdCono(q, vec3( 0.00,-0.32,-0.31), vec3( 0.08,-2.16,-0.62), 0.33, 0.07));
    r += uTipo[0]*r3;
  }
  if (uTipo[1] > 0.001) r += uTipo[1]*raicesDos(p);
  if (uTipo[2] > 0.001) r += uTipo[2]*raizUna(p, 1.8, 0.36);
  if (uTipo[3] > 0.001) r += uTipo[3]*raizUna(p, 2.25, 0.38);
  if (uTipo[4] > 0.001) r += uTipo[4]*raizUna(p, 1.95, 0.31);
#endif
  float base = smin(n, r, 0.24);
  if (uImplante > 0.001) base = mix(base, implante(p), uImplante);
  if (uCorona > 0.001){
    // el muñón tallado que queda cuando la corona se levanta
    float munon = sdCono(p, vec3(0.0,0.1,0.0), vec3(0.0,0.62,0.0), 0.62, 0.42);
    base = smin(base, mix(1.0, munon, uCorona), 0.08);
  }
  // unida (una sola pieza) o separada (la corona alzada): se interpola, sin saltos
  d = mix(smin(d, base, 0.30), min(d, base), smoothstep(0.0, 0.35, uCorona));
  if (uBrackets > 0.001){
    vec3 b = p-vec3(0.0,0.46,0.9);
    vec3 k = abs(b)-vec3(0.17,0.13,0.06)*uBrackets;
    float bracket = length(max(k,0.0))+min(max(k.x,max(k.y,k.z)),0.0)-0.025;
    float arco = length(vec2(p.y-0.46, p.z-0.97))-0.021*uBrackets;
    arco = max(arco, abs(p.x)-1.1*uBrackets);
    d = min(d, min(bracket, arco));
  }
  return d;
}

float mapa(vec3 w){ return muela(transpose(uRot)*w); }

// ── Zonas clínicas ─────────────────────────────────────────────────────
// las raíces se curvan hacia distal: el mismo doblez que en muela()
vec3 doblez(vec3 p){ float t = clamp(-(p.y+0.3), 0.0, 2.2); return p + vec3(0.11*t*t, 0.0, -0.03*t*t); }
float mascara(int i, vec3 pl, vec3 nl){
  vec3 pc = pl - vec3(0.0, 0.34*uCorona, 0.0);
  // la geometría de cada tipo: punto de contacto, cara vestibular, altura de la cara que muerde y del tercio medio
  float wM = uTipo[0]+uTipo[1];
  float cx = wM*0.93 + uTipo[2]*0.64 + uTipo[3]*0.54 + uTipo[4]*0.6;
  float cz = wM*0.86 + uTipo[2]*0.78 + uTipo[3]*0.6 + uTipo[4]*0.34;
  float ty = wM*0.66 + uTipo[2]*0.7 + uTipo[3]*0.98 + uTipo[4]*1.0;
  float my = wM*0.52 + uTipo[2]*0.55 + uTipo[3]*0.62 + uTipo[4]*0.72;
  float cor = smoothstep(0.05, 0.28, pc.y);
  // oclusal (o el borde incisal): fosas y fisuras al centro de la cara que muerde, no las cúspides
  if (i == 0) return smoothstep(ty, ty+0.22, pc.y)*(1.0-smoothstep(0.26, 0.6, length(pc.xz*vec2(0.93/cx, 1.15*0.86/cz))))*smoothstep(-0.1, 0.5, nl.y);
  // mesial y distal: el punto de contacto con la pieza vecina (ahí empiezan las caries interproximales)
  if (i == 1) return cor*(1.0-smoothstep(0.10, 0.46, length((pc-vec3( cx,my,0.04))*vec3(1.0,0.85,0.8))));
  if (i == 2) return cor*(1.0-smoothstep(0.10, 0.46, length((pc-vec3(-cx,my-0.02,0.02))*vec3(1.0,0.85,0.8))));
  // vestibular y palatina: el tercio medio de la cara
  if (i == 3) return cor*(1.0-smoothstep(0.14, 0.52, length((pc-vec3(0.05,my, cz))*vec3(0.8,1.0,1.0))));
  if (i == 4) return cor*(1.0-smoothstep(0.14, 0.52, length((pc-vec3(0.00,my-0.02,-cz*0.97))*vec3(0.8,1.0,1.0))));
  if (i == 5) return exp(-pow((pl.y+0.10)/0.14, 2.0));
  if (i == 6) return 1.0-smoothstep(-0.60, -0.32, pl.y);
  // periapical: alrededor de la punta de cada raíz (las da el programa según el tipo de pieza)
  float d = 1e3;
  for (int j = 0; j < 3; j++) if (float(j) < uPuntas) d = min(d, length(pl-uPunta[j]));
  return 1.0-smoothstep(0.16, 0.50, d);
}
float sdSeg(vec3 p, vec3 a, vec3 b){ vec3 pa = p-a, ba = b-a; float h = clamp(dot(pa,ba)/dot(ba,ba), 0.0, 1.0); return length(pa-ba*h); }
// el conducto: la cámara pulpar y un conducto por raíz, según el tipo de pieza
float conducto(vec3 pl){
  float d = 0.0;
  float cam = length((pl-vec3(0.0,0.20,0.0))/vec3(1.0,0.5,0.85))-0.2;
  if (uTipo[0] > 0.001){
    vec3 q = doblez(pl);
    float c = sdSeg(q, vec3( 0.28,-0.18, 0.19), vec3( 0.50,-1.95, 0.35));
    c = min(c, sdSeg(q, vec3(-0.28,-0.18, 0.19), vec3(-0.55,-1.82, 0.32)));
    c = min(c, sdSeg(q, vec3( 0.00,-0.18,-0.21), vec3( 0.07,-2.00,-0.58)));
    d += uTipo[0]*c;
  }
  if (uTipo[1] > 0.001){
    vec3 q = pl; float t = clamp(-(pl.y+0.3), 0.0, 2.2); q.x += 0.08*t*t;
    d += uTipo[1]*min(sdSeg(q, vec3(0.3,-0.18,0.0), vec3(0.49,-1.9,0.02)), sdSeg(q, vec3(-0.3,-0.18,0.0), vec3(-0.43,-1.8,0.0)));
  }
  float wU = uTipo[2]+uTipo[3]+uTipo[4];
  if (wU > 0.001){
    vec3 q = pl; float t = clamp(-(pl.y+0.3), 0.0, 2.6); q.x += 0.05*t*t;
    float largo = (uTipo[2]*1.8 + uTipo[3]*2.25 + uTipo[4]*1.95)/wU;
    d += wU*sdSeg(q, vec3(0.0,-0.1,0.0), vec3(0.0,-0.1-largo*0.93,0.03));
  }
  return min(d, cam);
}

vec3 normal(vec3 p, float e){
  vec2 k = vec2(1.0,-1.0);
  return normalize(k.xyy*mapa(p+k.xyy*e) + k.yyx*mapa(p+k.yyx*e) + k.yxy*mapa(p+k.yxy*e) + k.xxx*mapa(p+k.xxx*e));
}

float oclusion(vec3 p, vec3 n){
  float o = 0.0, s = 1.0;
  for (int i = 0; i < 5; i++){ float h = 0.02+0.13*float(i); o += (h-mapa(p+n*h))*s; s *= 0.72; }
  return clamp(1.0-1.6*o, 0.0, 1.0);
}

void main(){
  vec2 uv = (vUv*2.0-1.0)*vec2(uRes.x/uRes.y, 1.0);
  vec3 f = normalize(uMira-uCam);
  vec3 r = normalize(cross(f, vec3(0.0,1.0,0.0)));
  vec3 u = cross(r, f);
  vec3 rd = normalize(uv.x*r + uv.y*u + uFoco*f);
  vec3 ro = uCam;
  // esfera que envuelve la muela
  vec3 cE = vec3(0.0,-0.4,0.0); float rE = 2.3;
  vec3 oc = ro-cE; float b = dot(oc,rd); float c = dot(oc,oc)-rE*rE; float h = b*b-c;
  if (h < 0.0){ frag = vec4(0.0); return; }
  float t = max(-b-sqrt(h), 0.0), tMax = -b+sqrt(h);
  bool toca = false;
  for (int i = 0; i < 96; i++){
    float d = mapa(ro+rd*t);
    if (d < 0.0012*t){ toca = true; break; }
    t += d*0.82;
    if (t > tMax) break;
  }
  if (!toca){
#ifndef SIN_COLOR
    // lesión periapical: un halo suave en el hueso, alrededor de cada ápice
    if (uHayColor > 0.5 && uZona[7].a > 0.002){
      float halo = 0.0;
      for (int j = 0; j < 3; j++){
        if (float(j) >= uPuntas) break;
        vec3 v = uRot*uPunta[j]-ro; float tp = dot(v, rd);
        if (tp > 0.0){ vec3 dv = v-rd*tp; halo += exp(-dot(dv,dv)/0.05); }
      }
      float a = clamp(halo, 0.0, 1.0)*0.5*uZona[7].a*mix(1.0, 0.55+0.45*uPulso, uTrama[7]);
      frag = vec4(uZona[7].rgb*a, a); return;
    }
#endif
    frag = vec4(0.0); return;
  }
  vec3 p = ro+rd*t;
  vec3 pl = transpose(uRot)*p;                       // punto en el espacio de la muela
  float bajo = clamp((0.25-pl.y)/2.2, 0.0, 1.0);      // 0 en la corona, 1 en las puntas
  vec3 n = normal(p, 0.0016 + 0.03*bajo);             // más abajo, normales más suaves (esmerilado)
  float ao = oclusion(p, n);
  vec3 luz = normalize(vec3(-0.78,0.62,0.42));
  float dif = clamp(dot(n,luz)*0.62+0.38, 0.0, 1.0); dif = dif*dif*(3.0-2.0*dif);
  float cielo = 0.5+0.5*n.y;
  float relleno = clamp(dot(n, normalize(vec3(0.8,0.1,0.5)))*0.5+0.5, 0.0, 1.0);
  float borde = pow(1.0-clamp(dot(n,-rd),0.0,1.0), 2.6);
  float contraluz = borde*smoothstep(-0.2, 0.7, dot(n, normalize(vec3(0.9,0.2,-0.3))));
  float alb = 0.78;
  // el implante y el bracket son de metal: más oscuros y con un brillo angosto
  float metal = 0.0;
  if (uImplante > 0.001 && pl.y < -0.36) metal = uImplante;
  if (uBrackets > 0.001 && abs(pl.z-0.93) < 0.12 && abs(pl.y-0.46) < 0.2) metal = max(metal, uBrackets);
  alb = mix(alb, 0.5, metal);
  float col = alb*(0.9*dif + 0.2*relleno) + 0.2*cielo*ao;
  col *= 0.64+0.36*ao;
  col += 0.22*contraluz*ao;
  col += metal*0.35*pow(clamp(dot(reflect(rd,n), luz),0.0,1.0), 18.0);
  // Imagen Dental: cortes horizontales y un plano de escaneo que baja
  if (uEscaneo > 0.001){
    float corte = 1.0-smoothstep(0.0, 0.035, abs(fract(pl.y*6.5)-0.5)-0.44);
    float plano = exp(-pow((pl.y-(1.25-fract(uTiempo*0.11)*3.6))*5.0, 2.0));
    col = mix(col, col*0.62, corte*0.75*uEscaneo);
    col += plano*0.3*uEscaneo;
  }
  vec3 tono = vec3(col);
  // colores clínicos: un tinte dentro de la porcelana, en su zona, que respeta la luz y la niebla;
  // lo sugerido por la IA va en trama diagonal y late, nunca como relleno
  float tenido = 0.0;
#ifndef SIN_COLOR
  if (uHayColor > 0.5){
    vec3 nl = transpose(uRot)*n;
    float rayas = smoothstep(0.30, 0.55, abs(fract((pl.x+1.3*pl.y+0.6*pl.z)*7.0)-0.5)*2.0);
    float latido = 0.72+0.28*uPulso;
    for (int i = 0; i < 8; i++){
      if (uZona[i].a < 0.002) continue;
      float m = mascara(i, pl, nl)*uZona[i].a;
      m *= mix(1.0, (0.18+0.82*rayas)*latido, uTrama[i]);
      // el tinte multiplica (respeta la luz y la sombra de la porcelana) y brilla un poco por dentro en la sombra
      vec3 tinte = tono*mix(vec3(1.0), uZona[i].rgb*1.5, 0.68) + uZona[i].rgb*0.09*(1.0-0.5*dif);
      tono = mix(tono, tinte, clamp(m, 0.0, 1.0)*0.92);
      if (i >= 5) tenido = max(tenido, m);
    }
    // la endodoncia: se ve el conducto dentro de la raíz, a través del vidrio
    if (uConducto.a > 0.002){
      float g = 0.0;
      for (int k = 1; k <= 14; k++){
        float dc = conducto(transpose(uRot)*(p+rd*(0.045*float(k))));
        g += exp(-dc*dc/0.0016);
      }
      g = clamp(g*0.2, 0.0, 1.0)*uConducto.a*mix(1.0, (0.2+0.8*rayas)*latido, uConductoTrama);
      tono = mix(tono, uConducto.rgb*0.92 + tono*0.14, g*0.92);
      tenido = max(tenido, g);
    }
  }
#endif
  // niebla horneada: aclara y disuelve hacia las raíces (lo teñido se disuelve menos)
  float nivel = uNivel;
  float claro = smoothstep(nivel+0.55, nivel-1.3, pl.y)*(1.0-0.55*tenido);
  float alfa = 1.0-smoothstep(nivel-0.15, nivel-1.55, pl.y);
  alfa = mix(alfa, max(alfa, 0.8), tenido);
  tono = mix(tono, vec3(0.965), claro*0.92);
  alfa *= 1.0-uNiebla;
  tono = mix(tono, vec3(0.965), uNiebla);
  // Especialidades: por mapear, casi transparente
  alfa *= 1.0-0.68*uFantasma;
  tono = mix(tono, vec3(0.9), 0.5*uFantasma);
  frag = vec4(tono*alfa, alfa);
}`;

/** Pasadas 2 y 3: desenfoque gaussiano cuyo radio crece hacia abajo (y el grano, al final) */
const FRAG_DESENFOQUE = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uTex;
uniform vec2 uPaso;    // (1/ancho, 0) o (0, 1/alto)
uniform float uRadio;  // radio máximo en píxeles
uniform float uArriba; // hasta dónde (0–1, desde arriba) no hay desenfoque
uniform float uGrano;  // 0 en la primera pasada
float azar(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
void main(){
  float y = 1.0-vUv.y;
  float r = 1.3 + uRadio*smoothstep(uArriba, 1.0, y);
  vec4 s = vec4(0.0); float w = 0.0;
  for (int i = -7; i <= 7; i++){
    float x = float(i)/7.0;
    float k = exp(-3.2*x*x);
    s += texture(uTex, vUv + uPaso*x*r)*k; w += k;
  }
  s /= w;
  if (uGrano > 0.0){ float g = (azar(gl_FragCoord.xy)-0.5)*uGrano; s.rgb += g*s.a; }
  frag = s;
}`;

export interface Camara {
  cam: [number, number, number];
  mira: [number, number, number];
  foco: number;
}

export interface EstadoMuela {
  /** giro alrededor del eje vertical, en radianes */
  guinada: number;
  /** inclinación hacia la cámara, en radianes */
  cabeceo: number;
  /** 0 = niebla normal; 1 = todo niebla */
  niebla: number;
  /** altura (espacio de la muela) donde empieza a disolverse */
  nivel: number;
  /** tiempo del bucle (para el escaneo) */
  tiempo: number;
  forma: { implante: number; corona: number; brackets: number; escaneo: number; fantasma: number };
  /** los colores clínicos por zona (BRIEF-4 §3); sin ellos, la muela queda en escala de grises */
  clinica?: ClinicaMuela;
  /** el tipo de pieza: 5 pesos (molar superior, molar inferior, premolar, canino, incisivo) y sus puntas */
  tipo?: Float32Array;
  puntas?: Float32Array;
  nPuntas?: number;
}

/** 8 zonas × (r, g, b, fuerza), la trama de cada zona (1 = sugerido), el conducto y su trama, el pulso */
export interface ClinicaMuela {
  zonas: Float32Array;
  tramas: Float32Array;
  conducto: Float32Array;
  conductoTrama: number;
  pulso: number;
}

export function matrizGiro(guinada: number, cabeceo: number): number[] {
  // R = Rx(cabeceo) · Ry(guiñada), en columnas (como la espera GLSL)
  const cy = Math.cos(guinada), sy = Math.sin(guinada);
  const cx = Math.cos(cabeceo), sx = Math.sin(cabeceo);
  // Ry = [cy 0 sy; 0 1 0; -sy 0 cy]; Rx = [1 0 0; 0 cx -sx; 0 sx cx]
  const m = [
    [cy, 0, sy],
    [sx * sy, cx, -sx * cy],
    [-cx * sy, sx, cx * cy],
  ];
  // columnas
  return [m[0][0], m[1][0], m[2][0], m[0][1], m[1][1], m[2][1], m[0][2], m[1][2], m[2][2]];
}

/** Proyecta un punto de la muela (espacio del modelo) a la pantalla del lienzo (0–1, desde arriba a la izquierda) */
export function proyectar(p: [number, number, number], e: EstadoMuela, c: Camara, aspecto: number) {
  const m = matrizGiro(e.guinada, e.cabeceo);
  const w = [
    m[0] * p[0] + m[3] * p[1] + m[6] * p[2],
    m[1] * p[0] + m[4] * p[1] + m[7] * p[2],
    m[2] * p[0] + m[5] * p[1] + m[8] * p[2],
  ];
  const f = norm(sub(c.mira, c.cam));
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  const v = sub(w, c.cam);
  const z = dot(v, f);
  const x = (dot(v, r) / z) * c.foco;
  const y = (dot(v, u) / z) * c.foco;
  return { x: (x / aspecto + 1) / 2, y: 1 - (y + 1) / 2, z };
}
const sub = (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: number[]) => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / l, a[1] / l, a[2] / l];
};

export class Muela {
  private gl: WebGL2RenderingContext;
  /** el programa completo (tipos de pieza y colores clínicos) y el rápido (el molar de siempre, sin color) */
  private progMuela: WebGLProgram;
  private progRapido: WebGLProgram;
  private progDes: WebGLProgram;
  private tex: WebGLTexture[] = [];
  private fbo: WebGLFramebuffer[] = [];
  private ancho = 0;
  private alto = 0;
  camara: Camara = { cam: [0, 0.4, 6.6], mira: [0, -0.62, 0], foco: 2.25 };

  static crear(lienzo: HTMLCanvasElement): Muela | null {
    const gl = lienzo.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: false });
    if (!gl) return null;
    try {
      return new Muela(gl);
    } catch (e) {
      console.warn("La muela no pudo compilar sus sombreadores:", e);
      return null;
    }
  }

  private constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.progMuela = programa(gl, VERT, FRAG_MUELA);
    this.progRapido = programa(gl, VERT, FRAG_MUELA.replace("#version 300 es\n", "#version 300 es\n#define SOLO_MOLAR 1\n#define SIN_COLOR 1\n"));
    this.progDes = programa(gl, VERT, FRAG_DESENFOQUE);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    for (const prog of [this.progMuela, this.progRapido, this.progDes]) {
      const loc = gl.getAttribLocation(prog, "p");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }
  }

  /** Ajusta los búferes al tamaño del lienzo (en píxeles del dispositivo, ya escalados) */
  medir(ancho: number, alto: number) {
    if (ancho === this.ancho && alto === this.alto) return;
    const gl = this.gl;
    this.ancho = ancho;
    this.alto = alto;
    gl.canvas.width = ancho;
    gl.canvas.height = alto;
    this.tex.forEach((t) => gl.deleteTexture(t));
    this.fbo.forEach((f) => gl.deleteFramebuffer(f));
    this.tex = [];
    this.fbo = [];
    for (let i = 0; i < 2; i++) {
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, ancho, alto, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const f = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      this.tex.push(t);
      this.fbo.push(f);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  dibujar(e: EstadoMuela, escala: number) {
    const gl = this.gl;
    if (!this.ancho) return;
    gl.viewport(0, 0, this.ancho, this.alto);
    gl.disable(gl.BLEND);
    // 1. la muela
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo[0]);
    const cl = e.clinica;
    const hay = !!cl && (cl.conducto[3] > 0.002 || cl.zonas.some((v, i) => i % 4 === 3 && v > 0.002));
    // el molar superior sin colores (casi siempre) va por el programa rápido; lo demás, por el completo
    const prog = !hay && (!e.tipo || e.tipo[0] > 0.999) ? this.progRapido : this.progMuela;
    gl.useProgram(prog);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    gl.uniform2f(u("uRes"), this.ancho, this.alto);
    gl.uniformMatrix3fv(u("uRot"), false, matrizGiro(e.guinada, e.cabeceo));
    gl.uniform3fv(u("uCam"), this.camara.cam);
    gl.uniform3fv(u("uMira"), this.camara.mira);
    gl.uniform1f(u("uFoco"), this.camara.foco);
    gl.uniform1f(u("uNiebla"), e.niebla);
    gl.uniform1f(u("uNivel"), e.nivel);
    gl.uniform1f(u("uTiempo"), e.tiempo);
    gl.uniform1f(u("uImplante"), e.forma.implante);
    gl.uniform1f(u("uCorona"), e.forma.corona);
    gl.uniform1f(u("uBrackets"), e.forma.brackets);
    gl.uniform1f(u("uEscaneo"), e.forma.escaneo);
    gl.uniform1f(u("uFantasma"), e.forma.fantasma);
    gl.uniform1fv(u("uTipo"), e.tipo ?? new Float32Array([1, 0, 0, 0, 0]));
    gl.uniform3fv(u("uPunta"), e.puntas ?? new Float32Array([0.164, -2.1, 0.457, -0.88, -1.95, 0.412, -0.301, -2.16, -0.516]));
    gl.uniform1f(u("uPuntas"), e.nPuntas ?? 3);
    gl.uniform1f(u("uHayColor"), hay ? 1 : 0);
    if (hay && cl) {
      gl.uniform4fv(u("uZona"), cl.zonas);
      gl.uniform1fv(u("uTrama"), cl.tramas);
      gl.uniform4fv(u("uConducto"), cl.conducto);
      gl.uniform1f(u("uConductoTrama"), cl.conductoTrama);
      gl.uniform1f(u("uPulso"), cl.pulso);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // 2. desenfoque horizontal
    gl.useProgram(this.progDes);
    const d = (n: string) => gl.getUniformLocation(this.progDes, n);
    const radio = 30 * escala;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo[1]);
    gl.bindTexture(gl.TEXTURE_2D, this.tex[0]);
    gl.uniform1i(d("uTex"), 0);
    gl.uniform2f(d("uPaso"), 1 / this.ancho, 0);
    gl.uniform1f(d("uRadio"), radio);
    gl.uniform1f(d("uArriba"), 0.3);
    gl.uniform1f(d("uGrano"), 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // 3. desenfoque vertical y grano, a la pantalla
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, this.tex[1]);
    gl.uniform2f(d("uPaso"), 0, 1 / this.alto);
    gl.uniform1f(d("uGrano"), 0.018);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destruir() {
    const gl = this.gl;
    this.tex.forEach((t) => gl.deleteTexture(t));
    this.fbo.forEach((f) => gl.deleteFramebuffer(f));
    gl.deleteProgram(this.progMuela);
    gl.deleteProgram(this.progRapido);
    gl.deleteProgram(this.progDes);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}

function programa(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
  const p = gl.createProgram()!;
  for (const [tipo, src] of [
    [gl.VERTEX_SHADER, vs],
    [gl.FRAGMENT_SHADER, fs],
  ] as const) {
    const s = gl.createShader(tipo)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "sombreador");
    gl.attachShader(p, s);
  }
  gl.bindAttribLocation(p, 0, "p");
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "programa");
  return p;
}
