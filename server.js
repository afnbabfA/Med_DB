const express = require('express');
const app = express();
app.use(express.json());

const users = [
  { id: 1, username: 'admin', role: 'admin', patientAccess: 'all' },
  { id: 2, username: 'dr.smith', role: 'doctor', patientAccess: [1,2] },
  { id: 3, username: 'nurse.anna', role: 'nurse', patientAccess: [1,3] },
  { id: 4, username: 'viewer.tom', role: 'viewer', patientAccess: [2] }
];

const patients = [
  { id: 1, firstName: 'Jan', lastName: 'Kowalski' },
  { id: 2, firstName: 'Maria', lastName: 'Nowak' },
  { id: 3, firstName: 'Andrzej', lastName: 'Wiśniewski' }
];

const medicalRecords = [
  { id: 1, patientId: 1, date: '2024-07-15', type: 'Wizyta kontrolna', description: 'Kontrola ciśnienia', doctorId: 2 },
  { id: 2, patientId: 2, date: '2024-07-16', type: 'Badanie', description: 'Badanie krwi', doctorId: 2 }
];

function authMiddleware(req, res, next) {
  const userId = parseInt(req.header('user-id'), 10);
  const user = users.find(u => u.id === userId);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  req.user = user;
  next();
}

function requireEdit(req, res, next) {
  if (['admin', 'doctor', 'nurse'].includes(req.user.role)) return next();
  return res.status(403).json({ error: 'Forbidden' });
}

function checkPatientAccess(req, res, next) {
  const patientId = parseInt(req.params.id || req.params.patientId, 10);
  if (req.user.patientAccess === 'all' || req.user.patientAccess.includes(patientId)) {
    return next();
  }
  return res.status(403).json({ error: 'No access to patient' });
}

app.get('/permissions', authMiddleware, (req, res) => {
  res.json({
    canEdit: ['admin', 'doctor', 'nurse'].includes(req.user.role),
    canView: true
  });
});

app.get('/patients', authMiddleware, (req, res) => {
  const data = req.user.patientAccess === 'all'
    ? patients
    : patients.filter(p => req.user.patientAccess.includes(p.id));
  res.json(data);
});

app.post('/patients', authMiddleware, requireEdit, (req, res) => {
  const id = patients.length ? Math.max(...patients.map(p => p.id)) + 1 : 1;
  const patient = { id, ...req.body };
  patients.push(patient);
  res.status(201).json(patient);
});

app.get('/patients/:id', authMiddleware, checkPatientAccess, (req, res) => {
  const patient = patients.find(p => p.id === parseInt(req.params.id, 10));
  if (!patient) return res.status(404).end();
  res.json(patient);
});

app.put('/patients/:id', authMiddleware, checkPatientAccess, requireEdit, (req, res) => {
  const patient = patients.find(p => p.id === parseInt(req.params.id, 10));
  if (!patient) return res.status(404).end();
  Object.assign(patient, req.body);
  res.json(patient);
});

app.delete('/patients/:id', authMiddleware, checkPatientAccess, requireEdit, (req, res) => {
  const idx = patients.findIndex(p => p.id === parseInt(req.params.id, 10));
  if (idx === -1) return res.status(404).end();
  const [removed] = patients.splice(idx, 1);
  res.json(removed);
});

app.get('/patients/:id/history', authMiddleware, checkPatientAccess, (req, res) => {
  const records = medicalRecords.filter(r => r.patientId === parseInt(req.params.id, 10));
  res.json(records);
});

app.post('/patients/:id/history', authMiddleware, checkPatientAccess, requireEdit, (req, res) => {
  const id = medicalRecords.length ? Math.max(...medicalRecords.map(r => r.id)) + 1 : 1;
  const record = { id, patientId: parseInt(req.params.id, 10), ...req.body };
  medicalRecords.push(record);
  res.status(201).json(record);
});

app.put('/patients/:id/history/:recordId', authMiddleware, checkPatientAccess, requireEdit, (req, res) => {
  const record = medicalRecords.find(r => r.id === parseInt(req.params.recordId, 10));
  if (!record || record.patientId !== parseInt(req.params.id, 10)) return res.status(404).end();
  Object.assign(record, req.body);
  res.json(record);
});

app.delete('/patients/:id/history/:recordId', authMiddleware, checkPatientAccess, requireEdit, (req, res) => {
  const idx = medicalRecords.findIndex(r => r.id === parseInt(req.params.recordId, 10) && r.patientId === parseInt(req.params.id, 10));
  if (idx === -1) return res.status(404).end();
  const [removed] = medicalRecords.splice(idx, 1);
  res.json(removed);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
