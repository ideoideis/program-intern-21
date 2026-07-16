/* ============================================================
   Partea "live" a paginii: jurnal foto, anunțuri, feedback.
   Complet decuplată de program: dacă Supabase nu răspunde (sau
   setup-21.sql nu a fost încă rulat), tot ce e aici se ascunde
   singur și programul merge normal, inclusiv offline.
   ============================================================ */
(function(){
'use strict';

const SUPA_URL='https://waqyaewaldphstmiobjj.supabase.co';
const SUPA_KEY='sb_publishable_XtarsOK52eqlRUmv1ElS4Q_RwrDK78G'; /* cheia publică */
const BUCKET='jurnal-21';

const sb=(path,opt={})=>fetch(SUPA_URL+path,Object.assign({},opt,{
  headers:Object.assign({apikey:SUPA_KEY,Authorization:'Bearer '+SUPA_KEY},opt.headers||{})
}));
const sbGet=async p=>{const r=await sb('/rest/v1'+p);if(!r.ok)throw new Error('sb');return r.json();};
const sbIns=async(t,row)=>{const r=await sb('/rest/v1/'+t,{method:'POST',
  headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(row)});
  if(!r.ok)throw new Error('sb');};
const pubUrl=p=>`${SUPA_URL}/storage/v1/object/public/${BUCKET}/${p}`;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const fmtT=iso=>{const d=new Date(iso);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};

/* poza: micșorare pe telefon înainte de upload (~1600px, WebP) */
async function shrink(file){
  let bmp=null;
  try{bmp=await createImageBitmap(file);}catch(e){}
  if(!bmp) return null;
  const M=1600, s=Math.min(1,M/Math.max(bmp.width,bmp.height));
  const c=document.createElement('canvas');
  c.width=Math.max(1,Math.round(bmp.width*s));
  c.height=Math.max(1,Math.round(bmp.height*s));
  c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);
  let blob=await new Promise(r=>c.toBlob(r,'image/webp',.82));
  if(!blob||!blob.size) blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.85));
  return blob;
}

const dayOf=el=>{const s=el.closest('section.day');return s?s.id.replace('day-',''):'';};
const counts={}; /* day -> {eid: n} */
const loadedDays=new Set();

function jbtnLabel(b,n){b.textContent=n?`📷 jurnal · ${n}`:'📷 jurnal';}

/* injectăm butonul de jurnal pe cardurile de evenimente (nu și pe compacte) */
function injectButtons(){
  document.querySelectorAll('.viewlist .ev:not(.compact)').forEach(ev=>{
    if(ev.querySelector('.jbtn'))return;
    const body=ev.children[1]; if(!body)return;
    const b=document.createElement('button');
    b.className='jbtn'; jbtnLabel(b,0); b.setAttribute('data-live','');
    body.appendChild(b);
    const panel=document.createElement('div');
    panel.className='jpanel'; panel.hidden=true;
    body.appendChild(panel);
    b.addEventListener('click',()=>togglePanel(ev,b,panel));
  });
}

async function refreshCounts(day){
  try{
    const rows=await sbGet(`/jurnal_photos?day=eq.${encodeURIComponent(day)}&select=event_id`);
    const m={}; rows.forEach(r=>{m[r.event_id]=(m[r.event_id]||0)+1;});
    counts[day]=m;
    document.querySelectorAll(`#day-${CSS.escape(day)} .viewlist .ev:not(.compact)`).forEach(ev=>{
      const b=ev.querySelector('.jbtn'); if(b) jbtnLabel(b,m[ev.dataset.eid]||0);
    });
  }catch(e){}
}

async function togglePanel(ev,btn,panel){
  if(!panel.hidden){panel.hidden=true;return;}
  panel.hidden=false;
  panel.innerHTML='<p class="jnote">se încarcă…</p>';
  const eid=ev.dataset.eid, day=dayOf(ev);
  const title=(ev.querySelector('.title')||{}).textContent||'';
  let rows=[];
  try{rows=await sbGet(`/jurnal_photos?event_id=eq.${encodeURIComponent(eid)}&select=path,created_at&order=created_at.desc&limit=60`);}
  catch(e){panel.innerHTML='<p class="jnote">jurnalul nu e disponibil acum</p>';return;}
  panel.innerHTML=`
    <label class="jadd">+ adaugă poză<input type="file" accept="image/*" hidden></label>
    <span class="jnote jstatus"></span>
    <div class="jthumbs">${rows.map(r=>`<a href="${pubUrl(r.path)}" target="_blank" rel="noopener"><img loading="lazy" src="${pubUrl(r.path)}" alt=""></a>`).join('')}</div>`;
  const input=panel.querySelector('input');
  const status=panel.querySelector('.jstatus');
  input.addEventListener('change',async()=>{
    const f=input.files&&input.files[0]; if(!f)return;
    if(!navigator.onLine){status.textContent='ești offline · încearcă mai târziu';return;}
    status.textContent='se încarcă…';
    try{
      const blob=await shrink(f);
      if(!blob){status.textContent='formatul nu e suportat';return;}
      const ext=blob.type==='image/webp'?'webp':'jpg';
      const path=`${day}/${eid}/${Date.now()}${Math.random().toString(36).slice(2,6)}.${ext}`;
      const up=await sb(`/storage/v1/object/${BUCKET}/${path}`,{method:'POST',
        headers:{'Content-Type':blob.type,'x-upsert':'false'},body:blob});
      if(!up.ok)throw new Error('up');
      await sbIns('jurnal_photos',{event_id:eid,day,title:title.slice(0,200),path});
      status.textContent='gata ♥';
      const th=panel.querySelector('.jthumbs');
      th.insertAdjacentHTML('afterbegin',`<a href="${pubUrl(path)}" target="_blank" rel="noopener"><img src="${pubUrl(path)}" alt=""></a>`);
      const m=counts[day]||(counts[day]={}); m[eid]=(m[eid]||0)+1; jbtnLabel(btn,m[eid]);
      setTimeout(()=>{status.textContent='';},2500);
    }catch(e){status.textContent='nu a mers · mai încearcă o dată';}
    input.value='';
  });
}

