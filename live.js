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
const sbGetCount=async p=>{const r=await sb('/rest/v1'+p,{headers:{Prefer:'count=exact'}});
  if(!r.ok)throw new Error('sb');
  const total=+((r.headers.get('content-range')||'/0').split('/')[1])||0;
  return {rows:await r.json(),total};};
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

/* camera din colțul cardului: goală doar pe ziua curentă (pozele se fac
   pe loc); pe celelalte zile apare doar contorul, unde există poze */
function mkCorner(ev){
  let b=ev.querySelector('.jcorner');
  if(!b){
    b=document.createElement('button');
    b.className='jcorner'; b.title='jurnal foto'; b.textContent='📷';
    (ev.querySelector('.tcol')||ev).appendChild(b);
    b.addEventListener('click',e=>{e.stopPropagation();toggleGallery(ev,b);});
  }
  return b;
}
/* camera goală există doar pe evenimentele în desfășurare chiar acum */
function syncCameras(){
  document.querySelectorAll('.jcorner:not(.has)').forEach(b=>{
    const ev=b.closest('.ev');
    if(!ev||!ev.classList.contains('now-active'))b.remove();
  });
  document.querySelectorAll('.ev.now-active:not(.compact)').forEach(ev=>mkCorner(ev));
}
document.addEventListener('nowchange',syncCameras);
function setCorner(ev,n){
  if(!n){const b=ev.querySelector('.jcorner');if(b){b.textContent='📷';b.classList.remove('has');}return;}
  const b=mkCorner(ev);
  b.textContent=`📷 ${n}`;
  b.classList.add('has');
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
  const PAGE=12;
  let rows=[], total=0;
  try{({rows,total}=await sbGetCount(`/jurnal_photos?event_id=eq.${encodeURIComponent(eid)}&select=path&order=created_at.desc&limit=${PAGE}`));}
  catch(e){panel.innerHTML='<p class="jnote">indisponibil</p>';return;}
  const thumb=path=>`<a href="${pubUrl(path)}" target="_blank" rel="noopener"><img loading="lazy" src="${pubUrl(path)}" alt=""></a>`;
  panel.innerHTML=`<label class="jadd">+ adaugă poză<input type="file" accept="image/*" hidden></label>
    <span class="jnote jstatus"></span>
    <div class="jthumbs">${rows.map(r=>thumb(r.path)).join('')}</div>
    ${total>rows.length?`<button class="jmore">încă ${total-rows.length} poze</button>`:''}`;
  let shown=rows.length;
  const more=panel.querySelector('.jmore');
  if(more)more.addEventListener('click',async()=>{
    try{
      const next=await sbGet(`/jurnal_photos?event_id=eq.${encodeURIComponent(eid)}&select=path&order=created_at.desc&limit=24&offset=${shown}`);
      panel.querySelector('.jthumbs').insertAdjacentHTML('beforeend',next.map(r=>thumb(r.path)).join(''));
      shown+=next.length;
      if(shown>=total||!next.length)more.remove();
      else more.textContent=`încă ${total-shown} poze`;
    }catch(e){}
  });
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
document.addEventListener('click',e=>{
  const a=e.target.closest('.jthumbs a');
  if(!a)return;
  e.preventDefault();
  lightbox(a.getAttribute('href'));
});

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
  an.querySelector('h3').addEventListener('click',()=>{
    /* la click starea .open încă nu e comutată de acordeon; anticipăm */
    if(!an.classList.contains('open'))renderAn();
  });
  /* publicarea e deschisă pentru oricine are pagina: e o alegere de
     încredere a echipei; curățenia se face din dashboard, la nevoie */
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
  let jaLoaded=false, jaShown=0, jaTotal=0, jaLastDay=null;
  const DAYLBL=(typeof DAYS!=='undefined')?Object.fromEntries(DAYS.map(d=>[d.id,`${d.h2} ${d.full}`])):{};
  const jaThumb=r=>`<a href="${pubUrl(r.path)}" target="_blank" rel="noopener" title="${esc(r.title)}"><img loading="lazy" src="${pubUrl(r.path)}" alt="${esc(r.title)}"></a>`;
  async function jaLoad(){
    const box=ja.querySelector('.jall');
    try{
      const {rows,total}=await sbGetCount(`/jurnal_photos?select=path,title,day&order=created_at.desc&limit=48&offset=${jaShown}`);
      jaTotal=total;
      if(!jaShown&&!rows.length){box.innerHTML='<p class="jnote">încă nicio poză · fii tu prima persoană care prinde momentul</p>';return;}
      if(!jaShown)box.innerHTML='';
      const old=box.querySelector('.jmore'); if(old)old.remove();
      rows.forEach(r=>{
        if(r.day!==jaLastDay){
          jaLastDay=r.day;
          box.insertAdjacentHTML('beforeend',`<p class="jday-h">${esc(DAYLBL[r.day]||r.day)}</p><div class="jthumbs"></div>`);
        }
        [...box.querySelectorAll('.jthumbs')].pop().insertAdjacentHTML('beforeend',jaThumb(r));
      });
      jaShown+=rows.length;
      if(jaShown<jaTotal)box.insertAdjacentHTML('beforeend',`<button class="jmore">încă ${jaTotal-jaShown} poze</button>`);
      const m=box.querySelector('.jmore'); if(m)m.addEventListener('click',jaLoad);
    }catch(e){if(!jaShown)box.innerHTML='<p class="jnote">indisponibil</p>';}
  }
  ja.querySelector('h3').addEventListener('click',()=>{
    const willOpen=!ja.classList.contains('open');
    if(!willOpen||jaLoaded)return; jaLoaded=true;
    ja.querySelector('.jall').innerHTML='<p class="jnote">se încarcă…</p>';
    jaLoad();
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
    syncCameras();
    if(!loadedDays.has(d)){loadedDays.add(d);refreshCounts(d);}
  };
  const today=document.querySelector('.daychip[aria-selected="true"]');
  if(today&&today.dataset.day) onDay(today.dataset.day);
  document.addEventListener('daychange',e=>onDay(e.detail));
})();
})();
