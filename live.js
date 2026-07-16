/* ============================================================
   Partea "live" a paginii: vibe check (poze), anunțuri, feedback.
   Complet decuplată de program: dacă Supabase nu răspunde, totul
   de aici se ascunde singur și programul merge normal, offline.

   Principiul vibe check: pozele trăiesc într-UN singur loc, tabul
   „vibe” din rail (vizibil doar în zilele festivalului). Suprafața
   programului rămâne neatinsă: fără camere, contoare sau galerii
   pe carduri. Un singur FAB pe ecran: „acum” pe program, camera
   pe vibe.
   ============================================================ */
(function(){
'use strict';

const SUPA_URL='https://waqyaewaldphstmiobjj.supabase.co';
const SUPA_KEY='sb_publishable_XtarsOK52eqlRUmv1ElS4Q_RwrDK78G'; /* cheia publică */
const BUCKET='jurnal-21';
const ANUNT_TTL_H=12; /* câte ore stă un anunț în banner */
const PAGE=30;        /* poze pe pagină în feed */

const sb=(path,opt={})=>fetch(SUPA_URL+path,Object.assign({},opt,{
  headers:Object.assign({apikey:SUPA_KEY,Authorization:'Bearer '+SUPA_KEY},opt.headers||{})
}));
const sbGet=async p=>{const r=await sb('/rest/v1'+p);if(!r.ok)throw new Error('sb');return r.json();};
const sbGetCount=async p=>{const r=await sb('/rest/v1'+p,{headers:{Prefer:'count=exact'}});
  if(!r.ok)throw new Error('sb');
  const total=+((r.headers.get('content-range')||'/0').split('/')[1])||0;
  return {rows:await r.json(),total};};
const sbIns=async(t,row,ret)=>{const r=await sb('/rest/v1/'+t,{method:'POST',
  headers:{'Content-Type':'application/json',Prefer:ret?'return=representation':'return=minimal'},
  body:JSON.stringify(row)});
  if(!r.ok)throw new Error('sb:'+r.status);
  return ret?(await r.json())[0]:null;};
const pubUrl=p=>`${SUPA_URL}/storage/v1/object/public/${BUCKET}/${p}`;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const fmtT=iso=>{const d=new Date(iso);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};
const DAYLBL=(typeof DAYS!=='undefined')?Object.fromEntries(DAYS.map(d=>[d.id,`${d.h2} ${d.full}`])):{};

/* compresie pe telefon: latura mare max 1280px, JPEG 0.8 */
async function shrink(file){
  let bmp=null;
  try{bmp=await createImageBitmap(file);}catch(e){}
  if(!bmp) return null;
  const M=1280, s=Math.min(1,M/Math.max(bmp.width,bmp.height));
  const c=document.createElement('canvas');
  c.width=Math.max(1,Math.round(bmp.width*s));
  c.height=Math.max(1,Math.round(bmp.height*s));
  c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);
  return await new Promise(r=>c.toBlob(r,'image/jpeg',.8));
}

/* ── lightbox: pozele se deschid în pagină, cu descărcare & share ── */
function lightbox(url){
  let lb=document.getElementById('lbox');
  if(!lb){
    lb=document.createElement('div');
    lb.id='lbox';
    lb.innerHTML=`<button class="lx" title="închide">✕</button>
      <img alt="">
      <div class="lbar"><button class="lbtn" data-dl>descarcă</button><button class="lbtn" data-sh>trimite</button></div>`;
    document.body.appendChild(lb);
    lb.addEventListener('click',e=>{if(e.target===lb||e.target.classList.contains('lx'))lb.hidden=true;});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')lb.hidden=true;});
    const grab=async u=>{const r=await fetch(u);if(!r.ok)throw 0;return r.blob();};
    const nameOf=u=>('ideo-'+(u.split('/').pop()||'poza')).replace(/[?#].*$/,'');
    lb.querySelector('[data-dl]').addEventListener('click',async()=>{
      const u=lb.dataset.url;
      try{
        const b=await grab(u), o=URL.createObjectURL(b);
        const a=document.createElement('a');a.href=o;a.download=nameOf(u);
        document.body.appendChild(a);a.click();a.remove();
        setTimeout(()=>URL.revokeObjectURL(o),4000);
      }catch(e){window.open(u,'_blank');}
    });
    lb.querySelector('[data-sh]').addEventListener('click',async()=>{
      const u=lb.dataset.url;
      try{
        const b=await grab(u);
        const f=new File([b],nameOf(u),{type:b.type});
        if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f]});return;}
      }catch(e){}
      window.open('https://wa.me/?text='+encodeURIComponent(u),'_blank');
    });
  }
  lb.dataset.url=url;
  lb.querySelector('img').src=url;
  lb.hidden=false;
}

