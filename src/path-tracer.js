// Progressive CPU Monte Carlo path tracing in a dedicated worker. All code is
// embedded in the final HTML; it does not require WebGL2, RTX or external files.
function housePathWorker(){
 let job=null,serial=0;
 const PI=Math.PI,add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],scale=(a,s)=>[a[0]*s,a[1]*s,a[2]*s],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>scale(a,1/Math.max(1e-12,Math.hypot(...a)));
 let seed=1;function random(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;}
 function cosine(n){const a=2*PI*random(),r=Math.sqrt(random()),u=norm(cross(Math.abs(n[1])<.95?[0,1,0]:[1,0,0],n)),v=cross(n,u);return add(add(scale(u,r*Math.cos(a)),scale(v,r*Math.sin(a))),scale(n,Math.sqrt(1-r*r)));}
 function build(triangles){
  const ids=Array.from({length:triangles.length/19},(_,i)=>i),nodes=[];
  function recurse(list){const id=nodes.length,lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];nodes.push(null);
   for(const t of list)for(let v=0;v<3;v++)for(let k=0;k<3;k++){const p=triangles[t*19+v*3+k];lo[k]=Math.min(lo[k],p);hi[k]=Math.max(hi[k],p);}
   const node={lo,hi};nodes[id]=node;if(list.length<=6){node.ids=list;return id;}
   const extent=sub(hi,lo),axis=extent.indexOf(Math.max(...extent));list.sort((a,b)=>(triangles[a*19+axis]+triangles[a*19+3+axis]+triangles[a*19+6+axis])-(triangles[b*19+axis]+triangles[b*19+3+axis]+triangles[b*19+6+axis]));const mid=list.length>>1;node.left=recurse(list.slice(0,mid));node.right=recurse(list.slice(mid));return id;
  }if(ids.length)recurse(ids);return nodes;
 }
 function hit(o,d,far=Infinity){const nodes=job.nodes,T=job.triangles;if(!nodes.length)return null;const inv=d.map(v=>Math.abs(v)<1e-12?1e20:1/v),stack=[0];let best=far,result=null;
  while(stack.length){const node=nodes[stack.pop()];let a=.0002,b=best;for(let k=0;k<3;k++){const x=(node.lo[k]-o[k])*inv[k],y=(node.hi[k]-o[k])*inv[k];a=Math.max(a,Math.min(x,y));b=Math.min(b,Math.max(x,y));}if(b<a)continue;
   if(!node.ids){stack.push(node.left,node.right);continue;}
   for(const id of node.ids){const i=id*19,ax=T[i],ay=T[i+1],az=T[i+2],e1x=T[i+3]-ax,e1y=T[i+4]-ay,e1z=T[i+5]-az,e2x=T[i+6]-ax,e2y=T[i+7]-ay,e2z=T[i+8]-az,px=d[1]*e2z-d[2]*e2y,py=d[2]*e2x-d[0]*e2z,pz=d[0]*e2y-d[1]*e2x,det=e1x*px+e1y*py+e1z*pz;if(Math.abs(det)<1e-9)continue;const iv=1/det,tx=o[0]-ax,ty=o[1]-ay,tz=o[2]-az,u=(tx*px+ty*py+tz*pz)*iv;if(u<0||u>1)continue;const qx=ty*e1z-tz*e1y,qy=tz*e1x-tx*e1z,qz=tx*e1y-ty*e1x,v=(d[0]*qx+d[1]*qy+d[2]*qz)*iv;if(v<0||u+v>1)continue;const distance=(e2x*qx+e2y*qy+e2z*qz)*iv;if(distance<.0003||distance>=best)continue;best=distance;result={id,i,u,v,distance,n:norm([e1y*e2z-e1z*e2y,e1z*e2x-e1x*e2z,e1x*e2y-e1y*e2x])};}
  }return result;
 }
 function colour(h){const t=job.triangles,i=h.i,m=job.materials[t[i+15]],c=m.color.map((v,k)=>v*t[i+16+k]);if(m.texture>=0){const tex=job.textures[m.texture],u=t[i+9]*(1-h.u-h.v)+t[i+11]*h.u+t[i+13]*h.v,v=t[i+10]*(1-h.u-h.v)+t[i+12]*h.u+t[i+14]*h.v,xx=((u*m.repeat[0]+m.offset[0])%1+1)%1,yy=((v*m.repeat[1]+m.offset[1])%1+1)%1,index=(Math.min(tex.h-1,Math.floor((1-yy)*tex.h))*tex.w+Math.min(tex.w-1,Math.floor(xx*tex.w)))*4;for(let k=0;k<3;k++)c[k]*=Math.pow(tex.pixels[index+k]/255,2.2);}return c;}
 function visibility(o,d,far){let remaining=far,transmission=1;for(let i=0;i<12;i++){const h=hit(o,d,remaining);if(!h)return transmission;const m=job.materials[job.triangles[h.i+15]];if(m.opacity>.98)return 0;transmission*=Math.max(.02,1-m.opacity*.65);if(transmission<.01)return 0;o=add(o,scale(d,h.distance+.002));remaining-=h.distance+.002;if(remaining<=.002)return transmission;}return 0;}
 function sky(d){const e=job.environment,t=Math.max(0,d[1]),c=e.horizon.map((v,k)=>v*(1-t)+e.zenith[k]*t);if(d[1]<0)return c.map(v=>v*.12);if(e.clouds){const cloud=Math.pow(Math.max(0,Math.sin(d[0]*17+d[2]*5)*Math.sin(d[2]*14-d[0]*3)),5)*Math.max(0,1-t);for(let k=0;k<3;k++)c[k]=c[k]*(1-cloud*.55)+cloud*.5;}return c.map(v=>v*e.skyPower);}
 function trace(o,d){let L=[0,0,0],T=[1,1,1],specular=true,transits=0;
  for(let bounce=0;bounce<job.bounces;bounce++){
   const h=hit(o,d);if(!h){if(specular){const c=sky(d);for(let k=0;k<3;k++)L[k]+=T[k]*c[k];}break;}
   const m=job.materials[job.triangles[h.i+15]],p=add(o,scale(d,h.distance)),base=colour(h);let n=h.n;if(dot(n,d)>0)n=scale(n,-1);
   if(m.opacity<.98&&random()>m.opacity){o=add(p,scale(d,.002));for(let k=0;k<3;k++)T[k]*=.96+.04*base[k];if(++transits<12)bounce--;continue;}
   if(specular)for(let k=0;k<3;k++)L[k]+=T[k]*m.emission[k];
   const origin=add(p,scale(n,.002)),diffuse=(1-m.metalness)*.955,albedo=base.map(v=>Math.min(.94,v));
   // Next-event estimation samples a finite sun, cosine-weighted sky and one area lamp.
   const e=job.environment;
   if(e.sunPower>0){const sun=norm(add(e.sunDirection,scale(cosine(e.sunDirection),.009))),cos=Math.max(0,dot(n,sun));if(cos>0){const vis=visibility(origin,sun,1000);for(let k=0;k<3;k++)L[k]+=T[k]*albedo[k]*diffuse*e.sunColor[k]*e.sunPower*cos*vis/PI;}}
   const skyDir=cosine(n),skyLight=sky(skyDir),sv=visibility(origin,skyDir,1000);for(let k=0;k<3;k++)L[k]+=T[k]*albedo[k]*diffuse*skyLight[k]*sv;
   if(job.lights.length){const lamp=job.lights[Math.floor(random()*job.lights.length)],lp=add(lamp.p,[(random()-.5)*lamp.size,0,(random()-.5)*lamp.size]),delta=sub(lp,origin),distance2=dot(delta,delta),distance=Math.sqrt(distance2),ld=scale(delta,1/distance),cos=Math.max(0,dot(n,ld)),lc=Math.max(0,ld[1]);if(cos>0&&lc>0){const amount=visibility(origin,ld,distance-.003)*cos*lc*lamp.size*lamp.size*job.lights.length/(PI*distance2);for(let k=0;k<3;k++)L[k]+=T[k]*albedo[k]*diffuse*lamp.color[k]*amount;}}
   const specChance=m.metalness+(1-m.metalness)*.045;specular=random()<specChance;
   if(specular){const mirror=sub(d,scale(n,2*dot(d,n)));d=norm(add(scale(mirror,1-m.roughness*m.roughness),scale(cosine(n),m.roughness*m.roughness)));for(let k=0;k<3;k++)T[k]*=m.metalness?albedo[k]:.96;}
   else{d=cosine(n);for(let k=0;k<3;k++)T[k]*=albedo[k];}
   o=origin;if(bounce>=2){const survive=Math.min(.9,Math.max(...T));if(random()>survive)break;T=T.map(v=>v/Math.max(.05,survive));}
  }return L;
 }
 function transform(m,x,y,z,w){const v=[m[0]*x+m[4]*y+m[8]*z+m[12]*w,m[1]*x+m[5]*y+m[9]*z+m[13]*w,m[2]*x+m[6]*y+m[10]*z+m[14]*w],q=m[3]*x+m[7]*y+m[11]*z+m[15]*w;return w&&q?v.map(a=>a/q):v;}
 function primary(x,y){const c=job.camera,p=transform(c.inverse,(x+random())/job.width*2-1,1-(y+random())/job.height*2,-1,1),world=transform(c.world,...p,1);return c.orthographic?{o:world,d:norm(transform(c.world,0,0,-1,0))}:{o:[c.world[12],c.world[13],c.world[14]],d:norm(sub(world,[c.world[12],c.world[13],c.world[14]]))};}
 function display(){const pixels=new Uint8ClampedArray(job.width*job.height*4);for(let i=0;i<job.sum.length;i++){const linear=job.sum[i]/job.samples*job.environment.exposure,aces=Math.min(1,Math.max(0,(linear*(2.51*linear+.03))/(linear*(2.43*linear+.59)+.14)));pixels[Math.floor(i/3)*4+i%3]=Math.round(255*Math.pow(aces,1/2.2));}for(let i=3;i<pixels.length;i+=4)pixels[i]=255;return pixels;}
 function chunk(id){if(!job||id!==serial)return;const end=Math.min(job.height,job.row+4),start=performance.now();for(let y=job.row;y<end;y++)for(let x=0;x<job.width;x++){seed=((y*job.width+x+1)*9781+(job.samples+1)*6271)>>>0;const ray=primary(x,y),c=trace(ray.o,ray.d),i=(y*job.width+x)*3;for(let k=0;k<3;k++)job.sum[i+k]+=Math.min(100,c[k]);}job.row=end;
  if(end===job.height){job.row=0;job.samples++;const pixels=display();postMessage({id:job.id,samples:job.samples,width:job.width,height:job.height,pixels,triangles:job.triangles.length/19,elapsed:performance.now()-job.start},[pixels.buffer]);if(job.samples>=job.maxSamples)return;}
  setTimeout(()=>chunk(id),performance.now()-start>30?1:0);
 }
 onmessage=event=>{serial++;const data=event.data;if(data.stop){job=null;return;}try{job={...data,nodes:build(data.triangles),sum:new Float32Array(data.width*data.height*3),row:0,samples:0,start:performance.now()};chunk(serial);}catch(error){postMessage({id:data.id,error:error.message});}};
}

