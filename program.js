/* ============================================================
   PROGRAMUL INTERN #21 · datele paginii
   Editează acest fișier când se schimbă programul, apoi push pe
   main: pagina se republică automat (GitHub Actions -> Pages).

   Tipuri de intrări (k):
     e = eveniment    t = transport    m = masă    x = @tehnic
   Câmpuri eveniment:
     t / e   ora de început / final ("HH:MM"; după miezul nopții
             folosește 00:xx-04:xx, se sortează la finalul zilei)
     cat     una din cheile CATS de mai jos
     loc     locația (numele scurt); locd = detaliu (sală, scenă)
     col     forțează coloana din vederea "pe locații"
             (cmt / mare / mica / kauf / sc5) când loc nu e clar
     c:true  rând compact (montări, repetiții, probe) - intră și
             sub comutatorul @tehnic
     sub     rânduri de detalii (invitați, vârste, durate)
     xlabel/xlist  listă expandabilă (de ex. sesiuni masterclass)
   ============================================================ */

const LAST_UPDATED = '22.07.2026';

/* Demo pentru marcajul "acum" în afara zilelor de festival:
   'zi-oră' (de ex. 'v31-19:32') sau null ca să îl stingi.
   În timpul festivalului ora reală are mereu prioritate. */
const DEMO_NOW = null;

/* data calendaristică -> ziua din program (pentru "acum") */
const DATEMAP = {
  '28.07.2026':'ma28', '29.07.2026':'mi29', '30.07.2026':'j30',
  '31.07.2026':'v31',  '01.08.2026':'s1',   '02.08.2026':'d2',
  '03.08.2026':'l3',   '04.08.2026':'ma4',  '05.08.2026':'mi5',
};

const CATS = {
  tt:      {label:'teatru tânăr · spectacole & repetiții', color:'#FF6E64'},
  ateliere:{label:'ateliere trupe & arte alăturate',       color:'#FF7AB8'},
  artplay: {label:'ateliere Art&Play',                     color:'#CCC8F1'},
  cmt:     {label:'CMT · spectacole indoor & gale',        color:'#E7004C'},
  mare:    {label:'piața · scena mare',                    color:'#1FA35F'},
  mica:    {label:'piața · scena mică',                    color:'#3D9BE9'},
  cine:    {label:'cinemateca târzie',                     color:'#00A5A0'},
  kauf:    {label:'copii · Kaufland',                      color:'#F28C28'},
  parada:  {label:'paradă papainoage',                     color:'#B48CF2'},
  alt:     {label:'organizare & altele',                   color:'#8b8e98'},
};

/* linkuri Google Maps pentru tabul +info */
const MAPQ = {
  'CMT':'Centrul Multifunctional pentru Tineri Alexandria',
  'Piața Ideo Ideis':'Strada Libertatii Alexandria Teleorman',
  'Kaufland':'Kaufland Alexandria',
  'Școala 5':'Scoala Gimnaziala nr 5 Mihai Eminescu Alexandria',
  'Sala sport „Mihai Viteazul”':'Scoala Mihai Viteazul Alexandria',
  'Sala sport „Ștefan cel Mare”':'Scoala Gimnaziala Stefan cel Mare Alexandria',
  'Alex Tell':'Alex Tell Alexandria',
  'Cămin':'Grup Scolar Tehnic Alexandria Teleorman',
  'Ștrand':'Strand Vedea Alexandria',
  'Conciato':'Conciato Alexandria',
  'Primărie':'Primaria Municipiului Alexandria',
};

