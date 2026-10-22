<h1><center>Test salles de réunions</center></h1>

<br />

_Au sein de Adlin il est prévu un grand nombre de salles de réunions. Ton objectif est de
coder une brique du système de réservation._

```
Faire un petit site pour pouvoir rechercher et réserver l’une des salle de réunion, en fonction
des disponibilités, de la capacité et des équipements. Tu n’as pas besoin de réaliser la
gestion de compte.

Chaque réservation doit être enregistrée dans un fichier .json

Lors d'une seconde recherche, si on cherche pour la même date/heure, la salle de réunion
réservée précédemment n'apparaîtra pas dans la liste des salles disponibles.
```
<br />
<h2>Consignes:</h2>

```
- Le back end doit être en NodeJS et utiliser Express
- Le front end doit être en VueJS/NuxtJS
- Les réservations / la récupération des salles de réunions doit se faire en AJAX via
  des API REST
- Tu as le choix du format pour stocker vos réservations, mais elles doivent se trouver
  dans un fichier .json
- Nous serons particulièrement attentif à la facilité d’utilisation et à la sécurité du
  système
```
Ressources:
```
Liste des salles de réunions est fourni dans un fichier .json en pièce jointe: salles.json
```
Bonus:
```
- Une version hostée de ton app
- Utiliser mongodb pour stocker les réservations
- Pouvoir filtrer les salles de réunions via des filtres (équipements,
  capacité) - Animations lors d'une réservation, Un design pas trop moche ;)
```

---

# Running the project

The brief above is the original assignment. This part explains how the app is built and run.

## Start it

You need Docker with Compose v2.

```bash
cp .env.example .env        # first time only; then set MONGO_ROOT_PASSWORD
docker compose up --build
```

The web app is on http://localhost:3000 and the API on http://localhost:4000/api. MongoDB listens on
127.0.0.1:27017 only. At every start the API loads the five rooms from `salles.json` into MongoDB.

## Develop and test

You need Node 24 or later.

```bash
npm ci
npm run typecheck && npm run lint && npm test && npm run build
```

`npm test` runs the shared unit tests and the API tests against an in-memory MongoDB, so it needs no
Docker. The end-to-end tests drive a real browser and need a running MongoDB:

```bash
docker compose up -d mongo
docker compose stop api web     # the e2e run starts its own api and web on ports 4000 and 3000
npm run test:e2e
```

They use a separate database, `adlin_e2e`, and clear its bookings before each run.

## API

The full contract is in [specs/001-room-search-booking/contracts/rest-api.yaml](specs/001-room-search-booking/contracts/rest-api.yaml).

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Liveness and database check |
| `GET /api/rooms` | All rooms and the list of equipment names |
| `GET /api/rooms/available` | Rooms free for `start` and `end`, optionally filtered by `minCapacity` and `equipment` |
| `POST /api/bookings` | Book a room for a slot |

Times travel as UTC instants on a 15-minute grid. The page shows and accepts Paris time whatever the
device time zone is.

## How double booking is prevented

Each booking stores the 15-minute slots it covers. A unique index on room and slot makes MongoDB
refuse any insert that shares a slot with an existing booking of the same room, so two simultaneous
requests for the same room give one `201` and one `409`. There is no check-then-insert step to race.
The test suite sends 20 parallel identical requests and expects exactly one success. A booking is
reported as confirmed only after the journaled write completes, so it survives an API restart.

## Security measures

- Every query string and body is validated against a strict schema, and unknown fields are rejected.
- Filters are built from validated values only, so a value such as `{"$ne": "x"}` never reaches MongoDB.
- Errors use one fixed shape. Stack traces, paths and driver messages stay in the server logs.
- The API sets security headers with helmet, allows only the web origin through CORS, caps request
  bodies at 10 kB and limits booking attempts to 10 per minute per client.
- The web app sends a Content-Security-Policy without `unsafe-inline`: the server hashes the inline
  scripts of the page shell on each response. User text is never rendered with `v-html`.
- Secrets come from environment variables. `.env` is not committed.

## Where bookings are stored

The brief asks for a `.json` file. This project stores bookings in MongoDB only, which the brief lists
as a bonus, and keeps no JSON copy. `salles.json` stays the read-only source of the rooms.

## Known issue: npm audit

`npm audit` reports 11 high-severity findings. All come from two packages, `braces` and `node-forge`,
which Nuxt's build and dev tooling pulls in through nitropack. No patched release exists: the latest
versions (3.0.3 and 1.4.0) are still inside the vulnerable ranges. Neither package is in the
production web image or in the API's production dependencies. Downgrading Nuxt to 4.1.3, which is what
`npm audit fix --force` suggests, produced 12 findings including 4 critical, so Nuxt stays on 4.6.x.
This needs another look once upstream ships fixes.
