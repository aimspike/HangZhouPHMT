const fs=require('fs'),path=require('path'),assert=require('assert'),{chromium}=require(process.env.PLAYWRIGHT_MODULE);
const url=process.env.REPORT_URL||'http://127.0.0.1:8879/docs/quality-report/surface-fixes.html',report={url,cases:[],errors:[]};
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 for(const width of [1280,390]){
  const p=await b.newPage({viewport:{width,height:900}});p.on('pageerror',e=>report.errors.push(e.message));await p.goto(url);let count=0;
  for(const device of ['pc','mobile']){await p.locator('[data-device="'+device+'"]').click();for(const scene of ['noon','night']){await p.locator('[data-scene="'+scene+'"]').click();for(const room of scene==='noon'?['living','dining','master','bath','balconyBasin','bathBasin','toilet']:['balconyBasin','bathBasin','toilet']){
   await p.locator('[data-room="'+room+'"]').click();await p.waitForFunction(()=>['before','after','beforeFull','afterFull'].every(id=>{const i=document.getElementById(id);return i.complete&&i.naturalWidth>0}));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));count++;
  }}}
  for(const value of ['0','100','50']){await p.locator('#split').fill(value);assert.equal(await p.locator('#compare').evaluate(e=>e.style.getPropertyValue('--split')),value+'%');}
  await p.evaluate(async()=>{for(const img of document.images){img.loading='eager';await img.decode()}});
  const links=await p.locator('a').evaluateAll(es=>es.filter(e=>new URL(e.href).origin===location.origin).map(e=>e.href));for(const link of links){if(new URL(url).hostname==='127.0.0.1'&&link.endsWith('/deployment.json'))continue;assert.equal((await p.request.get(link)).status(),200,link)}
  report.cases.push({width,comparisons:count,slider:'passed',images:'all decoded',localLinks:links.length,overflow:false});await p.screenshot({path:path.resolve('work/surface-fixes/report-'+width+'.png'),fullPage:true});await p.close();
 }
 assert.deepEqual(report.errors,[]);report.result='passed';
 }finally{fs.writeFileSync(process.env.REPORT_EVIDENCE||'validation/surface-report-layout.json',JSON.stringify(report,null,2));await b.close()}
})().catch(e=>{console.error(e);process.exit(1)});
