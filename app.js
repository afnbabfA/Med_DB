// System Zarządzania Pacjentami - JavaScript

class PatientManagementSystem {
    constructor() {
        this.currentUser = null;
        this.currentPatientId = null;
        this.patients = [];
        this.users = [];
        this.medicalRecords = [];
        this.labResults = [];
        this.comments = [];
        this.rolePermissions = {};
        this.permissions = {};
        
        this.initializeData();
        this.initializeEventListeners();
        this.checkLoginStatus();
    }

    // Inicjalizacja danych
    initializeData() {
        // Sprawdź czy dane już istnieją w localStorage
        if (!localStorage.getItem('pms_patients')) {
            // Dane przykładowe z JSON
            const sampleData = {
                "samplePatients": [
                    {
                        "id": 1,
                        "firstName": "Jan",
                        "lastName": "Kowalski",
                        "pesel": "80010112345",
                        "dateOfBirth": "1980-01-01",
                        "address": "ul. Główna 15, 00-001 Warszawa",
                        "phone": "+48 123 456 789",
                        "email": "jan.kowalski@email.com",
                        "bloodType": "A+",
                        "allergies": "Penicylina, Orzechy",
                        "chronicConditions": "Nadciśnienie tętnicze",
                        "emergencyContact": "Anna Kowalska - +48 987 654 321"
                    },
                    {
                        "id": 2,
                        "firstName": "Maria",
                        "lastName": "Nowak",
                        "pesel": "75050567890",
                        "dateOfBirth": "1975-05-05",
                        "address": "ul. Kwiatowa 8, 30-001 Kraków",
                        "phone": "+48 234 567 890",
                        "email": "maria.nowak@email.com",
                        "bloodType": "B-",
                        "allergies": "Brak",
                        "chronicConditions": "Cukrzyca typu 2",
                        "emergencyContact": "Piotr Nowak - +48 876 543 210"
                    },
                    {
                        "id": 3,
                        "firstName": "Andrzej",
                        "lastName": "Wiśniewski",
                        "pesel": "90121298765",
                        "dateOfBirth": "1990-12-12",
                        "address": "ul. Słoneczna 22, 50-001 Wrocław",
                        "phone": "+48 345 678 901",
                        "email": "andrzej.wisniewski@email.com",
                        "bloodType": "O+",
                        "allergies": "Aspiryna",
                        "chronicConditions": "Brak",
                        "emergencyContact": "Katarzyna Wiśniewska - +48 765 432 109"
                    }
                ],
                "sampleUsers": [
                    {
                        "id": 1,
                        "username": "admin",
                        "password": "admin123",
                        "role": "admin",
                        "firstName": "Administrator",
                        "lastName": "Systemu",
                        "email": "admin@clinic.com",
                        "patientAccess": "all"
                    },
                    {
                        "id": 2,
                        "username": "dr.smith",
                        "password": "doctor123",
                        "role": "doctor",
                        "firstName": "Dr. John",
                        "lastName": "Smith",
                        "email": "john.smith@clinic.com",
                        "patientAccess": [1, 2]
                    },
                    {
                        "id": 3,
                        "username": "nurse.anna",
                        "password": "nurse123",
                        "role": "nurse",
                        "firstName": "Anna",
                        "lastName": "Pielęgniarka",
                        "email": "anna.nurse@clinic.com",
                        "patientAccess": [1, 3]
                    },
                    {
                        "id": 4,
                        "username": "viewer.tom",
                        "password": "viewer123",
                        "role": "viewer",
                        "firstName": "Tom",
                        "lastName": "Obserwator",
                        "email": "tom.viewer@clinic.com",
                        "patientAccess": [2]
                    }
                ],
                "sampleMedicalRecords": [
                    {
                        "id": 1,
                        "patientId": 1,
                        "date": "2024-07-15",
                        "type": "Wizyta kontrolna",
                        "description": "Kontrola ciśnienia tętniczego. Pacjent skarży się na okresowe bóle głowy.",
                        "diagnosis": "Nadciśnienie tętnicze - kontrolowane",
                        "treatment": "Kontynuacja leku ACE - Enalapril 10mg 1x dziennie",
                        "doctorId": 2,
                        "doctorName": "Dr. John Smith"
                    },
                    {
                        "id": 2,
                        "patientId": 1,
                        "date": "2024-06-10",
                        "type": "Operacja",
                        "description": "Operacja wyrostka robaczkowego - laparoskopowa",
                        "diagnosis": "Zapalenie wyrostka robaczkowego",
                        "treatment": "Zabieg laparoskopowy zakończony powodzeniem",
                        "doctorId": 2,
                        "doctorName": "Dr. John Smith"
                    },
                    {
                        "id": 3,
                        "patientId": 2,
                        "date": "2024-07-20",
                        "type": "Wizyta diabetologiczna",
                        "description": "Kontrola poziomu cukru we krwi. HbA1c w normie.",
                        "diagnosis": "Cukrzyca typu 2 - dobrze kontrolowana",
                        "treatment": "Kontynuacja diety i Metforminy 1000mg 2x dziennie",
                        "doctorId": 2,
                        "doctorName": "Dr. John Smith"
                    }
                ],
                "sampleLabResults": [
                    {
                        "patientId": 1,
                        "testName": "Morfologia",
                        "results": {
                            "2024-07-01": "WBC: 6.5, RBC: 4.8, HGB: 14.2, PLT: 280",
                            "2024-06-01": "WBC: 7.1, RBC: 4.6, HGB: 13.9, PLT: 295",
                            "2024-05-01": "WBC: 6.8, RBC: 4.7, HGB: 14.0, PLT: 275"
                        }
                    },
                    {
                        "patientId": 1,
                        "testName": "Biochemia",
                        "results": {
                            "2024-07-01": "Glukoza: 95, Kreatynina: 0.9, Mocznik: 28",
                            "2024-06-01": "Glukoza: 102, Kreatynina: 0.8, Mocznik: 32",
                            "2024-05-01": "Glukoza: 88, Kreatynina: 0.9, Mocznik: 30"
                        }
                    },
                    {
                        "patientId": 2,
                        "testName": "Morfologia",
                        "results": {
                            "2024-07-15": "WBC: 5.8, RBC: 4.2, HGB: 12.1, PLT: 320",
                            "2024-06-15": "WBC: 6.2, RBC: 4.1, HGB: 12.3, PLT: 310"
                        }
                    },
                    {
                        "patientId": 2,
                        "testName": "HbA1c",
                        "results": {
                            "2024-07-15": "6.8%",
                            "2024-04-15": "7.2%",
                            "2024-01-15": "7.8%"
                        }
                    }
                ],
                "rolePermissions": {
                    "admin": {
                        "canCreate": true,
                        "canEdit": true,
                        "canDelete": true,
                        "canView": true,
                        "canComment": true,
                        "canManageUsers": true,
                        "canAccessAll": true
                    },
                    "doctor": {
                        "canCreate": true,
                        "canEdit": true,
                        "canDelete": false,
                        "canView": true,
                        "canComment": true,
                        "canManageUsers": false,
                        "canAccessAll": false
                    },
                    "nurse": {
                        "canCreate": true,
                        "canEdit": false,
                        "canDelete": false,
                        "canView": true,
                        "canComment": true,
                        "canManageUsers": false,
                        "canAccessAll": false
                    },
                    "viewer": {
                        "canCreate": false,
                        "canEdit": false,
                        "canDelete": false,
                        "canView": true,
                        "canComment": false,
                        "canManageUsers": false,
                        "canAccessAll": false
                    }
                }
            };

            localStorage.setItem('pms_patients', JSON.stringify(sampleData.samplePatients));
            localStorage.setItem('pms_users', JSON.stringify(sampleData.sampleUsers));
            localStorage.setItem('pms_medical_records', JSON.stringify(sampleData.sampleMedicalRecords));
            localStorage.setItem('pms_lab_results', JSON.stringify(sampleData.sampleLabResults));
            localStorage.setItem('pms_role_permissions', JSON.stringify(sampleData.rolePermissions));
            localStorage.setItem('pms_comments', JSON.stringify([]));
        }

        this.loadData();
    }