const DAYS = [
 {id:'ma28', dw:'ma', dn:'28', full:'28 iulie', h2:'marți', events:[
   {k:'x', tr:true, t:'oră TBC', ts:'09:00', text:'preluare decor · UNATC → CMT · echipamente + costume & picioroange · Duba Autocora'},
   {k:'x', tr:true, t:'oră TBC', ts:'09:05', text:'preluare · Teatrul Național București · videoproiector & case'},
   {k:'x', tr:true, t:'oră TBC', ts:'09:10', text:'preluare · Teatrul Național Craiova · echipamente sonorizare'},
   {k:'e', t:'19:00', e:'21:00', cat:'alt', loc:'Conciato', title:'quiz civic pentru voluntari', sub:['cu FORUM APULUM']},
 ]},
 {id:'mi29', dw:'mi', dn:'29', full:'29 iulie', h2:'miercuri', events:[
   {k:'x', tr:true, t:'oră TBC', ts:'09:00', text:'preluare decor · UNATC → CMT · scena UNATC · microbuz Excelsior'},
   {k:'e', t:'10:00', e:'13:00', cat:'alt', loc:'CMT', locd:'sală de conf. / ceainărie (de confirmat)', title:'Bootcamp MASCA', sub:['școala de vară']},
   {k:'e', t:'08:30', e:'13:00', cat:'alt', loc:'Cămin', title:'sosiri trupe'},
   {k:'t', t:'13:00', route:'Cămin → CMT', note:'curse la 13:00 și 13:15'},
   {k:'e', t:'13:30', e:'14:30', cat:'cmt', loc:'CMT', title:'conferință interactivă In a Relationship'},
   {k:'e', t:'14:00', e:'15:00', cat:'alt', loc:'Primărie', locd:'Sala de Consiliu', title:'ședință coordonatori'},
   {k:'x', t:'15:00–19:00', ts:'15:00', text:'montare „Charlie Chaplin” (Teatrul Mic) · CMT'},
   {k:'x', t:'19:00–20:00', ts:'19:00', text:'probe gală · CMT'},
   {k:'t', t:'15:05', route:'traseu de confirmat'},
   {k:'e', t:'17:00', e:'17:30', cat:'alt', loc:'loc de confirmat', title:'întâlnire mentori · participanți'},
   {k:'t', t:'18:00', route:'Cămin → CMT'},
   {k:'m', t:'18:20', e:'19:45', meal:'cină', loc:'Alex Tell'},
   {k:'e', t:'20:00', e:'21:00', cat:'cmt', loc:'CMT', title:'paradă papainoage „Actori la înălțime” & gală de deschidere', sub:['parada: UNATC · indoor']},
   {k:'e', t:'21:00', e:'22:30', cat:'cmt', loc:'CMT', title:'„Charlie Chaplin · The X-ray of his soul”', sub:['Teatrul Mic, București · 1 h 30']},
   {k:'t', t:'22:45', route:'CMT → Ștrand'},
   {k:'e', t:'23:00', e:'23:30', cat:'alt', loc:'Ștrand', locd:'Ștrandul Vedea', title:'concert trupă rock din Alexandria'},
   {k:'e', t:'23:30', e:'01:00', cat:'alt', loc:'Ștrand', title:'opening party · 4play'},
   {k:'t', t:'01:00', route:'Ștrand → Cămin'},
 ]},
 {id:'j30', dw:'j', dn:'30', full:'30 iulie', h2:'joi', events:[
   {k:'x', tr:true, t:'oră TBC', ts:'08:34', text:'preluare · Intimisfera & Facultatea de Arhitectură · băncuțe (TBC)'},
   {k:'e', t:'10:00', e:'13:00', cat:'alt', loc:'CMT', locd:'sală de conf. / ceainărie (de confirmat)', title:'Bootcamp MASCA', sub:['școala de vară']},
   {k:'t', t:'08:15', route:'Cămin → CMT'},
   {k:'m', t:'08:30', e:'09:45', meal:'mic dejun', loc:'Alex Tell'},
   {k:'e', t:'10:00', e:'14:00', cat:'ateliere', loc:'Școala 5', title:'ateliere teatru tânăr'},
   {k:'e', t:'10:00', e:'14:00', cat:'ateliere', loc:'Școala 5', title:'atelier Train the Coordinators', sub:['mentori & coordonatori']},
   {k:'e', t:'10:00', e:'10:30', cat:'parada', loc:'Kaufland', locd:'în magazin', title:'paradă papainoage „Actori la înălțime”', sub:['UNATC']},
   {k:'e', t:'10:30', e:'12:30', cat:'artplay', loc:'Școala 5', title:'Show Your Moves', sub:['atelier de dans · breaking']},
   {k:'e', t:'14:00', e:'16:00', cat:'artplay', loc:'Școala 5', title:'Stand Up împotriva hărțuirii stradale', sub:['activism feminist']},
   {k:'m', t:'14:00', e:'15:30', meal:'prânz', loc:'Alex Tell'},
   {k:'e', t:'15:00', e:'16:00', c:true, cat:'tt', loc:'CMT', trupa:'atelierul', title:'repetiție · <b>Atelierul de Teatru</b>'},
   {k:'t', t:'15:30', route:'CMT → Cămin'},
   {k:'e', t:'16:00', e:'17:00', c:true, cat:'tt', loc:'CMT', trupa:'leira', title:'repetiție și montare · <b>Trupa Leira</b>'},
   {k:'t', t:'16:40', route:'Cămin → CMT', trupa:'leira', note:'Trupa Leira'},
   {k:'t', t:'16:40', route:'CMT → Cămin', trupa:'atelierul', note:'Atelierul de Teatru'},
   {k:'t', t:'17:30', route:'Cămin → CMT'},
   {k:'e', t:'18:00', e:'19:00', cat:'tt', loc:'CMT', trupa:'leira', title:'spectacol teatru tânăr · Trupa Leira'},
   {k:'e', t:'19:15', e:'19:35', cat:'alt', loc:'CMT', trupa:'leira', title:'feedback cu mentorii · Trupa Leira'},
   {k:'m', t:'19:00', e:'20:00', meal:'cină', loc:'Alex Tell', trupa:'atelierul', note:'Atelierul de Teatru'},
   {k:'m', t:'19:00', e:'20:30', meal:'cină', loc:'Alex Tell'},
   {k:'e', t:'19:30', e:'20:00', c:true, cat:'tt', loc:'CMT', trupa:'atelierul', title:'montare · <b>Atelierul de Teatru</b>'},
   {k:'e', t:'20:30', e:'21:30', cat:'tt', loc:'CMT', trupa:'atelierul', title:'spectacol teatru tânăr · Atelierul de Teatru'},
   {k:'e', t:'21:45', e:'22:15', cat:'alt', loc:'CMT', trupa:'atelierul', title:'feedback cu mentorii · Atelierul de Teatru'},
   {k:'e', t:'21:30', e:'22:00', cat:'parada', loc:'Piața Ideo Ideis', title:'paradă papainoage „Actori la înălțime”', sub:['UNATC']},
   {k:'t', t:'21:45', route:'CMT → Cămin'},
   {k:'e', t:'21:30', e:'22:30', c:true, cat:'cine', loc:'Piața Ideo Ideis', locd:'scena mare', title:'montare cinematecă · „Catane”'},
   {k:'e', t:'22:30', e:'00:30', cat:'cine', loc:'Piața Ideo Ideis', title:'cinemateca târzie · „Catane”', sub:['1 h 36 · invitat TBC']},
   {k:'t', t:'00:15', route:'Piața Ideo Ideis → Cămin'},
 ]},
 {id:'v31', dw:'v', dn:'31', full:'31 iulie', h2:'vineri', events:[
   {k:'e', t:'10:00', e:'13:00', cat:'alt', loc:'CMT', locd:'sală de conf. / ceainărie (de confirmat)', title:'Bootcamp MASCA', sub:['școala de vară']},
   {k:'t', t:'08:15', route:'Cămin → CMT'},
   {k:'m', t:'08:30', e:'09:45', meal:'mic dejun', loc:'Alex Tell'},
   {k:'e', t:'10:00', e:'14:00', cat:'ateliere', loc:'Școala 5', title:'ateliere teatru tânăr'},
   {k:'e', t:'10:00', e:'14:00', cat:'ateliere', loc:'Școala 5', title:'atelier Train the Coordinators', sub:['mentori & coordonatori']},
   {k:'e', t:'10:00', e:'10:30', cat:'parada', loc:'Kaufland', locd:'în magazin', title:'paradă papainoage „Actori la înălțime”', sub:['UNATC']},
   {k:'x', tr:true, t:'oră TBC', ts:'10:30', text:'amenajare spațiu copii (CIAA) · monociclu Vlad Benescu, șezlonguri, mese & scaune copii, hamace · transportat pe 30 iul · Ștefan Craiu 0730 485 374'},
   {k:'e', t:'10:30', e:'12:30', cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'sesiune face painting', sub:['cu Alexa Istrate']},
   {k:'e', t:'10:30', e:'12:30', cat:'artplay', loc:'Școala 5', title:'Se întâmplă între N-O-I', sub:['psihoeducație · 10-13 ani']},
   {k:'e', t:'10:30', e:'12:30', cat:'artplay', loc:'Școala 5', title:'Show Your Moves', sub:['atelier de dans · breaking']},
   {k:'e', t:'11:00', e:'13:00', cat:'artplay', loc:'Școala 5', title:'Pauza de la dezinformare', sub:['educație media pentru profesori']},
   {k:'e', t:'11:30', e:'13:00', cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'atelier „Brățările prieteniei”', sub:['CIAA']},
   {k:'m', t:'14:00', e:'15:30', meal:'prânz', loc:'Alex Tell'},
   {k:'e', t:'14:30', e:'16:30', cat:'artplay', loc:'Școala 5', title:'Se întâmplă între N-O-I', sub:['psihoeducație · 14-18 ani']},
   {k:'e', t:'15:00', e:'18:00', cat:'artplay', loc:'Școala 5', title:'De la pasiune la profesie: unde-i locul meu?', sub:['orientare vocațională']},
   {k:'e', t:'15:00', e:'17:00', cat:'artplay', loc:'Școala 5', title:'Mintea ta nu e a ta (în totalitate)', sub:['AI, biasuri și persuasiune · educație media pentru copii']},
   {k:'t', t:'15:30', route:'CMT → Cămin'},
   {k:'e', t:'15:30', e:'16:30', c:true, cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'repetiție · „Bunicul și bunica se poartă ciudat”'},
   {k:'t', t:'16:30', route:'Cămin → CMT', trupa:'artwork', note:'Artwork'},
   {k:'e', t:'16:30', e:'17:30', c:true, cat:'tt', loc:'CMT', trupa:'artwork', title:'repetiție și montare · <b>Artwork</b>'},
   {k:'e', t:'17:00', e:'17:50', cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'spectacol „Bunicul și bunica se poartă ciudat”', sub:['cu Alexa Istrate']},
   {k:'t', t:'17:30', route:'Cămin → CMT'},
   {k:'e', t:'18:00', e:'19:00', cat:'tt', loc:'CMT', trupa:'artwork', title:'spectacol teatru tânăr · Artwork'},
   {k:'e', t:'19:15', e:'19:35', cat:'alt', loc:'CMT', trupa:'artwork', title:'feedback cu mentorii · Artwork'},
   {k:'e', t:'17:00', e:'18:00', c:true, cat:'mare', loc:'Piața Ideo Ideis', locd:'scena mare', title:'montare · Bine de știut #1'},
   {k:'e', t:'18:00', e:'19:00', cat:'mare', loc:'Piața Ideo Ideis', locd:'scena mare', title:'Bine de știut #1 · adicția de jocuri de noroc', sub:['cu Alex Bogdan']},
   {k:'e', t:'18:00', e:'19:30', cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'sesiune face painting', sub:['cu Alexa Istrate']},
   {k:'x', tr:true, t:'oră TBC', ts:'18:30', text:'decor „Covor, plante, poezie” · covor 4 × 2,5 m · transportat pe 30 iul · Ana Maria Pop 0748 611 488'},
   {k:'e', t:'18:30', e:'20:30', c:true, cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'montare · „Covor, plante, poezie”'},
   {k:'m', t:'19:00', e:'20:30', meal:'cină', loc:'Alex Tell'},
   {k:'e', t:'19:00', e:'20:30', cat:'mare', loc:'Piața Ideo Ideis', locd:'scena mare', title:'Seara Povestitorilor #1', sub:['cu Andreea Archip']},
   {k:'e', t:'19:00', e:'21:00', cat:'kauf', loc:'Kaufland', locd:'în parcare', title:'Atelierul de joacă', sub:['CIAA']},
   {k:'e', t:'19:30', e:'20:00', c:true, cat:'cmt', loc:'CMT', title:'montare masterclass'},
   {k:'e', t:'20:00', e:'22:15', cat:'cmt', loc:'CMT', title:'masterclass', xlabel:'vezi sesiunile', xlist:[['20:00–21:00','Geo Adrian & Sabina Balan · de la teatru la stand-up'],['21:15–22:15','Alex Bogdan & Mara Oprea · „Viață în lucru”']]},
   {k:'e', t:'20:30', e:'21:30', cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'Covor, plante, poezie'},
   {k:'e', t:'21:30', e:'22:00', cat:'parada', loc:'Piața Ideo Ideis', locd:'scena mică → scena mare', title:'paradă papainoage „Actori la înălțime”', sub:['UNATC']},
   {k:'e', t:'22:00', e:'23:00', cat:'alt', loc:'Alex Tell', title:'standup: Sabina Balan, Larisa Bănuță, Theodor Abagiu, Geo Adrian'},
   {k:'t', t:'22:30', route:'spre Cămin'},
   {k:'e', t:'21:30', e:'22:30', c:true, cat:'cine', loc:'Piața Ideo Ideis', locd:'scena mare', title:'montare cinematecă · „De capul nostru”'},
   {k:'e', t:'22:30', e:'00:30', cat:'cine', loc:'Piața Ideo Ideis', locd:'scena mare', title:'cinemateca târzie · „De capul nostru”', sub:['1 h 34 · Q&A cu Tudor Jurgiu (30 min)']},
   {k:'t', t:'00:15', route:'Piața Ideo Ideis → Cămin'},
 ]},
 {id:'s1', dw:'s', dn:'1', full:'1 august', h2:'sâmbătă', events:[
   {k:'t', t:'08:15', route:'Cămin → CMT'},
   {k:'m', t:'08:30', e:'09:45', meal:'mic dejun', loc:'Alex Tell'},
   {k:'e', t:'10:00', e:'14:00', cat:'ateliere', loc:'Școala 5', title:'ateliere teatru tânăr'},
   {k:'e', t:'10:00', e:'14:00', cat:'ateliere', loc:'Școala 5', title:'atelier Train the Coordinators', sub:['mentori & coordonatori']},
   {k:'e', t:'10:00', e:'12:30', cat:'artplay', loc:'Școala 5', title:'Siguranța bebelușului', sub:['puericultură · pentru părinți']},
   {k:'e', t:'10:00', e:'10:30', cat:'parada', loc:'Kaufland', locd:'în magazin', title:'paradă papainoage „Actori la înălțime”', sub:['UNATC']},
   {k:'x', tr:true, t:'oră TBC', ts:'10:00', text:'decor „Party” · de la Teatrul Metropolis · transportat pe 30 iul · Duba mare Autocora · Vlad Moszojanu 0733 304 923'},
   {k:'e', t:'10:00', e:'16:30', c:true, cat:'cmt', loc:'CMT', title:'montare și repetiție · <b>PARTY</b> (Teatrul Metropolis)'},
   {k:'e', t:'10:00', e:'10:30', c:true, cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'repetiție · „Când mă fac mare”'},
   {k:'e', t:'10:30', e:'12:00', cat:'kauf', loc:'Kaufland', locd:'în parcare', title:'cursa cu obstacole & alte jocuri antrenante', sub:['CIAA']},
   {k:'e', t:'10:30', e:'12:30', cat:'artplay', loc:'Școala 5', title:'Se întâmplă între N-O-I', sub:['psihoeducație · 10-13 ani']},
   {k:'e', t:'10:30', e:'12:30', cat:'artplay', loc:'Școala 5', title:'Show Your Moves', sub:['atelier de dans · breaking']},
   {k:'e', t:'10:30', e:'11:20', cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'spectacol „Când mă fac mare · Eric și Ema vorbesc despre meserii”', sub:['cu Alexa Istrate']},
   {k:'e', t:'11:30', e:'13:30', cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'sesiune face painting', sub:['cu Alexa Istrate']},
   {k:'m', t:'14:00', e:'15:30', meal:'prânz', loc:'Alex Tell', note:'servit de traineri'},
   {k:'e', t:'14:30', e:'16:30', cat:'artplay', loc:'Școala 5', title:'Se întâmplă între N-O-I', sub:['psihoeducație · 14-18 ani']},
   {k:'e', t:'15:00', e:'18:00', cat:'artplay', loc:'Școala 5', title:'De la pasiune la profesie: unde-i locul meu?', sub:['orientare vocațională']},
   {k:'t', t:'15:30', route:'CMT → Cămin'},
   {k:'e', t:'15:30', e:'16:45', c:true, cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'repetiție · „Țup”'},
   {k:'t', t:'16:30', route:'Cămin → CMT', trupa:'amprente', note:'Amprente'},
   {k:'e', t:'16:30', e:'17:30', c:true, cat:'tt', loc:'CMT', trupa:'amprente', title:'repetiție și montare · <b>Amprente</b>'},
   {k:'e', t:'17:00', e:'19:00', cat:'kauf', loc:'Kaufland', locd:'în parcare', title:'sesiune face painting', sub:['cu Alexa Istrate']},
   {k:'e', t:'17:00', e:'17:50', cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'spectacol „Țup · Imposibil e doar un cuvânt”', sub:['CIAA']},
   {k:'t', t:'17:30', route:'Cămin → CMT'},
   {k:'e', t:'17:45', e:'18:00', c:true, cat:'mare', loc:'Piața Ideo Ideis', locd:'scena mare', title:'probe sunet · invitați'},
   {k:'e', t:'17:30', e:'18:00', c:true, cat:'mare', loc:'Piața Ideo Ideis', locd:'scena mare', title:'montare · Bine de știut #2'},
   {k:'e', t:'18:00', e:'19:00', cat:'mare', loc:'Piața Ideo Ideis', locd:'scena mare', title:'Bine de știut #2 · fraude financiare', sub:['cu Bogdan Ghebaur']},
   {k:'e', t:'18:00', e:'19:00', cat:'tt', loc:'CMT', trupa:'amprente', title:'spectacol teatru tânăr · Amprente'},
   {k:'e', t:'19:15', e:'19:35', cat:'alt', loc:'CMT', trupa:'amprente', title:'feedback cu mentorii · Amprente'},
   {k:'e', t:'19:15', e:'20:30', c:true, cat:'cmt', loc:'CMT', title:'montare decor · PARTY (Teatrul Metropolis)'},
   {k:'m', t:'19:00', e:'20:30', meal:'cină', loc:'Alex Tell'},
   {k:'e', t:'19:00', e:'20:30', cat:'mare', loc:'Piața Ideo Ideis', locd:'scena mare', title:'Seara Povestitorilor #2', sub:['cu Lucian Prună']},
   {k:'e', t:'19:30', e:'22:30', c:true, cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'montare · Multisenzorial'},
   {k:'e', t:'20:30', e:'22:00', cat:'cmt', loc:'CMT', title:'PARTY', sub:['Teatrul Metropolis, București · 1 h 30']},
   {k:'e', t:'20:30', e:'21:00', cat:'parada', loc:'Piața Ideo Ideis', locd:'scena mare', title:'paradă papainoage „Actori la înălțime”', sub:['UNATC']},
   {k:'e', t:'21:00', e:'21:30', cat:'mare', loc:'Piața Ideo Ideis', locd:'scena mare', title:'spectacol de jonglerie cu lumini', sub:['cu Vlad Benescu · CIAA']},
   {k:'e', t:'22:00', c:true, cat:'mare', loc:'Piața Ideo Ideis', locd:'scena mare', title:'setare lumini · Zestrea (pt. spectacolul de mâine)', sub:['oră TBC']},
   {k:'t', t:'22:15', route:'CMT → Cămin'},
   {k:'e', t:'22:30', e:'23:45', cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'concert Multisenzorial', sub:['1 h 15']},
   {k:'t', t:'00:00', route:'Piața Ideo Ideis → Cămin'},
 ]},
 {id:'d2', dw:'d', dn:'2', full:'2 august', h2:'duminică', events:[
   {k:'x', tr:true, t:'oră TBC', ts:'08:30', text:'retur decor · UNATC · scena UNATC · microbuz Excelsior'},
   {k:'t', t:'08:15', route:'Cămin → CMT'},
   {k:'m', t:'08:30', e:'09:45', meal:'mic dejun', loc:'Alex Tell'},
   {k:'e', t:'10:00', e:'10:30', c:true, cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'repetiție și montare · „Năzdrăvanii mărilor”'},
   {k:'e', t:'10:00', e:'14:00', cat:'ateliere', loc:'Școala 5', title:'ateliere arte alăturate', sub:['+ sălile de sport „Mihai Viteazul” & „Ștefan cel Mare”']},
   {k:'e', t:'10:00', e:'14:00', cat:'ateliere', loc:'Școala 5', title:'atelier Train the Coordinators', sub:['mentori & coordonatori']},
   {k:'e', t:'10:00', e:'16:30', c:true, cat:'cmt', loc:'CMT', title:'montare și repetiție · <b>ODD COUTURE</b>'},
   {k:'e', t:'10:00', e:'12:30', cat:'artplay', loc:'Școala 5', title:'Prim ajutor pediatric', sub:['Asociația Moașelor']},
   {k:'e', t:'10:00', e:'12:00', cat:'artplay', loc:'Școala 5', title:'Animalul care te locuiește', sub:['atelier de arte grafice']},
   {k:'e', t:'10:00', e:'10:30', cat:'parada', loc:'Kaufland', locd:'în magazin', title:'paradă papainoage „Actori la înălțime”', sub:['UNATC']},
   {k:'e', t:'10:30', e:'12:00', cat:'kauf', loc:'Kaufland', locd:'în parcare', title:'face painting & baloane', sub:['CIAA']},
   {k:'e', t:'10:30', e:'12:30', cat:'artplay', loc:'Școala 5', title:'Se întâmplă între N-O-I', sub:['psihoeducație · 10-13 ani']},
   {k:'e', t:'10:30', e:'11:30', cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'spectacol pentru copii · „Năzdrăvanii mărilor”', sub:['cu Edi Cîrlan']},
   {k:'x', tr:true, t:'oră TBC', ts:'11:00', text:'decor „Zestrea” · de la UNATC · transportat pe 30 iul · Bianca Geantă 0770 829 611'},
   {k:'e', t:'11:00', e:'13:30', c:true, cat:'mare', loc:'Piața Ideo Ideis', locd:'scena mare', title:'repetiție · Zestrea'},
   {k:'e', t:'12:30', e:'13:30', cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'atelier cu păpuși', sub:['CIAA']},
   {k:'m', t:'14:00', e:'15:30', meal:'prânz', loc:'Alex Tell'},
   {k:'e', t:'14:30', e:'16:30', cat:'artplay', loc:'Școala 5', title:'Se întâmplă între N-O-I', sub:['psihoeducație · 14-18 ani']},
   {k:'e', t:'15:00', e:'18:00', cat:'artplay', loc:'Școala 5', title:'De la pasiune la profesie: unde-i locul meu?', sub:['orientare vocațională']},
   {k:'t', t:'15:30', route:'CMT → Cămin'},
   {k:'e', t:'16:00', e:'18:00', cat:'artplay', loc:'Piața Ideo Ideis', locd:'lângă scena mică', title:'Alexandria la 50 de grade', sub:['atelier de prospectivă']},
   {k:'t', t:'16:30', route:'Cămin → CMT', trupa:'brainstorming', note:'Brainstorming'},
   {k:'e', t:'16:30', e:'17:30', c:true, cat:'tt', loc:'CMT', trupa:'brainstorming', title:'repetiție și montare · <b>Brainstorming</b>'},
   {k:'e', t:'17:00', e:'18:00', cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'atelier de inițiere în jonglerie', sub:['cu Vlad Benescu · CIAA']},
   {k:'t', t:'17:30', route:'Cămin → CMT'},
   {k:'e', t:'18:00', e:'19:00', cat:'tt', loc:'CMT', trupa:'brainstorming', title:'spectacol teatru tânăr · Brainstorming'},
   {k:'e', t:'19:15', e:'19:35', cat:'alt', loc:'CMT', trupa:'brainstorming', title:'feedback cu mentorii · Brainstorming'},
   {k:'e', t:'17:30', e:'18:00', c:true, cat:'mare', loc:'Piața Ideo Ideis', locd:'scena mare', title:'montare · Bine de știut #3'},
   {k:'e', t:'18:00', e:'19:00', cat:'mare', loc:'Piața Ideo Ideis', locd:'scena mare', title:'Bine de știut #3 · screening HPV', sub:['cu Irina Mateescu']},
   {k:'e', t:'18:00', e:'18:30', cat:'parada', loc:'Kaufland', locd:'în magazin', title:'paradă papainoage „Actori la înălțime”', sub:['UNATC']},
   {k:'e', t:'18:30', e:'20:00', cat:'kauf', loc:'Kaufland', locd:'în parcare', title:'Atelierul de joacă', sub:['CIAA']},
   {k:'m', t:'19:00', e:'20:30', meal:'cină', loc:'Alex Tell'},
   {k:'e', t:'19:00', e:'20:30', cat:'mare', loc:'Piața Ideo Ideis', locd:'scena mare', title:'Seara Povestitorilor #3 · „Cum e să fii tată?”', sub:['cu Mihai Duțescu & Victor Ilie']},
   {k:'e', t:'19:30', e:'20:00', c:true, cat:'cmt', loc:'CMT', title:'montare spectacol profesionist'},
   {k:'e', t:'20:30', e:'22:15', cat:'cmt', loc:'CMT', title:'ODD COUTURE', sub:['spectacol profesionist · 1 h 45']},
   {k:'e', t:'20:30', e:'21:00', cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'Wheels in Motion', sub:['cu Vlad Benescu · CIAA']},
   {k:'e', t:'20:30', e:'21:30', c:true, cat:'mare', loc:'Piața Ideo Ideis', locd:'scena mare', title:'montare · Zestrea'},
   {k:'e', t:'21:30', e:'22:30', cat:'mare', loc:'Piața Ideo Ideis', locd:'scena mare', title:'Zestrea', sub:['UNATC · 50 min']},
   {k:'t', t:'22:30', route:'CMT → Cămin'},
   {k:'e', t:'22:15', e:'22:30', c:true, cat:'cine', loc:'CMT', title:'montare cinematecă · „Malul Vânăt”'},
   {k:'e', t:'22:30', e:'00:30', cat:'cine', loc:'CMT', title:'cinemateca târzie · „Malul Vânăt”', sub:['1 h 32 · Q&A cu Andreea Cristina Borțun (30 min)']},
   {k:'t', t:'00:15', route:'CMT → Cămin'},
 ]},
 {id:'l3', dw:'l', dn:'3', full:'3 august', h2:'luni', events:[
   {k:'x', tr:true, t:'08:00–10:00', ts:'08:00', text:'retur decor „Party” · CMT → Teatrul Metropolis · Duba mare Autocora · Vlad Moszojanu 0733 304 923'},
   {k:'x', tr:true, t:'oră TBC', ts:'08:31', text:'retur decor Zestrea · UNATC · Bianca Geantă 0770 829 611'},
   {k:'x', tr:true, t:'oră TBC', ts:'08:32', text:'retur · CIAA · monociclu + decor spațiu copii · Ștefan Craiu 0730 485 374'},
   {k:'x', tr:true, t:'oră TBC', ts:'08:33', text:'retur · Covor Plante Poezie · covor 4 × 2,5 m · Ana Maria Pop 0748 611 488'},
   {k:'x', tr:true, t:'oră TBC', ts:'08:34', text:'retur · Intimisfera & Facultatea de Arhitectură · băncuțe (TBC)'},
   {k:'x', t:'toată ziua', ts:'08:00', text:'demontare și strâns outdoor · Piața Ideo Ideis'},
   {k:'t', t:'08:15', route:'Cămin → CMT'},
   {k:'m', t:'08:30', e:'09:45', meal:'mic dejun', loc:'Alex Tell'},
   {k:'e', t:'10:00', e:'14:00', cat:'ateliere', loc:'Școala 5', title:'ateliere arte alăturate', sub:['+ sălile de sport „Mihai Viteazul” & „Ștefan cel Mare”']},
   {k:'e', t:'10:00', e:'14:00', cat:'ateliere', loc:'Școala 5', title:'atelier Train the Coordinators', sub:['mentori & coordonatori']},
   {k:'e', t:'10:00', e:'12:00', cat:'artplay', loc:'Școala 5', title:'Cetățenie activă: manual de utilizare', sub:['educație civică · 11-14 ani']},
   {k:'e', t:'10:00', e:'12:00', cat:'artplay', loc:'Școala 5', title:'Animalul care te locuiește', sub:['atelier de arte grafice']},
   {k:'m', t:'14:00', e:'15:30', meal:'prânz', loc:'Alex Tell'},
   {k:'e', t:'14:00', e:'16:00', cat:'artplay', loc:'Școala 5', title:'Orașul e al tău · dacă știi cum', sub:['educație civică · 15-19 ani']},
   {k:'t', t:'15:30', route:'Alex Tell → Cămin'},
   {k:'e', t:'15:30', e:'16:30', c:true, cat:'tt', loc:'CMT', trupa:'alexandria', title:'repetiție și montare · <b>Alexandria</b>'},
   {k:'t', t:'16:45', route:'Cămin → CMT'},
   {k:'e', t:'17:00', e:'18:00', cat:'tt', loc:'CMT', trupa:'alexandria', title:'spectacol teatru tânăr · Alexandria'},
   {k:'m', t:'17:00', e:'18:00', meal:'cină', loc:'pachet', trupa:'act', note:'doar trupa ACT'},
   {k:'e', t:'18:00', e:'19:00', c:true, cat:'tt', loc:'CMT', trupa:'act', title:'repetiție și montare · <b>ACT</b>'},
   {k:'m', t:'18:00', e:'19:30', meal:'cină', loc:'Alex Tell'},
   {k:'e', t:'19:30', e:'20:30', cat:'tt', loc:'CMT', trupa:'act', title:'spectacol teatru tânăr · ACT'},
   {k:'e', t:'20:45', e:'21:15', cat:'alt', loc:'CMT', trupa:'act', title:'feedback cu mentorii · ACT'},
   {k:'e', t:'20:30', e:'21:00', c:true, cat:'cine', loc:'CMT', title:'montare tehnic · cinemateca târzie'},
   {k:'t', t:'20:45', route:'Cămin → CMT'},
   {k:'e', t:'21:00', e:'22:25', cat:'cine', loc:'CMT', title:'cinemateca târzie · „Atlasul Universului”', sub:['1 h 25 · Q&A cu Paul Negoescu (TBC), 15 min']},
   {k:'t', t:'22:45', route:'CMT → Cămin'},
 ]},
 {id:'ma4', dw:'ma', dn:'4', full:'4 august', h2:'marți', events:[
   {k:'t', t:'08:15', route:'Cămin → CMT'},
   {k:'m', t:'08:30', e:'09:45', meal:'mic dejun', loc:'Alex Tell'},
   {k:'e', t:'10:00', e:'14:00', cat:'ateliere', loc:'Școala 5', title:'ateliere arte alăturate', sub:['+ sălile de sport „Mihai Viteazul” & „Ștefan cel Mare”']},
   {k:'e', t:'10:00', e:'14:00', cat:'ateliere', loc:'Școala 5', title:'atelier Train the Coordinators', sub:['mentori & coordonatori']},
   {k:'e', t:'10:00', e:'12:00', cat:'artplay', loc:'Școala 5', title:'Animalul care te locuiește', sub:['atelier de arte grafice']},
   {k:'m', t:'14:00', e:'15:30', meal:'prânz', loc:'Alex Tell'},
   {k:'e', t:'14:00', e:'17:00', cat:'alt', loc:'Conciato', locd:'sus', title:'Economia Intimă · masă de discuție cu participante'},
   {k:'t', t:'15:30', route:'CMT → Cămin'},
   {k:'t', t:'16:30', route:'Cămin → CMT', trupa:'protha', note:'Protha'},
   {k:'e', t:'16:30', e:'17:30', c:true, cat:'tt', loc:'CMT', trupa:'protha', title:'repetiție și montare · <b>Protha</b>'},
   {k:'t', t:'17:30', route:'Cămin → CMT'},
   {k:'e', t:'18:00', e:'19:00', cat:'tt', loc:'CMT', trupa:'protha', title:'spectacol teatru tânăr · Protha'},
   {k:'e', t:'19:15', e:'19:35', cat:'alt', loc:'CMT', trupa:'protha', title:'feedback cu mentorii · Protha'},
   {k:'m', t:'19:00', e:'20:30', meal:'cină', loc:'Alex Tell'},
   {k:'e', t:'19:00', e:'20:30', c:true, cat:'cmt', loc:'CMT', title:'pregătire gală'},
   {k:'e', t:'20:30', e:'22:00', cat:'cmt', loc:'CMT', title:'gală de închidere'},
   {k:'t', t:'22:15', route:'CMT → Ștrand'},
   {k:'e', t:'22:30', e:'03:00', cat:'alt', loc:'Ștrand', title:'closing party · DJ Oldskull'},
   {k:'t', t:'03:00', route:'Ștrand → Cămin'},
 ]},
 {id:'mi5', dw:'mi', dn:'5', full:'5 august', h2:'miercuri', events:[
   {k:'x', tr:true, t:'oră TBC', ts:'09:00', text:'retur decor · Teatrul Național Craiova · echipamente sonorizare'},
   {k:'e', t:'08:00', e:'12:30', cat:'alt', loc:'CMT', title:'demontare și eliberare CMT'},
   {k:'e', t:'12:30', e:'14:30', cat:'alt', loc:'CMT', title:'Comunitate CMT', sub:['prezentare fundații comunitare']},
   {k:'e', t:'15:00', cat:'alt', loc:'CMT', title:'ședință de închidere'},
 ]},
];

