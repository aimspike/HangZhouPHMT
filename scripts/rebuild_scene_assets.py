"""Author reference-A furniture in Blender, retain an editable master and export WebGL1 meshes.

Run with Blender --background --python scripts/rebuild_scene_assets.py.
Coordinates in helpers are metres in the viewer's x/y-up/z plan convention.
"""
import base64
from collections import defaultdict
import json
import hashlib
import math
from pathlib import Path
import struct
import sys
import os

import bpy
import bmesh
from mathutils import Vector
import numpy as np
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'assets/rebuild'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1
materials = {}
models = defaultdict(list)
current = ''

COLORS = {'navy':(.025,.04,.065,1),'linen':(.64,.58,.47,1),'mustard':(.5,.35,.09,1),'oak':(.48,.28,.13,1),'wood':(.3,.15,.065,1),'cream':(.84,.8,.7,1),'white':(.9,.9,.85,1),'chrome':(.62,.65,.64,1),'black':(.025,.028,.027,1),'orange':(.55,.12,.035,1),'ceramic':(.67,.65,.58,1),'seam':(.065,.085,.1,1),'blue':(.08,.12,.2,1),'brass':(.36,.25,.1,1),'rug':(.63,.6,.54,1),'applianceIvory':(.86,.84,.77,1)}
for name, color in COLORS.items():
    m=bpy.data.materials.new(name);m.diffuse_color=color;m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=color
    p.inputs['Roughness'].default_value=.19 if name=='chrome' else .37 if name in ('wood','oak','ceramic') else .8
    p.inputs['Metallic'].default_value=1 if name in ('chrome','brass') else 0
    materials[name]=m

def xyz(p): return (p[0],-p[2],p[1])
def finish(obj,name,material):
    bm=bmesh.new();bm.from_mesh(obj.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(obj.data);bm.free()
    obj.name=current+' / '+name;obj.data.materials.append(materials[material]);models[current].append(obj)
    for poly in obj.data.polygons:poly.use_smooth=True
    return obj

def cube(name,p,size,mat='oak',bevel=.003,segments=3,soft=False):
    bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(p));o=bpy.context.object;o.dimensions=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new('Manufactured edge radius','BEVEL');mod.width=min(bevel,min(size)*.48);mod.segments=segments
        bpy.ops.object.modifier_apply(modifier=mod.name)
    if soft:
        mod=o.modifiers.new('Upholstery subdivision','SUBSURF');mod.levels=1;mod.render_levels=2;bpy.ops.object.modifier_apply(modifier=mod.name)
        # Subtle non-periodic compression towards the cushion perimeter.
        for v in o.data.vertices:
            x,z,y=v.co;nx=x/(size[0]/2);ny=y/(size[1]/2);nz=z/(size[2]/2)
            v.co.z += .0018*math.sin(nx*13+nz*4)*math.sin(nz*9+nx)*max(0,1-abs(nx))
    else:
        mod=o.modifiers.new('Weighted panel normals','WEIGHTED_NORMAL');mod.keep_sharp=True;mod.weight=50;bpy.ops.object.modifier_apply(modifier=mod.name)
    return finish(o,name,mat)

def lathe(name,profile,mat='oak',segments=64):
    # Closed cross-section: one vertex at the axis, fans at pole transitions.
    # Duplicating a zero-radius ring creates zero-area triangles after export.
    vertices=[];faces=[];rings=[]
    for r,y in profile:
        ring=[]
        for j in range(segments if r>0 else 1):
            a=j*2*math.pi/segments;ring.append(len(vertices));vertices.append(xyz((r*math.cos(a),y,r*math.sin(a))))
        rings.append(ring)
    for i,first in enumerate(rings):
        second=rings[(i+1)%len(rings)]
        if len(first)==len(second)==1:continue
        for j in range(segments):
            k=(j+1)%segments
            if len(first)==1:faces.append((first[0],second[k],second[j]))
            elif len(second)==1:faces.append((first[j],first[k],second[0]))
            else:faces.append((first[j],first[k],second[k],second[j]))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(vertices,[],faces);mesh.update();o=bpy.data.objects.new(name,mesh);scene.collection.objects.link(o);return finish(o,name,mat)

