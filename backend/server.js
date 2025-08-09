const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const cors = require('cors');
const pool = require('./db');
const auth = require('./middleware');
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
      role TEXT NOT NULL
    );`);
    await pool.query(`CREATE TABLE IF NOT EXISTS patients (
      id SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      pesel TEXT NOT NULL
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
    `INSERT INTO users (username, password, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING`,
    ['admin', hashed, 'admin']
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
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'sekret', { expiresIn: '1h' });
  res.json({ token });
});

app.get('/api/patients', auth, async (req, res) => {
  const result = await pool.query('SELECT id, first_name, last_name, pesel FROM patients');
  res.json(result.rows);
});

app.post('/api/patients', auth, [
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

app.post('/api/lab-results/import', auth, upload.single('file'), async (req, res) => {
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

app.get('/api/lab-results', auth, async (req, res) => {
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
