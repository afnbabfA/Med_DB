// Prosty frontend korzystający z backendu Express
let token = null;

async function login(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) {
    document.getElementById('login-error').textContent = data.message || 'Błąd logowania';
    document.getElementById('login-error').classList.remove('hidden');
    return;
  }
  token = data.token;
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  loadPatients();
}

document.getElementById('login-form').addEventListener('submit', login);

async function loadPatients() {
  const res = await fetch('/api/patients', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) return;
  const patients = await res.json();
  const grid = document.getElementById('patients-grid');
  grid.innerHTML = patients.map(p => `<div class="patient-card">${p.first_name} ${p.last_name}</div>`).join('');
}
