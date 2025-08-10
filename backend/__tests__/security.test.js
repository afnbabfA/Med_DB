const request = require('supertest');
const bcrypt = require('bcrypt');
const { app, init } = require('../server');
const pool = require('../db');

describe('security and validation', () => {
  let adminToken;
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await init();
    const hashed = await bcrypt.hash('doctor123', 10);
    await pool.query(
      'INSERT INTO users (username, password, role, patient_access) VALUES ($1,$2,$3,$4)',
      ['doctor', hashed, 'doctor', [1]]
    );
    await pool.query(
      "INSERT INTO patients (first_name, last_name, pesel) VALUES ('Jan','Kowalski','80010112345'),('Anna','Nowak','90010112345')"
    );
    const login = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'admin123' });
    adminToken = login.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  test('login fails with missing fields', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'admin' });
    expect(res.statusCode).toBe(400);
  });

  test('login fails with wrong credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'wrong' });
    expect(res.statusCode).toBe(401);
  });

  test('rejects requests without token', async () => {
    const res = await request(app).get('/api/patients');
    expect(res.statusCode).toBe(401);
  });

  test('denies access to unauthorized patient', async () => {
    const loginDoc = await request(app)
      .post('/api/login')
      .send({ username: 'doctor', password: 'doctor123' });
    const token = loginDoc.body.token;
    const res = await request(app)
      .get('/api/patients/2')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
  });

  test('validates patient creation input', async () => {
    const res = await request(app)
      .post('/api/patients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'Bad', lastName: 'Pesel', pesel: '12345' });
    expect(res.statusCode).toBe(400);
  });
});

