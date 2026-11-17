export async function startAuth(onReady){
  async function showLogin(message=''){
    const root=document.querySelector('#app');
    root.innerHTML=`<main class="login-page"><form id="login-form" class="login-card"><div class="eyebrow">BOOK READER</div><h1>책틈에 로그인</h1><p>독서 기록을 서버에서 불러옵니다.</p><label for="login-id">아이디</label><input id="login-id" name="username" autocomplete="username" required><label for="login-password">비밀번호</label><input id="login-password" name="password" type="password" autocomplete="current-password" required><p id="login-error" role="alert"></p><button class="primary" type="submit">로그인</button></form></main>`;
    root.querySelector('#login-error').textContent=message;
    root.querySelector('#login-form').onsubmit=async event=>{
      event.preventDefault();
      const form=event.currentTarget,button=form.querySelector('button');
      button.disabled=true;
      try{
        const response=await fetch('/api/login',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({username:form.elements.username.value,password:form.elements.password.value})});
        if(!response.ok){const body=await response.json();throw Error(body.error||'로그인에 실패했습니다.')}
        form.elements.password.value='';
        await onReady();
      }catch(error){root.querySelector('#login-error').textContent=error.message}
      finally{button.disabled=false}
    };
  }
  try{
    const response=await fetch('/api/session',{credentials:'same-origin',cache:'no-store'});
    if(response.ok){await onReady();return showLogin}
  }catch{}
  await showLogin();
  return showLogin;
}
export async function logout(){
  await fetch('/api/logout',{method:'POST',credentials:'same-origin'});
  location.reload();
}
