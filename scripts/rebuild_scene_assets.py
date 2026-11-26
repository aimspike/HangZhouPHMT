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
from mathutils import Vector, Matrix
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
COLORS.update(porcelain=(.91,.90,.87,1),applianceWhite=(.91,.90,.86,1),graphite=(.025,.028,.03,1),smokeGlass=(.015,.024,.03,1),mirror=(.45,.53,.54,1),glow=(1,.9,.7,1),showerGlass=(.78,.88,.87,.13),tile=(.73,.70,.64,1),stone=(.67,.65,.58,1),stainless=(.52,.56,.54,1),silicone=(.58,.55,.49,1))
for name, color in COLORS.items():
    m=bpy.data.materials.new(name);m.diffuse_color=color;m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=color
    p.inputs['Roughness'].default_value=.42 if name=='stainless' else .19 if name=='chrome' else .37 if name in ('wood','oak','ceramic') else .8
    p.inputs['Metallic'].default_value=1 if name in ('chrome','brass') else .92 if name=='stainless' else 0
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

def sampled_slab(name,width,depth,height,mat):
    # Vertex transport needs interior floor samples, not four occluded corners.
    n=12;vertices=[];faces=[];stride=n+1;plane=stride*stride
    for y in [0,height]:
        for k in range(stride):
            for j in range(stride):vertices.append(xyz((-width/2+width*j/n,y,-depth/2+depth*k/n)))
    for k in range(n):
        for j in range(n):
            a=k*stride+j;b=a+1;c=a+stride+1;d=a+stride
            faces.append((a,b,c,d));faces.append((plane+a,plane+d,plane+c,plane+b))
    boundary=list(range(stride))+[k*stride+n for k in range(1,stride)]+[n*stride+j for j in range(n-1,-1,-1)]+[k*stride for k in range(n-1,0,-1)]
    for i,a in enumerate(boundary):b=boundary[(i+1)%len(boundary)];faces.append((a,plane+a,plane+b,b))
    me=bpy.data.meshes.new(name);me.from_pydata(vertices,[],faces);me.update();ob=bpy.data.objects.new(name,me);scene.collection.objects.link(ob);finish(ob,name,mat)
    for p in me.polygons:p.use_smooth=False
    ob['preserve_surface']=True;return ob

def ceramic_shell(name,profiles,planes=(),material='porcelain'):
    # Equal regular rings, with single vertices at poles. No collapsed fans.
    vertices=[];rings=[];faces=[];owners=[];count=96
    for kind,rx,rz,y,cz,*radius in profiles:
        ring=[]
        for j in range(count if rx else 1):
            a=2*math.pi*j/count
            if kind=='rect':
                # Match the ellipse's angular parameter. Starting a rectangle
                # at its corner twists the deck-to-bowl quad strips.
                r=radius[0] if radius else .012;lo=0.;hi=2.
                for _ in range(32):
                    t=(lo+hi)/2;x=rx*math.cos(a)*t;z=rz*math.sin(a)*t
                    qx=abs(x)-(rx-r);qz=abs(z)-(rz-r)
                    distance=math.hypot(max(qx,0),max(qz,0))+min(max(qx,qz),0)-r
                    if distance>0:hi=t
                    else:lo=t
                x=rx*math.cos(a)*(lo+hi)/2;z=rz*math.sin(a)*(lo+hi)/2
            else:x=rx*math.cos(a);z=rz*math.sin(a)
            ring.append(len(vertices));vertices.append(xyz((x,y,z+cz)));owners.append((len(rings),j))
        rings.append(ring)
    for i,first in enumerate(rings):
        second=rings[(i+1)%len(rings)]
        if len(first)==len(second)==1:continue
        for j in range(count):
            k=(j+1)%count
            if len(first)==1:faces.append((first[0],second[j],second[k]))
            elif len(second)==1:faces.append((first[j],second[0],first[k]))
            else:faces.append((first[j],second[j],second[k],first[k]))
    me=bpy.data.meshes.new(name);me.from_pydata(vertices,[],faces);me.update();ob=bpy.data.objects.new(name,me);scene.collection.objects.link(ob);finish(ob,name,material);ob['preserve_surface']=True
    normals=[]
    for poly in me.polygons:
        for li in poly.loop_indices:
            vi=me.loops[li].vertex_index;i,j=owners[vi];ring=rings[i]
            if len(ring)==1:normal=Vector((0,0,1 if poly.normal.z>=0 else -1))
            elif i in planes and abs(poly.normal.z)>.999:normal=Vector((0,0,1 if poly.normal.z>=0 else -1))
            else:
                tangent=Vector(vertices[ring[(j+1)%count]])-Vector(vertices[ring[(j-1)%count]])
                a=rings[(i-1)%len(rings)];b=rings[(i+1)%len(rings)];slope=Vector(vertices[b[j%len(b)]])-Vector(vertices[a[j%len(a)]])
                normal=tangent.cross(slope).normalized()
                if normal.dot(poly.normal)<0:normal=-normal
            normals.append(normal)
    me.normals_split_custom_set(normals);return ob

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
for z in [-.35,.34]:tube('welded cross member',[(-1.026,.2,z),(1.026,.2,z)],.012,'chrome')
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
for side in [-1,1]:cube('attached tray edge rail',(0,.420,side*.320),(.71,.022,.014),'black',.003,3)
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
cube('centre shelf',(0,.28,.004),(.454,.018,.3),'oak',.002)
cube('media receiver',(0,.191,.02),(.32,.08,.23),'black',.006)
for x in [-.61,.61]:
    tube('bent console legs',[(x,.015,.135),(x,.46,.135),(x,.49,.1),(x,.49,-.1),(x,.46,-.135),(x,.015,-.135)],.009,'chrome')

