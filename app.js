// Prosty frontend korzystający z backendu Express
let token = null;
let currentPatientId = null;

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
  grid.innerHTML = patients
    .map(p => `<div class="patient-card" data-id="${p.id}" data-name="${p.first_name} ${p.last_name}">${p.first_name} ${p.last_name}</div>`)
    .join('');
  const select = document.getElementById('import-patient-select');
  select.innerHTML = '<option value="">Wybierz pacjenta</option>' +
    patients.map(p => `<option value="${p.id}">${p.first_name} ${p.last_name}</option>`).join('');
  document.querySelectorAll('.patient-card').forEach(card => {
    card.addEventListener('click', () => {
      currentPatientId = card.getAttribute('data-id');
      document.getElementById('dashboard-section').classList.remove('active');
      document.getElementById('patient-profile-section').classList.add('active');
      document.getElementById('patient-name').textContent = card.getAttribute('data-name');
      loadLabResults();
    });
  });
}

document.getElementById('back-to-dashboard').addEventListener('click', () => {
  document.getElementById('patient-profile-section').classList.remove('active');
  document.getElementById('dashboard-section').classList.add('active');
});

document.getElementById('import-lab-results').addEventListener('click', async () => {
  const patientId = document.getElementById('import-patient-select').value;
  const fileInput = document.getElementById('lab-file');
  if (!patientId || fileInput.files.length === 0) return;
  const formData = new FormData();
  formData.append('patientId', patientId);
  formData.append('file', fileInput.files[0]);
  const res = await fetch('/api/lab-results/import', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  if (res.ok) {
    fileInput.value = '';
    alert('Plik zaimportowany');
  }
});

async function loadLabResults() {
  if (!currentPatientId) return;
  const testName = document.getElementById('filter-test-name').value;
  const from = document.getElementById('filter-from-date').value;
  const to = document.getElementById('filter-to-date').value;
  let url = `/api/lab-results?patientId=${currentPatientId}`;
  if (testName) url += `&testName=${encodeURIComponent(testName)}`;
  if (from) url += `&from=${from}`;
  if (to) url += `&to=${to}`;
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  if (!res.ok) return;
  const results = await res.json();
  const container = document.getElementById('lab-results');
  container.innerHTML = results.map(r => `<div>${r.test_name}: ${r.value} (${r.date})</div>`).join('');
}

document.getElementById('filter-lab-results').addEventListener('click', loadLabResults);
