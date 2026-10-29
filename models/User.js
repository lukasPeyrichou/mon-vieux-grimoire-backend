// Modèle Mongoose d'un utilisateur
const mongoose = require('mongoose');
// La v6 du plugin est publiée en module ES : la fonction se trouve dans .default
const uniqueValidator = require('mongoose-unique-validator').default;

const userSchema = mongoose.Schema({
  // match : refuse ce qui n'a pas la forme d'une adresse e-mail (texte@texte.texte). Les parties
  // ne peuvent pas se chevaucher (pas de @ ni de point dans un même morceau), ce qui garde le test
  // rapide même sur une saisie piégée ; maxlength (254, la limite des e-mails) passe avant
  email: {
    type: String,
    required: true,
    unique: true,
    maxlength: 254,
    match: /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/,
  },
  // On ne stocke jamais le mot de passe en clair, seulement son hachage (bcrypt, étape suivante)
  password: { type: String, required: true },
});

// Transforme un e-mail déjà utilisé en erreur de validation claire au lieu d'une erreur MongoDB brute
userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
