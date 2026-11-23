// Utilisé UNIQUEMENT par Jest (l'API ne passe jamais par Babel).
// mongoose-unique-validator v6 est publié en module ES (import/export) ; Jest charge le code
// en CommonJS (require) et ne sait pas lire ce format avant Node 24.9. Babel le convertit
// pendant les tests (voir "transformIgnorePatterns" dans package.json).
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
};
