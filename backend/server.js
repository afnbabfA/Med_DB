const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const cors = require('cors');
const pool = require('./db');
const auth = require('./middleware');

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

module.exports = { app, init };

if (require.main === module) {
  init().then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Serwer działa na porcie ${port}`));
  });
}