    loadData() {
        this.patients = JSON.parse(localStorage.getItem('pms_patients')) || [];
        this.users = JSON.parse(localStorage.getItem('pms_users')) || [];
        this.medicalRecords = JSON.parse(localStorage.getItem('pms_medical_records')) || [];
        this.labResults = JSON.parse(localStorage.getItem('pms_lab_results')) || [];
        this.rolePermissions = JSON.parse(localStorage.getItem('pms_role_permissions')) || {};
        this.comments = JSON.parse(localStorage.getItem('pms_comments')) || [];
    }

    saveData() {
        localStorage.setItem('pms_patients', JSON.stringify(this.patients));
        localStorage.setItem('pms_users', JSON.stringify(this.users));
        localStorage.setItem('pms_medical_records', JSON.stringify(this.medicalRecords));
        localStorage.setItem('pms_lab_results', JSON.stringify(this.labResults));
        localStorage.setItem('pms_comments', JSON.stringify(this.comments));
    }

    // Event Listeners
    initializeEventListeners() {
        // Logowanie
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

        // Demo konta
        document.querySelectorAll('.demo-account').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const username = e.currentTarget.dataset.username;
                const password = e.currentTarget.dataset.password;
                document.getElementById('username').value = username;
                document.getElementById('password').value = password;
            });
        });

        // Nawigacja
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Wyszukiwanie pacjentów
        document.getElementById('patient-search').addEventListener('input', (e) => this.handlePatientSearch(e));

        // Powrót do dashboardu
        document.getElementById('back-to-dashboard').addEventListener('click', () => this.showDashboard());

        // Formularz dodawania pacjenta
        document.getElementById('add-patient-form').addEventListener('submit', (e) => this.handleAddPatient(e));
        document.getElementById('cancel-add-patient').addEventListener('click', () => this.showDashboard());

        // Modalne okna
        this.initializeModals();

        // Import badań
        document.getElementById('add-result-row').addEventListener('click', () => this.addLabResultRow());
        document.getElementById('import-lab-results').addEventListener('click', () => this.handleLabImport());

        // Panel administratora
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.handleAdminTab(e));
        });
    }

    initializeModals() {
        // Zamknij modalne okna
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                modal.classList.add('hidden');
            });
        });

        // Kliknięcie poza modalem
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });

        // Formularz dodawania wpisu medycznego
        document.getElementById('add-record-form').addEventListener('submit', (e) => this.handleAddMedicalRecord(e));

        // Formularz dodawania komentarza
        document.getElementById('add-comment-form').addEventListener('submit', (e) => this.handleAddComment(e));
    }

    // Uwierzytelnianie
    checkLoginStatus() {
        const savedUser = localStorage.getItem('pms_current_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.fetchPermissions().then(() => {
                this.showMainApp();
            });
        } else {
            this.showLoginPage();
        }
    }

    handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        const user = this.users.find(u => u.username === username && u.password === password);
        
        if (user) {
            this.currentUser = user;
            localStorage.setItem('pms_current_user', JSON.stringify(user));
            this.fetchPermissions().then(() => {
                this.showMainApp();
            });
            this.clearLoginError();
        } else {
            this.showLoginError('Nieprawidłowa nazwa użytkownika lub hasło');
        }
    }

    handleLogout() {
        this.currentUser = null;
        localStorage.removeItem('pms_current_user');
        this.showLoginPage();
    }

    showLoginError(message) {
        const errorElement = document.getElementById('login-error');
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }

    clearLoginError() {
        const errorElement = document.getElementById('login-error');
        errorElement.classList.add('hidden');
    }

    // Nawigacja między stronami
    showLoginPage() {
        document.getElementById('login-page').style.display = 'flex';
        document.getElementById('main-app').classList.add('hidden');
    }

    showMainApp() {
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('main-app').classList.remove('hidden');
        this.updateUserInfo();
        this.showDashboard();
        this.updateNavigation();
        this.updateUIBasedOnPermissions();
    }

    updateUserInfo() {
        document.getElementById('user-info').textContent = 
            `${this.currentUser.firstName} ${this.currentUser.lastName} (${this.currentUser.role})`;
    }

    updateNavigation() {
        const permissions = this.rolePermissions[this.currentUser.role];
        const adminBtn = document.getElementById('nav-admin');
        
        if (permissions.canManageUsers) {
            adminBtn.classList.remove('hidden');
        } else {
            adminBtn.classList.add('hidden');
        }
    }

    handleNavigation(e) {
        const navId = e.currentTarget.id;
        
        // Usuń aktywną klasę ze wszystkich przycisków
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        e.currentTarget.classList.add('active');

        // Ukryj wszystkie sekcje
        document.querySelectorAll('.app-section').forEach(section => section.classList.remove('active'));

        switch(navId) {
            case 'nav-dashboard':
                this.showDashboard();
                break;
            case 'nav-add-patient':
                this.showAddPatient();
                break;
            case 'nav-import-lab':
                this.showImportLab();
                break;
            case 'nav-admin':
                this.showAdmin();
                break;
        }
    }

    // Dashboard
    showDashboard() {
        document.getElementById('dashboard-section').classList.add('active');
        this.renderPatientGrid();
    }

    renderPatientGrid(searchTerm = '') {
        const grid = document.getElementById('patients-grid');
        const accessiblePatients = this.getAccessiblePatients();
        
        let filteredPatients = accessiblePatients;
        if (searchTerm) {
            filteredPatients = accessiblePatients.filter(patient => 
                `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                patient.pesel.includes(searchTerm)
            );
        }

        grid.innerHTML = filteredPatients.map(patient => `
            <div class="patient-card" onclick="pms.showPatientProfile(${patient.id})">
                <div class="patient-header">
                    <div>
                        <div class="patient-name">${patient.firstName} ${patient.lastName}</div>
                        <div class="patient-pesel">PESEL: ${patient.pesel}</div>
                    </div>
                    <div class="patient-status">Aktywny</div>
                </div>
                <div class="patient-info">
                    <div class="patient-info-item">
                        <i class="fas fa-birthday-cake"></i>
                        <span>${this.formatDate(patient.dateOfBirth)}</span>
                    </div>
                    <div class="patient-info-item">
                        <i class="fas fa-phone"></i>
                        <span>${patient.phone || 'Brak'}</span>
                    </div>
                    <div class="patient-info-item">
                        <i class="fas fa-tint"></i>
                        <span>Grupa krwi: ${patient.bloodType || 'Nieznana'}</span>
                    </div>
                    <div class="patient-info-item">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Alergie: ${patient.allergies || 'Brak'}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    handlePatientSearch(e) {
        this.renderPatientGrid(e.target.value);
    }

    getAccessiblePatients() {
        if (this.currentUser.patientAccess === 'all') {
            return this.patients;
        }
        return this.patients.filter(patient => 
            this.currentUser.patientAccess.includes(patient.id)
        );
    }

    // Profil pacjenta
    showPatientProfile(patientId) {
        this.currentPatientId = patientId;
        const patient = this.patients.find(p => p.id === patientId);
        
        if (!patient || !this.hasPatientAccess(patientId)) {
            alert('Brak dostępu do tego pacjenta');
            return;
        }

        document.querySelectorAll('.app-section').forEach(section => section.classList.remove('active'));
        document.getElementById('patient-profile-section').classList.add('active');

        document.getElementById('patient-name').textContent = `${patient.firstName} ${patient.lastName}`;
        
        this.renderPatientBasicInfo(patient);
        this.renderMedicalRecords(patientId);
        this.renderLabResults(patientId);
        this.renderComments(patientId);
        this.updateProfileButtons();
    }

    renderPatientBasicInfo(patient) {
        const infoGrid = document.getElementById('patient-basic-info');
        infoGrid.innerHTML = `
            <div class="info-item">
                <div class="info-label">PESEL</div>
                <div class="info-value">${patient.pesel}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Data urodzenia</div>
                <div class="info-value">${this.formatDate(patient.dateOfBirth)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Adres</div>
                <div class="info-value">${patient.address || 'Brak'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Telefon</div>
                <div class="info-value">${patient.phone || 'Brak'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">${patient.email || 'Brak'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Grupa krwi</div>
                <div class="info-value">${patient.bloodType || 'Nieznana'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Alergie</div>
                <div class="info-value">${patient.allergies || 'Brak'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Choroby przewlekłe</div>
                <div class="info-value">${patient.chronicConditions || 'Brak'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Kontakt awaryjny</div>
                <div class="info-value">${patient.emergencyContact || 'Brak'}</div>
            </div>
        `;
    }

    renderMedicalRecords(patientId) {
        const recordsContainer = document.getElementById('medical-records');
        const records = this.medicalRecords.filter(record => record.patientId === patientId);
        
        if (records.length === 0) {
            recordsContainer.innerHTML = '<p class="text-center">Brak wpisów medycznych</p>';
            return;
        }

        recordsContainer.innerHTML = records.map(record => `
            <div class="medical-record fade-in">
                <div class="record-header">
                    <div class="record-type">${record.type}</div>
                    <div class="record-date">${this.formatDate(record.date)}</div>
                </div>
                <div class="record-content">
                    <h4>${record.diagnosis || 'Brak diagnozy'}</h4>
                    <p><strong>Opis:</strong> ${record.description}</p>
                    <p><strong>Leczenie:</strong> ${record.treatment || 'Brak'}</p>
                    <div class="record-doctor">Lekarz: ${record.doctorName}</div>
                </div>
            </div>
        `).join('');
    }

    renderLabResults(patientId) {
        const resultsContainer = document.getElementById('lab-results');
        const results = this.labResults.filter(result => result.patientId === patientId);
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '<p class="text-center">Brak wyników badań</p>';
            return;
        }

        resultsContainer.innerHTML = results.map(test => {
            const dates = Object.keys(test.results).sort((a, b) => new Date(b) - new Date(a));
            
            return `
                <div class="lab-test">
                    <div class="lab-test-header">${test.testName}</div>
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Wynik</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dates.map(date => `
                                <tr>
                                    <td>${this.formatDate(date)}</td>
                                    <td>${test.results[date]}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }).join('');
    }

    renderComments(patientId) {
        const commentsContainer = document.getElementById('comments-section');
        const patientComments = this.comments.filter(comment => comment.patientId === patientId);
        
        if (patientComments.length === 0) {
            commentsContainer.innerHTML = '<p class="text-center">Brak komentarzy</p>';
            return;
        }

        commentsContainer.innerHTML = patientComments.map(comment => `
            <div class="comment fade-in">
                <div class="comment-header">
                    <div class="comment-author">${comment.authorName}</div>
                    <div class="comment-date">${this.formatDateTime(comment.date)}</div>
                </div>
                <div class="comment-text">${comment.text}</div>
            </div>
        `).join('');
    }

    updateProfileButtons() {
        const permissions = this.rolePermissions[this.currentUser.role];
        const addRecordBtn = document.getElementById('add-record-btn');
        const addCommentBtn = document.getElementById('add-comment-btn');

        if (permissions.canCreate || permissions.canEdit) {
            addRecordBtn.classList.remove('hidden');
            addRecordBtn.onclick = () => this.showAddRecordModal();
        } else {
            addRecordBtn.classList.add('hidden');
        }

        if (permissions.canComment) {
            addCommentBtn.classList.remove('hidden');
            addCommentBtn.onclick = () => this.showAddCommentModal();
        } else {
            addCommentBtn.classList.add('hidden');
        }
    }

    // Dodawanie pacjenta
    showAddPatient() {
        const permissions = this.rolePermissions[this.currentUser.role];
        if (!permissions.canCreate) {
            alert('Brak uprawnień do dodawania pacjentów');
            return;
        }
        
        document.getElementById('add-patient-section').classList.add('active');
        document.getElementById('add-patient-form').reset();
    }

    handleAddPatient(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const patientData = {
            id: Date.now(), // Prosty generator ID
            firstName: document.getElementById('patient-first-name').value,
            lastName: document.getElementById('patient-last-name').value,
            pesel: document.getElementById('patient-pesel').value,
            dateOfBirth: document.getElementById('patient-dob').value,
            address: document.getElementById('patient-address').value,
            phone: document.getElementById('patient-phone').value,
            email: document.getElementById('patient-email').value,
            bloodType: document.getElementById('patient-blood-type').value,
            allergies: document.getElementById('patient-allergies').value,
            chronicConditions: document.getElementById('patient-chronic-conditions').value,
            emergencyContact: document.getElementById('patient-emergency-contact').value
        };

        this.patients.push(patientData);
        this.saveData();
        
        alert('Pacjent został dodany pomyślnie!');
        this.showDashboard();
    }

    // Import badań laboratoryjnych
    showImportLab() {
        document.getElementById('import-lab-section').classList.add('active');
        this.populatePatientSelect();
    }

    populatePatientSelect() {
        const select = document.getElementById('import-patient-select');
        const accessiblePatients = this.getAccessiblePatients();
        
        select.innerHTML = '<option value="">Wybierz pacjenta</option>' + 
            accessiblePatients.map(patient => 
                `<option value="${patient.id}">${patient.firstName} ${patient.lastName}</option>`
            ).join('');
    }

    addLabResultRow() {
        const tbody = document.getElementById('lab-results-tbody');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="date" class="form-control" name="result-date"></td>
            <td><input type="text" class="form-control" name="result-value" placeholder="Wprowadź wynik badania"></td>
            <td><button type="button" class="btn btn--outline btn--sm remove-result"><i class="fas fa-trash"></i></button></td>
        `;
        
        tbody.appendChild(row);
        
        // Dodaj event listener dla przycisku usuwania
        row.querySelector('.remove-result').addEventListener('click', () => {
            if (tbody.children.length > 1) {
                row.remove();
            }
        });
    }

    handleLabImport() {
        const patientId = parseInt(document.getElementById('import-patient-select').value);
        const testName = document.getElementById('import-test-name').value;
        
        if (!patientId || !testName) {
            alert('Wybierz pacjenta i wprowadź nazwę badania');
            return;
        }

        const rows = document.querySelectorAll('#lab-results-tbody tr');
        const results = {};
        
        rows.forEach(row => {
            const date = row.querySelector('input[name="result-date"]').value;
            const value = row.querySelector('input[name="result-value"]').value;
            
            if (date && value) {
                results[date] = value;
            }
        });

        if (Object.keys(results).length === 0) {
            alert('Wprowadź przynajmniej jeden wynik');
            return;
        }

        // Sprawdź czy badanie już istnieje dla tego pacjenta
        const existingTest = this.labResults.find(test => 
            test.patientId === patientId && test.testName === testName
        );

        if (existingTest) {
            // Dodaj nowe wyniki do istniejącego badania
            Object.assign(existingTest.results, results);
        } else {
            // Utwórz nowe badanie
            this.labResults.push({
                patientId,
                testName,
                results
            });
        }

        this.saveData();
        alert('Badania zostały importowane pomyślnie!');
        
        // Wyczyść formularz
        document.getElementById('import-test-name').value = '';
        document.getElementById('lab-results-tbody').innerHTML = `
            <tr>
                <td><input type="date" class="form-control" name="result-date"></td>
                <td><input type="text" class="form-control" name="result-value" placeholder="Wprowadź wynik badania"></td>
                <td><button type="button" class="btn btn--outline btn--sm remove-result"><i class="fas fa-trash"></i></button></td>
            </tr>
        `;
    }

    // Panel administratora
    showAdmin() {
        const permissions = this.rolePermissions[this.currentUser.role];
        if (!permissions.canManageUsers) {
            alert('Brak uprawnień administratora');
            return;
        }
        
        document.getElementById('admin-section').classList.add('active');
        this.renderUsersList();
    }

    handleAdminTab(e) {
        const tabName = e.target.dataset.tab;
        
        // Usuń aktywną klasę ze wszystkich zakładek
        document.querySelectorAll('.admin-tab').forEach(tab => tab.classList.remove('active'));
        e.target.classList.add('active');

        // Ukryj wszystkie content
        document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`admin-${tabName}-tab`).classList.add('active');

        if (tabName === 'users') {
            this.renderUsersList();
        } else if (tabName === 'permissions') {
            this.renderPermissionsList();
        }
    }

    renderUsersList() {
        const usersList = document.getElementById('users-list');
        usersList.innerHTML = this.users.map(user => `
            <div class="user-item">
                <div class="user-info">
                    <h4>${user.firstName} ${user.lastName}</h4>
                    <div class="user-role">Rola: ${user.role}</div>
                    <div class="user-email">${user.email}</div>
                </div>
                <div class="user-actions">
                    <button class="btn btn--outline btn--sm" onclick="pms.editUser(${user.id})">
                        <i class="fas fa-edit"></i> Edytuj
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderPermissionsList() {
        const permissionsList = document.getElementById('permissions-list');
        permissionsList.innerHTML = Object.entries(this.rolePermissions).map(([role, permissions]) => `
            <div class="permission-item">
                <div class="permission-info">
                    <h4>Rola: ${role}</h4>
                    <div>Uprawnienia: ${Object.entries(permissions)
                        .filter(([key, value]) => value)
                        .map(([key]) => key)
                        .join(', ')
                    }</div>
                </div>
            </div>
        `).join('');
    }

    // Modalne okna
    showAddRecordModal() {
        const modal = document.getElementById('add-record-modal');
        modal.classList.remove('hidden');
        
        // Ustaw dzisiejszą datę
        document.getElementById('record-date').value = new Date().toISOString().split('T')[0];
    }

    handleAddMedicalRecord(e) {
        e.preventDefault();
        
        const record = {
            id: Date.now(),
            patientId: this.currentPatientId,
            date: document.getElementById('record-date').value,
            type: document.getElementById('record-type').value,
            description: document.getElementById('record-description').value,
            diagnosis: document.getElementById('record-diagnosis').value,
            treatment: document.getElementById('record-treatment').value,
            doctorId: this.currentUser.id,
            doctorName: `${this.currentUser.firstName} ${this.currentUser.lastName}`
        };

        this.medicalRecords.push(record);
        this.saveData();
        
        document.getElementById('add-record-modal').classList.add('hidden');
        document.getElementById('add-record-form').reset();
        this.renderMedicalRecords(this.currentPatientId);
        
        alert('Wpis medyczny został dodany!');
    }

    showAddCommentModal() {
        const modal = document.getElementById('add-comment-modal');
        modal.classList.remove('hidden');
    }

    handleAddComment(e) {
        e.preventDefault();
        
        const comment = {
            id: Date.now(),
            patientId: this.currentPatientId,
            text: document.getElementById('comment-text').value,
            authorId: this.currentUser.id,
            authorName: `${this.currentUser.firstName} ${this.currentUser.lastName}`,
            date: new Date().toISOString()
        };

        this.comments.push(comment);
        this.saveData();
        
        document.getElementById('add-comment-modal').classList.add('hidden');
        document.getElementById('add-comment-form').reset();
        this.renderComments(this.currentPatientId);
        
        alert('Komentarz został dodany!');
    }

    async fetchPermissions() {
        const response = await fetch('/permissions', {
            headers: { 'user-id': this.currentUser.id }
        });
        this.permissions = await response.json();
        this.updateUIBasedOnPermissions();
    }

    updateUIBasedOnPermissions() {
        const canEdit = this.permissions && this.permissions.canEdit;
        document.querySelectorAll('[data-permission="edit"]').forEach(el => {
            if (canEdit) {
                el.classList.remove('hidden');
            } else {
                el.classList.add('hidden');
            }
        });
    }

    // Funkcje pomocnicze
    hasPatientAccess(patientId) {
        if (this.currentUser.patientAccess === 'all') {
            return true;
        }
        return this.currentUser.patientAccess.includes(patientId);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pl-PL');
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('pl-PL');
    }

    editUser(userId) {
        // Placeholder dla funkcji edycji użytkownika
        alert(`Edycja użytkownika ${userId} - funkcja w przygotowaniu`);
    }
}

// Inicjalizacja aplikacji
let pms;
document.addEventListener('DOMContentLoaded', () => {
    pms = new PatientManagementSystem();
});

// Eksportuj funkcje globalne dla onclick handlerów
window.pms = pms;