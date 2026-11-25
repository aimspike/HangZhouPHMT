// Resource bounds and adaptive-resolution behavior under synthetic CPU pressure.
const fs=require('fs'),assert=require('assert'),path=require('path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),report={scope:'Windows Chrome with touch/WeChat UA simulation; synthetic CPU draw submission delay, not phone GPU performance',errors:[]};
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader']});try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,userAgent:'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36 MicroMessenger/8.0.50'}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.addLocatorHandler(page.locator('#appreciationDialog:not([hidden])'),()=>page.locator('#closeAppreciation').click());
 await page.goto('http://127.0.0.1:8879/docs/?decor=a');await page.waitForFunction(()=>houseBoot.ready&&houseViewer.bakedMaps[0]===219);
 for(const id of ['living','master','second','kitchen','study','storage','balcony','living']){
  const previous=await page.evaluate(()=>houseViewer.renderQuality.captures);await page.evaluate(id=>houseViewer.captureView(id),id);await page.waitForFunction(n=>houseViewer.renderQuality.captures>n,previous);
  const q=await page.evaluate(()=>houseViewer.renderQuality);assert(q.cachedRooms.length<=2);assert.equal(q.reflectionError,null);assert(!q.ao&&!q.depthTextureAttached);
 }
 report.cache=await page.evaluate(()=>houseViewer.renderQuality);assert(report.cache.evictions>=5);assert(report.cache.lightmapRGBA8MiB<36);
 await page.evaluate(()=>{const original=WebGLRenderingContext.prototype.drawElements;WebGLRenderingContext.prototype.drawElements=function(...args){if(window.qualityStress&&!window.qualityStressPending){window.qualityStressPending=true;setTimeout(()=>window.qualityStressPending=false,0);const end=performance.now()+40;while(performance.now()<end){}}return original.apply(this,args);};window.qualityStress=true;});
 await page.waitForFunction(()=>houseViewer.renderQuality.pixelRatio<=1,{},{timeout:25000});report.pressure=await page.evaluate(()=>houseViewer.renderQuality);assert(report.pressure.pixelRatio>=.85);
 await page.evaluate(()=>window.qualityStress=false);const low=report.pressure.pixelRatio;await page.waitForFunction(r=>houseViewer.renderQuality.pixelRatio>r,low,{timeout:20000});report.recovered=await page.evaluate(()=>houseViewer.renderQuality);
 await page.locator('#settings').click();await page.selectOption('#renderQuality','high');await page.locator('#closeSettings').click();await page.waitForTimeout(200);await page.reload();await page.waitForFunction(()=>houseBoot.ready&&houseViewer.bakedMaps[0]===219);report.saved=await page.evaluate(()=>houseViewer.renderQuality);assert.equal(report.saved.quality,'high');assert(!report.saved.ao&&report.saved.pixelRatio<=1.75);
 const textureState=await page.evaluate(()=>{const r=createHouseSurfaceMaps({capabilities:{getMaxAnisotropy:()=>4}}),a=r('wood','floor'),b=r('fabric');return {separate:a.map!==a.bump&&a.bump!==a.roughness&&b.bump!==b.roughness,colorEncoding:a.map.encoding,dataEncoding:a.roughness.encoding}});assert(textureState.separate&&textureState.colorEncoding!==textureState.dataEncoding);report.textureData=textureState;
 assert.deepEqual(report.errors,[]);report.result='passed';
}finally{fs.writeFileSync(path.join(root,'validation/v15-resource-policy.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
