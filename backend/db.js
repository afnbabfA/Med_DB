const { Pool } = require('pg');
const { newDb } = require('pg-mem');

let pool;

if (process.env.NODE_ENV === 'test') {
  const db = newDb({ noAstCoverageCheck: true });
  db.public.none(`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      patient_access INTEGER[] DEFAULT '{}'::INTEGER[]
    );
    CREATE TABLE patients (
      id SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      pesel TEXT NOT NULL
    );
    CREATE TABLE medical_records (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      diagnosis TEXT,
      treatment TEXT
    );
    CREATE TABLE lab_results (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
      test_name TEXT NOT NULL,
      date DATE NOT NULL,
      value TEXT NOT NULL
    );
  `);
  const adapter = db.adapters.createPg();
  pool = new adapter.Pool();
} else {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres'
  });
}

module.exports = pool;
