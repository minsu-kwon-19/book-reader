import {validate} from './model.js';
import {validateProfiles} from './profiles.js';

export function createSync({readLocal,writeLocal,onUnauthorized}){
  let revision=null,busy=false,dirty=false,unsaved=false;
  let status='서버 연결 중…';
  const show=message=>{status=message;const el=document.querySelector('#sync-status');if(el)el.textContent=message};
  async function request(method,body){
    const response=await fetch('/api/sync',{method,credentials:'same-origin',headers:body?{'content-type':'application/json'}:{},body:body?JSON.stringify(body):undefined,cache:'no-store'});
    if(response.status===401){onUnauthorized();throw Error('다시 로그인해 주세요.')}
    if(response.status===409)throw Error('다른 기기에서 기록이 변경됐습니다. 새로고침해 주세요.');
    if(!response.ok)throw Error('서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    return response.json();
  }
  function checkPayload(payload){
    validateProfiles(payload.profiles);
    for(const id of ['reader-1','reader-2'])validate(payload.libraries[id]);
    return payload;
  }
  async function connect(){
    revision=null;
    try{
      show('서버 기록 불러오는 중…');
      const remote=await request('GET');
      if(!Number.isSafeInteger(remote.revision)||remote.revision<0)throw Error('서버 기록을 확인할 수 없습니다.');
      if(remote.payload){
        const payload=checkPayload(remote.payload);
        if(unsaved&&JSON.stringify(readLocal())!==JSON.stringify(payload)&&!confirm('서버에 저장되지 않은 변경 사항이 있습니다. 서버 기록으로 다시 불러올까요?'))return false;
        writeLocal(payload);revision=remote.revision;unsaved=false;
      }else{
        const saved=await request('PUT',{revision:0,payload:readLocal()});
        revision=saved.revision;
      }
      show('서버와 동기화됨');return true;
    }catch(error){revision=null;show(error.message);return false}
  }
  async function flush(){
    if(busy||revision===null)return;
    busy=true;
    try{
      while(dirty){
        dirty=false;show('서버에 저장 중…');
        const saved=await request('PUT',{revision,payload:readLocal()});
        revision=saved.revision;
      }
      unsaved=false;show('서버에 저장됨');
    }catch(error){revision=null;unsaved=true;show(`동기화 중단 · ${error.message}`)}
    finally{busy=false}
  }
  async function refreshRemote(){
    if(revision===null||busy||dirty||document.visibilityState==='hidden')return;
    try{
      const remote=await request('GET');
      if(remote.revision===revision)return;
      const payload=checkPayload(remote.payload);
      writeLocal(payload);revision=remote.revision;show('최신 기록으로 동기화됨');
    }catch(error){revision=null;show(`동기화 중단 · ${error.message}`)}
  }
  document.addEventListener('visibilitychange',refreshRemote);
  setInterval(refreshRemote,15000);
  return {connect,isConnected(){return revision!==null},changed(){if(revision!==null){dirty=true;unsaved=true;flush()}},refresh(){show(status)}};
}