/* id-urile trupelor pentru linkurile personale (?t=<id>) */
const TRUPE_IDS = {
  leira:'Trupa Leira', atelierul:'Atelierul de Teatru', artwork:'Artwork',
  amprente:'Amprente', brainstorming:'Brainstorming', alexandria:'Alexandria',
  act:'ACT', protha:'Protha',
};

/* zile de naștere în timpul festivalului: cheia = ziua, valorile = persoanele.
   ex: { v31: ['Maria (Artwork)', 'Radu (voluntari)'] } */
const BIRTHDAYS = {};

/* link către documentul de feedback în timp real (null = ascuns) */
const FEEDBACK_URL = null;

/* ============================================================
   SALUTURILE (bannerele de sus) · sistemul editorial #21
   Sloturi orare: dimineață 06–12 · prânz 12–15:30 ·
   după-amiază 15:30–19 · seară 19–22:30 · noapte 22:30–06.
   Reguli:
   - o replică e activă cât ține slotul ei, în ziua ei;
   - slot cu 2+ replici: rotație aleatoare la fiecare încărcare;
   - sloturile fără replici trag din GREET_POOL;
   - semnătura: „somn ușor, ideo” în FIECARE noapte după 02:00,
     mereu ultima replică a zilei.
   ============================================================ */

