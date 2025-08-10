const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const cors = require('cors');
const pool = require('./db');
const { auth, permit } = require('./middleware');
const multer = require('multer');
const csvParse = require('csv-parse/sync');
const xlsx = require('xlsx');

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(cors());
app.use(express.json());

async function init() {
  if (process.env.NODE_ENV !== 'test') {
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      patient_access INTEGER[] DEFAULT '{}'::INTEGER[]
    );`);
    await pool.query(`CREATE TABLE IF NOT EXISTS patients (
      id SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      pesel TEXT NOT NULL
    );`);
    await pool.query(`CREATE TABLE IF NOT EXISTS medical_records (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      diagnosis TEXT,
      treatment TEXT
    );`);
    await pool.query(`CREATE TABLE IF NOT EXISTS lab_results (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
      test_name TEXT NOT NULL,
      date DATE NOT NULL,
      value TEXT NOT NULL
    );`);
  }
  const hashed = await bcrypt.hash('admin123', 10);
  await pool.query(
    `INSERT INTO users (username, password, role, patient_access) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING`,
    ['admin', hashed, 'admin', null]
  );
}

app.post('/api/login', [
  body('username').notEmpty(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { username, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE username=$1', [username]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ message: 'Błędne dane logowania' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ message: 'Błędne dane logowania' });
  const patientAccess = user.patient_access || [];
  const token = jwt.sign({ id: user.id, role: user.role, patientAccess }, process.env.JWT_SECRET || 'sekret', { expiresIn: '1h' });
  const permissions = {
    canAddPatient: ['admin', 'doctor', 'nurse'].includes(user.role),
    canAddRecord: ['admin', 'doctor'].includes(user.role),
    canAddComment: ['admin', 'doctor', 'nurse'].includes(user.role),
    canAddLabResult: ['admin', 'doctor', 'nurse'].includes(user.role),
    isAdmin: user.role === 'admin'
  };
  res.json({ token, role: user.role, patientAccess, permissions });
});

app.get('/api/patients', auth, permit('read'), async (req, res) => {
  let result;
  if (req.user.role === 'admin') {
    result = await pool.query('SELECT id, first_name, last_name, pesel FROM patients');
  } else {
    const ids = req.user.patientAccess || [];
    if (ids.length === 0) return res.json([]);
    result = await pool.query('SELECT id, first_name, last_name, pesel FROM patients WHERE id = ANY($1)', [ids]);
  }
  res.json(result.rows);
});

app.post('/api/patients', auth, permit('write'), [
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('pesel').isLength({ min: 11, max: 11 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { firstName, lastName, pesel } = req.body;
  const result = await pool.query(
    'INSERT INTO patients (first_name, last_name, pesel) VALUES ($1, $2, $3) RETURNING *',
    [firstName, lastName, pesel]
  );
  res.status(201).json(result.rows[0]);
});

app.get('/api/patients/:id', auth, permit('read'), async (req, res) => {
  const result = await pool.query('SELECT id, first_name, last_name, pesel FROM patients WHERE id=$1', [req.params.id]);
  if (result.rows.length === 0) return res.status(404).json({ message: 'Nie znaleziono pacjenta' });
  res.json(result.rows[0]);
});

app.put('/api/patients/:id', auth, permit('write'), [
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('pesel').isLength({ min: 11, max: 11 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { firstName, lastName, pesel } = req.body;
  const result = await pool.query(
    'UPDATE patients SET first_name=$1, last_name=$2, pesel=$3 WHERE id=$4 RETURNING *',
    [firstName, lastName, pesel, req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ message: 'Nie znaleziono pacjenta' });
  res.json(result.rows[0]);
});

app.delete('/api/patients/:id', auth, permit('write'), async (req, res) => {
  await pool.query('DELETE FROM patients WHERE id=$1', [req.params.id]);
  res.status(204).end();
});

app.get('/api/medical-records', auth, permit('read'), async (req, res) => {
  const { patientId } = req.query;
  if (!patientId) return res.status(400).json({ message: 'patientId required' });
  const result = await pool.query('SELECT id, patient_id, date, type, description, diagnosis, treatment FROM medical_records WHERE patient_id=$1 ORDER BY date DESC', [patientId]);
  res.json(result.rows);
});

app.post('/api/medical-records', auth, permit('write'), [
  body('patientId').isInt(),
  body('date').notEmpty(),
  body('type').notEmpty(),
  body('description').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { patientId, date, type, description, diagnosis, treatment } = req.body;
  const result = await pool.query(
    'INSERT INTO medical_records (patient_id, date, type, description, diagnosis, treatment) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
    [patientId, date, type, description, diagnosis, treatment]
  );
  res.status(201).json(result.rows[0]);
});

app.put('/api/medical-records/:id', auth, async (req, res) => {
  const recordRes = await pool.query('SELECT patient_id FROM medical_records WHERE id=$1', [req.params.id]);
  if (recordRes.rows.length === 0) return res.status(404).json({ message: 'Nie znaleziono rekordu' });
  const patientId = recordRes.rows[0].patient_id;
  const access = req.user.role === 'admin' ? true : (req.user.patientAccess || []).includes(patientId);
  const canWrite = ['admin', 'doctor', 'nurse'].includes(req.user.role);
  if (!canWrite || !access) return res.status(403).json({ message: 'Brak uprawnień' });
  const { date, type, description, diagnosis, treatment } = req.body;
  const result = await pool.query(
    'UPDATE medical_records SET date=$1, type=$2, description=$3, diagnosis=$4, treatment=$5 WHERE id=$6 RETURNING *',
    [date, type, description, diagnosis, treatment, req.params.id]
  );
  res.json(result.rows[0]);
});

app.delete('/api/medical-records/:id', auth, async (req, res) => {
  const recordRes = await pool.query('SELECT patient_id FROM medical_records WHERE id=$1', [req.params.id]);
  if (recordRes.rows.length === 0) return res.status(404).json({ message: 'Nie znaleziono rekordu' });
  const patientId = recordRes.rows[0].patient_id;
  const access = req.user.role === 'admin' ? true : (req.user.patientAccess || []).includes(patientId);
  const canWrite = ['admin', 'doctor', 'nurse'].includes(req.user.role);
  if (!canWrite || !access) return res.status(403).json({ message: 'Brak uprawnień' });
  await pool.query('DELETE FROM medical_records WHERE id=$1', [req.params.id]);
  res.status(204).end();
});

app.post('/api/lab-results/import', auth, permit('write'), upload.single('file'), async (req, res) => {
  const { patientId } = req.body;
  if (!patientId || !req.file) {
    return res.status(400).json({ message: 'Brak danych' });
  }
  try {
    let rows;
    if (req.file.mimetype === 'text/csv' || req.file.originalname.endsWith('.csv')) {
      const text = req.file.buffer.toString('utf8');
      rows = csvParse.parse(text, { columns: true, skip_empty_lines: true });
    } else {
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }
    const promises = rows.map(r =>
      pool.query(
        'INSERT INTO lab_results (patient_id, test_name, date, value) VALUES ($1, $2, $3, $4)',
        [patientId, r.testName || r.test_name, r.date, r.value]
      )
    );
    await Promise.all(promises);
    res.json({ inserted: rows.length });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Niepoprawny plik' });
  }
});

app.post('/api/lab-results', auth, permit('write'), [
  body('patientId').isInt(),
  body('testName').notEmpty(),
  body('date').notEmpty(),
  body('value').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { patientId, testName, date, value } = req.body;
  const result = await pool.query(
    'INSERT INTO lab_results (patient_id, test_name, date, value) VALUES ($1,$2,$3,$4) RETURNING *',
    [patientId, testName, date, value]
  );
  res.status(201).json(result.rows[0]);
});

app.get('/api/lab-results', auth, permit('read'), async (req, res) => {
  const { patientId, testName, from, to } = req.query;
  if (!patientId) return res.status(400).json({ message: 'patientId required' });
  let query = 'SELECT test_name, date, value FROM lab_results WHERE patient_id=$1';
  const params = [patientId];
  if (testName) {
    params.push(testName);
    query += ` AND test_name=$${params.length}`;
  }
  if (from) {
    params.push(from);
    query += ` AND date >= $${params.length}`;
  }
  if (to) {
    params.push(to);
    query += ` AND date <= $${params.length}`;
  }
  query += ' ORDER BY date DESC';
  const result = await pool.query(query, params);
  res.json(result.rows);
});

module.exports = { app, init };

if (require.main === module) {
  init().then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Serwer działa na porcie ${port}`));
  });
}