/* ── vibe check ─────────────────────────── */
let vibeChip=null, vibeSec=null, camFab=null, vibeBuilt=false;
let feedShown=0, feedTotal=0, feedLastDay=null, hasAuthorCol=true;
let ACTIVE='';

const mine=()=>{try{return JSON.parse(localStorage.getItem('vibe-mine')||'{}');}catch(e){return {};}};
const rememberMine=(id,token)=>{const m=mine();m[id]=token;localStorage.setItem('vibe-mine',JSON.stringify(m));};

function ensureVibeUI(){
  if(vibeChip)return;
  const rail=document.getElementById('rail'); if(!rail)return;
  /* chipul din rail, ultimul, după +info */
  vibeChip=document.createElement('button');
  vibeChip.className='daychip vibe'; vibeChip.dataset.day='vibe';
  vibeChip.setAttribute('aria-selected','false'); vibeChip.hidden=true;
  vibeChip.innerHTML='<span class="dw">📷</span><span class="dn">vibe</span><span class="vdot" hidden></span>';
  vibeChip.addEventListener('click',()=>selectDay('vibe',true));
  rail.appendChild(vibeChip);

  /* secțiunea */
  vibeSec=document.createElement('section');
  vibeSec.className='day'; vibeSec.id='day-vibe';
  vibeSec.innerHTML=`
    <div class="dayhero"><h2>vibe check</h2><div class="dd"><b id="vcount"></b></div></div>
    <div id="vfeed"></div>`;
  document.getElementById('days').appendChild(vibeSec);

  /* FAB-ul cameră: același slot și stil cu "acum" */
  camFab=document.createElement('button');
  camFab.className='fab'; camFab.id='camfab'; camFab.hidden=true;
  camFab.setAttribute('aria-label','adaugă o poză');
  camFab.textContent='📷';
  document.body.appendChild(camFab);
  camFab.addEventListener('click',openCapture);
}

/* chipul există doar în festival (roNow().day nenul, regula de 05:00 inclusă) */
function syncVibeVisibility(){
  ensureVibeUI();
  if(!vibeChip)return;
  const inFest=!!window.CURRENT_DAY;
  vibeChip.hidden=!inFest;
  if(!inFest&&ACTIVE==='vibe'){
    const c=document.querySelector('.daychip:not(.vibe):not(.info)');
    selectDay(c?c.dataset.day:'mi29',false);
  }
  syncFabs();
}
/* un singur FAB pe ecran: camera pe vibe, "acum" pe program */
function syncFabs(){
  const fab=document.getElementById('fab');
  if(!fab||!camFab)return;
  if(ACTIVE==='vibe'){fab.hidden=true;camFab.hidden=false;}
  else{camFab.hidden=true;fab.hidden=!window.CURRENT_DAY;}
  const filters=document.getElementById('filters');
  if(filters)filters.hidden=(ACTIVE==='vibe');
}

/* punctul "poze noi" de pe chip */
async function syncVibeDot(){
  if(!vibeChip||vibeChip.hidden)return;
  try{
    const rows=await sbGet('/jurnal_photos?select=created_at&order=created_at.desc&limit=1');
    const dot=vibeChip.querySelector('.vdot');
    const latest=rows[0]&&rows[0].created_at;
    const seen=localStorage.getItem('vibe-last-seen')||'';
    dot.hidden=!(latest&&latest>seen&&ACTIVE!=='vibe');
  }catch(e){}
}