/* pre-festival: de la trimiterea programului până pe 27 iulie inclusiv */
const GREETINGS_PRE = {
  zi: [ /* 06:00–19:00 */
    'citești programul în avans. ne placi deja.',
    'mai e puțin. Alexandria se încălzește.',
    'programul e gata. emoțiile sunt pe drum.',
    'locul nostru e aici. al tău, din 28.',
    'spoiler: o să fie bine.',
    'un an am așteptat. mai putem câteva zile.',
    'calendarul zice iulie. inima zice ideo.',
    '#21: destul de mare să știe cine e, destul de tânăr să nu-i pese',
    'în curând: cele mai lungi zile și cele mai scurte nopți din an',
  ],
  noapte: [ /* 19:00–06:00 */
    'citești programul în avans. ne placi deja.',
    'programul e gata. emoțiile sunt pe drum.',
    'mai e puțin. Alexandria se încălzește.',
    'Alexandria doarme liniștită. nu pentru mult timp.',
    'dormiți acum. la festival nu se prea apucă.',
    'mai dormi cât poți. e un sfat, nu o glumă.',
    'un an am așteptat. mai putem câteva zile.',
    'unii așteaptă vara. noi așteptăm partea asta din vară',
    'Alexandria e un oraș obișnuit 357 de zile pe an',
    'calendarul zice iulie. inima zice ideo.',
    '#21: destul de mare să știe cine e, destul de tânăr să nu-i pese',
    'în curând: cele mai lungi zile și cele mai scurte nopți din an',
  ],
};

/* replicile pinuite pe zile */
const GREETINGS_ZILE = {
  ma28: {
    dimineata: ['ultima dimineață liniștită. savureaz-o.','orașul încă nu știe ce-l așteaptă','cafea în tihnă. ultima din seria asta.'],
    pranz: ['mâine vine lumea. azi mai respirăm o dată.'],
    dupaamiaza: ['ultimele pregătiri. emoțiile au ajuns primele.'],
    seara: ['ne adunăm la Conciato, hai!'],
    noapte: ['shhh. White House doarme. (nu doarme, dar shhh.)','ultima noapte de somn întreg. profită.'],
  },
  mi29: {
    dimineata: ['prima cafea nu se discută, se respectă','actul I: deschide ochii'],
    pranz: ['de azi, Alexandria are populație dublă','prânzul: singura ședință la care vine toată lumea'],
    dupaamiaza: ['totul e sub control (aproximativ)','improvizăm până iese'],
    seara: ['dacă tremură scena, e de la emoții','prima seară. de aici încolo, doar bine.','locul nostru e aici. de azi, și al tău.'],
    noapte: ['opening party la Ștrand. mâine la 10 e atelier. matematica vă privește.','shhh. White House doarme. (nu doarme, dar shhh.)'],
  },
  j30: {
    dimineata: ['shtanga sus, și tu la fel','la Alexandria, soarele răsare devreme. sau noi ne culcăm târziu.','voluntarii sunt deja în picioare. fii ca voluntarii.'],
    pranz: ['deja nu mai știi ce zi e. bun.','actul II: prânzul','la 33 de grade, orice idee pare bună'],
    dupaamiaza: ['azi nu e ziua ta? mâine poate','da, mesajul ăsta se schimbă la câteva ore. ca stările pe aici.'],
    seara: ['dacă azi merge ceva, un voluntar n-a dormit'],
    noapte: ['culisele dorm, legendele nu','cearcănele de mâine au scuză culturală.'],
  },
  v31: {
    dimineata: ['locul nostru e aici. la 7 dimineața, aș fi preferat altundeva.','dacă te caută cineva, de azi ești în Piață'],
    pranz: ['ai supraviețuit dimineții, bravo','hidratarea nu e opțională, ca și teatrul'],
    dupaamiaza: ['de câte ori crezi că se aude beautiful ones săptămâna asta?'],
    seara: ['aplauzele astea le-a montat cineva la 3 dimineața'],
    noapte: ['noaptea, în Alexandria, se scriu cele mai bune idei și cele mai proaste mesaje','și insomniile sunt repetiții'],
  },
  s1: {
    dimineata: ['oboseala e filtru creativ, zic unii'],
    pranz: ['energie de actul II, buget de actul V','dacă citești asta, ai o pauză. bravo. meriți.'],
    dupaamiaza: ['prieteniile de aici au altă unitate de măsură'],
    seara: ['oamenii ne fac să continuăm','oameni pe care îi știi de 3 zile și parcă de 10 ani. matematică de festival.'],
    noapte: ['visele sunt spectacole fără buget'],
  },
  d2: {
    dimineata: ['azi nu e ziua ta? mâine poate'],
    pranz: ['pauza face parte din spectacol'],
    dupaamiaza: ['la ideo nu vii să vezi teatru. vii să te vezi.'],
    seara: ['locul nostru e aici'],
    noapte: ['nopți albe, inimi pline','cine citește asta: la culcare'],
  },
  l3: {
    dimineata: ['nu ești obosit. ești în proces de creație.'],
    pranz: ['energia nu vine de la cafea. bine, nu doar.'],
    dupaamiaza: ['dacă vezi shtanga cărând, aplaudă. sau ajută. ideal ambele.'],
    seara: ['ultima seară fără gală. odihniți-vă emoțiile.'],
    noapte: ['ultimul care pleacă stinge reflectorul','mâine e ultima zi. nu, nu vorbim despre asta.'],
  },
  ma4: {
    dimineata: ['pierdut: somn. găsitorului, recunoștință.'],
    pranz: ['mâncați bine. diseară se aplaudă mult.'],
    dupaamiaza: ['acest mesaj a fost scris de cineva foarte obosit și foarte fericit'],
    seara: ['gală de închidere. plângem organizat, la final.','orașul ăsta crește oameni frumoși în fiecare vară'],
    noapte: ['oamenii ne fac să continuăm. somn ușor, oameni.'],
  },
  mi5: {
    dimineata: ['demontăm de la 8. inclusiv emoțional.'],
    pranz: ['bagajele se fac greu când nu vrei să pleci','ultima masă împreună. mâncați încet.'],
    dupaamiaza: ['15:00, ședința de închidere. se lasă cu îmbrățișări.'],
    seara: ['oamenii ne fac să continuăm. voi ați fost oamenii.'],
    noapte: ['e liniște în Alexandria. prea liniște.','somn ușor, ideo'],
  },
};

