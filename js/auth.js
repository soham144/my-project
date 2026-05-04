// Authentication module

const Auth = {
  STORAGE_KEY: 'cts_users',
  SESSION_KEY: 'cts_session',

  init() {
    const users = this.getUsers();
    if (!users.find(u => u.email === 'admin@cts.com')) {
      users.push({
        id: 'admin-001',
        name: 'Admin',
        email: 'admin@cts.com',
        password: 'admin123',
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
    }
  },

  getUsers() {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
  },

  getCurrentUser() {
    const session = localStorage.getItem(this.SESSION_KEY);
    if (!session) return null;
    return JSON.parse(session);
  },

  login(email, password) {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return { success: false, message: 'Invalid email or password' };
    const session = { id: user.id, name: user.name, email: user.email, role: user.role };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    return { success: true, user: session };
  },

  register(name, email, password, role = 'user') {
    const users = this.getUsers();
    if (users.find(u => u.email === email)) {
      return { success: false, message: 'Email already registered' };
    }
    const user = {
      id: Utils.generateId(),
      name,
      email,
      password,
      role,
      createdAt: new Date().toISOString()
    };
    users.push(user);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
    const session = { id: user.id, name: user.name, email: user.email, role: user.role };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    return { success: true, user: session };
  },

  logout() {
    localStorage.removeItem(this.SESSION_KEY);
  },

  isLoggedIn() {
    return !!this.getCurrentUser();
  },

  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'admin';
  }
};
