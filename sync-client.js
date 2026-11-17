import {validate} from './model.js';
import {validateProfiles} from './profiles.js';

const tokenKey='book-reader-sync-token';

export function createSync({readLocal,writeLocal}){
  let token=sessionStorage.getItem(tokenKey)||'';
  let revision=null;
  let busy=false;
  let dirty=false;
  let status='이 브라우저에 저장 중';
  const statusElement=()=>document.querySelector('#sync-status');
  const show=message=>{status=message;if(statusElement())statusElement().textContent=status};
  async function request(method,body){
    const response=await fetch('/api/sync',{method,headers:{authorization:`Bearer ${token}`,...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});
    if(response.status===401)throw Error('연결 코드가 맞지 않습니다.');
    if(response.status===409)throw Error('다른 기기에서 기록이 변경됐습니다. 서버 기록을 확인한 뒤 다시 연결해 주세요.');
    if(!response.ok)throw Error('서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    return response.json();
  }
  function checkPayload(payload){
    validateProfiles(payload.profiles);
    for(const id of ['reader-1','reader-2'])validate(payload.libraries[id]);
    return payload;
  }
  async function connect(ask=true){
    if(ask){
      const entered=prompt('서버 동기화 연결 코드를 입력하세요.',token);
      if(entered===null)return;
      token=entered.trim();
      if(!token){sessionStorage.removeItem(tokenKey);revision=null;show('이 브라우저에 저장 중');return}
    }
    revision=null;
    try{
      show('서버 기록 확인 중…');
      const remote=await request('GET');
      if(!Number.isSafeInteger(remote.revision)||remote.revision<0)throw Error('서버 기록을 확인할 수 없습니다.');
      if(remote.payload){
        const payload=checkPayload(remote.payload);
        const local=readLocal();
        if(JSON.stringify(local)!==JSON.stringify(payload)){
          if(confirm('서버에 독서 기록이 있습니다. 이 브라우저의 기록을 서버 기록으로 교체할까요? 필요한 기록을 먼저 백업해 주세요.')){
            writeLocal(payload);
          }else if(confirm('이 브라우저의 기록을 서버에 올려 서버 기록을 교체할까요? 다른 기기의 변경 사항은 사라집니다.')){
            const saved=await request('PUT',{revision:remote.revision,payload:local});
            revision=saved.revision;
          }else{
            revision=null;show('연결 취소됨 · 이 브라우저에 저장 중');return;
          }
        }
        if(revision===null)revision=remote.revision;
      }else{
        if(!confirm('서버에 아직 기록이 없습니다. 이 브라우저의 두 사람 기록을 서버에 올릴까요?')){
          revision=null;show('연결 취소됨 · 이 브라우저에 저장 중');return;
        }
        const saved=await request('PUT',{revision:0,payload:readLocal()});
        revision=saved.revision;
      }
      sessionStorage.setItem(tokenKey,token);
      show('서버 동기화 연결됨');
    }catch(error){revision=null;show(error.message)}
  }
  async function flush(){
    if(busy||revision===null)return;
    busy=true;
    try{
      while(dirty&&revision!==null){
        dirty=false;
        show('서버에 저장 중…');
        const saved=await request('PUT',{revision,payload:readLocal()});
        revision=saved.revision;
      }
      show('서버에 저장됨');
    }catch(error){revision=null;show(`동기화 중단 · ${error.message}`)}
    finally{busy=false}
  }
  async function refreshRemote(){
    if(revision===null||busy||dirty||document.visibilityState!=='visible')return;
    try{
      const remote=await request('GET');
      if(remote.revision===revision)return;
      const payload=checkPayload(remote.payload);
      if(JSON.stringify(readLocal())!==JSON.stringify(payload))writeLocal(payload);
      revision=remote.revision;
      show('서버의 최신 기록을 가져왔습니다');
    }catch(error){revision=null;show(`동기화 중단 · ${error.message}`)}
  }
  document.addEventListener('visibilitychange',refreshRemote);
  return {
    connect,
    changed(){if(revision!==null){dirty=true;flush()}},
    refresh(){show(status)},
    restore(){if(token)connect(false)}
  };
}