def tube(name,points,radius=.012,mat='chrome',closed=False,surface=None):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=8;c.bevel_depth=radius;c.bevel_resolution=2;c.use_fill_caps=True
    if surface is not None:
        # Stitch onto the evaluated cushion, including its bevel/subdivision.
        # Fixed segment budget replaces the old interpolated floating outline.
        bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get();bvh=BVHTree.FromObject(surface,dg)
        inverse=surface.matrix_world.inverted();normal_matrix=surface.matrix_world.to_3x3().inverted().transposed()
        path=[Vector(xyz(p)) for p in points];segments=list(zip(path,path[1:]+path[:1])) if closed else list(zip(path,path[1:]))
        lengths=[(b-a).length for a,b in segments];total=sum(lengths);steps=len(segments)*8;projected=[]
        for j in range(steps if closed else steps+1):
            distance=total*j/steps;k=0
            while k<len(lengths)-1 and distance>lengths[k]:distance-=lengths[k];k+=1
            candidate=segments[k][0].lerp(segments[k][1],distance/lengths[k]);hit,normal,_,_=bvh.find_nearest(inverse@candidate)
            if hit is None:raise RuntimeError(f'Cannot attach {name} to {surface.name}')
            projected.append(surface.matrix_world@hit+(normal_matrix@normal).normalized()*radius*.2)
        spline=c.splines.new('POLY');spline.points.add(len(projected)-1)
        for b,p in zip(spline.points,projected):b.co=(*p,1)
    else:
        spline=c.splines.new('BEZIER');spline.bezier_points.add(len(points)-1)
        for b,p in zip(spline.bezier_points,points):b.co=xyz(p);b.handle_left_type=b.handle_right_type='AUTO'
    spline.use_cyclic_u=closed;o=bpy.data.objects.new(name,c);scene.collection.objects.link(o);bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
    # Blender converts curve caps with duplicate ring vertices. Weld the actual
    # joint so caps remain attached through decimation and quantization.
    bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-7);bm.to_mesh(o.data);bm.free()
    result=finish(o,name,mat)
    if surface is not None:result['sewn_surface']=surface.name;result['sewn_radius']=radius
    return result

def move(o,p):o.location+=Vector(xyz(p));return o

def seam(name,cx,y,cz,w,d,mat='seam',surface=None):
    r=min(.055,w*.12,d*.12);points=[]
    for x,z,start in [(cx+w/2-r,cz+d/2-r,0),(cx-w/2+r,cz+d/2-r,90),(cx-w/2+r,cz-d/2+r,180),(cx+w/2-r,cz-d/2+r,270)]:
        for j in range(4):
            a=math.radians(start+j*30);points.append((x+r*math.cos(a),y,z+r*math.sin(a)))
    return tube(name,points,.0014,mat,True,surface)

current='sofa'
# Bent tubular base, visible side frames and separate upholstered cushions.
for x in [-1.02,1.02]:
    tube('continuous chromed sled frame',[(x,.055,-.31),(x,.055,.29),(x,.1,.34),(x,.48,.34),(x,.525,.25),(x,.525,-.29),(x,.47,-.35),(x,.12,-.35)],.014,'chrome',True)
for z in [-.29,.28]:tube('cross member',[(-1.02,.15,z),(1.02,.15,z)],.012,'chrome')
cube('upholstered seat support',(0,.29,0),(2.18,.18,.73),'navy',.065,6,True)
for x in [-1.04,1.04]:
    o=cube('rounded arm bolster',(x,.585,.015),(.18,.34,.79),'navy',.075,7,True)
    seam('arm seam',x,.747,.015,.155,.72,surface=o)
for x in [-.67,0,.67]:
    o=cube('seat cushion',(x,.46,-.045),(.646,.19,.65),'navy',.068,7,True)
    seam('seat top welt',x,.546,-.045,.62,.62,surface=o)
    o=cube('compressed back cushion',(x,.745,.32),(.646,.49,.22),'navy',.085,7,True);o.rotation_euler.x=math.radians(-7)
    # Seams run around the actual cushion, keeping padding visible at the edge.
    tube('back perimeter welt',[(x-.265,.57,.211),(x+.265,.57,.211),(x+.284,.59,.214),(x+.284,.88,.25),(x+.265,.9,.253),(x-.265,.9,.253),(x-.284,.88,.25),(x-.284,.59,.214)],.0012,'seam',True,o)