current='dining-table'
lathe('edge-profiled round tabletop',[(0,.714),(.545,.714),(.572,.721),(.58,.733),(.58,.757),(.57,.773),(.55,.779),(0,.779)],'oak',80)
lathe('turned pedestal',[(0,.035),(.19,.035),(.2,.06),(.19,.1),(.11,.25),(.09,.55),(.16,.720),(0,.720)],'wood',64)
lathe('chromed flared foot',[(0,.02),(.29,.02),(.31,.029),(.31,.045),(.29,.055),(0,.055)],'chrome',64)

current='chair'
o=cube('seat cushion',(0,.45,0),(.43,.075,.43),'linen',.032,5,True)
seam('seat piping',0,.487,0,.4,.4,'linen',o)
cube('seat mounting pan',(0,.441,0),(.38,.045,.38),'black',.004)
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
    tube('rear arm attachment',[(x,.65,.095),(x,.65,.236)],.008,'chrome')
    for yy in [.65,.80]:
        zz=.184+.12*(1-(x/.23)**2)
        tube('back fixing boss',[(x,yy,zz-.003),(x,yy,.235+(yy-.62)/.21*.035)],.012,'black')
tube('welded front frame tie',[(-.202,.038,-.195),(.202,.038,-.195)],.008,'chrome')

current='pendant'
lathe('spun shade lower',[(.025,2.19),(.07,2.19),(.15,2.22),(.18,2.24),(.18,2.246),(.14,2.236),(.06,2.212),(.025,2.212)],'orange',64)
lathe('spun shade upper',[(.02,2.24),(.12,2.27),(.23,2.3),(.24,2.31),(.24,2.318),(.21,2.318),(.1,2.29),(.02,2.265)],'orange',64)
lathe('top shade',[(.018,2.29),(.09,2.32),(.27,2.35),(.27,2.36),(.24,2.36),(.08,2.34),(.018,2.31)],'orange',64)
lathe('socket',[(0,2.34),(.025,2.34),(.025,2.43),(.018,2.43),(.018,2.35),(0,2.35)],'cream',32)
lathe('continuous shade hub',[(0,2.185),(.031,2.185),(.031,2.365),(0,2.365)],'cream',32)
tube('fabric flex',[(0,2.345,0),(.005,2.61,.008),(0,2.79,0)],.0025,'cream')

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
    cube('recessed plinth',(0,.057,.015),(width-.06,.114,depth-.05),'black',.002)
    # Panels terminate inside the side/back boards. No coincident outer skins.
    cube('base panel',(0,.12,.006),(width-.036,.018,depth-.012),'wood',.002)
    cube('top panel',(0,height-.009,0),(width-.036,.018,depth),'cream',.002)
    # Wall-contact faces on the corner wardrobe stay planar up to their edges.
    for x in [-width/2+.009,width/2-.009]:cube('laminated end panel',(x,height/2,0),(.018,height,depth),'cream',0 if id=='second-wardrobe' and x>0 else .002)
    cube('backing panel',(0,height/2,-depth/2+.006),(width-.036,height-.04,.012),'cream',0 if id=='second-wardrobe' else .001)
    for i in range(1,doors):cube('internal hinge partition',(-width/2+width*i/doors,height/2,0),(.018,height-.04,depth-.036),'cream',.001)
    for i in range(doors):
        x=-width/2+width*(i+.5)/doors
        cube('panel door',(x,(height+.12)/2,depth/2+.009),(width/doors-.003,height-.14,.018),'cream',.0025)
        cube('brushed vertical handle',(x+width/doors/2-.045,1.15,depth/2+.027),(.007,.32,.014),'brass',.003)
        for y in [1.02,1.28]:cube('handle mounting foot',(x+width/doors/2-.045,y,depth/2+.019),(.009,.022,.018),'brass',.002)
        for y in [.45,height-.4]:cube('concealed hinge body',(x-width/doors/2+.022,y,depth/2-.01),(.04,.06,.044),'chrome',.003)