/* rezerva, pentru sloturi fără replici (de ex. după festival) */
const GREET_POOL = {
  dimineata: ['bună dimineața · locul nostru e aici'],
  pranz: ['actul II: prânzul'],
  dupaamiaza: ['locul nostru e aici'],
  seara: ['cea mai frumoasă seară din an (iar)'],
  noapte: ['visați papainoage'],
};

/* semnătura festivalului: în fiecare noapte după 02:00, mereu ultima */
const GREET_SIGNATURE = 'somn ușor, ideo';

/* ultima zi de pre-festival (inclusiv) */
const PRE_FESTIVAL_UNTIL = '27.07.2026';

/* trupele #21: [nume, trainer · sala, coordonator, tel coordonator, ghid, tel ghid]
   telefoanele se scriu ca '07xx xxx xxx' și devin tap-to-call */
const TRUPE = [
 ['Trupa Leira','Adelin Tudorache · sala 10','Nicolae Cătălin','0723 682 361','de confirmat',''],
 ['Atelierul de Teatru','Mădălina Stoica · sala 7','Lenuș Moraru','0745 658 769','de confirmat',''],
 ['Artwork','Oana Jipa · sala 6','Diana Roman','0740 127 623','de confirmat',''],
 ['Amprente','Ioana Brumar · sala 9','Anca Maria Băcanu','0721 916 009','de confirmat',''],
 ['Brainstorming','Cezara Petredeanu · sala 5','Ruxandra Stoica','0770 346 780','de confirmat',''],
 ['Alexandria','trainer de confirmat · sala 12','Eric Alexandru','','de confirmat',''],
 ['ACT','Alexa Tofan · sala 8','Andi Andriucă','0784 246 202','de confirmat',''],
 ['Protha','Bogdan Tulbure · sala 11','Alexandru Stan','0744 871 882','de confirmat',''],
];

/* ── spectacolele trupelor: fișa fiecărui spectacol (afișată pe
      pagina formatori; cheia = id-ul trupei din TRUPE_IDS) ────── */
const TRUPE_INFO = {
 brainstorming: {
  oras:'București',
  spectacol:'Acesta este un test',
  autor:'Stephen Gregg',
  echipa:'Mircea Bălăceanu, Maria Coman, Sara Maria Ghimpu, Radu Parnescu',
  distributie:'Oprea Eduard, Beciu Daria, Marcan Julia, Dobrin Ionuț, Bogdan Diana, Cibotariu Miruna, Rusu Karina, Duta Teodora, Ene Mara, Mirea Ana, Lazăr Ecaterina, Sebastian Ioana, Papuc Petru, Ursu Mihaela',
  sinopsis:'Alan, un elev de liceu, se luptă cu presiunea unui test important. Stresul, lipsa odihnei și presiunea generată de admiterea la o Universitate de prestigiu îl conduc pe acesta către un burnout chiar în ziua testului. Atmosfera apăsătoare și oboseala îl fac pe Alan să se disocieze de la contextul firesc de clasă, la fricile sale. Aude voci care îi amplifică starea, timpul este distorsionat, iar colegii și profesorii nu fac decât să îi amplifice starea. Spectacolul explorează ideea de presiune academică, perfecționismul și anxietatea elevilor legată de „Ce se va întâmpla după?”',
  despre:'Brainstorming, o trupă de teatru de liceeni fondată în 2003, și-a căpătat numele inițiind un spațiu în care tinerii să-și poată exprima gândurile, opiniile, sentimentele și creativitatea, adunându-le pe toate într-un context teatral, sub forma unor exerciții și spectacole. Trupa reprezintă, pentru membrii acesteia, o plasă de siguranță și un laborator în cadrul căruia se cultivă creativitatea tinerilor. Spectacolele trupei Brainstorming de-a lungul anilor au avut ca numitor comun autenticitatea. Aceasta rezultă din crearea unui context care îi unește pe adolescenți și le dă încredere în ei, în ideile și părerile lor și în colegii lor de trupă. Astfel, ei ajung să privească teatrul cu simplitatea experiențelor proprii, bucurie și sinceritate, rezultând în spectacole care sunt, de cele mai multe ori, un colaj de momente sau culori din viețile lor personale. Trupa își desfășoară activitatea în București și a jucat de-a lungul anilor în mai multe festivaluri de teatru de adolescenți din țară, festivaluri în cadrul cărora anumite spectacole au fost premiate. În schimb, nu acestea sunt lucrurile care țin trupa în funcționare după 20 de ani, ci felul în care tinerii, investiți cu importanță, investesc cu aceeași importanță lucrurile pe care le fac și le trăiesc în cadrul trupei și spectacolele pe care le construiesc. De cele mai multe ori, lecția cu care rămân membrii trupei este puterea de a-i asculta pe ceilalți, puterea de a te asculta pe tine și puterea de a da importanță lucrurilor pe care le crezi, fără a cădea pradă descurajărilor și asta ne motivează să continuăm de fiecare dată.',
  video:'https://youtu.be/-wzJmfpfnvU',
 },
 artwork: {
  oras:'Iași',
  spectacol:'Praf de rege',
  autor:'scenariu și adaptare liberă după Regele Lear și Sonete de William Shakespeare',
  echipa:'regie, scenografie: Diana Roman',
  distributie:'Maria Oglinzeanu – Regele Lear; Ivona Isari – Goneril; Lia Lucescu – Regan; Ștefania Blașcu – Cordelia; Amalia Nicolau – Mystery Misery; Maria Militaru – Kent; Zamfira Tun – Gloucester; Simon Vlad – Edgar; Darius Oancea – Edmund; Amalia Tufă – Curan, solul regelui; Nectaria Lucescu – Bufonul; Andrei Brebu – Oswald, garda de corp a Gonerilei; Melania Huzum – Lady Summer; Ana Nedelcu – Lady Winter',
  sinopsis:'Pornind de la Regele Lear și Sonetele lui William Shakespeare, spectacolul Praf de rege spune povestea unei familii care se destramă atunci când iubirea este confundată cu vorbele goale. Un rege își împarte iubirea între cele trei fiice, cerându-le să-și declare iubirea. Fetele mari aleg lingușirea. Cea mică, Cordelia, refuză să transforme adevărul în spectacol. Pentru sinceritatea ei, este alungată. De aici începe căderea: un tată care pierde totul, o familie care se rupe și o lume în care puterea valorează mai mult decât loialitatea. Pe fundalul unor momente muzicale inspirate din sonete, personajele trec prin trădare, vină, iubire și iertare. Spectacolul Praf de rege aduce povestea în prezent, vorbind pe limba adolescenților despre orgoliu, nevoia de validare și fragilitatea relațiilor. Într-o lume în care cuvintele sunt adesea mai zgomotoase decât adevărul, întrebarea rămâne: cât valorează sinceritatea?',
  despre:'Noi suntem trupa ARTWORK. Un grup de adolescenți pasionați și implicați. Noi nu suntem doar o trupă de teatru adolescentină; suntem o comunitate dedicată exprimării creativității și explorării problemelor sociale prin artă și muzică. ARTWORK reprezintă un spațiu unde fiecare voce este valorizată și fiecare idee este explorată. În trupa noastră, nu doar creăm spectacole, ci construim legături puternice și cultivăm încrederea între membrii noștri. Suntem o echipă diversă, în care fiecare aduce cu sine experiențe, perspective și talente unice. Fiecare membru al trupei este încurajat să își exprime creativitatea și să contribuie la dezvoltarea proiectelor noastre într-un mediu deschis și prietenos. Cu o pasiune comună pentru artă și pentru schimbare, ne străduim să construim nu doar spectacole, ci și comunitatea noastră, căutând mereu modalități de a ne îmbunătăți. Împreună, suntem ARTWORK!',
  video:'https://www.youtube.com/watch?v=FZjUhqRWeLc',
 },
 atelierul: {
  oras:'Botoșani',
  spectacol:'Lecția de tăcere',
  autor:'creație colectivă după „Antigona” de Sofocle',
  echipa:'creație colectivă',
  distributie:'Maia Ignat, Miruna Voroneanu, Ștefan Bursuc, Denisa Franț, Ana Teodoru, Evelin Aniței, Ecaterina Grădinaru, Alessia Iordăchescu, Anastasia Jâșcanu, David Livadariu, Timeea Sandu, Teofan Scîntei, Ecaterina Țîcu, Alessia Ungureanu',
  sinopsis:'O sală de clasă, bănci aliniate, un zgomot de fundal obișnuit, familiar, cu gesturi mici, cotidiene, aproape „normale” – care nu lasă urme vizibile, dar erodează constant încrederea, curajul de a vorbi, sentimentul de siguranță. Elevii le învață pe de rost, le anticipează, învață să le ignore. Și tocmai această obișnuire, această acceptare tăcută și aparent inofensivă a micilor umilințe, pregătește terenul pentru ceva mai grav. „Lecția de tăcere” vă invită la o discuție despre o realitate mult prea des întâlnită: cât de ușor se poate transforma puterea în abuz. Spectatorul nu rămâne pe margine: intervine, propune, schimbă direcția unei situații care, în viața reală, pare de multe ori imposibil de oprit. Nicio reprezentație nu seamănă cu alta, la fiecare întâlnire spectacolul devine un laborator viu, în care adolescenții pot experimenta, în siguranță, reacții noi la situații des-întâlnite și ce se modifică în ceilalți și în ei înșiși.',
  despre:'Atelierul de teatru a fost, la origine, trupa de teatru a unui liceu din Botoșani, înființată în 1996 de câțiva liceeni care voiau să facă teatru cu adevărat. Din acel nucleu s-a dezvoltat treptat un spațiu extrașcolar de creștere prin joc, exercițiu scenic și întâlniri reale. Din 2003 poartă numele ATELIERUL DE TEATRU și, de atunci, a construit peste 50 de spectacole și momente artistice, rămânând una dintre cele mai active și constante prezențe în festivalurile de teatru pentru adolescenți. Atelierul de teatru a devenit o comunitate din care nu mai vrei să pleci pentru că simți că ai ajuns unde trebuie. Zâmbești, înveți, te redescoperi în ochii celorlalți și, ușor-ușor, începi să te accepți așa cum ești. E un drum sincer, care te provoacă, te împinge să îți depășești limitele. Râdem, plângem, creștem împreună. Greșim? Normal. Dar învățăm din fiecare pas. Tot ce trebuie să faci e să crezi în ce simți. De acolo, lucrurile se așază singure. Când intri în Atelierul de teatru, nu semnezi un contract. Te arunci. Așa cum ești. Nu e despre „bine” sau „rău”. E despre sinceritate, vulnerabilitate, despre a fi tu însuți.',
  video:'https://youtu.be/jhWgk1iU_vo',
 },
 act: {
  oras:'Bacău',
  spectacol:'Clovnii din Chaillot',
  autor:'Jean Giraudoux',
  echipa:'regie: Andi Andriucă',
  distributie:'Ilieș Theodora – Nebună în roșu/clovn; Cupaș Raluca – Nebună în mov/clovn; Turcu Andreea – Nebună în albastru/clovn; Gherasimoaia Giulia – Nebună în galben/clovn; Avarvarei Cezara – Nebuna din Chaillot; Mihăilă Georgiana – Broker/clovn; Geangu Elena – Președintele; Gavriliu Călin – Baronul; Iojă Andreea – Prospectorul; Hazu Alexandru – clovn; Doboșeriu David – clovn; Cernat Teodora – clovn; Niță Teodora – clovn; Păunescu Medeea – clovn',
  sinopsis:'Spectacolul „Clovnii din Chaillot” urmărește planul unor răufăcători de a bombarda Parisul pentru a ajunge la o rezervă de petrol, plan care este dejucat de cinci femei excentrice. Acțiunea este pusă, însă, în plan secund, iar atenția cade pe regizorii ce încearcă să ducă la bun sfârșit spectacolul: Clovnii.',
  despre:'Trupa A.C.T. Bacău este una din cele mai vechi trupe de teatru adolescentin din acest minunat oraș, fiind activă de mai mult de 20 de ani. În fiecare an se schimbă generația, oamenii, dar spiritul de echipă, voia bună și munca fără oprire au fost, sunt și vor fi principalele caracteristici ale acestei trupe. De-a lungul anilor am traversat țara și am participat la unele dintre cele mai frumoase și importante festivaluri de adolescenți: T4T – Timișoara, Magic Festival – Suceava, AMFiteatru – Botoșani, Reactiv – Tg. Neamț, GONG – Roman, Victory of Art – București, I.D. Fest – Bacău, precum și Ideo Ideis – Alexandria. Toate aceste festivaluri ne-au ajutat să ne dezvoltăm ca oameni și să ne dăm seama că trebuie să prețuim fiecare moment împreună cu trupa, deoarece totul se va sfârși și pentru mulți dintre membri va fi singura perioadă când urcă pe scenă.',
  video:'https://youtu.be/1aQEebcRQn0?si=Lf3SZObRG2-l-JXQ',
 },
 amprente: {
  oras:'Brașov',
  spectacol:'Ajunge!',
  autor:'Mașa Kontorovici',
  echipa:'regie: Anca Maria Băcanu',
  distributie:'Maria Oloeriu – Mașka; Sofia Coman – mama/bunica/Tanti Sveta (mătușa); Rareș Bucur – Starman; Ștefan Amocăniței – Povestitorul; Bogdan Corboș – Costi; Teodor Bucur – Vlad; Luca Simionescu – Mișu; Diana Hîrjoabă – Ania; Raluca Anganu – Kati',
  sinopsis:'Spunem „ajunge” atunci când trebuie sau când este prea târziu? Mașka, o fată de 16 ani, este înconjurată de voci stridente, nuanțe de negru și insulte. Trăiește într-o familie toxică, în care ignoranța doare mai tare decât vulgaritatea. Golul lăsat de absența unei figuri paterne este umplut de prietenia cu Costi, care îi arată că poate fi iubită exact așa cum este. Prin dorința de a se integra într-o societate care ocolește sinceritatea și fuge de trecut, mizeria o urmărește, iar imaginația pare să fie singura salvare pe care o poate găsi. În drumul ei spre speranță, Mașka este înconjurată de stele și nuanțe de verde.',
  despre:'Trupa a fost înființată în 2002, fiind coordonată de Anca Maria Băcanu. Am început prin dorința de a ne juca, iar cu puțin curaj, imaginația are puterea să devină un spațiu nemărginit. Ne-am lăsat purtați de visuri, oricât de incert părea drumul pe care am pășit. Ne strângeam într-o sală mică și spuneam povești, împărtășeam gânduri, vorbeam prin priviri și eram împreună. Acel cottage, cum îi spunem noi, nu și-a schimbat mărimea niciodată, și-a schimbat doar înfățișarea în funcție de generație și oamenii care au pășit în el, iar încrederea că ceea ce facem este pe un drum bun a crescut datorită bucuriei pe care o emană omul care a fost mereu acolo, încă de la început, și a celor care au avut încredere… Zâmbetele calde pe care le oferim fugitiv între noi, priviri care ne fac să ne simțim prezenți, îmbrățișări care ne fac să ne simțim văzuți, sunt lucrurile care ne fac să continuăm… noi cu noi, și noi împreună cu oamenii care ni se alătură la fiecare spectacol. Locul nostru este acolo unde suntem împreună și credem că putem reuși să trăim frumos.',
  video:'https://youtu.be/rSSMCMeVbjg',
 },
 leira: {
  oras:'Râmnicu Vâlcea',
  spectacol:'Leonardo! 500 de ani e prea mult',
  autor:'Brigette Louveaux',
  echipa:'regie: Doina Migleczi · scenografie: Andrei Migleczi · coordonator: Gabriel Popescu',
  distributie:'Todeci Marta, Palea Alexandra, Mititelu Gabriela, Popescu Alexandra, Constantin Ștefania, Nicolae Anastasia, Marin Rebeca, Ruiu Călin, Stamatie Rareș, Purcărea Răzvan, Andrei Diță – Gioconda; Alexia Lupu – tehnic lumini; Eduard Ignat – tehnic sunet; Daria Ghițulescu – tehnic scenă',
  sinopsis:'Spectacolul „Leonardo, 500 de ani este prea mult” prezintă condiția umană prin intermediul artei și al unor momente importante din istorie. Pe parcursul reprezentației sunt aduse în discuție evenimente și personalități care au influențat evoluția societății, evidențiind legătura dintre artă și viața oamenilor. Spectacolul invită publicul să reflecteze asupra trecutului, asupra prezentului și asupra modului în care creația artistică poate transmite idei, emoții și experiențe umane. Prin temele abordate și prin modul de realizare, acesta oferă o perspectivă asupra relației dintre om, istorie și cultură.',
  despre:'Trupa Leira a fost înființată în anul 2015 de Doina Migleczi. Anii petrecuți împreună ne-au arătat ce înseamnă cu adevărat să ai pe cineva aproape și, deși cu toții împărtășim aceeași pasiune pentru teatru, putem spune că cea mai mare motivație de a continua pe acest drum sunt oamenii pe care i-am întâlnit pe parcurs. Pentru noi, teatrul este mai mult decât o formă de exprimare: este un mod de a fi, de a crea și de a ne bucura împreună, chiar dacă oamenii și mediul din jurul nostru par să se schimbe constant. În prezent, activitatea trupei este coordonată de Gabriel Popescu, care continuă să susțină dezvoltarea noastră artistică și spiritul de echipă construit de-a lungul anilor.',
  video:'https://youtube.com/watch?v=vyzOvNKo-Vk&feature=shared',
 },
 protha: {
  oras:'Panciu',
  spectacol:'We are stories',
  autor:'William Shakespeare',
  echipa:'regie: Ioan Ardelean · coregrafie: Radu Anastas',
  distributie:'Zbîrciog Alina – Ophelia; Găman Andreea Patricia – Vrăjitoare, Moartea; Matei Georgiana Dănuța – Katerina; Constandache Cristina Maria – Katerina; Pleșcan Melania Valentina – Katerina; Melinte Miruna Cosmina – Julieta, Ophelia; Banciu Andrei – Petruchio; Manovici Teodor Andrei – Vrăjitoare; Ignat David Raul – Romeo, Regele Richard al III-lea; Popoiu Gabriel – Regele Lear, Puck; Vasile Alexandru – Petruchio; Roșu Bogdan Ionuț – Vrăjitoare; Crucianu Teodor Ionuț – Petruchio; Drăgan Denisa Maria – Rosalind',
  sinopsis:'Odată cu nașterea unui copil începe dansul lumii. Respirația devine primul pas, primul scâncet, primul zâmbet: adică o chemare către viață. Din acel moment, întreaga existență se desfășoară ca o coregrafie a devenirii. Iar trupul începe călătoria, inițierea și, în tăcere, scrie o poveste pe care cuvintele n-o pot cuprinde pe deplin. Fiecare gest ascunde o replică nerostită, fiecare privire e o propoziție suspendată între lumină și întuneric. Așa se întâmplă și în spectacolul „Noi suntem povești”. El urmărește, prin cuvânt și mișcare, călătoria omului de la naștere până la moarte. Această inițiere este o succesiune de etape care se topesc, se contopesc și se juxtapun una peste alta. Așadar, copilăria, iubirea, rătăcirea, lupta, împăcarea și, în cele din urmă, moartea sunt etapele care pornesc din tăcere și se întorc la tăcere. Actorii devin purtătorii unei energii colective, iar trupurile lor se transformă în instrumente de poezie vizuală. Prin mișcare, respirație, vibrație și cuvânt se reconstituie legătura primordială dintre dans și existență, dintre ritm și sens. Nașterea, iubirea și moartea nu sunt momente separate, ci acte ale aceluiași spectacol, cel al vieții. Iar la final, când lumina se stinge și trupurile rămân nemișcate, spectatorul e lăsat în fața unei scene învăluite în tăcere. În acel gol suspendat, parcă se aude ecoul unei întrebări simple și esențiale: unde se termină jocul și unde începe viața?',
  despre:'Trupa de Teatru Protha s-a născut în 1994, dintr-o nevoie simplă: aceea de a aduce teatrul mai aproape de oameni, într-un loc în care el nu exista. A fost reluată în 2011, iar de atunci continuă să trăiască prin fiecare generație care îi dă un sens nou. Pentru noi, teatrul nu e doar un rezultat, ci un proces. E spațiul în care învățăm să fim vulnerabili, să ne punem întrebări și să stăm unii lângă ceilalți fără măști. Uneori e haos, alteori e liniște, dar de fiecare dată e sincer. Continuăm pentru că aici ne găsim. Și, de fiecare dată când urcăm pe scenă, avem senzația că ne apropiem puțin mai mult de cine suntem.',
  video:'https://www.youtube.com/watch?v=tcG3RNr5ewU',
 },
};

