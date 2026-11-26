"""Compare linear sky transport on the unchanged roof and packed precision.
Metrics describe transport noise, not final visual acceptance or screen retouching.
"""
from pathlib import Path
import base64,io,json,gzip,subprocess
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
ROOT=Path(__file__).resolve().parents[1]
baseline=ROOT/'work/surface-fixes/before-static.json'
old=json.loads(baseline.read_text(encoding='utf-8') if baseline.exists() else subprocess.check_output(['git','show','b3dc71b:assets/static-bake/static-lighting.json'],cwd=ROOT).decode('utf-8'))
new=json.loads((ROOT/'assets/static-bake/static-lighting.json').read_text(encoding='utf-8'))
scene=json.loads(gzip.decompress((ROOT/'assets/static-bake/scene.json.gz').read_bytes()))
def decode(spec):
    a=np.asarray(Image.open(io.BytesIO(base64.b64decode(spec['image'].split(',')[1]))),dtype=np.float64)[::-1,:,:3]
    a=(a[:,::2]*256+a[:,1::2])/65535 if spec.get('precision')==16 else a/255
    return a if spec['range']==1 else a*a*spec['range']
def lowpass(a):
    for _ in range(2):
        for axis in [0,1]:
            pads=[(0,0)]*a.ndim;pads[axis]=(2,2);p=np.pad(a,pads,mode='edge')
            a=sum(np.take(p,np.arange(a.shape[axis])+i,axis=axis)*w for i,w in enumerate([1/16,4/16,6/16,4/16,1/16]))
    return a
report={'scope':'Linear irradiance residual on unchanged roof UV interior; not a visual quality score','layouts':{},'precision':{}}
for layout in ['bare','a']:
    size=new['atlasSize'];mask=Image.new('L',(size,size));draw=ImageDraw.Draw(mask);rx,ry,rw,rh=new['rects']['130']
    o=next(o for o in scene['layouts'][layout]['objects'] if o['bakeId']==130)
    uv=np.array(o['uv2']).reshape(-1,2);idx=np.array(o['indices']).reshape(-1,3);n=np.array(o['normals']).reshape(-1,3)
    for t in idx:
        if n[t].mean(axis=0)[1]>-.5:continue
        draw.polygon([(rx+float(uv[i,0])*rw,ry+float(uv[i,1])*rh) for i in t],fill=255)
    inside=np.asarray(mask.filter(ImageFilter.MinFilter(15)))>0
    values={}
    for label,data in [('before',old),('after',new)]:
        a=decode(data['layouts'][layout]['atlas']['sky']).mean(axis=2)
        residual=(a-lowpass(a))[inside]
        values[label]={'pixels':int(inside.sum()),'meanIrradiance':float(a[inside].mean()),'residualRMS':float(np.sqrt(np.mean(residual**2))),'medianAbsoluteResidual':float(np.median(np.abs(residual)))}
    values['residualRatio']=values['after']['residualRMS']/values['before']['residualRMS']
    values['meanRatio']=values['after']['meanIrradiance']/values['before']['meanIrradiance']
    values['medianResidualRatio']=values['after']['medianAbsoluteResidual']/values['before']['medianAbsoluteResidual']
    # RMS includes physical wall/contact boundaries inside the shared roof.
    # Median absolute residual measures typical smooth interior texels.
    assert values['residualRatio']<1,values
    assert values['medianResidualRatio']<.75,values
    assert .75<values['meanRatio']<1.25,values
    report['layouts'][layout]=values
for lod,key in [('high','vertices'),('mobile','mobileVertices')]:
    spec=new['layouts']['a'][key]['sky'];assert spec['precision']==16
    a=np.asarray(Image.open(io.BytesIO(base64.b64decode(spec['image'].split(',')[1]))))
    active=(a[:,::2,:3]!=0)|(a[:,1::2,:3]!=0)
    fraction=float(np.mean(a[:,1::2,:3][active]!=0));assert fraction>.95
    report['precision'][lod]={'bits':16,'nonzeroLowByteFraction':fraction}
x=np.linspace(.002,.08,5000)
errors={str(bits):float(np.sqrt(np.mean(((np.round(np.sqrt(x/8)*(2**bits-1))/(2**bits-1))**2*8-x)**2))) for bits in [8,16]}
assert errors['16']<errors['8']/100
report['precision']['darkRadianceRoundtripRMS']=errors
report['result']='passed'
(ROOT/'validation/surface-bake.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2))
