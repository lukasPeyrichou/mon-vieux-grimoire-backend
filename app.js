// App Express : middlewares et routes
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');

const userRoutes = require('./routes/user');
const bookRoutes = require('./routes/book');

// Bloque l'injection d'opérateurs MongoDB ($ne, $gt...) dans les données reçues
mongoose.set('sanitizeFilter', true);

// Connexion MongoDB (URI dans .env)
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch((error) => console.error('Connexion à MongoDB échouée :', error.message));

const app = express();

// En-têtes de sécurité ; cross-origin pour que le front (3000) affiche les images (4000)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Corps JSON → req.body
app.use(express.json());

// CORS : autorise le front à appeler l'API
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

// Sert les images sur /images/<fichier>
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/api/auth', userRoutes);
app.use('/api/books', bookRoutes);

module.exports = app;
