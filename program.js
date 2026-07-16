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

const LAST_UPDATED = '16.07.2026';

/* Demo pentru marcajul "acum" în afara zilelor de festival:
   'zi-oră' (de ex. 'v31-19:32') sau null ca să îl stingi.
   În timpul festivalului ora reală are mereu prioritate. */
const DEMO_NOW = 'v31-19:32';

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
   {k:'e', t:'19:00', e:'21:00', cat:'alt', loc:'Conciato', title:'quiz civic pentru voluntari', sub:['cu FORUM APULUM']},
 ]},
 {id:'mi29', dw:'mi', dn:'29', full:'29 iulie', h2:'miercuri', events:[
   {k:'e', t:'08:30', e:'13:00', cat:'alt', loc:'Cămin', title:'sosiri trupe'},
   {k:'t', t:'13:00', route:'Cămin → CMT', note:'curse la 13:00 și 13:15'},
   {k:'e', t:'13:30', e:'14:30', cat:'cmt', loc:'CMT', title:'conferință interactivă In a Relationship'},
   {k:'e', t:'14:00', e:'15:00', cat:'alt', loc:'Primărie', locd:'Sala de Consiliu', title:'ședință coordonatori'},
   {k:'x', t:'15:00–20:00', ts:'15:00', text:'montare „Chaplin” + probe gală · CMT'},
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
   {k:'t', t:'08:15', route:'Cămin → CMT'},
   {k:'m', t:'08:30', e:'09:45', meal:'mic dejun', loc:'Alex Tell'},
   {k:'e', t:'10:00', e:'14:00', cat:'ateliere', loc:'Școala 5', title:'ateliere teatru tânăr'},
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
   {k:'m', t:'19:00', e:'20:00', meal:'cină', loc:'Alex Tell', trupa:'atelierul', note:'Atelierul de Teatru'},
   {k:'m', t:'19:00', e:'20:30', meal:'cină', loc:'Alex Tell'},
   {k:'e', t:'19:30', e:'20:00', c:true, cat:'tt', loc:'CMT', trupa:'atelierul', title:'montare · <b>Atelierul de Teatru</b>'},
   {k:'e', t:'20:30', e:'21:30', cat:'tt', loc:'CMT', trupa:'atelierul', title:'spectacol teatru tânăr · Atelierul de Teatru'},
   {k:'e', t:'21:30', e:'22:00', cat:'parada', loc:'Piața Ideo Ideis', title:'paradă papainoage „Actori la înălțime”', sub:['UNATC']},
   {k:'t', t:'21:45', route:'CMT → Cămin'},
   {k:'e', t:'22:30', e:'00:30', cat:'cine', loc:'Piața Ideo Ideis', title:'cinemateca târzie · „Catane”', sub:['1 h 36 · invitat TBC']},
   {k:'t', t:'00:15', route:'Piața Ideo Ideis → Cămin'},
 ]},
 {id:'v31', dw:'v', dn:'31', full:'31 iulie', h2:'vineri', events:[
   {k:'t', t:'08:15', route:'Cămin → Alex Tell'},
   {k:'m', t:'08:30', e:'09:45', meal:'mic dejun', loc:'Alex Tell'},
   {k:'e', t:'10:00', e:'14:00', cat:'ateliere', loc:'Școala 5', title:'ateliere teatru tânăr'},
   {k:'e', t:'10:00', e:'10:30', cat:'parada', loc:'Kaufland', locd:'în magazin', title:'paradă papainoage „Actori la înălțime”', sub:['UNATC']},
   {k:'e', t:'10:30', e:'11:30', cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'sesiune face painting', sub:['cu Alexa Istrate']},
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
   {k:'e', t:'18:00', e:'19:00', cat:'mare', loc:'Piața Ideo Ideis', locd:'scena mare', title:'Bine de știut #1 · adicția de jocuri de noroc', sub:['cu Alex Bogdan']},
   {k:'e', t:'18:00', e:'19:30', cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'sesiune face painting', sub:['cu Alexa Istrate']},
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
   {k:'e', t:'22:30', e:'00:30', cat:'cine', loc:'Piața Ideo Ideis', locd:'scena mare', title:'cinemateca târzie · „De capul nostru”', sub:['1 h 34 · Q&A cu Tudor Jurgiu (30 min)']},
   {k:'t', t:'00:15', route:'Piața Ideo Ideis → Cămin'},
 ]},
 {id:'s1', dw:'s', dn:'1', full:'1 august', h2:'sâmbătă', events:[
   {k:'t', t:'08:15', route:'Cămin → Alex Tell'},
   {k:'m', t:'08:30', e:'09:45', meal:'mic dejun', loc:'Alex Tell'},
   {k:'e', t:'10:00', e:'14:00', cat:'ateliere', loc:'Școala 5', title:'ateliere teatru tânăr'},
   {k:'e', t:'10:00', e:'12:30', cat:'artplay', loc:'Școala 5', title:'Siguranța bebelușului', sub:['puericultură · pentru părinți']},
   {k:'e', t:'10:00', e:'10:30', cat:'parada', loc:'Kaufland', locd:'în magazin', title:'paradă papainoage „Actori la înălțime”', sub:['UNATC']},
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
   {k:'e', t:'18:00', e:'19:00', cat:'mare', loc:'Piața Ideo Ideis', locd:'scena mare', title:'Bine de știut #2 · fraude financiare', sub:['cu Bogdan Ghebaur']},
   {k:'e', t:'18:00', e:'19:00', cat:'tt', loc:'CMT', trupa:'amprente', title:'spectacol teatru tânăr · Amprente'},
   {k:'e', t:'19:00', e:'20:00', c:true, cat:'cmt', loc:'CMT', title:'montare spectacol profesionist'},
   {k:'m', t:'19:00', e:'20:30', meal:'cină', loc:'Alex Tell'},
   {k:'e', t:'19:00', e:'20:30', cat:'mare', loc:'Piața Ideo Ideis', locd:'scena mare', title:'Seara Povestitorilor #2', sub:['cu Lucian Prună']},
   {k:'e', t:'19:30', e:'22:30', c:true, cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'montare · Multisenzorial'},
   {k:'e', t:'20:30', e:'22:00', cat:'cmt', loc:'CMT', title:'PARTY', sub:['Teatrul Metropolis, București · 1 h 30']},
   {k:'e', t:'20:30', e:'21:00', cat:'parada', loc:'Piața Ideo Ideis', locd:'scena mare', title:'paradă papainoage „Actori la înălțime”', sub:['UNATC']},
   {k:'e', t:'21:00', e:'21:30', cat:'mare', loc:'Piața Ideo Ideis', locd:'scena mare', title:'spectacol de jonglerie cu lumini', sub:['cu Vlad Benescu · CIAA']},
   {k:'t', t:'22:15', route:'CMT → Cămin'},
   {k:'e', t:'22:30', e:'23:45', cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'concert Multisenzorial', sub:['1 h 15']},
   {k:'t', t:'00:00', route:'Piața Ideo Ideis → Cămin'},
 ]},
 {id:'d2', dw:'d', dn:'2', full:'2 august', h2:'duminică', events:[
   {k:'t', t:'08:15', route:'Cămin → Alex Tell'},
   {k:'m', t:'08:30', e:'09:45', meal:'mic dejun', loc:'Alex Tell'},
   {k:'e', t:'09:30', e:'10:00', c:true, cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'repetiție · „Năzdrăvanii mărilor”'},
   {k:'e', t:'10:00', e:'14:00', cat:'ateliere', loc:'Școala 5', title:'ateliere arte alăturate', sub:['+ sălile de sport „Mihai Viteazul” & „Ștefan cel Mare”']},
   {k:'e', t:'10:00', e:'16:30', c:true, cat:'cmt', loc:'CMT', title:'montare și repetiție · <b>ODD COUTURE</b>'},
   {k:'e', t:'10:00', e:'12:30', cat:'artplay', loc:'Școala 5', title:'Prim ajutor pediatric', sub:['Asociația Moașelor']},
   {k:'e', t:'10:00', e:'12:00', cat:'artplay', loc:'Școala 5', title:'Animalul care te locuiește', sub:['atelier de arte grafice']},
   {k:'e', t:'10:00', e:'10:30', cat:'parada', loc:'Kaufland', locd:'în magazin', title:'paradă papainoage „Actori la înălțime”', sub:['UNATC']},
   {k:'e', t:'10:30', e:'12:00', cat:'kauf', loc:'Kaufland', locd:'în parcare', title:'face painting & baloane', sub:['CIAA']},
   {k:'e', t:'10:30', e:'12:30', cat:'artplay', loc:'Școala 5', title:'Se întâmplă între N-O-I', sub:['psihoeducație · 10-13 ani']},
   {k:'e', t:'10:30', e:'11:30', cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'spectacol pentru copii · „Năzdrăvanii mărilor”', sub:['cu Edi Cîrlan']},
   {k:'e', t:'11:00', e:'13:30', c:true, cat:'mare', loc:'Piața Ideo Ideis', locd:'scena mare', title:'repetiție · Zestrea'},
   {k:'e', t:'12:30', e:'13:30', cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'atelier cu păpuși', sub:['CIAA']},
   {k:'m', t:'14:00', e:'15:30', meal:'prânz', loc:'Alex Tell'},
   {k:'e', t:'14:30', e:'16:30', cat:'artplay', loc:'Școala 5', title:'Se întâmplă între N-O-I', sub:['psihoeducație · 14-18 ani']},
   {k:'e', t:'15:00', e:'18:00', cat:'artplay', loc:'Școala 5', title:'De la pasiune la profesie: unde-i locul meu?', sub:['orientare vocațională']},
   {k:'t', t:'15:30', route:'Alex Tell → Cămin'},
   {k:'e', t:'16:00', e:'18:00', cat:'artplay', loc:'Piața Ideo Ideis', locd:'lângă scena mică', title:'Alexandria la 50 de grade', sub:['atelier de prospectivă']},
   {k:'t', t:'16:30', route:'Cămin → CMT', trupa:'brainstorming', note:'Brainstorming'},
   {k:'e', t:'16:30', e:'17:30', c:true, cat:'tt', loc:'CMT', trupa:'brainstorming', title:'repetiție și montare · <b>Brainstorming</b>'},
   {k:'e', t:'17:00', e:'18:00', cat:'mica', loc:'Piața Ideo Ideis', locd:'scena mică', title:'atelier de inițiere în jonglerie', sub:['cu Vlad Benescu · CIAA']},
   {k:'t', t:'17:30', route:'Cămin → CMT'},
   {k:'e', t:'18:00', e:'19:00', cat:'tt', loc:'CMT', trupa:'brainstorming', title:'spectacol teatru tânăr · Brainstorming'},
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
   {k:'e', t:'22:30', e:'00:30', cat:'cine', loc:'CMT', title:'cinemateca târzie · „Malul Vânăt”', sub:['1 h 32 · Q&A cu Andreea Cristina Borțun (30 min)']},
   {k:'t', t:'00:15', route:'CMT → Cămin'},
 ]},
 {id:'l3', dw:'l', dn:'3', full:'3 august', h2:'luni', events:[
   {k:'x', t:'toată ziua', ts:'08:00', text:'demontare și strâns outdoor · Piața Ideo Ideis'},
   {k:'t', t:'08:15', route:'Cămin → Alex Tell'},
   {k:'m', t:'08:30', e:'09:45', meal:'mic dejun', loc:'Alex Tell'},
   {k:'e', t:'10:00', e:'14:00', cat:'ateliere', loc:'Școala 5', title:'ateliere arte alăturate', sub:['+ sălile de sport „Mihai Viteazul” & „Ștefan cel Mare”']},
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
   {k:'e', t:'20:30', e:'21:00', c:true, cat:'cine', loc:'CMT', title:'montare tehnic · cinemateca târzie'},
   {k:'t', t:'20:45', route:'Cămin → CMT'},
   {k:'e', t:'21:00', e:'22:45', cat:'cine', loc:'CMT', title:'cinemateca târzie · „Atlasul Universului”', sub:['1 h 25 · Q&A cu Paul Negoescu (TBC), 15 min']},
   {k:'t', t:'22:45', route:'CMT → Cămin'},
 ]},
 {id:'ma4', dw:'ma', dn:'4', full:'4 august', h2:'marți', events:[
   {k:'t', t:'08:15', route:'Cămin → Alex Tell'},
   {k:'m', t:'08:30', e:'09:45', meal:'mic dejun', loc:'Alex Tell'},
   {k:'e', t:'10:00', e:'14:00', cat:'ateliere', loc:'Școala 5', title:'ateliere arte alăturate', sub:['+ sălile de sport „Mihai Viteazul” & „Ștefan cel Mare”']},
   {k:'e', t:'10:00', e:'12:00', cat:'artplay', loc:'Școala 5', title:'Animalul care te locuiește', sub:['atelier de arte grafice']},
   {k:'m', t:'14:00', e:'15:30', meal:'prânz', loc:'Alex Tell'},
   {k:'t', t:'15:30', route:'CMT → Cămin'},
   {k:'t', t:'16:30', route:'Cămin → CMT', trupa:'protha', note:'Protha'},
   {k:'e', t:'16:30', e:'17:30', c:true, cat:'tt', loc:'CMT', trupa:'protha', title:'repetiție și montare · <b>Protha</b>'},
   {k:'t', t:'17:30', route:'Cămin → CMT'},
   {k:'e', t:'18:00', e:'19:00', cat:'tt', loc:'CMT', trupa:'protha', title:'spectacol teatru tânăr · Protha'},
   {k:'m', t:'19:00', e:'20:30', meal:'cină', loc:'Alex Tell'},
   {k:'e', t:'19:00', e:'20:30', c:true, cat:'cmt', loc:'CMT', title:'pregătire gală'},
   {k:'e', t:'20:30', e:'22:00', cat:'cmt', loc:'CMT', title:'gală de închidere'},
   {k:'t', t:'22:15', route:'CMT → Ștrand'},
   {k:'e', t:'22:30', e:'03:00', cat:'alt', loc:'Ștrand', title:'closing party · DJ Oldskull'},
   {k:'t', t:'03:00', route:'Ștrand → Cămin'},
 ]},
 {id:'mi5', dw:'mi', dn:'5', full:'5 august', h2:'miercuri', events:[
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

/* trupele #21 și spectacolele lor (tabul +info) */
const TRUPE = [
 ['Trupa Leira','joi 30 iulie · 18:00'],
 ['Atelierul de Teatru','joi 30 iulie · 20:30'],
 ['Artwork','vineri 31 iulie · 18:00'],
 ['Amprente','sâmbătă 1 august · 18:00'],
 ['Brainstorming','duminică 2 august · 18:00'],
 ['Alexandria','luni 3 august · 17:00'],
 ['ACT','luni 3 august · 19:30'],
 ['Protha','marți 4 august · 18:00'],
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
