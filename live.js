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
const PAGE=60;        /* postări pe pagină în feed */

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
DAYLBL.x='înainte de festival';

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
function lightbox(url,cap){
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
      const u=lb.dataset.url, msg=lb.dataset.msg||'vibe check · festivalul ideo ideis #21';
      try{
        const b=await grab(u);
        const f=new File([b],nameOf(u),{type:b.type});
        if(navigator.canShare&&navigator.canShare({files:[f]})){
          await navigator.share({files:[f],text:msg});
          return;
        }
      }catch(e){}
      window.open('https://wa.me/?text='+encodeURIComponent(msg+' '+u),'_blank');
    });
  }
  lb.dataset.url=url;
  lb.dataset.msg=(cap?cap+' · ':'')+'vibe check · festivalul ideo ideis #21';
  lb.querySelector('img').src=url;
  lb.hidden=false;
}

/* ── vibe check ─────────────────────────── */
let vibeChip=null, vibeSec=null, camFab=null, vibeBuilt=false;
let feedShown=0, feedTotal=0, feedLastDay=null, hasAuthorCol=true;
let likesOn=true; /* devine false dacă tabela vibe_likes nu există încă */
let ACTIVE='';
const likedMap=()=>{try{return JSON.parse(localStorage.getItem('vibe-liked')||'{}');}catch(e){return {};}};
const markLiked=id=>{const m=likedMap();m[id]=1;localStorage.setItem('vibe-liked',JSON.stringify(m));};
const unmarkLiked=id=>{const m=likedMap();delete m[id];localStorage.setItem('vibe-liked',JSON.stringify(m));};
const DEV=(()=>{let t=localStorage.getItem('vibe-dev');
  if(!t){t=(crypto.randomUUID?crypto.randomUUID():String(Math.random()).slice(2)+Date.now());localStorage.setItem('vibe-dev',t);}
  return t;})();

