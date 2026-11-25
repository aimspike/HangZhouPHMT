"""Check assembled shipped LODs. Run with Blender --background --python this_file.
BVH surface intersections and inside-solid tests prove contact; sampled nearest
surface distances are upper bounds, with 0.7 mm export/assembly tolerance.
Separate wall-mounted mirror and upper cabinet may use the architectural wall.
"""
import json,base64,math,os
from pathlib import Path
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[1]
source=Path(os.environ.get('MODEL_FILE',str(ROOT/'assets/rebuild/models.json')))
models=json.loads(source.read_text())
def inside(bvh,point):
    direction=Vector((.924,.341,.171)).normalized();origin=point.copy();hits=0
    for _ in range(120):
        p,_,_,_=bvh.ray_cast(origin,direction,10)
        if p is None:break
        hits+=1;origin=p+direction*1e-7
    return hits%2==1
report={'scope':__doc__,'modelSHA':models['authoringScriptSha256'],'toleranceMm':.7,'models':{},'result':'passed'}
for name,lods in models['models'].items():
    report['models'][name]={}
    for lod,entries in lods.items():
        parts=[]
        for entry in entries:
            q=np.frombuffer(base64.b64decode(entry['position']),dtype='<u2').reshape(-1,3)
            points=np.array(entry['min'])+q/65535*np.array(entry['size'])
            ids=np.frombuffer(base64.b64decode(entry['index']),dtype='<u2')
            for part in entry['parts']:
                tris=ids[part['start']:part['start']+part['count']].reshape(-1,3)
                selected=points[np.unique(tris)];vertices=[Vector(p) for p in selected]
                samples=vertices[::max(1,len(vertices)//240)]
                centres=points[tris].mean(axis=1);samples += [Vector(p) for p in centres[::max(1,len(centres)//120)]]
                parts.append({'name':part['name'],'bvh':BVHTree.FromPolygons([Vector(p) for p in points],tris,all_triangles=True),'samples':samples,'min':selected.min(axis=0),'max':selected.max(axis=0)})
        parent=list(range(len(parts)));nearest=[(1e9,None) for p in parts];contacts=[]
        def find(i):
            while parent[i]!=i:i=parent[i]
            return i
        for i,a in enumerate(parts):
            for j,b in enumerate(parts[i+1:],i+1):
                gap=math.sqrt(sum(max(a['min'][k]-b['max'][k],b['min'][k]-a['max'][k],0)**2 for k in range(3)))
                if gap>.16 or (gap>nearest[i][0] and gap>nearest[j][0]):continue
                if a['bvh'].overlap(b['bvh']) or (gap<1e-7 and (inside(a['bvh'],b['samples'][0]) or inside(b['bvh'],a['samples'][0]))):distance=0
                else:distance=min([b['bvh'].find_nearest(p)[3] for p in a['samples']]+[a['bvh'].find_nearest(p)[3] for p in b['samples']])
                if distance<nearest[i][0]:nearest[i]=(distance,b['name'])
                if distance<nearest[j][0]:nearest[j]=(distance,a['name'])
                if distance<.0007:parent[find(i)]=find(j);contacts.append([a['name'],b['name'],round(distance*1000,4)])
        components={}
        for i,p in enumerate(parts):components.setdefault(find(i),[]).append(p['name'])
        separated=[{'name':p['name'],'nearest':nearest[i][1],'gapMm':round(nearest[i][0]*1000,3)} for i,p in enumerate(parts) if nearest[i][0]>.0007]
        result={'parts':len(parts),'components':list(components.values()),'separated':separated,'contacts':contacts}
        report['models'][name][lod]=result
        if separated or len(components)!=1:report['result']='failed'
out=ROOT/os.environ.get('ASSEMBLY_REPORT','validation/furniture-assembly.json');out.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'result':report['result'],'groups':{name:{lod:len(v['components']) for lod,v in lods.items()} for name,lods in report['models'].items()}}))
if report['result']!='passed':raise RuntimeError('See '+str(out)+' for detached components')
