import {dateKey,monthDays,scheduled,validate,movePlan,resizePlan,planLength,finishBooks} from './model.js';
import {seedCatalog,availableBooks,assignBook} from './catalog.js';
import {calendarEntries,readBookCount} from './shared-calendar.js';
import {PROFILE_KEY,defaultProfiles,libraryKey,validateProfiles} from './profiles.js';
import {createSync} from './sync-client.js';
import {startAuth,logout} from './auth-client.js';
try{
  for(const id of ['reader-1','reader-2'])localStorage.removeItem(libraryKey(id));
  localStorage.removeItem(PROFILE_KEY);
}catch{}
let profiles=defaultProfiles();
const activeName=()=>profiles.profiles.find(p=>p.id===profiles.activeId).name;
const today=dateKey(new Date()),labels={reading:'읽는 중',want:'읽을 책',done:'다 읽은 책'};
let suppressCalendarClickUntil=0;
const bookData={'reader-1':seedCatalog({version:1,books:[]}),'reader-2':seedCatalog({version:1,books:[]})};
let data=bookData[profiles.activeId],view=new Date(),selected=today,filter='want',page='calendar',query='',storageError=false;
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(s){$('#toast').textContent=s;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),3200)}
function save(next){if(!sync.isConnected()){toast('서버 동기화 연결 후 기록을 저장할 수 있어요.');return false}bookData[profiles.activeId]=next;data=next;render();sync.changed();return true}
function update(books){return save({...data,books})}
const sync=createSync({
  onUnauthorized(){location.reload()},
  readLocal(){
    return {profiles:{...profiles,activeId:'reader-1'},libraries:{'reader-1':bookData['reader-1'],'reader-2':bookData['reader-2']}};
  },
  writeLocal(payload){
    const activeId=profiles.activeId;
    for(const id of ['reader-1','reader-2'])bookData[id]=payload.libraries[id];
    profiles={...payload.profiles,activeId};
    data=payload.libraries[activeId];storageError=false;render();
  }
});
function libraries(){return profiles.profiles.map(p=>({ownerId:p.id,ownerName:p.name,books:bookData[p.id].books}))}
function cover(b){return `<div class="cover color-${b.color}"><span class="cover-line"></span><strong>${esc(b.title)}</strong><small>${esc(b.author||'나의 책')}</small><span class="cover-mark">책틈</span></div>`}
function card(b){const p=Math.round(b.current/b.pages*100);return `<article class="book-card"><button class="cover-button" data-edit="${esc(b.id)}" aria-label="${esc(b.title)} 수정">${cover(b)}</button><div class="book-info"><span class="status color-${b.color}">${labels[b.status]}</span><button class="book-title" data-edit="${esc(b.id)}">${esc(b.title)}</button><p class="muted">${esc(b.author||'저자 미입력')}</p><div class="progress"><i style="width:${p}%"></i></div><div class="progress-label"><span>${b.pagesUnknown?'페이지 미설정':`${b.current} / ${b.pages}p`}</span><b>${b.pagesUnknown?'':p+'%'}</b></div><button class="check ${b.logs.includes(today)?'checked':''}" data-check="${esc(b.id)}" data-day="${today}">${b.logs.includes(today)?'✓ 오늘 읽었어요':'＋ 오늘 읽기 체크'}</button>${b.status==='want'?`<button class="check" data-start="${esc(b.id)}">▶ 읽기 시작</button>`:''}<button class="check ${b.status==='done'?'checked':''}" data-finish="${esc(b.id)}">${b.status==='done'?'✓ 완독 · 취소':'완독 체크'}</button><button class="note-button" data-edit="${esc(b.id)}">${[b.observed,b.learned,b.applied].some(v=>v?.trim())?'✎ 본깨적 보기 · 수정':'✎ 본깨적 남기기'}</button></div></article>`}
function render(){const books=data.books,summaryBooks=page==='calendar'?libraries().flatMap(person=>person.books):books,reading=summaryBooks.filter(b=>b.status==='reading'),done=summaryBooks.filter(b=>b.status==='done');$('#app').innerHTML=`<aside class="sidebar"><a class="brand" href="/">▥ <span>책틈<small>일상 사이, 책 한 장</small></span></a><div class="nav-label">나의 독서 공간</div><nav><button data-page="calendar" class="${page==='calendar'?'active':''}"><span>▦</span> 독서 달력</button><button data-page="library" class="${page==='library'?'active':''}"><span>▤</span> 나의 책장 <em>${books.length}</em></button></nav><div class="sidebar-bottom"><div class="quote">서두르지 않아도 괜찮아요.<br>한 장씩, 나의 속도로.</div><button id="logout" class="secondary">로그아웃</button><p id="sync-status" role="status">서버 연결 필요</p><button id="export">↓ 기록 백업</button><button id="import">↑ 기록 복원</button><p>서버에 저장됩니다.<br>로그인하면 자동으로 동기화됩니다.</p></div></aside><main><header><div class="breadcrumb">나의 독서 공간 <span>/</span> ${page==='calendar'?'독서 달력':'나의 책장'}</div><div class="profile-switch"><label for="reader-select">기록하는 사람</label><select id="reader-select">${profiles.profiles.map(p=>`<option value="${p.id}" ${p.id===profiles.activeId?'selected':''}>${esc(p.name)}</option>`).join('')}</select><button id="profile-settings" class="secondary">이름 설정</button></div></header>${storageError?'<div class="warning">기존 저장 기록을 읽을 수 없어요. 원본 보호를 위해 새 저장을 막았습니다. 백업 파일로 복원하거나 브라우저 저장 설정을 확인해 주세요.</div>':''}<section class="intro"><div><div class="eyebrow">YOUR READING JOURNEY</div><h1>${page==='calendar'?'책과 함께하는, 나의 하루':'차곡차곡, 나의 책장'}</h1><p class="muted">${page==='calendar'?'두 사람의 독서 계획을 한눈에. 기록은 각자의 책장에 남아요.':'읽고 있는 이야기와 앞으로 만날 이야기들.'}</p></div><button class="primary" id="add">＋ 책 추가하기</button></section><section class="stats"><div><span class="stat-icon">▥</span><p>${page==='calendar'?'두 사람이 읽고 있는 책':esc(activeName())+' · 읽고 있는 책'}<strong>${reading.length}<small>권</small></strong></p></div><div><span class="stat-icon">✓</span><p>${page==='calendar'?'두 사람이 다 읽은 책':esc(activeName())+' · 다 읽은 책'}<strong>${done.length}<small>권</small></strong></p></div>${libraries().map(person=>`<div class="reader-days"><span class="stat-icon owner-${person.ownerId}" aria-hidden="true">▦</span><p><span class="reader-stat-name owner-label owner-${person.ownerId}">${esc(person.ownerName)}</span>${view.getMonth()+1}월 읽은 책<strong>${readBookCount(person.books,dateKey(view).slice(0,7))}<small>권</small></strong></p></div>`).join('')}<div class="stat-message">조금씩 읽는 오늘이<br><b>더 넓은 내일을 만들어요.</b><span>✳</span></div></section>${page==='calendar'?calendar():''}<section class="shelf"><div class="section-heading"><div><span class="eyebrow">MY BOOKSHELF</span><h2>나의 책장 <span>${books.length}</span></h2></div><input id="search" aria-label="책 제목 또는 저자 검색" placeholder="⌕  제목 또는 저자 검색" value="${esc(query)}"></div><div class="tabs">${Object.entries(labels).map(([k,v])=>`<button class="${filter===k?'active':''}" data-filter="${k}">${v} <span>${books.filter(b=>b.status===k).length}</span></button>`).join('')}</div><div class="books">${books.filter(b=>b.status===filter&&`${b.title} ${b.author}`.toLowerCase().includes(query.toLowerCase())).map(card).join('')||`<div class="empty"><span>▤</span><h3>${query?'검색 결과가 없어요':'새로운 이야기를 기다리고 있어요'}</h3><p>${query?'다른 제목이나 저자로 찾아보세요.':'책을 추가하고 나만의 독서 여정을 시작해 보세요.'}</p>${query?'':'<button class="secondary" id="empty-add">＋ 첫 책 추가하기</button>'}</div>`}</div></section><footer>책틈 · 한 장씩 쌓이는 나의 시간</footer></main>`;bind();sync.refresh()}
function calendar(){const year=view.getFullYear(),month=view.getMonth(),people=libraries(),items=calendarEntries(people,selected);return `<section class="calendar-layout"><div class="calendar panel"><div class="calendar-heading"><h2>${year}년 <strong>${month+1}월</strong></h2><div class="calendar-controls"><button id="today" class="secondary">오늘</button><button class="icon" id="prev" aria-label="이전 달">‹</button><button class="icon" id="next" aria-label="다음 달">›</button></div></div><div class="weekdays">${['일','월','화','수','목','금','토'].map(d=>`<span>${d}</span>`).join('')}</div><div class="calendar-grid">${monthDays(year,month).map(day=>{const relevant=calendarEntries(people,day);return `<button data-date="${day}" class="day ${day.slice(0,7)!==dateKey(view).slice(0,7)?'outside':''} ${day===selected?'selected':''}" aria-label="${day}, ${relevant.length}권" aria-pressed="${day===selected}"><span class="day-number ${day===today?'today':''}">${Number(day.slice(-2))}</span>${relevant.map(({book:b,ownerId,ownerName,planned})=>`<span class="calendar-book owner-${ownerId} book-state-${b.status}" draggable="false" ${planned||!b.start?`data-drag-book="${esc(b.id)}" data-drag-owner="${ownerId}" data-from-day="${day}"`:""} title="${esc(ownerName)} · ${esc(b.title)}${planned||!b.start?' · 드래그해서 날짜 이동':''}"><b>${esc(ownerName)}</b> ${esc(b.title)} <span class="calendar-status state-${b.status}">${labels[b.status]}</span>${b.logs.includes(day)?'<span class="day-read-mark">✓ 이날 읽기 기록</span>':''}</span>`).join('')}</button>`}).join('')}</div><div class="calendar-legend"><span class="owner-label owner-reader-1">● ${esc(profiles.profiles[0].name)}</span><span class="owner-label owner-reader-2">● ${esc(profiles.profiles[1].name)}</span><span>✓ 이날 읽기 기록 · 완독과 별개</span><span>계획이 없는 읽는 중 책은 오늘에 표시돼요</span><span>책을 끌어 날짜를 옮겨보세요</span></div></div><aside class="day-panel panel"><span class="eyebrow">ONE PAGE AT A TIME</span><h2>${Number(selected.slice(5,7))}월 ${Number(selected.slice(8))}일 <small>${['일','월','화','수','목','금','토'][new Date(selected+'T12:00:00').getDay()]}요일</small></h2><p class="muted small">${selected===today?'오늘도 책과 가까워지는 시간.':'이날의 계획과 독서 기록이에요.'}</p><div class="day-list">${items.map(({book:b,ownerId,ownerName})=>`<div class="day-book owner-${ownerId}"><span class="book-dot color-${b.color}"></span><div><strong class="owner-label owner-${ownerId}">${esc(ownerName)}</strong><button class="day-book-title" data-note-book="${esc(b.id)}" data-note-owner="${ownerId}" aria-label="${esc(ownerName)}의 ${esc(b.title)} 본깨적 보기">${esc(b.title)}</button><span class="reading-state state-${b.status}">${labels[b.status]}</span>${b.start?`${ownerId===profiles.activeId?`<button type="button" class="plan-cancel" data-unplan="${esc(b.id)}" title="${b.start}부터 ${b.end}까지 독서 계획 취소">독서 계획 취소</button>`:`<p class="plan-help">계획을 바꾸려면 상단에서 ${esc(ownerName)}님을 선택하세요.</p>`}`:'<p class="plan-help">등록된 독서 계획 없음</p>'}${ownerId===profiles.activeId?`${b.status==='want'?`<button class="note-button" data-start="${esc(b.id)}">▶ 읽기 시작</button>`:''}<button class="note-button" data-finish="${esc(b.id)}">${b.status==='done'?'✓ 완독 · 취소':'완독 체크'}</button>${b.start?`<div class="duration-row"><span>${b.start} ~ ${b.end} · ${planLength(b)}일</span><button type="button" data-duration="${esc(b.id)}" data-change="-1" ${planLength(b)<=1?'disabled':''} aria-label="${esc(b.title)} 하루 줄이기">−1일</button><button type="button" data-duration="${esc(b.id)}" data-change="1" aria-label="${esc(b.title)} 하루 늘리기">+1일</button></div>`:''}`:''}</div>${ownerId===profiles.activeId?`<button class="tick ${b.logs.includes(selected)?'checked':''}" data-check="${esc(b.id)}" data-day="${selected}" aria-label="${esc(b.title)} ${selected} 읽기 체크" aria-pressed="${b.logs.includes(selected)}">✓</button>`:`<span class="other-check">${b.logs.includes(selected)?'✓ 이날 읽기 기록':'계획'}</span>`}</div>`).join('')||'<div class="day-empty">☷<p>아직 독서 계획이 없어요.<br>이날 읽을 책을 골라볼까요?</p></div>'}</div><button class="secondary full" id="plan-add">＋ 이날 독서 계획하기</button>${data.books.length?`<label class="quick-label">다른 책 읽기 기록<select id="quick-log"><option value="">책을 선택하세요</option>${data.books.filter(b=>!items.some(item=>item.ownerId===profiles.activeId&&item.book.id===b.id)).map(b=>`<option value="${esc(b.id)}">${esc(b.title)}</option>`).join('')}</select></label>`:''}<div class="day-tip">완벽한 계획보다<br>오늘 읽은 한 페이지.</div></aside></section>`}
function bind(){document.querySelectorAll('[data-duration]').forEach(e=>e.onclick=()=>changeDuration(e.dataset.duration,Number(e.dataset.change)));document.querySelectorAll('[data-note-book]').forEach(e=>e.onclick=()=>openNotes(e.dataset.noteOwner,e.dataset.noteBook));$('#reader-select').onchange=e=>switchReader(e.target.value);$('#profile-settings').onclick=editProfiles;bindCalendarDrag();document.querySelectorAll('[data-start]').forEach(e=>e.onclick=()=>startReading(e.dataset.start));document.querySelectorAll('[data-finish]').forEach(e=>e.onclick=()=>finish(e.dataset.finish));document.querySelectorAll('[data-unplan]').forEach(e=>e.onclick=()=>unplan(e.dataset.unplan));$('#add').onclick=()=>edit();$('#empty-add')?.addEventListener('click',()=>edit());document.querySelectorAll('[data-page]').forEach(e=>e.onclick=()=>{page=e.dataset.page;render()});document.querySelectorAll('[data-filter]').forEach(e=>e.onclick=()=>{filter=e.dataset.filter;render()});document.querySelectorAll('[data-edit]').forEach(e=>e.onclick=()=>edit(data.books.find(b=>b.id===e.dataset.edit)));document.querySelectorAll('[data-check]').forEach(e=>e.onclick=()=>check(e.dataset.check,e.dataset.day));document.querySelectorAll('[data-date]').forEach(e=>e.onclick=()=>{if(Date.now()<suppressCalendarClickUntil)return;selected=e.dataset.date;render()});$('#search').oninput=e=>{const pos=e.target.selectionStart;query=e.target.value;render();$('#search').focus();$('#search').setSelectionRange(pos,pos)};for(const [id,delta]of [['prev',-1],['next',1]])$('#'+id)?.addEventListener('click',()=>{view=new Date(view.getFullYear(),view.getMonth()+delta,1);render()});$('#today')?.addEventListener('click',()=>{view=new Date();selected=today;render()});$('#plan-add')?.addEventListener('click',()=>openPicker());$('#quick-log')?.addEventListener('change',e=>{if(e.target.value)check(e.target.value,selected)});$('#export').onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`책틈-${activeName()}-독서기록-${today}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};$('#import').onclick=()=>$('#import-file').click();$('#logout').onclick=logout}
function check(id,day){if(storageError)return toast('기존 기록을 복원한 뒤 다시 시도해 주세요.');if(day>today)return toast('미래 날짜에는 읽기 완료를 체크할 수 없어요.');update(data.books.map(b=>b.id===id?{...b,logs:b.logs.includes(day)?b.logs.filter(d=>d!==day):[...b.logs,day],status:b.status==='want'?'reading':b.status}:b))}
function edit(book,day){const form=$('#book-form');form.reset();$('#form-error').textContent='';$('#modal-title').textContent=`${activeName()} · ${book?'책과 독서 계획 수정':'책장에 책 더하기'}`;for(const [k,v]of Object.entries(book||{id:'',status:day?'reading':filter,pages:'',current:0,color:data.books.length%5,start:day||'',end:day||''}))if(form.elements.namedItem(k))form.elements.namedItem(k).value=v;if(book?.pagesUnknown)form.elements.pages.value='';$('#editor').showModal();form.elements.title.focus()}
$('#close-modal').onclick=()=>$('#editor').close();$('#editor').addEventListener('click',e=>{if(e.target===$('#editor')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}});
$('#book-form').onsubmit=e=>{e.preventDefault();if(storageError)return toast('기존 기록을 복원한 뒤 다시 시도해 주세요.');const fields=Object.fromEntries(new FormData(e.target)),old=data.books.find(b=>b.id===fields.id);const b={...old,...fields,id:fields.id||crypto.randomUUID(),title:fields.title.trim(),author:fields.author.trim(),pages:fields.pages?Number(fields.pages):1,pagesUnknown:!fields.pages,current:fields.pages?Number(fields.current):0,color:Number(fields.color),logs:old?.logs||[]};if(!b.title)return $('#form-error').textContent='책 제목을 입력해 주세요.';if(b.current>b.pages)return $('#form-error').textContent='읽은 페이지는 전체 페이지보다 클 수 없어요.';if(Boolean(b.start)!==Boolean(b.end)||b.start>b.end)return $('#form-error').textContent='시작일과 목표일을 함께 입력하고 날짜 순서를 확인해 주세요.';if(b.status==='done')b.current=b.pages;const next=old?data.books.map(x=>x.id===b.id?b:x):[...data.books,b];try{validate({version:1,books:next});if(update(next)){$('#editor').close();toast('책장에 저장했어요.')}}catch(err){$('#form-error').textContent=err.message}};

$('#import-file').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5000000)throw Error('5MB 이하의 백업 파일을 선택해 주세요.');const next=validate(JSON.parse(await file.text()));if(confirm(`${activeName()}의 책장을 ${next.books.length}권의 기록으로 교체할까요? 다른 사람의 기록은 유지됩니다.`)){if(save(next)){storageError=false;render();toast('독서 기록을 복원했어요.')}}}catch(err){toast(err.message||'백업 파일을 확인해 주세요.')}finally{e.target.value=''}};
startAuth(async()=>{if(!await sync.connect())throw Error('서버 연결에 실패했습니다. 새로고침해 주세요.');render()});

function startReading(id){
  if(!sync.isConnected())return toast('서버에 연결한 뒤 다시 시도해 주세요.');
  const previous=filter;
  filter='reading';
  if(update(data.books.map(b=>b.id===id&&b.status==='want'?{...b,status:'reading'}:b)))toast('읽는 중으로 바꿨어요.');
  else filter=previous;
}
function finish(id){if(storageError)return toast('기존 기록을 복원한 뒤 다시 시도해 주세요.');update(finishBooks(data.books,id,page==='calendar'&&selected<=today?selected:today))}
function unplan(id){if(storageError)return;if(update(data.books.map(b=>b.id===id?{...b,start:'',end:''}:b)))toast('독서 계획을 취소했어요. 읽는 중인 책과 읽기 체크는 달력에 계속 표시될 수 있어요.')}
function changeDuration(id,change){
  if(storageError)return toast('기존 기록을 복원한 뒤 다시 시도해 주세요.');
  try{
    const books=resizePlan(data.books,id,change),book=books.find(item=>item.id===id);
    if(!book||books.every((item,i)=>item===data.books[i]))return;
    validate({...data,books});
    if(update(books))toast(`${book.title} · ${planLength(book)}일 일정으로 변경했어요.`);
  }catch(error){toast(error.message)}
}
function openPicker(){
  let dialog=$('#planner');
  if(!dialog){dialog=document.createElement('dialog');dialog.id='planner';dialog.innerHTML=`<div class="modal-head"><div><span class="eyebrow">MY READING PLAN</span><h2 id="planner-title"></h2></div><button class="icon" id="planner-close" aria-label="닫기">×</button></div><p class="muted small">원하는 책을 누르면 이 날짜에 추가돼요. 다른 날에 배정한 책과 완독한 책은 제외됩니다.</p><div id="planned-books"></div><label class="planner-search">책 목록 검색<input id="plan-search" type="search" placeholder="100권에서 제목 검색" autocomplete="off"></label><p id="plan-count" class="muted small" aria-live="polite"></p><div id="plan-options"></div>`;document.body.append(dialog);$('#planner-close').onclick=()=>dialog.close();$('#plan-search').oninput=renderPicker;}
  $('#planner-title').textContent=`${selected} 독서 계획`;
  $('#plan-search').value='';renderPicker();dialog.showModal();$('#plan-search').focus();
}
function renderPicker(){
  const entries=calendarEntries(libraries(),selected).filter(entry=>entry.planned),available=availableBooks(data.books,$('#plan-search').value);
  $('#planned-books').innerHTML=entries.length?`<h3>이날 읽을 책 · ${entries.length}권</h3>${entries.map(({book:b,ownerId,ownerName})=>`<div class="planned-row"><strong class="owner-label owner-${ownerId}">${esc(ownerName)}</strong><span>${esc(b.title)}</span>${ownerId===profiles.activeId?`<button class="secondary" data-plan-finish="${esc(b.id)}">${b.status==='done'?'✓ 완독 취소':'완독'}</button><button class="secondary" data-plan-remove="${esc(b.id)}" aria-label="${esc(b.title)} 독서 계획 취소">계획 취소</button>`:''}</div>`).join('')}`:'<p class="muted small">이날 배정한 책이 아직 없어요.</p>';
  $('#plan-count').textContent=`추가 가능한 책 ${available.length}권`;
  $('#plan-options').innerHTML=available.map(b=>`<button class="plan-option" data-assign="${esc(b.id)}"><span class="book-dot color-${b.color}"></span><span>${esc(b.title)}</span><span class="muted">＋</span></button>`).join('')||'<p class="empty">검색 결과가 없거나 모든 책이 배정되어 있어요.</p>';
  document.querySelectorAll('[data-assign]').forEach(e=>e.onclick=()=>{if(storageError)return toast('기존 기록을 복원한 뒤 다시 시도해 주세요.');if(update(assignBook(data.books,e.dataset.assign,selected))){renderPicker();toast('이날의 독서 계획에 추가했어요.')}});
  document.querySelectorAll('[data-plan-remove]').forEach(e=>e.onclick=()=>{unplan(e.dataset.planRemove);renderPicker()});
  document.querySelectorAll('[data-plan-finish]').forEach(e=>e.onclick=()=>{finish(e.dataset.planFinish);renderPicker()});
}
function moveCalendarBook(ownerId,id,from,to){
  if(storageError)return toast('기존 기록을 복원한 뒤 다시 시도해 주세요.');
  if(!to||from===to)return;
  if(!sync.isConnected())return toast('서버 동기화 연결 후 기록을 저장할 수 있어요.');
  const library=bookData[ownerId];
  const book=library?.books.find(item=>item.id===id);
  if(!book||(!scheduled(book,from)&&book.start))return;
  try{
    const books=scheduled(book,from)?movePlan(library.books,id,from,to):library.books.map(item=>item.id===id?{...item,start:to,end:to,logs:item.logs.includes(from)?[...new Set([...item.logs.filter(day=>day!==from),to])]:item.logs}:item);
    validate({...library,books});selected=to;
    bookData[ownerId]={...library,books};
    if(ownerId===profiles.activeId)data=bookData[ownerId];
    render();sync.changed();toast('독서 일정을 옮겼어요. 읽기 기록은 원래 날짜에 유지됩니다.');
  }catch(err){toast(err.message)}
}
function bindCalendarDrag(){
  let touch=null;
  const clear=()=>document.querySelectorAll('.drop-target,.dragging').forEach(el=>el.classList.remove('drop-target','dragging'));
  const highlight=target=>{document.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));target?.classList.add('drop-target')};
  document.querySelectorAll('[data-drag-book]').forEach(el=>{
    el.draggable=false;
    el.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse'&&e.button!==0)return;
      touch={id:el.dataset.dragBook,ownerId:el.dataset.dragOwner,from:el.dataset.fromDay,x:e.clientX,y:e.clientY,moved:false};
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove',e=>{
      if(!touch)return;
      if(!touch.moved&&Math.hypot(e.clientX-touch.x,e.clientY-touch.y)<8)return;
      touch.moved=true;
      el.classList.add('dragging');
      highlight(document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-date]'));
    });
    el.addEventListener('pointerup',e=>{
      if(!touch)return;
      const drag=touch;touch=null;
      const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-date]');
      clear();
      if(drag.moved){e.preventDefault();suppressCalendarClickUntil=Date.now()+500;moveCalendarBook(drag.ownerId,drag.id,drag.from,target?.dataset.date)}
    });
    el.addEventListener('pointercancel',()=>{touch=null;clear()});
  });
}
function switchReader(id){
  if(!profiles.profiles.some(p=>p.id===id)||id===profiles.activeId)return;
  profiles={...profiles,activeId:id};data=bookData[id];query='';filter='want';$('#notes-dialog')?.close();render();toast(`${activeName()}의 기록으로 전환했어요.`);
}
function openNotes(ownerId,bookId){
  const owner=libraries().find(person=>person.ownerId===ownerId),book=owner?.books.find(item=>item.id===bookId);
  if(!owner||!book)return toast('책 정보를 찾지 못했어요. 새로고침 후 다시 시도해 주세요.');
  let dialog=$('#notes-dialog');
  if(!dialog){
    dialog=document.createElement('dialog');dialog.id='notes-dialog';
    dialog.innerHTML=`<form id="notes-form"><div class="modal-head"><div><span class="eyebrow">READING NOTES</span><h2 id="notes-title"></h2></div><button type="button" class="icon" id="notes-close" aria-label="닫기">×</button></div><p id="notes-owner" class="note-owner"></p><label>본 것<textarea name="observed" rows="4" maxlength="5000" placeholder="기억하고 싶은 내용이나 문장"></textarea></label><label>깨달은 것<textarea name="learned" rows="4" maxlength="5000" placeholder="읽으면서 새롭게 깨달은 점"></textarea></label><label>적용할 것<textarea name="applied" rows="4" maxlength="5000" placeholder="내 일상에서 실천할 것"></textarea></label><p id="notes-message" class="note-readonly"></p><p id="notes-error" role="alert"></p><div class="modal-actions"><button type="button" class="secondary" id="notes-cancel">닫기</button><button type="submit" class="primary" id="notes-save">본깨적 저장</button></div></form>`;
    document.body.append(dialog);$('#notes-close').onclick=()=>dialog.close();$('#notes-cancel').onclick=()=>dialog.close();
    $('#notes-form').onsubmit=event=>{
      event.preventDefault();const form=event.target,id=form.dataset.bookId,ownerId=form.dataset.ownerId;
      if(ownerId!==profiles.activeId)return toast('이름을 전환한 뒤 자신의 기록을 수정해 주세요.');
      if(storageError)return toast('기존 기록을 복원한 뒤 다시 시도해 주세요.');
      const current=data.books.find(item=>item.id===id);if(!current)return toast('책 정보를 찾지 못했어요.');
      const notes={observed:form.elements.observed.value,learned:form.elements.learned.value,applied:form.elements.applied.value};
      const books=data.books.map(item=>item.id===id?{...item,...notes}:item);
      try{validate({...data,books});if(update(books)){dialog.close();toast('본깨적을 저장했어요.')}}catch(error){$('#notes-error').textContent=error.message}
    };
  }
  const form=$('#notes-form'),canEdit=ownerId===profiles.activeId;
  form.dataset.ownerId=ownerId;form.dataset.bookId=bookId;
  $('#notes-title').textContent=book.title;$('#notes-owner').textContent=`${owner.ownerName}의 책 · 본깨적`;
  $('#notes-message').textContent=canEdit?'본 것·깨달은 것·적용할 것을 자유롭게 적어 보세요.':'다른 사람의 기록이에요. 수정하려면 상단에서 그 사람을 선택해 주세요.';
  $('#notes-error').textContent='';
  for(const key of ['observed','learned','applied']){form.elements[key].value=book[key]||'';form.elements[key].disabled=!canEdit}
  $('#notes-save').hidden=!canEdit;dialog.showModal();if(canEdit)form.elements.observed.focus();
}
function editProfiles(){
  let dialog=$('#profiles-dialog');
  if(!dialog){dialog=document.createElement('dialog');dialog.id='profiles-dialog';dialog.innerHTML=`<form id="profiles-form" class="profile-form"><div class="modal-head"><h2>함께 읽는 두 사람</h2><button type="button" class="icon" id="profiles-close" aria-label="닫기">×</button></div><p class="profile-help">이름을 선택하면 책장·완독·본깨적은 각자 기록되고 달력에는 함께 보여요. 두 사람의 기록은 서버에 저장되며 같은 계정으로 로그인한 기기에서 함께 볼 수 있어요.</p><label>첫 번째 사람<input name="first" required maxlength="24" autocomplete="off"></label><label>두 번째 사람<input name="second" required maxlength="24" autocomplete="off"></label><p id="profile-error" role="alert"></p><button class="primary" type="submit">이름 저장</button></form>`;document.body.append(dialog);$('#profiles-close').onclick=()=>dialog.close();$('#profiles-form').onsubmit=e=>{
      e.preventDefault();const form=e.target,first=form.elements.first.value.trim(),second=form.elements.second.value.trim();if(!first||!second||first===second){$('#profile-error').textContent='서로 구분할 수 있는 이름을 입력해 주세요.';return}
      try{const next={...profiles,profiles:[{id:'reader-1',name:first},{id:'reader-2',name:second}]};validateProfiles(next);if(!sync.isConnected())throw Error('서버 동기화 연결 후 이름을 저장해 주세요.');profiles=next;dialog.close();render();sync.changed();toast('두 사람의 이름을 저장했어요.')}catch(error){$('#profile-error').textContent=error.message}
    };}
  $('#profiles-form').elements.first.value=profiles.profiles[0].name;$('#profiles-form').elements.second.value=profiles.profiles[1].name;$('#profile-error').textContent='';dialog.showModal();$('#profiles-form').elements.first.focus();
}
