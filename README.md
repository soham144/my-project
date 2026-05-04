# Complaint Tracking System Portal

A web-based portal for submitting, tracking, and managing complaints with unique Ticket IDs, real-time status updates, and an admin management panel.

## Features

- **Submit Complaints** — Select categories (Technical Issue, Job Related, Content Error, Billing, Other) and get a unique Ticket ID (`CTS-XXXXXX`)
- **User Dashboard** — Monitor complaint status (Open, In Progress, Resolved, Closed) with search and filters
- **Admin Panel** — Manage complaints, update status/priority, and add responses
- **Dark Glassmorphism Design** — Modern UI with gradients, animations, and responsive layout

## Getting Started

```bash
npx -y serve . -p 3000
```

Open **http://localhost:3000**

### Default Admin Credentials
- **Email:** admin@cts.com
- **Password:** admin123

## Tech Stack

- HTML, CSS, JavaScript (Vanilla)
- localStorage for data persistence
- Inter font (Google Fonts)