cabinetry('master-wardrobe',1.6,2.4,.6)
cabinetry('second-wardrobe',1.5,2.4,.55)

current='sideboard'
cube('cabinet bottom',(0,.13,.00875),(1.024,.018,.2625),'wood',.002)
cube('oak counter',(0,.815,0),(1.06,.027,.28),'oak',.004)
for x in [-.521,.521]:cube('side panel',(x,.47,0),(.018,.68,.28),'wood',.002)
cube('back board',(0,.46,-.13),(1.024,.66,.015),'wood',.001)
for x in [-.35,0,.35]:cube('partition',(x,.47,0),(.018,.66,.26),'wood',.002)
for x,col in [(-.355,'cream'),(0,'blue'),(.355,'wood')]:
    cube('inset cabinet door',(x,.475,.142),(.352,.63,.018),col,.003)
    cube('door mounting block',(x,.45,.13),(.04,.12,.018),'wood',.001)
    cube('shadow gap pull',(x,.775,.153),(.18,.009,.008),'black',.002)
for x in [-.44,.44]:
    for z in [-.09,.09]:move(lathe('slender leg',[(0,0),(.01,0),(.012,.13),(0,.13)],'chrome',16),(x,0,z))

current='fridge'
cube('ivory coated cabinet',(0,1,0),(.62,1.98,.68),'applianceIvory',.022,5)
cube('upper flat door',(0,1.45,-.347),(.6,1.04,.032),'applianceIvory',.012,4)
cube('freezer flat door',(0,.465,-.347),(.6,.89,.032),'applianceIvory',.012,4)
cube('door gasket',(0,.986,-.365),(.59,.012,.004),'black',.002)
cube('recessed upper grip',(0,.925,-.35),(.49,.014,.016),'black',.003)
cube('recessed freezer grip',(0,.908,-.35),(.49,.01,.016),'black',.003)
cube('subtle control strip',(.19,1.7,-.3635),(.032,.12,.002),'black',.0005)
cube('toe ventilation',(0,.06,-.351),(.54,.05,.01),'black',.003)
for j in range(16):cube('vent fin',(-.25+j*.033,.06,-.358),(.004,.044,.004),'applianceIvory',.001)

current='kitchen-east'
# Local X is cabinet run, local +Z faces the room. Rotation maps it west.
cube('toe kick',(0,.085,-.012),(2.49,.17,.51),'black',.002)
cube('carcass bottom',(0,.17,.009),(2.494,.018,.602),'wood',.002)
cube('stone worktop',(0,.91,.02),(2.56,.055,.67),'ceramic',.005,4)
for x in [-1.256,1.256]:cube('side return',(x,.528,0),(.018,.714,.62),'oak',.002)
cube('carcass backing',(0,.528,-.301),(2.494,.714,.018),'wood',.002)
cube('counter front support',(0,.866,.287),(2.51,.038,.026),'wood',.002)
for j in range(5):
    x=-1.012+j*.506
    cube('veneered base front',(x,.522,.317),(.503,.714,.018),'wood',.003)
    cube('brushed handle bar',(x,.72,.34),(.192,.012,.012),'chrome',.004)
    for dx in [-.09,.09]:cube('handle mounting foot',(x+dx,.72,.33),(.012,.012,.024),'chrome',.003)
    if j in [0,1]:
        for yy in [.38,.6]:cube('drawer shadow joint',(x,yy,.328),(.478,.004,.003),'black',.001)

current='kitchen-north'
cube('toe kick',(-.015,.089,0),(1.,.178,.49),'black',.002)
cube('carcass bottom',(-.015,.179,.009),(.964,.018,.572),'oak',.002)
for x in [-.506,.476]:cube('cabinet end',(x,.532,0),(.018,.706,.59),'oak',.002)
cube('cabinet back',(-.015,.532,-.286),(.964,.706,.018),'oak',.002)
cube('counter front support',(-.015,.866,.275),(.964,.038,.026),'oak',.002)
# One closed countertop ring, with a real opening and no overlapping strips.
# Its right end butts against the east worktop instead of penetrating it.
counter=ceramic_shell('single opening countertop',[
 ('rect',.515,.315,.8825,0,.002),('rect',.515,.315,.9355,0,.002),
 ('rect',.513,.313,.9375,0,.002),('rect',.414,.210,.9375,0,.027),
 ('rect',.414,.210,.9315,0,.027),('rect',.390,.185,.9315,0,.020),
 ('rect',.390,.185,.8825,0,.020)],planes=[0,2,3,4,5,6],material='ceramic')
move(counter,(-.015,0,0))
seal=ceramic_shell('flush sink perimeter seal',[
 ('rect',.414,.210,.9345,0,.027),('rect',.414,.210,.9375,0,.027),
 ('rect',.412,.208,.9375,0,.025),('rect',.412,.208,.9345,0,.025)],planes=[0,1,2,3],material='silicone')
