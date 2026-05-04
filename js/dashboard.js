// User Dashboard module

const Dashboard = {
  currentFilters: { status: '', category: '', search: '' },

  renderStats() {
    const user = Auth.getCurrentUser();
    const stats = Complaints.getStats(user.id);
    return `
      <div class="stats-grid">
        <div class="stat-card purple">
          <div class="stat-icon">📋</div>
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">Total Complaints</div>
        </div>
        <div class="stat-card blue">
          <div class="stat-icon">🔵</div>
          <div class="stat-value">${stats.open}</div>
          <div class="stat-label">Open</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-icon">🟡</div>
          <div class="stat-value">${stats.inProgress}</div>
          <div class="stat-label">In Progress</div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon">✅</div>
          <div class="stat-value">${stats.resolved + stats.closed}</div>
          <div class="stat-label">Resolved</div>
        </div>
      </div>`;
  },

  renderDashboard() {
    const container = document.getElementById('view-dashboard');
    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2>My Complaints</h2>
          <p>Track and manage your submitted complaints</p>
        </div>
        <button class="btn btn-primary" style="width:auto" onclick="App.navigate('submit')">
          ＋ New Complaint
        </button>
      </div>
      ${this.renderStats()}
      <div class="filter-bar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" id="user-search" placeholder="Search by Ticket ID or title..." value="${this.currentFilters.search}">
        </div>
        <select class="filter-select" id="user-status-filter">
          <option value="">All Status</option>
          <option value="open" ${this.currentFilters.status === 'open' ? 'selected' : ''}>Open</option>
          <option value="in-progress" ${this.currentFilters.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
          <option value="resolved" ${this.currentFilters.status === 'resolved' ? 'selected' : ''}>Resolved</option>
          <option value="closed" ${this.currentFilters.status === 'closed' ? 'selected' : ''}>Closed</option>
        </select>
        <select class="filter-select" id="user-category-filter">
          <option value="">All Categories</option>
          <option value="technical" ${this.currentFilters.category === 'technical' ? 'selected' : ''}>Technical Issue</option>
          <option value="job" ${this.currentFilters.category === 'job' ? 'selected' : ''}>Job Related</option>
          <option value="content" ${this.currentFilters.category === 'content' ? 'selected' : ''}>Content Error</option>
          <option value="billing" ${this.currentFilters.category === 'billing' ? 'selected' : ''}>Billing</option>
          <option value="other" ${this.currentFilters.category === 'other' ? 'selected' : ''}>Other</option>
        </select>
      </div>
      <div id="user-complaints-list"></div>`;

    this.bindFilterEvents();
    this.renderComplaints();
  },

  bindFilterEvents() {
    document.getElementById('user-search').addEventListener('input', (e) => {
      this.currentFilters.search = e.target.value;
      this.renderComplaints();
    });
    document.getElementById('user-status-filter').addEventListener('change', (e) => {
      this.currentFilters.status = e.target.value;
      this.renderComplaints();
    });
    document.getElementById('user-category-filter').addEventListener('change', (e) => {
      this.currentFilters.category = e.target.value;
      this.renderComplaints();
    });
  },

  renderComplaints() {
    const user = Auth.getCurrentUser();
    let complaints = Complaints.getByUser(user.id);
    const { status, category, search } = this.currentFilters;
    if (status) complaints = complaints.filter(c => c.status === status);
    if (category) complaints = complaints.filter(c => c.category === category);
    if (search) {
      const s = search.toLowerCase();
      complaints = complaints.filter(c => c.id.toLowerCase().includes(s) || c.title.toLowerCase().includes(s));
    }
    const container = document.getElementById('user-complaints-list');
    if (complaints.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>No complaints found</h3>
          <p>Submit a new complaint to get started</p>
        </div>`;
      return;
    }
    container.innerHTML = `
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${complaints.map(c => `
              <tr onclick="App.viewComplaint('${c.id}')">
                <td style="color:var(--accent-blue);font-weight:600">${c.id}</td>
                <td>${Utils.escapeHtml(c.title)}</td>
                <td><span class="category-badge">${Utils.getCategoryLabel(c.category)}</span></td>
                <td>${Utils.getPriorityBadge(c.priority)}</td>
                <td>${Utils.getStatusBadge(c.status)}</td>
                <td style="color:var(--text-muted)">${Utils.timeAgo(c.createdAt)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  },

  renderSubmitForm() {
    const container = document.getElementById('view-submit');
    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2>Submit a Complaint</h2>
          <p>Fill in the details below to file a new complaint</p>
        </div>
      </div>
      <div class="detail-card" style="max-width:640px">
        <form id="complaint-form">
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input type="text" class="form-input" id="complaint-title" placeholder="Brief summary of the issue" required>
          </div>
          <div class="form-group">
            <label class="form-label">Category *</label>
            <select class="form-select" id="complaint-category" required>
              <option value="">Select a category</option>
              <option value="technical">Technical Issue</option>
              <option value="job">Job Related</option>
              <option value="content">Content Error</option>
              <option value="billing">Billing</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Priority</label>
            <select class="form-select" id="complaint-priority">
              <option value="low">Low</option>
              <option value="medium" selected>Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Description *</label>
            <textarea class="form-textarea" id="complaint-description" placeholder="Provide a detailed description of the issue..." required></textarea>
          </div>
          <button type="submit" class="btn btn-primary">Submit Complaint</button>
        </form>
      </div>`;

    document.getElementById('complaint-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('complaint-title').value.trim();
      const category = document.getElementById('complaint-category').value;
      const priority = document.getElementById('complaint-priority').value;
      const description = document.getElementById('complaint-description').value.trim();
      if (!title || !category || !description) {
        Utils.showToast('Please fill in all required fields', 'error');
        return;
      }
      const complaint = Complaints.create({ title, category, priority, description });
      this.renderSuccess(complaint.id);
    });
  },

  renderSuccess(ticketId) {
    const container = document.getElementById('view-submit');
    container.innerHTML = `
      <div class="success-card">
        <div class="success-icon">✓</div>
        <h3>Complaint Submitted Successfully!</h3>
        <p>Your complaint has been registered. Use the Ticket ID below to track its progress.</p>
        <div class="ticket-display">${ticketId}</div>
        <p style="margin-bottom:24px">Save this Ticket ID for future reference</p>
        <div style="display:flex;gap:12px;justify-content:center">
          <button class="btn btn-secondary" onclick="App.navigate('dashboard')">View Dashboard</button>
          <button class="btn btn-primary" style="width:auto" onclick="App.navigate('submit')">Submit Another</button>
        </div>
      </div>`;
    Utils.showToast('Complaint submitted successfully!', 'success');
  },

  renderDetail(ticketId) {
    const complaint = Complaints.getById(ticketId);
    if (!complaint) {
      Utils.showToast('Complaint not found', 'error');
      App.navigate('dashboard');
      return;
    }
    const container = document.getElementById('view-detail');
    container.innerHTML = `
      <button class="back-btn" onclick="App.navigate('dashboard')">← Back to Dashboard</button>
      <div class="detail-container">
        <div class="detail-header">
          <div>
            <div class="ticket-id">${complaint.id}</div>
            <h2>${Utils.escapeHtml(complaint.title)}</h2>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            ${Utils.getPriorityBadge(complaint.priority)}
            ${Utils.getStatusBadge(complaint.status)}
          </div>
        </div>
        <div class="detail-card">
          <h3>Details</h3>
          <div class="detail-meta">
            <div class="meta-item">
              <label>Category</label>
              <span>${Utils.getCategoryLabel(complaint.category)}</span>
            </div>
            <div class="meta-item">
              <label>Submitted</label>
              <span>${Utils.formatDateTime(complaint.createdAt)}</span>
            </div>
            <div class="meta-item">
              <label>Last Updated</label>
              <span>${Utils.formatDateTime(complaint.updatedAt)}</span>
            </div>
          </div>
          <div class="description-text">${Utils.escapeHtml(complaint.description)}</div>
        </div>
        ${complaint.responses.length > 0 ? `
          <div class="detail-card">
            <h3>Responses</h3>
            ${complaint.responses.map(r => `
              <div class="response-item">
                <div class="response-header">
                  <span class="response-by">${Utils.escapeHtml(r.by)}</span>
                  <span class="response-time">${Utils.formatDateTime(r.timestamp)}</span>
                </div>
                <div class="response-text">${Utils.escapeHtml(r.message)}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        <div class="detail-card">
          <h3>Timeline</h3>
          <div class="timeline">
            ${complaint.timeline.slice().reverse().map(t => `
              <div class="timeline-item">
                <div class="timeline-time">${Utils.formatDateTime(t.timestamp)}</div>
                <div class="timeline-text">${Utils.escapeHtml(t.note)} — by ${Utils.escapeHtml(t.by)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>`;
  }
};
