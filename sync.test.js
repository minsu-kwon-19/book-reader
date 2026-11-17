import test from 'node:test';
import assert from 'node:assert/strict';
import handler from './api/sync.js';
import {defaultProfiles} from './profiles.js';

test('sync API requires a key and rejects stale writes without replacing data',async()=>{
  const originalFetch=globalThis.fetch;
  const originalKey=process.env.BOOK_READER_SYNC_KEY;
  const originalUrl=process.env.KV_REST_API_URL;
  const originalToken=process.env.KV_REST_API_TOKEN;
  let stored=null;
  process.env.BOOK_READER_SYNC_KEY='test-secret';
  process.env.KV_REST_API_URL='https://redis.example.test';
  process.env.KV_REST_API_TOKEN='test-redis-token';
  globalThis.fetch=async(_url,options)=>{
    const [command,...args]=JSON.parse(options.body);
    let result;
    if(command==='GET')result=stored;
    else if(command==='EVAL'){
      const expected=Number(args[3]),next=args[4];
      result=(stored?JSON.parse(stored).revision:0)===expected?1:0;
      if(result)stored=next;
    }
    return {ok:true,json:async()=>({result})};
  };
  async function call(method,body,secret='test-secret'){
    const req={method,headers:{authorization:`Bearer ${secret}`},body};
    const res={code:200,setHeader(){},status(code){this.code=code;return this},json(value){this.value=value;return this}};
    await handler(req,res);
    return res;
  }
  try{
    assert.equal((await call('GET',null,'wrong')).code,401);
    assert.deepEqual((await call('GET')).value,{revision:0,payload:null});
    const payload={profiles:defaultProfiles(),libraries:{'reader-1':{version:1,books:[]},'reader-2':{version:1,books:[]}}};
    assert.equal((await call('PUT',{revision:0,payload})).value.revision,1);
    assert.equal((await call('PUT',{revision:0,payload})).code,409);
    assert.equal((await call('GET')).value.revision,1);
  }finally{
    globalThis.fetch=originalFetch;
    for(const [name,value] of Object.entries({BOOK_READER_SYNC_KEY:originalKey,KV_REST_API_URL:originalUrl,KV_REST_API_TOKEN:originalToken})){
      if(value===undefined)delete process.env[name];else process.env[name]=value;
    }
  }
});