move(seal,(-.015,0,0))
sink=ceramic_shell('satin stainless sink vessel',[
 ('rect',.412,.208,.936,0,.025),('rect',.412,.208,.940,0,.025),('rect',.410,.206,.942,0,.027),
 ('rect',.369,.166,.942,0,.035),('rect',.361,.158,.940,0,.037),('rect',.354,.151,.935,0,.038),
 ('rect',.348,.145,.926,0,.040),('rect',.344,.141,.908,0,.041),('rect',.343,.140,.840,0,.041),
 ('rect',.337,.134,.818,0,.041),('rect',.325,.122,.802,0,.040),('rect',.305,.102,.795,0,.036),
 ('rect',.28,.084,.793,0,.030),('ellipse',0,0,.793,0),('ellipse',0,0,.789,0),
 ('rect',.28,.084,.789,0,.030),('rect',.307,.104,.791,0,.036),('rect',.329,.127,.799,0,.040),
 ('rect',.347,.144,.835,0,.041),('rect',.352,.154,.925,0,.038),('rect',.365,.167,.936,0,.035)],
 planes=[2,3,12,13,14,15],material='stainless')
move(sink,(-.015,-.0045,0))
move(lathe('sink strainer flange',[(0,.792),(.026,.792),(.028,.796),(.025,.799),(0,.799)],'stainless',48),(-.015,-.0045,0))
for a in range(8):
    x=-.015+.017*math.cos(a*math.pi/4);z=.017*math.sin(a*math.pi/4)
    move(lathe('strainer drainage slot',[(0,.798),(.002,.798),(.002,.800),(0,.800)],'graphite',12),(x,-.0045,z))
for x,width in [(-.26,.517),(.245,.487)]:
    cube('cabinet door',(x,.53,.303),(width,.69,.018),'wood',.003)
    tube('mounted cabinet pull',[(x-.07,.72,.310),(x-.07,.72,.327),(x+.07,.72,.327),(x+.07,.72,.310)],.005,'chrome')

current='study-desk'
cube('veneered writing top',(0,.75,0),(.73,.055,1.38),'oak',.006)
for z in [-.58,.58]:
    for x in [-.3,.3]:cube('desk welded upright',(x,.368,z),(.026,.706,.026),'chrome',.005)
    cube('desk welded top rail',(0,.71,z),(.580,.026,.022),'chrome',.005)
cube('slim drawer',(0,.674,0),(.6,.1,.8),'wood',.003)
cube('recessed drawer pull',(.301,.674,0),(.006,.012,.15),'black',.002)

current='vanity'
# Suspended oak drawers with an inset basin and a wall-mounted mixer.
for x in [-.371,.371]:cube('floating cabinet side',(x,.575,0),(.018,.410,.40),'wood',.002)
cube('cabinet bottom',(0,.379,0),(.724,.018,.40),'wood',.002)
cube('cabinet back',(0,.575,.191),(.724,.392,.018),'wood',.001)
for yy,hh in [(.4775,.195),(.6825,.185)]:
    cube('inset oak drawer',(0,yy,-.207),(.730,hh,.018),'oak',.003)
    cube('integrated finger pull',(0,yy+hh/2-.008,-.218),(.66,.009,.004),'graphite',.001)
for x in [-.27,.27]:cube('hidden wall bracket',(x,.68,.204),(.06,.16,.032),'chrome',.001)
ceramic_shell('continuous inset basin deck',[
 ('rect',.40,.201,.780,0),('rect',.40,.201,.842,0),('rect',.395,.196,.850,0),
 ('rect',.32,.18,.850,-.01),('ellipse',.257,.157,.850,-.025),('ellipse',.249,.149,.850,-.025),
 ('ellipse',.243,.143,.848,-.025),('ellipse',.236,.136,.842,-.025),('ellipse',.227,.128,.831,-.025),
 ('ellipse',.215,.119,.814,-.025),('ellipse',.198,.106,.792,-.025),('ellipse',.174,.089,.768,-.025),
 ('ellipse',.143,.070,.748,-.025),('ellipse',.105,.049,.735,-.025),('ellipse',.055,.025,.730,-.025),
 ('ellipse',0,0,.730,-.025),('ellipse',0,0,.715,-.025),('ellipse',.055,.028,.715,-.025),
 ('ellipse',.12,.061,.721,-.025),('ellipse',.165,.09,.740,-.025),('ellipse',.211,.122,.766,-.025),('ellipse',.26,.16,.780,-.025)],planes=[2,3,4,5,14,15,16,17])
