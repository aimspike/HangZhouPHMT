"""Derive mobile lightmaps and low-frequency furnishing irradiance from the existing bake.

This is a neutral-reflectance approximation, not a Cycles bake. Architecture and
the original R/G/B lightmaps remain unchanged. Run after architectural rebaking.
"""
import base64
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
source_bytes = (ROOT / 'baked-lighting.json').read_text(encoding='utf-8').encode()
geometry_bytes = (ROOT / 'bake-source.json').read_text(encoding='utf-8').encode()
source = json.loads(source_bytes)
geometry = json.loads(geometry_bytes)
maps = {m['id']: m for m in source['maps']}
images = {}
mobile = {}
texels = [0, 0]
for item in source['maps']:
    mobile[str(item['id'])] = {}
    images[item['id']] = []
    for key, scale in [('image', .5), ('sunImage', .75), ('sunBounceImage', 1)]:
        image = Image.open(BytesIO(base64.b64decode(item[key].split(',')[1]))).convert('RGB')
        images[item['id']].append(np.asarray(image, dtype=np.float32)[::-1] / 255)
        texels[0] += image.width * image.height
        size = tuple(max(1, round(s * scale)) for s in image.size)
        texels[1] += size[0] * size[1]
        if size != image.size:
            image = image.resize(size, Image.Resampling.LANCZOS)
            stream = BytesIO()
            image.save(stream, format='PNG', optimize=True)
            mobile[str(item['id'])][key] = 'data:image/png;base64,' + base64.b64encode(stream.getvalue()).decode()

# Each rectangular face retains its original bake atlas. A single ceiling plane
# uses the same world-space mapping as the roof underside in the viewer.
faces = []
for mesh in geometry['meshes']:
    if mesh['glass'] or mesh['id'] not in maps:
        continue
    if mesh['roof']:
        faces.append((mesh['id'], 0, np.array([-.18, 2.8, -.18]), np.array([6.56, 0, 0]), np.array([0, 0, 12.16]), np.array([0, -1, 0])))
        continue
    vertices = np.array(mesh['positions']).reshape(-1, 3) + mesh['position']
    normals = np.array(mesh['normals']).reshape(-1, 3)
    for face in range(6):
        a, b, c, d = vertices[face * 4:face * 4 + 4]
        faces.append((mesh['id'], face, c, d - c, a - c, normals[face * 4]))

count = 192
i = np.arange(count)
y = 1 - 2 * (i + .5) / count
angle = i * np.pi * (3 - np.sqrt(5))
directions = np.stack([np.cos(angle) * np.sqrt(1 - y*y), y, np.sin(angle) * np.sqrt(1-y*y)], axis=1)
axes = np.array([[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]])
cosines = np.maximum(axes @ directions.T, 0) * (4 / count)

def irradiance(point):
    nearest = np.full(count, 1e5)
    hit = np.full(count, -1)
    coords = np.zeros((count, 2))
    for index, (_, _, c, u, v, n) in enumerate(faces):
        denominator = directions @ n
        valid = denominator < -1e-7  # front-facing receiving surface
        distance = np.divide((c-point) @ n, denominator, out=np.full(count, 1e6), where=valid)
        q = point + directions * distance[:, None] - c
        uu, vv = q @ u / (u @ u), q @ v / (v @ v)
        accept = valid & (distance > .008) & (distance < nearest) & (uu >= 0) & (uu <= 1) & (vv >= 0) & (vv <= 1)
        nearest[accept], hit[accept] = distance[accept], index
        coords[accept] = np.stack([uu[accept], vv[accept]], axis=1)
    light = np.zeros((count, 5))
    light[hit < 0, 0] = np.maximum(.1, .35 + directions[hit < 0, 1] * .25)
    for face_id in np.unique(hit[hit >= 0]):
        mesh_id, face, c, u, v, n = faces[face_id]
        ids = np.flatnonzero(hit == face_id)
        uv = coords[ids]
        item = maps[mesh_id]
        if not item['roof']:
            x, yy, w, h = item['rects'][face]
            uv = np.stack([(x + .5 + uv[:, 0] * (w-1)) / item['width'], (yy + .5 + uv[:, 1] * (h-1)) / item['height']], axis=1)
        samples = []
        for image in images[mesh_id]:
            h, w, _ = image.shape
            samples.append(image[np.clip((uv[:, 1]*h).astype(int), 0, h-1), np.clip((uv[:, 0]*w).astype(int), 0, w-1)])
        baked, sun, bounce = samples
        # Outgoing radiance uses fixed neutral reflectance. Surface editing does
        # not recompute colored interreflection; the report states this limit.
        albedo = .3 if n[1] > .5 else .72 if n[1] < -.5 else .58
        light[ids, 0] = baked[:, 0]**2 * albedo
        light[ids, 1] = (baked[:, 1]*2 + baked[:, 2]) * albedo
        light[ids, 2:] = (sun + 1.5*bounce**2) * albedo
    return np.round(cosines @ light, 5).tolist()

rooms = {}
for room in geometry['rooms']:
    if room['id'].startswith('equipment') or room['id'] == 'balcony':
        continue
    # Eight interior corners permit interpolation without crossing room walls.
    margin = min(.35, room['w'] * .2, room['d'] * .2)
    bounds = [[room['x']+margin, .35, room['z']+margin], [room['x']+room['w']-margin, 2.4, room['z']+room['d']-margin]]
    probes = [irradiance(np.array([bounds[x][0], bounds[y][1], bounds[z][2]])) for z in range(2) for y in range(2) for x in range(2)]
    rooms[room['id']] = {'bounds': bounds, 'probes': probes}

metadata = {'bakeSha256': sha256(source_bytes).hexdigest(), 'geometrySha256': sha256(geometry_bytes).hexdigest()}
(ROOT/'quality-assets.json').write_text(json.dumps({**metadata, 'mobile': mobile, 'rooms': rooms, 'raysPerProbe': count, 'texels': {'desktop': texels[0], 'mobile': texels[1]}}, separators=(',', ':'))+'\n', encoding='utf-8')
print(json.dumps({'rooms': len(rooms), 'probes': len(rooms)*8, 'raysPerProbe': count, 'rgba8MiB': {'desktop': texels[0]*4/2**20, 'mobile': texels[1]*4/2**20}}, indent=2))