function ensureVibeUI(){
  if(vibeChip)return;
  const rail=document.getElementById('railpins')||document.getElementById('rail'); if(!rail)return;
  /* chipul stă în zona fixă, după +info: mereu la vedere */
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
const isVideo=p=>/\.(mp4|mov|webm|m4v)$/i.test(p);
const vitemHtml=r=>{
  const media=isVideo(r.path)
    ?`<video controls playsinline preload="metadata" src="${pubUrl(r.path)}"></video>`
    :`<img loading="lazy" src="${pubUrl(r.path)}" alt="" data-lbx data-cap="${esc(r.caption||'')}" onerror="var f=this.closest('.vitem');if(f)f.remove()">`;
  const liked=likedMap()[r.id];
  const heart=likesOn?`<button class="vlike${liked?' on':''}" data-id="${r.id}">${liked?'♥':'♡'}<span class="vln"></span></button>`:'';
  return `<figure class="vitem" data-id="${r.id}">
    ${media}
    <figcaption class="vmeta"><span>${fmtT(r.created_at)}${r.caption?' · '+esc(r.caption):''}</span>${heart}</figcaption>
  </figure>`;
};
const vsepHtml=day=>`<div class="vsep"><span>${esc(DAYLBL[day]||day)}</span></div>`;

async function feedLoad(reset){
  const box=document.getElementById('vfeed');
  if(reset){
    feedShown=0;feedLastDay=null;
    box.innerHTML='<div class="vskel" style="height:220px"></div><div class="vskel" style="height:140px"></div><div class="vskel" style="height:180px"></div>';
  }
  const sel=hasAuthorCol?'id,path,day,created_at,caption':'id,path,day,created_at';
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
  loadLikes(rows.map(r=>r.id));
  feedShown+=rows.length;
  if(feedShown<feedTotal){
    box.insertAdjacentHTML('beforeend','<button class="vmore">încarcă mai multe</button>');
    box.querySelector('.vmore').addEventListener('click',()=>feedLoad(false));
  }
}

/* inimioarele: numărăm și apreciem, decuplat de restul */
async function loadLikes(ids){
  if(!likesOn||!ids.length)return;
  try{
    const rows=await sbGet(`/vibe_likes?photo_id=in.(${ids.join(',')})&select=photo_id`);
    const m={}; rows.forEach(r=>{m[r.photo_id]=(m[r.photo_id]||0)+1;});
    ids.forEach(id=>{
      const b=document.querySelector(`.vitem[data-id="${id}"] .vln`);
      if(b)b.textContent=m[id]?' '+m[id]:'';
    });
  }catch(e){
    likesOn=false;
    document.querySelectorAll('.vlike').forEach(b=>b.remove());
  }
}
document.addEventListener('click',async e=>{
  const like=e.target.closest('.vlike');
  if(!like)return;
  const id=+like.closest('.vitem').dataset.id;
  const n=like.querySelector('.vln');
  const count=()=>parseInt(n.textContent)||0;
  if(!likedMap()[id]){
    /* dai inima */
    markLiked(id);
    like.classList.add('on'); like.firstChild.textContent='♥';
    n.textContent=(count()+1)?' '+(count()+1):'';
    try{
      try{await sbIns('vibe_likes',{photo_id:id,token:DEV});}
      catch(e1){await sbIns('vibe_likes',{photo_id:id});} /* fără coloana token încă */
    }catch(err){}
  }else{
    /* o iei înapoi */
    unmarkLiked(id);
    like.classList.remove('on'); like.firstChild.textContent='♡';
    n.textContent=count()-1>0?' '+(count()-1):'';
    try{
      const r=await sb('/rest/v1/rpc/vibe_unlike',{method:'POST',
        headers:{'Content-Type':'application/json'},body:JSON.stringify({p_photo:id,p_token:DEV})});
      if(!r.ok)throw 0;
    }catch(err){
      /* serverul n-a putut retrage (funcția lipsește sau inima e veche, fără token): revenim */
      markLiked(id);
      like.classList.add('on'); like.firstChild.textContent='♥';
      n.textContent=' '+(count()+1);
    }
  }
});

/* lightbox pe imaginile din feed */
document.addEventListener('click',e=>{
  const img=e.target.closest('[data-lbx]');
  if(img)lightbox(img.getAttribute('src'),img.dataset.cap||'');
});

/* ── capturarea: cameră → preview → nume opțional → postează ── */
function openCapture(){
  const input=document.createElement('input');
  input.type='file'; input.accept='image/*,video/mp4,video/quicktime,video/webm';
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
  const unreadable=!file.size;
  const vid=file.type.startsWith('video/');
  sh.innerHTML=`<button class="vx" title="renunță">✕</button>
    ${vid?`<video src="${url}" controls muted playsinline></video>`:`<img src="${url}" alt="">`}
    <input class="vname" type="text" maxlength="80" placeholder="descriere (opțional)">
    <button class="vpost">postează</button>
    <p class="jnote verr" hidden></p>`;
  if(unreadable){
    const err=sh.querySelector('.verr');
    err.textContent='telefonul nu a putut da poza (probabil e doar în iCloud și nu e spațiu să se descarce) · încearcă alta';
    err.hidden=false;
    sh.querySelector('.vpost').disabled=true;
  }
  document.body.appendChild(sh);
  sh.querySelector('.vx').addEventListener('click',()=>{URL.revokeObjectURL(url);sh.remove();});
  sh.querySelector('.vpost').addEventListener('click',async()=>{
    const btn=sh.querySelector('.vpost'), err=sh.querySelector('.verr');
    const caption=sh.querySelector('.vname').value.trim().slice(0,80);
    btn.disabled=true; btn.textContent='se încarcă…'; err.hidden=true;
    try{
      if(!navigator.onLine)throw new Error('ești offline · încearcă mai târziu');
      let blob, ctype, ext;
      if(vid){
        if(file.size>25*1024*1024)throw new Error('videoclipul e prea mare (max 25MB)');
        blob=file; ctype=file.type||'video/mp4';
        ext=ctype.includes('quicktime')?'mov':ctype.includes('webm')?'webm':'mp4';
      }else{
        blob=await shrink(file);
        if(!blob)throw new Error('poza nu s-a putut citi (iCloud / spațiu pe telefon?) · încearcă alta');
        ctype='image/jpeg'; ext='jpg';
      }
      const day=window.CURRENT_DAY||'x';
      const path=`${day}/${Date.now()}${Math.random().toString(36).slice(2,6)}.${ext}`;
      const up=await sb(`/storage/v1/object/${BUCKET}/${path}`,{method:'POST',
        headers:{'Content-Type':ctype,'x-upsert':'false'},body:blob});
      if(!up.ok)throw new Error('nu a mers uploadul · mai încearcă');
      let row=null;
      try{
        row=await sbIns('jurnal_photos',{event_id:'vibe',day,title:'',path,caption:caption||null},true);
      }catch(e2){ /* coloana caption nu există încă: postăm simplu */
        row=await sbIns('jurnal_photos',{event_id:'vibe',day,title:'',path},true);
      }
      /* optimist: postarea intră în capul feed-ului */
      const box=document.getElementById('vfeed');
      if(box&&vibeBuilt){
        const fake={id:row?row.id:0,path,day,created_at:new Date().toISOString(),caption:caption||null};
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
  grid.prepend(fb);
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

  /* statistici: citibile de oricine, din vederile agregate */
  const st=document.createElement('div');
  st.className='iblock wide acc'; st.setAttribute('data-live','');
  st.innerHTML='<h3>statistici</h3><div class="stbox"></div>';
  grid.appendChild(st);
  let stLoaded=false;
  st.querySelector('h3').addEventListener('click',async()=>{
    const willOpen=!st.classList.contains('open');
    if(!willOpen||stLoaded)return; stLoaded=true;
    const box=st.querySelector('.stbox');
    box.innerHTML='<p class="jnote">se încarcă…</p>';
    const lbl=d=>d==='info'?'+info':d==='vibe'?'vibe':(DAYLBL[d]||d);
    try{
      const [zile,taburi,moduri,filtre,cautari]=await Promise.all([
        sbGet('/stats_pe_zi?limit=10'),
        sbGet('/stats_taburi?limit=15'),
        sbGet('/stats_moduri'),
        sbGet('/stats_filtre'),
        sbGet('/stats_cautari'),
      ]);
      const tbl=(title,head,rows)=>rows.length?`<p class="cdh">${title}</p><div class="tscroll"><table class="ttable" style="min-width:0">
        <tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr>
        ${rows.join('')}</table></div>`:'';
      box.innerHTML=(
        tbl('pe zile · sesiuni = max una pe oră per dispozitiv',['zi','persoane','sesiuni'],
          zile.map(r=>`<tr><td>${r.zi}</td><td>${r.persoane}</td><td>${r.sesiuni}</td></tr>`))+
        tbl('unde se uită lumea',['tab / zi','persoane','vizite'],
          taburi.map(r=>`<tr><td><b>${esc(lbl(r.detail))}</b></td><td>${r.persoane}</td><td>${r.vizite}</td></tr>`))+
        tbl('listă vs pe locații',['mod','comutări','persoane'],
          moduri.map(r=>`<tr><td><b>${esc(r.detail)}</b></td><td>${r.comutari}</td><td>${r.persoane}</td></tr>`))+
        tbl('filtre folosite',['filtre','folosiri'],
          filtre.map(r=>`<tr><td>${esc(r.detail)}</td><td>${r.folosiri}</td></tr>`))+
        tbl('căutări',['termen','căutări'],
          cautari.map(r=>`<tr><td>${esc(r.detail)}</td><td>${r.cautari}</td></tr>`))
      )||'<p class="jnote">încă nimic de arătat</p>';
    }catch(e){
      box.innerHTML='<p class="jnote">rulează întâi setup-analytics.sql (vederile stats_*)</p>';
    }
  });
}

/* ── statistici anonime: cine (dispozitiv), când, pe ce se uită ── */
const UA=/Mobi|Android/i.test(navigator.userAgent)?'mobil':'desktop';
let lastView='';
function track(kind,detail){
  try{
    sb('/rest/v1/analytics_21',{method:'POST',
      headers:{'Content-Type':'application/json',Prefer:'return=minimal'},
      body:JSON.stringify({device:DEV,kind,detail:String(detail||'').slice(0,60),ua:UA})
    }).catch(()=>{});
  }catch(e){}
}

/* ── pornire: o singură sondă; dacă nu răspunde, nu apare nimic ── */
(async function init(){
  try{await sbGet('/anunturi_21?select=id&limit=1');}
  catch(e){return;} /* setup-21.sql nerulat sau fără net: stăm ascunși */
  refreshAnunt();
  syncVibeVisibility();
  syncVibeDot();
  if(Date.now()-(+localStorage.getItem('ii-open-ts')||0)>3600e3){
    track('open',(location.search||'').slice(0,40));
    localStorage.setItem('ii-open-ts',String(Date.now()));
  }
  document.addEventListener('daychange',e=>{
    if(e.detail!==lastView){lastView=e.detail;track('view',e.detail);}
  });
  /* ziua pe care aterizezi contează și ea ca vizită, nu doar schimbările */
  const cur=document.querySelector('.daychip[aria-selected="true"]');
  if(cur&&cur.dataset.day){lastView=cur.dataset.day;track('view',cur.dataset.day);}
  document.addEventListener('click',e=>{
    const vb=e.target.closest('.vbtn');
    if(vb){track('mode',vb.dataset.view);return;}
    const fc=e.target.closest('.fchip');
    if(fc)setTimeout(()=>{
      const on=[...document.querySelectorAll('.fchip[aria-pressed="true"]')]
        .map(b=>b.textContent.trim().split('·')[0].trim().slice(0,14));
      track('filter',on.length?on.join('+').slice(0,60):'reset');
    },60);
  });
  const qEl=document.getElementById('q');
  let qT;
  if(qEl)qEl.addEventListener('input',()=>{
    clearTimeout(qT);
    qT=setTimeout(()=>{const v=qEl.value.trim();if(v.length>=3)track('search',v.toLowerCase().slice(0,40));},900);
  });
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
