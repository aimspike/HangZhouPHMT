// Same host/browser/camera comparison. Mobile viewports are not phone benchmarks.
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),stage=process.env.QUALITY_STAGE||'rebuild';
const target=process.env.HOUSE_URL||'http://127.0.0.1:8879/docs/';
const output=path.resolve(root,process.env.CAPTURE_OUTPUT_DIR||'docs/quality-report'),raw=path.resolve(root,process.env.CAPTURE_RAW_DIR||'work/rebuild/raw');fs.mkdirSync(output,{recursive:true});fs.mkdirSync(raw,{recursive:true});
const report={stage,date:new Date().toISOString(),url:target,scope:'Actual WebGL canvas; same Windows PC and Chrome for both runs. Mobile viewport/touch/WeChat UA simulation, not physical phone performance.',cases:[],errors:[],external:[]};
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
report.htmlSha256=hash(fs.readFileSync(path.resolve(root,process.env.EXPECTED_HTML||'docs/index.html')));
const ua='Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 MicroMessenger/8.0.50';
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader']});try{
for(const spec of [{id:'pc',width:1280,height:800},{id:'mobile',width:390,height:844,mobile:true}]){
 const ctx=await browser.newContext({viewport:{width:spec.width,height:spec.height},deviceScaleFactor:spec.mobile?3:1,...(spec.mobile?{isMobile:true,hasTouch:true,userAgent:ua}:{})}),p=await ctx.newPage();
 p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 p.on('request',r=>{if(!r.url().startsWith(new URL(target).origin)&&!/^(data:|blob:)/.test(r.url()))report.external.push(r.url())});
 await p.addLocatorHandler(p.locator('#appreciationDialog:not([hidden])'),()=>p.locator('#closeAppreciation').click());
 const begin=Date.now();await p.goto(target);await p.waitForFunction(()=>window.houseBoot?.ready&&houseViewer.bakedMaps[0]===219);const bootMs=Date.now()-begin;assert.equal(hash(await (await p.request.get(target)).body()),report.htmlSha256);
 const device=await p.evaluate(()=>{const g=document.querySelector('#viewport canvas').getContext('webgl'),e=g.getExtension('WEBGL_debug_renderer_info');return {ua:navigator.userAgent,gpu:e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER),precision:g.getShaderPrecisionFormat(g.FRAGMENT_SHADER,g.HIGH_FLOAT).precision}});
 const shots=[];
 for(const scene of [{id:'living-day',room:'living',time:'noon',preset:'a'},{id:'living-night',room:'living',time:'night',preset:'a'},{id:'master-day',room:'master',time:'noon',preset:'a'},{id:'bare-day',room:'living',time:'noon',preset:'bare'},{id:'dining-day',room:'dining',time:'noon',preset:'a'},{id:'kitchen-day',room:'kitchen',time:'noon',preset:'a'}]){
  await p.evaluate(s=>{const set=(id,v)=>{const e=document.getElementById(id);if(e.type==='checkbox')e.checked=v;else e.value=v;e.dispatchEvent(new Event(e.type==='range'?'input':'change',{bubbles:true}));};set('decorPreset',s.preset);set('fov','85');set('showLights',s.time==='night');document.querySelector(`[data-time="${s.time}"]`).click();houseViewer.captureView(s.room);},scene);
  await p.waitForTimeout(900);await p.waitForFunction(()=>!houseViewer.rebuiltAssets||houseViewer.rebuiltAssets.texturesReady===houseViewer.rebuiltAssets.texturesExpected);await p.waitForFunction(()=>houseViewer.renderQuality.captures>0||houseViewer.renderQuality.effective==='light');
  const file=`${stage}-${spec.id}-${scene.id}.png`,data=await p.evaluate(()=>houseViewer.captureImage());fs.writeFileSync(path.join(raw,file),Buffer.from(data.split(',')[1],'base64'));
  const metrics=await p.evaluate(async()=>{const start=performance.now(),frames=houseViewer.frames;await new Promise(r=>setTimeout(r,2200));return {elapsedMs:performance.now()-start,renderedFrames:houseViewer.frames-frames,quality:houseViewer.renderQuality,diagnostics:houseViewer.diagnostics,rebuilt:houseViewer.rebuiltAssets||null,maps:houseViewer.bakedMaps,camera:houseViewer.camera,angles:houseViewer.lookAngles,fov:houseViewer.fov,roomClear:houseViewer.walkClearance(houseViewer.camera[0],houseViewer.camera[2])}});
  metrics.observedFps=metrics.renderedFrames*1000/metrics.elapsedMs;assert(metrics.roomClear);shots.push({...scene,file,sourceFile:path.relative(root,path.join(raw,file)).replaceAll('\\','/'),metrics});
 }
 const geometry=await p.evaluate(expected=>({same:JSON.stringify(houseBakeSource())===JSON.stringify(expected),roof:houseViewer.roofCoverage(),doors:houseViewer.decorDoorClearance()}),JSON.parse(fs.readFileSync(path.resolve(root,process.env.EXPECTED_BAKE||'src/bake-source.json'),'utf8')));assert(geometry.same&&geometry.roof.gaps===0&&geometry.doors.every(d=>!d.collisions.length));
 let landscape;if(spec.mobile){await p.setViewportSize({width:740,height:360});await p.waitForFunction(()=>houseViewer.diagnostics.viewport[0]===740);landscape=[];for(const mode of ['orbit','plan','walk']){await p.locator(`[data-mode="${mode}"]`).click();await p.waitForTimeout(120);landscape.push(await p.evaluate(()=>({mode:houseViewer.mode,viewport:houseViewer.diagnostics.viewport,overflow:document.documentElement.scrollWidth>innerWidth,maps:houseViewer.bakedMaps})));}assert(landscape.every(x=>!x.overflow&&x.maps[0]===219));}
 report.cases.push({...spec,bootMs,device,shots,geometry,landscape});await ctx.close();console.log(stage,spec.id,'captured');
}
assert.deepEqual(report.errors,[]);assert.deepEqual(report.external,[]);report.result='passed';
}finally{fs.writeFileSync(path.join(output,`${stage}${report.result==='passed'?'':'-failed'}.json`),JSON.stringify(report,null,2)+'\n');await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
