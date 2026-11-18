/* Procedural surroundings are illustrative; no map imagery or external assets. */
function createHouseEnvironment(options){
 const scene=options.scene,renderer=options.renderer,ground=options.ground;
 const group=new THREE.Group();scene.add(group);
 const skyUniforms={zenith:{value:new THREE.Color()},horizon:{value:new THREE.Color()},cloudColor:{value:new THREE.Color()},sunDir:{value:new THREE.Vector3()},night:{value:0},clock:{value:0},clouds:{value:1}};
 const skyMaterial=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,toneMapped:false,uniforms:skyUniforms,
  vertexShader:'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:`varying vec3 direction;uniform vec3 zenith,horizon,cloudColor,sunDir;uniform float night,clock,clouds;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 a=floor(p),b=fract(p);b=b*b*(3.0-2.0*b);return mix(mix(hash(a),hash(a+vec2(1.0,0.0)),b.x),mix(hash(a+vec2(0.0,1.0)),hash(a+1.0),b.x),b.y);}
float fbm(vec2 p){return noise(p)*0.57+noise(p*2.03+8.1)*0.28+noise(p*4.07)*0.15;}
void main(){vec3 d=normalize(direction);float h=max(d.y,0.0);vec3 color=mix(horizon,zenith,pow(h,0.45));
vec2 uv=d.xz/(0.24+h)*1.8+vec2(clock*0.003,clock*0.001);float cloud=smoothstep(0.47,0.74,fbm(uv))*smoothstep(-0.02,0.15,d.y)*clouds;color=mix(color,cloudColor,cloud*(0.84-night*0.36));
float s=max(dot(d,sunDir),0.0);color+=vec3(1.0,0.64,0.28)*pow(s,55.0)*(1.0-night)*0.19;color=mix(color,vec3(1.0,0.91,0.69),smoothstep(0.99975,0.99994,s)*(1.0-night));
vec3 moon=normalize(vec3(-0.42,0.57,-0.7));float m=max(dot(d,moon),0.0);color+=vec3(0.25,0.34,0.5)*pow(m,95.0)*night*0.3;color=mix(color,vec3(0.8,0.86,0.91),smoothstep(0.9997,0.99995,m)*night);
vec2 starUv=vec2(atan(d.z,d.x),asin(d.y))*260.0;vec2 cell=floor(starUv);float star=step(0.997,hash(cell))*(1.0-smoothstep(0.05,0.21,length(fract(starUv)-0.5)));color+=star*pow(night,4.0)*smoothstep(0.03,0.25,d.y)*(1.0-cloud)*vec3(0.7,0.8,1.0);
gl_FragColor=vec4(color,1.0);
#include <encodings_fragment>
}`});
 const sky=new THREE.Mesh(new THREE.SphereGeometry(420,32,16),skyMaterial);sky.frustumCulled=false;sky.renderOrder=-100;scene.add(sky);
 const unitBox=new THREE.BoxGeometry(1,1,1);const cityMaterials=[];const glowingMaterials=[];
 let seed=813;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
 function color(hex){return new THREE.Color(hex).convertSRGBToLinear();}
 function material(hex){return new THREE.MeshStandardMaterial({color:hex,roughness:.95});}
 const grass=material('#8eab91'),road=material('#6b767a'),path=material('#c8c6b6'),paint=material('#e5dfc7'),trunk=material('#776b57'),leaf=material('#547f64'),roofMaterial=material('#9da7a6');
 function block(x,y,z,w,h,d,mat){const m=new THREE.Mesh(unitBox,mat);m.position.set(x,y,z);m.scale.set(w,h,d);m.receiveShadow=true;group.add(m);return m;}
 function instances(geometry,mat,list){const supported=renderer.capabilities.isWebGL2||renderer.extensions.has('ANGLE_instanced_arrays');const inst=supported?new THREE.InstancedMesh(geometry,mat,list.length):new THREE.Group(),dummy=new THREE.Object3D();list.forEach((v,i)=>{dummy.position.set(v[0],v[1],v[2]);dummy.scale.set(v[3],v[4],v[5]);dummy.rotation.set(0,v[6]||0,0);dummy.updateMatrix();if(supported)inst.setMatrixAt(i,dummy.matrix);else{const mesh=new THREE.Mesh(geometry,mat);mesh.position.copy(dummy.position);mesh.scale.copy(dummy.scale);mesh.rotation.copy(dummy.rotation);inst.add(mesh);}});inst.frustumCulled=false;inst.receiveShadow=true;group.add(inst);return inst;}
 // A central garden and streets leave all apartment openings unobstructed.
 ground.scale.set(3,1,3);block(0,-.245,0,18,.022,27,path);block(0,-.228,0,15,.015,24,grass);
 block(-22,-.24,0,6,.025,240,road);block(22,-.24,0,6,.025,240,road);block(0,-.24,-29,240,.025,7,road);block(0,-.24,29,240,.025,7,road);
 block(-17.8,-.22,0,1.7,.03,72,path);block(17.8,-.22,0,1.7,.03,72,path);block(0,-.22,-24.8,56,.03,1.7,path);block(0,-.22,24.8,56,.03,1.7,path);
 const stripes=[];for(let z=-100;z<=100;z+=9)for(const x of [-22,22])stripes.push([x,-.217,z,.10,.008,3.8]);for(let x=-100;x<=100;x+=9)for(const z of [-29,29])stripes.push([x,-.217,z,3.8,.008,.10]);instances(unitBox,paint,stripes);
 function facade(base,variant){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;const ctx=canvas.getContext('2d');ctx.fillStyle=base;ctx.fillRect(0,0,256,512);const glow=document.createElement('canvas');glow.width=256;glow.height=512;const gx=glow.getContext('2d');gx.fillStyle='#000';gx.fillRect(0,0,256,512);
  for(let row=0;row<10;row++){ctx.fillStyle='rgba(60,75,78,.15)';ctx.fillRect(0,25+row*47,256,2);for(let col=0;col<4;col++){const x=20+col*58,y=34+row*47,w=28+(variant%2)*6;ctx.fillStyle='#667d86';ctx.fillRect(x-2,y-2,w+4,32);ctx.fillStyle=random()>.5?'#9db0b6':'#819aa4';ctx.fillRect(x,y,w,28);ctx.fillStyle='#c4cbca';ctx.fillRect(x+w/2-1,y,2,28);if(random()>.47){gx.fillStyle=random()>.5?'#ffdca0':'#eec88a';gx.fillRect(x,y,w,28);gx.fillStyle='#81765b';gx.fillRect(x+w/2-1,y,2,28);}}}
  const map=new THREE.CanvasTexture(canvas);map.encoding=THREE.sRGBEncoding;map.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);const emissive=new THREE.CanvasTexture(glow);emissive.encoding=THREE.sRGBEncoding;
  const mat=new THREE.MeshStandardMaterial({map,roughness:.93,emissive:0xffffff,emissiveMap:emissive,emissiveIntensity:0});cityMaterials.push(mat);return mat;
 }
 const buildGeometry=unitBox.clone();for(let i=8;i<16;i++)buildGeometry.attributes.uv.setXY(i,.015,.015);
 const buildingLists=[[],[],[]],roofs=[];
 for(const x of [-48,48])for(const z of [-67,-43,0,43,67]){const h=13+Math.floor(random()*4)*3,w=9+random()*4,d=12+random()*3;buildingLists[Math.floor(random()*3)].push([x,h/2-.25,z,w,h,d]);roofs.push([x,h+.05,z,w+.5,.6,d+.5]);}
 for(const z of [-57,57])for(const x of [-15,15]){const h=12+Math.floor(random()*4)*3;buildingLists[Math.floor(random()*3)].push([x,h/2-.25,z,11,h,13]);roofs.push([x,h+.05,z,11.5,.6,13.5]);}
 const districtCount=buildingLists.reduce((s,a)=>s+a.length,0);
 const bases=['#c9c7b8','#b9c5c5','#d5ccbf'];buildingLists.forEach((list,i)=>instances(buildGeometry,facade(bases[i],i),list));instances(unitBox,roofMaterial,roofs);
 const towers=[];for(let i=0;i<30;i++){const angle=i/30*Math.PI*2,r=112+random()*65,h=22+Math.floor(random()*11)*3;towers.push([Math.cos(angle)*r,h/2-.25,Math.sin(angle)*r,8+random()*9,h,9+random()*10]);}instances(buildGeometry,facade('#8e9ea5',4),towers);
 const stems=[],crowns=[];for(const x of [-15,15])for(let z=-21;z<=21;z+=7){stems.push([x,1.2,z,.18,2.9,.18]);crowns.push([x,3.4,z,1.7,2.2,1.7]);}for(let i=0;i<28;i++){const angle=i/28*Math.PI*2,x=Math.cos(angle)*(78+random()*14),z=Math.sin(angle)*(80+random()*10);stems.push([x,1.2,z,.25,3,.25]);crowns.push([x,3.7,z,2.1,2.8,2.1]);}instances(new THREE.CylinderGeometry(1,1,1,5),trunk,stems);instances(new THREE.IcosahedronGeometry(1,1),leaf,crowns);
 const poles=[],bulbs=[];for(const x of [-18.8,18.8])for(const z of [-20,0,20]){poles.push([x,1.9,z,.09,4.1,.09]);bulbs.push([x,4,z,.35,.3,.35]);}instances(unitBox,material('#536361'),poles);const glow=new THREE.MeshBasicMaterial({color:'#ffdf9a',transparent:true,opacity:0});glowingMaterials.push(glow);instances(new THREE.SphereGeometry(1,8,5),glow,bulbs);
 const puddles=[];for(const x of [-18.8,18.8])for(const z of [-20,0,20])puddles.push([x,-.194,z,3,.006,3]);const groundGlow=new THREE.MeshBasicMaterial({color:'#efc77f',transparent:true,opacity:0,depthWrite:false});glowingMaterials.push(groundGlow);instances(new THREE.CylinderGeometry(1,1,1,24),groundGlow,puddles);
 let preset=null,view='orbit',floorLevel=18,storeyHeight=3,elevation=51;
 function setElevation(floor,height){floorLevel=floor;storeyHeight=height;elevation=(floor-1)*height;group.position.y=-elevation;ground.position.y=-.32-elevation;}
 function update(p,mode){preset=p;view=mode;const plan=mode==='plan';sky.visible=!plan;group.visible=!plan&&document.getElementById('showContext').checked;
  scene.background=new THREE.Color(plan?'#edf2ef':p.horizon);scene.fog=plan?null:new THREE.FogExp2(p.fog,p.id==='night'?.006:.0043);
  ground.material.color.set(plan?'#e7ecea':'#8fa49a');skyUniforms.zenith.value.copy(color(p.zenith));skyUniforms.horizon.value.copy(color(p.horizon));skyUniforms.cloudColor.value.copy(color(p.cloud));skyUniforms.sunDir.value.fromArray(p.direction);skyUniforms.night.value=p.night;skyUniforms.clouds.value=document.getElementById('showClouds').checked?1:0;
  cityMaterials.forEach(mat=>mat.emissiveIntensity=p.night*.95);glow.opacity=p.night;groundGlow.opacity=p.night*.16;
 }
 function tick(time,camera){sky.position.copy(camera.position);skyUniforms.clock.value=time/1000;}
 return {update,tick,setElevation,get diagnostics(){return {districtBuildings:districtCount,cityBuildings:towers.length,trees:stems.length,visible:group.visible,sky:sky.visible,clouds:skyUniforms.clouds.value,preset:preset&&preset.id,floor:floorLevel,storeyHeight,elevation,contextOffset:group.position.y,groundHeight:ground.position.y};}};
}
