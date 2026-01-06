# Aplikacija za Prikaz Spotify Statistike

Ta projekt je spletna aplikacija, zgrajena z ogrodjem React, ki uporabnikom omogoča pregled njihovih osebnih glasbenih statistik s pomočjo Spotify Web API-ja. Aplikacija ponuja vpogled v najbolj poslušane izvajalce, pesmi, žanre in zgodovino predvajanja.

## Funkcionalnosti

*   **Vpogled v Top Izvajalce in Pesmi:** Uporabniki lahko pregledujejo svojih top 10 izvajalcev in pesmi za različna časovna obdobja (zadnji mesec, zadnjih 6 mesecev, ves čas).
*   **Odkrivanje Top Žanrov:** Aplikacija analizira top izvajalce in izpiše najbolj priljubljene glasbene žanre uporabnika.
*   **Zgodovina Predvajanja:** Prikaz seznama nazadnje predvajanih pesmi.
*   **Seznami Predvajanja (Playliste):** Uporabniki lahko brskajo po svojih seznamih predvajanja in si ogledajo pesmi v njih.
*   **Iskanje:** Možnost iskanja po celotni Spotify knjižnici za izvajalci in pesmimi.
*   **Skrbniški Panel:** Poseben vmesnik za administratorja, ki omogoča upravljanje z zahtevki za dostop.
*   **Odziven Dizajn:** Aplikacija je prilagojena za uporabo na različnih napravah, vključno z mobilnimi telefoni, kjer navigacija omogoča horizontalno drsenje.

## Tehnologije

*   **Frontend:** React (z Vite)
*   **Stiliranje:** CSS
*   **Backend & Avtentikacija:** Firebase (Firestore za bazo podatkov) in Spotify Web API.
*   **Gostovanje:** Firebase Hosting

## Avtentikacija in Avtorizacija

Aplikacija uporablja kombinacijo sistema za odobritev po meri in standardnega protokola OAuth 2.0, ki ga zahteva Spotify. Postopek je zasnovan tako, da imajo do aplikacije dostop le preverjeni uporabniki.

### 1. Postopek za Novega Uporabnika

Ker je dostop do podatkov omejen, mora nov uporabnik najprej zaprositi za dostop:
1.  Na prijavni strani uporabnik vpiše svoj e-poštni naslov, s katerim je registriran na Spotify.
2.  Ta e-poštni naslov se shrani v **Firebase Firestore** zbirko z imenom `pending_users`.

### 2. Skrbniško Upravljanje

Administrator aplikacije (dodeljen s statičnim e-poštnim naslovom v kodi) ima dostop do posebnega zavihka "Administrator":
1.  V tem zavihku se izpišejo vsi e-poštni naslovi iz zbirke `pending_users`.
2.  Administrator ročno preveri uporabnika in ga nato **doda na seznam pooblaščenih uporabnikov v nadzorni plošči Spotify Developer Dashboarda**.
3.  S klikom na gumb "Dodaj in zbriši" se uporabnikov e-naslov odstrani iz čakalnega seznama v Firestore bazi.

### 3. Tehnični Potek Prijave (OAuth 2.0)

Ko je uporabnik odobren s strani administratorja, se lahko prijavi:
1.  Uporabnik klikne na gumb **"PRIJAVI SE S SPOTIFY"**.
2.  Preusmerjen je na Spotify stran za avtorizacijo, kjer aplikaciji dovoli dostop do svojih podatkov (scopes: `user-read-private`, `user-read-email`, `user-top-read`, `user-read-recently-played`).
3.  Po uspešni avtorizaciji Spotify uporabnika preusmeri nazaj na aplikacijo, v URL pa doda začasno avtorizacijsko kodo (`code`).
4.  Aplikacija v ozadju pošlje to kodo na strežniško funkcijo (Firebase Cloud Function), ki jo varno zamenja za **dostopni žeton (access token)** pri Spotify API-ju.
5.  Prejeti dostopni žeton se shrani v brskalnikov `localStorage`, kar uporabniku omogoča, da ostane prijavljen. Ta žeton se nato uporablja za vse klice na Spotify API.
6.  V primeru, da žeton poteče ali postane neveljaven, je uporabnik samodejno odjavljen.