move(lathe('basin drain cap',[(0,.729),(.018,.729),(.018,.733),(0,.733)],'chrome',40),(0,0,-.025))
cube('vertical tile backsplash',(0,1.215,.2105),(.80,1.81,.019),'tile',.001)
cube('mirror illuminated surround',(0,1.59,.190),(.66,.80,.024),'glow',.027,6)
cube('mirror slim metal backing',(0,1.59,.173),(.632,.772,.014),'graphite',.026,6)
cube('rounded mirror face',(0,1.59,.163),(.612,.752,.006),'mirror',.025,6)
cube('mixer wall rosette',(0,1.075,.195),(.07,.07,.014),'chrome',.006)
tube('wall mixer spout',[(0,1.075,.194),(0,1.075,.11),(0,1.075,.015),(0,1.051,.008)],.012,'chrome')
cube('mixer lever rosette',(.11,1.075,.195),(.065,.065,.014),'chrome',.005)
cube('slim mixer lever',(.11,1.085,.175),(.045,.01,.038),'chrome',.003)

current='toilet'
ceramic_shell('one piece ceramic bowl',[
 ('ellipse',0,0,.006,-.025),('ellipse',.13,.19,.006,-.025),('ellipse',.147,.212,.025,-.025),
 ('ellipse',.155,.23,.11,-.015),('ellipse',.169,.25,.24,.005),('ellipse',.188,.278,.35,.020),
 ('ellipse',.193,.282,.391,.025),('ellipse',.190,.28,.402,.025),('ellipse',.151,.224,.402,.025),
 ('ellipse',.145,.217,.39,.025),('ellipse',.135,.20,.36,.025),('ellipse',.116,.165,.31,.018),
 ('ellipse',.085,.12,.25,.008),('ellipse',.043,.065,.211,0),('ellipse',0,0,.204,0)],planes=[0,1,7,8])
ceramic_shell('soft close oval seat',[
 ('ellipse',.191,.279,.415,.025),('ellipse',.197,.285,.421,.025),('ellipse',.197,.285,.432,.025),
 ('ellipse',.190,.278,.438,.025),('ellipse',.145,.224,.438,.025),('ellipse',.139,.218,.432,.025),
 ('ellipse',.139,.218,.421,.025),('ellipse',.145,.224,.415,.025)],planes=[3,4,7,0])
for x in [-.131,.131]:
    for z in [-.13,.16]:cube('seat support bumper',(x,.4085,z),(.018,.017,.026),'applianceWhite',.004)
cube('ceramic rear bridge',(0,.35,-.26),(.28,.12,.14),'porcelain',.014,5)
cube('one piece cistern',(0,.559,-.35),(.35,.322,.15),'porcelain',.035,8)
cube('cistern top lid',(0,.729,-.35),(.352,.024,.152),'porcelain',.010,5)
cube('dual flush button',(0,.743,-.35),(.087,.008,.037),'chrome',.008,4)
cube('dual flush split',(.008,.7475,-.35),(.002,.001,.029),'graphite',.0004)
for x in [-.109,.109]:
    cube('soft close hinge base',(x,.412,-.249),(.045,.018,.035),'chrome',.006)
    cube('hinge pivot cover',(x,.438,-.249),(.029,.042,.027),'porcelain',.008)
lid=ceramic_shell('raised oval lid',[
 ('ellipse',0,0,.440,.018),('ellipse',.185,.272,.440,.018),('ellipse',.194,.281,.448,.018),
 ('ellipse',.193,.28,.459,.018),('ellipse',.184,.271,.465,.018),('ellipse',0,0,.465,.018)],planes=[0,1,4,5])
pivot=Vector(xyz((0,.443,-.255)));lid.matrix_world=Matrix.Translation(pivot)@Matrix.Rotation(math.radians(-82),4,'X')@Matrix.Translation(-pivot)@lid.matrix_world

current='shower'
# Compact north-east corner enclosure. Every glass sheet has actual thickness.
sampled_slab('low stone shower tray',.78,.80,.036,'stone')
for x in [-.381,.381]:cube('tray side upstand',(x,.043,0),(.018,.020,.80),'stone',.003)
for z in [-.391,.391]:cube('tray end upstand',(0,.043,z),(.744,.020,.018),'stone',.003)
cube('linear drain recessed bed',(0,.038,-.29),(.45,.004,.042),'graphite',.002)
for x in [-.225,.225]:cube('drain trim end',(x,.041,-.29),(.006,.006,.042),'chrome',.001)
for z in [-.309,-.271]:cube('drain trim side',(0,.041,z),(.444,.006,.004),'chrome',.001)
for x in [-.20,-.15,-.10,-.05,0,.05,.10,.15,.20]:cube('drain grate bridge',(x,.040,-.29),(.019,.003,.034),'chrome',.001)
for x,z in [(-.381,-.391),(-.381,.391),(.381,.391)]:cube('18 mm enclosure upright',(x,1.075,z),(.018,2.05,.018),'graphite',.002)
cube('side upper rail',(-.381,2.098,0),(.018,.018,.782),'graphite',.002)
cube('front upper rail',(0,2.098,.391),(.744,.018,.018),'graphite',.002)
cube('side lower channel',(-.381,.064,0),(.018,.022,.782),'graphite',.002)
cube('8 mm fixed side glass',(-.381,1.075,0),(.008,1.998,.764),'showerGlass',.0008,2)
cube('8 mm shower door',(0,1.075,.391),(.744,1.998,.008),'showerGlass',.0008,2)
for y in [.40,1.75]:
    cube('glass door hinge',(-.363,y,.391),(.042,.066,.020),'chrome',.004)
    cube('hinge axle',(-.376,y,.391),(.012,.070,.024),'chrome',.004)
