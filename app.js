// Prosty frontend korzystający z backendu Express
let token = null;
let currentPatientId = null;
let permissions = {};

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
  permissions = data.permissions || {};
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  if (permissions.canAddPatient) document.getElementById('nav-add-patient').classList.remove('hidden');
  if (permissions.canAddLabResult) document.getElementById('nav-import-lab').classList.remove('hidden');
  if (permissions.isAdmin) document.getElementById('nav-admin').classList.remove('hidden');
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
      if (permissions.canAddRecord) document.getElementById('add-record-btn').classList.remove('hidden');
      if (permissions.canAddComment) document.getElementById('add-comment-btn').classList.remove('hidden');
      if (permissions.canAddLabResult) document.getElementById('add-lab-result-btn').classList.remove('hidden');
      loadMedicalRecords();
      loadLabResults();
      loadComments();
    });
  });
}

document.getElementById('back-to-dashboard').addEventListener('click', () => {
  document.getElementById('patient-profile-section').classList.remove('active');
  document.getElementById('dashboard-section').classList.add('active');
  currentPatientId = null;
  document.getElementById('add-record-btn').classList.add('hidden');
  document.getElementById('add-comment-btn').classList.add('hidden');
  document.getElementById('add-lab-result-btn').classList.add('hidden');
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

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('hidden');
  const first = modal.querySelector('input, textarea, select');
  if (first) first.focus();
}

function closeModal(modal) {
  if (typeof modal === 'string') {
    modal = document.getElementById(modal);
  }
  if (modal) modal.classList.add('hidden');
}

document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.closest('.modal')));
});

document.getElementById('add-record-btn').addEventListener('click', () => {
  if (currentPatientId) openModal('add-record-modal');
});
document.getElementById('add-comment-btn').addEventListener('click', () => {
  if (currentPatientId) openModal('add-comment-modal');
});
document.getElementById('add-lab-result-btn').addEventListener('click', () => {
  if (currentPatientId) openModal('add-lab-result-modal');
});

function setupFormNavigation(form) {
  const fields = Array.from(form.querySelectorAll('input, select, textarea'));
  fields.forEach((field, index) => {
    field.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const next = fields[index + 1];
        if (next) {
          next.focus();
        } else {
          form.requestSubmit();
        }
      }
    });
  });
}

setupFormNavigation(document.getElementById('add-record-form'));
setupFormNavigation(document.getElementById('add-comment-form'));
setupFormNavigation(document.getElementById('add-lab-result-form'));

async function loadMedicalRecords() {
  if (!currentPatientId) return;
  const res = await fetch(`/api/medical-records?patientId=${currentPatientId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) return;
  const records = await res.json();
  const container = document.getElementById('medical-records');
  container.innerHTML = records.map(r => `<div><strong>${r.date}</strong> - ${r.type}: ${r.description}</div>`).join('');
}

async function loadComments() {
  if (!currentPatientId) return;
  const res = await fetch(`/api/comments?patientId=${currentPatientId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) return;
  const comments = await res.json();
  const container = document.getElementById('comments-section');
  container.innerHTML = comments.map(c => `<div>${c.text} (${c.date})</div>`).join('');
}

document.getElementById('add-record-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (!currentPatientId) return;
  const payload = {
    patientId: currentPatientId,
    date: document.getElementById('record-date').value,
    type: document.getElementById('record-type').value,
    description: document.getElementById('record-description').value,
    diagnosis: document.getElementById('record-diagnosis').value,
    treatment: document.getElementById('record-treatment').value
  };
  const res = await fetch('/api/medical-records', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    closeModal('add-record-modal');
    e.target.reset();
    loadMedicalRecords();
  }
});

document.getElementById('add-comment-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (!currentPatientId) return;
  const payload = {
    patientId: currentPatientId,
    text: document.getElementById('comment-text').value
  };
  const res = await fetch('/api/comments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    closeModal('add-comment-modal');
    e.target.reset();
    loadComments();
  }
});

document.getElementById('add-lab-result-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (!currentPatientId) return;
  const payload = {
    patientId: currentPatientId,
    testName: document.getElementById('lab-test-name').value,
    date: document.getElementById('lab-test-date').value,
    value: document.getElementById('lab-test-value').value
  };
  const res = await fetch('/api/lab-results', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    closeModal('add-lab-result-modal');
    e.target.reset();
    loadLabResults();
  }
});