/* ── feed-ul ── */
const vitemHtml=r=>{
  const own=mine()[r.id];
  return `<figure class="vitem" data-id="${r.id}">
    <img loading="lazy" src="${pubUrl(r.path)}" alt="" data-lbx>
    <figcaption class="vmeta">${fmtT(r.created_at)} · ${esc(r.author||'—')}${own?' <button class="vdel" title="șterge poza ta">✕</button>':''}</figcaption>
  </figure>`;
};
const vsepHtml=day=>`<div class="vsep"><span>${esc(DAYLBL[day]||day)}</span></div>`;

async function feedLoad(reset){
  const box=document.getElementById('vfeed');
  if(reset){
    feedShown=0;feedLastDay=null;
    box.innerHTML='<div class="vskel" style="height:220px"></div><div class="vskel" style="height:140px"></div><div class="vskel" style="height:180px"></div>';
  }
  const sel=hasAuthorCol?'id,path,day,created_at,author':'id,path,day,created_at';
  let rows,total;
  try{
    ({rows,total}=await sbGetCount(`/jurnal_photos?select=${sel}&order=created_at.desc&limit=${PAGE}&offset=${feedShown}`));
  }catch(e){
    if(hasAuthorCol){hasAuthorCol=false;return feedLoad(reset);} /* coloana author nu există încă */
    box.innerHTML='<p class="jnote">nu s-a putut încărca</p><button class="vretry">încearcă din nou</button>';
    box.querySelector('.vretry').addEventListener('click',()=>feedLoad(true));
    return;
  }
  feedTotal=total;
  document.getElementById('vcount').textContent=`${total} ${total===1?'poză':'poze'} · festivalul #21`;
  if(reset)box.innerHTML='';
  const old=box.querySelector('.vmore'); if(old)old.remove();
  if(!total){
    box.innerHTML=`<p class="jnote" style="margin:26px 0 14px">încă nicio poză</p>
      <button class="vfirst">📷 fii primul care postează</button>`;
    box.querySelector('.vfirst').addEventListener('click',openCapture);
    return;
  }
  rows.forEach(r=>{
    if(r.day!==feedLastDay){feedLastDay=r.day;box.insertAdjacentHTML('beforeend',vsepHtml(r.day));}
    box.insertAdjacentHTML('beforeend',vitemHtml(r));
  });
  feedShown+=rows.length;
  if(feedShown<feedTotal){
    box.insertAdjacentHTML('beforeend','<button class="vmore">încarcă mai multe</button>');
    box.querySelector('.vmore').addEventListener('click',()=>feedLoad(false));
  }
}

/* ștergerea propriei poze (token în localStorage) + lightbox pe imagini */
document.addEventListener('click',async e=>{
  const del=e.target.closest('.vdel');
  if(del){
    const fig=del.closest('.vitem'), id=+fig.dataset.id, token=mine()[id];
    del.disabled=true;
    try{
      const r=await sb('/rest/v1/rpc/vibe_delete',{method:'POST',
        headers:{'Content-Type':'application/json'},body:JSON.stringify({p_id:id,p_token:token})});
      if(!r.ok)throw 0;
      fig.remove(); feedTotal=Math.max(0,feedTotal-1);
      document.getElementById('vcount').textContent=`${feedTotal} ${feedTotal===1?'poză':'poze'} · festivalul #21`;
    }catch(err){del.disabled=false;del.textContent='nu s-a putut';setTimeout(()=>{del.textContent='✕';},2000);}
    return;
  }
  const img=e.target.closest('[data-lbx]');
  if(img)lightbox(img.getAttribute('src'));
});

