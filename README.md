# program intern #21 — Festivalul ideo ideis

Programul intern al echipei pentru Festivalul **ideo ideis #21**
(29 iulie - 5 august 2026, Alexandria). Pagină statică, mobile-first,
cu două vederi: **listă** (cronologia zilei) și **pe locații**
(grilă timp × locație, ca tabelul intern), filtre pe categorii,
căutare și marcaj „acum” pe ora reală (Europe/Bucharest).

Site-ul live: **https://ideoideis.github.io/program-intern-21/**

## Cum actualizezi programul

Tot programul stă într-un singur fișier: [`program.js`](program.js).

1. Editează `program.js` (evenimente, transporturi, mese, rânduri @tehnic;
   formatul e explicat în comentariul din capul fișierului).
2. Actualizează `LAST_UPDATED` (data afișată în antetul paginii).
3. Commit + push pe `main`: pagina se republică automat prin GitHub Actions
   ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)).

Nu există build: `index.html` + `program.js` se servesc ca atare.

## Test local

```bash
python3 -m http.server 8080
# apoi deschide http://localhost:8080
```

Marcajul „acum” apare doar în zilele festivalului. Pentru a-l simula
în afara lor, adaugă `?test=<zi>-<ora>` la URL, de exemplu:

```
http://localhost:8080/?test=v31-19:32
```

(id-urile zilelor: ma28, mi29, j30, v31, s1, d2, l3, ma4, mi5)

## Linkuri personale pentru trupe

`?t=<id>` deschide programul cu salutul trupei, cu marcaj pe evenimentele ei
și fără repetițiile/spectacolele celorlalte trupe:

```
https://ideoideis.github.io/program-intern-21/?t=leira
```

Id-uri: `leira`, `atelierul`, `artwork`, `amprente`, `brainstorming`,
`alexandria`, `act`, `protha` (definite în `TRUPE_IDS` din `program.js`).

## Offline & print

- **Offline**: după prima vizită, pagina funcționează și fără net
  (service worker, `sw.js`); datele se împrospătează automat când există
  conexiune.
- **Print** (foi pe pereți pentru backstage): alegi ziua, Cmd/Ctrl+P.
  Pagina se tipărește pe fundal alb, în vederea listă, cu listele de săli
  expandate.

## Alte date editabile în `program.js`

- `BIRTHDAYS` — zile de naștere afișate în antetul zilei
  (ex. `{ v31: ['Maria (Artwork)'] }`).
- `FEEDBACK_URL` — linkul documentului de feedback în timp real
  (apare în +info când nu e `null`).
- `DEMO_NOW` — simulează marcajul „acum” în afara festivalului
  (`null` ca să îl stingi).

## Partea live (jurnal foto · anunțuri · feedback)

Rulează [`supabase/setup-21.sql`](supabase/setup-21.sql) O DATĂ în
Supabase -> SQL Editor (proiectul comun). Până atunci, partea live stă
ascunsă și pagina merge normal. După:

- **vibe check**: tabul „vibe” din rail (apare doar în zilele
  festivalului) e casa pozelor: feed invers cronologic, separat pe
  zile, upload din FAB-ul cameră (compresie pe telefon, 1280px JPEG),
  nume opțional, ștergerea propriei poze. Fișiere: bucketul
  `jurnal-21`; metadate: tabela `jurnal_photos`. Pentru nume + ștergere
  proprie rulează și [`supabase/setup-vibe.sql`](supabase/setup-vibe.sql)
  (fără el, vibe-ul merge, dar fără autor și fără ✕).
- **anunțuri**: banner sub banda de zile cu ultimul anunț (sub 24 h);
  publicare din +info. Tabela `anunturi_21`.
- **feedback**: idee / problemă, din +info. Tabela `feedback_21`.

Totul e decuplat: dacă Supabase nu răspunde, programul nu e afectat.

## Structură

- `index.html` — pagina (stil + logică, fără dependențe externe)
- `program.js` — datele programului (singurul fișier de editat uzual)
- `live.js` — jurnal foto, anunțuri, feedback (Supabase)
- `supabase/setup-21.sql` — de rulat o dată în SQL Editor
- `sw.js` — service worker (offline)
- `fonts/` — Söhne (buch + halbfett)
- `assets/` — eticheta ideo ideis, favicon
