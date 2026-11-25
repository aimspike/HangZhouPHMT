"""Offline studio studies of the actual authored assets; distinct from webpage screenshots."""
from pathlib import Path
import math
import bpy
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
import os
os.environ['OPTIX_CACHE_PATH']=str(ROOT/'work/rebuild/optix-cache')
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'assets/rebuild/reference-a-master.blend'))
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=True
try:
    preferences=bpy.context.preferences.addons['cycles'].preferences
    preferences.compute_device_type='OPTIX';preferences.get_devices()
    for device in preferences.devices:device.use=device.type!='CPU'
    scene.cycles.device='GPU'
except Exception:
    scene.cycles.device='CPU'
scene.render.resolution_x=1100;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.world.color=(.16,.16,.16)
scene.render.image_settings.file_format='PNG'

def area(name,pos,power,size):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=pos;obj.rotation_euler=(Vector((0,0,.5))-obj.location).to_track_quat('-Z','Y').to_euler()
area('softbox key',(1,-3,4),450,3)
area('softbox fill',(-3,-1,2.3),250,3)
area('rim',(0,2,3.3),400,2)
camera_data=bpy.data.cameras.new('Studio camera');camera=bpy.data.objects.new('Studio camera',camera_data);scene.collection.objects.link(camera);scene.camera=camera;camera_data.lens=55
material=bpy.data.materials.new('Studio backdrop');material.diffuse_color=(.42,.43,.4,1)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.015));floor=bpy.context.object;floor.data.materials.append(material)
for model,position,target in [('sofa',(3.1,4.5,2.3),(0,0,.52)),('chair',(1.4,1.8,1.25),(0,0,.43)),('master-bed',(3.4,4.0,2.8),(0,0,.45)),('kitchen-east',(3.7,-4.5,2.5),(0,0,.48))]:
    for collection in scene.collection.children:
        if collection.name!='Collection':collection.hide_render=collection.name!=model
    camera.location=position;camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/f'work/rebuild/studio-{model}.png');bpy.ops.render.render(write_still=True)
print('Studio studies rendered. These are offline Cycles asset studies, not WebGL captures.')
