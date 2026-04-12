const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── DATABASE SETUP ───────────────────────────────────────────
const db = new Database('./enquiries.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS enquiries (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    parent     TEXT NOT NULL,
    phone      TEXT NOT NULL,
    email      TEXT,
    class      TEXT NOT NULL,
    board      TEXT NOT NULL,
    message    TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  )
`);

console.log('✅ SQLite database ready — enquiries.db');

// ─── NODEMAILER SETUP ─────────────────────────────────────────
// Uses Gmail App Password (see README for setup)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'kboomipal@gmail.com',
    pass: process.env.GMAIL_APP_PASS || 'YOUR_GMAIL_APP_PASSWORD'
  }
});

// ─── ROUTES ───────────────────────────────────────────────────

// Submit enquiry
app.post('/api/enquiry', (req, res) => {
  const { name, parent, phone, email, class: cls, board, message } = req.body;

  // Validation
  if (!name || !parent || !phone || !cls || !board) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }
  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ success: false, error: 'Invalid phone number' });
  }

  // 1. Save to SQLite
  const stmt = db.prepare(`
    INSERT INTO enquiries (name, parent, phone, email, class, board, message)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(name, parent, phone, email || '', cls, board, message || '');

  // 2. Send Email via Nodemailer
  const mailOptions = {
    from: `"Saraswathi Tuition Centre" <${process.env.GMAIL_USER || 'kboomipal@gmail.com'}>`,
    to: 'kboomipal@gmail.com',
    subject: `📋 New Admission Enquiry — ${name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;border-radius:12px;overflow:hidden">
        <div style="background:#1A1240;padding:28px 32px;text-align:center">
          <h1 style="color:#F5C842;font-size:1.4rem;margin:0">Saraswathi Tuition Centre</h1>
          <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:0.85rem">New Admission Enquiry Received</p>
        </div>
        <div style="padding:28px 32px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666;width:140px">👤 Student Name</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;color:#1A1240">${name}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666">👨‍👩‍👧 Parent Name</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;color:#1A1240">${parent}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666">📞 Phone</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;color:#E8751A">${phone}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666">✉️ Email</td><td style="padding:10px 0;border-bottom:1px solid #eee;color:#1A1240">${email || 'Not provided'}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666">🎓 Class / Level</td><td style="padding:10px 0;border-bottom:1px solid #eee;color:#1A1240">${cls}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#666">📋 Board</td><td style="padding:10px 0;border-bottom:1px solid #eee;color:#1A1240">${board}</td></tr>
            <tr><td style="padding:10px 0;color:#666;vertical-align:top">💬 Message</td><td style="padding:10px 0;color:#1A1240">${message || 'None'}</td></tr>
          </table>
          <div style="margin-top:24px;padding:16px;background:#FFF3E0;border-radius:8px;border-left:4px solid #E8751A">
            <p style="margin:0;font-size:0.85rem;color:#E8751A;font-weight:600">Enquiry #${result.lastInsertRowid} — Received on ${new Date().toLocaleString('en-IN')}</p>
          </div>
          <a href="https://wa.me/91${phone}?text=Hello%20${encodeURIComponent(name)}%2C%20thank%20you%20for%20your%20enquiry%20at%20Saraswathi%20Tuition%20Centre.%20We%20will%20get%20back%20to%20you%20shortly!"
             style="display:inline-block;margin-top:20px;background:#25D366;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.9rem">
            💬 Reply on WhatsApp
          </a>
        </div>
        <div style="background:#1A1240;padding:16px 32px;text-align:center">
          <p style="color:rgba(255,255,255,0.4);font-size:0.75rem;margin:0">Saraswathi Tuition Centre · Coimbatore · Est. 2015</p>
        </div>
      </div>
    `
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('❌ Email error:', err.message);
    } else {
      console.log('✅ Email sent:', info.messageId);
    }
  });

  // 3. Respond success
  res.json({
    success: true,
    id: result.lastInsertRowid,
    whatsappUrl: `https://wa.me/919080894665?text=${encodeURIComponent(
      `*New Admission Enquiry — Saraswathi Tuition Centre*\n\n👤 Student: ${name}\n👨‍👩‍👧 Parent: ${parent}\n📞 Phone: ${phone}\n✉️ Email: ${email || 'Not provided'}\n🎓 Class: ${cls}\n📋 Board: ${board}\n💬 Message: ${message || 'None'}`
    )}`
  });
});

// View all enquiries (admin)
app.get('/api/enquiries', (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if (secret !== (process.env.ADMIN_SECRET || 'saraswathi2026')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const rows = db.prepare('SELECT * FROM enquiries ORDER BY id DESC').all();
  res.json({ total: rows.length, enquiries: rows });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve website
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Saraswathi Tuition Centre server running on port ${PORT}`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Health:  http://localhost:${PORT}/api/health`);
});