/* ── logistica atelierelor (din tabelul de logistică; sălile sunt
      deocamdată ORIENTATIVE) ─────────────────────────────────── */

/* ateliere teatru tânăr · Școala 5 · joi/vineri/sâmbătă 10:00-14:00 */
const ATELIERE_TT = [
 ['Trupa Leira','Adelin Tudorache','sala 10','14 part.'],
 ['Atelierul de Teatru','Mădălina Stoica','sala 7','15 part.'],
 ['Artwork','Oana Jipa','sala 6','14 part.'],
 ['Amprente','Ioana Brumar','sala 9','11 part.'],
 ['Brainstorming','Cezara Petredeanu','sala 5','14 part.'],
 ['Alexandria','trainer de confirmat','sala 12',''],
 ['ACT','Alexa Tofan','sala 8','14 part.'],
 ['Protha','Bogdan Tulbure','sala 11','14 part.'],
 ['Train the Coordinators','mentori & coordonatori','sala 13','7 part.'],
];
const TT_NEEDS = 'câte o boxă portabilă + cutie standard: 1 eșarfă și 1 pix / participant, 5 mingi de tenis, 1 rolă scotch de hârtie, 5 cozi de mătură, 1 ghem sfoară, 1 top hârtie, 10 pahare carton, 1 tavă';

/* ateliere arte alăturate · duminică/luni/marți 10:00-14:00 */
const ARTE_ALATURATE = [
 ['scriere dramatică','Alex Gorghe','Șc. 5 · sala 2','13 part.','','flipchart, markere, 14 pixuri, 1 top hârtie'],
 ['dans 1','Eduard Chimac','Șc. 2 · sala de sport','20 part.','boxă bluetooth',''],
 ['film','Tudor Platon','Șc. 5 · sala 5 (întunecoasă / jaluzele)','14 part.','tablă inteligentă funcțională (video & audio) cu ieșire HDMI, WiFi','1 set hârtie + cartuș pt. imprimanta foto Canon Selphy CP1300'],
 ['actorie de film','Theodor Ioniță','Șc. 5 · sala 6 (întunecoasă / jaluzele)','15 part.','videoproiector, cablu HDMI, prelungitor, perete alb, telefon bun pe cameră, set lavaliere de telefon, boxă bluetooth',''],
 ['dans 2','Teo Velescu','Șc. 3 · sala de sport','20 part.','boxă bluetooth',''],
 ['costume','Șteff Chelaru','Șc. 5 · sala 7','14 part.','',''],
 ['Train the Coordinators','mentori & coordonatori','Șc. 5 · sala 13','7 part.','videoproiector, cablu HDMI, prelungitor',''],
];

