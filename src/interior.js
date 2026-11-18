function createRoomFinishes(options){
 const rooms=options.rooms,renderer=options.renderer,roof=options.roof,meshes=options.meshes;
 const surfaces=['wall','ceiling','floor'],settings={},entries=[],textures={},defaults={};
 const choices={wall:[['paint','哑光乳胶漆'],['plaster','细纹灰泥'],['wood','木饰面'],['tile','瓷砖'],['concrete','清水混凝土']],ceiling:[['paint','哑光乳胶漆'],['plaster','细纹灰泥'],['wood','木饰面'],['concrete','清水混凝土']],floor:[['wood','木地板'],['tile','瓷砖'],['stone','石材'],['concrete','清水混凝土']]};
 for(const r of rooms){const wet=['bath','kitchen','storage','balcony','equipment1','equipment2'].includes(r.id);settings[r.id]={wall:{color:'#e8ece5',material:'paint'},ceiling:{color:'#e5e5dc',material:'paint'},floor:{color:wet?'#c5d0c9':'#c9baa2',material:wet?'tile':'wood'}};defaults[r.id]=JSON.parse(JSON.stringify(settings[r.id]));}
 function texture(kind,surface){const key=kind==='wood'?kind+'-'+surface:kind;if(textures[key])return textures[key];const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#f6f6f6';ctx.fillRect(0,0,256,256);let seed=119;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
  if(kind==='wood'){const vertical=surface!=='floor';if(vertical){ctx.translate(256,0);ctx.rotate(Math.PI/2);}for(let row=0;row<5;row++){const y=row*51.2,v=235+Math.floor(rand()*6);ctx.fillStyle='rgb('+v+','+v+','+v+')';ctx.fillRect(0,y,256,52);ctx.fillStyle='rgba(100,100,100,.15)';ctx.fillRect(0,y,256,.65);if(!vertical){const off=(row%2?130:34)+rand()*25;ctx.fillRect(off,y,.65,51.2);}for(let n=0;n<64;n++){const gy=y+rand()*51.2,wave=1+rand()*2;ctx.strokeStyle='rgba(100,100,100,'+(.012+rand()*.025)+')';ctx.lineWidth=.35+rand()*.5;ctx.beginPath();ctx.moveTo(-2,gy);ctx.bezierCurveTo(78,gy-wave,171,gy+wave,258,gy);ctx.stroke();}}}
  else if(kind==='tile'){ctx.fillStyle='#dddddd';ctx.fillRect(0,0,2,256);ctx.fillRect(0,0,256,2);}
  else {const image=ctx.getImageData(0,0,256,256);for(let i=0;i<image.data.length;i+=4){const v=kind==='paint'?245+rand()*8:kind==='plaster'?229+rand()*23:kind==='concrete'?210+rand()*32:234+rand()*17;image.data[i]=image.data[i+1]=image.data[i+2]=v;}ctx.putImageData(image,0,0);if(kind==='stone'){for(let i=0;i<12;i++){ctx.strokeStyle='rgba(110,110,110,.14)';ctx.lineWidth=1;ctx.beginPath();const y=rand()*256;ctx.moveTo(0,y);ctx.bezierCurveTo(80,y+40,160,y-50,256,y+20);ctx.stroke();}}}
  const map=new THREE.CanvasTexture(c);map.encoding=THREE.sRGBEncoding;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);textures[key]=map;return map;
 }
 function roomAt(x,z){return rooms.find(r=>x>=r.x-1e-5&&x<=r.x+r.w+1e-5&&z>=r.z-1e-5&&z<=r.z+r.d+1e-5);}
 function configure(entry){const value=settings[entry.room.id][entry.kind],m=entry.material;m.color.set(value.color);m.map=texture(value.material,entry.kind);m.bumpMap=value.material==='paint'?null:m.map;m.bumpScale=value.material==='wood'?.002:value.material==='tile'?.004:.008;m.roughness=value.material==='tile'?.35:value.material==='stone'?.43:value.material==='wood'?.72:.9;m.metalness=0;m.vertexColors=false;m.needsUpdate=true;}
 function cloneMaterial(base,r,kind){const material=base.clone();material.onBeforeCompile=base.onBeforeCompile;material.customProgramCacheKey=base.customProgramCacheKey;const entry={room:r,kind,material};entries.push(entry);configure(entry);return material;}
 function clip(poly,axis,bound,keepGreater){const result=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],av=a.world[axis]-bound,bv=b.world[axis]-bound,ai=keepGreater?av>=-1e-7:av<=1e-7,bi=keepGreater?bv>=-1e-7:bv<=1e-7;if(ai)result.push(a);if(ai!==bi){const t=av/(av-bv),v={};for(const key of ['position','normal','uv','uv2','color','world'])if(a[key])v[key]=a[key].map((n,k)=>n+(b[key][k]-n)*t);result.push(v);}}return result;}
 const cutsX=[...new Set(rooms.reduce((a,r)=>a.concat([r.x,r.x+r.w]),[]))].sort((a,b)=>a-b),cutsZ=[...new Set(rooms.reduce((a,r)=>a.concat([r.z,r.z+r.d]),[]))].sort((a,b)=>a-b);
 for(const mesh of meshes){if(mesh.userData.floorFill){mesh.visible=false;continue;}const kind=mesh===roof?'ceiling':mesh.userData.surface;if(!kind)continue;const old=mesh.geometry,base=mesh.material,materials=[base],lookup={},output={position:[],normal:[],uv:[],uv2:[]},groups=[];if(old.attributes.color)output.color=[];
  mesh.updateMatrix();const matrix=mesh.matrix,normalMatrix=new THREE.Matrix3().getNormalMatrix(matrix),position=old.attributes.position,index=old.index;const count=index?index.count:position.count;
  function vertex(i){const v={};for(const key of Object.keys(output)){const a=old.attributes[key];v[key]=Array.from(a.array.slice(i*a.itemSize,(i+1)*a.itemSize));}v.world=new THREE.Vector3().fromArray(v.position).applyMatrix4(matrix).toArray();return v;}
  function emit(poly,materialIndex){if(poly.length<3)return;const start=output.position.length/3;for(let i=1;i<poly.length-1;i++){const a=poly[0].world,b=poly[i].world,c=poly[i+1].world;const area=new THREE.Vector3().fromArray(b).sub(new THREE.Vector3().fromArray(a)).cross(new THREE.Vector3().fromArray(c).sub(new THREE.Vector3().fromArray(a))).lengthSq();if(area<1e-15)continue;for(const v of [poly[0],poly[i],poly[i+1]])for(const key of Object.keys(output)){if(key==='uv'){const n=new THREE.Vector3().fromArray(v.normal).applyMatrix3(normalMatrix);output.uv.push(Math.abs(n.y)>.5?v.world[0]:Math.abs(n.x)>.5?v.world[2]:v.world[0],Math.abs(n.y)>.5?v.world[2]:v.world[1]);}else output[key].push(...v[key]);}}
   const added=output.position.length/3-start;if(added)groups.push({start,count:added,materialIndex});}
  for(let tri=0;tri<count;tri+=3){const poly=[0,1,2].map(k=>vertex(index?index.getX(tri+k):tri+k));const normal=new THREE.Vector3().fromArray(poly[0].normal).applyMatrix3(normalMatrix).normalize();const finishFace=kind==='wall'?Math.abs(normal.y)<.5:kind==='floor'?normal.y>.5:normal.y<-.5;if(!finishFace){emit(poly,0);continue;}
   const xs=poly.map(v=>v.world[0]),zs=poly.map(v=>v.world[2]),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);const xx=[minX,...cutsX.filter(x=>x>minX+1e-6&&x<maxX-1e-6),maxX],zz=[minZ,...cutsZ.filter(z=>z>minZ+1e-6&&z<maxZ-1e-6),maxZ];
   for(let xi=0;xi<xx.length-1;xi++)for(let zi=0;zi<zz.length-1;zi++){let piece=poly;if(maxX-minX>1e-6){piece=clip(piece,0,xx[xi],true);piece=clip(piece,0,xx[xi+1],false);}if(maxZ-minZ>1e-6){piece=clip(piece,2,zz[zi],true);piece=clip(piece,2,zz[zi+1],false);}if(piece.length<3)continue;const x=piece.reduce((s,v)=>s+v.world[0],0)/piece.length+normal.x*.025,z=piece.reduce((s,v)=>s+v.world[2],0)/piece.length+normal.z*.025,r=roomAt(x,z);if(kind==='floor'&&r&&mesh.userData.roomId&&r.id!==mesh.userData.roomId)continue;let mi=0;if(r){const key=r.id+kind;if(lookup[key]===undefined){lookup[key]=materials.length;materials.push(cloneMaterial(base,r,kind));}mi=lookup[key];}emit(piece,mi);}
  }
  // Coalesce each material into one draw group for mobile WebGL.
  const packed={};for(const key of Object.keys(output))packed[key]=[];const geom=new THREE.BufferGeometry();for(let mi=0;mi<materials.length;mi++){const start=packed.position.length/3;for(const g of groups){if(g.materialIndex!==mi)continue;for(const key of Object.keys(output)){const size=key==='uv'||key==='uv2'?2:3;packed[key].push(...output[key].slice(g.start*size,(g.start+g.count)*size));}}const count=packed.position.length/3-start;if(count)geom.addGroup(start,count,mi);}for(const key of Object.keys(packed))geom.setAttribute(key,new THREE.Float32BufferAttribute(packed[key],key==='uv'||key==='uv2'?2:3));geom.computeBoundingSphere();mesh.geometry=geom;mesh.material=materials;old.dispose();
 }
 const select=document.getElementById('finishRoom');for(const r of rooms){const option=document.createElement('option');option.value=r.id;option.textContent=r.name+(r.id==='equipment1'?'（南）':r.id==='equipment2'?'（北）':'');select.appendChild(option);}
 let active=rooms[0].id;function sync(){active=select.value;for(const kind of surfaces){const data=settings[active][kind],cap=kind.charAt(0).toUpperCase()+kind.slice(1),input=document.getElementById('finish'+cap+'Color'),menu=document.getElementById('finish'+cap+'Material');input.value=data.color;menu.value=data.material;const disabled=kind==='ceiling'&&['balcony','equipment1','equipment2'].includes(active);input.disabled=menu.disabled=disabled;}document.getElementById('finishNote').textContent=['balcony','equipment1','equipment2'].includes(active)?'室外空间没有天花板，可调整围墙与地板。':'共享墙体两侧可分别设置，修改即时生效。';}
 for(const kind of surfaces){const cap=kind.charAt(0).toUpperCase()+kind.slice(1),input=document.getElementById('finish'+cap+'Color'),menu=document.getElementById('finish'+cap+'Material');for(const choice of choices[kind]){const option=document.createElement('option');option.value=choice[0];option.textContent=choice[1];menu.appendChild(option);}const change=()=>{settings[active][kind]={color:input.value,material:menu.value};entries.filter(e=>e.room.id===active&&e.kind===kind).forEach(configure);};input.oninput=change;menu.onchange=change;}
 select.onchange=sync;document.getElementById('resetFinishes').onclick=()=>{settings[active]=JSON.parse(JSON.stringify(defaults[active]));entries.filter(e=>e.room.id===active).forEach(configure);sync();};sync();
 return {selectRoom(id){if(settings[id]){select.value=id;sync();}},get diagnostics(){return {rooms:JSON.parse(JSON.stringify(settings)),surfaces:entries.length,materialCounts:rooms.map(r=>({id:r.id,wall:entries.filter(e=>e.room===r&&e.kind==='wall').length,ceiling:entries.filter(e=>e.room===r&&e.kind==='ceiling').length,floor:entries.filter(e=>e.room===r&&e.kind==='floor').length}))};}};
}

