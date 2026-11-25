# Arma la tira de 6 cuadros del buzón con los cuadros sueltos de capturar-tanda3.mjs y borra los sueltos.
#   python3 dibujo/armar-tira.py
import os, shutil
from PIL import Image
aqui = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'capturas', 'tanda-3')
tira = os.path.join(aqui, 'tira')
cuadros = [l.split() for l in open(os.path.join(tira, 'tiempos.txt')) if l.strip()]
# s desde que despertó: entrada, sobre en la orilla, la pata empuja, cae girando, entra, la banderita sube
metas = [1.9, 2.5, 2.72, 2.95, 3.3, 4.4]
elegidos = [min(cuadros, key=lambda c: abs(int(c[1]) / 1000 - m)) for m in metas]
ims = [Image.open(os.path.join(tira, f'b-{c[0]}.png')).convert('RGB') for c in elegidos]
w, h = ims[0].size
k = 0.5
W, H = int(w * k), int(h * k)
o = Image.new('RGB', (W * 3 + 20, H * 2 + 10), (11, 18, 32))
for i, im in enumerate(ims):
    o.paste(im.resize((W, H), Image.LANCZOS), ((i % 3) * (W + 10), (i // 3) * (H + 10)))
o.save(os.path.join(aqui, 'buzon-tira-1440.png'))
shutil.rmtree(tira)
print('buzon-tira-1440.png con', [c[1] for c in elegidos])