/* ateliere formatori (orientativ / de confirmat) */
const FORMATORI = [
 ['Train the Trainers','Conciato (sus?) · 15:00-16:00 · joi/vineri/sâmbătă'],
 ['Train the Coordinators','Șc. 5 · sala 12 · 10:00-14:00 · joi/vineri/sâmbătă · 7 part.'],
 ['Bootcamp MASCA (școala de vară)','CMT · 10:00-13:00 · miercuri/joi/vineri · sală de conf. / ceainărie de confirmat'],
 ['Economia Intimă · masă de discuție cu participante','Conciato (sus) · 4 august · 14:00-17:00'],
];

/* ateliere comunitate (Art&Play): tabelul din +info
   [atelier, participanți, sală, zile, necesar tehnic, necesar producție] */
const ARTPLAY_INFO = [
 ['Show Your Moves (dans · breaking)','10','Șc. 5 · sala 2 (spațioasă)','joi · vineri · sâmbătă','10:30-12:30','sonorizare',''],
 ['Stand Up împotriva hărțuirii stradale (activism feminist)','20','Șc. 5 · sala 1','joi','14:00-16:00','videoproiector + boxe',''],
 ['Se întâmplă între N-O-I (psihoeducație 10-13 ani)','15','Șc. 5 · sala 1','vineri · sâmbătă · duminică','10:30-12:30','','coli, pixuri/creioane, carioci, flipchart & foi'],
 ['Se întâmplă între N-O-I (psihoeducație 14-18 ani)','15','Șc. 5 · sala 1','vineri · sâmbătă · duminică','14:30-16:30','','coli, pixuri/creioane, carioci, flipchart & foi'],
 ['Pauza de la dezinformare (educație media, profesori)','15','Șc. 5 · sala 3','vineri','11:00-13:00','',''],
 ['De la pasiune la profesie: unde-i locul meu? (orientare vocațională)','15','Șc. 5 · sala 2','vineri · sâmbătă · duminică','15:00-18:00','videoproiector','coli, pixuri/creioane, carioci, flipchart & foi'],
 ['Mintea ta nu e a ta (în totalitate) · AI, biasuri (educație media, copii)','15','Șc. 5 · sala 3','vineri','15:00-17:00','',''],
 ['Siguranța bebelușului (Asociația Moașelor)','20','Șc. 5 · sala 4','sâmbătă','10:00-12:30','',''],
 ['Animalul care te locuiește (arte grafice)','15','Șc. 5 · sala 3','duminică · luni · marți','10:00-12:00','',''],
 ['Prim Ajutor pediatric (Asociația Moașelor)','20','Șc. 5 · sala 4','duminică','10:00-12:30','',''],
 ['Alexandria la 50 de grade (prospectivă)','30','Piața · scena mică','duminică','16:00-18:00','',''],
 ['Cetățenie activă: manual de utilizare (educație civică 11-14)','15','Șc. 5 · sala 1','luni','10:00-12:00','videoproiector','coli, pixuri/creioane, carioci, foi de flipchart'],
 ['Orașul e al tău · dacă știi cum (educație civică 15-19)','15','Șc. 5 · sala 1','luni','14:00-16:00','videoproiector','coli, pixuri/creioane, carioci, foi de flipchart'],
];

/* logistica Art&Play, cu cheia = titlul evenimentului din program */
const LOGISTICS = {
 'atelier Train the Coordinators': {sala:'sala 13', n:'7', tehnic:'videoproiector, cablu HDMI, prelungitor'},
 'Show Your Moves': {sala:'sala 2 (spațioasă)', n:'10', tehnic:'sonorizare'},
 'Stand Up împotriva hărțuirii stradale': {sala:'sala 1', n:'20', tehnic:'videoproiector + boxe'},
 'Se întâmplă între N-O-I': {sala:'sala 1', n:'15', prod:'coli, pixuri/creioane, carioci, flipchart & foi de flipchart'},
 'Pauza de la dezinformare': {sala:'sala 3', n:'15'},
 'De la pasiune la profesie: unde-i locul meu?': {sala:'sala 2', n:'15', tehnic:'videoproiector', prod:'coli, pixuri/creioane, carioci, flipchart & foi de flipchart'},
 'Mintea ta nu e a ta (în totalitate)': {sala:'sala 3', n:'15'},
 'Siguranța bebelușului': {sala:'sala 4', n:'20'},
 'Animalul care te locuiește': {sala:'sala 3', n:'15'},
 'Prim ajutor pediatric': {sala:'sala 4', n:'20'},
 'Alexandria la 50 de grade': {n:'30'},
 'Cetățenie activă: manual de utilizare': {sala:'sala 1', n:'15', tehnic:'videoproiector', prod:'coli, pixuri/creioane, carioci, foi de flipchart'},
 'Orașul e al tău · dacă știi cum': {sala:'sala 1', n:'15', tehnic:'videoproiector', prod:'coli, pixuri/creioane, carioci, foi de flipchart'},
};

/* ── contactele echipei #21 · [nume, rol, telefon?] ──
   telefoanele se completează pe măsură ce vin ('07xx xxx xxx') */
const CONTACTS = [
 ['Board', [
  ['Andreea Nuță','Co-Director Festival'],
  ['Silvia Ciubotaru','Co-Director Festival'],
  ['Vlad Purdel','Co-Director Festival'],
  ['Andreea Borțun','Co-fondator Ideo Ideis'],
  ['Alexandru Ion','Co-fondator Ideo Ideis'],
 ]],
 ['Artistic', [
  ['Irina Radu','Director Artistic'],
  ['Ana Popa','Coord. Relații Participanți'],
  ['Mara Oprea','Coord. Ateliere'],
  ['Ariana Paul','Coord. Evenimente Indoor'],
  ['Eliza Ceprăzaru','Coord. Evenimente Outdoor'],
  ['Roxana Dragne','Coord. Dezvoltare Comunitară'],
  ['Șteff Chelaru','Scenograf'],
  ['Denis Nicoliță','Executive Scenografie'],
  ['Andrei Codrici','Executive Scenografie'],
 ]],
 ['Welcoming', [
  ['Karina Petrică','Co-Director Welcoming'],
  ['Alexia Mihăilițeanu','Co-Director Welcoming'],
  ['Catrinel Ghinea','Coord. Voluntari'],
  ['Sebastian Stroie','Coord. Transporturi'],
  ['Leticia Gogoașe','Executive Welcoming & Mese'],
  ['Mara Orman','Executive Cazări'],
  ['Livia Ferăstrău','Executive Welcome Packs'],
  ['Bianca Mardale','Executive Voluntari'],
  ['Valentin Vilău','Executive Transporturi'],
  ['Mihăiță Putineanu','Executive Transporturi'],
  ['Andrei Daniluc','Executive Transporturi'],
 ]],
 ['Comunicare', [
  ['Clara Dobre','Social Media Manager'],
  ['Larisa Baltă','Coord. Departament Foto'],
  ['Paul Petrache','PR Manager'],
  ['Claudiu Popescu','Fotograf'],
  ['Lavinia Cioacă','Fotograf'],
  ['Alexandra Iftime','Fotograf'],
  ['Matei Bumbuț','Fotograf'],
  ['Alexandru Varninschi','Coord. Departament Video'],
  ['Radu Rusu','Videograf'],
  ['Teodora Roșu','Videograf'],
 ]],
 ['Tehnic', [
  ['Andrei Tălpigă','Director Tehnic'],
  ['Dan Iosif','Regizor Tehnic'],
  ['Costinel Cioflan','Inginer Sunet'],
  ['Marin Andrei','Inginer Lumini'],
  ['Paul Fălticeanu','Executive Tehnic'],
  ['Alexandru Medveghi','Executive Tehnic'],
  ['Clenciu Cosmin','Executive Tehnic'],
  ['Andrei Picu','Asistent Director Tehnic'],
 ]],
 ['Producție', [
  ['Alexander Dumitrescu','Director Producție'],
  ['Andy Mihai','Coord. Achiziții'],
  ['Bianca Tiu','Executive Producție'],
  ['Evelina Dobre','Executive Producție'],
  ['George Apetrei','Executive Producție'],
  ['Oana-Herminne Iantschi','Executive Producție'],
 ]],
 ['Financiar', [
  ['Gabriela Dragomir','Director Financiar'],
  ['Carmen Matei','Coordonator Finanțări'],
  ['Antoaneta Galeș','Coordonator Sponsorship'],
  ['Andrei Picu','Sponsorship Local'],
 ]],
 ['Website', [
  ['Cătălin Matei','Coordonator Website'],
 ]],
 ['Juniori', [
  ['Alexia Mareș','Junior Ateliere'],
  ['Alexandra Dinu','Junior Ateliere'],
  ['Anca Cancea','Junior Evenimente Indoor'],
  ['Magda Radu','Junior Evenimente Indoor'],
  ['Alexandru Trancă','Junior Evenimente Outdoor'],
  ['Iarina Almajanu','Junior Relații Participanți'],
  ['Brianna Morcov','Junior Murale'],
  ['Ioana Dobrin','Junior Scenografie'],
  ['Mălina Ghinea','Junior Ticketing & Mese'],
  ['Anca Maria Popescu','Junior Cazări'],
  ['Diana-Mihaela Ivănescu','Junior Cazări'],
  ['Clara Puiu','Junior Mese'],
  ['Andreea Frumosu','Junior Welcoming'],
  ['Alexandra Diana Chivu','Junior Welcoming (HQ)'],
  ['Mira Corradi','Junior Voluntari'],
  ['Flavius Nelepcu','Junior Producție'],
  ['Eduard-Marius Iconaru','Junior Producție'],
  ['David Iancu','Junior Producție'],
  ['Karina Marin','Junior Transporturi'],
  ['Ionuț Petrișor Potîrniche','Junior Transporturi'],
  ['Cristina Maria Stoica','Junior Comunicare'],
 ]],
 ['Shtanga Boyz', [
  ['Alexandru Marin'],['Andrei Cosmin Petrescu'],['Arin Donciu'],['Cǎtǎlin Ionescu'],
  ['Denis Ștefan Miu'],['Edi Mirea'],['Ioan-Anastasie Militaru'],['Matei Ionescu'],
  ['Matei Orman'],['Răzvan Rizescu'],['Stelicǎ Tǎlpigǎ'],['Ștefan Eleodor Stancioi'],
  ['Ștefan Vlad Ilie'],['Vlad Cîrciumaru'],
 ]],
 ['Voluntari', [
  ['Adina Maria Dumitrescu'],['Adriana Popescu'],['Alessia Mitran'],['Alex Crăiță'],
  ['Alex Zane'],['Alex Zlotea'],['Alexandra Andrea Stoica'],['Alexandra Iuliana Botorogeanu'],
  ['Alexandra Rîciu'],['Alexandra Vasile'],['Alisia Mocanu'],['Amalia Popescu'],
  ['Amelia Stănilă'],['Ana Maria Georgescu'],['Ana Tănăsescu'],['Anastasia Corradi'],
  ['Anda Pavel'],['Andreea Ana-Maria Marinescu'],['Andreea Nicoleta Cernitu'],
  ['Andreea Sorana Stănceoi'],['Andreea Ștefania Dragomir'],['Andrei Dinu'],['Andrei Iriș'],
  ['Andres Catruna'],['Anelisse Vlad'],['Angelina-Maria Florea'],['Ariana Mișu'],
  ['Ariana Trandafir'],['Betty Ionescu'],['Bianca Jainea'],['Bianca Milcu'],['Bianca Poață'],
  ['Bogdan Nedeluș'],['Carina Maria Todor'],['Cosmin Budică'],['Cristian Frumosu'],
  ['Cristina Sebe'],['Daria Micu'],['Daria Mihai'],['Daria Stan'],['Delia Andreea Mocioi'],
  ['Denisa Mihaela Ivănuș'],['Diana-Nicoleta Petcana'],['Dragoș Erimia'],['Eduard Șurcan'],
  ['Elena-Alexandra Gheorghe'],['Elena-Daniela Brîndaș'],['Eliza Dinu'],['Emma Medințu'],
  ['Eric-Andrei Alexandru'],['Gabriela Gîgîlice'],['Gabriela Prună'],['Ingrid Ioana Gorescu'],
  ['Ioana Chivu'],['Ioana-Rebeca Vatui'],['Isabel Zlotea'],['Iulia Fusea'],
  ['Karina Alexandra Rîpanu'],['Karla-Mihaela Bugean'],['Liliana Manea'],['Livia Coconu'],
  ['Liviu Zlotea'],['Lorena Maftei'],['Maria Cătălina Dragomir'],['Maria Dide'],
  ['Maria Marin'],['Maria Nedelcu'],['Maria-Alina Bănăseanu'],['Marina Danciu'],
  ['Marina Preda'],['Medeea Toma'],['Mihaela Anghel'],['Mihnea Nițu'],['Mihnea Spătaru'],
  ['Miruna Carabașu'],['Miruna Desculțu'],['Miruna Store'],['Natalia-Eliza Stănescu'],
  ['Noemi Andreea Dide'],['Rafael Voicu'],['Raul Ionescu'],['Rebeca Chircu'],['Rebeca Gîlcă'],
  ['Robert Mocanu'],['Roberta Elena Maria Toader'],['Sonia Maria Enescu'],
  ['Thea-Cristiana Medințu'],['Valentin Horvath'],['Vlad Gabriel Brinceanu'],
 ]],
];

