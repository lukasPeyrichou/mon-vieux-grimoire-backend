// Modèle Mongoose d'un utilisateur
const mongoose = require('mongoose');
// La v6 du plugin est publiée en module ES : la fonction se trouve dans .default
const uniqueValidator = require('mongoose-unique-validator').default;

const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  // On ne stocke jamais le mot de passe en clair, seulement son hachage (bcrypt, étape suivante)
  password: { type: String, required: true },
});

// Transforme un e-mail déjà utilisé en erreur de validation claire au lieu d'une erreur MongoDB brute
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
