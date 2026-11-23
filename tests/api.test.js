// Tests de l'API avec Jest (lanceur de tests) et Supertest (envoie de vraies requêtes HTTP à l'app).
// La base est un MongoDB temporaire en mémoire (mongodb-memory-server) : aucun risque pour la vraie base,
// et la base est vide à chaque lancement.
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');

let mongod;
let app;
let Book;
let User;

// Avant tous les tests : démarre la base en mémoire, puis charge l'app qui s'y connecte
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = 'secret-de-test';
  app = require('../app');
  Book = require('../models/Book');
  User = require('../models/User');
  await mongoose.connection.asPromise();
});

// Après tous les tests : ferme la connexion et arrête la base
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// Crée un compte puis se connecte : renvoie { userId, token }
async function createUserAndLogin(email, password = 'MotDePasse123!') {
  await request(app).post('/api/auth/signup').send({ email, password }).expect(201);
  const res = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
  return res.body;
}

describe('Connexion (POST /api/auth/login)', () => {
  beforeAll(async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'alice@test.fr', password: 'BonMotDePasse1' })
      .expect(201);
  });

  test('mot de passe faux : 401, sans token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@test.fr', password: 'mauvais' });

    expect(res.status).toBe(401);
    expect(res.body.token).toBeUndefined();
  });

  test("e-mail inconnu : même réponse qu'un mauvais mot de passe (ne révèle pas les comptes existants)", async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@test.fr', password: 'mauvais' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'personne@test.fr', password: 'mauvais' });

    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  test('bons identifiants : 200 avec userId et token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@test.fr', password: 'BonMotDePasse1' })
      .expect(200);

    expect(res.body.userId).toBeDefined();
    expect(typeof res.body.token).toBe('string');
  });

  test("le mot de passe n'est jamais stocké en clair (hachage bcrypt)", async () => {
    const user = await User.findOne({ email: 'alice@test.fr' });
    expect(user.password).not.toBe('BonMotDePasse1');
    expect(user.password).toMatch(/^\$2[aby]\$10\$/); // préfixe bcrypt, 10 tours
  });
});

describe('Injection NoSQL', () => {
  test('{"$ne": null} à la place de l\'e-mail : refusé (400), pas de connexion', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $ne: null }, password: { $ne: null } });

    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
  });

  test("sanitizeFilter : sans lui, {$ne: null} renverrait un utilisateur ; avec lui, la requête est refusée", async () => {
    // Deuxième protection, au niveau de Mongoose (app.js : mongoose.set('sanitizeFilter', true)).
    // Même si un contrôleur oubliait de vérifier le type de l'e-mail, l'attaque ne marcherait pas.
    expect(await User.countDocuments()).toBeGreaterThan(0);

    // Démonstration de l'attaque : même filtre envoyé directement à MongoDB, sans passer par Mongoose
    const sansProtection = await User.collection.findOne({ email: { $ne: null } });
    expect(sansProtection).not.toBeNull(); // « e-mail différent de null » = le premier compte venu

    // Avec la protection : $ne est traité comme une valeur à chercher et non comme un opérateur,
    // Mongoose ne peut pas la convertir en texte → erreur, aucun utilisateur renvoyé
    await expect(User.findOne({ email: { $ne: null } })).rejects.toThrow('Cast to string failed');
  });
});

describe('Droits sur les livres', () => {
  let owner;
  let other;
  let bookId;

  beforeAll(async () => {
    owner = await createUserAndLogin('proprietaire@test.fr');
    other = await createUserAndLogin('autre@test.fr');
    // Livre créé directement en base au nom du propriétaire (évite l'envoi d'une image)
    const book = await Book.create({
      userId: owner.userId,
      title: 'Le Petit Prince',
      author: 'Antoine de Saint-Exupéry',
      imageUrl: 'http://localhost:4000/images/test.webp',
      year: 1943,
      genre: 'Conte',
    });
    bookId = book._id.toString();
  });

  test('sans token : 401', async () => {
    await request(app).delete(`/api/books/${bookId}`).expect(401);
  });

  test('modifier le livre d\'un autre : 403, livre inchangé', async () => {
    const res = await request(app)
      .put(`/api/books/${bookId}`)
      .set('Authorization', `Bearer ${other.token}`)
      .send({ title: 'Titre piraté' });

    expect(res.status).toBe(403);
    const book = await Book.findById(bookId);
    expect(book.title).toBe('Le Petit Prince');
  });

  test('supprimer le livre d\'un autre : 403, livre toujours là', async () => {
    await request(app)
      .delete(`/api/books/${bookId}`)
      .set('Authorization', `Bearer ${other.token}`)
      .expect(403);

    expect(await Book.findById(bookId)).not.toBeNull();
  });

  test('le propriétaire peut modifier son livre : 200', async () => {
    await request(app)
      .put(`/api/books/${bookId}`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ title: 'Le Petit Prince (édition 2026)' })
      .expect(200);

    const book = await Book.findById(bookId);
    expect(book.title).toBe('Le Petit Prince (édition 2026)');
  });
});
