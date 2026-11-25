// Actual WebGL canvas checks; mobile and WeChat coverage is browser simulation.
const fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),url=process.env.HOUSE_URL||'http://127.0.0.1:8879/docs/';
const prefix=process.env.VALIDATION_PREFIX||'balcony',report={url,date:new Date().toISOString(),scope:'Windows Chrome WebGL1; mobile viewport/touch/WeChat UA simulation, not physical phone verification',errors:[],external:[],cases:[]};
const ua='Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 MicroMessenger/8.0.50';
const settle=async p=>{const n=await p.evaluate(()=>houseViewer.frames);await p.waitForFunction(n=>houseViewer.frames>n+2,n);};
const change=(p,id,value)=>p.locator('#'+id).evaluate((e,v)=>{if(e.type==='checkbox')e.checked=v;else e.value=v;e.dispatchEvent(new Event(e.type==='checkbox'||e.tagName==='SELECT'?'change':'input',{bubbles:true}));},value);
const capture=async(p,name)=>{
 await settle(p);const data=await p.evaluate(()=>houseViewer.captureImage());
 const result=await p.evaluate(async data=>{const img=new Image();img.src=data;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const cx=c.getContext('2d');cx.drawImage(img,0,0);const image=c.toDataURL('image/webp',.88);c.width=160;c.height=120;cx.drawImage(img,0,0,160,120);const a=cx.getImageData(0,0,160,120).data;let total=0;for(let i=0;i<a.length;i+=4)total+=(a[i]+a[i+1]+a[i+2])/3;return {mean:total/(a.length/4),image};},data);
 if(name&&process.env.VALIDATION_SAVE_IMAGES!=='0')fs.writeFileSync(path.join(root,'validation',prefix+'-'+name+'.webp'),Buffer.from(result.image.split(',')[1],'base64'));
 return result.mean;
};
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  for(const spec of [{id:'desktop',width:1280,height:900},{id:'wechat-portrait',width:390,height:844,mobile:true},{id:'wechat-landscape',width:740,height:360,mobile:true}]){
   const ctx=await b.newContext({viewport:{width:spec.width,height:spec.height},...(spec.mobile?{isMobile:true,hasTouch:true,userAgent:ua}:{})});
   const p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
   p.on('request',r=>{if(!r.url().startsWith(new URL(url).origin)&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'))report.external.push(r.url());});
   await p.addLocatorHandler(p.locator('#appreciationDialog:not([hidden])'),()=>p.locator('#closeAppreciation').click());
   await p.goto(url);await p.waitForFunction(()=>window.houseBoot?.ready&&houseViewer.bakedMaps[0]===219);
   assert(await p.locator('#sidebar').evaluate(e=>e.hidden));
   const item={...spec,boot:await p.evaluate(()=>({diagnostics:houseViewer.diagnostics,maps:houseViewer.bakedMaps,daylight:houseViewer.daylight}))};
   assert.equal(item.boot.daylight,'night');assert.equal(item.boot.diagnostics.viewport[0],spec.width);
   item.snapshotMatches=await p.evaluate(s=>JSON.stringify(houseBakeSource())===JSON.stringify(s),JSON.parse(fs.readFileSync(path.join(root,'src/bake-source.json'),'utf8')));assert(item.snapshotMatches);
   await p.evaluate(()=>houseViewer.captureView('balcony'));await settle(p);
   item.roof=await p.evaluate(()=>houseViewer.roofCoverage());assert.equal(item.roof.gaps,0);assert(await p.evaluate(()=>houseViewer.ceilingVisible));
   assert(await p.evaluate(()=>houseViewer.walkClearance(houseViewer.camera[0],houseViewer.camera[2])));
   item.bareOn=await capture(p,spec.id+'-bare-night');
   await change(p,'showLights',false);item.bareOff=await capture(p,null);assert(item.bareOn>item.bareOff+10,JSON.stringify(item));
   await change(p,'showLights',true);await change(p,'lightPower','0.3');item.bareDim=await capture(p,null);assert(item.bareOn>item.bareDim+5);assert(item.bareDim>item.bareOff+5);
   await change(p,'lightPower','1');
   await change(p,'showCeiling',false);assert.equal(await p.evaluate(()=>houseViewer.ceilingVisible),false);
   await change(p,'showCeiling',true);assert.equal(await p.evaluate(()=>houseViewer.ceilingVisible),true);
   await p.locator('#settings').click();await p.selectOption('#finishRoom','balcony');
   assert.equal(await p.locator('#finishCeilingColor').isEnabled(),true);assert.equal(await p.locator('#finishCeilingMaterial').isEnabled(),true);
   await change(p,'finishCeilingColor','#dad4c9');assert.equal(await p.evaluate(()=>houseViewer.finishes.rooms.balcony.ceiling.color),'#dad4c9');
   assert(await p.evaluate(()=>houseViewer.finishes.materialCounts.find(r=>r.id==='balcony').ceiling>0));
   await p.selectOption('#finishRoom','equipment1');assert.equal(await p.locator('#finishCeilingColor').isEnabled(),false);
   await p.locator('#closeSettings').click();
   await p.locator('#decorShortcut').click();await p.evaluate(()=>houseViewer.captureView('balcony'));await settle(p);
   item.decorOn=await capture(p,spec.id+'-a-night');
   await change(p,'showLights',false);item.decorOff=await capture(p,null);assert(item.decorOn>item.decorOff+10);
   await change(p,'showLights',true);
   // Tilt the real camera up so the new ceiling and emitter are visible together.
   const x=spec.width*.6,y=spec.height*.5;await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x,y-Math.min(200,spec.height*.4),{steps:8});await p.mouse.up();
   item.roofImage=await capture(p,spec.id+'-ceiling-light');
   await p.evaluate(()=>houseViewer.captureView('balcony'));await p.locator('button[data-time="noon"]').click();await change(p,'showLights',false);
   item.noon=await capture(p,spec.id+'-day');assert(item.noon>20);
   await p.locator('button[data-time="night"]').click();await change(p,'showLights',true);
   if(!spec.mobile){
    item.doors=await p.evaluate(()=>houseViewer.doorClosure());assert(item.doors.every(d=>d.gaps===0));
    item.motion=await p.evaluate(()=>houseViewer.doorMotion());assert(item.motion.every(d=>!d.collisions.length&&!d.sweepEnvelopeCollisions.length));
    item.furniture=await p.evaluate(()=>houseViewer.decorDoorClearance());assert(item.furniture.every(d=>!d.collisions.length));
    for(const mode of ['orbit','plan','walk']){await p.locator('button[data-mode="'+mode+'"]').click();await settle(p);assert.equal(await p.evaluate(()=>houseViewer.ceilingVisible),mode==='walk');}
    await p.locator('#decorShortcut').click();await change(p,'finishRoom','balcony');
    assert.equal(await p.evaluate(()=>houseViewer.finishes.rooms.balcony.ceiling.color),'#dad4c9');
    await change(p,'lightPower','0.6');await p.waitForTimeout(350);await p.reload();await p.waitForFunction(()=>houseBoot.ready&&houseViewer.bakedMaps[0]===219);
    assert.equal(await p.locator('#lightPower').inputValue(),'0.6');assert.equal(await p.evaluate(()=>houseViewer.finishes.rooms.balcony.ceiling.color),'#dad4c9');item.persistence='passed';
   }else{
    await p.setViewportSize({width:spec.height,height:spec.width});await p.waitForFunction(w=>houseViewer.diagnostics.viewport[0]===w,spec.height);await settle(p);
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));item.rotation='passed';
   }
   item.quality=await p.evaluate(()=>houseViewer.renderQuality);assert.equal(item.quality.reflectionError,null);
   report.cases.push(item);await ctx.close();console.log(spec.id,'passed');
  }
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.external,[]);report.result='passed';
 }finally{fs.writeFileSync(path.join(root,'validation',prefix+'-validation.json'),JSON.stringify(report,null,2));await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