/* ── anunțuri: bannerul de sub banda de zile ── */
async function refreshAnunt(){
  const bar=document.getElementById('anuntbar'); if(!bar)return;
  try{
    const rows=await sbGet('/anunturi_21?select=text,created_at&order=created_at.desc&limit=1');
    const a=rows[0];
    if(a && Date.now()-new Date(a.created_at).getTime()<24*3600*1000){
      bar.innerHTML=`<div class="anunt">📣 ${esc(a.text)} <small>${fmtT(a.created_at)}</small></div>`;
    } else bar.innerHTML='';
  }catch(e){}
}

/* ── blocurile live din +info ── */
let infoBuilt=false;
async function buildInfo(){
  if(infoBuilt)return; infoBuilt=true;
  const grid=document.querySelector('#day-info .info-grid'); if(!grid)return;

  /* anunțuri: ultimele + publicare */
  const an=document.createElement('div');
  an.className='iblock'; an.setAttribute('data-live','');
  an.innerHTML=`<h3>anunțuri</h3>
    <div class="alist"><p class="jnote">se încarcă…</p></div>
    <textarea class="fbox" rows="2" maxlength="300" placeholder="scrie un anunț pentru toată lumea…"></textarea>
    <button class="fsend">publică anunțul</button><span class="jnote fstat"></span>`;
  grid.appendChild(an);
  const renderAn=async()=>{
    try{
      const rows=await sbGet('/anunturi_21?select=text,created_at&order=created_at.desc&limit=10');
      an.querySelector('.alist').innerHTML=rows.length
        ?rows.map(r=>`<div class="irow"><span class="ra">${esc(r.text)}</span><span class="rb">${fmtT(r.created_at)}</span></div>`).join('')
        :'<p class="jnote">niciun anunț încă</p>';
    }catch(e){an.querySelector('.alist').innerHTML='<p class="jnote">indisponibil</p>';}
  };
  renderAn();
  an.querySelector('.fsend').addEventListener('click',async()=>{
    const t=an.querySelector('.fbox'), s=an.querySelector('.fstat');
    const v=t.value.trim(); if(!v)return;
    s.textContent='se trimite…';
    try{await sbIns('anunturi_21',{text:v}); t.value=''; s.textContent='publicat ✓'; renderAn(); refreshAnunt(); setTimeout(()=>s.textContent='',2500);}
    catch(e){s.textContent='nu a mers · mai încearcă';}
  });

  /* feedback: idee / problemă */
  const fb=document.createElement('div');
  fb.className='iblock'; fb.setAttribute('data-live','');
  fb.innerHTML=`<h3>feedback în timp real</h3>
    <p class="inote">idei și probleme, cât sunt calde; le strângem și le citim la sinteza de după festival.</p>
    <div class="ftips"><button class="ftip" data-tip="idee" aria-pressed="true">idee</button><button class="ftip" data-tip="problemă" aria-pressed="false">problemă</button></div>
    <textarea class="fbox" rows="3" maxlength="2000" placeholder="scrie aici…"></textarea>
    <button class="fsend">trimite</button><span class="jnote fstat"></span>`;
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

  /* jurnal: toate pozele */
  const ja=document.createElement('div');
  ja.className='iblock wide'; ja.setAttribute('data-live','');
  ja.innerHTML='<h3>jurnal foto · toate pozele</h3><div class="jall"><p class="jnote">se încarcă…</p></div>';
  grid.appendChild(ja);
  try{
    const rows=await sbGet('/jurnal_photos?select=path,title,day,created_at&order=created_at.desc&limit=48');
    ja.querySelector('.jall').innerHTML=rows.length
      ?`<div class="jthumbs">${rows.map(r=>`<a href="${pubUrl(r.path)}" target="_blank" rel="noopener" title="${esc(r.title)}"><img loading="lazy" src="${pubUrl(r.path)}" alt="${esc(r.title)}"></a>`).join('')}</div>`
      :'<p class="jnote">încă nicio poză · fii tu prima persoană care prinde momentul</p>';
  }catch(e){ja.querySelector('.jall').innerHTML='<p class="jnote">indisponibil</p>';}
}

/* ── pornire: o singură sondă; dacă nu răspunde, nu apare nimic ── */
(async function init(){
  try{await sbGet('/anunturi_21?select=id&limit=1');}
  catch(e){return;} /* setup-21.sql nerulat sau fără net: stăm ascunși */
  injectButtons();
  refreshAnunt();
  setInterval(refreshAnunt,180000);
  const today=document.querySelector('.daychip[aria-selected="true"]');
  if(today&&today.dataset.day&&today.dataset.day!=='info') refreshCounts(today.dataset.day);
  document.addEventListener('daychange',e=>{
    const d=e.detail;
    if(d==='info'){buildInfo();return;}
    if(!loadedDays.has(d)){loadedDays.add(d);refreshCounts(d);}
  });
})();
})();