function createHouseDoors(options){
 const group=new THREE.Group();options.root.add(group);
 const items=[],segments={value:Array.from({length:16},()=>new THREE.Vector4(1000,1000,1000,1000))};
 const normalWood=new THREE.MeshStandardMaterial({color:'#b9a389',roughness:.74});
 const entryFinish=new THREE.MeshStandardMaterial({color:'#443c34',roughness:.66,metalness:.08});
 const frameFinish=new THREE.MeshStandardMaterial({color:'#c5baaa',roughness:.82});
 const bronze=new THREE.MeshStandardMaterial({color:'#9d8560',roughness:.47,metalness:.55});
 const black=new THREE.MeshStandardMaterial({color:'#252b2c',roughness:.4,metalness:.35});
 const seal=new THREE.MeshStandardMaterial({color:'#504b43',roughness:1});
 [normalWood,entryFinish,frameFinish,bronze,black,seal].forEach(m=>options.shade(m));
 const h=2.1,overlap=.022,leafBottom=.012,leafTop=2.078;
 function clone(base){const m=base.clone();m.onBeforeCompile=base.onBeforeCompile;m.customProgramCacheKey=base.customProgramCacheKey;return m;}
 function box(parent,x,y,z,w,height,d,material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,height,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
 function leaf(item,parent,left,right,depth,isEntry){
  const width=right-left,cx=(left+right)/2,mat=isEntry?item.materials.entry:item.materials.wood;
  box(parent,cx,(leafBottom+leafTop)/2,0,width,leafTop-leafBottom,depth,mat);
  if(isEntry){
   // Restrained walnut-coloured slab, bronze perimeter and two-sided smart lock.
   for(const face of [-1,1]){
    const z=face*(depth/2+.004);
    box(parent,cx,.99,z,width-.13,1.86,.009,mat);
    for(const x of [left+.085,right-.085])box(parent,x,1.045,z+face*.006,.009,1.83,.004,item.materials.bronze);
    box(parent,cx,1.925,z+face*.006,width-.17,.009,.004,item.materials.bronze);
    const lockX=item.hingeSide==='left'?right-.115:left+.115;
    box(parent,lockX,1.12,z+face*.016,.052,.32,.028,item.materials.black);
    box(parent,lockX,1.12,z+face*.055,.022,.21,.03,item.materials.bronze);
    box(parent,cx,1.51,z+face*.009,.018,.018,.012,item.materials.bronze);
   }
  }else{
   // Flat panels avoid the oversized raised rectangles of the earlier doors.
   for(const face of [-1,1]){
    const z=face*(depth/2+.003);
    box(parent,cx,1.05,z,width-.12,1.87,.005,mat);
    const handleX=item.hingeSide==='left'?right-.105:left+.105;
    box(parent,handleX,1.015,z+face*.017,.033,.13,.022,item.materials.bronze);
    box(parent,handleX+(item.hingeSide==='left'?-.035:.035),1.025,z+face*.044,.105,.022,.032,item.materials.black);
   }
  }
 }
 function add(config){
  const item={...config,open:!config.entry,type:config.allowSliding?'sliding':'hinged',transparent:false};
  item.width=item.end-item.start;
  item.materials={wood:clone(normalWood),entry:clone(entryFinish),frame:clone(config.entry?entryFinish:frameFinish),bronze:clone(bronze),black:clone(black),seal:clone(seal)};
  const container=item.container=new THREE.Group();container.position.set(config.axis==='x'?config.start:config.fixed,0,config.axis==='x'?config.fixed:config.start);container.rotation.y=config.axis==='z'?-Math.PI/2:0;group.add(container);
  const W=item.width,depth=config.depth;
  // Jambs cover the raw opening. The leaf overlaps their stops by 22 mm.
  const leftJamb=item.sideWall!==undefined&&item.hingeSide==='left'?.1:.05,rightJamb=item.sideWall!==undefined&&item.hingeSide==='right'?.1:.05;
  for(const [x,jamb] of [[leftJamb/2,leftJamb],[W-rightJamb/2,rightJamb]]){
   box(container,x,h/2,0,jamb,h+.02,depth+.012,item.materials.frame);
   for(const face of [-1,1])box(container,x,h/2,face*(depth/2+.018),jamb+.038,h+.045,.025,item.materials.frame);
  }
  box(container,W/2,2.087,0,W+.06,.074,depth+.012,item.materials.frame);
  for(const face of [-1,1])box(container,W/2,2.1,face*(depth/2+.018),W+.1,.09,.025,item.materials.frame);
  box(container,W/2,.009,0,W,.018,depth+.016,item.materials.bronze);
  const hinged=item.hinged=new THREE.Group();container.add(hinged);
  const pivot=item.hinge=new THREE.Group();const hingeLeft=config.hingeSide==='left',leafLeft=leftJamb-overlap,leafRight=W-rightJamb+overlap;pivot.position.x=hingeLeft?leafLeft:leafRight;hinged.add(pivot);
  const span=leafRight-leafLeft;leaf(item,pivot,hingeLeft?0:-span,hingeLeft?span:0,.048,config.entry);
  item.hingedSegments=[{parent:pivot,a:hingeLeft?0:-span,b:hingeLeft?span:0,z:0}];
  const sliding=item.sliding=new THREE.Group();container.add(sliding);
  const run=(W-.056)/2,panelWidth=run+.02,outside=config.outside||1;
  item.closedPositions=[.028,.028+run-.02];
  item.parkPosition=config.stack==='left'?-panelWidth-.04:W+.04;
  item.panels=[];
  for(let i=0;i<2;i++){
   const panel=new THREE.Group();panel.position.set(item.closedPositions[i],0,outside*(depth/2+.0535+i*.035));sliding.add(panel);
   box(panel,panelWidth/2,(leafTop+.001)/2,0,panelWidth,leafTop-.001,.022,item.materials.wood);
   for(const face of [-1,1])box(panel,config.stack==='left'?panelWidth-.055:.055,1.02,face*.014,.024,.17,.006,item.materials.bronze);
   item.panels.push(panel);
  }
  const railStart=Math.min(-.045,item.parkPosition-.035),railEnd=Math.max(W+.045,item.parkPosition+panelWidth+.035);
  box(sliding,(railStart+railEnd)/2,2.183,outside*(depth/2+.076),railEnd-railStart,.055,.083,item.materials.bronze);
  item.panelWidth=panelWidth;items.push(item);
 }
 add({id:'entry',name:'入户门',axis:'z',fixed:6.2,start:2.9,end:3.94,depth:.18,hingeSide:'left',angle:Math.PI/2,entry:true});
 add({id:'study',name:'书房门',axis:'x',fixed:2.9,start:3.24,end:4.14,depth:.115,hingeSide:'right',angle:-Math.PI/2,stack:'left',outside:1,allowSliding:true});
 add({id:'kitchen',name:'厨房门',axis:'x',fixed:2.9,start:4.38,end:5.4,depth:.16,hingeSide:'left',angle:Math.PI/2,stack:'right',outside:1,allowSliding:true});
 add({id:'bath',name:'卫生间门',axis:'z',fixed:1.8,start:7.28,end:8.12,depth:.085,hingeSide:'right',angle:Math.PI/2,stack:'left',outside:-1,allowSliding:true});
 add({id:'storage',name:'储藏间门',axis:'z',fixed:4.4,start:6.85,end:7.6,depth:.085,hingeSide:'left',angle:Math.PI/2,stack:'right',outside:1,allowSliding:true});
 // The centre partition is 170 mm thick. Wider hinge jambs leave room for
 // the handle and a stopper when each bedroom leaf parks against that wall.
 add({id:'master',name:'主卧门',axis:'x',fixed:8.2,start:1.95,end:3.115,depth:.085,hingeSide:'right',angle:Math.PI/2,stack:'left',sideWall:3.115});
 add({id:'second',name:'次卧门',axis:'x',fixed:8.2,start:3.285,end:4.4,depth:.085,hingeSide:'left',angle:-Math.PI/2,stack:'right',sideWall:3.285});
 let liveSegments=[];
 function pose(item,progress=item.open?1:0){
  item.hinged.visible=item.type==='hinged';item.sliding.visible=item.type==='sliding';item.hinge.rotation.y=progress*item.angle;
  item.panels.forEach((panel,i)=>panel.position.x=THREE.MathUtils.lerp(item.closedPositions[i],item.parkPosition,progress));
 }
 function updateSegments(){
  for(const item of items)pose(item);options.root.updateMatrixWorld(true);liveSegments=[];
  for(const item of items){const descriptions=item.type==='hinged'?item.hingedSegments:item.panels.map(panel=>({parent:panel,a:0,b:item.panelWidth,z:0}));for(const shape of descriptions){const a=new THREE.Vector3(shape.a,0,shape.z).applyMatrix4(shape.parent.matrixWorld),b=new THREE.Vector3(shape.b,0,shape.z).applyMatrix4(shape.parent.matrixWorld);liveSegments.push({id:item.id,a,b,radius:item.type==='sliding'?.184:.194});}}
  segments.value.forEach((v,i)=>{const s=liveSegments[i];if(s)v.set(s.a.x,s.a.z,s.b.x,s.b.z);else v.set(1000,1000,1000,1000);});options.renderer.shadowMap.needsUpdate=true;
 }
 function sync(){
  for(const item of items){
   const row=document.querySelector('[data-door-row="'+item.id+'"]'),button=row.querySelector('[data-door]');button.textContent=item.open?'关闭':'打开';button.setAttribute('aria-pressed',String(item.open));row.querySelector('input').checked=item.transparent;
   const select=row.querySelector('select');if(select)select.value=item.type;
   for(const [key,m] of Object.entries(item.materials)){m.transparent=item.transparent;m.opacity=item.transparent?(key==='frame'?.38:key==='black'||key==='bronze'?.5:.16):1;m.depthWrite=!item.transparent;m.needsUpdate=true;}
  }
  const all=document.getElementById('transparentAllDoors');all.checked=items.every(i=>i.transparent);all.indeterminate=!all.checked&&items.some(i=>i.transparent);updateSegments();
 }
 for(const item of items){
  const row=document.createElement('div');row.className='door-row';row.dataset.doorRow=item.id;
  const head=document.createElement('div');head.className='door-row-head';const name=document.createElement('span');name.textContent=item.name;const button=document.createElement('button');button.className='door-button';button.dataset.door=item.id;button.onclick=()=>{item.open=!item.open;sync();};head.append(name,button);row.appendChild(head);
  const controls=document.createElement('div');controls.className='door-row-controls';
  if(item.allowSliding){const select=document.createElement('select');select.setAttribute('aria-label',item.name+'形式');for(const [value,label] of [['hinged','平开门'],['sliding','房外单侧推拉']]){const option=document.createElement('option');option.value=value;option.textContent=label;select.appendChild(option);}select.onchange=()=>{item.type=select.value;sync();};controls.appendChild(select);}else{const style=document.createElement('span');style.className='door-style';style.textContent=item.entry?'深木色 · 古铜五金':'贴墙平开 · 90°';controls.appendChild(style);}
  const label=document.createElement('label');label.className='door-transparent';const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.setAttribute('aria-label',item.name+'透明显示');checkbox.onchange=()=>{item.transparent=checkbox.checked;sync();};label.append(checkbox,document.createTextNode('透明'));controls.appendChild(label);row.appendChild(controls);document.getElementById('doorList').appendChild(row);
 }
 document.getElementById('openAllDoors').onclick=()=>{items.forEach(i=>i.open=true);sync();};document.getElementById('closeAllDoors').onclick=()=>{items.forEach(i=>i.open=false);sync();};document.getElementById('transparentAllDoors').onchange=e=>{items.forEach(i=>i.transparent=e.target.checked);sync();};sync();
 function validateClosed(){
  const previous=items.map(i=>i.open);items.forEach(i=>{i.open=false;pose(i);});options.root.updateMatrixWorld(true);
  const ray=new THREE.Raycaster(),results=[];for(const item of items){let misses=0,total=0;const examples=[];for(let u=0;u<=30;u++)for(let v=0;v<=45;v++){const x=.004+(item.width-.008)*u/30,y=.004+(h-.008)*v/45,origin=new THREE.Vector3(x,y,-.32).applyMatrix4(item.container.matrixWorld),direction=new THREE.Vector3(0,0,1).transformDirection(item.container.matrixWorld);ray.set(origin,direction);ray.far=.7;const hits=ray.intersectObject(item.container,true).filter(hit=>hit.object.visible&&hit.object.parent.visible&&hit.object.parent.parent.visible);total++;if(!hits.length){misses++;if(examples.length<3)examples.push([x,y]);}}results.push({id:item.id,type:item.type,rays:total,gaps:misses,examples});}
  items.forEach((item,i)=>item.open=previous[i]);updateSegments();return results;
 }
 function validateMotion(){
  const previous=items.map(item=>({type:item.type,open:item.open})),results=[];
  options.root.updateMatrixWorld(true);
  const boxFor=object=>new THREE.Box3().setFromObject(object).expandByScalar(-.0005);
  const walls=(options.walls||[]).filter(mesh=>mesh.userData.surface==='wall').map(mesh=>({id:'wall-'+mesh.userData.bakeId,box:boxFor(mesh)}));
  const meshBoxes=object=>{const list=[];object.traverse(mesh=>{if(mesh.isMesh)list.push(boxFor(mesh));});return list;};
  const bodyBoxes=item=>item.type==='hinged'?meshBoxes(item.hinge):item.panels.flatMap(meshBoxes);
  const inverse=options.root.matrixWorld.clone().invert();
  for(const target of items.filter(item=>item.allowSliding)){
   target.type='sliding';const collisions=new Set(),envelopeCollisions=new Set(),sweep=new THREE.Box3(),otherSweeps={};let samples=0,outside=true;
   const room=options.rooms.find(room=>room.id===target.id);
   for(let step=0;step<=24;step++){
    pose(target,step/24);options.root.updateMatrixWorld(true);const moving=bodyBoxes(target);
    for(const panel of target.panels){const b=boxFor(panel).applyMatrix4(inverse);if(!(b.max.x<=room.x||b.min.x>=room.x+room.w||b.max.z<=room.z||b.min.z>=room.z+room.d))outside=false;}
    for(const b of moving){sweep.union(b);for(const wall of walls)if(b.intersectsBox(wall.box))collisions.add(wall.id);for(const other of items)for(const frame of other.container.children.filter(object=>object.isMesh))if(b.intersectsBox(boxFor(frame)))collisions.add(other.id+'-frame');}
    for(const other of items){if(other===target)continue;for(const type of other.allowSliding?['hinged','sliding']:['hinged']){other.type=type;const key=other.id+'-'+type;if(!otherSweeps[key])otherSweeps[key]=new THREE.Box3();for(let otherStep=0;otherStep<=24;otherStep++){pose(other,otherStep/24);options.root.updateMatrixWorld(true);const obstacles=bodyBoxes(other);for(const b of obstacles)otherSweeps[key].union(b);samples++;if(moving.some(a=>obstacles.some(b=>a.intersectsBox(b))))collisions.add(key);}}}
   }
   for(const wall of walls)if(sweep.intersectsBox(wall.box))envelopeCollisions.add(wall.id);for(const [key,b] of Object.entries(otherSweeps))if(sweep.intersectsBox(b))envelopeCollisions.add(key);
   results.push({id:target.id,pathSteps:25,otherDoorStates:samples,outsideRoom:outside,stackSide:target.stack,collisions:[...collisions],sweepEnvelopeCollisions:[...envelopeCollisions]});
  }
  items.forEach((item,i)=>Object.assign(item,previous[i]));updateSegments();return results;
 }
 return {segments,update(mode){group.visible=mode!=='plan';},validateClosed,validateMotion,clearAt(x,z){for(const s of liveSegments){const dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,t=THREE.MathUtils.clamp(((x-s.a.x)*dx+(z-s.a.z)*dz)/(dx*dx+dz*dz),0,1);if(Math.hypot(x-s.a.x-t*dx,z-s.a.z-t*dz)<s.radius)return false;}return true;},get diagnostics(){return items.map(item=>({id:item.id,name:item.name,open:item.open,type:item.type,transparent:item.transparent,angle:item.hinge.rotation.y,hingeSide:item.hingeSide,hinge:new THREE.Vector3().setFromMatrixPosition(item.hinge.matrixWorld).toArray(),opening:[item.start,item.end],wallClearance:item.sideWall===undefined?null:.054,leafFrameOverlap:overlap,slidingAllowed:!!item.allowSliding,mountedOutside:!!item.allowSliding,stackSide:item.allowSliding?item.stack:null,panelBounds:item.allowSliding?item.panels.map(panel=>{const b=new THREE.Box3().setFromObject(panel);return {min:b.min.toArray(),max:b.max.toArray()};}):null}));}};
}


function createBuildingGhost(options){
 // Orthogonal reconstruction of the supplied whole-floor sketch. The hatched
 // left end is this apartment; the corridor connects its existing east entry.
 const footprint=[[1.7,0],[6.2,0],[6.2,3],[10.9,3],[10.9,1.2],[11.7,1.2],[11.7,-3.4],[19.5,-3.4],[19.5,1.4],[20.3,1.4],[20.3,3],[25,3],[25,-.7],[29.8,-.7],[29.8,2.8],[31.5,2.8],[31.5,12.5],[0,12.5],[0,2.9],[1.7,2.9]];
 const apartment=[[1.7,0],[6.2,0],[6.2,12.5],[0,12.5],[0,2.9],[1.7,2.9]],partitions=[[[6.2,4.8],[7.6,4.8],[7.6,6],[11.3,6],[11.3,4.9],[20,4.9],[20,6.1],[23.8,6.1],[23.8,8.1],[25,8.1]],[[15.5,4.9],[15.5,12.5]],[[25,-.7],[25,12.5]]];
 const group=new THREE.Group();options.scene.add(group);const outline=footprint.map(p=>new THREE.Vector3(p[0]-3.1,0,p[1]-6.25));const shellMat=new THREE.MeshBasicMaterial({color:'#487b83',transparent:true,opacity:.065,side:THREE.DoubleSide,depthWrite:false,fog:false}),lineMat=new THREE.LineBasicMaterial({color:'#245566',transparent:true,opacity:.72,depthWrite:false,fog:false}),activeMat=new THREE.LineBasicMaterial({color:'#d49c35',transparent:true,opacity:1,depthWrite:false,fog:false});let floor=18,height=3,total=26;
 function rebuild(f,h,n){floor=f;height=h;total=Math.max(n,f);while(group.children.length){const obj=group.children[0];obj.geometry.dispose();group.remove(obj);}const bottom=-(floor-1)*height,top=total*height-(floor-1)*height,vertices=[];function wallRange(low,high){if(high<=low)return;for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length];vertices.push(a.x,low,a.z,b.x,low,b.z,a.x,high,a.z,b.x,low,b.z,b.x,high,b.z,a.x,high,a.z);}}
  wallRange(bottom,-.2);wallRange(height+.18,top);const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));group.add(new THREE.Mesh(geom,shellMat));
  const lines=[];function segment(a,b){lines.push(...a,...b);}for(let level=0;level<=total;level++){const y=bottom+level*height;if(Math.abs(y)<.05||Math.abs(y-height)<.05)continue;for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length];segment([a.x,y,a.z],[b.x,y,b.z]);}}
  for(const a of outline){segment([a.x,bottom,a.z],[a.x,-.2,a.z]);segment([a.x,height+.18,a.z],[a.x,top,a.z]);}
  // Show the corridor and adjacent homes on the selected floor and at the roof.
  for(const y of [-.16,top])for(const chain of partitions)for(let i=0;i<chain.length-1;i++)segment([chain[i][0]-3.1,y,chain[i][1]-6.25],[chain[i+1][0]-3.1,y,chain[i+1][1]-6.25]);
  const lineGeo=new THREE.BufferGeometry();lineGeo.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));group.add(new THREE.LineSegments(lineGeo,lineMat));
  const level=[];for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length];level.push(a.x,-.16,a.z,b.x,-.16,b.z);}const levelGeo=new THREE.BufferGeometry();levelGeo.setAttribute('position',new THREE.Float32BufferAttribute(level,3));group.add(new THREE.LineSegments(levelGeo,lineMat));
  const active=[];for(const y of [-.18,height+.16])for(let i=0;i<apartment.length;i++){const a=apartment[i],b=apartment[(i+1)%apartment.length];active.push(a[0]-3.1,y,a[1]-6.25,b[0]-3.1,y,b[1]-6.25);}const activeGeo=new THREE.BufferGeometry();activeGeo.setAttribute('position',new THREE.Float32BufferAttribute(active,3));group.add(new THREE.LineSegments(activeGeo,activeMat));
  const selectedWalls=[];for(const chain of partitions)for(let i=0;i<chain.length-1;i++){const a=chain[i],b=chain[i+1];selectedWalls.push(a[0]-3.1,0,a[1]-6.25,b[0]-3.1,0,b[1]-6.25,a[0]-3.1,2.8,a[1]-6.25,b[0]-3.1,0,b[1]-6.25,b[0]-3.1,2.8,b[1]-6.25,a[0]-3.1,2.8,a[1]-6.25);}const dividerGeo=new THREE.BufferGeometry();dividerGeo.setAttribute('position',new THREE.Float32BufferAttribute(selectedWalls,3));group.add(new THREE.Mesh(dividerGeo,shellMat));
  const shape=new THREE.Shape();footprint.forEach((p,i)=>i?shape.lineTo(p[0]-3.1,p[1]-6.25):shape.moveTo(p[0]-3.1,p[1]-6.25));shape.closePath();const floorGeo=new THREE.ShapeGeometry(shape);floorGeo.rotateX(Math.PI/2);floorGeo.translate(0,-.2,0);group.add(new THREE.Mesh(floorGeo,shellMat));
 }
 return {rebuild,update(mode){group.visible=mode==='orbit'&&document.getElementById('showBuilding').checked;},get bounds(){return new THREE.Box3(new THREE.Vector3(-4,-(floor-1)*height,-10),new THREE.Vector3(29,total*height-(floor-1)*height,7));},get diagnostics(){return {visible:group.visible,floor,storeyHeight:height,totalFloors:total,bottom:-(floor-1)*height,top:total*height-(floor-1)*height,apartmentLocation:'left',footprint:footprint.map(p=>p.slice()),reference:'用户整层示意图'};}};
}
