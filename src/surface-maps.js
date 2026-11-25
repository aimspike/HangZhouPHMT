/* Shared, deterministic material data. Color, height and roughness are distinct. */
const houseSurfaceMapCaches=new WeakMap();
function createHouseSurfaceMaps(renderer){
 if(!houseSurfaceMapCaches.has(renderer))houseSurfaceMapCaches.set(renderer,new Map());
 const cache=houseSurfaceMapCaches.get(renderer),mobile=/MicroMessenger/i.test(navigator.userAgent)||matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0||innerWidth<760,size=mobile?256:512,tau=Math.PI*2;
 const hash=(x,y)=>{let n=Math.imul(x+127,374761393)^Math.imul(y+57,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
 const noise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y);let a=x-ix,b=y-iy;a=a*a*(3-2*a);b=b*b*(3-2*b);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),a),THREE.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),a),b);};
 return function maps(kind,surface='furniture'){
  const key=kind+'-'+(kind==='wood'?surface:'shared');if(cache.has(key))return cache.get(key);
  const canvases=Array.from({length:3},()=>{const c=document.createElement('canvas');c.width=c.height=size;return c;}),contexts=canvases.map(c=>c.getContext('2d')),pixels=contexts.map(c=>c.createImageData(size,size));
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   let u=x/size,v=y/size;if(kind==='wood'&&surface==='wall')[u,v]=[v,u];
   const fine=hash(x,y)-.5,broad=noise(u*9,v*9)-.5;let color=.96,height=.5,rough=.93;
   if(kind==='wood'||kind==='parquet'){
    if(kind==='parquet'){const a=(u+v)*.707,b=(v-u)*.707;u=a;v=b;if((Math.floor(u*4)+Math.floor(v*4))%2)[u,v]=[v,u];}
    const row=Math.floor(v*5),local=v*5-row,plank=hash(Math.floor(u*2+(row%2)*.5),row),warp=.12*Math.sin(u*tau*2+row*1.4)+.04*Math.sin(u*tau*5);
    const grain=Math.sin((local+warp)*tau*36+noise(u*20,v*6)*2),edge=Math.min(local,1-local),along=u*2+(row%2)*.5,joint=surface!=='furniture'&&(edge<.004||(along-Math.floor(along))<.003);
    color=joint?.8:.94+(surface==='furniture'?0:(plank-.5)*.035)+grain*.012+broad*.025+fine*.01;height=joint?.3:.5+grain*.03;rough=.94+grain*.035+(plank-.5)*.03;
   }else if(kind==='fabric'||kind==='stripe'){
    const weave=Math.sin(u*tau*96)*Math.sin(v*tau*96);color=.96+weave*.008+fine*.018;height=.5+weave*.06;rough=.98+fine*.015;
   }else if(kind==='tile'||kind==='tiles'){
    const joint=x<3||y<3;color=joint?.7:.96+broad*.016;height=joint?.08:.6;rough=joint?1:.9+broad*.035;
   }else if(kind==='stone'){
    const vein=Math.pow(Math.max(0,Math.cos((v+noise(u*6,v*6)*.14+u*.25)*tau*5)),16);color=.97-vein*.075+broad*.02;height=.5+vein*.012;rough=.88+vein*.06+fine*.012;
   }else if(kind==='concrete'||kind==='plaster'){
    const cloud=noise(u*5,v*5)*.5+noise(u*18,v*18)*.3+noise(u*65,v*65)*.2-.5;color=(kind==='concrete'?.92:.97)+cloud*.09+fine*.015;height=.5+cloud*.3+fine*.06;rough=.96+cloud*.035;
   }else{color=.985+fine*.008;height=.5+fine*.015;rough=.98+fine*.01;}
   const values=[color,height,rough],offset=(y*size+x)*4;for(let k=0;k<3;k++){const value=Math.round(THREE.MathUtils.clamp(values[k],0,1)*255);pixels[k].data[offset]=pixels[k].data[offset+1]=pixels[k].data[offset+2]=value;pixels[k].data[offset+3]=255;}
  }
  const textures=canvases.map((c,i)=>{contexts[i].putImageData(pixels[i],0,0);const t=new THREE.CanvasTexture(c);t.encoding=i===0?THREE.sRGBEncoding:THREE.LinearEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);return t;});
  const result={map:textures[0],bump:textures[1],roughness:textures[2]};cache.set(key,result);return result;
 };
}

// Sample the offline diffuse field once while constructing static furnishings.
// Two vertex attributes avoid new per-fragment textures or live GPU readbacks.
function applyHouseFurnishingIrradiance(geometry,roomId){
 const room=window.HOUSE_QUALITY_ASSETS.rooms[roomId];if(!room){const count=geometry.attributes.position.count,ambient=new Float32Array(count*2);for(let i=0;i<count;i++)ambient.set([.13,.28],i*2);geometry.setAttribute('houseRoomAmbient',new THREE.BufferAttribute(ambient,2));geometry.setAttribute('houseRoomSolar',new THREE.BufferAttribute(new Float32Array(count*3),3));return;}
 const p=geometry.attributes.position,n=geometry.attributes.normal,ambient=new Float32Array(p.count*2),solar=new Float32Array(p.count*3),bounds=room.bounds;
 for(let i=0;i<p.count;i++){
  const t=[p.getX(i),p.getY(i),p.getZ(i)].map((v,a)=>THREE.MathUtils.clamp((v-bounds[0][a])/(bounds[1][a]-bounds[0][a]),0,1)),normal=[n.getX(i),n.getY(i),n.getZ(i)],values=[0,0,0,0,0];
  for(let z=0;z<2;z++)for(let y=0;y<2;y++)for(let x=0;x<2;x++){
   const weight=(x?t[0]:1-t[0])*(y?t[1]:1-t[1])*(z?t[2]:1-t[2]),probe=room.probes[x+2*y+4*z];
   for(let axis=0;axis<3;axis++){const coefficient=weight*normal[axis]*normal[axis],direction=axis*2+(normal[axis]<0?1:0);for(let c=0;c<5;c++)values[c]+=coefficient*probe[direction][c];}
  }
  ambient.set(values.slice(0,2),i*2);solar.set(values.slice(2),i*3);
 }
 geometry.setAttribute('houseRoomAmbient',new THREE.BufferAttribute(ambient,2));geometry.setAttribute('houseRoomSolar',new THREE.BufferAttribute(solar,3));
}