for x,mat,tilt in [(-.79,'mustard',-.16),(.79,'linen',.18)]:
    o=cube('loose scatter pillow',(x,.73,.13),(.34,.33,.13),mat,.064,6,True);o.rotation_euler.y=tilt

current='coffee'
lathe('turned maple pedestal',[(0,.02),(.19,.02),(.205,.035),(.185,.06),(.16,.18),(.145,.22),(.16,.255),(.21,.335),(.2,.36),(0,.36)],'oak')
cube('rounded square tray',(0,.39,0),(.73,.065,.66),'black',.018,4)
cube('inset wood table top',(0,.427,0),(.686,.014,.616),'oak',.009,3)
for side in [-1,1]:cube('tray edge rail',(0,.434,side*.327),(.71,.022,.01),'black',.003,3)
lathe('porcelain cup',[(0,.432),(.035,.432),(.038,.438),(.041,.489),(.038,.493),(.034,.487),(.032,.442),(0,.442)],'ceramic',40)

current='console'
cube('lower shelf',(0,.14,0),(1.45,.023,.34),'oak',.003)
cube('cabinet top',(0,.515,0),(1.45,.026,.34),'oak',.004)
for x in [-.713,.713]:cube('cabinet end',(x,.327,0),(.024,.35,.34),'wood',.0025)
cube('back panel',(0,.325,-.158),(1.41,.34,.015),'wood',.001)
for x in [-.235,.235]:cube('internal partition',(x,.323,0),(.018,.34,.31),'oak',.002)
for x in [-.475,.475]:
    cube('inset sliding door',(x,.325,.163),(.452,.318,.018),'wood',.003)
    cube('recessed dark pull',(x+.15,.33,.175),(.065,.023,.005),'black',.003)
cube('centre shelf',(0,.28,.004),(.45,.018,.3),'oak',.002)
cube('media receiver',(0,.207,.02),(.32,.08,.23),'black',.006)
for x in [-.61,.61]:
    tube('bent console legs',[(x,.015,.135),(x,.46,.135),(x,.49,.1),(x,.49,-.1),(x,.46,-.135),(x,.015,-.135)],.009,'chrome')

current='dining-table'
lathe('edge-profiled round tabletop',[(0,.714),(.545,.714),(.572,.721),(.58,.733),(.58,.757),(.57,.773),(.55,.779),(0,.779)],'oak',80)
lathe('turned pedestal',[(0,.035),(.19,.035),(.2,.06),(.19,.1),(.11,.25),(.09,.55),(.16,.702),(0,.702)],'wood',64)
lathe('chromed flared foot',[(0,.02),(.29,.02),(.31,.029),(.31,.045),(.29,.055),(0,.055)],'chrome',64)

current='chair'
o=cube('seat cushion',(0,.45,0),(.43,.075,.43),'linen',.032,5,True)
seam('seat piping',0,.487,0,.4,.4,'linen',o)
# A bowed plywood back is a genuinely curved panel, not a scaled box.
verts=[];faces=[];steps=24
for thickness in [-.008,.008]:
    for yy in [.61,.86]:
        for j in range(steps+1):
            x=-.218+.436*j/steps;z=.184+.12*(1-(x/.23)**2)+thickness;verts.append(xyz((x,yy,z)))
n=steps+1
for s in range(2):
    for j in range(steps):
        a=s*2*n+j;faces.append((a,a+1,a+n+1,a+n) if s==0 else (a+n,a+n+1,a+1,a))
for row in [0,1]:
    for j in range(steps):
        a=row*n+j;faces.append((a,a+2*n,a+2*n+1,a+1))
for j in [0,steps]:faces.append((j,j+n,j+3*n,j+2*n))
mesh=bpy.data.meshes.new('curved plywood');mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new('plywood back',mesh);scene.collection.objects.link(o);finish(o,'bowed plywood back','oak')
for x in [-.195,.195]:
    tube('continuous cantilever leg',[(x,.038,.19),(x,.038,-.2),(x,.075,-.22),(x,.435,-.22),(x,.47,-.185),(x,.47,.18),(x,.62,.235),(x,.83,.27)],.009,'chrome')
    cube('armrest',(x,.65,-.035),(.034,.026,.28),'oak',.012,4)
    tube('arm support',[(x,.47,-.15),(x,.64,-.15),(x,.65,-.1)],.007,'chrome')
