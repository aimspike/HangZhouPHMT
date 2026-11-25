// Capture the actual WebGL page. Read-only test hooks expose assembled geometry;
// no scene objects, materials, lights or renderer settings are replaced.
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),target=process.env.HOUSE_URL||'http://127.0.0.1:8879/docs/';
const prefix=process.env.VALIDATION_PREFIX||'room-refinements',stage=process.env.CAPTURE_STAGE||'after';
const output=path.join(root,process.env.REFINEMENT_CAPTURE_DIR||'validation/room-refinements');fs.mkdirSync(output,{recursive:true});
const report={scope:'Windows Chrome WebGL1 actual canvas. Mobile viewport/WeChat UA is simulation, not physical phone validation.',url:target,stage,errors:[],external:[],cases:[]};
const ua='Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36 MicroMessenger/8.0.50';
const views={entry:[4.65,1.5,3.85,6.2,1.2,3.44],fridge:[4.18,1.5,5.60,5.75,1.08,5.9],kitchen:[4.82,1.6,2.5,5.95,1.68,1.65],livingCurtain:[1.9,1.5,4.8,.16,1.43,4.6],masterCurtain:[2.7,1.5,10.85,1.75,1.42,11.65],secondCurtain:[3.8,1.5,9.6,4.7,1.42,10.85]};
const settle=async p=>{const n=await p.evaluate(()=>houseViewer.frames);await p.waitForFunction(n=>houseViewer.frames>n+3,n);};
const capture=async(p,name)=>{await settle(p);const data=await p.evaluate(async()=>{const i=new Image();i.src=houseViewer.captureImage();await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;c.getContext('2d').drawImage(i,0,0);return c.toDataURL('image/webp',.9);});fs.writeFileSync(path.join(output,name+'.webp'),Buffer.from(data.split(',')[1],'base64'));};
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader']});try{
 for(const mobile of [false,true]){
  const ctx=await b.newContext({viewport:{width:mobile?390:1280,height:mobile?844:900},...(mobile?{isMobile:true,hasTouch:true,userAgent:ua}:{})});
  await ctx.route('**/*',async route=>{const r=route.request();if(r.isNavigationRequest()&&r.url().startsWith(new URL(target).origin)){
   const response=await route.fetch(),source=await response.text();report.sourceHTMLSHA256=crypto.createHash('sha256').update(source.replace(/\r\n/g,'\n')).digest('hex');
   assert.equal(source.split('window.houseViewer={').length,2);
   const hooks=`window.__houseGeometry={root,architecturalMeshes,look:v=>{if(mode!=='walk')setMode('walk');perspective.position.set(v[0]-3.1,v[1],v[2]-6.25);yaw=Math.atan2(v[0]-v[3],v[2]-v[5]);pitch=Math.atan2(v[4]-v[1],Math.hypot(v[0]-v[3],v[2]-v[5]));perspective.fov=65;perspective.updateProjectionMatrix();look();}};`;
   const html=source.replace('window.houseViewer={',hooks+'window.houseViewer={').replace('return {segments,validateFurnishings','window.__doorItems=items;return {segments,validateFurnishings');
   await route.fulfill({response,body:html});
  }else await route.continue();});
  const p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});p.on('request',r=>{if(!r.url().startsWith(new URL(target).origin)&&!/^(data:|blob:)/.test(r.url()))report.external.push(r.url());});
  await p.addLocatorHandler(p.locator('#appreciationDialog:not([hidden])'),()=>p.locator('#closeAppreciation').click());
  await p.goto(new URL('?decor=a',target).href);await p.waitForFunction(()=>houseBoot.ready&&houseViewer.bakedMaps[0]===219&&houseViewer.rebuiltAssets.texturesReady===houseViewer.rebuiltAssets.texturesExpected);
  assert(await p.locator('#sidebar').evaluate(e=>e.hidden));
  await p.evaluate(()=>houseViewer.captureView('dining'));
  const result={mobile,diagnostics:await p.evaluate(()=>houseViewer.diagnostics),assets:await p.evaluate(()=>houseViewer.rebuiltAssets),captures:[]};
  const mobileViews={livingCurtain:[1.9,1.5,4.8,.23,1.43,5.68],masterCurtain:[2.7,1.5,10.45,2.42,1.42,11.57],secondCurtain:[3.8,1.5,9.6,3.64,1.42,10.79]};
  for(const [id,desktopView] of Object.entries(views))for(const time of ['noon','night']){const v=mobile&&mobileViews[id]||desktopView;
   await p.evaluate(v=>__houseGeometry.look(v),v);await p.locator('button[data-time="'+time+'"]').click();await p.waitForTimeout(220);const name=stage+'-'+(mobile?'mobile':'pc')+'-'+id+'-'+time;await capture(p,name);result.captures.push({name,camera:v,fov:65});
  }
  if(stage!=='before'){
   result.geometry=await p.evaluate(expected=>{
    const g=__houseGeometry,entry=__doorItems.find(d=>d.entry),saved=entry.open;
    const collisions=[],sweep=[];g.root.updateMatrixWorld(true);
    const wallBounds=g.architecturalMeshes.filter(m=>m.userData.surface==='wall').map(m=>({id:m.userData.wallId,b:new THREE.Box3().setFromObject(m).expandByScalar(-.0005)}));
    for(const m of entry.hingedFrame.children){const b=new THREE.Box3().setFromObject(m).expandByScalar(-.0005);for(const w of wallBounds)if(b.intersectsBox(w.b))collisions.push(w.id);}
    const original=entry.hinge.rotation.y;
    for(let step=0;step<=24;step++){entry.hinge.rotation.y=step/24*entry.angle;g.root.updateMatrixWorld(true);entry.hinge.traverse(m=>{if(!m.isMesh)return;const b=new THREE.Box3().setFromObject(m).expandByScalar(-.0005);for(const w of wallBounds)if(b.intersectsBox(w.b))sweep.push({step,wall:w.id});});}
    entry.hinge.rotation.y=original;g.root.updateMatrixWorld(true);
    const fridge=[],curtains=[];g.root.traverse(m=>{if(!m.isMesh)return;for(const material of Array.isArray(m.material)?m.material:[m.material]){
     if(material.userData.houseRoom==='dining'&&material.color?.clone().convertLinearToSRGB().getHexString()==='eeeade')fridge.push({roughness:material.roughness,metalness:material.metalness,reflection:material.userData.houseReflectionStrength});
     if(material.userData.houseRoom&&material.side===THREE.DoubleSide&&material.normalScale?.x===.018){const b=new THREE.Box3().setFromObject(m),geo=m.geometry,edges=new Map(),count=geo.index?.count||geo.attributes.position.count;for(let i=0;i<count;i+=3){const keys=[0,1,2].map(k=>{const index=geo.index?geo.index.getX(i+k):i+k;return [0,1,2].map(a=>Math.round(geo.attributes.position.array[index*3+a]*1e6)).join(',');});for(let k=0;k<3;k++){const pair=[keys[k],keys[(k+1)%3]].sort().join('|');edges.set(pair,(edges.get(pair)||0)+1);}}curtains.push({room:material.userData.houseRoom,sheer:material.transparent,roughness:material.roughness,min:b.min.toArray(),max:b.max.toArray(),triangles:count/3,boundaryEdges:[...edges.values()].filter(n=>n===1).length,nonmanifoldEdges:[...edges.values()].filter(n=>n>2).length});}
    }});
    return {snapshotMatches:JSON.stringify(houseBakeSource())===JSON.stringify(expected),entry:{returnInset:entry.revealStart,frameWallCollisions:collisions,leafSweepCollisions:sweep},fridge,curtains,roof:houseViewer.roofCoverage(),closure:houseViewer.doorClosure(),motion:houseViewer.doorMotion(),clearance:houseViewer.decorDoorClearance()};
   },JSON.parse(fs.readFileSync(path.join(root,'src/bake-source.json'),'utf8')));
   assert(result.geometry.snapshotMatches);assert.equal(result.geometry.roof.gaps,0);assert(result.geometry.entry.returnInset>.08&&result.geometry.entry.returnInset<.09);assert.deepEqual(result.geometry.entry.frameWallCollisions,[]);assert.deepEqual(result.geometry.entry.leafSweepCollisions,[]);
   assert(result.geometry.closure.every(d=>d.gaps===0));assert(result.geometry.motion.every(d=>!d.collisions.length&&!d.sweepEnvelopeCollisions.length));assert(result.geometry.clearance.every(d=>!d.collisions.length));
   assert(result.geometry.fridge.length>0);assert(result.geometry.fridge.every(m=>m.roughness>=.75&&m.metalness===0&&m.reflection<=.2));
   assert(result.geometry.curtains.length>=6);assert(result.geometry.curtains.every(m=>m.roughness>=.9&&m.boundaryEdges===0&&m.nonmanifoldEdges===0&&m.min[1]>.02&&m.min[1]<.04));
   await p.locator('#settings').click();await p.locator('[data-door="entry"]').evaluate(e=>e.closest('details').open=true);await p.locator('[data-door="entry"]').click();await p.locator('#closeSettings').click();await settle(p);result.entryOpen=await p.evaluate(()=>houseViewer.doors.find(d=>d.id==='entry').open);assert(result.entryOpen);await p.waitForTimeout(300);await p.reload();await p.waitForFunction(()=>houseBoot.ready&&houseViewer.bakedMaps[0]===219);assert(await p.evaluate(()=>houseViewer.doors.find(d=>d.id==='entry').open));result.savedDoor='passed';
   if(mobile){await p.setViewportSize({width:844,height:390});await p.waitForFunction(()=>houseViewer.diagnostics.viewport[0]===844);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
   result.quality=await p.evaluate(()=>houseViewer.renderQuality);assert.equal(result.quality.reflectionError,null);
  }
  report.cases.push(result);await ctx.close();console.log(mobile?'mobile passed':'desktop passed');
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.external,[]);report.result='passed';
}finally{fs.writeFileSync(path.join(root,'validation',prefix+'.json'),JSON.stringify(report,null,2));await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
