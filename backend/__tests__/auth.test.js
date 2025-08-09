const request = require('supertest');
const { app, init } = require('../server');
const pool = require('../db');

describe('auth flow', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await init();
    await pool.query(`INSERT INTO patients (first_name, last_name, pesel) VALUES ('Jan', 'Kowalski', '80010112345');`);
  });

  afterAll(async () => {
    await pool.end();
  });

  test('login and get patients', async () => {
    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'admin123' });
    expect(loginRes.statusCode).toBe(200);
    const token = loginRes.body.token;
    expect(token).toBeDefined();
    const patientsRes = await request(app)
      .get('/api/patients')
      .set('Authorization', `Bearer ${token}`);
    expect(patientsRes.statusCode).toBe(200);
    expect(Array.isArray(patientsRes.body)).toBe(true);
  });
});
