/* ============================================================
   Partea "live" a paginii: jurnal foto, anunțuri, feedback.
   Complet decuplată de program: dacă Supabase nu răspunde (sau
   setup-21.sql nu a fost încă rulat), tot ce e aici se ascunde
   singur și programul merge normal, inclusiv offline.

   Ca să nu aglomereze pagina: pe carduri apare doar un contor mic
   „📷 N”, și numai la evenimentele care au deja poze; adăugarea se
   face dintr-un singur buton pe zi, cu evenimentul curent preselectat.
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

/* contorul mic pe card, doar unde există poze */
function chipFor(ev){
  let c=ev.querySelector('.jchip');
  if(!c){
    const t=ev.querySelector('.title'); if(!t)return null;
    c=document.createElement('button');
    c.className='jchip'; c.title='vezi pozele';
    t.appendChild(c);
    c.addEventListener('click',e=>{e.stopPropagation();toggleGallery(ev);});
  }
  return c;
}
function setChip(ev,n){
  if(!n)return;
  const c=chipFor(ev); if(c) c.textContent=`📷 ${n}`;
}

async function refreshCounts(day){
  try{
    const rows=await sbGet(`/jurnal_photos?day=eq.${encodeURIComponent(day)}&select=event_id`);
    const m={}; rows.forEach(r=>{m[r.event_id]=(m[r.event_id]||0)+1;});
    counts[day]=m;
    document.querySelectorAll(`#day-${CSS.escape(day)} .viewlist .ev`).forEach(ev=>{
      setChip(ev,m[ev.dataset.eid]||0);
    });
  }catch(e){}
}

async function toggleGallery(ev){
  let panel=ev.querySelector('.jpanel');
  if(panel){panel.hidden=!panel.hidden;return;}
  panel=document.createElement('div');
  panel.className='jpanel';
  panel.innerHTML='<p class="jnote">se încarcă…</p>';
  (ev.children[1]||ev).appendChild(panel);
  const eid=ev.dataset.eid;
  try{
    const rows=await sbGet(`/jurnal_photos?event_id=eq.${encodeURIComponent(eid)}&select=path&order=created_at.desc&limit=60`);
    panel.innerHTML=`<div class="jthumbs">${rows.map(r=>`<a href="${pubUrl(r.path)}" target="_blank" rel="noopener"><img loading="lazy" src="${pubUrl(r.path)}" alt=""></a>`).join('')}</div>`;
  }catch(e){panel.innerHTML='<p class="jnote">indisponibil</p>';}
}

/* un singur „adaugă” pe zi, cu evenimentul curent preselectat */
function injectDayAdd(day){
  const sec=document.getElementById('day-'+day); if(!sec)return;
  if(sec.querySelector('.jday'))return;
  const dd=sec.querySelector('.dayhero .dd'); if(!dd)return;
  const b=document.createElement('button');
  b.className='jday'; b.textContent='📷 adaugă poză';
  dd.appendChild(b);
  b.addEventListener('click',()=>toggleDayPanel(sec,day));
}
function toggleDayPanel(sec,day){
  let p=sec.querySelector('.jdaypanel');
  if(p){p.hidden=!p.hidden;return;}
  const evs=[...sec.querySelectorAll('.viewlist .ev')].map(ev=>({
    eid:ev.dataset.eid,
    s:+ev.dataset.s,
    label:`${(ev.querySelector('.t1')||{}).textContent||''} · ${((ev.querySelector('.title')||{}).textContent||'').replace(/📷.*$/,'').trim().slice(0,60)}`
  }));
  if(!evs.length)return;
  /* preselectăm ce e „acum”: ultimul eveniment început */
  const now=new Date(); let nowM=now.getHours()*60+now.getMinutes(); if(now.getHours()<5)nowM+=1440;
  let pick=evs[0].eid;
  evs.forEach(e=>{if(e.s<=nowM)pick=e.eid;});
  p=document.createElement('div');
  p.className='jdaypanel';
  p.innerHTML=`<select>${evs.map(e=>`<option value="${e.eid}"${e.eid===pick?' selected':''}>${esc(e.label)}</option>`).join('')}</select>
    <label class="jadd">alege poza<input type="file" accept="image/*" hidden></label>
    <span class="jnote jstatus"></span>`;
  sec.querySelector('.dayhero').after(p);
  const input=p.querySelector('input'), status=p.querySelector('.jstatus'), sel=p.querySelector('select');
  input.addEventListener('change',async()=>{
    const f=input.files&&input.files[0]; if(!f)return;
    const eid=sel.value;
    const title=(sel.selectedOptions[0]||{}).textContent||'';
    const path=await upload(day,eid,title,f,status);
    if(path){
      const m=counts[day]||(counts[day]={}); m[eid]=(m[eid]||0)+1;
      const ev=sec.querySelector(`.viewlist .ev[data-eid="${CSS.escape(eid)}"]`);
      if(ev){setChip(ev,m[eid]);
        const th=ev.querySelector('.jpanel .jthumbs');
        if(th)th.insertAdjacentHTML('afterbegin',`<a href="${pubUrl(path)}" target="_blank" rel="noopener"><img src="${pubUrl(path)}" alt=""></a>`);}
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
    if(a && Date.now()-new Date(a.created_at).getTime()<24*3600*1000){
      bar.innerHTML=`<div class="anunt">📣 ${esc(a.text)} <small>${fmtT(a.created_at)}</small></div>`;
    } else bar.innerHTML='';
  }catch(e){}
}

/* ── blocurile live din +info (acordeon, încărcate la deschidere) ── */
let infoBuilt=false;
function buildInfo(){
  if(infoBuilt)return; infoBuilt=true;
  const grid=document.querySelector('#day-info .info-grid'); if(!grid)return;

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

  const fb=document.createElement('div');
  fb.className='iblock acc'; fb.setAttribute('data-live','');
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
    injectDayAdd(d);
    if(!loadedDays.has(d)){loadedDays.add(d);refreshCounts(d);}
  };
  const today=document.querySelector('.daychip[aria-selected="true"]');
  if(today&&today.dataset.day) onDay(today.dataset.day);
  document.addEventListener('daychange',e=>onDay(e.detail));
})();
})();
