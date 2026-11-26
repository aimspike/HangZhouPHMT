"""Cycles static transport for 16 viewer states, factored into independent bases.
Actual exported architecture/furniture; image lightmap, corner-color furniture
irradiance/AO, and linear radiance panoramas. No runtime path tracing.
"""
from pathlib import Path
import bpy, json, gzip, math, hashlib, base64, os, time
import numpy as np
from mathutils import Vector
from mathutils.kdtree import KDTree
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent))
from denoise_bake_charts import denoise_hdr
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/static-bake';WORK=ROOT/'work/static-bake';WORK.mkdir(parents=True,exist_ok=True)
os.environ['OPTIX_CACHE_PATH']=str(WORK/'optix-cache')
SOURCE=json.loads(gzip.decompress((OUT/'scene.json.gz').read_bytes()))
OLD=json.loads((ROOT/'src/baked-lighting.json').read_text())['maps']
SITE=json.loads((ROOT/'src/solar-presets.json').read_text())
SIZE=int(os.environ.get('STATIC_ATLAS_SIZE','1024'));SAMPLES=int(os.environ.get('STATIC_SAMPLES','2048'));RANGE=8.
START=time.monotonic()
def log(*s):print('STATIC_BAKE',round(time.monotonic()-START,1),*s,flush=True)
def signature():
    return {p:hashlib.sha256((ROOT/p).read_text(encoding='utf-8').encode()).hexdigest() for p in ['src/house.template.html','src/interior.js','src/decor-preset-a.js','src/asset-rebuild.js','src/plan-layout.json','src/solar-presets.json']}
def pack():
    scale=.24
    while True:
        x=y=row=0;rects={}
        for m in sorted(OLD,key=lambda m:m['height'],reverse=True):
            w=max(12,math.ceil(m['width']*scale));h=max(12,math.ceil(m['height']*scale))
            if x+w>SIZE:x=0;y+=row;row=0
            if y+h>SIZE:break
            rects[m['id']]=[x+2,y+2,w-4,h-4];x+=w;row=max(row,h)
        else:return rects,scale
        scale*=.96
RECTS,DENSITY=pack();log('atlas density scale',DENSITY)
def xyz(p):return (p[0],-p[2],p[1])
def mesh_key(o):
    # FNV over quantized local-plan position/normal is also implemented in JS.
    h=2166136261
    for a in [o['positions'],o['normals']]:
        for v in a:
            n=math.floor(v*100000+.5)&0xffffffff
            h=((h^n)*16777619)&0xffffffff
    return f"{len(o['positions'])//3}-{h:08x}"