tube('front frame tie',[(-.195,.08,-.2),(.195,.08,-.2)],.007,'chrome')

current='pendant'
lathe('spun shade lower',[(.025,2.19),(.07,2.19),(.15,2.22),(.18,2.24),(.18,2.246),(.14,2.236),(.06,2.212),(.025,2.212)],'orange',64)
lathe('spun shade upper',[(.02,2.24),(.12,2.27),(.23,2.3),(.24,2.31),(.24,2.318),(.21,2.318),(.1,2.29),(.02,2.265)],'orange',64)
lathe('top shade',[(.018,2.29),(.09,2.32),(.27,2.35),(.27,2.36),(.24,2.36),(.08,2.34),(.018,2.31)],'orange',64)
lathe('socket',[(0,2.34),(.025,2.34),(.025,2.43),(.018,2.43),(.018,2.35),(0,2.35)],'cream',32)
tube('fabric flex',[(0,2.43,0),(.005,2.61,.008),(0,2.79,0)],.0025,'cream')

def make_bed(id,w,l,cover,head):
    global current
    current=id
    cube('veneered bed frame',(0,.24,0),(w,.22,l),'oak',.016,3)
    o=cube('mattress',(0,.415,0),(w-.02,.2,l-.035),'white',.045,5,True)
    seam('mattress top piping',0,.506,0,w-.035,l-.05,'linen',o)
    o=cube('upholstered headboard',(0,.67,-l/2+.055),(w+.03,1.04,.11),head,.045,5,True)
    for x in [-w/6,w/6]:tube('headboard seam',[(x,.28,-l/2+.112),(x,1.08,-l/2+.112)],.0014,'seam',surface=o)
    # Continuous quilt shell. The rim uses the very same perimeter vertices as
    # the top and underside, rather than overlapping an unrelated rounded box.
    width=w-.035;length=l*.68;nx,nz=24,30;v=[];f=[]
    for j in range(nz+1):
        z=-length/2+length*j/nz+.18
        for i in range(nx+1):
            x=-width/2+width*i/nx;edge=abs(x)/(width/2)
            y=.62-.055*edge**7+.004*math.sin(z*22+x*6)+.002*math.sin(x*37-z*9)
            v.append(xyz((x,y,z)))
    for j in range(nz):
        for i in range(nx):a=j*(nx+1)+i;f.append((a+nx+1,a+nx+2,a+1,a))
    count=len(v)
    v.extend((x,z,.509) for x,z,y in list(v))
    f.extend(tuple(index+count for index in reversed(face)) for face in list(f))
    perimeter=list(range(nx+1))+[j*(nx+1)+nx for j in range(1,nz+1)]+[nz*(nx+1)+i for i in range(nx-1,-1,-1)]+[j*(nx+1) for j in range(nz-1,0,-1)]
    for a,b in zip(perimeter,perimeter[1:]+perimeter[:1]):f.append((a,b,b+count,a+count))
    mesh=bpy.data.meshes.new('quilt');mesh.from_pydata(v,[],f);mesh.update();o=bpy.data.objects.new('duvet',mesh);scene.collection.objects.link(o);finish(o,'closed quilt shell',cover)
    for x in [-w*.245,w*.245]:
        o=cube('pillow with crown',(x,.645,-l/2+.36),(w*.43,.18,.44),'white',.075,6,True)
        seam('pillow flange',x,.653,-l/2+.36,w*.42,.43,'linen',o)
    for x in [-w/2+.1,w/2-.1]:
        for z in [-l/2+.15,l/2-.15]:
            o=lathe('recessed bed foot',[(0,0),(.014,0),(.017,.14),(0,.14)],'black',20);move(o,(x,0,z))

make_bed('master-bed',1.55,2.02,'blue','mustard')
make_bed('second-bed',1.35,1.94,'linen','linen')

