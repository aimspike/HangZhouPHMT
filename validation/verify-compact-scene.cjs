// Real canvas capture and fit checks. The reflection-off image is an explicitly
// labelled diagnostic ablation; normal captures keep the production scene intact.
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE),root=path.resolve(__dirname,'..');
const base=process.env.HOUSE_URL||'http://127.0.0.1:8879/docs/',before=process.env.CAPTURE_STAGE==='before';
const out=path.join(root,process.env.COMPACT_CAPTURE_DIR||'docs/quality-report/compact');fs.mkdirSync(out,{recursive:true});
const report={scope:'Actual Chrome WebGL1 canvas; PC and mobile/WeChat UA simulation; no physical phone',cases:[],errors:[],external:[],stage:before?'before':'after'};
const views={laundry:[3.9,1.25,11.72,5.8,1.15,11.72,75],basin:[4.95,1.25,11.25,5.85,.81,11.35,65],coffee:[2.5,.55,4.0,1.75,.36,4.68,55],chair:[3.18,.65,4.11,3.65,.55,4.86,60],glassFront:[1.75,1.5,4.6,0,1.5,4.6,65],glassAngle:[1.6,1.5,4.3,0,1.5,5.3,65]};
const settle=async p=>{const n=await p.evaluate(()=>houseViewer.frames);await p.waitForFunction(n=>houseViewer.frames>n+3,n);};
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader']});try{
for(const mobile of [false,true]){
 const ctx=await b.newContext({viewport:{width:mobile?390:1280,height:mobile?844:900},...(mobile?{isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36 MicroMessenger/8.0.50'}:{})});
 await ctx.route('**/*',async route=>{if(route.request().isNavigationRequest()){
 const response=await route.fetch(),source=await response.text();report.htmlSHA256=crypto.createHash('sha256').update(source.replace(/\r\n/g,'\n')).digest('hex');
 const hook=`window.__compact={root,architecturalMeshes,look:v=>{if(mode!=='walk')setMode('walk');perspective.position.set(v[0]-3.1,v[1],v[2]-6.25);yaw=Math.atan2(v[0]-v[3],v[2]-v[5]);pitch=Math.atan2(v[4]-v[1],Math.hypot(v[0]-v[3],v[2]-v[5]));perspective.fov=v[6];perspective.updateProjectionMatrix();look();}};`;
 await route.fulfill({response,body:source.replace('window.houseViewer={',hook+'window.houseViewer={')});
 }else await route.continue();});
 const p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});p.on('request',r=>{if(!r.url().startsWith(new URL(base).origin)&&!/^(data:|blob:)/.test(r.url()))report.external.push(r.url())});
 await p.addLocatorHandler(p.locator('#appreciationDialog:not([hidden])'),()=>p.locator('#closeAppreciation').click());await p.goto(base+'?decor=a');await p.waitForFunction(()=>houseBoot.ready&&houseViewer.bakedMaps[0]===219&&houseViewer.rebuiltAssets.texturesReady===13);
 const c={mobile,captures:[]};
 for(const [id,v] of Object.entries(views))for(const time of ['noon','night']){
 await p.evaluate(v=>__compact.look(v),v);await p.locator('[data-time="'+time+'"]').click();await settle(p);const name=`${report.stage}-${mobile?'mobile':'pc'}-${id}-${time}.webp`;
 const data=await p.evaluate(async()=>{const i=new Image();i.src=houseViewer.captureImage();await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;c.getContext('2d').drawImage(i,0,0);return c.toDataURL('image/webp',.9)});fs.writeFileSync(path.join(out,name),Buffer.from(data.split(',')[1],'base64'));c.captures.push({id,time,name,camera:v});
 }
 if(!before){
 c.fit=await p.evaluate(expected=>{
 const d=houseViewer.decor,panes=__compact.architecturalMeshes.filter(m=>m.material?.userData?.houseWindowGlass).map(m=>({room:m.material.userData.houseRoom,opacity:m.material.opacity,roughness:m.material.roughness,metalness:m.material.metalness,reflection:m.material.userData.houseReflectionStrength,probe:!!m.material.envMap}));
 const by=id=>d.items.find(i=>i.id===id),laundry=by('balcony-laundry'),vanity=by('balcony-vanity');
 const accessorySupports=[['tv-console-accessories','tv-console'],['dining-accessories','dining-table'],['dining-sideboard-accessories','dining-sideboard'],['study-accessories','study-desk'],['kitchen-sink-accessories','kitchen-north-cabinets'],['kitchen-counter-accessories','kitchen-east-cabinets']].map(([id,support])=>({id,support,gap:by(id).min[1]-by(support).max[1]}));
 for(const room of ['master','second'])accessorySupports.push({id:room+'-nightstand-detail',support:room+'-nightstand',gap:by(room+'-nightstand-detail').min[1]-(by(room+'-nightstand').min[1]+(room==='master'?.52:.48))});
 return {snapshotMatches:JSON.stringify(houseBakeSource())===JSON.stringify(expected),mounting:d.mounting,items:d.items,accessorySupports,panes,joinGap:laundry.min[2]-vanity.max[2],balconyNorthClearance:vanity.min[2]-11.085,balconyWalk:[[3.65,11.4],[4.1,11.4],[4.6,11.4],[4.6,12.0],[5.1,11.45]].map(([x,z])=>({x,z,clear:houseViewer.walkClearance(x-3.1,z-6.25)})),doors:houseViewer.decorDoorClearance(),roof:houseViewer.roofCoverage(),maps:houseViewer.bakedMaps,quality:houseViewer.renderQuality};
 },JSON.parse(fs.readFileSync(path.join(root,'src/bake-source.json'))));
 assert(c.fit.snapshotMatches);assert(c.fit.accessorySupports.every(x=>x.gap<.001&&x.gap>-.015),JSON.stringify(c.fit.accessorySupports));assert(c.fit.mounting.every(x=>x.gap===undefined||Number.isFinite(x.gap)&&Math.abs(x.gap)<.001));assert(Math.abs(c.fit.joinGap)<.0001);assert(c.fit.balconyNorthClearance>.02);assert(c.fit.balconyWalk.every(x=>x.clear));assert(c.fit.doors.every(x=>!x.collisions.length));assert.equal(c.fit.roof.gaps,0);assert(c.fit.panes.length>=6&&c.fit.panes.every(x=>x.opacity<=.23&&x.reflection===.3&&x.roughness>=.1&&x.metalness===0));assert.equal(c.fit.quality.reflectionError,null);
 // Measure the visible contribution at a fixed production camera after cache capture.
 await p.evaluate(v=>__compact.look(v),views.glassAngle);await p.locator('[data-time="noon"]').click();await p.waitForTimeout(400);await settle(p);
 c.reflection=await p.evaluate(async()=>{const panes=__compact.architecturalMeshes.filter(m=>m.material?.userData?.houseWindowGlass),saved=panes.map(m=>m.material.userData.houseReflectionStrength);const sample=async()=>{const i=new Image();i.src=houseViewer.captureImage();await i.decode();const c=document.createElement('canvas');c.width=320;c.height=225;c.getContext('2d').drawImage(i,0,0,320,225);return c.getContext('2d').getImageData(0,0,320,225).data;};const on=await sample();panes.forEach(m=>{m.material.userData.houseReflectionStrength=0;m.material.envMapIntensity=0});const f=houseViewer.frames;while(houseViewer.frames<f+2)await new Promise(r=>requestAnimationFrame(r));const off=await sample();panes.forEach((m,i)=>m.material.userData.houseReflectionStrength=saved[i]);let sum=0,pixels=0;for(let i=0;i<on.length;i+=4){const d=(Math.abs(on[i]-off[i])+Math.abs(on[i+1]-off[i+1])+Math.abs(on[i+2]-off[i+2]))/3;sum+=d;if(d>1)pixels++;}return {diagnostic:'Same scene, only pane reflection strength temporarily set to zero; restored after measurement',meanDifference:sum/(on.length/4),changedPixels:pixels,totalPixels:on.length/4};});assert(c.reflection.changedPixels>100);
 }
 report.cases.push(c);await ctx.close();console.log(mobile?'mobile compact passed':'desktop compact passed');
}
assert.deepEqual(report.errors,[]);assert.deepEqual(report.external,[]);report.result='passed';
}finally{fs.writeFileSync(path.join(root,process.env.COMPACT_RESULT||'validation/compact-'+report.stage+'.json'),JSON.stringify(report,null,2));await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
