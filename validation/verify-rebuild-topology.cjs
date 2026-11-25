// Audit the shipped quantized triangles per authored solid, after UV/normal splits.
// Touching manufactured parts stay separate; intentional basin cavities stay open
// above a closed vessel. No tolerance welding that could conceal an actual crack.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
function decode(m){
 const pos=Buffer.from(m.position,'base64'),idx=Buffer.from(m.index,'base64'),norm=Buffer.from(m.normal,'base64');
 const q=Array.from({length:m.vertices},(_,i)=>[0,1,2].map(k=>pos.readUInt16LE(i*6+k*2)));
 const p=q.map(v=>v.map((x,i)=>Math.fround(m.min[i]+x/65535*m.size[i])));
 const n=q.map((_,i)=>[0,1,2].map(k=>norm.readInt8(i*3+k)/127));
 const indices=Array.from({length:m.triangles*3},(_,i)=>idx.readUInt16LE(i*2));
 return {q,p,n,indices};
}
function solid(part,d){
 const edges=new Map();let degenerate=0,invertedNormals=0,volume=0,minArea=Infinity;
 for(let t=part.start;t<part.start+part.count;t+=3){
  const ids=d.indices.slice(t,t+3),p=ids.map(i=>d.p[i]),keys=ids.map(i=>d.q[i].join(','));
  const normal=cross(sub(p[1],p[0]),sub(p[2],p[0])),area=Math.hypot(...normal)/2;
  minArea=Math.min(minArea,area);if(area<1e-13)degenerate++;
  const smooth=ids.map(i=>d.n[i]).reduce((s,n)=>s.map((v,i)=>v+n[i]),[0,0,0]);
  if(dot(normal,smooth)<-1e-13)invertedNormals++;
  volume+=dot(p[0],cross(p[1],p[2]))/6;
  for(let j=0;j<3;j++){
   const a=keys[j],b=keys[(j+1)%3],ordered=a<b,key=ordered?a+'|'+b:b+'|'+a;
   const e=edges.get(key)||{uses:0,balance:0};e.uses++;e.balance+=ordered?1:-1;edges.set(key,e);
  }
 }
 const values=[...edges.values()];
 return {name:part.name,triangles:part.count/3,boundaryEdges:values.filter(e=>e.uses===1).length,nonmanifoldEdges:values.filter(e=>e.uses>2).length,windingErrors:values.filter(e=>e.uses===2&&e.balance!==0).length,degenerateTriangles:degenerate,invertedNormals,signedVolume:volume,minTriangleArea:minArea};
}
function downward(x,z,entries){
 let highest=-Infinity,material=null;
 for(const [m,d] of entries)for(let i=0;i<d.indices.length;i+=3){
  const a=d.p[d.indices[i]],b=d.p[d.indices[i+1]],c=d.p[d.indices[i+2]];
  const det=(b[0]-a[0])*(c[2]-a[2])-(c[0]-a[0])*(b[2]-a[2]);if(Math.abs(det)<1e-14)continue;
  const u=((x-a[0])*(c[2]-a[2])-(c[0]-a[0])*(z-a[2]))/det;
  const v=((b[0]-a[0])*(z-a[2])-(x-a[0])*(b[2]-a[2]))/det;
  if(u< -1e-8||v< -1e-8||u+v>1+1e-8)continue;
  const y=a[1]+u*(b[1]-a[1])+v*(c[1]-a[1]);
  if(y<=1.02&&y>highest){highest=y;material=m.material;}
 }
 return {height:highest,material};
}
function sinkCoverage(meshes){
 const entries=meshes.filter(m=>['chrome','ceramic'].includes(m.material)).map(m=>[m,decode(m)]);
 let rays=0,gaps=0;const examples=[];
 for(let x=-.51;x<.52;x+=.012)for(let z=-.30;z<.31;z+=.012){
  const hit=downward(x,z,entries);rays++;
  if(!Number.isFinite(hit.height)){gaps++;if(examples.length<8)examples.push([x,z]);}
 }
 const cavity=downward(0,0,meshes.map(m=>[m,decode(m)]));
 return {rays,gaps,examples,cavity,scope:'Vertical rays through the complete countertop and intended sink cavity, on exported geometry'};
}
function assemblyFits(id,meshes){
 const bounds=[];
 for(const m of meshes){const d=decode(m);for(const part of m.parts){const points=d.indices.slice(part.start,part.start+part.count).map(i=>d.p[i]);bounds.push({name:part.name,min:[0,1,2].map(k=>Math.min(...points.map(p=>p[k]))),max:[0,1,2].map(k=>Math.max(...points.map(p=>p[k])))});}}
 if(id.endsWith('-bed')){
  const quilt=bounds.find(p=>p.name.includes('/ closed quilt shell')),mattress=bounds.find(p=>p.name.includes('/ mattress'));
  return {kind:'quilt-to-mattress',gapMm:(quilt.min[1]-mattress.max[1])*1000,allowedGapMm:.05,maxEmbedMm:12};
 }
 if(id.startsWith('kitchen-')){
  const counter=bounds.filter(p=>/\/ (stone worktop|counter end|counter rail)/.test(p.name)),ends=bounds.filter(p=>/\/ (side return|cabinet end)/.test(p.name));
  return {kind:'carcass-to-counter',gapMm:(Math.min(...counter.map(p=>p.min[1]))-Math.min(...ends.map(p=>p.max[1])))*1000,allowedGapMm:.05,maxEmbedMm:8};
 }
 return null;
}
function stitchFits(meshes){
 const THREE=require(path.join(root,'src/three.min.js')),parts=new Map();
 for(const m of meshes){const d=decode(m);for(const part of m.parts)parts.set(part.name,{part,d});}
 const result=[];
 for(const {part,d} of parts.values())if(part.surface){
  const target=parts.get(part.surface);assert(target,part.surface+' seam target missing');const triangles=[];
  for(let i=target.part.start;i<target.part.start+target.part.count;i+=3)triangles.push(new THREE.Triangle(...[0,1,2].map(k=>new THREE.Vector3(...target.d.p[target.d.indices[i+k]]))));
  let maxDistance=0;const closest=new THREE.Vector3();
  for(let j=0;j<32;j++){
   const vertex=d.indices[part.start+Math.floor(j/32*part.count)],point=new THREE.Vector3(...d.p[vertex]);let distance=Infinity;
   for(const tri of triangles){tri.closestPointToPoint(point,closest);distance=Math.min(distance,point.distanceToSquared(closest));}
   maxDistance=Math.max(maxDistance,Math.sqrt(distance));
  }
  result.push({name:part.name,surface:part.surface,samples:32,maxDistanceMm:maxDistance*1000,allowedDistanceMm:3});
 }
 return result;
}
const file=process.env.MODEL_FILE||path.join(root,'assets/rebuild/models.json');
const models=JSON.parse(fs.readFileSync(file));
const legacy=process.env.TOPOLOGY_LEGACY==='1';
const report={authoringScriptSha256:models.authoringScriptSha256,scope:'Quantized shipped high/mobile meshes; per authored solid, UV seams welded only at identical integer positions',legacy,models:{},totals:{parts:0,triangles:0,boundaryEdges:0,nonmanifoldEdges:0,windingErrors:0,degenerateTriangles:0,invertedNormals:0},result:'passed'};
if(!legacy){
 const THREE=require(path.join(root,'src/three.min.js')),vm=require('vm'),context={THREE};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'src/decor-preset-a.js'),'utf8'),context);
 report.proceduralTubes=[];
 for(const points of [[[0,0,0],[.5,0,0]],[[0,0,0],[0,.5,0]],[[0,0,0],[0,.3,.1],[.2,.5,.1]]]){
  const vertices=points.map(p=>new THREE.Vector3(...p)),curve=vertices.length===2?new THREE.LineCurve3(...vertices):new THREE.CatmullRomCurve3(vertices,false,'catmullrom',.1),g=context.closeHouseTubeGeometry(new THREE.TubeGeometry(curve,12,.003,4,false));
  const p=Array.from({length:g.attributes.position.count},(_,i)=>new THREE.Vector3().fromBufferAttribute(g.attributes.position,i).toArray()),n=p.map((_,i)=>new THREE.Vector3().fromBufferAttribute(g.attributes.normal,i).toArray());
  const result=solid({name:'procedural tube '+report.proceduralTubes.length,start:0,count:g.index.count},{p,q:p,n,indices:Array.from(g.index.array)});
  for(const key of ['boundaryEdges','nonmanifoldEdges','windingErrors','degenerateTriangles','invertedNormals'])assert.equal(result[key],0,JSON.stringify(result));assert(result.signedVolume>0);
  report.proceduralTubes.push(result);g.dispose();
 }
}
for(const [id,lods] of Object.entries(models.models)){
 report.models[id]={};
 for(const [lod,meshes] of Object.entries(lods)){
  const parts=[];
  for(const m of meshes){
   if(!legacy){assert.deepEqual(m.min,meshes[0].min,id+' shared grid origin');assert.deepEqual(m.size,meshes[0].size,id+' shared grid scale');assert(m.parts?.length,id+' needs authored solid ranges');}
   const d=decode(m),ranges=m.parts||[{name:id+' / '+m.material+' (legacy material group)',start:0,count:d.indices.length}];
   let end=0;
   for(const part of ranges){assert.equal(part.start,end);assert.equal(part.count%3,0);end+=part.count;parts.push(solid(part,d));}
   assert.equal(end,d.indices.length);
  }
  report.models[id][lod]={parts,maxPositionErrorMm:Math.hypot(...meshes[0].size)/65535/2*1000};
  if(!legacy){const fits=stitchFits(meshes);report.models[id][lod].stitches=fits;if(fits.some(f=>f.maxDistanceMm>f.allowedDistanceMm))report.result='failed';}
  if(!legacy&&(id.endsWith('-bed')||id.startsWith('kitchen-'))){const fit=assemblyFits(id,meshes);report.models[id][lod].assemblyFit=fit;if(fit.gapMm>fit.allowedGapMm||fit.gapMm< -fit.maxEmbedMm)report.result='failed';}
  for(const p of parts){report.totals.parts++;report.totals.triangles+=p.triangles;for(const key of ['boundaryEdges','nonmanifoldEdges','windingErrors','degenerateTriangles','invertedNormals'])report.totals[key]+=p[key];}
  if(id==='kitchen-north')report.models[id][lod].counterCoverage=sinkCoverage(meshes);
  if(!legacy)for(const p of parts){
   for(const key of ['boundaryEdges','nonmanifoldEdges','windingErrors','degenerateTriangles','invertedNormals'])if(p[key])report.result='failed';
   if(p.signedVolume<=1e-13)report.result='failed';
  }
 }
}
for(const lod of ['high','mobile'])if(!legacy){const c=report.models['kitchen-north'][lod].counterCoverage;if(c.gaps||c.cavity.material!=='chrome'||c.cavity.height<.79||c.cavity.height>.81)report.result='failed';}
const out=process.env.TOPOLOGY_REPORT||path.join(root,'validation/rebuild-topology.json');
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({result:report.result,legacy,totals:report.totals,sink:Object.fromEntries(['high','mobile'].map(lod=>[lod,report.models['kitchen-north'][lod].counterCoverage]))},null,2));
if(!legacy)assert.equal(report.result,'passed','See '+out+' for exact failing solid / LOD');
