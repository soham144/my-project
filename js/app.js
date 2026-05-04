// Main App Controller

const App = {
  currentView: 'auth',

  init() {
    Auth.init();
    Complaints.seedData();
    if (Auth.isLoggedIn()) {
      const user = Auth.getCurrentUser();
      this.navigate(user.role === 'admin' ? 'admin' : 'dashboard');
    } else {
      this.showAuth();
    }
  },

  showAuth() {
    document.getElementById('auth-page').style.display = 'flex';
    document.getElementById('app-page').style.display = 'none';
    this.renderAuthForm('login');
  },

  renderAuthForm(tab) {
    const card = document.getElementById('auth-form-container');
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    if (tab === 'login') {
      card.innerHTML = `
        <form id="login-form">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="login-email" placeholder="Enter your email" required>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" id="login-password" placeholder="Enter your password" required>
          </div>
          <button type="submit" class="btn btn-primary">Sign In</button>
          <p style="text-align:center;margin-top:16px;font-size:13px;color:var(--text-muted)">
            Admin: admin@cts.com / admin123
          </p>
        </form>`;
      document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const result = Auth.login(email, password);
        if (result.success) {
          Utils.showToast(`Welcome back, ${result.user.name}!`, 'success');
          this.navigate(result.user.role === 'admin' ? 'admin' : 'dashboard');
        } else {
          Utils.showToast(result.message, 'error');
        }
      });
    } else {
      card.innerHTML = `
        <form id="register-form">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-input" id="reg-name" placeholder="Enter your name" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="reg-email" placeholder="Enter your email" required>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" class="form-input" id="reg-password" placeholder="Create a password" required minlength="6">
          </div>
          <div class="form-group">
            <label class="form-label">Role</label>
            <select class="form-select" id="reg-role">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary">Create Account</button>
        </form>`;
      document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const role = document.getElementById('reg-role').value;
        const result = Auth.register(name, email, password, role);
        if (result.success) {
          Utils.showToast('Account created successfully!', 'success');
          this.navigate(result.user.role === 'admin' ? 'admin' : 'dashboard');
        } else {
          Utils.showToast(result.message, 'error');
        }
      });
    }
  },

  showApp() {
    document.getElementById('auth-page').style.display = 'none';
    document.getElementById('app-page').style.display = 'flex';
    this.renderSidebar();
  },

  renderSidebar() {
    const user = Auth.getCurrentUser();
    const isAdmin = user.role === 'admin';
    const nav = document.getElementById('sidebar-nav');
    const initial = user.name.charAt(0).toUpperCase();

    if (isAdmin) {
      nav.innerHTML = `
        <button class="nav-item" data-view="admin" onclick="App.navigate('admin')">
          <span class="nav-icon">📊</span> Dashboard
        </button>
        <button class="nav-item" data-view="admin-detail" style="display:none"></button>`;
    } else {
      nav.innerHTML = `
        <button class="nav-item" data-view="dashboard" onclick="App.navigate('dashboard')">
          <span class="nav-icon">📊</span> Dashboard
        </button>
        <button class="nav-item" data-view="submit" onclick="App.navigate('submit')">
          <span class="nav-icon">✏️</span> Submit Complaint
        </button>
        <button class="nav-item" data-view="detail" style="display:none"></button>`;
    }

    document.getElementById('user-initial').textContent = initial;
    document.getElementById('user-display-name').textContent = user.name;
    document.getElementById('user-display-role').textContent = user.role;
  },

  navigate(view) {
    this.showApp();
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const targetView = document.getElementById(`view-${view}`);
    if (targetView) targetView.classList.add('active');

    const navBtn = document.querySelector(`.nav-item[data-view="${view}"]`);
    if (navBtn) navBtn.classList.add('active');

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');

    switch (view) {
      case 'dashboard': Dashboard.renderDashboard(); break;
      case 'submit': Dashboard.renderSubmitForm(); break;
      case 'admin': Admin.renderDashboard(); break;
    }
    this.currentView = view;
  },

  viewComplaint(ticketId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-detail').classList.add('active');
    Dashboard.renderDetail(ticketId);
  },

  viewAdminComplaint(ticketId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-admin-detail').classList.add('active');
    Admin.renderDetail(ticketId);
  },

  logout() {
    Auth.logout();
    Utils.showToast('Logged out successfully', 'info');
    this.showAuth();
  },

  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('open');
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
