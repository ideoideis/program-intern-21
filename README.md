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

## Structură

- `index.html` — pagina (stil + logică, fără dependențe externe)
- `program.js` — datele programului (singurul fișier de editat uzual)
- `fonts/` — Söhne (buch + halbfett)
- `assets/` — eticheta ideo ideis, favicon