/* ── capturarea: cameră → preview → nume opțional → postează ── */
function openCapture(){
  const input=document.createElement('input');
  input.type='file'; input.accept='image/*'; input.setAttribute('capture','environment');
  input.hidden=true; document.body.appendChild(input);
  input.addEventListener('change',()=>{
    const f=input.files&&input.files[0];
    input.remove();
    if(f)openSheet(f);
  });
  input.click();
}
function openSheet(file){
  let sh=document.getElementById('vsheet'); if(sh)sh.remove();
  sh=document.createElement('div'); sh.id='vsheet';
  const url=URL.createObjectURL(file);
  sh.innerHTML=`<button class="vx" title="renunță">✕</button>
    <img src="${url}" alt="">
    <input class="vname" type="text" maxlength="40" placeholder="numele tău (opțional)" value="${esc(localStorage.getItem('vibe-name')||'')}">
    <button class="vpost">postează</button>
    <p class="jnote verr" hidden></p>`;
  document.body.appendChild(sh);
  sh.querySelector('.vx').addEventListener('click',()=>{URL.revokeObjectURL(url);sh.remove();});
  sh.querySelector('.vpost').addEventListener('click',async()=>{
    const btn=sh.querySelector('.vpost'), err=sh.querySelector('.verr');
    const author=sh.querySelector('.vname').value.trim().slice(0,40);
    if(author)localStorage.setItem('vibe-name',author);
    btn.disabled=true; btn.textContent='se încarcă…'; err.hidden=true;
    try{
      if(!navigator.onLine)throw new Error('ești offline · încearcă mai târziu');
      const blob=await shrink(file);
      if(!blob)throw new Error('formatul nu e suportat');
      const day=window.CURRENT_DAY||'x';
      const path=`${day}/${Date.now()}${Math.random().toString(36).slice(2,6)}.jpg`;
      const up=await sb(`/storage/v1/object/${BUCKET}/${path}`,{method:'POST',
        headers:{'Content-Type':'image/jpeg','x-upsert':'false'},body:blob});
      if(!up.ok)throw new Error('nu a mers uploadul · mai încearcă');
      const token=(crypto.randomUUID?crypto.randomUUID():String(Math.random()).slice(2));
      let row=null;
      try{
        row=await sbIns('jurnal_photos',{event_id:'vibe',day,title:'',path,author:author||null,token},true);
      }catch(e2){ /* coloanele author/token nu există încă: postăm simplu */
        row=await sbIns('jurnal_photos',{event_id:'vibe',day,title:'',path},true);
      }
      if(row&&row.id&&row.token)rememberMine(row.id,row.token);
      /* optimist: poza intră în capul feed-ului */
      const box=document.getElementById('vfeed');
      if(box&&vibeBuilt){
        const fake={id:row?row.id:0,path,day,created_at:new Date().toISOString(),author:author||null};
        const firstSep=box.querySelector('.vsep');
        if(firstSep&&firstSep.textContent.includes(DAYLBL[day]||day)){
          firstSep.insertAdjacentHTML('afterend',vitemHtml(fake));
        }else{
          box.insertAdjacentHTML('afterbegin',vsepHtml(day)+vitemHtml(fake));
        }
        const emptyBtn=box.querySelector('.vfirst');
        if(emptyBtn){const note=emptyBtn.previousElementSibling;if(note)note.remove();emptyBtn.remove();}
        feedTotal++;
        document.getElementById('vcount').textContent=`${feedTotal} ${feedTotal===1?'poză':'poze'} · festivalul #21`;
      }
      localStorage.setItem('vibe-last-seen',new Date().toISOString());
      URL.revokeObjectURL(url); sh.remove();
    }catch(e){
      err.textContent=(e.message&&e.message.length<60)?e.message:'nu a mers · mai încearcă o dată';
      err.hidden=false; btn.disabled=false; btn.textContent='postează';
    }
  });
}

/* ── anunțuri: bannerul de sub banda de zile ── */
async function refreshAnunt(){
  const bar=document.getElementById('anuntbar'); if(!bar)return;
  try{
    const rows=await sbGet('/anunturi_21?select=text,created_at&order=created_at.desc&limit=1');
    const a=rows[0];
    const fresh=a && Date.now()-new Date(a.created_at).getTime()<ANUNT_TTL_H*3600*1000;
    const dismissed=a && localStorage.getItem('anunt-inchis')===a.created_at;
    if(fresh && !dismissed){
      bar.innerHTML=`<div class="anunt">📣 ${esc(a.text)} <small>${fmtT(a.created_at)}</small><button class="ax" title="închide">✕</button></div>`;
      bar.querySelector('.ax').addEventListener('click',()=>{
        localStorage.setItem('anunt-inchis',a.created_at); bar.innerHTML='';
      });
    } else bar.innerHTML='';
  }catch(e){}
}