def cabinetry(id,width,height,depth,doors=3):
    global current
    current=id
    cube('recessed plinth',(0,.055,.015),(width-.06,.11,depth-.05),'black',.002)
    cube('base panel',(0,.12,0),(width,.018,depth),'wood',.002)
    cube('top panel',(0,height-.009,0),(width,.018,depth),'cream',.002)
    for x in [-width/2+.009,width/2-.009]:cube('laminated end panel',(x,height/2,0),(.018,height,depth),'cream',.002)
    cube('backing panel',(0,height/2,-depth/2+.006),(width-.036,height-.04,.012),'cream',.001)
    for i in range(doors):
        x=-width/2+width*(i+.5)/doors
        cube('panel door',(x,(height+.12)/2,depth/2+.009),(width/doors-.008,height-.14,.018),'cream',.0025)
        cube('brushed vertical handle',(x+width/doors/2-.045,1.15,depth/2+.027),(.007,.32,.014),'brass',.003)
        for y in [.45,height-.4]:cube('concealed hinge body',(x-width/doors/2+.04,y,depth/2-.02),(.04,.06,.02),'chrome',.003)

cabinetry('master-wardrobe',1.6,2.4,.6)
cabinetry('second-wardrobe',1.5,2.4,.55)

current='sideboard'
cube('cabinet bottom',(0,.13,0),(1.06,.018,.28),'wood',.002)
cube('oak counter',(0,.815,0),(1.06,.027,.28),'oak',.004)
for x in [-.521,.521]:cube('side panel',(x,.47,0),(.018,.68,.28),'wood',.002)
cube('back board',(0,.46,-.13),(1.024,.66,.015),'wood',.001)
for x in [-.35,0,.35]:cube('partition',(x,.47,0),(.018,.66,.26),'wood',.002)
for x,col in [(-.355,'cream'),(0,'blue'),(.355,'wood')]:
    cube('inset cabinet door',(x,.475,.142),(.34,.63,.018),col,.003)
    cube('shadow gap pull',(x,.775,.153),(.18,.009,.008),'black',.002)
for x in [-.44,.44]:
    for z in [-.09,.09]:move(lathe('slender leg',[(0,0),(.01,0),(.012,.13),(0,.13)],'chrome',16),(x,0,z))

current='fridge'
cube('ivory coated cabinet',(0,1,0),(.62,1.98,.68),'applianceIvory',.022,5)
cube('upper flat door',(0,1.45,-.347),(.6,1.04,.032),'applianceIvory',.012,4)
cube('freezer flat door',(0,.465,-.347),(.6,.89,.032),'applianceIvory',.012,4)
cube('door gasket',(0,.986,-.365),(.59,.012,.004),'black',.002)
cube('recessed upper grip',(0,.922,-.35),(.49,.014,.016),'black',.003)
cube('recessed freezer grip',(0,.908,-.35),(.49,.01,.016),'black',.003)
cube('subtle control strip',(.19,1.7,-.365),(.032,.12,.002),'black',.003)
cube('toe ventilation',(0,.06,-.351),(.54,.05,.01),'black',.003)
for j in range(16):cube('vent fin',(-.25+j*.033,.06,-.358),(.004,.044,.004),'applianceIvory',.001)

current='kitchen-east'
# Local X is cabinet run, local +Z faces the room. Rotation maps it west.
cube('toe kick',(0,.07,-.012),(2.53,.14,.51),'black',.002)
cube('carcass bottom',(0,.17,0),(2.53,.018,.62),'wood',.002)
cube('stone worktop',(0,.91,.02),(2.56,.055,.67),'ceramic',.005,4)
for x in [-1.256,1.256]:cube('side return',(x,.528,0),(.018,.714,.62),'oak',.002)
cube('carcass backing',(0,.528,-.301),(2.53,.714,.018),'wood',.002)
cube('counter front support',(0,.866,.287),(2.51,.038,.026),'wood',.002)
for j in range(5):
    x=-1.012+j*.506
    cube('veneered base front',(x,.522,.317),(.495,.714,.018),'wood',.003)
    tube('brushed handle',[(x-.09,.72,.337),(x+.09,.72,.337)],.006,'chrome')
    if j in [0,1]:
        for yy in [.38,.6]:cube('drawer shadow joint',(x,yy,.328),(.478,.004,.003),'black',.001)

