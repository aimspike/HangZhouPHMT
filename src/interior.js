function createRoomFinishes(options){
 const rooms=options.rooms,renderer=options.renderer,roof=options.roof,meshes=options.meshes;
 const surfaces=['wall','ceiling','floor'],settings={},entries=[],textures={},defaults={};
 const choices={wall:[['paint','哑光乳胶漆'],['plaster','细纹灰泥'],['wood','木饰面'],['tile','瓷砖'],['concrete','清水混凝土']],ceiling:[['paint','哑光乳胶漆'],['plaster','细纹灰泥'],['wood','木饰面'],['concrete','清水混凝土']],floor:[['wood','木地板'],['parquet','人字拼木地板'],['tile','瓷砖'],['stone','石材'],['concrete','清水混凝土']]};
 for(const r of rooms){const wet=['bath','kitchen','storage','balcony','equipment1','equipment2'].includes(r.id);settings[r.id]={wall:{color:'#e8ece5',material:'paint'},ceiling:{color:'#e5e5dc',material:'paint'},floor:{color:wet?'#c5d0c9':'#c9baa2',material:wet?'tile':'wood'}};defaults[r.id]=JSON.parse(JSON.stringify(settings[r.id]));}
 function texture(kind,surface){const key=kind==='wood'?kind+'-'+surface:kind;if(textures[key])return textures[key];const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#f6f6f6';ctx.fillRect(0,0,256,256);let seed=119;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
  if(kind==='wood'){const vertical=surface!=='floor';if(vertical){ctx.translate(256,0);ctx.rotate(Math.PI/2);}for(let row=0;row<5;row++){const y=row*51.2,v=235+Math.floor(rand()*6);ctx.fillStyle='rgb('+v+','+v+','+v+')';ctx.fillRect(0,y,256,52);ctx.fillStyle='rgba(100,100,100,.15)';ctx.fillRect(0,y,256,.65);if(!vertical){const off=(row%2?130:34)+rand()*25;ctx.fillRect(off,y,.65,51.2);}for(let n=0;n<64;n++){const gy=y+rand()*51.2,wave=1+rand()*2;ctx.strokeStyle='rgba(100,100,100,'+(.012+rand()*.025)+')';ctx.lineWidth=.35+rand()*.5;ctx.beginPath();ctx.moveTo(-2,gy);ctx.bezierCurveTo(78,gy-wave,171,gy+wave,258,gy);ctx.stroke();}}}
  else if(kind==='parquet'){for(let column=-1;column<3;column++)for(let row=-3;row<10;row++)for(const side of [-1,1]){const x=column*128+64,y=row*32,v=226+Math.floor(rand()*15);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+side*64,y+32);ctx.lineTo(x+side*64,y+62.5);ctx.lineTo(x,y+30.5);ctx.closePath();ctx.fillStyle='rgb('+v+','+v+','+v+')';ctx.fill();ctx.strokeStyle='rgba(70,70,70,.18)';ctx.lineWidth=.65;ctx.stroke();for(let line=0;line<12;line++){const offset=2+line*2.3;ctx.beginPath();ctx.moveTo(x,y+offset);ctx.lineTo(x+side*64,y+32+offset);ctx.strokeStyle='rgba(90,90,90,.025)';ctx.stroke();}}}
  else if(kind==='tile'){ctx.fillStyle='#dddddd';ctx.fillRect(0,0,2,256);ctx.fillRect(0,0,256,2);}
  else {const image=ctx.getImageData(0,0,256,256);for(let i=0;i<image.data.length;i+=4){const v=kind==='paint'?245+rand()*8:kind==='plaster'?229+rand()*23:kind==='concrete'?210+rand()*32:234+rand()*17;image.data[i]=image.data[i+1]=image.data[i+2]=v;}ctx.putImageData(image,0,0);if(kind==='stone'){for(let i=0;i<12;i++){ctx.strokeStyle='rgba(110,110,110,.14)';ctx.lineWidth=1;ctx.beginPath();const y=rand()*256;ctx.moveTo(0,y);ctx.bezierCurveTo(80,y+40,160,y-50,256,y+20);ctx.stroke();}}}
  const map=new THREE.CanvasTexture(c);map.encoding=THREE.sRGBEncoding;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);textures[key]=map;return map;
 }
 function dataTexture(kind,surface,channel){const key='data-'+kind+'-'+surface+'-'+channel;if(textures[key])return textures[key];const source=texture(kind,surface),c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.drawImage(source.image,0,0);if(channel==='roughness'){const image=ctx.getImageData(0,0,256,256);for(let i=0;i<image.data.length;i+=4){const v=224+(image.data[i]-235)*.7;image.data[i]=image.data[i+1]=image.data[i+2]=v;}ctx.putImageData(image,0,0);}const tx=new THREE.CanvasTexture(c);tx.encoding=THREE.LinearEncoding;tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);textures[key]=tx;return tx;}
 function roomAt(x,z){return rooms.find(r=>x>=r.x-1e-5&&x<=r.x+r.w+1e-5&&z>=r.z-1e-5&&z<=r.z+r.d+1e-5);}
 function configure(entry){const value=settings[entry.room.id][entry.kind],m=entry.material;m.userData.houseRoom=entry.room.id;m.userData.houseReflectionStrength=entry.kind==='ceiling'?.6:1;m.color.set(value.color).convertSRGBToLinear();m.map=texture(value.material,entry.kind);m.bumpMap=value.material==='paint'?null:dataTexture(value.material,entry.kind,'height');m.roughnessMap=dataTexture(value.material,entry.kind,'roughness');m.bumpScale=['wood','parquet'].includes(value.material)?.002:value.material==='tile'?.004:.008;m.roughness=value.material==='tile'?.35:value.material==='stone'?.43:['wood','parquet'].includes(value.material)?.48:.86;m.metalness=0;m.vertexColors=false;m.needsUpdate=true;}
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
 let active=rooms[0].id,scope='room';const outdoor=id=>['balcony','equipment1','equipment2'].includes(id),targets=kind=>rooms.filter(r=>(scope==='all'||r.id===active)&&(kind!=='ceiling'||!outdoor(r.id)));
 function sync(){active=select.value;select.disabled=scope==='all';document.querySelectorAll('[data-finish-scope]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.finishScope===scope)));document.getElementById('previewFinishRoom').disabled=scope==='all';document.getElementById('resetFinishes').textContent=scope==='all'?'恢复全屋默认材质':'恢复此房间默认材质';
  const mixed=[];for(const kind of surfaces){const available=targets(kind),data=settings[(scope==='all'?available[0]?.id:active)||active][kind],cap=kind.charAt(0).toUpperCase()+kind.slice(1),input=document.getElementById('finish'+cap+'Color'),menu=document.getElementById('finish'+cap+'Material');input.value=data.color;menu.value=data.material;const disabled=kind==='ceiling'&&scope==='room'&&outdoor(active);input.disabled=menu.disabled=disabled;if(scope==='all'&&available.some(r=>JSON.stringify(settings[r.id][kind])!==JSON.stringify(data)))mixed.push({wall:'墙面',floor:'地板',ceiling:'天花板'}[kind]);}
  document.getElementById('finishNote').textContent=scope==='all'?'每项调整应用到全屋；天花板仅应用于室内房间。'+(mixed.length?'当前'+mixed.join('、')+'有不同设置，修改后统一。':''):outdoor(active)?'室外空间没有天花板，可调整围墙与地板。':'共享墙体两侧可分别设置，修改即时生效。';
 }
 document.querySelectorAll('[data-finish-scope]').forEach(b=>b.onclick=()=>{scope=b.dataset.finishScope;sync();});
 for(const kind of surfaces){const cap=kind.charAt(0).toUpperCase()+kind.slice(1),input=document.getElementById('finish'+cap+'Color'),menu=document.getElementById('finish'+cap+'Material');for(const choice of choices[kind]){const option=document.createElement('option');option.value=choice[0];option.textContent=choice[1];menu.appendChild(option);}const change=()=>{const ids=targets(kind).map(r=>r.id);for(const id of ids)settings[id][kind]={color:input.value,material:menu.value};entries.filter(e=>ids.includes(e.room.id)&&e.kind===kind).forEach(configure);sync();};input.oninput=change;menu.onchange=change;}
 select.onchange=sync;document.getElementById('resetFinishes').onclick=()=>{const ids=scope==='all'?rooms.map(r=>r.id):[active];for(const id of ids)settings[id]=JSON.parse(JSON.stringify(defaults[id]));entries.filter(e=>ids.includes(e.room.id)).forEach(configure);sync();};sync();
 return {selectRoom(id){if(settings[id]){select.value=id;sync();}},restore(data){if(!data||typeof data!=='object')return;for(const r of rooms)for(const kind of surfaces){const v=data[r.id]?.[kind];if(v&&/^#[0-9a-f]{6}$/i.test(v.color)&&choices[kind].some(c=>c[0]===v.material))settings[r.id][kind]={color:v.color,material:v.material};}entries.forEach(configure);sync();},get diagnostics(){return {scope,rooms:JSON.parse(JSON.stringify(settings)),surfaces:entries.length,materialCounts:rooms.map(r=>({id:r.id,wall:entries.filter(e=>e.room===r&&e.kind==='wall').length,ceiling:entries.filter(e=>e.room===r&&e.kind==='ceiling').length,floor:entries.filter(e=>e.room===r&&e.kind==='floor').length}))};}};
}

function createPlanGlazing(options){
 const group=new THREE.Group();options.root.add(group);
 const white=new THREE.MeshBasicMaterial({color:'#f5f7f5',toneMapped:false});white.color.convertSRGBToLinear();
 const ink=new THREE.LineBasicMaterial({color:'#536d68',toneMapped:false});ink.color.convertSRGBToLinear();
 for(const w of options.walls)for(const op of w.openings||[]){
  if(op.kind!=='window'&&op.kind!=='sliding')continue;
  const along=w.a[1]===w.b[1],mid=(op.a+op.b)/2,length=op.b-op.a,t=w.t;
  const fill=new THREE.Mesh(new THREE.BoxGeometry(along?length:t+.004,.004,along?t+.004:length),white);fill.position.set(w.a[0]+(along?mid:0),.196,w.a[1]+(along?0:mid));group.add(fill);
  const points=[],p=(u,v)=>new THREE.Vector3(w.a[0]+(along?u:-v),.201,w.a[1]+(along?v:u));
  for(const v of [-t/2,-t/6,t/6,t/2])points.push(p(op.a,v),p(op.b,v));
  for(const u of [op.a,op.b])points.push(p(u,-t/2),p(u,t/2));
  group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),ink));
 }
 return {update(mode){group.visible=mode==='plan';}};
}

// Independent overlay: it never enters the lighting/collision meshes or replaces finishes.
function createBearingMarkers(options){
 const group=new THREE.Group();options.root.add(group);
 const material=new THREE.MeshBasicMaterial({color:'#b4513f',toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
 material.color.convertSRGBToLinear();
 const pieces=[];
 for(const wall of options.meshes){const fill=wall.userData.junction;if(!fill?.bearing)continue;const p=wall.geometry.parameters,mesh=new THREE.Mesh(new THREE.BoxGeometry(p.width+.004,1,p.depth+.004),material);mesh.position.set(wall.position.x,0,wall.position.z);group.add(mesh);pieces.push({mesh,wall,originalHeight:p.height});}
 for(const section of options.sections){
  const alongX=section.a[1]===section.b[1],a=Math.min(section.a[alongX?0:1],section.b[alongX?0:1]),b=Math.max(section.a[alongX?0:1],section.b[alongX?0:1]),fixed=section.a[alongX?1:0];
  for(const wall of options.meshes){
   if(wall.userData.surface!=='wall')continue;
   const p=wall.geometry.parameters,center=alongX?wall.position.x:wall.position.z,wallFixed=alongX?wall.position.z:wall.position.x,width=alongX?p.width:p.depth,thickness=alongX?p.depth:p.width;
   if(Math.abs(wallFixed-fixed)>.001||Math.abs(thickness-section.t)>.001)continue;
   const start=Math.max(a,center-width/2),end=Math.min(b,center+width/2);if(end-start<.002)continue;
   const mesh=new THREE.Mesh(new THREE.BoxGeometry(alongX?end-start+.002:thickness+.004,1,alongX?thickness+.004:end-start+.002),material);mesh.position.set(alongX?(start+end)/2:fixed,0,alongX?fixed:(start+end)/2);group.add(mesh);pieces.push({mesh,wall,originalHeight:p.height});
  }
 }
 return {update(mode){group.visible=mode!=='walk'&&document.getElementById('showBearing').checked;document.getElementById('bearingLegend').hidden=!group.visible;for(const {mesh,wall,originalHeight} of pieces){mesh.visible=wall.visible;if(!wall.visible)continue;const height=originalHeight*wall.scale.y,band=mode==='plan'?height:Math.min(.075,height),top=wall.position.y+height/2;mesh.scale.y=band;mesh.position.y=top-band/2+.004;}},get diagnostics(){return {source:'原图实黑区域',sections:options.sections.length,pieces:pieces.length,visible:group.visible};}};
}

function createHouseDoors(options){
 const group=new THREE.Group();options.root.add(group);
 const planGroup=new THREE.Group();options.root.add(planGroup);planGroup.visible=false;
 const planMaterial=new THREE.LineBasicMaterial({color:'#38564d',toneMapped:false,depthTest:false});
 planMaterial.color.convertSRGBToLinear();
 const items=[],segments={value:Array.from({length:16},()=>new THREE.Vector4(1000,1000,1000,1000))};
 const normalWood=new THREE.MeshStandardMaterial({color:'#b9a389',roughness:.74});
 const entryFinish=new THREE.MeshStandardMaterial({color:'#443c34',roughness:.66,metalness:.08});
 const frameFinish=new THREE.MeshStandardMaterial({color:'#c5baaa',roughness:.82});
 const bronze=new THREE.MeshStandardMaterial({color:'#9d8560',roughness:.47,metalness:.55});
 const black=new THREE.MeshStandardMaterial({color:'#252b2c',roughness:.4,metalness:.35});
 const seal=new THREE.MeshStandardMaterial({color:'#504b43',roughness:1});
 [normalWood,entryFinish,frameFinish,bronze,black,seal].forEach(m=>{m.color.convertSRGBToLinear();options.shade(m);});
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
  const item={...config,open:!config.entry,type:config.allowSliding&&options.defaultType==='sliding'?'sliding':'hinged',transparent:false};
  item.width=item.end-item.start;
  item.materials={wood:clone(normalWood),entry:clone(entryFinish),frame:clone(config.entry?entryFinish:frameFinish),bronze:clone(bronze),black:clone(black),seal:clone(seal)};for(const m of Object.values(item.materials)){m.userData.houseRoom=config.id==='entry'?'dining':config.id;m.userData.houseReflectionStrength=1;}
  const container=item.container=new THREE.Group();container.position.set(config.axis==='x'?config.start:config.fixed,0,config.axis==='x'?config.fixed:config.start);container.rotation.y=config.axis==='z'?-Math.PI/2:0;group.add(container);
  const W=item.width,depth=config.depth;
  // Jambs cover the raw opening. The leaf overlaps their stops by 22 mm.
  const leftJamb=.032,rightJamb=.032;
  const hingedFrame=item.hingedFrame=new THREE.Group();container.add(hingedFrame);
  for(const [x,jamb] of [[leftJamb/2,leftJamb],[W-rightJamb/2,rightJamb]]){
   box(hingedFrame,x,h/2,0,jamb,h,depth+.004,item.materials.frame);
   for(const face of [-1,1])box(hingedFrame,x,h/2,face*(depth/2+.008),.04,h+.02,.012,item.materials.frame);
  }
  box(hingedFrame,W/2,2.081,0,W,.038,depth+.004,item.materials.frame);
  for(const face of [-1,1])box(hingedFrame,W/2,2.09,face*(depth/2+.008),W+.008,.04,.012,item.materials.frame);
  box(hingedFrame,W/2,.009,0,W,.018,depth+.016,item.materials.bronze);
  const hinged=item.hinged=new THREE.Group();container.add(hinged);
  const pivot=item.hinge=new THREE.Group();const hingeLeft=config.hingeSide==='left',leafLeft=leftJamb-overlap,leafRight=W-rightJamb+overlap;
  // A concealed offset pivot keeps the bedroom leaf at its existing wall-parking axis.
  const pivotInset=item.sideWall===undefined?0:.068;pivot.position.x=hingeLeft?leafLeft+pivotInset:leafRight-pivotInset;hinged.add(pivot);
  leaf(item,pivot,leafLeft-pivot.position.x,leafRight-pivot.position.x,.048,config.entry);
  item.hingedSegments=[{parent:pivot,a:leafLeft-pivot.position.x,b:leafRight-pivot.position.x,z:0}];
  const sliding=item.sliding=new THREE.Group();container.add(sliding);
  const run=(W-.056)/2,panelWidth=run+.02,outside=config.outside||1;
  item.closedPositions=[.028,.028+run-.02];
  item.parkPosition=config.stack==='left'?-panelWidth-.04:W+.04;
  item.panels=[];
  for(let i=0;i<2;i++){
   const panel=new THREE.Group();panel.position.set(item.closedPositions[i],0,outside*(depth/2+.0535+i*.035));sliding.add(panel);
   box(panel,panelWidth/2,(leafTop+.001)/2,0,panelWidth,leafTop-.001,.022,item.materials.wood);
   for(const face of [-1,1])box(panel,config.stack==='left'?panelWidth-.055:.055,1.02,face*.014,.024,.17,.006,item.materials.bronze);
   // Two suspended trolleys per leaf engage the overhead double track.
   for(const x of [panelWidth*.2,panelWidth*.8]){
    box(panel,x,2.103,0,.008,.05,.008,item.materials.bronze).userData.suspension=true;
    const roller=new THREE.Mesh(new THREE.CylinderGeometry(.011,.011,.012,12),item.materials.black);roller.rotation.x=Math.PI/2;roller.position.set(x,2.134,0);roller.castShadow=true;roller.receiveShadow=true;roller.userData.suspension=true;panel.add(roller);
   }
   item.panels.push(panel);
  }
  const railStart=Math.min(-.045,item.parkPosition-.035),railEnd=Math.max(W+.045,item.parkPosition+panelWidth+.035);
  // Sliding doors use a flush reveal, slim architrave and enclosed double track.
  // There is no hinged stop or raised threshold in the sliding installation.
  const slidingFrame=item.slidingFrame=new THREE.Group();container.add(slidingFrame);
  for(const x of [.017,W-.017]){
   box(slidingFrame,x,1.05,0,.034,2.1,depth+.006,item.materials.frame);
   for(const face of [-1,1])box(slidingFrame,x,1.05,face*(depth/2+.008),.046,2.1,.012,item.materials.frame);
  }
  box(slidingFrame,W/2,2.089,0,W,.022,depth+.006,item.materials.frame);
  for(const face of [-1,1])box(slidingFrame,W/2,2.097,face*(depth/2+.008),W+.012,.038,.012,item.materials.frame);
  const railCenter=(railStart+railEnd)/2,railLength=railEnd-railStart,railZ=outside*(depth/2+.076);
  box(slidingFrame,railCenter,2.163,railZ,railLength,.018,.096,item.materials.frame);
  for(const face of [-1,1])box(slidingFrame,railCenter,2.14,railZ+face*.044,railLength,.064,.008,item.materials.frame);
  for(const x of [railStart+.005,railEnd-.005])box(slidingFrame,x,2.14,railZ,.01,.064,.096,item.materials.frame);
  for(let i=0;i<2;i++)box(slidingFrame,railCenter,2.119,outside*(depth/2+.0535+i*.035),railLength-.02,.01,.014,item.materials.black);
  for(const x of [railStart+.09,railCenter,railEnd-.09])box(slidingFrame,x,2.15,outside*(depth/2+.018),.04,.032,.046,item.materials.frame);
  // Discrete low anti-sway cheeks guide each track, without a continuous floor rail.
  const guides=item.stack==='left'?[-.09,.045,W-.08]:[.08,W-.045,W+.09];
  for(const x of guides)for(let i=0;i<2;i++)for(const face of [-1,1])box(slidingFrame,x,.012,outside*(depth/2+.0535+i*.035)+face*.016,.026,.024,.004,item.materials.black);
  item.panelWidth=panelWidth;
  const plan=new THREE.Group();plan.position.copy(container.position);plan.rotation.copy(container.rotation);planGroup.add(plan);
  item.plan=new THREE.LineSegments(new THREE.BufferGeometry(),planMaterial);item.plan.renderOrder=4;plan.add(item.plan);items.push(item);
 }
 // Retain the bedroom pivot axes with the narrow, full-wrap frame.
 options.configs.forEach(add);
 let liveSegments=[];
 function pose(item,progress=item.open?1:0){
  item.hinged.visible=item.type==='hinged';item.sliding.visible=item.type==='sliding';item.hinge.rotation.y=progress*item.angle;
  item.hingedFrame.visible=item.type==='hinged';item.slidingFrame.visible=item.type==='sliding';
  item.panels.forEach((panel,i)=>panel.position.x=THREE.MathUtils.lerp(item.closedPositions[i],item.parkPosition,progress));
  const points=[],line=(a,b)=>points.push(new THREE.Vector3(a[0],.2,a[1]),new THREE.Vector3(b[0],.2,b[1]));
  if(item.type==='sliding'){
   for(const panel of item.panels){const a=panel.position.x,z=panel.position.z,w=item.panelWidth;line([a,z-.011],[a+w,z-.011]);line([a+w,z-.011],[a+w,z+.011]);line([a+w,z+.011],[a,z+.011]);line([a,z+.011],[a,z-.011]);}
   const z=item.outside*(item.depth/2+.076);line([Math.min(-.045,item.parkPosition-.035),z],[Math.max(item.width+.045,item.parkPosition+item.panelWidth+.035),z]);
  }else{
   const shape=item.hingedSegments[0],pivot=item.hinge.position.x,tip=item.hingeSide==='left'?shape.b:shape.a;
   const point=a=>[pivot+tip*Math.cos(a),-tip*Math.sin(a)];
   for(let i=1;i<=30;i++)line(point(item.angle*(i-1)/30),point(item.angle*i/30));line([pivot,0],point(progress*item.angle));
  }
  item.plan.geometry.dispose();item.plan.geometry=new THREE.BufferGeometry().setFromPoints(points);
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
  if(item.allowSliding){const select=document.createElement('select');select.setAttribute('aria-label',item.name+'形式');for(const [value,label] of [['hinged','平开门'],['sliding','房外单侧吊轨']]){const option=document.createElement('option');option.value=value;option.textContent=label;select.appendChild(option);}select.onchange=()=>{item.type=select.value;sync();};controls.appendChild(select);}else{const style=document.createElement('span');style.className='door-style';style.textContent=item.entry?'深木色 · 古铜五金':'窄边全包 · 贴墙90°';controls.appendChild(style);}
  const label=document.createElement('label');label.className='door-transparent';const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.setAttribute('aria-label',item.name+'透明显示');checkbox.onchange=()=>{item.transparent=checkbox.checked;sync();};label.append(checkbox,document.createTextNode('透明'));controls.appendChild(label);row.appendChild(controls);document.getElementById('doorList').appendChild(row);
 }
 document.getElementById('openAllDoors').onclick=()=>{items.forEach(i=>i.open=true);sync();};document.getElementById('closeAllDoors').onclick=()=>{items.forEach(i=>i.open=false);sync();};document.getElementById('transparentAllDoors').onchange=e=>{items.forEach(i=>i.transparent=e.target.checked);sync();};sync();
 function validateClosed(){
  const previous=items.map(i=>i.open);items.forEach(i=>{i.open=false;pose(i);});options.root.updateMatrixWorld(true);
  const visible=object=>{for(let node=object;node&&node!==group;node=node.parent)if(!node.visible)return false;return true;};
  const ray=new THREE.Raycaster(),results=[];for(const item of items){let misses=0,total=0;const examples=[];for(let u=0;u<=30;u++)for(let v=0;v<=45;v++){const x=.004+(item.width-.008)*u/30,y=.004+(h-.008)*v/45,origin=new THREE.Vector3(x,y,-.32).applyMatrix4(item.container.matrixWorld),direction=new THREE.Vector3(0,0,1).transformDirection(item.container.matrixWorld);ray.set(origin,direction);ray.far=.7;const hits=ray.intersectObject(item.container,true).filter(hit=>visible(hit.object));total++;if(!hits.length){misses++;if(examples.length<3)examples.push([x,y]);}}results.push({id:item.id,type:item.type,rays:total,gaps:misses,examples});}
  items.forEach((item,i)=>item.open=previous[i]);updateSegments();return results;
 }
 function validateMotion(){
  const previous=items.map(item=>({type:item.type,open:item.open})),results=[];
  options.root.updateMatrixWorld(true);
  const boxFor=object=>new THREE.Box3().setFromObject(object).expandByScalar(-.0005);
  const walls=(options.walls||[]).filter(mesh=>mesh.userData.surface==='wall').map(mesh=>({id:'wall-'+mesh.userData.bakeId,box:boxFor(mesh)}));
  // Hanger trolleys deliberately engage the overhead rail; test the door bodies.
  const meshBoxes=object=>{const list=[];object.traverse(mesh=>{if(mesh.isMesh&&!mesh.userData.suspension)list.push(boxFor(mesh));});return list;};
  const bodyBoxes=item=>item.type==='hinged'?meshBoxes(item.hinge):item.panels.flatMap(meshBoxes);
  const inverse=options.root.matrixWorld.clone().invert();
  for(const target of items.filter(item=>item.allowSliding)){
   target.type='sliding';const collisions=new Set(),envelopeCollisions=new Set(),sweep=new THREE.Box3(),otherSweeps={};let samples=0,outside=true;
   const room=options.rooms.find(room=>room.id===target.id);
   for(let step=0;step<=24;step++){
    pose(target,step/24);options.root.updateMatrixWorld(true);const moving=bodyBoxes(target);
    for(const panel of target.panels){const b=boxFor(panel).applyMatrix4(inverse);if(!(b.max.x<=room.x||b.min.x>=room.x+room.w||b.max.z<=room.z||b.min.z>=room.z+room.d))outside=false;}
    for(const b of moving){sweep.union(b);for(const wall of walls)if(b.intersectsBox(wall.box))collisions.add(wall.id);for(const other of items)for(const frame of meshBoxes(other.type==='hinged'?other.hingedFrame:other.slidingFrame))if(b.intersectsBox(frame))collisions.add(other.id+'-frame');}
    for(const other of items){if(other===target)continue;for(const type of other.allowSliding?['hinged','sliding']:['hinged']){other.type=type;const key=other.id+'-'+type;if(!otherSweeps[key])otherSweeps[key]=new THREE.Box3();for(let otherStep=0;otherStep<=24;otherStep++){pose(other,otherStep/24);options.root.updateMatrixWorld(true);const obstacles=bodyBoxes(other);for(const b of obstacles)otherSweeps[key].union(b);samples++;if(moving.some(a=>obstacles.some(b=>a.intersectsBox(b))))collisions.add(key);}}}
   }
   for(const wall of walls)if(sweep.intersectsBox(wall.box))envelopeCollisions.add(wall.id);for(const [key,b] of Object.entries(otherSweeps))if(sweep.intersectsBox(b))envelopeCollisions.add(key);
   results.push({id:target.id,pathSteps:25,otherDoorStates:samples,outsideRoom:outside,stackSide:target.stack,collisions:[...collisions],sweepEnvelopeCollisions:[...envelopeCollisions]});
  }
  items.forEach((item,i)=>Object.assign(item,previous[i]));updateSegments();return results;
 }
 function validateFurnishings(furnishings){
  const previous=items.map(i=>({type:i.type,open:i.open})),results=[];options.root.updateMatrixWorld(true);
  const obstacles=furnishings.map(f=>({id:f.id,box:new THREE.Box3(new THREE.Vector3().fromArray(f.min),new THREE.Vector3().fromArray(f.max)).applyMatrix4(options.root.matrixWorld).expandByScalar(-.002)}));
  try{for(const item of items)for(const type of item.allowSliding?['sliding','hinged']:['hinged']){item.type=type;const collisions=new Set();for(let step=0;step<=24;step++){pose(item,step/24);options.root.updateMatrixWorld(true);const moving=type==='hinged'?[item.hinge]:item.panels;for(const parent of moving)parent.traverse(m=>{if(!m.isMesh||m.userData.suspension)return;const b=new THREE.Box3().setFromObject(m).expandByScalar(-.001);for(const f of obstacles)if(b.intersectsBox(f.box))collisions.add(f.id);});}results.push({door:item.id,type,steps:25,collisions:[...collisions]});}}
  finally{items.forEach((item,i)=>Object.assign(item,previous[i]));updateSegments();}return results;
 }
 function restoreDoorSettings(data){if(!Array.isArray(data))return;for(const v of data){const item=items.find(i=>i.id===v?.id);if(!item)continue;if(typeof v.open==='boolean')item.open=v.open;if(typeof v.transparent==='boolean')item.transparent=v.transparent;if(item.allowSliding&&['hinged','sliding'].includes(v.type))item.type=v.type;}sync();}
 return {segments,validateFurnishings,restore:restoreDoorSettings,update(mode){group.visible=mode!=='plan';planGroup.visible=mode==='plan';},validateClosed,validateMotion,clearAt(x,z){for(const s of liveSegments){const dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,t=THREE.MathUtils.clamp(((x-s.a.x)*dx+(z-s.a.z)*dz)/(dx*dx+dz*dz),0,1);if(Math.hypot(x-s.a.x-t*dx,z-s.a.z-t*dz)<s.radius)return false;}return true;},get diagnostics(){return items.map(item=>({id:item.id,name:item.name,open:item.open,type:item.type,frame:item.type==='sliding'?'suspended-double-track':'narrow-full-wrap',frameFaceWidth:item.type==='hinged'?.04:.046,floorTrack:false,overheadHangers:item.type==='sliding'?4:0,raisedThreshold:item.type==='hinged',transparent:item.transparent,angle:item.hinge.rotation.y,hingeSide:item.hingeSide,hinge:new THREE.Vector3().setFromMatrixPosition(item.hinge.matrixWorld).toArray(),opening:[item.start,item.end],wallClearance:item.sideWall===undefined?null:.054,leafFrameOverlap:overlap,slidingAllowed:!!item.allowSliding,mountedOutside:!!item.allowSliding,stackSide:item.allowSliding?item.stack:null,panelBounds:item.allowSliding?item.panels.map(panel=>{const b=new THREE.Box3().setFromObject(panel);return {min:b.min.toArray(),max:b.max.toArray()};}):null}));}};
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
