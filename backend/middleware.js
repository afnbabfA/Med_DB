const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Brak tokena' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET || 'sekret', (err, user) => {
    if (err) return res.status(403).json({ message: 'Nieprawidłowy token' });
    req.user = user;
    next();
  });
}

function permit(action) {
  return (req, res, next) => {
    const { role, patientAccess } = req.user;
    const id = parseInt(
      req.params.id ||
      req.params.patientId ||
      req.query.patientId ||
      req.body.patientId
    );
    const isAdmin = role === 'admin';
    const canWrite = ['admin', 'doctor', 'nurse'].includes(role);
    const canRead = canWrite || role === 'viewer';

    if (action === 'write' && !canWrite) {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    if (action === 'read' && !canRead) {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    if (id && !isAdmin) {
      const access = Array.isArray(patientAccess) ? patientAccess : [];
      if (!access.includes(id)) {
        return res.status(403).json({ message: 'Brak dostępu do pacjenta' });
      }
    }
    next();
  };
}

module.exports = { auth, permit };
