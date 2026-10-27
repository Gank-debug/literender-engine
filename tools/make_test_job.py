#!/usr/bin/env python3
"""Writes a tiny LiteRender Photo job (pure Python, no numpy) for smoke tests:
a ground plane, a box placed 3 times (one mirrored), a sun, a sky gradient, a camera.
usage: make_test_job.py <dir>"""
import json, math, os, struct, sys

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
buf = bytearray()

def put(fmt, values):
    while len(buf) % 4:
        buf.append(0)
    off = len(buf)
    buf.extend(struct.pack('<%d%s' % (len(values), fmt), *values))
    return [off, len(values)]

plane = [-10, -10, 0, 10, -10, 0, 10, 10, 0, -10, 10, 0]
pidx = [0, 1, 2, 0, 2, 3]
pn = [0, 0, 1] * 4
faces = [((0, 0, 1), [(0, 0, 1), (1, 0, 1), (1, 1, 1), (0, 1, 1)]), ((0, 0, -1), [(0, 0, 0), (0, 1, 0), (1, 1, 0), (1, 0, 0)]),
         ((1, 0, 0), [(1, 0, 0), (1, 1, 0), (1, 1, 1), (1, 0, 1)]), ((-1, 0, 0), [(0, 0, 0), (0, 0, 1), (0, 1, 1), (0, 1, 0)]),
         ((0, 1, 0), [(0, 1, 0), (0, 1, 1), (1, 1, 1), (1, 1, 0)]), ((0, -1, 0), [(0, 0, 0), (1, 0, 0), (1, 0, 1), (0, 0, 1)])]
v, idx, n, uv = [], [], [], []
for nn, q in faces:
    b = len(v) // 3
    for x, y, z in q:
        v += [x - .5, y - .5, z]
        n += list(nn)
    uv += [0, 0, 1, 0, 1, 1, 0, 1]
    idx += [b, b + 1, b + 2, b, b + 2, b + 3]
def col_major(m):  # m: rows
    return [m[r][c] for c in range(4) for r in range(4)]
I = col_major([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]])
mats = []
for x, mirror in ((-3, False), (0, True), (3, False)):
    s = 2.0
    mats += col_major([[-s if mirror else s, 0, 0, x], [0, s, 0, 0], [0, 0, s, 0], [0, 0, 0, 1]])
W, H = 64, 32
sky = []
for y in range(H):
    t = y / (H - 1)
    for x in range(W):
        sky += [0.25 + 0.4 * t, 0.35 + 0.45 * t, 0.55 + 0.4 * t, 1.0]
a = math.radians(80)
cam = [[1, 0, 0, 0], [0, math.cos(a), -math.sin(a), -12], [0, math.sin(a), math.cos(a), 2.5], [0, 0, 0, 1]]
J = {
    'output': {'width': 160, 'height': 100, 'samples': 16},
    'device': 'cpu',
    'materials': [
        {'id': 'g', 'name': 'ground', 'color': [0.35, 0.33, 0.3], 'roughness': 0.9},
        {'id': 'b', 'name': 'box', 'color': [0.8, 0.25, 0.1], 'roughness': 0.4, 'sheen': 0.5, 'oneSided': True},
        {'id': 'w', 'name': 'glass', 'color': [0.6, 0.7, 0.7], 'roughness': 0.02, 'glass': {'tint': [0.95, 0.97, 0.97], 'rough': 0.0}},
    ],
    'meshes': [
        {'name': 'plane', 'pos': put('f', plane), 'idx': put('I', pidx), 'nrm': put('f', pn), 'material': 'g', 'instances': put('f', I)},
        {'name': 'box', 'pos': put('f', v), 'idx': put('I', idx), 'nrm': put('f', n), 'uv': put('f', uv), 'material': 'b', 'instances': put('f', mats)},
        {'name': 'pane', 'pos': put('f', [-1, -3, 0, 1, -3, 0, 1, -3, 2, -1, -3, 2]), 'idx': put('I', [0, 1, 2, 0, 2, 3]), 'material': 'w', 'instances': put('f', I)},
    ],
    'sun': {'dir': [0.4, -0.5, 0.75], 'color': [1, 0.95, 0.9], 'strength': 4, 'angle': 0.02},
    'world': {'background': {'raw': put('f', sky), 'w': W, 'h': H}, 'backgroundStrength': 1, 'lightStrength': 0.3, 'rotation': math.pi},
    'camera': {'matrix': col_major(cam), 'sensorHeight': 24, 'lens': 30},
}
open(os.path.join(out, 'scene.bin'), 'wb').write(buf)
json.dump(J, open(os.path.join(out, 'job.json'), 'w'))
print('wrote', out)
