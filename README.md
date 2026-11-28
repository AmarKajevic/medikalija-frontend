# Medikalija

Veb aplikacija za vođenje **doma za stara lica**. Na jednom mestu objedinjuje:

- korisnike doma i negu;
- lekove i zalihe;
- mesečni obračun (specifikaciju);
- lekarske izveštaje i fizikalnu terapiju;
- socijalni rad sa 20 Word obrazaca doma koji se sami popunjavaju.

Ovo je **frontend**, odnosno ono što osoblje otvara u pregledaču na računaru ili telefonu. Podatke čuva i pravila sprovodi backend: [medikalija-api](../medikalija-api).

## Problem koji rešava

U domu se podaci vode u sveskama, Excel tabelama i Word obrascima. Isti podatak (ime, JMBG, srodnici) prepisuje se desetinama puta, a obračun za porodicu sabira se ručno na kraju meseca. Medikalija to radi ovako:

- podatak o korisniku unosi se **jednom** i dalje se koristi u obračunu, izveštajima i obrascima;
- sestra označi šta je dala korisniku, a uprava **jednim klikom** odobri: stavka ulazi u račun i skida se sa stanja;
- obračun za svakih **30 dana** boravka pravi se sam, sa kursom evra, i štampa ili izvozi u PDF;
- socijalni radnik dobija **20 obrazaca** popunjenih podacima korisnika, u padežima i u pismu obrasca.

## Ko šta radi u aplikaciji

| Uloga | Početna strana i meni |
|---|---|
| **Administrator** | Sve. Uz to: osoblje i pristupi, cenovnici, podešavanja ustanove (naziv, logo, PIB, tekući račun) |
| **Glavna sestra (uprava)** | Kontrolna tabla, „Za odobrenje“, specifikacije, zalihe, analize, „Šabloni i cene“, dnevnik nege, aktivnosti osoblja |
| **Medicinska sestra** | „Unos nege“: dat lek, potrošen artikal, usluga nege. Porodične zalihe i artikli |
| **Doktor** | Današnji pregledi, nedovršeni izveštaji, lekarski izveštaji (nacrt, potpis, dopuna) |
| **Socijalni radnik** | Prijem korisnika, socijalni karton, rokovi i podsetnici, obrasci doma, raspored obračunskih perioda (samo datumi) |
| **Fizioterapeut** | Fizikalna terapija (redovna se beleži, vanredna ide na odobrenje) |

## Glavne funkcije

**Korisnici**
- Prijem kroz tri kartice:
  - *osnovni podaci*;
  - *detaljni podaci*: JMBG, lična karta, srodnici, staratelj, obveznik ugovora;
  - *socijalno-zdravstveni podaci*: obrazac 4.0.
- Profil sa karticama po ulozi: pregled, nega, lekarski izveštaj, socijalno, fizikalna terapija.
- Otpust sa razlogom i ponovni prijem. Raniji boravci ostaju vidljivi, a dokumentacija kreće od novog prijema.
- Pronalaženje duplikata i kada je jedno ime uneto ćirilicom, a drugo latinicom.

**Nega i odobravanje**
- Sestra i fizioterapeut beleže šta su uradili.
- Ono što se naplaćuje čeka upravu u „Za odobrenje“, a brojač stoji u meniju.
- Uprava prihvata ili odbija, pojedinačno ili sve odjednom.

**Zalihe**
- Lekovi i artikli doma, porodične zalihe po korisniku i rezerva lekova.
- Porodično stanje se troši prvo i ne naplaćuje se.

**Specifikacija (obračun)**
- Bira se bilo koji period od 30 dana, a može se dodati i propušten ili vanstandardni period.
- Na specifikaciju idu analize, lekovi, artikli, nega, stručne usluge i drugi troškovi.
- Obračun sabira dug i smeštaj u EUR i RSD, po nižem i srednjem kursu.
- Specifikacija se štampa ili izvozi u PDF, sa logom i podacima ustanove.
- Dok je otvorena, specifikacija ostaje kao kartica dole desno, pa može da se radi na drugim stranicama.

