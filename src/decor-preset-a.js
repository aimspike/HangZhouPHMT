/* Optional furnishings. Architecture, door openings and the structural bake remain unchanged. */
function createHouseDecor(options) {
 'use strict';
 const {root,renderer,rooms,finishes}=options,$=id=>document.getElementById(id);
 const group=new THREE.Group();group.name='家装预设 A';root.add(group);group.visible=false;
 const layers={},materials={},geometries={},items=[],blockers=[],glowing=[];
 let preset='bare',built=false,bareFinishes=null,aFinishes=null,mode='orbit',currentItem=null,parts=0;
 const clone=v=>JSON.parse(JSON.stringify(v));
 const palette={wall:{color:'#e7dfd2',material:'paint'},ceiling:{color:'#f3eee4',material:'paint'},floor:{color:'#b08c67',material:'parquet'}};
 const barePalette={wall:{color:'#b8b6ae',material:'concrete'},ceiling:{color:'#c5c2b9',material:'concrete'},floor:{color:'#a29f96',material:'concrete'}};
 const placements=[];
 const wallFace=(id,axis,side)=>{const wall=options.planLayout.walls.find(w=>w.id===id);return wall.a[axis]+side*wall.t/2;};

 function surfaceTexture(kind) {
  if(geometries['texture-'+kind])return geometries['texture-'+kind];
  const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');
  ctx.fillStyle='#eeeeee';ctx.fillRect(0,0,512,512);let seed=81;
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  if(kind==='fabric'||kind==='stripe'){
   for(let y=0;y<512;y++){ctx.fillStyle='rgba(45,45,45,'+(.025+rand()*.075)+')';ctx.fillRect(0,y,512,.65);}
   for(let x=0;x<512;x+=2){ctx.fillStyle='rgba(255,255,255,'+(.08+rand()*.08)+')';ctx.fillRect(x,0,.6,512);}
   if(kind==='stripe')for(let x=0;x<512;x+=24){ctx.fillStyle='rgba(255,255,255,.24)';ctx.fillRect(x,0,1.7,512);ctx.fillStyle='rgba(60,60,60,.09)';ctx.fillRect(x+3,0,1,512);}
  } else if(kind==='wood') {
   for(let y=0;y<512;y++){const v=235+4*Math.sin(y*.07)+2*Math.sin(y*.43);ctx.fillStyle='rgb('+v+','+v+','+v+')';ctx.fillRect(0,y,512,1);}
   for(let i=0;i<420;i++){const y=rand()*512;ctx.strokeStyle='rgba(50,50,50,'+(.018+rand()*.05)+')';ctx.lineWidth=.35+rand()*.45;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(130,y-4,370,y+4,512,y);ctx.stroke();}
  } else if(kind==='stone') {
   for(let i=0;i<5500;i++){const v=180+rand()*50;ctx.fillStyle='rgba('+v+','+v+','+v+',.22)';ctx.fillRect(rand()*512,rand()*512,1+rand()*2,1);}
   for(let i=0;i<7;i++){const y=rand()*512;ctx.strokeStyle='rgba(80,80,80,.055)';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(160,y+55,340,y-35,512,y+8);ctx.stroke();}
  } else if(kind==='tiles') {
   for(let x=0;x<512;x+=40){ctx.fillStyle='#b9b9b9';ctx.fillRect(x,0,1.5,512);ctx.fillStyle='#fafafa';ctx.fillRect(x+2,0,.7,512);}
   for(let y=0;y<512;y+=256){ctx.fillStyle='#b9b9b9';ctx.fillRect(0,y,512,1.5);}
  }
  const tx=new THREE.CanvasTexture(c);tx.encoding=THREE.sRGBEncoding;tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);
  const relief=tx.clone();relief.encoding=THREE.LinearEncoding;relief.needsUpdate=true;
  geometries['texture-'+kind]={map:tx,bump:relief};return geometries['texture-'+kind];
 }
 function reflections(){
  if(geometries.reflections)return geometries.reflections;
  const faces=[];for(let i=0;i<6;i++){const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),g=ctx.createLinearGradient(0,0,0,64);g.addColorStop(0,'#a4afb4');g.addColorStop(.45,'#9ca6a8');g.addColorStop(1,'#665d50');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);const glow=ctx.createRadialGradient(i%2?38:22,20,1,32,28,40);glow.addColorStop(0,'#eee8d8');glow.addColorStop(.3,'#c6c8bd');glow.addColorStop(1,'#7c888b00');ctx.fillStyle=glow;ctx.fillRect(0,0,64,64);faces.push(c);}
  const env=new THREE.CubeTexture(faces);env.encoding=THREE.sRGBEncoding;env.needsUpdate=true;geometries.reflections=env;return env;
 }
 function material(name,room) {
  const key=room+'-'+name;if(materials[key])return materials[key];
  const definitions={wood:['#96704e','wood'],oak:['#bc936b','wood'],cream:['#eee6d8'],white:['#f4f0e7'],navy:['#2e3c4b','stripe'],blue:['#45576d','fabric'],linen:['#c3b8a6','fabric'],mustard:['#b3a05e','fabric'],rug:['#c6bfb1','fabric'],black:['#252b2d'],steel:['#a4aaa7'],orange:['#b95d30'],green:['#617260'],tile:['#c5bfb2','tiles'],stone:['#ddd5c4','stone'],glow:['#fff0d0'],mirror:['#839ba0'],red:['#944e39'],chrome:['#b9bdbb'],seam:['#596975'],ceramic:['#dcd4bf'],brass:['#8d7652'],leaf:['#546b47'],soil:['#403b32']};
  const [color,texture]=definitions[name],fabric=['fabric','stripe'].includes(texture),metal=['steel','brass','chrome'].includes(name);const m=new THREE.MeshStandardMaterial({color,roughness:name==='chrome'?.16:metal?.25:name==='mirror'?.13:fabric?.93:texture==='wood'?.46:name==='stone'?.36:name==='ceramic'?.3:.65,metalness:metal?.82:name==='mirror'?.8:0});m.color.convertSRGBToLinear();
  if(texture){const tx=options.assets.maps(texture==='wood'?'wood':fabric?(name==='navy'?'fabric':'fabric_plain'):texture==='stone'?'stone':'none');if(tx){m.map=tx.color;m.normalMap=tx.normal;m.normalScale.set(fabric?(name==='navy'?.12:.035):.15,fabric?(name==='navy'?.12:.035):.15);m.roughnessMap=tx.roughness;}else{const old=surfaceTexture(texture);m.map=old.map;m.bumpMap=old.bump;m.roughnessMap=old.bump;m.bumpScale=.0006;}}
  m.envMap=reflections();m.userData.envStrength=metal?.75:name==='mirror'?.95:fabric?.015:.12;m.envMapIntensity=m.userData.envStrength;
  if(name==='glow'){m.emissive.set('#ffcd80');m.emissiveIntensity=.65;glowing.push(m);}
  options.shade(m,room);materials[key]=m;return m;
 }
 function layer(room,kind='furniture') {
  const key=room+'-'+kind;if(!layers[key]){const g=new THREE.Group();g.name=key;g.userData.layer=kind;group.add(g);layers[key]=g;}return layers[key];
 }
 function shape(type,dimensions) {
  const key=type+dimensions.join(',');if(geometries[key])return geometries[key];let g;
  if(type==='cylinder')g=new THREE.CylinderGeometry(dimensions[0],dimensions[1],dimensions[2],40);
  else if(type==='sphere')g=new THREE.SphereGeometry(dimensions[0],20,12);
  else if(type==='round'){
   const [w,h,d]=dimensions,r=Math.min(.035,w/5,h/5,d/5),s=new THREE.Shape(),x=-w/2+r,y=-h/2+r,ww=w-2*r,hh=h-2*r,q=Math.min(r,ww/4,hh/4);
   s.moveTo(x+q,y);s.lineTo(x+ww-q,y);s.quadraticCurveTo(x+ww,y,x+ww,y+q);s.lineTo(x+ww,y+hh-q);s.quadraticCurveTo(x+ww,y+hh,x+ww-q,y+hh);s.lineTo(x+q,y+hh);s.quadraticCurveTo(x,y+hh,x,y+hh-q);s.lineTo(x,y+q);s.quadraticCurveTo(x,y,x+q,y);s.closePath();
   g=new THREE.ExtrudeGeometry(s,{depth:Math.max(.001,d-2*r),bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:4,curveSegments:8,steps:1});g.translate(0,0,-d/2+r);const p=g.attributes.position,n=g.attributes.normal,inner=[w/2-r,h/2-r,d/2-r];for(let i=0;i<p.count;i++){const v=[p.getX(i),p.getY(i),p.getZ(i)],normal=new THREE.Vector3(...v.map((a,j)=>a-THREE.MathUtils.clamp(a,-inner[j],inner[j])));if(normal.lengthSq()>1e-10){normal.normalize();n.setXYZ(i,normal.x,normal.y,normal.z);}}
  } else g=new THREE.BoxGeometry(...dimensions);
  if(type==='box'||type==='round'){const p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));u.setXY(i,(ax>ay&&ax>az?p.getZ(i):p.getX(i))*2,ay>ax&&ay>az?p.getZ(i)*2:p.getY(i)*2);}}
  geometries[key]=g;return g;
 }
 function mesh(room,kind,type,x,y,z,dimensions,name,rotation=0) {
  const m=new THREE.Mesh(shape(type,dimensions),material(name,room));m.position.set(x,y,z);m.rotation.y=rotation;m.castShadow=name!=='glow'&&name!=='mirror';m.receiveShadow=true;layer(room,kind).add(m);parts++;
  if(currentItem)currentItem.meshes.push(m);return m;
 }
 const box=(r,x,y,z,w,h,d,m,k='furniture',angle=0)=>mesh(r,k,'box',x,y,z,[w,h,d],m,angle);
 const round=(r,x,y,z,w,h,d,m,k='furniture',angle=0)=>mesh(r,k,'round',x,y,z,[w,h,d],m,angle);
 const cylinder=(r,x,y,z,rt,rb,h,m,k='furniture')=>mesh(r,k,'cylinder',x,y,z,[rt,rb,h],m);
 function tube(room,points,radius,name,kind='furniture',parent=null){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'catmullrom',.1),g=new THREE.TubeGeometry(curve,Math.max(8,points.length*3),radius,4,false),m=new THREE.Mesh(g,material(name,room));(parent||layer(room,kind)).add(m);m.castShadow=false;m.receiveShadow=true;parts++;if(currentItem)currentItem.meshes.push(m);return m;
 }
 function piping(room,x,y,z,w,d,name,parent=null){const r=.035,pts=[[-w/2+r,-d/2],[w/2-r,-d/2],[w/2,-d/2+r],[w/2,d/2-r],[w/2-r,d/2],[-w/2+r,d/2],[-w/2,d/2-r],[-w/2,-d/2+r],[-w/2+r,-d/2]];return tube(room,pts.map(([a,b])=>[x+a,y,z+b]),.0022,name,'furniture',parent);}
 function book(room,x,y,z,w,h,d,color,angle=0){box(room,x,y,z,w,h,d,'white','furniture',angle);for(const side of [-1,1])box(room,x,y+side*(h/2+.002),z,w+.012,.005,d+.008,color,'furniture',angle);}
 function plant(room,x,y,z,size=.14){cylinder(room,x,y+size*.45,z,size*.5,size*.4,size*.9,'ceramic');cylinder(room,x,y+size*.9,z,size*.43,size*.43,.008,'soil');for(let i=0;i<5;i++){const angle=i*2.4,tip=[x+Math.cos(angle)*size*.6,y+size*(2.2+i*.12),z+Math.sin(angle)*size*.6];tube(room,[[x,y+size*.8,z],[(x+tip[0])/2,y+size*1.8,(z+tip[2])/2],tip],.003,'leaf');const leaf=mesh(room,'furniture','sphere',...tip,[size*.35],'leaf');leaf.scale.set(.45,1.5,.65);leaf.rotation.z=Math.sin(angle)*.7;}}
 function item(id,room,build,blocking=true) {
  currentItem={id,room,meshes:[]};const replacements={'living-sofa':['sofa',[1.8,0,5.9]],'coffee-table':['coffee',[1.75,0,4.68]],'tv-console':['console',[2.44,0,3.43]],'dining-table':['dining-table',[4.48,0,4.87]],'dining-sideboard':['sideboard',[5.95,0,4.6],-Math.PI/2],'fridge':['fridge',[5.76,0,5.9],Math.PI/2],'kitchen-east-cabinets':['kitchen-east',[5.79,0,1.43],-Math.PI/2],'kitchen-north-cabinets':['kitchen-north',[4.94,0,.4]],'study-desk':['study-desk',[2.25,0,1.63]],'bath-vanity':['vanity',[.55,0,7.91]]},replacement=replacements[id];if(replacement){currentItem.meshes.push(...options.assets.add(replacement[0],layer(room),name=>material(name,room),replacement[1],replacement[2]||0));parts+=currentItem.meshes.length;}else build();root.updateMatrixWorld(true);
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
  const room='dining',meshes=options.assets.add('chair',layer(room),name=>material(name,room),[x,0,z],angle);parts+=meshes.length;root.updateMatrixWorld(true);const bounds=new THREE.Box3();for(const m of meshes)bounds.union(new THREE.Box3().setFromObject(m));bounds.applyMatrix4(root.matrixWorld.clone().invert());const id='chair-'+x+'-'+z;items.push({id,room,min:bounds.min.toArray(),max:bounds.max.toArray()});blockers.push({id,minX:bounds.min.x,maxX:bounds.max.x,minZ:bounds.min.z,maxZ:bounds.max.z});
 }
 function bed(room,cx,cz,width,length,angle,headColor) {
  const meshes=options.assets.add(room+'-bed',layer(room),name=>material(name,room),[cx,0,cz],angle);parts+=meshes.length;root.updateMatrixWorld(true);const b=new THREE.Box3();for(const m of meshes)b.union(new THREE.Box3().setFromObject(m));b.applyMatrix4(root.matrixWorld.clone().invert());items.push({id:room+'-bed',room,min:b.min.toArray(),max:b.max.toArray()});blockers.push({id:room+'-bed',minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z});contact(room,cx,cz,length,width);const west=angle>0,headWall=room==='master'?'west':'east',plane=wallFace(headWall,0,west?1:-1);placements.push({id:room+'-bed',headWall,wallFace:plane,headDirection:west?'west':'east',headGap:west?b.min.x-plane:plane-b.max.x,layout:{head:west?b.min.x:b.max.x,north:b.min.z,south:b.max.z,foot:west?b.max.x:b.min.x}});
 }
 function wardrobe(room,id,cx,cz,width,depth,backWall){
  item(id,room,()=>{currentItem.meshes.push(...options.assets.add(room+'-wardrobe',layer(room),name=>material(name,room),[cx,0,cz]));parts+=currentItem.meshes.length;});const back=items[items.length-1].min[2],plane=wallFace(backWall,1,1);placements.push({id,backWall,wallFace:plane,back,gap:back-plane});
 }
 function assembledItem(id,room,cx,cz,angle,build){
  item(id,room,()=>{build();const assembly=new THREE.Group();assembly.name=id;layer(room).add(assembly);for(const part of currentItem.meshes)assembly.add(part);assembly.position.set(cx,0,cz);assembly.rotation.y=angle;});
 }
 function storageRacks(){
  const north=wallFace('storage-north',1,1),south=wallFace('storage-south',1,-1),east=wallFace('east',0,-1),depth=.23,eastDepth=.26;
  const levels=[.22,.66,1.10,1.54,1.98,2.42],height=2.46;
  function rack(id,wall,cx,cz,width,d,angle,axis,side){
   const first=parts;
   assembledItem(id,'storage',cx,cz,angle,()=>{
    // 24 mm square posts, 18 mm inset boards and shallow steel support beams.
    for(const x of [-width/2+.02,width/2-.02])for(const z of [-d/2+.02,d/2-.02]){
     box('storage',x,1.25,z,.024,2.42,.024,'steel');box('storage',x,.025,z,.036,.024,.036,'black');
     for(const y of [.38,1.26,2.14])box('storage',x,y,z,.029,.055,.029,'steel');
    }
    for(const y of levels){
     box('storage',0,y,0,width-.034,.018,d-.034,'oak');
     for(const z of [-d/2+.016,d/2-.016])box('storage',0,y-.021,z,width-.028,.024,.014,'steel');
     for(const x of [-width/2+.016,width/2-.016])box('storage',x,y-.021,0,.014,.024,d-.028,'steel');
     for(const x of [-width/2+.02,width/2-.02]){
      const bolt=cylinder('storage',x,y-.021,d/2-.006,.004,.004,.004,'black');bolt.rotation.x=Math.PI/2;
     }
    }
    // Adjustment slots and flush wall ties remain inside the rack envelope.
    for(const x of [-width/2+.02,width/2-.02]){
     for(let i=0;i<23;i++)box('storage',x,.14+i*.1,d/2-.007,.004,.014,.002,'black');
     for(const y of [1.25,2.35]){box('storage',x,y,-d/2+.004,.04,.035,.008,'steel');box('storage',x,y+.02,-d/2+.021,.04,.006,.042,'steel');}
    }
   });
   const bounds=items[items.length-1],back=side===1?bounds.min[axis]:bounds.max[axis],plane=wallFace(wall,axis===2?1:0,side);
   placements.push({id,backWall:wall,wallFace:plane,back,gap:side*(back-plane),width,depth:d,height,boardThickness:.018,postWidth:.024,levels:levels.slice(),parts:parts-first});
  }
  // The north rack starts beyond the west door's entire hinged sweep.
  rack('storage-rack-north','storage-north',(5.37+east)/2,north+depth/2,east-5.37,depth,0,2,1);
  rack('storage-rack-east','east',east-eastDepth/2,(north+depth+south-depth)/2,south-north-2*depth,eastDepth,-Math.PI/2,0,-1);
  rack('storage-rack-south','storage-south',(4.65+east)/2,south-depth/2,east-4.65,depth,Math.PI,2,-1);
 }
 function laundry(){
  const east=wallFace('balcony-east',0,-1),depth=.68,cx=east-depth/2,cz=11.95,angle=Math.PI/2;
  assembledItem('balcony-laundry','balcony',cx,cz,angle,()=>{
   const width=.68;
   for(const x of [-width/2+.009,width/2-.009])box('balcony',x,1.15,0,.018,2.24,depth,'cream');
   box('balcony',0,1.15,depth/2-.009,width-.036,2.24,.018,'cream');
   for(const y of [.039,1.095,2.261])box('balcony',0,y,0,width-.036,.018,depth,'cream');
   for(const y of [.58,1.66]){
    round('balcony',0,y,-.005,.598,.994,.62,'white');box('balcony',0,y,-.325,.58,.94,.018,'white');
    const drum=cylinder('balcony',0,y-.055,-.351,.207,.207,.027,'steel');drum.rotation.x=Math.PI/2;
    const glass=cylinder('balcony',0,y-.055,-.372,.169,.169,.018,'black');glass.rotation.x=Math.PI/2;
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.186,.013,10,56),material('steel','balcony'));rim.position.set(0,y-.055,-.389);layer('balcony').add(rim);currentItem.meshes.push(rim);parts++;
    box('balcony',-.112,y+.345,-.339,.23,.055,.014,'black');
    const knob=cylinder('balcony',.18,y+.345,-.351,.027,.027,.024,'steel');knob.rotation.x=Math.PI/2;
    box('balcony',-.17,y+.43,-.34,.19,.047,.013,'cream');
    for(let i=0;i<8;i++)box('balcony',.10+i*.014,y-.418,-.34,.007,.017,.012,'black');
    box('balcony',.192,y-.055,-.392,.022,.106,.015,'steel');
    for(const x of [-.24,.24])for(const z of [-.23,.23])cylinder('balcony',x,y-.505,z,.015,.015,.025,'black');
   }
  });
  const bounds=items[items.length-1],normal=new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0),angle);
  placements.push({id:'balcony-laundry',backWall:'balcony-east',wallFace:east,back:bounds.max[0],gap:east-bounds.max[0],facing:'west',frontNormal:normal.toArray(),cabinetWidth:.68,cabinetDepth:depth});
 }
 function build() {
  if(built)return;built=true;
  // Living zone: keep the study sliding-door parking strip clear along z=3.0.
  item('living-sofa','living',()=>{
   round('living',1.8,.24,5.92,2.28,.22,.8,'wood');round('living',1.8,.68,6.27,2.28,.57,.16,'navy');
   for(const x of [.75,2.85])round('living',x,.58,5.92,.18,.42,.83,'navy');
   for(const x of [1.13,1.8,2.47]){round('living',x,.46,5.87,.63,.19,.66,'navy');const back=round('living',x,.73,6.15,.63,.38,.17,'navy');back.rotation.x=-.08;piping('living',x,.557,5.87,.59,.61,'seam');}
   const cushion=round('living',.99,.72,6.0,.36,.34,.12,'mustard');cushion.rotation.z=.16;cushion.rotation.x=-.12;
   const cushion2=round('living',2.55,.72,6.0,.31,.31,.12,'linen');cushion2.rotation.z=-.17;
   for(const x of [.85,2.75])for(const z of [5.65,6.18])cylinder('living',x,.09,z,.016,.012,.18,'steel');
  });contact('living',1.8,5.92,2.3,.85);
  box('living',1.8,.014,4.97,2.55,.022,2.1,'rug');
  item('coffee-table','living',()=>{cylinder('living',1.75,.41,4.68,.41,.41,.04,'oak');cylinder('living',1.75,.386,4.68,.397,.404,.018,'wood');cylinder('living',1.75,.21,4.68,.22,.27,.34,'wood');cylinder('living',1.75,.045,4.68,.3,.3,.035,'black');
   book('living',1.69,.445,4.64,.26,.025,.19,'blue',.1);cylinder('living',1.92,.45,4.78,.048,.043,.06,'ceramic');
  });
  item('tv-console','living',()=>{round('living',2.44,.31,3.43,1.45,.4,.34,'wood');for(let i=0;i<3;i++){const x=1.956+i*.484;box('living',x,.31,3.609,.47,.34,.014,i===1?'oak':'wood');box('living',x,.425,3.624,.11,.006,.012,'brass');}for(const x of [1.86,3.02])cylinder('living',x,.075,3.43,.013,.011,.15,'steel');});
  item('television','living',()=>{round('living',2.44,1.0,3.41,1.3,.76,.048,'black','wall');box('living',2.44,.57,3.44,.32,.065,.16,'black');cylinder('living',2.44,.624,3.43,.026,.026,.08,'black');},false);
  const screenCanvas=document.createElement('canvas');screenCanvas.width=512;screenCanvas.height=288;const sc=screenCanvas.getContext('2d');sc.fillStyle='#26313c';sc.fillRect(0,0,512,288);sc.fillStyle='#d7d1bd';sc.beginPath();sc.arc(185,136,80,0,Math.PI*2);sc.fill();sc.fillStyle='#3c5363';sc.beginPath();sc.arc(205,119,73,0,Math.PI*2);sc.fill();sc.fillStyle='#9aa9ad';for(let i=0;i<4;i++)sc.fillRect(306,105+i*23,135-i*17,4);const screenTexture=new THREE.CanvasTexture(screenCanvas);screenTexture.encoding=THREE.sRGBEncoding;const screen=new THREE.Mesh(new THREE.PlaneGeometry(1.22,.68),new THREE.MeshBasicMaterial({map:screenTexture,toneMapped:false}));screen.position.set(2.44,1.0,3.436);layer('living','wall').add(screen);
  for(let i=0;i<3;i++)art('living',.85+i*.5,1.85,6.34,.36,.45,Math.PI,i);
  art('living',1.45,1.83,3.0,.35,.52,0,2);
  // Round dining set, separate from the entry-door swept area.
  item('dining-table','dining',()=>{cylinder('dining',4.48,.75,4.87,.58,.58,.065,'oak');cylinder('dining',4.48,.38,4.87,.11,.24,.69,'wood');cylinder('dining',4.48,.04,4.87,.31,.31,.05,'steel');});
  chair(3.65,4.86,-Math.PI/2);chair(5.32,4.86,Math.PI/2);chair(4.48,5.72,0);
  item('dining-sideboard','dining',()=>{box('dining',5.95,.45,4.6,.28,.73,1.06,'wood');box('dining',5.8,.52,4.42,.018,.31,.42,'blue');box('dining',5.8,.33,4.92,.018,.26,.35,'cream');});
  item('fridge','dining',()=>{round('dining',5.76,1.0,5.9,.62,1.98,.68,'steel');box('dining',5.438,1.01,5.9,.014,.012,.66,'black');box('dining',5.429,1.33,5.7,.014,.32,.018,'steel');box('dining',5.44,.1,5.9,.018,.07,.57,'black');});
  options.assets.add('pendant',layer('dining','ceiling'),name=>material(name,'dining'),[4.48,0,4.87]);
  for(const [x,z] of [[4.32,4.82],[4.62,4.95]]){cylinder('dining',x,.813,z,.09,.09,.01,'cream');cylinder('dining',x,.85,z-.04,.028,.028,.07,'cream');}
  // Kitchen: cabinet modules stop below the north window, leaving the original doorway intact.
  item('kitchen-east-cabinets','kitchen',()=>{box('kitchen',5.79,.46,1.43,.62,.82,2.53,'oak');box('kitchen',5.77,.91,1.43,.67,.055,2.56,'stone');for(let i=0;i<5;i++){box('kitchen',5.47,.48,.45+i*.48,.02,.68,.45,'wood');box('kitchen',5.45,.71,.45+i*.48,.018,.018,.17,'steel');}box('kitchen',6.09,1.28,1.45,.018,.68,2.5,'tile','wall');box('kitchen',5.94,2.13,1.5,.31,.7,2.4,'cream','wall');for(let i=0;i<5;i++)box('kitchen',5.798,2.1,.48+i*.49,.016,.59,.007,'white','wall');});
  item('kitchen-north-cabinets','kitchen',()=>{box('kitchen',4.94,.46,.39,1.03,.82,.59,'oak');box('kitchen',4.93,.91,.4,1.06,.055,.63,'stone');box('kitchen',4.88,.945,.39,.58,.018,.4,'steel');box('kitchen',4.88,.951,.39,.45,.02,.29,'black');cylinder('kitchen',5.19,1.07,.26,.016,.016,.26,'steel');box('kitchen',5.08,1.19,.26,.23,.026,.025,'steel');});
  box('kitchen',5.75,.948,2.07,.48,.015,.53,'black');for(const z of [1.92,2.23]){cylinder('kitchen',5.74,.96,z,.1,.1,.018,'steel');cylinder('kitchen',5.74,1.02,z,.085,.085,.11,'black');}
  box('kitchen',5.91,1.79,2.08,.36,.09,.6,'black','wall');box('kitchen',5.94,1.72,1.5,.32,.016,2.4,'glow','wall');
  // Bedrooms are mapped by balcony adjacency, not by an assumed photograph compass.
  bed('master',1.1,10.2,1.55,2.02,Math.PI/2,'mustard');box('master',1.25,.014,10.2,2.3,.022,2.1,'rug');
  wardrobe('master','master-wardrobe',.95,8.5425,1.6,.6,'bath-south');
  item('master-nightstand','master',()=>{box('master',.43,.29,11.31,.45,.52,.37,'wood');cylinder('master',.43,.7,11.31,.12,.12,.17,'cream');});
  art('master',.105,1.75,10.05,.55,.75,Math.PI/2,0);art('master',.105,1.7,10.85,.36,.48,Math.PI/2,1);
  bed('second',5.14,9.65,1.35,1.94,-Math.PI/2,'linen');box('second',5.0,.014,9.65,2.25,.022,1.85,'blue');
  wardrobe('second','second-wardrobe',5.25,7.9175,1.5,.55,'storage-south');
  item('second-nightstand','second',()=>{round('second',5.88,.31,8.66,.34,.48,.30,'wood');box('second',5.88,.39,8.504,.25,.006,.008,'brass');cylinder('second',5.88,.64,8.66,.045,.045,.13,'steel');cylinder('second',5.88,.77,8.66,.1,.12,.13,'linen');});art('second',6.095,1.7,9.5,.58,.72,-Math.PI/2,2);
  // Keep bathroom fixtures inside its original boundary; the reference dry-area relocation is unconfirmed.
  item('bath-vanity','bath',()=>{box('bath',.55,.56,7.91,.7,.48,.36,'wood');box('bath',.55,.82,7.91,.74,.06,.39,'stone');cylinder('bath',.55,.85,7.9,.18,.18,.025,'cream');round('bath',.55,1.48,8.135,.64,.78,.025,'glow','wall',Math.PI);round('bath',.55,1.48,8.115,.59,.73,.018,'mirror','wall',Math.PI);box('bath',.55,1.02,8.07,.08,.05,.07,'steel');});
  item('toilet','bath',()=>{cylinder('bath',.47,.22,6.96,.16,.13,.36,'white');const bowl=mesh('bath','furniture','sphere',.47,.36,6.98,[1],'white');bowl.scale.set(.21,.14,.29);const lid=mesh('bath','furniture','sphere',.47,.46,6.99,[1],'white');lid.scale.set(.206,.025,.28);round('bath',.47,.61,6.73,.37,.43,.17,'white');box('bath',.47,.83,6.73,.09,.009,.045,'steel');});
  box('bath',1.35,.025,6.86,.69,.04,.72,'stone');cylinder('bath',1.65,2.04,6.76,.055,.055,.025,'steel','wall');
  // Secondary spaces keep generous circulation and unobstructed doors.
  item('study-desk','study',()=>{box('study',2.25,.75,1.63,.73,.055,1.38,'oak');for(const z of [1.05,2.21])box('study',2.25,.37,z,.58,.72,.035,'steel');});
  item('study-chair','study',()=>{round('study',2.97,.46,1.62,.45,.08,.46,'green');round('study',3.16,.7,1.62,.06,.43,.45,'linen');for(const z of [1.45,1.8])box('study',2.97,.23,z,.03,.44,.03,'steel');});
  storageRacks();laundry();
  // Trim lights are emissive surfaces, not additional shadow-casting point lights.
  for(const [room,x,z,w,d] of [['living',1.65,4.65,2.95,3.05],['dining',4.7,4.65,2.65,3.05],['master',1.6,10,2.85,3.1],['second',4.7,9.4,2.6,2.8]]){
   for(const zz of [z-d/2,z+d/2])box(room,x,2.705,zz,w,.02,.025,'glow','ceiling');
   for(const xx of [x-w/2,x+w/2])box(room,xx,2.705,z,.025,.02,d,'glow','ceiling');
  }
  details();merge();
 }
 function details(){
  // Skirting follows the common wall/opening data. Built-in furniture masks the
  // hidden lengths; it never changes structural geometry or collision walls.
  const trimRoom=(x,z)=>rooms.find(r=>!['balcony','equipment1','equipment2'].includes(r.id)&&x>r.x+.001&&x<r.x+r.w-.001&&z>r.z+.001&&z<r.z+r.d-.001);
  for(const wall of options.planLayout.walls){if(wall.guard)continue;const along=wall.a[1]===wall.b[1],length=along?wall.b[0]-wall.a[0]:wall.b[1]-wall.a[1];
   for(const side of [-1,1]){let start=null,lastRoom=null;const n=Math.ceil(length/.04);for(let i=0;i<=n;i++){const distance=i*length/n,x=wall.a[0]+(along?distance:side*(wall.t/2+.009)),z=wall.a[1]+(along?side*(wall.t/2+.009):distance),r=trimRoom(x,z),opening=(wall.openings||[]).some(o=>o.kind!=='window'&&distance>o.a-.025&&distance<o.b+.025),behind=blockers.some(b=>x>b.minX-.018&&x<b.maxX+.018&&z>b.minZ-.018&&z<b.maxZ+.018),valid=i<n&&r&&!opening&&!behind;
    if(start!==null&&(!valid||r!==lastRoom)){const mid=(start+distance)/2,span=distance-start;if(span>.06){const cx=wall.a[0]+(along?mid:side*(wall.t/2+.009)),cz=wall.a[1]+(along?side*(wall.t/2+.009):mid);box(lastRoom.id,cx,.039,cz,along?span:.014,.072,along?.014:span,'oak','wall');}start=null;}
    if(valid&&start===null){start=distance;lastRoom=r;}
   }}
  }
  // Separate finish layer: visible interior aluminium profiles and timber sill.
  for(const wall of options.planLayout.walls)for(const opening of wall.openings||[]){if(opening.kind!=='window')continue;const along=wall.a[1]===wall.b[1],mid=(opening.a+opening.b)/2,span=opening.b-opening.a;
   for(const side of [-1,1]){const x=wall.a[0]+(along?mid:side*(wall.t/2+.018)),z=wall.a[1]+(along?side*(wall.t/2+.018):mid),r=trimRoom(x,z);if(!r)continue;
    box(r.id,x,.905,z,along?span:.065,.025,along?.065:span,'oak','wall');
    for(const height of [.93,2.27])box(r.id,x,height,z,along?span:.025,.025,along?.025:span,'black','wall');
    for(const end of [opening.a+.015,opening.b-.015,mid])box(r.id,wall.a[0]+(along?end:side*(wall.t/2+.018)),1.6,wall.a[1]+(along?side*(wall.t/2+.018):end),along?.025:.03,1.34,along?.03:.025,'black','wall');
   }
  }
  // Small built details share existing materials and are merged with their room.
  for(const x of [.67,2.92])for(let i=0;i<15;i++)tube('living',[[x,.028,4.03+i*.13],[x+(x<1?-.035:.035),.024,4.03+i*.13]],.0015,'linen');
  item('tv-console-accessories','living',()=>{plant('living',1.87,.515,3.43,.085);book('living',2.99,.532,3.46,.18,.022,.22,'red');book('living',2.99,.559,3.46,.16,.022,.2,'blue',.08);},false);


  item('dining-accessories','dining',()=>{plant('dining',4.65,.79,4.67,.075);cylinder('dining',4.24,.88,4.9,.037,.037,.17,'steel');cylinder('dining',4.24,.972,4.9,.034,.034,.014,'black');
   round('dining',5.93,.97,4.45,.24,.29,.22,'steel');box('dining',5.798,1.0,4.45,.014,.14,.15,'black');cylinder('dining',5.85,.86,4.64,.034,.034,.065,'cream');plant('dining',5.96,.82,4.89,.09);
  },false);
  for(const z of [.43,.91,1.39,1.87,2.35]){box('kitchen',5.448,.18,z,.012,.008,.38,'black');}
  item('kitchen-cookware','kitchen',()=>{for(const z of [1.92,2.23]){const ring=new THREE.Mesh(new THREE.TorusGeometry(.071,.008,6,32),material('steel','kitchen'));ring.rotation.x=-Math.PI/2;ring.position.set(5.74,1.08,z);layer('kitchen').add(ring);currentItem.meshes.push(ring);parts++;cylinder('kitchen',5.74,1.09,z,.019,.019,.028,'black');for(const x of [5.61,5.87])box('kitchen',x,1.025,z,.055,.022,.035,'steel');}},false);
  item('kitchen-sink-accessories','kitchen',()=>{
   tube('kitchen',[[5.19,.97,.26],[5.19,1.18,.26],[5.16,1.21,.26],[5.05,1.21,.26],[5.02,1.18,.26]],.012,'steel');box('kitchen',5.23,1.02,.26,.035,.006,.015,'steel');
  },false);
  item('kitchen-counter-accessories','kitchen',()=>{
   round('kitchen',5.89,1.1,.85,.21,.3,.015,'wood');cylinder('kitchen',5.69,1.03,.95,.048,.045,.16,'cream');
  },false);
  for(const [r,x,z] of [['master',.43,11.31],['second',5.88,8.66]]){box(r,x,.41,z-.195,.28,.008,.008,'brass');book(r,x,.565,z,.23,.022,.16,'blue');}
  item('bath-vanity-detail','bath',()=>{for(const y of [.48,.66])box('bath',.55,y,7.721,.59,.006,.012,'black');box('bath',.55,.61,7.707,.16,.008,.013,'brass');
   const bowl=new THREE.Mesh(new THREE.TorusGeometry(.135,.018,8,40),material('ceramic','bath'));bowl.rotation.x=-Math.PI/2;bowl.position.set(.55,.866,7.9);layer('bath').add(bowl);currentItem.meshes.push(bowl);parts++;
   cylinder('bath',.55,.867,7.9,.109,.109,.008,'stone');cylinder('bath',.79,.932,8.015,.027,.027,.17,'ceramic');box('bath',.79,1.021,8.015,.032,.015,.025,'black');
  },false);
  item('bath-shower-detail','bath',()=>{
   tube('bath',[[1.66,.96,6.69],[1.66,2.1,6.69],[1.57,2.13,6.69]],.011,'steel');
   round('bath',1.66,1.14,6.69,.11,.055,.07,'steel');
  },false);
  book('study',2.24,.798,1.34,.26,.025,.2,'green');book('study',2.24,.829,1.34,.23,.025,.17,'blue');plant('study',2.2,.78,2.09,.08);
  // Pleated fabric panels sit beside the glazing rather than covering a doorway.
  function curtain(room,cx,cz,w,h,angle){const g=new THREE.PlaneGeometry(w,h,16,20),p=g.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,.016*Math.sin(p.getX(i)/w*Math.PI*12));g.computeVertexNormals();const m=material('linen',room),mesh=new THREE.Mesh(g,m);m.side=THREE.DoubleSide;mesh.position.set(cx,.13+h/2,cz);mesh.rotation.y=angle;mesh.receiveShadow=true;layer(room,'wall').add(mesh);parts++;}
  for(const z of [3.58,5.76])curtain('living',.17,z,.24,2.5,Math.PI/2);
  for(const x of [.69,2.42])curtain('master',x,11.64,.2,2.5,0);
  for(const x of [3.64,5.64])curtain('second',x,10.89,.2,2.5,0);
 }
 function merge() {
  // Merge by material within each visibility layer to keep mobile draw calls bounded.
  for(const parent of Object.values(layers)){
   const buckets=new Map();parent.updateMatrixWorld(true);const inverse=parent.matrixWorld.clone().invert();const meshes=[];parent.traverse(m=>{if(m.isMesh)meshes.push(m);});
   for(const m of meshes){const key=m.material.uuid;if(!buckets.has(key))buckets.set(key,{material:m.material,positions:[],normals:[],uvs:[],colors:[]});const b=buckets.get(key),g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(inverse.clone().multiply(m.matrixWorld));for(const [name,attribute] of [['positions','position'],['normals','normal'],['uvs','uv']])for(const value of g.attributes[attribute].array)b[name].push(value);if(g.attributes.color)for(const value of g.attributes.color.array)b.colors.push(value);else for(let c=0;c<g.attributes.position.count*3;c++)b.colors.push(1);g.dispose();}
   parent.clear();for(const b of buckets.values()){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.normals,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uvs,2));g.setAttribute('color',new THREE.Float32BufferAttribute(b.colors,3));b.material.vertexColors=true;g.computeBoundingSphere();const m=new THREE.Mesh(g,b.material);m.castShadow=!b.material.transparent&&b.material.emissiveIntensity<1;m.receiveShadow=true;parent.add(m);}
  }
 }
 function update(nextMode=mode) {
  mode=nextMode;$('showFurniture').disabled=preset==='bare';if(preset==='bare')$('showFurniture').checked=false;const visible=$('showFurniture').checked;group.visible=preset==='a'&&visible;
  for(const g of Object.values(layers))g.visible=g.userData.layer==='ceiling'?mode==='walk'&&$('showCeiling').checked:g.userData.layer==='wall'?mode==='walk':true;
  const on=$('showLights').checked;for(const m of glowing)m.emissiveIntensity=on?.65*Number($('lightPower').value):0;
  const daylight=document.body.dataset.time!=='night',reflectionPower=daylight?.85:on?.28:.02;for(const m of Object.values(materials))m.envMapIntensity=m.userData.envStrength*reflectionPower;
  $('decorPreset').value=preset;$('decorStatus').textContent=preset==='a'?'家装预设 A · 暖木 / 米白 / 深蓝。床头与衣柜靠墙，电视在北侧，沙发在南侧。':'毛坯方案 · 无家具，墙面、天花板与地面为水泥基底，可继续调整颜色和材质。';renderer.shadowMap.needsUpdate=true;
 }
 function presetPalette(value){const data={};for(const room of rooms){data[room.id]=clone(value==='bare'?barePalette:palette);if(value==='a'&&['kitchen','bath','storage','balcony','equipment1','equipment2'].includes(room.id)){data[room.id].floor={material:'tile',color:room.id==='bath'?'#c3beb2':'#c8c1b2'};if(room.id==='bath')data[room.id].wall={material:'tile',color:'#c4beb0'};}}return data;}
 function apply(value,restoring=false) {
  if(!['bare','a'].includes(value))value='bare';
  if(!restoring&&value!==preset){
   if(value==='a'){bareFinishes=clone(finishes.diagnostics.rooms);finishes.restore(aFinishes||presetPalette('a'));$('showFurniture').checked=true;}
   else {aFinishes=clone(finishes.diagnostics.rooms);finishes.restore(bareFinishes||presetPalette('bare'));}
  }
  preset=value;if(preset==='a')build();update();
 }
 finishes.restore(presetPalette('bare'));
 $('decorPreset').addEventListener('change',e=>apply(e.target.value));
 return {apply,update,restore(data){bareFinishes=data?.bareFinishes&&typeof data.bareFinishes==='object'?clone(data.bareFinishes):null;aFinishes=data?.aFinishes&&typeof data.aFinishes==='object'?clone(data.aFinishes):null;apply(data?.preset||'bare',true);if(preset==='bare')finishes.restore(bareFinishes||presetPalette('bare'));},read(){return {preset,bareFinishes:preset==='bare'?clone(finishes.diagnostics.rooms):bareFinishes?clone(bareFinishes):null,aFinishes:preset==='a'?clone(finishes.diagnostics.rooms):aFinishes?clone(aFinishes):null};},clearAt(x,z){if(preset!=='a'||!$('showFurniture').checked)return true;const px=x+3.1,pz=z+6.25,r=.13;return !blockers.some(b=>px>b.minX-r&&px<b.maxX+r&&pz>b.minZ-r&&pz<b.maxZ+r);},get diagnostics(){return {preset,built,visible:group.visible,parts,mergedMeshes:Object.values(layers).reduce((n,g)=>n+g.children.length,0),items:clone(items),placements:clone(placements),blockingObjects:blockers.length,furnitureCount:preset==='bare'?0:items.length,architectureUnchanged:true,lighting:'Architectural bake; shadowed sunlight, room-captured PMREM reflections, depth contact occlusion, linear PBR materials'};}};
}