/* permanențe voluntari · pe locații, calupuri de timp și zile
   [zi, [ [locație, [[calup, persoane]] ] ]] */
const PERMANENTE = [
 ['marți 28 iulie', [
   ['bilete · Centrul de Tineret', [['14:00-18:00','Antoniu Rareș + Chircu Rebeca']]],
 ]],
 ['miercuri 29 iulie', [
   ['bilete · Centrul de Tineret', [['10:00-13:00','Gîlcă Rebeca Ioana + Voicu Rafael'],['13:00-16:00','Antoniu Rareș + Jainea Bianca'],['16:00 → spectacol','Chircu Rebeca + Ionescu Raul-Ionuț']]],
   ['HQ · cort Piața', [['10:00-14:00','Enescu Sonia Maria + Medințu Emma-Gabriela'],['14:00-18:00','Anghel Mihaela + Medințu Thea-Cristiana'],['18:00 → final','Eric-Andrei Alexandri + Stănceoi Andreea Sorana']]],
   ['mese · Alex Tell', [['cină 18:00-20:00','Anelisse Vlad + Daria Micu']]],
   ['internat · Rulmentul', [['08-12','Gabriela Prună + Lorena Maftei'],['12-16','Mihnea Spătaru + Maria Dide'],['16-20','Mihnea Nițu + Florea Angelina'],['20 → petrecere','Andres Catruna + Maria Nedelcu']]],
 ]],
 ['joi 30 iulie', [
   ['bilete · Centrul de Tineret', [['10:00-13:00','Gîlcă Rebeca Ioana + Voicu Rafael'],['13:00-16:00','Antoniu Rareș + Jainea Bianca'],['16:00 → spectacol','Chircu Rebeca + Ionescu Raul-Ionuț']]],
   ['HQ · cort Piața', [['10:00-14:00','Enescu Sonia Maria + Medințu Emma-Gabriela'],['14:00-18:00','Anghel Mihaela + Medințu Thea-Cristiana'],['18:00 → final','Eric-Andrei Alexandri + Stănceoi Andreea Sorana']]],
   ['mese · Alex Tell', [['mic dejun 8:15-9:45','Anelisse Vlad + Daria Micu'],['prânz 13:45-15:30','Anelisse Vlad + Daria Micu'],['cină 18:45-20:30','Anelisse Vlad + Daria Micu']]],
   ['internat · Rulmentul', [['08-12','Mihnea Spătaru + Maria Dide'],['12-16','Andres Catruna + Maria Nedelcu'],['16-20','Mihnea Nițu + Florea Angelina'],['20-24','Gabriela Prună + Lorena Maftei']]],
 ]],
 ['vineri 31 iulie', [
   ['bilete · Centrul de Tineret', [['10:00-13:00','Gîlcă Rebeca Ioana + Voicu Rafael'],['13:00-16:00','Antoniu Rareș + Jainea Bianca'],['16:00 → spectacol','Chircu Rebeca + Ionescu Raul-Ionuț']]],
   ['HQ · cort Piața', [['10:00-14:00','Enescu Sonia Maria + Medințu Emma-Gabriela'],['14:00-18:00','Anghel Mihaela + Medințu Thea-Cristiana'],['18:00 → final','Eric-Andrei Alexandri + Stănceoi Andreea Sorana']]],
   ['mese · Alex Tell', [['mic dejun 8:15-9:45','Anelisse Vlad + Daria Micu'],['prânz 13:45-15:30','Anelisse Vlad + Daria Micu'],['cină 18:45-20:30','Anelisse Vlad + Daria Micu']]],
   ['internat · Rulmentul', [['08-12','Mihnea Spătaru + Mihnea Nițu'],['12-16','Gabriela Prună + Lorena Maftei'],['16-20','Andres Catruna + Maria Nedelcu'],['20-24','Florea Angelina + Maria Dide']]],
 ]],
 ['sâmbătă 1 august', [
   ['bilete · Centrul de Tineret', [['10:00-13:00','Gîlcă Rebeca Ioana + Voicu Rafael'],['13:00-16:00','Antoniu Rareș + Jainea Bianca'],['16:00 → spectacol','Chircu Rebeca + Ionescu Raul-Ionuț']]],
   ['HQ · cort Piața', [['10:00-14:00','Enescu Sonia Maria + Medințu Emma-Gabriela'],['14:00-18:00','Anghel Mihaela + Medințu Thea-Cristiana'],['18:00 → final','Eric-Andrei Alexandri + Stănceoi Andreea Sorana']]],
   ['mese · Alex Tell', [['mic dejun 8:15-9:45','Anelisse Vlad + Daria Micu'],['prânz 13:45-15:30','Anelisse Vlad + Daria Micu'],['cină 18:45-20:30','Anelisse Vlad + Daria Micu']]],
   ['internat · Rulmentul', [['08-12','Gabriela Prună + Lorena Maftei'],['12-16','Mihnea Spătaru + Maria Dide'],['16-20','Mihnea Nițu'],['20-24','Andres Catruna + Maria Nedelcu']]],
 ]],
 ['duminică 2 august', [
   ['bilete · Centrul de Tineret', [['10:00-13:00','Gîlcă Rebeca Ioana + Voicu Rafael'],['13:00-16:00','Antoniu Rareș + Jainea Bianca'],['16:00 → spectacol','Chircu Rebeca + Ionescu Raul-Ionuț']]],
   ['HQ · cort Piața', [['10:00-14:00','Enescu Sonia Maria + Medințu Emma-Gabriela'],['14:00-18:00','Anghel Mihaela + Medințu Thea-Cristiana'],['18:00 → final','Eric-Andrei Alexandri + Stănceoi Andreea Sorana']]],
   ['mese · Alex Tell', [['mic dejun 8:15-9:45','Anelisse Vlad + Daria Micu'],['prânz 13:45-15:30','Anelisse Vlad + Daria Micu'],['cină 18:45-20:30','Anelisse Vlad + Daria Micu']]],
   ['internat · Rulmentul', [['08-12','Mihnea Spătaru + Maria Dide'],['12-16','Andres Catruna + Maria Nedelcu'],['16-20','Mihnea Nițu'],['20-24','Gabriela Prună + Lorena Maftei']]],
 ]],
 ['luni 3 august', [
   ['HQ · cort Piața', [['10:00-14:00','Enescu Sonia Maria + Medințu Emma-Gabriela'],['14:00-18:00','Anghel Mihaela + Medințu Thea-Cristiana'],['18:00 → final','Eric-Andrei Alexandri + Stănceoi Andreea Sorana']]],
   ['mese · Alex Tell', [['mic dejun 8:15-9:45','Anelisse Vlad + Daria Micu'],['prânz 13:45-15:30','Anelisse Vlad + Daria Micu'],['cină 18:45-20:30','Anelisse Vlad + Daria Micu']]],
   ['internat · Rulmentul', [['08-12','Mihnea Spătaru + Mihnea Nițu'],['12-16','Gabriela Prună + Lorena Maftei'],['16-20','Andres Catruna + Maria Nedelcu'],['20-24','Maria Dide']]],
 ]],
 ['marți 4 august', [
   ['HQ · cort Piața', [['10:00-14:00','Enescu Sonia Maria + Medințu Emma-Gabriela'],['14:00-18:00','Anghel Mihaela + Medințu Thea-Cristiana'],['18:00 → final','Eric-Andrei Alexandri + Stănceoi Andreea Sorana']]],
   ['mese · Alex Tell', [['mic dejun 8:15-9:45','Anelisse Vlad + Daria Micu'],['prânz 13:45-15:30','Anelisse Vlad + Daria Micu'],['cină 18:45-20:30','Anelisse Vlad + Daria Micu']]],
   ['internat · Rulmentul', [['08-12','Gabriela Prună + Lorena Maftei'],['12-16','Mihnea Spătaru + Maria Dide'],['16-20','Mihnea Nițu + Iriș Marius-Andrei']]],
 ]],
];

/* murale (spații conexe) · [nume, adresă, orar de funcționare, contact] */
const MURALE = [
 ['Mural Ștrand','str. Alexandru Ghica 72-80','1-5 aug · zilnic 10:00-12:00 & 16:00-20:00','Maria Zurbagiu','0743 585 255'],
 ['Mural Clinica TeraVita','str. Ion Creangă 63','31 iul: 20:00-22:30 (trasare schiță) · 1-5 aug: 10:00-12:00 & 16:00-20:00','ATOMA','0757 150 915'],
];


/* locațiile din tabul +info */
const LOCS = [
 ['CMT','Centrul Multifuncțional pentru Tineri'],
 ['Piața Ideo Ideis','parc & pietonală · scena mare + scena mică'],
 ['Kaufland','în magazin & în parcare'],
 ['Școala 5','Școala Gimnazială nr. 5 „Mihai Eminescu”'],
 ['Sala sport „Mihai Viteazul”','Școala 2 · arte alăturate'],
 ['Sala sport „Ștefan cel Mare”','Școala 3 · arte alăturate'],
 ['Alex Tell','mese'],
 ['Cămin',''],
 ['Ștrand','Ștrandul Vedea'],
 ['Conciato',''],
 ['Primărie','Sala de Consiliu'],
];