**Socijalni rad**
- Socijalni karton: beleške sa podsetnicima i stručni dokumenti (nacrt pa zaključen).
- Rokovi: procena 10 dana od prijema, plan 10 dana od procene.
- **20 obrazaca doma** ([public/social-forms](public/social-forms)):
  - šabloni su identični papirnim originalima i popunjavaju se u pregledaču;
  - pre štampe aplikacija kaže koji podatak nedostaje i gde se unosi.
- Socijalni radnik može da postavi i sopstvene Word šablone sa poljima.

**Ostalo**
- Lekarski izveštaji sa vitalnim parametrima i MKB-10 dijagnozama.
- Kalendar sa ponavljanjem termina.
- Aktivnosti osoblja, dnevnik nege, obaveštenja i pretraga.
- Prikaz cele aplikacije **latinicom ili ćirilicom**, svetla i tamna tema, rad na telefonu.

## Prijava i sesija

- Pristup je samo po pozivu: admin šalje link, a osoba postavlja lozinku. Moguća je i prijava Google nalogom.
- Access token se drži **samo u memoriji** pregledača, ne u `localStorage`.
- Sesija se osvežava preko httpOnly kolačića, tiho, u pozadini.
- Korisnik vidi svoje uređaje i može da ih odjavi.

## Tehnologije

- **React 19**, **TypeScript**, **Vite**
- **Tailwind CSS 4** i sopstveni dizajn sistem (`src/shared/ui`, boje i tipografija u `src/index.css`)
- **TanStack Query** (podaci sa servera), **Axios**, **React Router 7**
- **FullCalendar** (kalendar), **pdfmake** (PDF specifikacije), **docxtemplater** + **docx-preview** (Word obrasci), **docx** (izvoz rasporeda), **react-hook-form**
- **Sentry** (greške u produkciji), **Vitest** + **Testing Library** (testovi)
- Hosting: **Vercel**. Zahtevi na `/api` prosleđuju se backendu (`vercel.json`).

## Struktura (Feature-Sliced Design)

```
src/
  app/        ulaz, rute (paths.ts), meni po ulozi (navigation.tsx), provajderi (prijava, tema, pismo)
  pages/      stranice: Patients, care, inventory, medical, reports, social, physio, catalog, team, workspace, settings
  widgets/    okvir aplikacije (meni, zaglavlje, kartica otvorene specifikacije)
  features/   radnje: specifikacija, nega, socijalni rad i obrasci, kalendar, izveštaji...
  entities/   podaci domena: korisnik, lek, artikal, kurs, ustanova
  shared/     dizajn sistem (ui), API klijent, pomoćne funkcije
public/
  social-forms/   20 Word šablona obrazaca doma
```

Svaki sloj uvozi samo iz slojeva ispod sebe. Za uvoz između slojeva koriste se aliasi `@app/*`, `@pages/*`, `@widgets/*`, `@features/*`, `@entities/*` i `@shared/*`.

## Pokretanje

Potrebni su Node.js 22+ i pokrenut [Medikalija API](../medikalija-api), lokalno ili na serveru.

```bash
npm install
cp .env.example .env
npm run dev            # http://localhost:5173, /api ide na VITE_API_PROXY
```

| Komanda | Šta radi |
|---|---|
| `npm run dev` | Vite razvojni server |
| `npm run build` | Provera tipova i produkcijski build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Stroga provera TypeScript tipova |
| `npm test` | Testovi (Vitest + Testing Library) |
| `npm run preview` | Pregled produkcijskog builda |

### Promenljive okruženja

| Promenljiva | Opis |
|---|---|
| `VITE_API_PROXY` | Lokalni API na koji Vite prosleđuje `/api` (podrazumevano `http://localhost:5000`) |
| `VITE_API_URL` | Samo ako API nije iza `/api` na istom sajtu. U produkciji ostaje prazno. |
| `VITE_SENTRY_DSN` | Prijava grešaka u Sentry (opciono) |

> Za lokalni rad `VITE_API_URL` treba da ostane prazan, inače aplikacija šalje zahteve produkcijskom API-ju.

## Rad na kodu

- Svaka izmena ide kroz posebnu granu i pull request.
- GitHub Actions pokreće lint, testove i build.
- Vercel pravi probnu verziju za svaki PR, a produkciju objavljuje sa grane `main`.

Aplikacioni kod je vlasništvo ustanove za koju je napravljen.
