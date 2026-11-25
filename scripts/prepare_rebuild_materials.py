"""Create bounded, tintable PBR texture sets from the documented CC0 originals."""
import base64
from io import BytesIO
import json
from pathlib import Path
import hashlib

import numpy as np
from PIL import Image, ImageFilter

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/rebuild'
materials=OUT/'materials'
sets={'wood':('oak_veneer_01','Diffuse',None), 'fabric':('fabric_pattern_05','col_01',(45,45,290,290)), 'fabric_plain':('fabric_pattern_05','col_01',(45,45,290,290)), 'parquet':('herringbone_parquet','Diffuse',None), 'stone':('marble_01','Diffuse',(35,35,460,460))}
output={'textures':{},'images':{},'authoringScriptSha256':hashlib.sha256(Path(__file__).read_text(encoding='utf-8').encode()).hexdigest(),'sources':'assets/rebuild/materials/sources.json','normalConvention':'OpenGL +Y tangent-space','tinting':'Luminance-normalized diffuse; user material colors retained','lods':{'desktop':1024,'mobile':512}}
for name,(asset,color,crop) in sets.items():
    output['textures'][name]={}
    for lod,size in [('desktop',1024),('mobile',512)]:
        values={}
        for channel,suffix in [('color',color),('normal','nor_gl'),('roughness','Rough')]:
            image=Image.open(materials/(asset+'-'+suffix+'.jpg')).convert('RGB')
            if crop:image=image.crop(crop)
            image=image.resize((size,size),Image.Resampling.LANCZOS)
            a=np.asarray(image,dtype=np.float32)
            if channel=='color':
                luma=a@np.array([.2126,.7152,.0722]);luma=np.clip(235+(luma/np.median(luma)-1)*(110 if name=='wood' else 160 if name=='parquet' else 65),190,255)
                a=np.repeat(luma[:,:,None],3,axis=2)
                if name=='fabric':
                    # Reference-A pinstripe design, over the real woven base.
                    x=np.arange(size);stripe=((x/size*16)%1)<.035
                    a[:,stripe]=255
            elif channel=='roughness':
                luma=a[:,:,0]/255
                # Calibrated response retains variation, avoids mirror-like wood.
                a=np.repeat(np.clip((.7+.28*luma)*255,0,255)[:,:,None],3,axis=2)
            image=Image.fromarray(np.uint8(a))
            stream=BytesIO();image.save(stream,format='JPEG',quality=92 if channel=='normal' else 88,subsampling=0 if channel=='normal' else 2,optimize=True)
            data=stream.getvalue();file=OUT/(name+'-'+lod+'-'+channel+'.jpg');file.write_bytes(data)
            image_id=hashlib.sha256(data).hexdigest()[:16]
            output['images'][image_id]='data:image/jpeg;base64,'+base64.b64encode(data).decode()
            values[channel]=image_id
        output['textures'][name][lod]=values
(OUT/'material-assets.json').write_text(json.dumps(output,separators=(',',':'))+'\n')
print('PBR runtime textures',sum((OUT/(n+'-'+lod+'-'+c+'.jpg')).stat().st_size for n in sets for lod in ['desktop','mobile'] for c in ['color','normal','roughness']))