def scene_setup(layout):
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=SAMPLES;scene.cycles.use_denoising=True;scene.cycles.use_adaptive_sampling=False;scene.cycles.adaptive_threshold=.005
    scene.cycles.max_bounces=5;scene.cycles.diffuse_bounces=4;scene.cycles.glossy_bounces=3;scene.cycles.transmission_bounces=4;scene.cycles.transparent_max_bounces=6
    prefs=bpy.context.preferences.addons['cycles'].preferences
    try:
        prefs.compute_device_type='OPTIX';prefs.get_devices()
        for d in prefs.devices:d.use=d.type=='OPTIX'
        scene.cycles.device='GPU'
    except Exception:scene.cycles.device='CPU'
    scene.render.bake.use_clear=True;scene.render.bake.margin=3;scene.render.bake.use_pass_color=False
    scene.render.bake.use_pass_direct=True;scene.render.bake.use_pass_indirect=True
    scene.world.use_nodes=True;scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.79,.88,1,1)
    scene.world.light_settings.distance=.48
    scene.view_settings.view_transform='Raw';scene.render.image_settings.file_format='OPEN_EXR';scene.render.image_settings.color_depth='32'
    data=SOURCE['layouts'][layout];mats=[]
    for i,m in enumerate(data['materials']):
        mat=bpy.data.materials.new(f'material-{i}');mat.use_nodes=True;p=mat.node_tree.nodes.get('Principled BSDF')
        # Color excluded at receiver; the actual albedo still colors bounced light.
        p.inputs['Base Color'].default_value=(*m['color'],1);p.inputs['Roughness'].default_value=m['roughness'];p.inputs['Metallic'].default_value=m['metalness']
        mats.append(mat)
    objects=[];furniture=[];architecture=[];mapping=[]
    for o in data['objects']:
        pos=np.array(o['positions']).reshape(-1,3);norm=np.array(o['normals']).reshape(-1,3);idx=np.array(o['indices']).reshape(-1,3)
        is_arch=o['bakeId'] in RECTS
        if is_arch:
            # Roof upper/side UVs overlap the underside; only underside receives.
            keep=np.ones(len(idx),dtype=bool)
            if o['bakeId']==130:keep=norm[idx].mean(axis=1)[:,1]<-.5
            if o['bakeId'] is not None and o['bakeId']<14:keep=norm[idx].mean(axis=1)[:,1]>.5
            receiver_idx=idx[keep]
            # Other roof/floor faces remain as occluders in a separate object.
        else:receiver_idx=idx
        me=bpy.data.meshes.new(f'geometry-{o["id"]}');me.from_pydata([xyz(p) for p in pos],[],receiver_idx.tolist());me.update();ob=bpy.data.objects.new(f'object-{o["id"]}',me);scene.collection.objects.link(ob)
        for m in mats:me.materials.append(m)
        face_mats=np.zeros(len(idx),dtype=int)
        for g in o['groups']:face_mats[g['start']//3:(g['start']+g['count'])//3]=g['material']
        assigned=face_mats[keep] if is_arch else face_mats
        for p,mi in zip(me.polygons,assigned):p.material_index=int(mi);p.use_smooth=not is_arch
        if not is_arch:me.normals_split_custom_set([xyz(n) for n in norm[receiver_idx].reshape(-1,3)])
        if is_arch:
            uv=me.uv_layers.new(name='StaticIrradiance');uvs=np.array(o['uv2']).reshape(-1,2);rx,ry,rw,rh=RECTS[o['bakeId']]
            for loop in me.loops:
                u,v=uvs[loop.vertex_index];uv.data[loop.index].uv=((rx+u*rw)/SIZE,(ry+v*rh)/SIZE)
            architecture.append(ob)
            if not keep.all():
                hidden=bpy.data.meshes.new('closed occluder');hidden.from_pydata([xyz(p) for p in pos],[],idx[~keep].tolist());hidden.update();occ=bpy.data.objects.new('roof exterior occluder',hidden);scene.collection.objects.link(occ)
                for m in mats:hidden.materials.append(m)
                for p,mi in zip(hidden.polygons,face_mats[~keep]):p.material_index=int(mi)
        if o['isDecor']:
            furniture.append(ob);mapping.append((o,ob))
        objects.append(ob)
    # Merge targets, retaining corner/source order for reproducible lookup.
    def join(obs,name):
        bpy.ops.object.select_all(action='DESELECT')
        for ob in obs:ob.select_set(True)
        bpy.context.view_layer.objects.active=obs[0];bpy.ops.object.join();ob=bpy.context.object;ob.name=name;return ob
    # Capture original furniture corner lookup before joining (global loop offset).
    lookup={};offset=0;allpos=[];allnormal=[]
    for o,ob in mapping:
        first=np.full(len(o['positions'])//3,-1,dtype=np.int32)
        for loop in ob.data.loops:
            if first[loop.vertex_index]<0:first[loop.vertex_index]=offset+loop.index
        lookup[mesh_key(o)]={'porcelain':any(data['materials'][g['material']].get('tag')=='porcelain' for g in o['groups']),'sampleLoops':first,'positions':np.array(o['positions']).reshape(-1,3),'normals':np.array(o['normals']).reshape(-1,3)}
        offset+=len(ob.data.loops)
    arch=join(architecture,'Architectural lightmap receiver');furn=join(furniture,'Furniture irradiance receiver') if furniture else None
    if furn:
        c=furn.data.color_attributes.new(name='StaticLighting',type='FLOAT_COLOR',domain='CORNER');furn.data.color_attributes.active_color=c
    # Actual lamp positions match the app, broad sources produce soft shadows.
    lamp_objects=[]
    for l in data['lamps']:
        ld=bpy.data.lights.new('fixture '+l['room'],'AREA');ld.energy=115;ld.shape='DISK';ld.size=.36;ld.color=(1,.88,.72)
        lo=bpy.data.objects.new(ld.name,ld);scene.collection.objects.link(lo);lo.location=xyz((l['x'],2.70,l['z']));lo.rotation_euler=(0,0,0);lamp_objects.append(lo)
    ld=bpy.data.lights.new('sun source','SUN');ld.energy=1;ld.angle=math.radians(.8);sun=bpy.data.objects.new('sun source',ld);scene.collection.objects.link(sun)
    return scene,data,arch,furn,lookup,lamp_objects,sun

def set_basis(scene,lamps,sun,basis):
    scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value=1 if basis=='sky' else 0
    for l in lamps:l.hide_render=basis!='lamps'
    sun.hide_render=basis not in ['morning','noon','dusk']
    if not sun.hide_render:
        preset=next(p for p in SITE['presets'] if p['id']==basis);sun.rotation_euler=(-Vector(xyz(preset['direction']))).to_track_quat('-Z','Y').to_euler()
    scene.render.bake.use_pass_direct=True;scene.render.bake.use_pass_indirect=True

def encode_png(name,array,ao=False,precision=8):
    # Blender PNG save with Raw transform would still apply image colorspace.
    # Write from float values using its bundled numpy plus stdlib PNG encoder.
    import struct,zlib
    a=np.clip(array,0,1) if ao else np.sqrt(np.clip(array/RANGE,0,1))
    if precision==16:
        # Canvas getImageData is 8-bit. Store high/low RGB bytes in adjacent
        # pixels, then reconstruct the linear sample before interpolation.
        q=np.uint16(np.floor(a*65535+.5));h,w,c=q.shape
        pixels=np.empty((h,w*2,c),dtype=np.uint8)
        pixels[:,0::2,:]=q>>8;pixels[:,1::2,:]=q&255
    else:pixels=np.uint8(np.floor(a*255+.5))
    h,w,c=pixels.shape
    def chunk(t,b):return struct.pack('>I',len(b))+t+b+struct.pack('>I',zlib.crc32(t+b)&0xffffffff)
    raw=b''.join(b'\0'+row.tobytes() for row in pixels[::-1])
    blob=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,2 if c==3 else 6,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b'')
    (OUT/(name+'.png')).write_bytes(blob)
    return {'width':w,'height':h,'precision':precision,'image':'data:image/png;base64,'+base64.b64encode(blob).decode(),'encoding':'linear AO' if ao else f'sqrt-linear RGB{precision} / range 8','range':1 if ao else RANGE,'file':name+'.png'}

def filter_atlas(values):
    # Filter only inside each independent UV chart, preserving atlas gutters.
    # This is low-frequency irradiance, while detailed direct sun stays separate.
    result=values.copy()
    for m in OLD:
        rx,ry,rw,rh=RECTS[m['id']]
        regions=[[0,0,m['width'],m['height']]] if m.get('roof') else m['rects']
        for x,y,w,h in regions:
            x0=max(0,int(math.floor(rx+(x+.5)/m['width']*rw)));x1=min(SIZE,int(math.ceil(rx+(x+w-.5)/m['width']*rw)))
            y0=max(0,int(math.floor(ry+(y+.5)/m['height']*rh)));y1=min(SIZE,int(math.ceil(ry+(y+h-.5)/m['height']*rh)))
            if x1<=x0 or y1<=y0:continue
            region=values[y0:y1,x0:x1].copy()
            if CURRENT in ['sky','lamps']:region=denoise_hdr(region)
            for repeat in range(1 if CURRENT in ['morning','noon','dusk'] else 2):
                for axis in [0,1]:
                    padding=[(0,0)]*3;padding[axis]=(2,2);padded=np.pad(region,padding,mode='edge')
                    region=sum(np.take(padded,np.arange(region.shape[axis])+i,axis=axis)*weight for i,weight in enumerate([1/16,4/16,6/16,4/16,1/16]))
            result[y0:y1,x0:x1]=region
    return result

def bake_target(scene,target,image=None):
    bpy.ops.object.select_all(action='DESELECT');target.select_set(True);bpy.context.view_layer.objects.active=target
    scene.render.bake.target='IMAGE_TEXTURES' if image else 'VERTEX_COLORS'
    if image:
        for mat in target.data.materials:
            nodes=mat.node_tree.nodes;n=nodes.get('Static Bake Target') or nodes.new('ShaderNodeTexImage');n.name='Static Bake Target';n.image=image;nodes.active=n
    bpy.ops.object.bake(type='DIFFUSE' if CURRENT!='ao' else 'AO')
    if image:return np.array(image.pixels[:],dtype=np.float32).reshape(SIZE,SIZE,4)[:,:,:3]
    values=np.empty(len(target.data.loops)*4,dtype=np.float32);target.data.color_attributes['StaticLighting'].data.foreach_get('color',values);return values.reshape(-1,4)[:,:3]

output={'version':1,'engine':'Blender 5.3 / Cycles OptiX offline bake','samples':SAMPLES,'furnitureSamples':1024,'aoSamples':256,'denoiser':'Open Image Denoise RT HDR per independent UV chart','ceramicFiltering':'position radius 35mm / normal dot > .86, two bilateral passes','bounces':4,'atlasSize':SIZE,'range':RANGE,'rects':RECTS,'layouts':{},'sourceHashes':signature(),'inputHashes':{p:hashlib.sha256((ROOT/p).read_text(encoding='utf-8').encode()).hexdigest() for p in ['src/plan-layout.json','src/bake-source.json','src/solar-presets.json','src/decor-preset-a.js','src/interior.js','assets/rebuild/models.json','scripts/denoise_bake_charts.py']},'states':[{'time':t,'lights':l,'decor':d} for t in ['morning','noon','dusk','night'] for l in [False,True] for d in ['bare','a']], 'doorReference':SOURCE['layouts']['a']['doors']}
PREVIOUS=json.loads((OUT/'static-lighting.json').read_text()) if os.environ.get('STATIC_REUSE_REFLECTIONS')=='1' else None
for layout in ['bare','a','a-mobile']:
    scene,data,arch,furn,lookup,lamps,sun=scene_setup(layout);log(layout,'scene built',len(scene.objects))
    img=bpy.data.images.new(layout+' irradiance',width=SIZE,height=SIZE,float_buffer=True);img.colorspace_settings.name='Non-Color'
    entry={'finishes':data['finishes'],'atlas':{},'vertices':{},'reflections':{},'meshes':{}}
    # Vertex pixel dictionary: same normal/position samples may share irradiance.
    if furn:
        unique={};sample_loops=[]
        for key,v in lookup.items():
            refs=[]
            for p,n,loop in zip(v['positions'],v['normals'],v['sampleLoops']):
                ident=tuple(np.round(np.r_[p,n],5));sample=unique.get(ident)
                if sample is None:sample=len(sample_loops);unique[ident]=sample;sample_loops.append(int(loop))
                refs.append(sample)
            entry['meshes'][key]={'count':len(refs),'indices':base64.b64encode(np.array(refs,dtype='<u4').tobytes()).decode()}
        entry['vertexSamples']=len(sample_loops);log('exact furniture samples',len(sample_loops),layout)
        # Smooth only dense manufactured porcelain radiance, using spatial and
        # normal similarity. It never filters material/specular normals.
        ceramic_neighbors={}
        for key,v in lookup.items():
            if not v['porcelain']:continue
            refs=np.frombuffer(base64.b64decode(entry['meshes'][key]['indices']),dtype='<u4');unique_refs,source_ids=np.unique(refs,return_index=True);positions=v['positions'][source_ids];normals=v['normals'][source_ids];tree=KDTree(len(positions))
            for i,p in enumerate(positions):tree.insert(Vector(p),i)
            tree.balance()
            for i,(ref,p,n) in enumerate(zip(unique_refs,positions,normals)):
                candidates=[(j,d) for _,j,d in tree.find_range(Vector(p),.035) if np.dot(n,normals[j])>.86]
                ids=np.array([unique_refs[j] for j,d in candidates],dtype=np.int32);weights=np.array([math.exp(-d*d/(.018**2)) for j,d in candidates],dtype=np.float32)
                ceramic_neighbors[int(ref)]=(ids,weights/weights.sum())
    for CURRENT in ['sky','morning','noon','dusk','lamps','ao']:
        set_basis(scene,lamps,sun,CURRENT);scene.cycles.samples=SAMPLES if CURRENT!='ao' else 256
        if layout!='a-mobile':
            pixels=bake_target(scene,arch,img);pixels=filter_atlas(pixels) if CURRENT!='ao' else pixels;entry['atlas'][CURRENT]=encode_png(f'{layout}-atlas-{CURRENT}',pixels,ao=CURRENT=='ao',precision=8 if CURRENT=='ao' else 16);log(layout,CURRENT,'atlas done',float(pixels.mean()),float(pixels.max()))
        if furn:
            scene.render.bake.use_pass_direct=True;scene.cycles.samples=1024 if CURRENT!='ao' else 256
            vals=bake_target(scene,furn);vals=vals[sample_loops]
            for _ in range(2):
                filtered=vals.copy()
                for ref,(ids,weights) in ceramic_neighbors.items():filtered[ref]=(vals[ids]*weights[:,None]).sum(axis=0)
                vals=filtered
            width=512;height=math.ceil(len(vals)/width);padded=np.zeros((width*height,3),dtype=np.float32);padded[:len(vals)]=vals
            entry['vertices'][CURRENT]=encode_png(f'{layout}-vertices-{CURRENT}',padded.reshape(height,width,3),ao=CURRENT=='ao',precision=8 if CURRENT=='ao' else 16);log(layout,CURRENT,'furniture done',float(vals.mean()),float(vals.max()))
    if layout=='a-mobile':
        output['layouts']['a']['mobileMeshes']=entry['meshes'];output['layouts']['a']['mobileVertices']=entry['vertices'];output['layouts']['a']['mobileVertexSamples']=entry['vertexSamples'];continue
    if PREVIOUS and layout in PREVIOUS['layouts']:
        entry['reflections']=PREVIOUS['layouts'][layout]['reflections'];output['layouts'][layout]=entry;log(layout,'reused unchanged reflection renders');continue
    # Panoramas use the same physical scene, including all furniture and lamps.
    camdata=bpy.data.cameras.new('Static reflection probe');camdata.type='PANO';camdata.panorama_type='EQUIRECTANGULAR';camera=bpy.data.objects.new('Static reflection probe',camdata);scene.collection.objects.link(camera);scene.camera=camera;camera.rotation_euler=(math.pi/2,0,-math.pi/2)
    scene.render.resolution_x=256;scene.render.resolution_y=128;scene.render.resolution_percentage=100;scene.cycles.samples=32
    for r in data['rooms']:
        if r['id'].startswith('equipment'):continue
        camera.location=xyz((r['x']+r['w']/2,1.45,r['z']+r['d']/2));entry['reflections'][r['id']]={}
        for CURRENT in ['sky','morning','noon','dusk','lamps']:
            set_basis(scene,lamps,sun,CURRENT);scene.render.filepath=str(WORK/'reflection.exr');bpy.ops.render.render(write_still=True)
            rendered=bpy.data.images.load(str(WORK/'reflection.exr'),check_existing=False);pixels=np.array(rendered.pixels[:],dtype=np.float32).reshape(128,256,4)[:,:,:3];bpy.data.images.remove(rendered)
            entry['reflections'][r['id']][CURRENT]=encode_png(f'{layout}-reflection-{r["id"]}-{CURRENT}',pixels)
        log(layout,r['id'],'reflection bases done')
    output['layouts'][layout]=entry
    (OUT/'static-lighting.json').write_text(json.dumps(output,separators=(',',':'))+'\n',encoding='utf-8')
    bpy.context.preferences.filepaths.save_version=0;bpy.ops.wm.save_as_mainfile(filepath=str(OUT/f'{layout}-bake.blend'),compress=True)
output['seconds']=round(time.monotonic()-START,1);output['scriptSha256']=hashlib.sha256(Path(__file__).read_text(encoding='utf-8').encode()).hexdigest()
(OUT/'static-lighting.json').write_text(json.dumps(output,separators=(',',':'))+'\n',encoding='utf-8');log('COMPLETE',output['seconds'])
