/* WebGL1 enhancements: cached room reflections and depth-aware contact occlusion.
   These complement the architectural bake; they do not perform path tracing. */
function createHouseRenderQuality(options){
 'use strict';
 const {renderer,scene,rooms,sourceTarget,aaMaterial,mobile}=options;
 const $=id=>document.getElementById(id),gl=renderer.getContext();
 const depthSupported=!!(renderer.capabilities.isWebGL2||renderer.extensions.get('WEBGL_depth_texture'));
 // Mobile/WebView texture precision differs from a desktop with a mobile UA.
 // Keep the baked shadows and room reflections, without screen-depth AO there.
 const screenAOAllowed=depthSupported&&!mobile&&renderer.capabilities.precision==='highp';
 const hdrSupported=!!(renderer.capabilities.isWebGL2||(renderer.extensions.has('OES_texture_half_float')&&renderer.extensions.has('OES_texture_half_float_linear')&&renderer.extensions.has('EXT_color_buffer_half_float')));
 const state={quality:'auto',effective:mobile?'balanced':'high',ao:false,probeRoom:null,captures:0,revision:0,reflectionError:null,reflectionSource:'dynamic scene capture',probeReady:false};
 const cache=new Map(),registered=new Set(),pmrem=new THREE.PMREMGenerator(renderer);
 let dirtyAt=0,capturing=false,aoSize=new THREE.Vector2(1,1),lastMode='orbit';
 const matrixInverse=new THREE.Matrix4(),projection=new THREE.Matrix4();
 if(screenAOAllowed){sourceTarget.depthTexture=new THREE.DepthTexture(1,1,THREE.UnsignedIntType);sourceTarget.depthTexture.format=THREE.DepthFormat;sourceTarget.dispose();}
 const aoTarget=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:false,stencilBuffer:false});
 const kernel=[];for(let i=0;i<20;i++){const a=i*2.39996323,z=.18+.74*((i*.61803398875)%1),s=.18+.82*((i+1)/20)**1.6;kernel.push(new THREE.Vector3(Math.cos(a)*Math.sqrt(1-z*z)*s,Math.sin(a)*Math.sqrt(1-z*z)*s,z*s));}
 const aoUniforms={depthMap:{value:sourceTarget.depthTexture||null},inverseProjection:{value:matrixInverse},projection:{value:projection},pixel:{value:new THREE.Vector2(1,1)},kernel:{value:kernel},sampleCount:{value:20},radius:{value:.28}};
 const aoMaterial=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:aoUniforms,vertexShader:THREE.FXAAShader.vertexShader,fragmentShader:`
 varying vec2 vUv;uniform highp sampler2D depthMap;uniform mat4 inverseProjection,projection;uniform vec2 pixel;uniform vec3 kernel[20];uniform int sampleCount;uniform float radius;
 vec3 positionAt(vec2 uv){float d=texture2D(depthMap,uv).r;vec4 p=inverseProjection*vec4(uv*2.0-1.0,d*2.0-1.0,1.0);return p.xyz/p.w;}
 void main(){float d=texture2D(depthMap,vUv).r;if(d>.999999){gl_FragColor=vec4(1.0);return;}vec3 p=positionAt(vUv);
 // A wider baseline stabilizes normals on quantized mobile depth buffers.
 vec3 l=positionAt(vUv-vec2(pixel.x*3.0,0.0)),r=positionAt(vUv+vec2(pixel.x*3.0,0.0)),b=positionAt(vUv-vec2(0.0,pixel.y*3.0)),t=positionAt(vUv+vec2(0.0,pixel.y*3.0));
 vec3 dx=abs(r.z-p.z)<abs(l.z-p.z)?r-p:p-l,dy=abs(t.z-p.z)<abs(b.z-p.z)?t-p:p-b,n=normalize(cross(dx,dy));if(dot(n,-p)<0.0)n=-n;
 float angle=fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453)*6.2831853;
 vec3 tangent=normalize(cross(n,abs(n.z)<.9?vec3(0.0,0.0,1.0):vec3(0.0,1.0,0.0))),bitangent=cross(n,tangent),a=tangent*cos(angle)+bitangent*sin(angle),c=-tangent*sin(angle)+bitangent*cos(angle);mat3 basis=mat3(a,c,n);
 // Screen-depth ordering alone mistakes a sloped plane for an occluder.
 // Require a hit above its receiver plane; budget for 16-bit depth error.
 float depthStep=abs(inverseProjection[2][3])*p.z*p.z/32768.0,bias=max(.018,depthStep*2.0);
 float blocked=0.0,weight=0.0;for(int i=0;i<20;i++){if(i>=sampleCount)break;vec3 s=p+n*.012+basis*kernel[i]*radius;vec4 q=projection*vec4(s,1.0);vec2 uv=q.xy/q.w*.5+.5;if(q.w<=0.0||uv.x<0.0||uv.y<0.0||uv.x>1.0||uv.y>1.0)continue;vec3 hit=positionAt(uv),delta=hit-p;float range=1.0-smoothstep(radius*.6,radius*1.8,length(delta));float abovePlane=smoothstep(bias,bias*2.0,dot(n,delta));blocked+=step(s.z+bias,hit.z)*abovePlane*range;weight+=1.0;}
 float ao=1.0-.76*blocked/max(weight,1.0);gl_FragColor=vec4(vec3(max(.42,ao)),1.0);}
 `});
 const postScene=new THREE.Scene(),postCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),aoMaterial));
 const composite={houseAO:{value:aoTarget.texture},houseDepth:{value:sourceTarget.depthTexture||null},houseAOPixel:{value:new THREE.Vector2(1,1)},houseAOEnabled:{value:0},houseInverseProjection:{value:matrixInverse}};
 Object.assign(aaMaterial.uniforms,composite);
 const compositeGLSL=`
 float houseViewZ(vec2 uv){vec4 p=houseInverseProjection*vec4(uv*2.0-1.0,texture2D(houseDepth,uv).r*2.0-1.0,1.0);return p.z/p.w;}
 float houseContactAO(vec2 uv){float z=houseViewZ(uv),sum=0.0,w=0.0;for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){vec2 off=vec2(float(x),float(y))*houseAOPixel*1.3;float weight=exp(-abs(houseViewZ(uv+off)-z)*45.0)*(x==0&&y==0?2.0:1.0);sum+=texture2D(houseAO,uv+off).r*weight;w+=weight;}return sum/max(w,.0001);}
 `;
 if(screenAOAllowed){
 aaMaterial.fragmentShader='uniform sampler2D houseAO;uniform highp sampler2D houseDepth;uniform vec2 houseAOPixel;uniform float houseAOEnabled;uniform mat4 houseInverseProjection;\n'+aaMaterial.fragmentShader;
 aaMaterial.fragmentShader=aaMaterial.fragmentShader.replace('void main() {',compositeGLSL+'\nvoid main() {').replace('gl_FragColor.a = texture2D(tDiffuse, vUv).a;','gl_FragColor.a = texture2D(tDiffuse, vUv).a;\nif(houseAOEnabled>0.5){float a=houseContactAO(vUv);gl_FragColor.rgb=pow(pow(max(gl_FragColor.rgb,vec3(0.0)),vec3(2.2))*a,vec3(1.0/2.2));}');
 }
 function apply(){state.quality=$('renderQuality').value;state.effective=state.quality==='auto'?(mobile?'balanced':'high'):state.quality;aoUniforms.sampleCount.value=state.effective==='high'?20:12;state.ao=screenAOAllowed&&state.effective!=='light';$('renderQualityNote').textContent=state.effective==='light'?'轻量：保留烘焙光照与材质纹理。':screenAOAllowed?'分房间场景反射、接触阴影与精细材质；切换灯光后反射自动更新。':'兼容渲染：保留烘焙阴影、房间反射与材质，避免墙顶阴影条纹。';invalidate();options.resize();}
 function invalidate(){state.reflectionSource='awaiting current state';state.probeReady=false;state.revision++;dirtyAt=performance.now();}
 for(const event of ['input','change'])document.addEventListener(event,e=>{if(e.target.closest('#sidebar')&&!e.target.closest('#settingsStorage'))invalidate();});
 document.addEventListener('click',e=>{if(e.target.closest('[data-time],[data-door],#openAllDoors,#closeAllDoors,#decorShortcut,#resetFinishes'))invalidate();});
 function register(){scene.traverse(object=>{for(const m of Array.isArray(object.material)?object.material:[object.material]){if(!m?.isMeshStandardMaterial||!m.userData.houseRoom||registered.has(m))continue;registered.add(m);const base=m.onBeforeCompile,key=m.customProgramCacheKey;
   const room=rooms.find(r=>r.id===m.userData.houseRoom);if(!room)continue;
   const bounds={min:new THREE.Vector3(room.x-3.1,.02,room.z-6.25),max:new THREE.Vector3(room.x+room.w-3.1,2.8,room.z+room.d-6.25)},origin=new THREE.Vector3(room.x+room.w/2-3.1,1.45,room.z+room.d/2-6.25);
   m.userData.houseProbe={bounds,origin};m.onBeforeCompile=shader=>{base.call(m,shader);shader.uniforms.houseProbeMin={value:bounds.min};shader.uniforms.houseProbeMax={value:bounds.max};shader.uniforms.houseProbeOrigin={value:origin};shader.vertexShader='varying vec3 houseReflectionPosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nhouseReflectionPosition=(modelMatrix*vec4(transformed,1.0)).xyz;');shader.fragmentShader='varying vec3 houseReflectionPosition;uniform vec3 houseProbeMin,houseProbeMax,houseProbeOrigin;\n'+shader.fragmentShader;
    let chunk=THREE.ShaderChunk.envmap_physical_pars_fragment;chunk=chunk.replace('reflectVec = inverseTransformDirection( reflectVec, viewMatrix );',`reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
     vec3 invRay=sign(reflectVec)/max(abs(reflectVec),vec3(.00001));vec3 farPlane=max((houseProbeMax-houseReflectionPosition)*invRay,(houseProbeMin-houseReflectionPosition)*invRay);float distanceToWall=min(min(farPlane.x,farPlane.y),farPlane.z);if(distanceToWall>0.0)reflectVec=houseReflectionPosition+reflectVec*distanceToWall-houseProbeOrigin;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <envmap_physical_pars_fragment>',chunk);
    // The bake/furnishing shader already supplies diffuse GI. Reflection adds specular only.
    shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>','#if defined(USE_ENVMAP) && defined(STANDARD)\nif(houseBakedEnabled>0.5)iblIrradiance=vec3(0.0);\n#endif\n#include <lights_fragment_end>');};m.customProgramCacheKey=()=>key.call(m)+'-room-reflection-v14';m.needsUpdate=true;
  }});
 }
 function capture(room){
  // Blending glass in an RGBE render target corrupts its shared exponent.
  // Capture in linear half float where supported, otherwise bounded linear RGBA8.
  const resolution=mobile?64:128,rt=new THREE.WebGLCubeRenderTarget(resolution,{format:THREE.RGBAFormat,type:hdrSupported?THREE.HalfFloatType:THREE.UnsignedByteType,encoding:THREE.LinearEncoding,generateMipmaps:false,minFilter:THREE.LinearFilter});
  const cube=new THREE.CubeCamera(.04,1000,rt),origin=new THREE.Vector3(room.x+room.w/2-3.1,1.45,room.z+room.d/2-6.25);cube.position.copy(origin);cube.updateMatrixWorld(true);
  const saved={target:renderer.getRenderTarget(),tone:renderer.toneMapping,exposure:renderer.toneMappingExposure,shadow:renderer.shadowMap.autoUpdate,background:scene.background,clear:renderer.getClearColor(new THREE.Color()),alpha:renderer.getClearAlpha()},strengths=[];let captured=false;
  for(const m of registered){strengths.push([m,m.envMapIntensity]);m.envMapIntensity=0;}
  try{capturing=true;scene.background=null;renderer.setClearColor(0,0);renderer.toneMapping=THREE.NoToneMapping;renderer.toneMappingExposure=1;options.tickEnvironment(cube);options.captureScene(cube);const filtered=pmrem.fromCubemap(rt.texture);const old=cache.get(room.id);if(old)old.target.dispose();cache.set(room.id,{target:filtered,revision:state.revision});state.captures++;
   for(const m of registered)if(m.userData.houseRoom===room.id){m.envMap=filtered.texture;m.userData.houseProbe.origin.copy(origin);m.envMapIntensity=m.userData.houseReflectionStrength??1;m.needsUpdate=true;}captured=true;
  }finally{for(const [m,strength] of strengths)if(!captured||m.userData.houseRoom!==room.id)m.envMapIntensity=strength;scene.background=saved.background;renderer.setClearColor(saved.clear,saved.alpha);renderer.toneMapping=saved.tone;renderer.toneMappingExposure=saved.exposure;renderer.shadowMap.autoUpdate=saved.shadow;renderer.setRenderTarget(saved.target);rt.dispose();capturing=false;}
 }
 const pending=new Set();
 function installStatic(room,texture,revision){
  if(!texture||state.revision!==revision||!options.staticLighting?.active)return;
  const filtered=pmrem.fromEquirectangular(texture),old=cache.get(room.id);if(old)old.target.dispose();cache.set(room.id,{target:filtered,revision:state.revision,source:'Blender Cycles static'});
  for(const m of registered)if(m.userData.houseRoom===room.id){m.envMap=filtered.texture;m.envMapIntensity=m.userData.houseReflectionStrength??1;m.needsUpdate=true;}state.captures++;state.reflectionSource='Blender Cycles static bases + PMREM';
 }
 function prepare(camera,mode,ready){
  const enabled=state.effective!=='light'&&mode==='walk';composite.houseAOEnabled.value=enabled&&state.ao&&!options.staticLighting?.active?1:0;
  projection.copy(camera.projectionMatrix);matrixInverse.copy(camera.projectionMatrixInverse);lastMode=mode;
  if(!enabled){for(const m of registered)m.envMapIntensity=0;state.probeRoom=null;return;}
  if(!ready||capturing||performance.now()-dirtyAt<180)return;
  register();const x=camera.position.x+3.1,z=camera.position.z+6.25,room=rooms.find(r=>x>r.x&&x<r.x+r.w&&z>r.z&&z<r.z+r.d);if(!room)return;state.probeRoom=room.id;
  for(const m of registered)if(m.envMap&&cache.has(m.userData.houseRoom))m.envMapIntensity=m.userData.houseReflectionStrength??1;
  const stored=cache.get(room.id);state.probeReady=!!stored&&stored.revision===state.revision;if((!stored||stored.revision!==state.revision)&&!state.reflectionError){try{
   if(options.staticLighting?.active){const revision=state.revision,key=revision+'-'+room.id;if(!pending.has(key)){pending.add(key);options.staticLighting.reflection(room.id).then(texture=>{try{installStatic(room,texture,revision);}catch(error){state.reflectionError=error.message;}finally{pending.delete(key);}}).catch(error=>{pending.delete(key);state.reflectionError=error.message;});}}
   else{capture(room);state.reflectionSource='dynamic scene capture';}
  }catch(error){state.reflectionError=error.message;console.warn('Room reflection fallback:',error.message);}}
 }
 function occlusion(){if(!composite.houseAOEnabled.value)return;renderer.setRenderTarget(aoTarget);renderer.render(postScene,postCamera);}
 function resize(width,height){const scale=state.effective==='high'?.7:.5;aoSize.set(Math.max(1,Math.round(width*scale)),Math.max(1,Math.round(height*scale)));aoTarget.setSize(aoSize.x,aoSize.y);aoUniforms.pixel.value.set(1/width,1/height);composite.houseAOPixel.value.set(1/aoSize.x,1/aoSize.y);}
 $('renderQuality').onchange=apply;apply();
 return {prepare,occlusion,resize,invalidate,get diagnostics(){return {...state,hdrSupported,depthSupported,screenAOAllowed,aoPolicy:mobile?'mobile-baked-shadows':screenAOAllowed?'highp-screen-depth':'precision-or-extension-fallback',depthTextureAttached:!!sourceTarget.depthTexture,shaderPrecision:renderer.capabilities.precision,aoSize:aoSize.toArray(),samples:aoUniforms.sampleCount.value,probeResolution:mobile?64:128,cachedRooms:[...cache.keys()],materials:registered.size,mode:lastMode,activeAO:options.staticLighting?.active?'Cycles baked AO':state.ao?'screen-depth AO':'compatible shadows',reflection:'Scene-captured linear cubemap + PMREM, room bounds projection; cached on scene changes',pathTracing:false};}};
}