for z in [.371,.411]:
    tube('vertical door pull',[(.265,.94,z),(.265,1.12,z)],.008,'chrome')
    for y in [.94,1.12]:cube('door pull mounting foot',(.265,y,(z+.391)/2),(.016,.016,.032),'chrome',.003)
cube('door magnetic seal',(.371,1.075,.391),(.005,1.998,.011),'graphite',.001)
for y in [1.04,1.82]:cube('shower pipe wall rosette',(.08,y,-.388),(.055,.055,.024),'chrome',.006)['wall_mount']=True
tube('rain shower riser',[(.08,1.04,-.365),(.08,2.03,-.365),(.08,2.08,-.33),(.08,2.08,-.06)],.012,'chrome')
move(lathe('overhead rain shower',[(0,2.067),(.095,2.067),(.102,2.073),(.102,2.085),(.095,2.090),(0,2.090)],'chrome',64),(.08,0,-.06))
for x,z in [(-.045,-.045),(0,-.055),(.045,-.045),(-.055,0),(0,0),(.055,0),(-.045,.045),(0,.055),(.045,.045)]:move(lathe('rain head silicone nozzle',[(0,2.064),(.004,2.064),(.004,2.068),(0,2.068)],'graphite',12),(.08+x,0,-.06+z))
cube('thermostatic mixer body',(.08,1.025,-.355),(.30,.046,.058),'chrome',.016,5)
for x in [-.055,.215]:cube('mixer end control',(x,1.025,-.355),(.036,.050,.061),'chrome',.014,4)
tube('hand shower hose',[(.18,1.01,-.34),(.20,.55,-.33),(.28,.47,-.32),(.29,1.33,-.33)],.005,'chrome')
tube('hand shower handle',[(.29,1.30,-.33),(.29,1.47,-.30)],.014,'chrome')
o=lathe('hand shower head',[(0,0),(.034,0),(.038,.008),(.038,.020),(.034,.025),(0,.025)],'chrome',40);o.rotation_euler.x=math.pi/2;o.location=Vector(xyz((.29,1.50,-.30)))
cube('hand shower wall clip',(.29,1.35,-.365),(.043,.065,.070),'chrome',.006)['wall_mount']=True
cube('wall soap shelf',(-.20,1.20,-.33),(.26,.018,.11),'graphite',.005)
cube('shelf mounting bracket',(-.20,1.22,-.392),(.20,.08,.016),'graphite',.002)['wall_mount']=True
for x,h in [(-.26,.16),(-.15,.135)]:
    cube('shower bottle',(x,1.208+h/2,-.33),(.060,h,.046),'applianceWhite',.008)
    cube('bottle pump',(x,1.211+h,-.33),(.044,.012,.023),'graphite',.003)

def front_lathe(name,profile,p,mat='graphite',segments=64):
    obj=lathe(name,profile,mat,segments)
    obj.rotation_euler.x=-math.pi/2
    obj.location=Vector(xyz(p))
    return obj

