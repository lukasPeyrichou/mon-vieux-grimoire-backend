# Mon Vieux Grimoire — API back-end

API Node.js / Express / MongoDB du site de notation de livres **Mon Vieux Grimoire**
(projet 7 du parcours Développeur Web OpenClassrooms).

## Prérequis

- **Node.js 22 ou plus récent** (exigé par `mongoose-unique-validator` ; testé avec Node 25)
- Une base **MongoDB Atlas** (l'offre gratuite M0 suffit)

## Installation

```bash
cd backend
npm install
```

Créer ensuite le fichier `.env` à partir du modèle :

```bash
cp .env.example .env
```

puis renseigner les trois variables :

| Variable | Rôle |
|---|---|
| `PORT` | Port de l'API. Le front appelle `http://localhost:4000` : garder `4000`. |
| `MONGODB_URI` | Chaîne de connexion Atlas (*Database > Connect > Drivers*), avec le mot de passe de l'utilisateur de la base. |
| `JWT_SECRET` | Clé secrète qui signe les tokens. Pour en générer une : `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |

> Le fichier `.env` contient des secrets : il n'est pas versionné. Les valeurs utilisées
> pour la soutenance sont transmises séparément.

Dans Atlas, l'accès réseau est ouvert à `0.0.0.0/0` (*Security > Database & Network Access >
IP Access List*) pour que l'application puisse se lancer depuis n'importe quelle machine.

## Lancement

```bash
npm start       # node server.js
npm run dev     # nodemon : redémarre à chaque modification
```

La console doit afficher `Listening on port 4000` puis `Connexion à MongoDB réussie !`.

Lancer ensuite le front dans un second terminal (`cd frontend`, `npm install`, `npm start`),
qui s'ouvre sur `http://localhost:3000`.

## Routes

| Méthode | Route | Auth | Rôle |
|---|---|---|---|
| POST | `/api/auth/signup` | – | Crée un compte (mot de passe haché avec bcrypt) |
| POST | `/api/auth/login` | – | Renvoie `userId` et un token JWT valable 24 h |
| GET | `/api/books` | – | Tous les livres |
| GET | `/api/books/bestrating` | – | Les 3 livres les mieux notés |
| GET | `/api/books/:id` | – | Un livre |
| POST | `/api/books` | ✔ | Crée un livre (`book` en JSON texte + `image`) |
| PUT | `/api/books/:id` | ✔ propriétaire | Modifie un livre, avec ou sans nouvelle image |
| DELETE | `/api/books/:id` | ✔ propriétaire | Supprime le livre et son image |
| POST | `/api/books/:id/rating` | ✔ | Note un livre (0 à 5, une fois par utilisateur) |

Les routes protégées attendent l'en-tête `Authorization: Bearer <token>`.
Un utilisateur qui n'est pas le créateur du livre reçoit `403: unauthorized request`.

## Organisation du code

```
backend/
├── server.js               serveur HTTP (port, erreurs de démarrage)
├── app.js                  application Express : connexion MongoDB, middlewares, routes
├── models/                 schémas Mongoose User et Book
├── routes/                 association URL → contrôleur (+ middlewares)
├── controllers/            logique métier (auth, livres, notation)
├── middleware/
│   ├── auth.js             vérification du token JWT
│   └── multer-config.js    réception de l'image + optimisation sharp
└── images/                 couvertures enregistrées (non versionnées)
```

## Sécurité et green code

- Mots de passe hachés avec **bcrypt** ; e-mails uniques garantis par **mongoose-unique-validator**.
- Token **JWT** signé contenant l'`_id` de l'utilisateur, vérifié sur toutes les routes d'écriture.
- Le `userId` d'un livre ou d'une note vient toujours du token, jamais du corps de la requête.
- Modification d'un livre limitée aux champs `title`, `author`, `year`, `genre` (liste blanche).
- `sanitizeFilter` de Mongoose contre l'injection d'opérateurs (`{"$ne": null}`).
- Noms de fichiers images neutralisés (`path.basename`) avant toute suppression.
- **express-rate-limit** : 20 tentatives de connexion / inscription par IP toutes les 15 minutes.
- **helmet** : en-têtes HTTP de sécurité.
- Images réduites à 600 × 800 px maximum et converties en **WebP** par **sharp**
  (exemple mesuré : photo de 299 Ko → 13 Ko).