current='kitchen-north'
cube('toe kick',(0,.07,0),(1.03,.14,.49),'black',.002)
cube('carcass bottom',(0,.179,0),(1.03,.018,.59),'oak',.002)
for x in [-.506,.506]:cube('cabinet end',(x,.532,0),(.018,.706,.59),'oak',.002)
cube('cabinet back',(0,.532,-.286),(.994,.706,.018),'oak',.002)
cube('counter front support',(0,.866,.275),(.994,.038,.026),'oak',.002)
# Four counter strips leave a real sink opening.
for x in [-.46,.46]:cube('counter end',(x,.91,0),(.14,.055,.63),'ceramic',.004)
for z in [-.25,.25]:cube('counter rail',(0,.91,z),(.8,.055,.13),'ceramic',.004)
# One watertight vessel with a continuous inset lip. Its flange covers the
# .78 x .37 m counter opening by >=18 mm, including the rounded corners.
def sink_vessel():
    vertices=[];rings=[];faces=[];segments=8
    for halfx,halfz,radius,y in [(.412,.208,.025,.936),(.412,.208,.025,.942),(.36,.157,.035,.942),(.348,.145,.035,.925),(.30,.12,.035,.802),(.29,.11,.035,.795),(.29,.11,.035,.787),(.307,.127,.035,.787),(.356,.153,.035,.923)]:
        ring=[]
        for cx,cz,start in [(halfx-radius,halfz-radius,0),(-halfx+radius,halfz-radius,90),(-halfx+radius,-halfz+radius,180),(halfx-radius,-halfz+radius,270)]:
            for j in range(segments):
                a=math.radians(start+j*90/segments);ring.append(len(vertices));vertices.append(xyz((cx+radius*math.cos(a),y,cz+radius*math.sin(a))))
        rings.append(ring)
    n=len(rings[0])
    # The interior and exterior bottoms are disks, joined around their edges.
    for i in range(len(rings)-1):
        if i==5:continue
        for j in range(n):k=(j+1)%n;faces.append((rings[i][j],rings[i][k],rings[i+1][k],rings[i+1][j]))
    for j in range(n):k=(j+1)%n;faces.append((rings[-1][j],rings[-1][k],rings[0][k],rings[0][j]))
    for index in [5,6]:
        centre=len(vertices);vertices.append(xyz((0,[.795,.787][index-5],0)))
        for j in range(n):faces.append((centre,rings[index][j],rings[index][(j+1)%n]))
    mesh=bpy.data.meshes.new('continuous sink vessel');mesh.from_pydata(vertices,[],faces);mesh.update();o=bpy.data.objects.new('sink',mesh);scene.collection.objects.link(o);finish(o,'flanged sink vessel','chrome')
sink_vessel()
for x in [-.26,.26]:
    cube('cabinet door',(x,.53,.305),(.502,.69,.018),'wood',.003)
    tube('cabinet pull',[(x-.07,.72,.327),(x+.07,.72,.327)],.005,'chrome')

current='study-desk'
cube('veneered writing top',(0,.75,0),(.73,.055,1.38),'oak',.006)
for z in [-.58,.58]:
    tube('desk end frame',[(-.3,.015,z),(-.3,.72,z),(.3,.72,z),(.3,.015,z)],.013,'chrome')
cube('slim drawer',(0,.665,0),(.6,.1,.8),'wood',.003)
cube('recessed drawer pull',(.305,.665,0),(.006,.012,.15),'black',.002)

current='vanity'
cube('floating carcass',(0,.56,0),(.7,.48,.36),'wood',.003)
for yy in [.45,.68]:
    cube('drawer front',(0,yy,-.19),(.676,.217,.018),'oak',.003)
    cube('handle shadow',(0,yy+.096,-.201),(.45,.012,.008),'black',.002)
cube('stone slab',(0,.82,0),(.74,.06,.39),'ceramic',.005)
lathe('porcelain vessel',[(0,.852),(.12,.852),(.165,.88),(.18,.91),(.175,.918),(.16,.907),(.11,.875),(0,.875)],'white',64)
tube('curved tap',[(.23,.85,.1),(.23,1.1,.1),(.19,1.13,.1),(.08,1.13,.1),(.06,1.1,.1)],.012,'chrome')

