const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({message: 'Brak tokena'});
  const token = auth.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET || 'sekret', (err, user) => {
    if (err) return res.status(403).json({message: 'Nieprawidłowy token'});
    req.user = user;
    next();
  });
};
