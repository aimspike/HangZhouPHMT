/* Optional furnishings. Architecture, door openings and the structural bake remain unchanged. */
function createHouseDecor(options) {
 'use strict';
 const {root,renderer,rooms,finishes,legacyFurniture}=options,$=id=>document.getElementById(id);
 const group=new THREE.Group();group.name='家装预设 A';root.add(group);group.visible=false;
 const layers={},materials={},geometries={},items=[],blockers=[],glowing=[];
 let preset='original',built=false,before=null,aFinishes=null,mode='orbit',currentItem=null,parts=0;
 const clone=v=>JSON.parse(JSON.stringify(v));
 const palette={wall:{color:'#e7dfd2',material:'paint'},ceiling:{color:'#f3eee4',material:'paint'},floor:{color:'#b08c67',material:'parquet'}};

 function surfaceTexture(kind) {
  if(geometries['texture-'+kind])return geometries['texture-'+kind];
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
  ctx.fillStyle='#eeeeee';ctx.fillRect(0,0,256,256);let seed=81;
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  if(kind==='fabric'||kind==='stripe'){
   for(let y=0;y<256;y++){ctx.fillStyle='rgba(50,50,50,'+(.02+rand()*.08)+')';ctx.fillRect(0,y,256,.4);}
   for(let x=0;x<256;x+=2){ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(x,0,.5,256);}
   if(kind==='stripe')for(let x=0;x<256;x+=16){ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(x,0,2,256);}
  } else if(kind==='wood') {
   for(let i=0;i<220;i++){const y=rand()*256;ctx.strokeStyle='rgba(65,65,65,'+(.02+rand()*.055)+')';ctx.lineWidth=.35;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(90,y-2,170,y+2,256,y);ctx.stroke();}
  } else if(kind==='tiles') {
   for(let x=0;x<256;x+=32){ctx.fillStyle='#b9b9b9';ctx.fillRect(x,0,1.3,256);}
   for(let y=0;y<256;y+=128){ctx.fillStyle='#b9b9b9';ctx.fillRect(0,y,256,1.3);}
  }
  const tx=new THREE.CanvasTexture(c);tx.encoding=THREE.sRGBEncoding;tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);
  geometries['texture-'+kind]=tx;return tx;
 }
 function material(name,room) {
  const key=room+'-'+name;if(materials[key])return materials[key];
  const definitions={wood:['#96704e','wood'],oak:['#bc936b','wood'],cream:['#eee6d8'],white:['#f4f0e7'],navy:['#2e3c4b','stripe'],blue:['#45576d','fabric'],linen:['#c3b8a6','fabric'],mustard:['#b3a05e','fabric'],rug:['#c6bfb1','fabric'],black:['#252b2d'],steel:['#a4aaa7'],orange:['#b95d30'],green:['#617260'],tile:['#c5bfb2','tiles'],stone:['#ddd5c4'],glow:['#fff0d0'],mirror:['#839ba0'],red:['#944e39']};
  const [color,texture]=definitions[name];const m=new THREE.MeshStandardMaterial({color,roughness:name==='steel'?.24:name==='mirror'?.18:.78,metalness:name==='steel'?.75:0});m.color.convertSRGBToLinear();
  if(texture)m.map=surfaceTexture(texture);
  if(name==='glow'){m.emissive.set('#ffcd80');m.emissiveIntensity=.65;glowing.push(m);}
  options.shade(m,room);materials[key]=m;return m;
 }
 function layer(room,kind='furniture') {
  const key=room+'-'+kind;if(!layers[key]){const g=new THREE.Group();g.name=key;g.userData.layer=kind;group.add(g);layers[key]=g;}return layers[key];
 }
 function shape(type,dimensions) {
  const key=type+dimensions.join(',');if(geometries[key])return geometries[key];let g;
  if(type==='cylinder')g=new THREE.CylinderGeometry(dimensions[0],dimensions[1],dimensions[2],20);
  else if(type==='sphere')g=new THREE.SphereGeometry(dimensions[0],12,8);
  else if(type==='round'){
   const [w,h,d]=dimensions,r=Math.min(.035,w/5,h/5,d/5),s=new THREE.Shape();
   s.moveTo(-w/2+r,-h/2+r);s.lineTo(w/2-r,-h/2+r);s.lineTo(w/2-r,h/2-r);s.lineTo(-w/2+r,h/2-r);s.closePath();
   g=new THREE.ExtrudeGeometry(s,{depth:Math.max(.001,d-2*r),bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:2,steps:1});g.translate(0,0,-d/2+r);
  } else g=new THREE.BoxGeometry(...dimensions);
  geometries[key]=g;return g;
 }
 function mesh(room,kind,type,x,y,z,dimensions,name,rotation=0) {
  const m=new THREE.Mesh(shape(type,dimensions),material(name,room));m.position.set(x,y,z);m.rotation.y=rotation;m.castShadow=name!=='glow'&&name!=='mirror';m.receiveShadow=true;layer(room,kind).add(m);parts++;
  if(currentItem)currentItem.meshes.push(m);return m;
 }
 const box=(r,x,y,z,w,h,d,m,k='furniture',angle=0)=>mesh(r,k,'box',x,y,z,[w,h,d],m,angle);
 const round=(r,x,y,z,w,h,d,m,k='furniture',angle=0)=>mesh(r,k,'round',x,y,z,[w,h,d],m,angle);
 const cylinder=(r,x,y,z,rt,rb,h,m,k='furniture')=>mesh(r,k,'cylinder',x,y,z,[rt,rb,h],m);
 function item(id,room,build,blocking=true) {
  currentItem={id,room,meshes:[]};build();root.updateMatrixWorld(true);
  const bounds=new THREE.Box3();for(const m of currentItem.meshes)bounds.union(new THREE.Box3().setFromObject(m));
  const local=bounds.clone().applyMatrix4(root.matrixWorld.clone().invert());
  items.push({id,room,min:local.min.toArray(),max:local.max.toArray()});
  if(blocking)blockers.push({id,minX:local.min.x,maxX:local.max.x,minZ:local.min.z,maxZ:local.max.z});currentItem=null;
 }
 function contact(room,x,z,w,d) {
  const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),gradient=ctx.createRadialGradient(32,32,4,32,32,32);gradient.addColorStop(0,'rgba(19,22,20,.24)');gradient.addColorStop(1,'rgba(19,22,20,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const m=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});const plane=new THREE.Mesh(new THREE.PlaneGeometry(w*1.3,d*1.3),m);plane.rotation.x=-Math.PI/2;plane.position.set(x,.008,z);layer(room).add(plane);
 }
 function art(room,x,y,z,w,h,angle=0,variant=0) {
  const panel=box(room,x,y,z,w,h,.028,'wood','wall',angle);
  const c=document.createElement('canvas');c.width=256;c.height=320;const ctx=c.getContext('2d');ctx.fillStyle='#e1d7bd';ctx.fillRect(0,0,256,320);
  const colors=['#344c6b','#b46b43','#c3a851','#6e7b69'];
  for(let i=0;i<6;i++){ctx.fillStyle=colors[(i+variant)%4];ctx.fillRect(18+(i%2)*110,18+Math.floor(i/2)*93,98,82);if(i%2===0){ctx.fillStyle='#dbcfb2';ctx.beginPath();ctx.arc(18+(i%2)*110,18+Math.floor(i/2)*93,60,0,Math.PI/2);ctx.fill();}}
  const tx=new THREE.CanvasTexture(c);tx.encoding=THREE.sRGBEncoding;const m=new THREE.MeshBasicMaterial({map:tx,toneMapped:false});const picture=new THREE.Mesh(new THREE.PlaneGeometry(w-.04,h-.04),m);picture.position.copy(panel.position);picture.position.x+=Math.sin(angle)*.018;picture.position.z+=Math.cos(angle)*.018;picture.rotation.y=angle;layer(room,'wall').add(picture);
 }
 function chair(x,z,angle) {
  const room='dining',g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=angle;layer(room).add(g);
  const previous=currentItem;currentItem={id:'chair-'+x+'-'+z,room,meshes:[]};
  function part(dx,y,dz,w,h,d,name){const m=new THREE.Mesh(shape('round',[w,h,d]),material(name,room));m.position.set(dx,y,dz);m.castShadow=m.receiveShadow=true;g.add(m);currentItem.meshes.push(m);parts++;}
  part(0,.45,0,.43,.07,.43,'linen');part(0,.71,.19,.43,.29,.04,'oak');
  for(const dx of [-.18,.18])for(const dz of [-.17,.17])part(dx,.23,dz,.022,.43,.022,'steel');
  root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(g).applyMatrix4(root.matrixWorld.clone().invert());items.push({id:currentItem.id,room,min:bounds.min.toArray(),max:bounds.max.toArray()});blockers.push({id:currentItem.id,minX:bounds.min.x,maxX:bounds.max.x,minZ:bounds.min.z,maxZ:bounds.max.z});currentItem=previous;
 }
 function bed(room,cx,cz,width,length,angle,headColor) {
  const previous=currentItem,g=new THREE.Group();g.position.set(cx,0,cz);g.rotation.y=angle;layer(room).add(g);
  const add=(x,y,z,w,h,d,name)=>{const m=new THREE.Mesh(shape('round',[w,h,d]),material(name,room));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);parts++;};
  add(0,.24,0,width,.22,length,'wood');add(0,.44,0,width-.025,.24,length-.025,'white');add(0,.61,-length/2+.045,width+.03,.9,.09,headColor);
  add(0,.58,.24,width-.03,.07,length*.66,room==='master'?'blue':'linen');add(0,.62,.7,width-.02,.035,.42,'navy');
  for(const x of [-width*.25,width*.25])add(x,.62,-length/2+.38,width*.43,.14,.43,'white');
  for(const x of [-width/2+.09,width/2-.09])for(const z of [-length/2+.12,length/2-.12])add(x,.075,z,.035,.15,.035,'steel');
  root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(g).applyMatrix4(root.matrixWorld.clone().invert());items.push({id:room+'-bed',room,min:b.min.toArray(),max:b.max.toArray()});blockers.push({id:room+'-bed',minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z});currentItem=previous;contact(room,cx,cz,angle?length:width,angle?width:length);
 }
 function build() {
  if(built)return;built=true;
  // Living zone: keep the study sliding-door parking strip clear along z=3.0.
  item('living-sofa','living',()=>{
   round('living',1.5,.24,3.82,2.28,.22,.8,'wood');round('living',1.5,.68,3.47,2.28,.57,.16,'navy');
   for(const x of [.45,2.55])round('living',x,.58,3.82,.18,.42,.83,'navy');
   for(const x of [.83,1.5,2.17]){round('living',x,.46,3.87,.63,.19,.66,'navy');round('living',x,.73,3.59,.63,.36,.16,'navy');}
   for(const x of [.55,2.45])for(const z of [3.55,4.08])box('living',x,.09,z,.035,.18,.035,'steel');
  });contact('living',1.5,3.84,2.3,.85);
  box('living',1.5,.012,4.95,2.55,.018,2.15,'rug');
  item('coffee-table','living',()=>{cylinder('living',1.4,.41,4.98,.41,.41,.045,'oak');cylinder('living',1.4,.21,4.98,.22,.27,.36,'wood');cylinder('living',1.4,.045,4.98,.3,.3,.035,'black');});
  item('tv-console','living',()=>{box('living',1.43,.31,6.13,1.9,.4,.34,'wood');for(const x of [.65,1.43,2.2])box('living',x,.31,5.952,.025,.34,.016,'black');for(const x of [.65,2.2])box('living',x,.075,6.13,.035,.15,.035,'steel');});
  item('television','living',()=>{round('living',1.43,.99,6.09,1.3,.76,.055,'black','wall',Math.PI);box('living',1.43,.57,6.06,.32,.07,.18,'black');},false);
  const screenCanvas=document.createElement('canvas');screenCanvas.width=512;screenCanvas.height=288;const sc=screenCanvas.getContext('2d');sc.fillStyle='#26313c';sc.fillRect(0,0,512,288);sc.fillStyle='#d7d1bd';sc.beginPath();sc.arc(185,136,80,0,Math.PI*2);sc.fill();sc.fillStyle='#3c5363';sc.beginPath();sc.arc(205,119,73,0,Math.PI*2);sc.fill();sc.fillStyle='#9aa9ad';for(let i=0;i<4;i++)sc.fillRect(306,105+i*23,135-i*17,4);const screenTexture=new THREE.CanvasTexture(screenCanvas);screenTexture.encoding=THREE.sRGBEncoding;const screen=new THREE.Mesh(new THREE.PlaneGeometry(1.22,.68),new THREE.MeshBasicMaterial({map:screenTexture,toneMapped:false}));screen.position.set(1.43,.99,6.054);screen.rotation.y=Math.PI;layer('living','wall').add(screen);
  for(let i=0;i<3;i++)art('living',.85+i*.5,1.85,6.34,.36,.45,Math.PI,i);
  art('living',1.45,1.83,3.0,.35,.52,0,2);
  // Round dining set, separate from the entry-door swept area.
  item('dining-table','dining',()=>{cylinder('dining',4.48,.75,4.87,.58,.58,.065,'oak');cylinder('dining',4.48,.38,4.87,.11,.24,.69,'wood');cylinder('dining',4.48,.04,4.87,.31,.31,.05,'steel');});
  chair(3.65,4.86,-Math.PI/2);chair(5.32,4.86,Math.PI/2);chair(4.48,5.72,0);
  item('dining-sideboard','dining',()=>{box('dining',5.95,.45,4.6,.28,.73,1.06,'wood');box('dining',5.8,.52,4.42,.018,.31,.42,'blue');box('dining',5.8,.33,4.92,.018,.26,.35,'cream');});
  item('fridge','dining',()=>{round('dining',5.76,1.0,5.9,.62,1.98,.68,'mirror');box('dining',5.438,1.01,5.9,.014,.012,.66,'black');box('dining',5.429,1.33,5.7,.014,.32,.018,'steel');});
  cylinder('dining',4.48,2.56,4.87,.012,.012,.44,'cream','ceiling');cylinder('dining',4.48,2.29,4.87,.1,.23,.085,'orange','ceiling');cylinder('dining',4.48,2.244,4.87,.18,.18,.01,'glow','ceiling');
  for(const [x,z] of [[4.32,4.82],[4.62,4.95]]){cylinder('dining',x,.813,z,.09,.09,.01,'cream');cylinder('dining',x,.85,z-.04,.028,.028,.07,'cream');}
  // Kitchen: cabinet modules stop below the north window, leaving the original doorway intact.
  item('kitchen-east-cabinets','kitchen',()=>{box('kitchen',5.79,.46,1.43,.62,.82,2.53,'oak');box('kitchen',5.77,.91,1.43,.67,.055,2.56,'stone');for(let i=0;i<5;i++){box('kitchen',5.47,.48,.45+i*.48,.02,.68,.45,'wood');box('kitchen',5.45,.71,.45+i*.48,.018,.018,.17,'steel');}box('kitchen',6.09,1.28,1.45,.018,.68,2.5,'tile','wall');box('kitchen',5.94,2.13,1.5,.31,.7,2.4,'cream','wall');for(let i=0;i<5;i++)box('kitchen',5.798,2.1,.48+i*.49,.016,.59,.007,'white','wall');});
  item('kitchen-north-cabinets','kitchen',()=>{box('kitchen',4.94,.46,.39,1.03,.82,.59,'oak');box('kitchen',4.93,.91,.4,1.06,.055,.63,'stone');box('kitchen',4.88,.945,.39,.58,.018,.4,'steel');box('kitchen',4.88,.951,.39,.45,.02,.29,'black');cylinder('kitchen',5.19,1.07,.26,.016,.016,.26,'steel');box('kitchen',5.08,1.19,.26,.23,.026,.025,'steel');});
  box('kitchen',5.75,.948,2.07,.48,.015,.53,'black');for(const z of [1.92,2.23]){cylinder('kitchen',5.74,.96,z,.1,.1,.018,'steel');cylinder('kitchen',5.74,1.02,z,.085,.085,.11,'black');}
  box('kitchen',5.91,1.79,2.08,.36,.09,.6,'black','wall');box('kitchen',5.94,1.72,1.5,.32,.016,2.4,'glow','wall');
  // Bedrooms are mapped by balcony adjacency, not by an assumed photograph compass.
  bed('master',1.85,10.3,1.55,2.02,-Math.PI/2,'mustard');box('master',1.65,.012,10.3,2.6,.018,2.15,'rug');
  item('master-wardrobe','master',()=>{box('master',.39,1.16,9.12,.54,2.3,1.22,'cream');for(const z of [8.82,9.42])box('master',.675,1.17,z,.016,2.19,.58,'white');});
  item('master-nightstand','master',()=>{box('master',2.79,.29,11.31,.45,.52,.37,'wood');cylinder('master',2.79,.7,11.31,.12,.12,.17,'cream');});
  art('master',3.105,1.75,10.05,.55,.75,-Math.PI/2,0);art('master',3.105,1.7,10.85,.36,.48,-Math.PI/2,1);
  bed('second',5.1,9.9,1.45,1.94,0,'linen');box('second',4.98,.012,9.7,1.94,.018,2.4,'blue');
  item('second-wardrobe','second',()=>{box('second',5.36,1.16,7.96,1.29,2.3,.45,'cream');for(const x of [4.96,5.37,5.77])box('second',x,1.16,8.197,.007,2.18,.014,'wood');});
  item('second-nightstand','second',()=>{box('second',4.1,.31,9.7,.35,.48,.38,'wood');cylinder('second',4.1,.7,9.7,.105,.105,.18,'cream');});art('second',6.095,1.65,9.3,.58,.72,-Math.PI/2,2);
  // Keep bathroom fixtures inside its original boundary; the reference dry-area relocation is unconfirmed.
  item('bath-vanity','bath',()=>{box('bath',.55,.56,7.91,.7,.48,.36,'wood');box('bath',.55,.82,7.91,.74,.06,.39,'stone');cylinder('bath',.55,.85,7.9,.18,.18,.025,'cream');round('bath',.55,1.48,8.135,.64,.78,.025,'glow','wall',Math.PI);round('bath',.55,1.48,8.115,.59,.73,.018,'mirror','wall',Math.PI);box('bath',.55,1.02,8.07,.08,.05,.07,'steel');});
  item('toilet','bath',()=>{round('bath',.47,.24,6.96,.41,.37,.59,'white');round('bath',.47,.61,6.73,.4,.45,.18,'white');});
  box('bath',1.35,.025,6.86,.69,.04,.72,'stone');cylinder('bath',1.65,2.04,6.76,.055,.055,.025,'steel','wall');
  // Secondary spaces keep generous circulation and unobstructed doors.
  item('study-desk','study',()=>{box('study',2.25,.75,1.63,.73,.055,1.38,'oak');for(const z of [1.05,2.21])box('study',2.25,.37,z,.58,.72,.035,'steel');});
  item('study-chair','study',()=>{round('study',2.97,.46,1.62,.45,.08,.46,'green');round('study',3.16,.7,1.62,.06,.43,.45,'linen');for(const z of [1.45,1.8])box('study',2.97,.23,z,.03,.44,.03,'steel');});
  item('storage-shelves','storage',()=>{for(const y of [.18,.7,1.22,1.74,2.26])box('storage',5.91,y,6.95,.32,.04,.8,'oak');for(const z of [6.57,7.33])box('storage',6.03,1.22,z,.04,2.12,.04,'wood');});
  item('balcony-laundry','balcony',()=>{box('balcony',5.7,1.14,12.03,.65,2.22,.66,'cream');for(const y of [.62,1.62]){box('balcony',5.7,y,11.685,.58,.83,.025,'white');const ring=cylinder('balcony',5.7,y,11.66,.2,.2,.035,'steel');ring.rotation.x=Math.PI/2;const port=cylinder('balcony',5.7,y,11.635,.155,.155,.04,'black');port.rotation.x=Math.PI/2;}});
  // Trim lights are emissive surfaces, not additional shadow-casting point lights.
  for(const [room,x,z,w,d] of [['living',1.65,4.65,2.95,3.05],['dining',4.7,4.65,2.65,3.05],['master',1.6,10,2.85,3.1],['second',4.7,9.4,2.6,2.8]]){
   for(const zz of [z-d/2,z+d/2])box(room,x,2.705,zz,w,.02,.025,'glow','ceiling');
   for(const xx of [x-w/2,x+w/2])box(room,xx,2.705,z,.025,.02,d,'glow','ceiling');
  }
  merge();
 }
 function merge() {
  // Merge by material within each visibility layer to keep mobile draw calls bounded.
  for(const parent of Object.values(layers)){
   const buckets=new Map();parent.updateMatrixWorld(true);const inverse=parent.matrixWorld.clone().invert();const meshes=[];parent.traverse(m=>{if(m.isMesh)meshes.push(m);});
   for(const m of meshes){const key=m.material.uuid;if(!buckets.has(key))buckets.set(key,{material:m.material,positions:[],normals:[],uvs:[]});const b=buckets.get(key),g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(inverse.clone().multiply(m.matrixWorld));for(const [name,attribute] of [['positions','position'],['normals','normal'],['uvs','uv']])for(const value of g.attributes[attribute].array)b[name].push(value);g.dispose();}
   parent.clear();for(const b of buckets.values()){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.normals,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uvs,2));g.computeBoundingSphere();const m=new THREE.Mesh(g,b.material);m.castShadow=!b.material.transparent&&b.material.emissiveIntensity<1;m.receiveShadow=true;parent.add(m);}
  }
 }
 function update(nextMode=mode) {
  mode=nextMode;const visible=$('showFurniture').checked;group.visible=preset==='a'&&visible;legacyFurniture.visible=preset!=='a'&&visible;
  for(const g of Object.values(layers))g.visible=g.userData.layer==='ceiling'?mode==='walk'&&$('showCeiling').checked:g.userData.layer==='wall'?mode==='walk':true;
  const on=$('showLights').checked;for(const m of glowing)m.emissiveIntensity=on?.65*Number($('lightPower').value):0;
  $('decorPreset').value=preset;$('decorStatus').textContent=preset==='a'?'家装预设 A · 暖木 / 米白 / 深蓝。原墙线和门洞保持；家具按本户型适配。':'保留当前材质与原参考家具。切换预设前的材质可随“原有方案”恢复。';renderer.shadowMap.needsUpdate=true;
 }
 function apply(value,restoring=false) {
  if(!['original','a'].includes(value))value='original';
  if(!restoring&&value!==preset){
   if(value==='a'){before=clone(finishes.diagnostics.rooms);const data={};for(const room of rooms){data[room.id]=clone(palette);if(['kitchen','bath','storage','balcony','equipment1','equipment2'].includes(room.id)){data[room.id].floor={material:'tile',color:room.id==='bath'?'#c3beb2':'#c8c1b2'};if(room.id==='bath')data[room.id].wall={material:'tile',color:'#c4beb0'};}}finishes.restore(aFinishes||data);$('showFurniture').checked=true;}
   else {aFinishes=clone(finishes.diagnostics.rooms);if(before)finishes.restore(before);}
  }
  preset=value;if(preset==='a')build();update();
 }
 $('decorPreset').addEventListener('change',e=>apply(e.target.value));
 return {apply,update,restore(data){before=data?.previousFinishes&&typeof data.previousFinishes==='object'?clone(data.previousFinishes):null;aFinishes=data?.aFinishes&&typeof data.aFinishes==='object'?clone(data.aFinishes):null;apply(data?.preset||'original',true);},read(){return {preset,previousFinishes:before?clone(before):null,aFinishes:preset==='a'?clone(finishes.diagnostics.rooms):aFinishes?clone(aFinishes):null};},clearAt(x,z){if(preset!=='a'||!$('showFurniture').checked)return true;const px=x+3.1,pz=z+6.25,r=.13;return !blockers.some(b=>px>b.minX-r&&px<b.maxX+r&&pz>b.minZ-r&&pz<b.maxZ+r);},get diagnostics(){return {preset,built,visible:group.visible,parts,mergedMeshes:Object.values(layers).reduce((n,g)=>n+g.children.length,0),items:clone(items),blockingObjects:blockers.length,architectureUnchanged:true,lighting:'Existing architectural bake plus approximate local furnishing fill and contact shadows'};}};
}
