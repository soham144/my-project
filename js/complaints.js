// Complaints data module

const Complaints = {
  STORAGE_KEY: 'cts_complaints',

  getAll() {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
  },

  save(complaints) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(complaints));
  },

  getById(id) {
    return this.getAll().find(c => c.id === id);
  },

  getByUser(userId) {
    return this.getAll().filter(c => c.userId === userId);
  },

  create(data) {
    const complaints = this.getAll();
    const user = Auth.getCurrentUser();
    const now = new Date().toISOString();
    const complaint = {
      id: Utils.generateTicketId(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      title: data.title,
      category: data.category,
      description: data.description,
      priority: data.priority || 'medium',
      status: 'open',
      responses: [],
      timeline: [{ status: 'open', timestamp: now, by: 'System', note: 'Complaint submitted' }],
      createdAt: now,
      updatedAt: now
    };
    complaints.unshift(complaint);
    this.save(complaints);
    return complaint;
  },

  updateStatus(id, newStatus, by) {
    const complaints = this.getAll();
    const idx = complaints.findIndex(c => c.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    complaints[idx].status = newStatus;
    complaints[idx].updatedAt = now;
    complaints[idx].timeline.push({ status: newStatus, timestamp: now, by, note: `Status changed to ${newStatus}` });
    this.save(complaints);
    return complaints[idx];
  },

  updatePriority(id, newPriority, by) {
    const complaints = this.getAll();
    const idx = complaints.findIndex(c => c.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    complaints[idx].priority = newPriority;
    complaints[idx].updatedAt = now;
    complaints[idx].timeline.push({ status: complaints[idx].status, timestamp: now, by, note: `Priority changed to ${newPriority}` });
    this.save(complaints);
    return complaints[idx];
  },

  addResponse(id, message, by) {
    const complaints = this.getAll();
    const idx = complaints.findIndex(c => c.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    complaints[idx].responses.push({ by, message, timestamp: now });
    complaints[idx].updatedAt = now;
    complaints[idx].timeline.push({ status: complaints[idx].status, timestamp: now, by, note: 'Response added' });
    this.save(complaints);
    return complaints[idx];
  },

  getStats(userId) {
    let complaints = this.getAll();
    if (userId) complaints = complaints.filter(c => c.userId === userId);
    return {
      total: complaints.length,
      open: complaints.filter(c => c.status === 'open').length,
      inProgress: complaints.filter(c => c.status === 'in-progress').length,
      resolved: complaints.filter(c => c.status === 'resolved').length,
      closed: complaints.filter(c => c.status === 'closed').length
    };
  },

  seedData() {
    if (this.getAll().length > 0) return;
    const now = new Date();
    const sampleComplaints = [
      {
        id: 'CTS-DEMO01', userId: 'admin-001', userName: 'Demo User', userEmail: 'demo@test.com',
        title: 'Login page not loading on mobile devices',
        category: 'technical', description: 'The login page fails to render properly on iOS Safari and Android Chrome. The form fields are not visible and the submit button is unresponsive.',
        priority: 'high', status: 'in-progress',
        responses: [{ by: 'Admin', message: 'We are investigating this issue. Our mobile team has been notified.', timestamp: new Date(now - 86400000).toISOString() }],
        timeline: [
          { status: 'open', timestamp: new Date(now - 172800000).toISOString(), by: 'System', note: 'Complaint submitted' },
          { status: 'in-progress', timestamp: new Date(now - 86400000).toISOString(), by: 'Admin', note: 'Status changed to in-progress' }
        ],
        createdAt: new Date(now - 172800000).toISOString(), updatedAt: new Date(now - 86400000).toISOString()
      },
      {
        id: 'CTS-DEMO02', userId: 'admin-001', userName: 'Demo User', userEmail: 'demo@test.com',
        title: 'Incorrect job description listed for Senior Developer role',
        category: 'job', description: 'The job listing for Senior Developer (JOB-2024-089) has incorrect salary range and outdated technology requirements.',
        priority: 'medium', status: 'open',
        responses: [],
        timeline: [{ status: 'open', timestamp: new Date(now - 43200000).toISOString(), by: 'System', note: 'Complaint submitted' }],
        createdAt: new Date(now - 43200000).toISOString(), updatedAt: new Date(now - 43200000).toISOString()
      },
      {
        id: 'CTS-DEMO03', userId: 'admin-001', userName: 'Demo User', userEmail: 'demo@test.com',
        title: 'Documentation has broken links in API section',
        category: 'content', description: 'Multiple hyperlinks in the REST API documentation (v2.1) are returning 404 errors.',
        priority: 'low', status: 'resolved',
        responses: [{ by: 'Admin', message: 'All broken links have been fixed. Thank you for reporting!', timestamp: new Date(now - 21600000).toISOString() }],
        timeline: [
          { status: 'open', timestamp: new Date(now - 259200000).toISOString(), by: 'System', note: 'Complaint submitted' },
          { status: 'in-progress', timestamp: new Date(now - 172800000).toISOString(), by: 'Admin', note: 'Status changed to in-progress' },
          { status: 'resolved', timestamp: new Date(now - 21600000).toISOString(), by: 'Admin', note: 'Status changed to resolved' }
        ],
        createdAt: new Date(now - 259200000).toISOString(), updatedAt: new Date(now - 21600000).toISOString()
      }
    ];
    this.save(sampleComplaints);
  }
};
