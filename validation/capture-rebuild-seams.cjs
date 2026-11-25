// Inspect the real embedded, decoded WebGL1 assets in controlled neutral light.
// These are asset close-ups, not room screenshots, Cycles renders or phone tests.
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),root=path.resolve(__dirname,'..');
const base=process.env.HOUSE_URL||'http://127.0.0.1:8879/docs/';
const before=process.env.SEAMS_BEFORE_URL||new URL('../work/seams/before.html',base).href;
const output=path.join(root,'work/seams/inspection');fs.mkdirSync(output,{recursive:true});
const shots=[
 {id:'sofa',model:'sofa',position:[2.3,1.4,-1.95],target:[.8,.55,.02],fov:38},
 {id:'sink',model:'kitchen-north',position:[.88,1.6,1.03],target:[0,.84,0],fov:44},
 {id:'quilt',model:'master-bed',position:[1.55,.86,1.6],target:[.43,.53,.53],fov:34},
 {id:'shade',model:'pendant',position:[.48,1.97,.43],target:[0,2.29,0],fov:48},
 {id:'tube',model:'chair',position:[.58,.37,-.65],target:[.17,.45,-.06],fov:38}
];
const report={scope:'Embedded asset WebGL1 close-ups in fixed neutral inspection lighting; PC high and touch/WeChat mobile LOD. Not room lighting or physical phone verification',cases:[],errors:[]};
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-unsafe-swiftshader']});try{
 for(const mobile of [false,true])for(const [stage,url] of [['before',before],['after',base]]){
  const context=await browser.newContext({viewport:{width:mobile?390:1100,height:mobile?844:800},...(mobile?{isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36 MicroMessenger/8.0.50'}:{})}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  const htmlSha256=crypto.createHash('sha256').update(await (await page.request.get(url)).body()).digest('hex');await page.goto(url);await page.waitForFunction(()=>window.houseBoot?.ready&&houseViewer.bakedMaps[0]===219);
  await page.evaluate(mobile=>{
   const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl',{antialias:true,alpha:false,preserveDrawingBuffer:true}),renderer=new THREE.WebGLRenderer({canvas,context:gl,antialias:true,preserveDrawingBuffer:true});renderer.setSize(mobile?585:1100,mobile?1266:800);renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
   const assets=createHouseRebuildAssets(renderer),scene=new THREE.Scene();scene.background=new THREE.Color('#b7c6c1');
   scene.add(new THREE.HemisphereLight('#edf3ff','#989381',1.1));for(const [p,intensity] of [[[3,5,4],2.7],[[-4,2,-2],1.3]]){const light=new THREE.DirectionalLight('#ffffff',intensity);light.position.fromArray(p);scene.add(light);}
   const faces=Array.from({length:6},(_,i)=>{const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,32);g.addColorStop(0,'#f5f6f5');g.addColorStop(.6,'#b6bdb8');g.addColorStop(1,'#707c77');x.fillStyle=g;x.fillRect(0,0,32,32);return c;});
   const env=new THREE.CubeTexture(faces);env.encoding=THREE.sRGBEncoding;env.needsUpdate=true;
   const colors={wood:'#96704e',oak:'#bc936b',cream:'#eee6d8',white:'#f4f0e7',navy:'#2e3c4b',blue:'#45576d',linen:'#c3b8a6',mustard:'#b3a05e',black:'#252b2d',orange:'#b95d30',chrome:'#b9bdbb',seam:'#596975',ceramic:'#dcd4bf',brass:'#8d7652'};
   function material(name){const key=name==='navy'?'fabric':['linen','mustard','blue','white'].includes(name)?'fabric_plain':['wood','oak'].includes(name)?'wood':name==='ceramic'?'stone':null,tx=key?assets.maps(key):null,metal=['chrome','brass'].includes(name),m=new THREE.MeshStandardMaterial({color:colors[name],side:THREE.FrontSide,roughness:metal?.2:.6,metalness:metal?.82:0,vertexColors:true,envMap:env,envMapIntensity:metal?.7:.12});m.color.convertSRGBToLinear();if(tx){m.map=tx.color;m.normalMap=tx.normal;m.normalScale.set(.08,.08);m.roughnessMap=tx.roughness;}return m;}
   window.seamInspection={renderer,assets,scene,material,group:null};
  },mobile);
  const version=await page.evaluate(()=>houseViewer.diagnostics.version);assert.equal(version,stage==='before'?(process.env.SEAMS_BEFORE_VERSION||'16.0'):(process.env.HOUSE_VERSION||'16.2'));const item={version,htmlSha256,authoringScriptSha256:await page.evaluate(()=>window.HOUSE_REBUILD_MODELS.authoringScriptSha256),stage,device:mobile?'mobile':'pc',url,shots:[]};
  for(const shot of shots){
   await page.evaluate(shot=>{const s=seamInspection;if(s.group){s.scene.remove(s.group);s.group.traverse(o=>{if(o.material)o.material.dispose()});}s.group=new THREE.Group();s.scene.add(s.group);s.assets.add(shot.model,s.group,s.material);s.camera=new THREE.PerspectiveCamera(shot.fov,s.renderer.domElement.width/s.renderer.domElement.height,.005,20);s.camera.position.fromArray(shot.position);s.camera.lookAt(new THREE.Vector3(...shot.target));},shot);
   await page.waitForFunction(()=>seamInspection.assets.diagnostics.texturesExpected===seamInspection.assets.diagnostics.texturesReady);
   const result=await page.evaluate(()=>{const s=seamInspection;s.renderer.render(s.scene,s.camera);return {image:s.renderer.domElement.toDataURL('image/png'),lod:s.assets.diagnostics.lod,canvas:[s.renderer.domElement.width,s.renderer.domElement.height],triangles:s.renderer.info.render.triangles}});
   assert.equal(result.lod,mobile?'mobile':'high');const filename=`${stage}-${item.device}-${shot.id}.png`;fs.writeFileSync(path.join(output,filename),Buffer.from(result.image.split(',')[1],'base64'));delete result.image;item.shots.push({...shot,...result,file:filename});
  }
  report.cases.push(item);await context.close();console.log(stage,item.device,'asset close-ups captured');
 }
 assert.deepEqual(report.errors,[]);report.result='passed';
}finally{await browser.close();fs.writeFileSync(path.join(root,'validation/rebuild-seams-visual.json'),JSON.stringify(report,null,2)+'\n');}})().catch(e=>{console.error(e);process.exit(1)});