# Wire every master material to the same packaged PBR sources used by the web.
for name,material in materials.items():
    key='fabric' if name=='navy' else 'fabric_plain' if name in ('linen','mustard','blue','white','rug') else 'wood' if name in ('wood','oak') else 'stone' if name=='ceramic' else None
    if not key:continue
    nodes=material.node_tree.nodes;links=material.node_tree.links;p=nodes.get('Principled BSDF')
    tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(OUT/(key+'-desktop-color.jpg')),check_existing=True);tex.image.pack()
    multiply=nodes.new('ShaderNodeMixRGB');multiply.blend_type='MULTIPLY';multiply.inputs[0].default_value=1;multiply.inputs[2].default_value=COLORS[name];links.new(tex.outputs['Color'],multiply.inputs[1]);links.new(multiply.outputs['Color'],p.inputs['Base Color'])
    normal=nodes.new('ShaderNodeTexImage');normal.image=bpy.data.images.load(str(OUT/(key+'-desktop-normal.jpg')),check_existing=True);normal.image.colorspace_settings.name='Non-Color';normal.image.pack();n=nodes.new('ShaderNodeNormalMap');n.inputs['Strength'].default_value=.12 if 'fabric' in key else .15;links.new(normal.outputs['Color'],n.inputs['Color']);links.new(n.outputs['Normal'],p.inputs['Normal'])
    rough=nodes.new('ShaderNodeTexImage');rough.image=bpy.data.images.load(str(OUT/(key+'-desktop-roughness.jpg')),check_existing=True);rough.image.colorspace_settings.name='Non-Color';rough.image.pack();links.new(rough.outputs['Color'],p.inputs['Roughness'])

# Give all master objects authored metric UVs. Wood grain follows each part's
# local long axis; fabric scale is .4 m per repeat, floor handled independently.
def metric_uv(obj):
    mesh=obj.data
    if not mesh.uv_layers:mesh.uv_layers.new(name='UVMap')
    uv=mesh.uv_layers.active.data
    for poly in mesh.polygons:
        axis=max(range(3),key=lambda a:abs(poly.normal[a]))
        dims=[obj.dimensions.x,obj.dimensions.y,obj.dimensions.z]
        other=[a for a in range(3) if a!=axis];long=max(other,key=lambda a:dims[a]);short=next(a for a in other if a!=long)
        scale=.4 if obj.data.materials[0].name in ('navy','linen','mustard','blue','white') else .9
        for loop in poly.loop_indices:
            p=mesh.vertices[mesh.loops[loop].vertex_index].co
            uv[loop].uv=(p[short]/scale,p[long]/scale)

for model,objects in models.items():
    collection=bpy.data.collections.new(model);scene.collection.children.link(collection)
    for obj in objects:
        for old in list(obj.users_collection):old.objects.unlink(obj)
        collection.objects.link(obj)
        metric_uv(obj)
        obj['asset_id']=model;obj['units']='metres';obj['reference']='references/interior/preset-a'

scene['asset_pipeline']='Reference-A measured metre-scale authoring; packaged PBR, offline AO and separate high/mobile LOD'
scene['architecture']='No walls or door openings modified'
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'reference-a-master.blend'),compress=True)

