// Real WebGL captures after irradiance and PMREM settle. Never filters pixels.
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE),root=path.resolve(__dirname,'..');
const stage=process.env.CAPTURE_STAGE||'before',base=process.env.HOUSE_URL||(stage==='before'?'http://127.0.0.1:8879/work/surface-fixes/before.html':'http://127.0.0.1:8879/docs/');
const out=path.join(root,process.env.SURFACE_CAPTURE_DIR||'docs/quality-report/surface-fixes'),raw=path.join(root,'work/surface-fixes/raw');
for(const dir of [out,raw])fs.mkdirSync(dir,{recursive:true});
const views={living:[2.7,1.5,4,1.8,1.6,5.92,95],dining:[3.65,1.5,4,5.5,1.8,5.9,85],master:[2.55,1.5,9.1,.8,1.5,10.2,90],bath:[1.36,1.5,7.62,.65,1.7,7.3,85],balconyBasin:[4.93,1.30,11.28,5.88,.81,11.36,58],bathBasin:[1.12,1.27,7.32,.55,.87,7.95,55],toilet:[1.13,.95,7.38,.47,.44,6.78,55]};
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader']});
 const report={stage,url:base,scope:'Actual WebGL1 after static transport/PMREM settles; PC and touch/WeChat UA simulation, not physical phones',cases:[],errors:[],external:[]};
 try{
  for(const mobile of [false,true]){
   const ctx=await b.newContext({viewport:{width:mobile?390:1280,height:mobile?844:900},...(mobile?{isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 AppleWebKit/537.36 Chrome/120 Mobile MicroMessenger/8.0.50'}:{})});
   await ctx.route('**/*',async route=>{
    if(!route.request().isNavigationRequest())return route.continue();
    const response=await route.fetch(),html=await response.text();report.sourceSHA256=crypto.createHash('sha256').update(html.replace(/\r\n/g,'\n')).digest('hex');
    const hook=`window.__surfaceFix={root,renderer,look:v=>{if(mode!=='walk')setMode('walk');perspective.position.set(v[0]-3.1,v[1],v[2]-6.25);yaw=Math.atan2(v[0]-v[3],v[2]-v[5]);pitch=Math.atan2(v[4]-v[1],Math.hypot(v[0]-v[3],v[2]-v[5]));perspective.fov=v[6];perspective.updateProjectionMatrix();look();}};`;
    await route.fulfill({response,body:html.replace('window.houseViewer={',hook+'window.houseViewer={')});
   });
   const p=await ctx.newPage();p.setDefaultTimeout(120000);
   p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
   p.on('request',r=>{if(!r.url().startsWith(new URL(base).origin)&&!/^(data:|blob:|file:)/.test(r.url()))report.external.push(r.url())});
   await p.addLocatorHandler(p.locator('#appreciationDialog:not([hidden])'),()=>p.locator('#closeAppreciation').click());
   await p.goto(base+'?decor=a');await p.waitForFunction(()=>houseBoot.ready&&houseViewer.bakedMaps[0]===219);
   const c={mobile,shots:[]};
   for(const time of ['noon','night']){
    await p.evaluate(time=>{const el=document.getElementById('showLights');el.checked=time==='night';el.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('[data-time="'+time+'"]').click();houseViewer.captureView('living');},time);
    for(const [id,v]of Object.entries(views)){
     if(time==='night'&&!['balconyBasin','bathBasin','toilet'].includes(id))continue;
     await p.evaluate(v=>__surfaceFix.look(v),v);
     await p.waitForFunction(()=>houseViewer.staticLighting.enabled&&houseViewer.renderQuality.probeReady);
     const f=await p.evaluate(()=>houseViewer.frames);await p.waitForFunction(f=>houseViewer.frames>f+3,f);
     const images=await p.evaluate(async()=>{const png=houseViewer.captureImage(),image=new Image();image.src=png;await image.decode();const c=document.createElement('canvas');c.width=image.width;c.height=image.height;c.getContext('2d').drawImage(image,0,0);return {png,webp:c.toDataURL('image/webp',.95)}});
     const name=stage+'-'+(mobile?'mobile':'pc')+'-'+(time==='night'?'night-':'')+id;
     fs.writeFileSync(path.join(raw,name+'.png'),Buffer.from(images.png.split(',')[1],'base64'));fs.writeFileSync(path.join(out,name+'.webp'),Buffer.from(images.webp.split(',')[1],'base64'));
     c.shots.push({id,time,lights:time==='night',file:name+'.webp',camera:v,state:await p.evaluate(()=>({static:houseViewer.staticLighting,quality:houseViewer.renderQuality,exposure:__surfaceFix.renderer.toneMappingExposure,lightPower:document.getElementById('lightPower').value}))});
    }
   }
   report.cases.push(c);await ctx.close();console.log(stage,mobile?'mobile':'pc','passed');
  }
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.external,[]);report.result='passed';
 }finally{fs.writeFileSync(path.join(root,'validation/surface-'+stage+'.json'),JSON.stringify(report,null,2));await b.close()}
})().catch(e=>{console.error(e);process.exit(1)});
