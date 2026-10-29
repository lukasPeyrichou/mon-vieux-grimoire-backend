// Contrôleur d'authentification : inscription et connexion des utilisateurs
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/auth/signup : hache le mot de passe puis enregistre l'utilisateur
exports.signup = (req, res) => {
  // (avec Express 5, req.body vaut undefined si la requête n'a pas de corps)
  const { email, password } = req.body || {};
  // bcrypt accepterait de hacher une chaîne vide : on refuse un mot de passe vide
  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'Le mot de passe est requis !' });
  }
  // 10 tours de salage : bon compromis entre sécurité et temps de calcul
  bcrypt
    .hash(password, 10)
    .then((hash) => {
      const user = new User({
        email,
        password: hash,
      });
      return user.save();
    })
    .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
    // Erreur de validation (e-mail manquant ou déjà utilisé) renvoyée telle quelle
    .catch((error) => res.status(400).json({ error }));
};

// POST /api/auth/login : vérifie les identifiants et renvoie un token signé
exports.login = (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'E-mail et mot de passe requis !' });
  }
  User.findOne({ email })
    .then((user) => {
      // Même message que pour un mauvais mot de passe : on ne révèle pas quels e-mails existent
      if (!user) {
        return res.status(401).json({ message: 'Paire identifiant/mot de passe incorrecte' });
      }
      return bcrypt.compare(password, user.password).then((valid) => {
        if (!valid) {
          return res.status(401).json({ message: 'Paire identifiant/mot de passe incorrecte' });
        }
        res.status(200).json({
          userId: user._id,
          // Le token contient l'_id de l'utilisateur et expire au bout de 24 h
          token: jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' }),
        });
      });
    })
    .catch((error) => res.status(500).json({ error }));
};
