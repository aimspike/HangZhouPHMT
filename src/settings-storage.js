// Optional account sync uses Supabase HTTPS REST; the offline HTML has no SDK dependency.
function createHouseSettingsStorage(options){
 const $=id=>document.getElementById(id),prefix='house89a.settings.v1.',defaults=options.read(),preview=!!options.preview;
 let applying=false,record=null,session=null,config=null,account='guest',timer=null,cloudTimer=null,busy=false,conflict=null,ready=false,localAvailable=true,epoch=0;
 const copy=v=>JSON.parse(JSON.stringify(v)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 function readLocal(key){try{return JSON.parse(localStorage.getItem(prefix+key)||'null');}catch{return null;}}
 function writeLocal(key,value){if(preview)return true;try{localStorage.setItem(prefix+key,JSON.stringify(value));return true;}catch{localAvailable=false;return false;}}
 function removeLocal(key){if(preview)return;try{localStorage.removeItem(prefix+key);}catch{}}
 function keyFor(){return account==='guest'?'guest':config.url+'|'+account;}
 function status(text,error=false){$('cloudStatus').textContent=text;$('cloudStatus').classList.toggle('cloud-warning',error);}
 function localStatus(){$('localSaveStatus').textContent=preview?'检测模式：临时调整不会保存。':localAvailable?'设置已自动保存在此浏览器。':'此浏览器无法持久保存，请导出设置备份。';}
 function persist(){writeLocal(keyFor(),record);localStatus();}
 function restore(payload){applying=true;try{options.restore(copy(payload));}finally{applying=false;}}
 function validPayload(payload){return payload&&payload.schema===1&&payload.finishes&&typeof payload.finishes==='object'&&Array.isArray(payload.doors)&&payload.controls&&typeof payload.controls==='object'&&JSON.stringify(payload).length<64000;}
 function loadRecord(key,fallback){const r=readLocal(key);return r&&validPayload(r.payload)&&Number.isSafeInteger(r.revision)&&r.revision>=0?{...r,pending:!!r.pending}:{payload:copy(fallback),pending:false,revision:0};}
 function save(){if(preview||applying||!ready)return;const payload=options.read();if(same(payload,record.payload))return;record.payload=payload;record.pending=true;record.savedAt=new Date().toISOString();persist();clearTimeout(cloudTimer);if(session)cloudTimer=setTimeout(()=>sync(),900);}
 function schedule(){if(applying)return;clearTimeout(timer);timer=setTimeout(save,150);}
 function validateConfig(candidate){
  if(!candidate?.url||!candidate?.publishableKey)return null;
  const url=new URL(candidate.url);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||!['','/'].includes(url.pathname))throw Error('项目地址应为不带路径的 HTTPS URL。');
  const key=String(candidate.publishableKey).trim();let allowed=/^sb_publishable_[A-Za-z0-9_-]+$/.test(key);
  if(!allowed){try{const body=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));allowed=body.role==='anon';}catch{}}
  if(!allowed)throw Error('仅接受公开 publishable / anon key，不能使用服务端密钥。');
  return {url:url.origin,publishableKey:key};
 }
 function setSession(data){session=data?{access_token:data.access_token,refresh_token:data.refresh_token,expires_at:data.expires_at||Math.floor(Date.now()/1000)+(data.expires_in||3600),user:{id:data.user.id,email:data.user.email||''},project:config.url}:null;if(session)writeLocal('session',session);else removeLocal('session');}
 async function request(path,{method='GET',body,auth=true,retry=true}={}){
  if(preview)throw Error('检测模式不连接云服务。');
  if(!navigator.onLine)throw Error('当前离线，设置已保存在本机，联网后会重试。');
  if(auth&&session&&session.expires_at<Date.now()/1000+60)await refresh();
  const controller=new AbortController(),abort=setTimeout(()=>controller.abort(),12000);
  try{
   const headers={apikey:config.publishableKey,'Content-Type':'application/json'};if(auth&&session)headers.Authorization='Bearer '+session.access_token;
   const response=await fetch(config.url+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal,cache:'no-store'});
   const text=await response.text();let data=null;try{data=text?JSON.parse(text):null;}catch{}
   if(response.status===401&&auth&&retry&&session){await refresh();return request(path,{method,body,auth,retry:false});}
   if(!response.ok){if(data?.message==='settings_conflict')throw Object.assign(Error('settings_conflict'),{conflict:true});throw Error(response.status===429?'请求过于频繁，请稍后重试。':response.status===401?'登录已过期，请重新登录。':response.status===404?'未找到云端配置表，请先执行部署 SQL。':data?.error_description||data?.msg||data?.message||'云服务请求失败，请检查连接和部署。');}
   return data;
  }catch(error){if(error.name==='AbortError')throw Error('云服务连接超时，本机设置已保留。');throw error;}finally{clearTimeout(abort);}
 }
 async function refresh(){const old=session;if(!old)throw Error('请先登录。');try{const data=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:old.refresh_token},auth:false});if(session===old)setSession(data);}catch(error){if(session===old&&/expired|invalid|过期|refresh_token/i.test(error.message)){setSession(null);renderAccount();}throw error;}}
 function renderAccount(){const connected=!!config;$('cloudAuth').hidden=!connected||!!session;$('cloudAccount').hidden=!session;$('cloudIdentity').textContent=session?'已登录：'+session.user.email:'';$('cloudProjectUrl').value=config?.url||'';$('cloudPublicKey').value=config?.publishableKey||'';if(!connected)status('云同步尚未连接。创建项目后填写公开连接信息即可启用。');else if(!session)status('云服务已连接，登录后自动同步个人设置。');}
 function showConflict(remote){conflict=remote;$('cloudConflict').hidden=false;$('cloudConflict').open=true;status('发现不同版本，请选择保留云端或本机设置。',true);}
 async function readRemote(){const rows=await request('/rest/v1/viewer_settings?select=payload,revision,updated_at&user_id=eq.'+encodeURIComponent(session.user.id));const row=rows?.[0];if(row&&!validPayload(row.payload))throw Error('云端设置格式不兼容，本机设置已保留。');return row||null;}
 function acceptRemote(remote){restore(remote.payload);record={payload:options.read(),pending:false,revision:Number(remote.revision),savedAt:remote.updated_at};persist();conflict=null;$('cloudConflict').hidden=true;status('已从云端恢复设置，后续修改会自动同步。');}
 async function upload(activeEpoch){
  const payload=copy(record.payload),result=await request('/rest/v1/rpc/save_viewer_settings',{method:'POST',body:{p_payload:payload,p_expected_revision:record.revision}}),row=Array.isArray(result)?result[0]:result;
  if(activeEpoch!==epoch)return;
  if(!row||!Number.isSafeInteger(Number(row.revision)))throw Error('云端保存结果无效，本机设置已保留。');
  record.revision=Number(row.revision);record.pending=!same(record.payload,payload);persist();status(record.pending?'最新修改等待同步…':'已同步到云端 · '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}));
 }
 async function sync(){
  save();if(!session||busy||conflict||!navigator.onLine)return;
  busy=true;const activeEpoch=epoch;try{const remote=await readRemote();if(!session||activeEpoch!==epoch)return;save();if(remote){if(Number(remote.revision)!==record.revision){if(record.pending&&!same(record.payload,remote.payload)){showConflict(remote);return;}acceptRemote(remote);return;}if(!record.pending){status('云端设置已是最新。');return;}}else record.revision=0;
   await upload(activeEpoch);
  }catch(error){if(activeEpoch!==epoch)return;if(error.conflict){try{const remote=await readRemote();if(remote&&activeEpoch===epoch)showConflict(remote);}catch{status('云端版本发生变化，请稍后重试。',true);}}else status(error.message,true);}finally{busy=false;if(session&&record.pending&&!conflict)clearTimeout(cloudTimer),cloudTimer=setTimeout(()=>sync(),15000);}
 }
 async function activate(data){
  const fallback=account==='guest'?record.payload:defaults;epoch++;setSession(data);account=session.user.id;record=loadRecord(keyFor(),fallback);restore(record.payload);renderAccount();status('正在读取账号设置…');await sync();
 }
 function signOut(){save();const token=session?.access_token,oldConfig=config;epoch++;setSession(null);account='guest';record=loadRecord('guest',defaults);restore(record.payload);conflict=null;$('cloudConflict').hidden=true;renderAccount();if(token&&navigator.onLine)fetch(oldConfig.url+'/auth/v1/logout?scope=local',{method:'POST',headers:{apikey:oldConfig.publishableKey,Authorization:'Bearer '+token}}).catch(()=>{});}
 // Track settings only, never login fields, exported tokens or camera movement.
 for(const event of ['input','change'])document.addEventListener(event,e=>{if(e.target.closest('#sidebar')&&!e.target.closest('#settingsStorage'))schedule();});
 document.addEventListener('click',e=>{if(e.target.closest('[data-time], [data-door], #openAllDoors, #closeAllDoors, #resetFinishes'))schedule();});
 $('exportSettings').onclick=()=>{save();const blob=new Blob([JSON.stringify(record.payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='89-A-settings.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);};
 $('importSettings').onclick=()=>$('settingsFile').click();
 $('settingsFile').onchange=async e=>{const file=e.target.files[0];try{if(!file)return;if(file.size>64000)throw Error('设置文件过大。');const payload=JSON.parse(await file.text());if(!validPayload(payload))throw Error('设置文件格式无效。');restore(payload);save();$('localSaveStatus').textContent='已导入设置并保存在此浏览器。';}catch(error){$('localSaveStatus').textContent=error.message;}finally{e.target.value='';}};
 $('cloudConnect').onclick=()=>{if(preview){status('检测模式不连接云服务。');return;}try{const next=validateConfig({url:$('cloudProjectUrl').value.trim(),publishableKey:$('cloudPublicKey').value.trim()});if(!next)throw Error('请填写项目地址和公开连接密钥。');if(session)signOut();epoch++;config=next;writeLocal('config',config);renderAccount();}catch(error){status(error.message,true);}};
 $('cloudSendCode').onclick=async()=>{const email=$('cloudEmail').value.trim();if(!$('cloudEmail').checkValidity()||!email){status('请填写有效邮箱。',true);return;}const b=$('cloudSendCode');b.disabled=true;try{await request('/auth/v1/otp',{method:'POST',body:{email,create_user:true},auth:false});status('验证码已发送，请检查邮箱；有效期以邮件说明为准。');}catch(error){status(error.message,true);}finally{b.disabled=false;}};
 $('cloudVerify').onclick=async()=>{const email=$('cloudEmail').value.trim(),token=$('cloudCode').value.trim();if(!email||!/^\d{6,10}$/.test(token)){status('请填写邮箱及邮件中的验证码。',true);return;}const b=$('cloudVerify');b.disabled=true;try{const data=await request('/auth/v1/verify',{method:'POST',body:{email,token,type:'email'},auth:false});$('cloudCode').value='';await activate(data);}catch(error){status(error.message,true);}finally{b.disabled=false;}};
 $('cloudSyncNow').onclick=()=>sync();$('cloudSignOut').onclick=signOut;
 $('cloudUseRemote').onclick=()=>{if(conflict)acceptRemote(conflict);};
 $('cloudUseLocal').onclick=()=>{if(!conflict)return;record.revision=Number(conflict.revision);record.pending=true;conflict=null;$('cloudConflict').hidden=true;persist();sync();};
 window.addEventListener('online',()=>sync());window.addEventListener('pagehide',()=>{clearTimeout(timer);save();});window.addEventListener('focus',()=>sync());
 window.addEventListener('storage',e=>{try{if(e.key===prefix+keyFor()&&e.newValue){const incoming=JSON.parse(e.newValue);if(validPayload(incoming?.payload)&&!record.pending){record=incoming;restore(record.payload);}}}catch{}});
 setInterval(()=>{if(!document.hidden)sync();},60000);
 try{if(!preview)config=validateConfig(window.HOUSE_CLOUD_CONFIG)||validateConfig(readLocal('config'));}catch{status('云服务连接信息无效，请重新填写。',true);}
 record=loadRecord('guest',defaults);restore(record.payload);const cached=readLocal('session');
 if(config&&cached?.project===config.url&&cached.user?.id&&cached.refresh_token&&cached.access_token){session=cached;account=session.user.id;record=loadRecord(keyFor(),defaults);restore(record.payload);}
 ready=true;persist();renderAccount();if(session)sync();
 return {get diagnostics(){return {preview,localAvailable,cloudConfigured:!!config,signedIn:!!session,pending:!!record.pending,revision:record.revision,conflict:!!conflict};}};
}