def encode(objects,light):
    buckets=defaultdict(list);parts=defaultdict(list);dg=bpy.context.evaluated_depsgraph_get()
    for obj in objects:
        ev=obj.evaluated_get(dg);mesh=ev.to_mesh();mesh.calc_loop_triangles();uv=mesh.uv_layers.active.data
        bm=bmesh.new();bm.from_mesh(mesh)
        boundary=sum(e.is_boundary for e in bm.edges);nonmanifold=sum(not e.is_manifold for e in bm.edges)
        degenerate=sum(p.calc_area()<1e-13 for p in bm.faces)
        if boundary or nonmanifold or degenerate:
            raise RuntimeError(f'{obj.name}: {boundary} boundary / {nonmanifold} nonmanifold edges / {degenerate} degenerate faces in {"mobile" if light else "high"}')
        bm.free()
        # Retain authored normals and UV seams in the indexed vertex key.
        material=obj.data.materials[0].name
        rows=[]
        for tri in mesh.loop_triangles:
            for loop in tri.loops:
                co=obj.matrix_world@mesh.vertices[mesh.loops[loop].vertex_index].co
                normal=obj.matrix_world.to_3x3().inverted().transposed()@mesh.corner_normals[loop].vector;normal.normalize()
                rows.append((co.x,co.z,-co.y,normal.x,normal.z,-normal.y,*uv[loop].uv))
        part={'name':obj.name,'start':len(buckets[material]),'count':len(rows)}
        if obj.get('sewn_surface'):part.update(surface=obj['sewn_surface'],radius=obj['sewn_radius'])
        parts[material].append(part)
        ev.to_mesh_clear();buckets[material].extend(rows)
    result=[]
    # Offline local AO is part of the asset, independent of camera/depth precision.
    # Keep it restrained so it does not double-darken the architectural bake.
    all_rows=np.concatenate([np.array(rows,dtype=np.float32) for rows in buckets.values()])
    # Every material uses one model-wide grid. Equal authored positions must
    # decode identically on both sides of a material/UV boundary.
    lo=np.round(all_rows[:,:3],6).min(axis=0);hi=np.round(all_rows[:,:3],6).max(axis=0);span=np.maximum(hi-lo,1e-6)
    bvh=BVHTree.FromPolygons([Vector((p[0],p[1],p[2])) for p in all_rows],[(i,i+1,i+2) for i in range(0,len(all_rows),3)],all_triangles=True)
    for material,rows in buckets.items():
        data=np.array(rows,dtype=np.float32)
        # LODs use reduced bevel/surface sampling via a conservative planar
        # decimator below; export itself never drops triangles arbitrarily.
        unique,indices=np.unique(np.round(data,6),axis=0,return_inverse=True)
        if len(unique)>65535:raise RuntimeError('WebGL1 16-bit mesh budget exceeded')
        pos=np.round((unique[:,:3]-lo)/span*65535).astype('<u2')
        normals=np.round(unique[:,3:6]*127).astype('i1')
        uvlo=unique[:,6:8].min(axis=0);uvsize=np.maximum(unique[:,6:8].max(axis=0)-uvlo,1e-6)
        uvs=np.round((unique[:,6:8]-uvlo)/uvsize*65535).astype('<u2')
        idx=indices.astype('<u2')
        ao=np.ones(len(unique),dtype=np.uint8)*255
        samples=20 if not light else 12
        for vertex,row in enumerate(unique):
            origin=Vector(row[:3]);normal=Vector(row[3:6]);normal.normalize();tangent=normal.cross(Vector((0,1,0)) if abs(normal.y)<.9 else Vector((1,0,0))).normalized();bitangent=normal.cross(tangent);blocked=0
            for ray in range(samples):
                radius=math.sqrt((ray+.5)/samples);a=ray*2.39996323;direction=tangent*(radius*math.cos(a))+bitangent*(radius*math.sin(a))+normal*math.sqrt(1-radius*radius)
                hit,_,_,distance=bvh.ray_cast(origin+normal*.003,direction,.22)
                if hit is not None:blocked+=1-distance/.22
            ao[vertex]=int(255*(1-.32*blocked/samples))
        b64=lambda a:base64.b64encode(a.tobytes()).decode()
        result.append({'material':material,'min':lo.tolist(),'size':span.tolist(),'position':b64(pos),'normal':b64(normals),'uvMin':uvlo.tolist(),'uvSize':uvsize.tolist(),'uv':b64(uvs),'ao':b64(ao),'index':b64(idx),'vertices':len(unique),'triangles':len(indices)//3,'parts':parts[material]})
    return result

output={'version':1,'authoringScriptSha256':hashlib.sha256(Path(__file__).read_text(encoding='utf-8').encode()).hexdigest(),'units':'metres','coordinateSystem':'x,y-up,z-plan','source':'scripts/rebuild_scene_assets.py / reference-a-master.blend','models':{},'quality':{}}
for model,objects in models.items():
    output['models'][model]={'high':encode(objects,False)}
    # Evaluate a lower geometric LOD offline, maintaining all UV and material seams.
    for obj in objects:
        if len(obj.data.polygons)>150:
            mod=obj.modifiers.new('Mobile geometric LOD','DECIMATE');mod.ratio=.48;mod.use_collapse_triangulate=True
    output['models'][model]['mobile']=encode(objects,True)
    output['quality'][model]={lod:{'triangles':sum(m['triangles'] for m in meshes),'vertices':sum(m['vertices'] for m in meshes),'drawGroups':len(meshes)} for lod,meshes in output['models'][model].items()}
(OUT/'models.json').write_text(json.dumps(output,separators=(',',':'))+'\n',encoding='utf-8')
(OUT/'model-report.json').write_text(json.dumps({'units':'metres','models':output['quality'],'sourceObjects':sum(len(v) for v in models.values()),'editableMaster':'reference-a-master.blend'},indent=2)+'\n')
print('MODEL_ASSETS',json.dumps(output['quality']))
