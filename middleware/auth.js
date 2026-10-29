// Bloque la requête si le token JWT est absent ou invalide
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Message explicite (l'erreur JS serait vide en JSON)
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Requête non authentifiée !' });
  }
  try {
    // « Bearer <token> »
    const token = req.headers.authorization.split(' ')[1];
    // Vérifie signature et expiration
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    // Sert aux contrôleurs à vérifier le propriétaire
    req.auth = { userId: decodedToken.userId };
    next();
  } catch (error) {
    res.status(401).json({ error });
  }
};
