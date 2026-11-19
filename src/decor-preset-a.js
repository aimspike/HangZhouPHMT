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
  const definitions={wood:['#96704e','wood'],oak:['#bc936b','wood'],cream:['#eee6d8'],white:['#f4f0e7'],navy:['#2e3c4b','stripe'],blue:['#45576d','fabric'],linen:['#c3b8a6','fabric'],mustard:['#b3a05e','fabric'],rug:['#c6bfb1','fabric'],black:['#252b2d'],steel:['#a4aaa7'],orange:['#b95d30'],green:['#617260'],tile:['#c5bfb2','tiles'],stone:['#ddd5c4','stone'],glow:['#fff0d0'],mirror:['#839ba0'],red:['#944e39'],seam:['#7c8a91'],ceramic:['#dcd4bf'],brass:['#8d7652'],leaf:['#546b47'],soil:['#403b32']};
  const [color,texture]=definitions[name],fabric=['fabric','stripe'].includes(texture),metal=['steel','brass'].includes(name);const m=new THREE.MeshStandardMaterial({color,roughness:metal?.25:name==='mirror'?.13:fabric?.93:texture==='wood'?.46:name==='stone'?.36:name==='ceramic'?.3:.65,metalness:metal?.82:name==='mirror'?.8:0});m.color.convertSRGBToLinear();
  if(texture){const tx=surfaceTexture(texture);m.map=tx.map;m.bumpMap=tx.bump;m.bumpScale=fabric?.0009:texture==='wood'?.0014:.0006;}
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
   g=new THREE.ExtrudeGeometry(s,{depth:Math.max(.001,d-2*r),bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:2,curveSegments:3,steps:1});g.translate(0,0,-d/2+r);
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
  part(0,.45,0,.43,.07,.43,'linen');part(0,.73,.19,.43,.25,.035,'oak');piping(room,0,.489,0,.4,.4,'linen',g);
  for(const x of [-.19,.19])tube(room,[[x,.06,.21],[x,.06,-.19],[x,.09,-.22],[x,.42,-.22],[x,.45,-.18],[x,.45,.19],[x,.85,.2]],.009,'steel','furniture',g);
  tube(room,[[-.19,.06,-.19],[.19,.06,-.19]],.009,'steel','furniture',g);
  root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(g).applyMatrix4(root.matrixWorld.clone().invert());items.push({id:currentItem.id,room,min:bounds.min.toArray(),max:bounds.max.toArray()});blockers.push({id:currentItem.id,minX:bounds.min.x,maxX:bounds.max.x,minZ:bounds.min.z,maxZ:bounds.max.z});currentItem=previous;
 }
 function bed(room,cx,cz,width,length,angle,headColor) {
  const previous=currentItem,g=new THREE.Group();g.position.set(cx,0,cz);g.rotation.y=angle;layer(room).add(g);
  const add=(x,y,z,w,h,d,name)=>{const m=new THREE.Mesh(shape('round',[w,h,d]),material(name,room));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);parts++;return m;};
  add(0,.25,0,width,.22,length,'wood');add(0,.41,0,width-.02,.2,length-.035,'white');add(0,.535,0,width-.025,.065,length-.045,'linen');
  add(0,.67,-length/2+.055,width+.03,1.04,.11,headColor);
  for(const x of [-width/6,width/6])add(x,.72,-length/2+.112,.003,.72,.003,'seam');
  const cover=room==='master'?'blue':'linen';add(0,.585,.18,width-.035,.07,length*.68,cover);
  const quilt=new THREE.PlaneGeometry(width-.045,length*.68,18,22);quilt.rotateX(-Math.PI/2);const positions=quilt.attributes.position;
  for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i);positions.setY(i,.625+.009*Math.sin(z*25+x*12)+.004*Math.sin(x*39-z*9)-.035*Math.pow(Math.abs(x)/(width/2),8));positions.setZ(i,z+.18);}quilt.computeVertexNormals();
  const quiltMesh=new THREE.Mesh(quilt,material(cover,room));quiltMesh.material.side=THREE.DoubleSide;quiltMesh.receiveShadow=true;g.add(quiltMesh);parts++;
  add(0,.655,length*.29,width-.035,.045,.36,'navy');piping(room,0,.679,length*.29,width-.075,.33,'seam',g);
  for(const [i,x] of [-width*.245,width*.245].entries()){
   const pillow=new THREE.Mesh(shape('sphere',[1]),material('white',room));pillow.scale.set(width*.215,.095,.225);pillow.position.set(x,.64,-length/2+.36);pillow.rotation.y=(i?1:-1)*.07;g.add(pillow);pillow.castShadow=pillow.receiveShadow=true;parts++;
   const outline=Array.from({length:25},(_,k)=>{const a=k/24*Math.PI*2;return [x+Math.cos(a)*width*.204,.642,-length/2+.36+Math.sin(a)*.211];});tube(room,outline,.0016,'linen','furniture',g);
  }
  for(const x of [-width/2+.1,width/2-.1])for(const z of [-length/2+.15,length/2-.15]){const leg=new THREE.Mesh(shape('cylinder',[.018,.014,.14]),material('black',room));leg.position.set(x,.07,z);g.add(leg);parts++;}
  piping(room,0,.44,0,width-.03,length-.04,'linen',g);
  root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(g).applyMatrix4(root.matrixWorld.clone().invert());items.push({id:room+'-bed',room,min:b.min.toArray(),max:b.max.toArray()});blockers.push({id:room+'-bed',minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z});currentItem=previous;contact(room,cx,cz,angle?length:width,angle?width:length);
  const headWall=room==='master'?'bedroom-divider':'east',plane=wallFace(headWall,0,-1);
  placements.push({id:room+'-bed',headWall,wallFace:plane,headGap:plane-b.max.x,layout:{head:b.max.x,north:b.min.z,south:b.max.z,foot:b.min.x}});
 }
 function wardrobe(room,id,cx,cz,width,depth,backWall){
  item(id,room,()=>{box(room,cx,1.2,cz,width,2.4,depth,'cream');box(room,cx,.055,cz+.01,width-.06,.11,depth-.06,'black');
   for(let i=0;i<3;i++){const x=cx-width/2+width*(i+.5)/3;round(room,x,1.255,cz+depth/2+.009,width/3-.009,2.25,.018,'cream');box(room,x+width/6-.045,1.15,cz+depth/2+.027,.007,.32,.014,'brass');}
   box(room,cx,2.4,cz,width+.006,.018,depth,'cream');
  });const back=items[items.length-1].min[2],plane=wallFace(backWall,1,1);placements.push({id,backWall,wallFace:plane,back,gap:back-plane});
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
  cylinder('dining',4.48,2.56,4.87,.012,.012,.44,'cream','ceiling');cylinder('dining',4.48,2.29,4.87,.1,.23,.085,'orange','ceiling');cylinder('dining',4.48,2.244,4.87,.18,.18,.01,'glow','ceiling');
  for(const [x,z] of [[4.32,4.82],[4.62,4.95]]){cylinder('dining',x,.813,z,.09,.09,.01,'cream');cylinder('dining',x,.85,z-.04,.028,.028,.07,'cream');}
  // Kitchen: cabinet modules stop below the north window, leaving the original doorway intact.
  item('kitchen-east-cabinets','kitchen',()=>{box('kitchen',5.79,.46,1.43,.62,.82,2.53,'oak');box('kitchen',5.77,.91,1.43,.67,.055,2.56,'stone');for(let i=0;i<5;i++){box('kitchen',5.47,.48,.45+i*.48,.02,.68,.45,'wood');box('kitchen',5.45,.71,.45+i*.48,.018,.018,.17,'steel');}box('kitchen',6.09,1.28,1.45,.018,.68,2.5,'tile','wall');box('kitchen',5.94,2.13,1.5,.31,.7,2.4,'cream','wall');for(let i=0;i<5;i++)box('kitchen',5.798,2.1,.48+i*.49,.016,.59,.007,'white','wall');});
  item('kitchen-north-cabinets','kitchen',()=>{box('kitchen',4.94,.46,.39,1.03,.82,.59,'oak');box('kitchen',4.93,.91,.4,1.06,.055,.63,'stone');box('kitchen',4.88,.945,.39,.58,.018,.4,'steel');box('kitchen',4.88,.951,.39,.45,.02,.29,'black');cylinder('kitchen',5.19,1.07,.26,.016,.016,.26,'steel');box('kitchen',5.08,1.19,.26,.23,.026,.025,'steel');});
  box('kitchen',5.75,.948,2.07,.48,.015,.53,'black');for(const z of [1.92,2.23]){cylinder('kitchen',5.74,.96,z,.1,.1,.018,'steel');cylinder('kitchen',5.74,1.02,z,.085,.085,.11,'black');}
  box('kitchen',5.91,1.79,2.08,.36,.09,.6,'black','wall');box('kitchen',5.94,1.72,1.5,.32,.016,2.4,'glow','wall');
  // Bedrooms are mapped by balcony adjacency, not by an assumed photograph compass.
  bed('master',2.105,10.2,1.55,2.02,-Math.PI/2,'mustard');box('master',1.95,.014,10.2,2.3,.022,2.1,'rug');
  wardrobe('master','master-wardrobe',.95,8.5425,1.6,.6,'bath-south');
  item('master-nightstand','master',()=>{box('master',2.79,.29,11.31,.45,.52,.37,'wood');cylinder('master',2.79,.7,11.31,.12,.12,.17,'cream');});
  art('master',3.105,1.75,10.05,.55,.75,-Math.PI/2,0);art('master',3.105,1.7,10.85,.36,.48,-Math.PI/2,1);
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
  item('storage-shelves','storage',()=>{for(const y of [.18,.7,1.22,1.74,2.26])box('storage',5.91,y,6.95,.32,.04,.8,'oak');for(const z of [6.57,7.33])box('storage',6.03,1.22,z,.04,2.12,.04,'wood');});
  item('balcony-laundry','balcony',()=>{box('balcony',5.7,1.14,12.03,.65,2.22,.66,'cream');for(const y of [.62,1.62]){box('balcony',5.7,y,11.685,.58,.83,.025,'white');const ring=cylinder('balcony',5.7,y,11.66,.2,.2,.035,'steel');ring.rotation.x=Math.PI/2;const port=cylinder('balcony',5.7,y,11.635,.155,.155,.04,'black');port.rotation.x=Math.PI/2;}});
  // Trim lights are emissive surfaces, not additional shadow-casting point lights.
  for(const [room,x,z,w,d] of [['living',1.65,4.65,2.95,3.05],['dining',4.7,4.65,2.65,3.05],['master',1.6,10,2.85,3.1],['second',4.7,9.4,2.6,2.8]]){
   for(const zz of [z-d/2,z+d/2])box(room,x,2.705,zz,w,.02,.025,'glow','ceiling');
   for(const xx of [x-w/2,x+w/2])box(room,xx,2.705,z,.025,.02,d,'glow','ceiling');
  }
  details();merge();
 }
 function details(){
  // Small built details share existing materials and are merged with their room.
  for(const x of [.67,2.92])for(let i=0;i<15;i++)tube('living',[[x,.028,4.03+i*.13],[x+(x<1?-.035:.035),.024,4.03+i*.13]],.0015,'linen');
  item('tv-console-accessories','living',()=>{plant('living',1.87,.515,3.43,.085);book('living',2.99,.532,3.46,.18,.022,.22,'red');book('living',2.99,.559,3.46,.16,.022,.2,'blue',.08);},false);
  for(let i=0;i<20;i++){const a=i*Math.PI/10,cx=1.75+Math.sin(a)*.243,cz=4.68+Math.cos(a)*.243;cylinder('living',cx,.21,cz,.0035,.0035,.29,'oak');}
  cylinder('dining',4.48,.785,4.87,.568,.568,.016,'wood');
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
  for(const [r,x,z] of [['master',2.79,11.31],['second',5.88,8.66]]){box(r,x,.41,z-.195,.28,.008,.008,'brass');book(r,x,.565,z,.23,.022,.16,'blue');}
  item('bath-vanity-detail','bath',()=>{for(const y of [.48,.66])box('bath',.55,y,7.721,.59,.006,.012,'black');box('bath',.55,.61,7.707,.16,.008,.013,'brass');
   const bowl=new THREE.Mesh(new THREE.TorusGeometry(.135,.018,8,40),material('ceramic','bath'));bowl.rotation.x=-Math.PI/2;bowl.position.set(.55,.866,7.9);layer('bath').add(bowl);currentItem.meshes.push(bowl);parts++;
   cylinder('bath',.55,.867,7.9,.109,.109,.008,'stone');cylinder('bath',.79,.932,8.015,.027,.027,.17,'ceramic');box('bath',.79,1.021,8.015,.032,.015,.025,'black');
  },false);
  item('bath-shower-detail','bath',()=>{
   tube('bath',[[1.66,.96,6.69],[1.66,2.1,6.69],[1.57,2.13,6.69]],.011,'steel');
   round('bath',1.66,1.14,6.69,.11,.055,.07,'steel');
  },false);
  for(const y of [.62,1.62]){
   const bezel=new THREE.Mesh(new THREE.TorusGeometry(.183,.015,8,40),material('steel','balcony'));bezel.position.set(5.7,y,11.612);layer('balcony').add(bezel);parts++;
   box('balcony',5.58,y+.31,11.666,.21,.054,.012,'black');cylinder('balcony',5.85,y+.31,11.651,.026,.026,.018,'steel').rotation.x=Math.PI/2;
  }
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
   for(const m of meshes){const key=m.material.uuid;if(!buckets.has(key))buckets.set(key,{material:m.material,positions:[],normals:[],uvs:[]});const b=buckets.get(key),g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(inverse.clone().multiply(m.matrixWorld));for(const [name,attribute] of [['positions','position'],['normals','normal'],['uvs','uv']])for(const value of g.attributes[attribute].array)b[name].push(value);g.dispose();}
   parent.clear();for(const b of buckets.values()){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.normals,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uvs,2));g.computeBoundingSphere();const m=new THREE.Mesh(g,b.material);m.castShadow=!b.material.transparent&&b.material.emissiveIntensity<1;m.receiveShadow=true;parent.add(m);}
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
 return {apply,update,restore(data){bareFinishes=data?.bareFinishes&&typeof data.bareFinishes==='object'?clone(data.bareFinishes):null;aFinishes=data?.aFinishes&&typeof data.aFinishes==='object'?clone(data.aFinishes):null;apply(data?.preset||'bare',true);if(preset==='bare')finishes.restore(bareFinishes||presetPalette('bare'));},read(){return {preset,bareFinishes:preset==='bare'?clone(finishes.diagnostics.rooms):bareFinishes?clone(bareFinishes):null,aFinishes:preset==='a'?clone(finishes.diagnostics.rooms):aFinishes?clone(aFinishes):null};},clearAt(x,z){if(preset!=='a'||!$('showFurniture').checked)return true;const px=x+3.1,pz=z+6.25,r=.13;return !blockers.some(b=>px>b.minX-r&&px<b.maxX+r&&pz>b.minZ-r&&pz<b.maxZ+r);},get diagnostics(){return {preset,built,visible:group.visible,parts,mergedMeshes:Object.values(layers).reduce((n,g)=>n+g.children.length,0),items:clone(items),placements:clone(placements),blockingObjects:blockers.length,furnitureCount:preset==='bare'?0:items.length,architectureUnchanged:true,lighting:'Architectural bake; local furnishing fill, contact shadows, bump detail and a procedural reflection environment'};}};
}