/* ── blocurile live din +info ── */
let infoBuilt=false;
function buildInfo(){
  if(infoBuilt)return; infoBuilt=true;
  const grid=document.querySelector('#day-info .info-grid'); if(!grid)return;

  /* feedback: mereu vizibil, nu în acordeon */
  const fb=document.createElement('div');
  fb.className='iblock wide'; fb.setAttribute('data-live','');
  fb.innerHTML=`<h3>feedback în timp real</h3>
    <p class="inote">idei și probleme, cât sunt calde; le citim la sinteza de după festival.</p>
    <div class="ftips"><button class="ftip" data-tip="idee" aria-pressed="true">idee</button><button class="ftip" data-tip="problemă" aria-pressed="false">problemă</button></div>
    <textarea class="fbox" rows="3" maxlength="2000" placeholder="scrie aici…"></textarea>
    <div><button class="fsend">trimite</button><span class="jnote fstat"></span></div>`;
  grid.appendChild(fb);
  fb.querySelectorAll('.ftip').forEach(b=>b.addEventListener('click',()=>{
    fb.querySelectorAll('.ftip').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  }));
  fb.querySelector('.fsend').addEventListener('click',async()=>{
    const t=fb.querySelector('.fbox'), s=fb.querySelector('.fstat');
    const tip=fb.querySelector('.ftip[aria-pressed="true"]').dataset.tip;
    const v=t.value.trim(); if(!v)return;
    s.textContent='se trimite…';
    try{await sbIns('feedback_21',{tip,text:v}); t.value=''; s.textContent='mulțumim ♥'; setTimeout(()=>s.textContent='',2500);}
    catch(e){s.textContent='nu a mers · mai încearcă';}
  });

  /* anunțuri: acordeon; publicarea e deschisă oricui, alegere de echipă */
  const an=document.createElement('div');
  an.className='iblock acc'; an.setAttribute('data-live','');
  an.innerHTML=`<h3>anunțuri</h3>
    <div class="alist"></div>
    <textarea class="fbox" rows="2" maxlength="300" placeholder="scrie un anunț pentru toată lumea…"></textarea>
    <div><button class="fsend">publică anunțul</button><span class="jnote fstat"></span></div>`;
  grid.appendChild(an);
  const renderAn=async()=>{
    try{
      const rows=await sbGet('/anunturi_21?select=text,created_at&order=created_at.desc&limit=10');
      an.querySelector('.alist').innerHTML=rows.length
        ?rows.map(r=>`<div class="irow"><span class="ra">${esc(r.text)}</span><span class="rb">${fmtT(r.created_at)}</span></div>`).join('')
        :'<p class="jnote">niciun anunț încă</p>';
    }catch(e){an.querySelector('.alist').innerHTML='<p class="jnote">indisponibil</p>';}
  };
  an.querySelector('h3').addEventListener('click',()=>{
    if(!an.classList.contains('open'))renderAn();
  });
  an.querySelector('.fsend').addEventListener('click',async()=>{
    const t=an.querySelector('.fbox'), s=an.querySelector('.fstat');
    const v=t.value.trim(); if(!v)return;
    s.textContent='se trimite…';
    try{await sbIns('anunturi_21',{text:v}); t.value=''; s.textContent='publicat ✓'; renderAn(); refreshAnunt(); setTimeout(()=>s.textContent='',2500);}
    catch(e){s.textContent='nu a mers · mai încearcă';}
  });
}

/* ── pornire: o singură sondă; dacă nu răspunde, nu apare nimic ── */
(async function init(){
  try{await sbGet('/anunturi_21?select=id&limit=1');}
  catch(e){return;} /* setup-21.sql nerulat sau fără net: stăm ascunși */
  refreshAnunt();
  syncVibeVisibility();
  syncVibeDot();
  setInterval(()=>{refreshAnunt();syncVibeDot();},180000);
  document.addEventListener('nowchange',syncVibeVisibility);
  document.addEventListener('daychange',e=>{
    ACTIVE=e.detail;
    if(ACTIVE==='info')buildInfo();
    if(ACTIVE==='vibe'){
      localStorage.setItem('vibe-last-seen',new Date().toISOString());
      if(vibeChip){const dot=vibeChip.querySelector('.vdot');if(dot)dot.hidden=true;}
      if(!vibeBuilt){vibeBuilt=true;feedLoad(true);}
    }
    syncFabs();
  });
})();
})();
