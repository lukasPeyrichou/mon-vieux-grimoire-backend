// Modèle Utilisateur
const mongoose = require('mongoose');
// v6 publiée en module ES : fonction dans .default
const uniqueValidator = require('mongoose-unique-validator').default;

const userSchema = mongoose.Schema({
  // Forme texte@texte.texte ; parties sans chevauchement (pas de ReDoS), maxlength vérifié avant
  email: {
    type: String,
    required: true,
    unique: true,
    maxlength: 254,
    match: /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/,
  },
  // Hachage bcrypt, jamais en clair
  password: { type: String, required: true },
});

// E-mail déjà utilisé → erreur de validation claire
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
