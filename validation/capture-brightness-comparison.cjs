// Same production WebGL scene and fixed cameras. Only existing lamp slider and
// renderer exposure are varied; no post-capture pixel brightness adjustment.
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),base=process.env.HOUSE_URL||'http://127.0.0.1:8879/docs/';
const dir=path.join(root,process.env.BRIGHTNESS_CAPTURE_DIR||'docs/quality-report/brightness');fs.mkdirSync(dir,{recursive:true});
const variants=[{id:'baseline',lamp:1,exposure:1},{id:'lamp70',lamp:.7,exposure:1},{id:'lamp50',lamp:.5,exposure:1},{id:'exposure80',lamp:1,exposure:.8},{id:'exposure65',lamp:1,exposure:.65}];
const scenes=[{id:'night-on',time:'night',lights:true,rooms:['living','master','kitchen']},{id:'noon-on',time:'noon',lights:true,rooms:['living','master','kitchen']},{id:'noon-off',time:'noon',lights:false,rooms:['living']}];
const report={scope:'Actual Chrome WebGL1 canvas, same production HTML and fixed camera; mobile/WeChat UA is simulation. Diagnostic hook changes renderer exposure only. Lamp uses existing UI control. Original image pixels are preserved except WebP encoding.',url:base,variants,scenes,cases:[],errors:[],external:[],result:'pending'};
const settle=async p=>{await p.waitForFunction(()=>houseViewer.staticLighting.enabled&&houseViewer.renderQuality.probeReady&&houseViewer.renderQuality.reflectionSource.includes('Blender'),{},{timeout:120000});const n=await p.evaluate(()=>houseViewer.frames);await p.waitForFunction(n=>houseViewer.frames>n+3,n);};
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader']});try{
for(const mobile of [false,true]){
 const ctx=await browser.newContext({viewport:{width:mobile?390:1280,height:mobile?844:900},...(mobile?{isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 MicroMessenger/8.0.50'}:{})});
 await ctx.route('**/*',async route=>{if(route.request().isNavigationRequest()&&route.request().url().startsWith(new URL(base).origin)){
  const response=await route.fetch(),html=await response.text();report.sourceHTMLSHA256=crypto.createHash('sha256').update(html.replace(/\r\n/g,'\n')).digest('hex');assert.equal(html.split('window.houseViewer={').length,2);
  const hook=`window.__brightnessCompare={setExposureFactor:factor=>{updateLighting();renderer.toneMappingExposure*=factor;},read:()=>({exposure:renderer.toneMappingExposure,lamp:lightPower,camera:camera.position.toArray(),angles:[yaw,pitch],fov:perspective.fov})};`;
  await route.fulfill({response,body:html.replace('window.houseViewer={',hook+'window.houseViewer={')});
 }else await route.continue();});
 const p=await ctx.newPage();p.setDefaultTimeout(120000);p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});p.on('request',r=>{if(!r.url().startsWith(new URL(base).origin)&&!/^(data:|blob:)/.test(r.url()))report.external.push(r.url())});
 await p.addLocatorHandler(p.locator('#appreciationDialog:not([hidden])'),()=>p.locator('#closeAppreciation').click());await p.goto(base+'?decor=a');await p.waitForFunction(()=>houseBoot.ready&&houseViewer.bakedMaps[0]===219&&houseViewer.rebuiltAssets.texturesReady===13);
 const c={mobile,diagnostics:await p.evaluate(()=>houseViewer.diagnostics),captures:[]};
 for(const scene of scenes){await p.evaluate(s=>{const el=document.getElementById('showLights');el.checked=s.lights;el.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('[data-time="'+s.time+'"]').click();},scene);
 for(const room of scene.rooms){await p.evaluate(room=>houseViewer.captureView(room),room);let camera=null,baseExposure=0;
 for(const variant of variants){await p.evaluate(v=>{const el=document.getElementById('lightPower');el.value=String(v.lamp);el.dispatchEvent(new Event('input',{bubbles:true}));__brightnessCompare.setExposureFactor(v.exposure);},variant);await settle(p);
 const state=await p.evaluate(()=>({settings:__brightnessCompare.read(),static:houseViewer.staticLighting,quality:houseViewer.renderQuality,maps:houseViewer.bakedMaps,decor:houseViewer.decor.preset}));
 if(!camera){camera=state.settings.camera;baseExposure=state.settings.exposure;}else assert.deepEqual(state.settings.camera,camera,'camera changed');assert(Math.abs(state.settings.exposure-baseExposure*variant.exposure)<1e-8);assert.equal(state.settings.lamp,variant.lamp);assert.equal(state.static.error,null);assert.equal(state.quality.reflectionError,null);assert.equal(state.decor,'a');assert.deepEqual(state.maps,[219,219]);
 const shot=await p.evaluate(async()=>{const image=new Image();image.src=houseViewer.captureImage();await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
 function region(x0,y0,x1,y1){let n=0,sum=0,clipped=0,black=0;const values=[];for(let y=Math.floor(y0*canvas.height);y<y1*canvas.height;y+=2)for(let x=Math.floor(x0*canvas.width);x<x1*canvas.width;x+=2){const i=(y*canvas.width+x)*4,v=.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2];n++;sum+=v;values.push(v);if(v>=245)clipped++;if(v<12)black++;}values.sort((a,b)=>a-b);return {mean:sum/n,p10:values[Math.floor(n*.1)],p90:values[Math.floor(n*.9)],brightFraction:clipped/n,darkFraction:black/n};}
 return {image:canvas.toDataURL('image/webp',.94),canvas:[canvas.width,canvas.height],metrics:{whole:region(0,0,1,1),center:region(.15,.15,.68,.85),upper:region(.1,.05,.68,.33),right:region(.72,.22,.98,.6)}};});
 const name=(mobile?'mobile':'pc')+'-'+scene.id+'-'+room+'-'+variant.id+'.webp',buf=Buffer.from(shot.image.split(',')[1],'base64');fs.writeFileSync(path.join(dir,name),buf);c.captures.push({scene:scene.id,room,variant:variant.id,file:name,canvas:shot.canvas,sha256:crypto.createHash('sha256').update(buf).digest('hex'),metrics:shot.metrics,...state});
 }
 const captures=c.captures.filter(x=>x.scene===scene.id&&x.room===room),get=id=>captures.find(x=>x.variant===id);for(const id of ['exposure80','exposure65'])assert(get(id).metrics.whole.mean<get('baseline').metrics.whole.mean-2);
 if(scene.lights){assert(get('lamp50').metrics.whole.mean<get('lamp70').metrics.whole.mean);assert(get('lamp70').metrics.whole.mean<get('baseline').metrics.whole.mean);}else{for(const id of ['lamp70','lamp50'])assert(Math.abs(get(id).metrics.whole.mean-get('baseline').metrics.whole.mean)<1);}
 console.log(mobile?'mobile':'desktop',scene.id,room,'5 variants passed');
 }}
 c.snapshotMatches=await p.evaluate(expected=>JSON.stringify(houseBakeSource())===JSON.stringify(expected),JSON.parse(fs.readFileSync(path.join(root,'src/bake-source.json'))));assert(c.snapshotMatches);assert.equal(await p.evaluate(()=>houseViewer.roofCoverage().gaps),0);
 report.cases.push(c);await ctx.close();
}
assert.deepEqual(report.errors,[]);assert.deepEqual(report.external,[]);report.result='passed';
}finally{fs.writeFileSync(path.join(root,process.env.BRIGHTNESS_EVIDENCE||'validation/brightness-comparison.json'),JSON.stringify(report,null,2));await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