current='laundry-stack'
# East-wall cabinet, local front -Z. Two independent 840 mm appliance bodies.
for x in [-.331,.331]:cube('full height cabinet side',(x,1.12,0),(.018,2.24,.68),'applianceWhite',.002)
cube('wall backing',(0,1.12,.331),(.644,2.24,.018),'applianceWhite',.001)
for y in [.009,.909,1.8,2.231]:cube('structural shelf',(0,y,-.009),(.644,.018,.662),'oak',.002)
for base,dryer in [(.048,False),(.936,True)]:
    label='dryer' if dryer else 'washer'
    cube(label+' enamel shell',(0,base+.42,.011),(.596,.84,.60),'applianceWhite',.014,5)
    cube(label+' flush front',(0,base+.42,-.294),(.585,.818,.026),'applianceWhite',.009,4)
    for x in [-.245,.245]:
        for z in [-.23,.23]:cube(label+' adjustable foot',(x,base-.015,z),(.038,.03,.038),'graphite',.003)
    centre=base+.402
    front_lathe(label+' dark door gasket',[(0,0),(.231,0),(.231,.012),(0,.012)],(0,centre,-.307))
    front_lathe(label+' rounded charcoal door ring',[(.183,.008),(.222,.008),(.229,.023),(.226,.041),(.212,.049),(.185,.042)],(0,centre,-.307))
    front_lathe(label+' curved smoked lens',[(0,.014),(.180,.014),(.187,.026),(.180,.039),(.13,.046),(0,.049)],(0,centre,-.307),'smokeGlass')
    cube(label+' recessed side grip',(.212,centre,-.343),(.024,.105,.018),'graphite',.007)
    if dryer:
        cube('dryer black full width control panel',(0,base+.746,-.309),(.572,.102,.015),'graphite',.005)
        cube('dryer compact display',(.126,base+.750,-.317),(.126,.027,.002),'smokeGlass',.001)
        for x in [.08,.115,.15]:cube('dryer display indicator',(x,base+.75,-.318),(.018,.004,.001),'cream',.0003)
    else:
        cube('washer slim touch capsule',(.13,base+.751,-.310),(.238,.049,.011),'graphite',.012,5)
        cube('washer detergent drawer',(-.178,base+.751,-.309),(.165,.062,.008),'applianceWhite',.004)
        cube('washer drawer recessed grip',(-.18,base+.727,-.314),(.102,.005,.004),'graphite',.001)
        front_lathe('washer service access',[(0,0),(.055,0),(.057,.002),(.055,.004),(0,.004)],(.211,base+.104,-.306),'applianceWhite',40)
        for x in [.08,.115,.15]:cube('washer display indicator',(x,base+.753,-.316),(.018,.003,.001),'cream',.0003)
# Narrow face returns bridge the installation slots without faking appliance size.
for x in [-.311,.311]:cube('front installation return',(x,.909,-.313),(.024,1.782,.026),'applianceWhite',.002)
for x in [-.16,.16]:
    cube('upper storage front',(x,2.014,-.324),(.317,.410,.028),'applianceWhite',.003)
    cube('upper storage grip',(x,1.821,-.338),(.25,.012,.006),'oak',.002)
cube('upper storage divider',(0,2.015,0),(.018,.414,.644),'oak',.001)

current='balcony-vanity'
cube('recessed plinth',(0,.05,.024),(.456,.10,.49),'graphite',.002)
cube('cabinet floor',(0,.109,-.009),(.464,.018,.542),'oak',.002)
for x in [-.241,.241]:cube('basin cabinet side',(x,.4365,0),(.018,.657,.56),'applianceWhite',.002)
cube('basin cabinet backing',(0,.436,.271),(.464,.654,.018),'applianceWhite',.001)
for x in [-.12,.12]:
    cube('basin cabinet front',(x,.436,-.273),(.237,.650,.018),'applianceWhite',.003)
    cube('inset cabinet grip',(x,.749,-.284),(.19,.009,.005),'oak',.001)
# Closed manufactured basin with dense, regular rings. Straight rim regions
# retain planar normals; small bevel rings carry the curved transition.
verts=[];rings=[];faces=[]
profiles=[(.25,.28,.018,.764),(.25,.28,.018,.86),(.249,.279,.019,.872),(.246,.276,.022,.878),(.241,.271,.026,.88),(.210,.21,.035,.88),(.200,.200,.036,.880),(.195,.195,.037,.879),(.191,.191,.038,.876),(.188,.188,.039,.871),(.185,.185,.040,.863),(.181,.181,.041,.851),(.173,.172,.043,.833),(.164,.16,.044,.813),(.153,.145,.044,.793),(.143,.133,.043,.78),(.136,.126,.041,.774),(.128,.118,.038,.770),(.10,.09,.032,.770),(.07,.06,.024,.770),(.035,.03,.012,.770),(.002,.002,.001,.770),(.002,.002,.001,.760),(.035,.03,.012,.760),(.07,.06,.024,.760),(.10,.09,.032,.760),(.137,.127,.035,.760),(.147,.137,.035,.767),(.162,.154,.038,.79),(.179,.177,.038,.83),(.195,.195,.035,.852)]
# Keep equal segment counts on arc and straight runs for every ring.
for hx,hz,r,y in profiles:
    ring=[]
    corners=[(hx-r,hz-r,0),(-hx+r,hz-r,90),(-hx+r,-hz+r,180),(hx-r,-hz+r,270)]
    for ci,(cx,cz,start) in enumerate(corners):
        for j in range(8):
            a=math.radians(start+j*90/8);ring.append(len(verts));verts.append(xyz((cx+r*math.cos(a),y,cz+r*math.sin(a))))
        end=math.radians(start+90);first=(cx+r*math.cos(end),cz+r*math.sin(end));ncx,ncz,nstart=corners[(ci+1)%4];nexta=math.radians(nstart);last=(ncx+r*math.cos(nexta),ncz+r*math.sin(nexta))
        for j in range(16):
            t=j/16;ring.append(len(verts));verts.append(xyz((first[0]*(1-t)+last[0]*t,y,first[1]*(1-t)+last[1]*t)))
    rings.append(ring)
