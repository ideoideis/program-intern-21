/* ============================================================
   Partea "live" a paginii: jurnal foto, anunțuri, feedback.
   Complet decuplată de program: dacă Supabase nu răspunde (sau
   setup-21.sql nu a fost încă rulat), tot ce e aici se ascunde
   singur și programul merge normal, inclusiv offline.

   Jurnalul: o cameră mică în colțul fiecărui card de eveniment;
   tap = galeria evenimentului + „adaugă poză”, direct acolo.
   ============================================================ */
(function(){
'use strict';

const SUPA_URL='https://waqyaewaldphstmiobjj.supabase.co';
const SUPA_KEY='sb_publishable_XtarsOK52eqlRUmv1ElS4Q_RwrDK78G'; /* cheia publică */
const BUCKET='jurnal-21';
const ANUNT_TTL_H=12; /* câte ore stă un anunț în banner */

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
const cleanTitle=ev=>{const t=ev.querySelector('.title');if(!t)return'';
  const c=t.cloneNode(true);c.querySelectorAll('.nowtag,.minetag').forEach(x=>x.remove());
  return c.textContent.trim();};

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

async function upload(day,eid,title,file,status){
  if(!navigator.onLine){status.textContent='ești offline · încearcă mai târziu';return null;}
  status.textContent='se încarcă…';
  try{
    const blob=await shrink(file);
    if(!blob){status.textContent='formatul nu e suportat';return null;}
    const ext=blob.type==='image/webp'?'webp':'jpg';
    const path=`${day}/${eid}/${Date.now()}${Math.random().toString(36).slice(2,6)}.${ext}`;
    const up=await sb(`/storage/v1/object/${BUCKET}/${path}`,{method:'POST',
      headers:{'Content-Type':blob.type,'x-upsert':'false'},body:blob});
    if(!up.ok)throw new Error('up');
    await sbIns('jurnal_photos',{event_id:eid,day,title:String(title).slice(0,200),path});
    status.textContent='gata ♥';
    setTimeout(()=>{status.textContent='';},2500);
    return path;
  }catch(e){status.textContent='nu a mers · mai încearcă o dată';return null;}
}

const counts={}; /* day -> {eid: n} */
const loadedDays=new Set();
const dayOf=el=>{const s=el.closest('section.day');return s?s.id.replace('day-',''):'';};

/* camera din colțul cardului */
function injectCorners(day){
  document.querySelectorAll(`#day-${CSS.escape(day)} .viewlist .ev:not(.compact)`).forEach(ev=>{
    if(ev.querySelector('.jcorner'))return;
    const b=document.createElement('button');
    b.className='jcorner'; b.title='jurnal foto'; b.textContent='📷';
    ev.appendChild(b);
    b.addEventListener('click',e=>{e.stopPropagation();toggleGallery(ev,b);});
  });
}
function setCorner(ev,n){
  const b=ev.querySelector('.jcorner'); if(!b)return;
  b.textContent=n?`📷 ${n}`:'📷';
  b.classList.toggle('has',!!n);
}

async function refreshCounts(day){
  try{
    const rows=await sbGet(`/jurnal_photos?day=eq.${encodeURIComponent(day)}&select=event_id`);
    const m={}; rows.forEach(r=>{m[r.event_id]=(m[r.event_id]||0)+1;});
    counts[day]=m;
    document.querySelectorAll(`#day-${CSS.escape(day)} .viewlist .ev:not(.compact)`).forEach(ev=>{
      setCorner(ev,m[ev.dataset.eid]||0);
    });
  }catch(e){}
}

/* galeria evenimentului + adăugare, în același panou */
async function toggleGallery(ev,btn){
  let panel=ev.querySelector('.jpanel');
  if(panel){panel.hidden=!panel.hidden;return;}
  panel=document.createElement('div');
  panel.className='jpanel';
  panel.innerHTML='<p class="jnote">se încarcă…</p>';
  (ev.children[1]||ev).appendChild(panel);
  const eid=ev.dataset.eid, day=dayOf(ev), title=cleanTitle(ev);
  let rows=[];
  try{rows=await sbGet(`/jurnal_photos?event_id=eq.${encodeURIComponent(eid)}&select=path&order=created_at.desc&limit=60`);}
  catch(e){panel.innerHTML='<p class="jnote">indisponibil</p>';return;}
  panel.innerHTML=`<label class="jadd">+ adaugă poză<input type="file" accept="image/*" hidden></label>
    <span class="jnote jstatus"></span>
    <div class="jthumbs">${rows.map(r=>`<a href="${pubUrl(r.path)}" target="_blank" rel="noopener"><img loading="lazy" src="${pubUrl(r.path)}" alt=""></a>`).join('')}</div>`;
  const input=panel.querySelector('input'), status=panel.querySelector('.jstatus');
  input.addEventListener('change',async()=>{
    const f=input.files&&input.files[0]; if(!f)return;
    const path=await upload(day,eid,title,f,status);
    if(path){
      panel.querySelector('.jthumbs').insertAdjacentHTML('afterbegin',
        `<a href="${pubUrl(path)}" target="_blank" rel="noopener"><img src="${pubUrl(path)}" alt=""></a>`);
      const m=counts[day]||(counts[day]={}); m[eid]=(m[eid]||0)+1;
      setCorner(ev,m[eid]);
    }
    input.value='';
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

  /* anunțuri: acordeon */
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
  an.querySelector('h3').addEventListener('click',()=>{if(an.classList.contains('open'))renderAn();});
  an.querySelector('.fsend').addEventListener('click',async()=>{
    const t=an.querySelector('.fbox'), s=an.querySelector('.fstat');
    const v=t.value.trim(); if(!v)return;
    s.textContent='se trimite…';
    try{await sbIns('anunturi_21',{text:v}); t.value=''; s.textContent='publicat ✓'; renderAn(); refreshAnunt(); setTimeout(()=>s.textContent='',2500);}
    catch(e){s.textContent='nu a mers · mai încearcă';}
  });

  /* jurnal, toate pozele: acordeon, încărcat la deschidere */
  const ja=document.createElement('div');
  ja.className='iblock wide acc'; ja.setAttribute('data-live','');
  ja.innerHTML='<h3>jurnal foto · toate pozele</h3><div class="jall"></div>';
  grid.appendChild(ja);
  let jaLoaded=false;
  ja.querySelector('h3').addEventListener('click',async()=>{
    if(jaLoaded||!ja.classList.contains('open'))return; jaLoaded=true;
    ja.querySelector('.jall').innerHTML='<p class="jnote">se încarcă…</p>';
    try{
      const rows=await sbGet('/jurnal_photos?select=path,title&order=created_at.desc&limit=48');
      ja.querySelector('.jall').innerHTML=rows.length
        ?`<div class="jthumbs">${rows.map(r=>`<a href="${pubUrl(r.path)}" target="_blank" rel="noopener" title="${esc(r.title)}"><img loading="lazy" src="${pubUrl(r.path)}" alt="${esc(r.title)}"></a>`).join('')}</div>`
        :'<p class="jnote">încă nicio poză · fii tu prima persoană care prinde momentul</p>';
    }catch(e){ja.querySelector('.jall').innerHTML='<p class="jnote">indisponibil</p>';}
  });
}

/* ── pornire: o singură sondă; dacă nu răspunde, nu apare nimic ── */
(async function init(){
  try{await sbGet('/anunturi_21?select=id&limit=1');}
  catch(e){return;} /* setup-21.sql nerulat sau fără net: stăm ascunși */
  refreshAnunt();
  setInterval(refreshAnunt,180000);
  const onDay=d=>{
    if(d==='info'){buildInfo();return;}
    injectCorners(d);
    if(!loadedDays.has(d)){loadedDays.add(d);refreshCounts(d);}
  };
  const today=document.querySelector('.daychip[aria-selected="true"]');
  if(today&&today.dataset.day) onDay(today.dataset.day);
  document.addEventListener('daychange',e=>onDay(e.detail));
})();
})();
