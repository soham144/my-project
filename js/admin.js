// Admin Panel module

const Admin = {
  currentFilters: { status: '', category: '', priority: '', search: '' },

  renderDashboard() {
    const container = document.getElementById('view-admin');
    const stats = Complaints.getStats();
    container.innerHTML = `
      <div class="page-header">
        <div>
          <h2>Admin Dashboard</h2>
          <p>Manage and respond to all complaints</p>
        </div>
      </div>
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
          <div class="stat-label">Resolved / Closed</div>
        </div>
      </div>
      <div class="filter-bar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" id="admin-search" placeholder="Search by Ticket ID, title, or user..." value="${this.currentFilters.search}">
        </div>
        <select class="filter-select" id="admin-status-filter">
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select class="filter-select" id="admin-category-filter">
          <option value="">All Categories</option>
          <option value="technical">Technical Issue</option>
          <option value="job">Job Related</option>
          <option value="content">Content Error</option>
          <option value="billing">Billing</option>
          <option value="other">Other</option>
        </select>
        <select class="filter-select" id="admin-priority-filter">
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>
      <div id="admin-complaints-list"></div>`;

    this.bindFilterEvents();
    this.renderComplaints();
  },

  bindFilterEvents() {
    document.getElementById('admin-search').addEventListener('input', (e) => {
      this.currentFilters.search = e.target.value;
      this.renderComplaints();
    });
    document.getElementById('admin-status-filter').addEventListener('change', (e) => {
      this.currentFilters.status = e.target.value;
      this.renderComplaints();
    });
    document.getElementById('admin-category-filter').addEventListener('change', (e) => {
      this.currentFilters.category = e.target.value;
      this.renderComplaints();
    });
    document.getElementById('admin-priority-filter').addEventListener('change', (e) => {
      this.currentFilters.priority = e.target.value;
      this.renderComplaints();
    });
  },

  renderComplaints() {
    let complaints = Complaints.getAll();
    const { status, category, priority, search } = this.currentFilters;
    if (status) complaints = complaints.filter(c => c.status === status);
    if (category) complaints = complaints.filter(c => c.category === category);
    if (priority) complaints = complaints.filter(c => c.priority === priority);
    if (search) {
      const s = search.toLowerCase();
      complaints = complaints.filter(c =>
        c.id.toLowerCase().includes(s) ||
        c.title.toLowerCase().includes(s) ||
        c.userName.toLowerCase().includes(s)
      );
    }
    const container = document.getElementById('admin-complaints-list');
    if (complaints.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>No complaints found</h3>
          <p>Try adjusting your filters</p>
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
              <th>User</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${complaints.map(c => `
              <tr onclick="App.viewAdminComplaint('${c.id}')">
                <td style="color:var(--accent-blue);font-weight:600">${c.id}</td>
                <td>${Utils.escapeHtml(c.title)}</td>
                <td style="color:var(--text-secondary)">${Utils.escapeHtml(c.userName)}</td>
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

  renderDetail(ticketId) {
    const complaint = Complaints.getById(ticketId);
    if (!complaint) {
      Utils.showToast('Complaint not found', 'error');
      App.navigate('admin');
      return;
    }
    const container = document.getElementById('view-admin-detail');
    container.innerHTML = `
      <button class="back-btn" onclick="App.navigate('admin')">← Back to Admin Dashboard</button>
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
          <h3>Complaint Info</h3>
          <div class="detail-meta">
            <div class="meta-item"><label>Submitted By</label><span>${Utils.escapeHtml(complaint.userName)}</span></div>
            <div class="meta-item"><label>Email</label><span>${Utils.escapeHtml(complaint.userEmail)}</span></div>
            <div class="meta-item"><label>Category</label><span>${Utils.getCategoryLabel(complaint.category)}</span></div>
            <div class="meta-item"><label>Submitted</label><span>${Utils.formatDateTime(complaint.createdAt)}</span></div>
          </div>
          <div class="description-text">${Utils.escapeHtml(complaint.description)}</div>
        </div>

        <div class="detail-card">
          <h3>Admin Actions</h3>
          <div class="admin-actions">
            <div class="form-group">
              <label class="form-label">Update Status</label>
              <select class="form-select" id="admin-update-status">
                <option value="open" ${complaint.status === 'open' ? 'selected' : ''}>Open</option>
                <option value="in-progress" ${complaint.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                <option value="resolved" ${complaint.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                <option value="closed" ${complaint.status === 'closed' ? 'selected' : ''}>Closed</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Update Priority</label>
              <select class="form-select" id="admin-update-priority">
                <option value="low" ${complaint.priority === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${complaint.priority === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${complaint.priority === 'high' ? 'selected' : ''}>High</option>
                <option value="critical" ${complaint.priority === 'critical' ? 'selected' : ''}>Critical</option>
              </select>
            </div>
            <button class="btn btn-primary" style="width:auto;margin-bottom:0;align-self:flex-end" onclick="Admin.applyUpdates('${complaint.id}')">Apply Changes</button>
          </div>
        </div>

        <div class="detail-card">
          <h3>Add Response</h3>
          <div class="form-group">
            <textarea class="form-textarea" id="admin-response-text" placeholder="Type your response to the user..." style="min-height:100px"></textarea>
          </div>
          <button class="btn btn-primary" style="width:auto" onclick="Admin.sendResponse('${complaint.id}')">Send Response</button>
        </div>

        ${complaint.responses.length > 0 ? `
          <div class="detail-card">
            <h3>Responses (${complaint.responses.length})</h3>
            ${complaint.responses.slice().reverse().map(r => `
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
  },

  applyUpdates(ticketId) {
    const user = Auth.getCurrentUser();
    const newStatus = document.getElementById('admin-update-status').value;
    const newPriority = document.getElementById('admin-update-priority').value;
    const complaint = Complaints.getById(ticketId);
    let changed = false;
    if (complaint.status !== newStatus) {
      Complaints.updateStatus(ticketId, newStatus, user.name);
      changed = true;
    }
    if (complaint.priority !== newPriority) {
      Complaints.updatePriority(ticketId, newPriority, user.name);
      changed = true;
    }
    if (changed) {
      Utils.showToast('Complaint updated successfully', 'success');
      this.renderDetail(ticketId);
    } else {
      Utils.showToast('No changes to apply', 'info');
    }
  },

  sendResponse(ticketId) {
    const text = document.getElementById('admin-response-text').value.trim();
    if (!text) {
      Utils.showToast('Please enter a response', 'error');
      return;
    }
    const user = Auth.getCurrentUser();
    Complaints.addResponse(ticketId, text, user.name);
    Utils.showToast('Response sent successfully', 'success');
    this.renderDetail(ticketId);
  }
};
