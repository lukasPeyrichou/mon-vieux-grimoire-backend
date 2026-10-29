// Inscription et connexion
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/auth/signup
exports.signup = (req, res) => {
  // Express 5 : req.body est undefined sans corps
  const { email, password } = req.body || {};
  // bcrypt accepterait un mot de passe vide
  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'Le mot de passe est requis !' });
  }
  // 10 tours de salage : compromis sécurité / rapidité
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
    // E-mail manquant, invalide ou déjà utilisé
    .catch((error) => res.status(400).json({ error }));
};

// POST /api/auth/login : renvoie un token signé
exports.login = (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'E-mail et mot de passe requis !' });
  }
  User.findOne({ email })
    .then((user) => {
      // Même message qu'un mauvais mot de passe : ne révèle pas les e-mails existants
      if (!user) {
        return res.status(401).json({ message: 'Paire identifiant/mot de passe incorrecte' });
      }
      return bcrypt.compare(password, user.password).then((valid) => {
        if (!valid) {
          return res.status(401).json({ message: 'Paire identifiant/mot de passe incorrecte' });
        }
        res.status(200).json({
          userId: user._id,
          // Contient l'_id, expire après 24 h
          token: jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' }),
        });
      });
    })
    .catch((error) => res.status(500).json({ error }));
};