n=len(rings[0])
for i in range(len(rings)):
    if i==21:continue
    for j in range(n):k=(j+1)%n;faces.append((rings[i][j],rings[i][k],rings[(i+1)%len(rings)][k],rings[(i+1)%len(rings)][j]))
for idx,y in [(21,.770),(22,.760)]:
    centre=len(verts);verts.append(xyz((0,y,0)))
    for j in range(n):faces.append((centre,rings[idx][j],rings[idx][(j+1)%n]))
me=bpy.data.meshes.new('continuous ceramic basin');me.from_pydata(verts,[],faces);me.update();ob=bpy.data.objects.new('basin',me);scene.collection.objects.link(ob);finish(ob,'integrated ceramic basin','porcelain');ob['preserve_surface']=True
# Split normals at the lip follow local surface derivatives rather than
# averaging one giant side polygon into the whole flat deck.
loop_normals=[]
for poly in ob.data.polygons:
    for li in poly.loop_indices:
        vi=ob.data.loops[li].vertex_index
        if vi>=len(rings)*n:normal=Vector((0,0,1 if vi==len(rings)*n else -1))
        else:
            ring_index=vi//n;j=vi%n
            tangent=Vector(verts[rings[ring_index][(j+1)%n]])-Vector(verts[rings[ring_index][(j-1)%n]])
            before=max(0,ring_index-1);after=min(len(rings)-1,ring_index+1)
            if 4<ring_index<7:normal=Vector((0,0,1))
            elif 18<=ring_index<=21:normal=Vector((0,0,1))
            elif 22<=ring_index<=25:normal=Vector((0,0,-1))
            else:
                profile=Vector(verts[rings[after][j]])-Vector(verts[rings[before][j]])
                normal=tangent.cross(profile).normalized()
                if normal.dot(poly.normal)<0:normal=-normal
        loop_normals.append(normal)
ob.data.normals_split_custom_set(loop_normals)
move(lathe('drain fitting',[(0,.769),(.018,.769),(.018,.773),(0,.773)],'chrome',32),(0,0,0))
tube('basin mixer tap',[(.12,.876,.235),(.12,1.075,.235),(.10,1.10,.235),(.015,1.10,.235),(.015,1.075,.17)],.01,'chrome')
cube('mixer lever',(.153,.93,.235),(.059,.008,.015),'chrome',.003)
cube('mirror backing',(0,1.42,.269),(.46,.78,.022),'oak',.005)
cube('mirror glass',(0,1.42,.255),(.43,.75,.008),'mirror',.004)
for x in [-.241,.241]:cube('wall storage side',(x,2.025,.15),(.018,.43,.26),'applianceWhite',.001)
for y in [1.819,2.231]:cube('wall storage shelf',(0,y,.15),(.464,.018,.26),'oak',.001)
cube('wall storage backing',(0,2.025,.271),(.464,.394,.018),'applianceWhite',.001)
cube('wall storage front',(0,2.025,.011),(.462,.394,.018),'applianceWhite',.003)
for y in [1.90,2.15]:cube('wall storage concealed hinge',(-.218,y,.025),(.04,.05,.035),'chrome',.002)
cube('under cabinet task strip',(0,1.807,.04),(.40,.006,.025),'glow',.001)

# Wire every master material to the same packaged PBR sources used by the web.
for name,material in materials.items():
    key='fabric' if name=='navy' else 'fabric_plain' if name in ('linen','mustard','blue','white','rug') else 'wood' if name in ('wood','oak') else 'stone' if name in ('ceramic','stone') else None
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
        if obj.get('wall_mount'):part['wallMount']={'axis':2,'side':'min','plane':-.4}
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
        if len(obj.data.polygons)>150 and not obj.get('preserve_surface'):
            mod=obj.modifiers.new('Mobile geometric LOD','DECIMATE');mod.ratio=.48;mod.use_collapse_triangulate=True
    output['models'][model]['mobile']=encode(objects,True)
    output['quality'][model]={lod:{'triangles':sum(m['triangles'] for m in meshes),'vertices':sum(m['vertices'] for m in meshes),'drawGroups':len(meshes)} for lod,meshes in output['models'][model].items()}
(OUT/'models.json').write_text(json.dumps(output,separators=(',',':'))+'\n',encoding='utf-8')
(OUT/'model-report.json').write_text(json.dumps({'units':'metres','models':output['quality'],'sourceObjects':sum(len(v) for v in models.values()),'editableMaster':'reference-a-master.blend'},indent=2)+'\n')
print('MODEL_ASSETS',json.dumps(output['quality']))