function createHousePathTracer(options){
 const canvas=document.createElement('canvas');canvas.id='pathCanvas';canvas.hidden=true;options.viewport.appendChild(canvas);const ctx=canvas.getContext('2d'),status=document.getElementById('pathStatus'),select=document.getElementById('renderMode'),quality=document.getElementById('pathQuality');quality.value=options.mobile?'preview':'high';
 let worker=null,enabled=false,serial=0,dirty=true,signature='',lastChange=0,samples=0,triangles=0,elapsed=0,failed=false,gpu=null,gpuChecked=false,gpuReason='',gpuActive=false,targetSamples=32;
 const color=c=>[c.r,c.g,c.b].map(v=>Math.pow(Math.max(0,v),2.2));
 function collect(){
  const materials=[],textures=[],triangles=[],matIds=new Map(),textureIds=new Map();options.scene.updateMatrixWorld(true);
  function textureId(map){if(!map?.image)return -1;if(textureIds.has(map))return textureIds.get(map);try{const image=map.image,c=document.createElement('canvas');c.width=Math.min(256,image.width);c.height=Math.min(256,image.height);const cx=c.getContext('2d');cx.drawImage(image,0,0,c.width,c.height);const id=textures.length;textures.push({w:c.width,h:c.height,pixels:cx.getImageData(0,0,c.width,c.height).data});textureIds.set(map,id);return id;}catch{return -1;}}
  function materialId(m){if(matIds.has(m))return matIds.get(m);const id=materials.length;materials.push({color:color(m.color||new THREE.Color(1,1,1)),emission:m.emissive?color(m.emissive).map(v=>v*(m.emissiveIntensity||0)*(m===options.lampMaterial?65/2.4:1)):[0,0,0],roughness:m.roughness??.8,metalness:m.metalness||0,opacity:m.transparent?m.opacity:1,texture:textureId(m.map),emissiveTexture:textureId(m.emissiveMap),repeat:m.map?[m.map.repeat.x,m.map.repeat.y]:[1,1],offset:m.map?[m.map.offset.x,m.map.offset.y]:[0,0]});matIds.set(m,id);return id;}
  options.scene.traverseVisible(mesh=>{
   if(!mesh.isMesh||mesh.material?.isShaderMaterial||mesh.renderOrder===-100||mesh.userData.pathIgnore)return;
   const geom=mesh.geometry,p=geom.attributes.position;if(!p)return;const index=geom.index,uv=geom.attributes.uv,c=geom.attributes.color,groups=geom.groups.length?geom.groups:[{start:0,count:index?index.count:p.count,materialIndex:0}],point=new THREE.Vector3(),matrix=new THREE.Matrix4(),instance=new THREE.Matrix4();
   for(let k=0;k<(mesh.isInstancedMesh?mesh.count:1);k++){
    if(mesh.isInstancedMesh){mesh.getMatrixAt(k,instance);matrix.multiplyMatrices(mesh.matrixWorld,instance);}else matrix.copy(mesh.matrixWorld);
    for(const group of groups){const m=Array.isArray(mesh.material)?mesh.material[group.materialIndex]:mesh.material;if(!m||m.opacity<.1||m.isShaderMaterial||m.wireframe)continue;const id=materialId(m);for(let n=group.start;n<group.start+group.count;n+=3){const ids=[0,1,2].map(j=>index?index.getX(n+j):n+j),row=[];for(const i of ids){point.fromBufferAttribute(p,i).applyMatrix4(matrix);row.push(...point.toArray());}for(const i of ids)row.push(uv?uv.getX(i):0,uv?uv.getY(i):0);row.push(id);row.push(...(m.vertexColors&&c?ids.reduce((acc,i)=>acc.map((v,j)=>v+c.array[i*3+j]/3),[0,0,0]):[1,1,1]));triangles.push(...row);}}
   }
  });return {triangles:new Float32Array(triangles),materials,textures};
 }
 function setMode(value){enabled=value==='path';failed=false;document.getElementById('pathToggle').setAttribute('aria-pressed',String(enabled));document.getElementById('pathToggle').textContent=enabled?'路径追踪 · 已开启':'路径追踪';if(!enabled){gpuActive=false;canvas.hidden=true;status.hidden=true;if(worker)worker.postMessage({stop:true});return;}status.hidden=false;invalidate();}
 function invalidate(){serial++;gpuActive=false;dirty=true;lastChange=performance.now();samples=0;canvas.hidden=true;status.textContent='路径追踪：准备采样…';if(worker)worker.postMessage({stop:true});}
 function showImage(data){samples=data.samples;elapsed=data.elapsed;canvas.width=data.width;canvas.height=data.height;if(data.canvas)ctx.drawImage(data.canvas,0,0);else ctx.putImageData(new ImageData(data.pixels,data.width,data.height),0,0);canvas.hidden=false;status.textContent='路径追踪 · '+(gpuActive?'GPU':'CPU')+' · '+samples+' / '+targetSamples+' 采样 · '+Math.round(elapsed/1000)+'秒';}
 function start(camera,params){
  if(!gpuChecked){gpuChecked=true;try{gpu=createHousePathGPU();}catch(error){gpuReason=error.message;}}
  try{
   const sceneData=collect(),high=quality.value==='high',width=Math.min(options.mobile?(gpu?(high?420:240):(high?200:128)):(gpu?(high?800:400):(high?240:160)),options.viewport.clientWidth),height=Math.max(64,Math.round(width*options.viewport.clientHeight/options.viewport.clientWidth));camera.updateMatrixWorld(true);serial++;targetSamples=gpu?(high?256:64):(high?128:32);
   const data={...sceneData,id:serial,width,height,maxSamples:targetSamples,bounces:high?6:4,denoise:document.getElementById('pathDenoise').checked,camera:{world:camera.matrixWorld.toArray(),inverse:camera.projectionMatrixInverse.toArray(),orthographic:!!camera.isOrthographicCamera},...params};triangles=sceneData.triangles.length/19;dirty=false;
   if(gpu){try{gpu.start(data);gpuActive=true;status.textContent='GPU路径追踪：正在计算首帧…';return;}catch(error){gpuReason=error.message;gpu.dispose();gpu=null;dirty=true;lastChange=performance.now();return;}}
   if(!worker){const url=URL.createObjectURL(new Blob(['('+housePathWorker.toString()+')()'],{type:'text/javascript'}));try{worker=new Worker(url);}finally{URL.revokeObjectURL(url);}worker.onmessage=event=>{const data=event.data;if(data.id!==serial||!enabled)return;if(data.error){fallback(data.error);return;}showImage(data);};worker.onerror=()=>fallback('当前浏览器无法运行采样线程');}
   worker.postMessage(data);status.textContent='CPU路径追踪：正在计算首帧…';
  }catch(error){fallback(error.message);}
 }
 function fallback(message){gpuActive=false;failed=true;enabled=false;select.value='realtime';canvas.hidden=true;status.hidden=false;status.textContent='已返回实时模式：'+message;if(worker){worker.terminate();worker=null;}document.getElementById('pathToggle').setAttribute('aria-pressed','false');document.getElementById('pathToggle').textContent='路径追踪';}
 document.addEventListener('visibilitychange',()=>{if(enabled)invalidate();});
 select.onchange=()=>setMode(select.value);quality.onchange=invalidate;document.getElementById('pathToggle').onclick=()=>{select.value=enabled?'realtime':'path';select.dispatchEvent(new Event('change',{bubbles:true}));};
 return {tick(camera,params){if(!enabled)return;const key=camera.matrixWorld.elements.map(v=>v.toFixed(4)).join(',')+'|'+camera.projectionMatrix.elements.join(',')+'|'+options.viewport.clientWidth+'x'+options.viewport.clientHeight;if(key!==signature){signature=key;invalidate();}if(dirty&&performance.now()-lastChange>350)start(camera,params);if(gpuActive&&!dirty)try{const data=gpu.step();if(data)showImage({...data,width:data.canvas.width,height:data.canvas.height});}catch(error){gpuReason=error.message;gpu.dispose();gpu=null;invalidate();}},invalidate(){if(enabled)invalidate();},get enabled(){return enabled;},get diagnostics(){return {enabled,samples,triangles,elapsed,worker:!!worker,failed,backend:gpu?'WebGL2 GPU Monte Carlo path tracer':'CPU worker Monte Carlo path tracer',gpuFallback:gpuReason,targetSamples,resolution:[canvas.width,canvas.height],bounces:quality.value==='high'?6:4};}};
}
