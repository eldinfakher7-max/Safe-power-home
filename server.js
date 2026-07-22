require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const next = require('next');
const supabaseClient = require('./src/lib/supabase');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const JWT_SECRET = process.env.JWT_SECRET || 'smart_power_secret_key_9876';
const DEVICE_PASSWORD = 'fakherkoky@2010';
const PORT = parseInt(process.env.PORT || '3000');

// ──────────────────────────────────────────
//  IN-MEMORY DATABASE (fallback / primary)
// ──────────────────────────────────────────
let db = {
  users: [],
  devices: [],
  alerts: [],
  complaints: [],
  complaintMessages: [],
  authRequests: [],
  notifications: [],
  settings: {},
  logs: [],
};

let idCounters = { user: 1, device: 1, alert: 1, complaint: 1, authReq: 1, notif: 1 };
function nextId(type) { return `${type}_${idCounters[type]++}`; }

function complaintId() {
  return 'TKT-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

// Sync from Supabase if configured
async function syncFromSupabase() {
  if (!supabaseClient.isConfigured()) return;
  console.log('🔄 Syncing local database cache with Supabase...');
  try {
    const u = await supabaseClient.fetchTable('users');
    if (u && u.length > 0) db.users = u;
    
    const d = await supabaseClient.fetchTable('devices');
    if (d && d.length > 0) db.devices = d;
    
    const a = await supabaseClient.fetchTable('alerts');
    if (a && a.length > 0) db.alerts = a;
    
    const c = await supabaseClient.fetchTable('complaints');
    if (c && c.length > 0) db.complaints = c;
    
    const cm = await supabaseClient.fetchTable('complaint_messages');
    if (cm && cm.length > 0) db.complaintMessages = cm;
    
    const ar = await supabaseClient.fetchTable('auth_requests');
    if (ar && ar.length > 0) db.authRequests = ar;
    
    const n = await supabaseClient.fetchTable('notifications');
    if (n && n.length > 0) db.notifications = n;
    
    const l = await supabaseClient.fetchTable('logs');
    if (l && l.length > 0) db.logs = l;
    
    const s = await supabaseClient.fetchTable('settings');
    if (s && s.length > 0) {
      s.forEach(item => {
        db.settings[item.key] = item.value;
      });
    }
    
    // Update local ID counters to avoid collisions
    const updateCounter = (list, key) => {
      if (list && list.length > 0) {
        const ids = list.map(item => {
          const m = (item.id || '').match(/\d+/);
          return m ? parseInt(m[0]) : 0;
        });
        idCounters[key] = Math.max(...ids) + 1;
      }
    };
    updateCounter(db.users, 'user');
    updateCounter(db.devices, 'device');
    updateCounter(db.alerts, 'alert');
    updateCounter(db.complaints, 'complaint');
    updateCounter(db.authRequests, 'authReq');
    updateCounter(db.notifications, 'notif');

    console.log('✅ Local database cache fully synced with Supabase.');
  } catch (err) {
    console.error('❌ Failed to sync from Supabase:', err.message);
  }
}

// Seed admin account
async function seedAdmin() {
  // Ensure default admin exists
  if (!db.users.find(u => u.email === 'admin@smartpowerhome.com')) {
    const adminUser = {
      id: nextId('user'),
      name: 'System Administrator',
      email: 'admin@smartpowerhome.com',
      phone: '+966500000000',
      password: await bcrypt.hash('Admin123', 10),
      userType: 'Admin',
      status: 'Active',
      createdAt: new Date(),
    };
    db.users.push(adminUser);
    await supabaseClient.upsertRecord('users', adminUser);
  }
  
  // Ensure default demo user exists
  if (!db.users.find(u => u.email === 'user@smartpowerhome.com')) {
    const demoUser = {
      id: nextId('user'),
      name: 'Demo User',
      email: 'user@smartpowerhome.com',
      phone: '+966511111111',
      password: await bcrypt.hash('User123', 10),
      userType: 'User',
      status: 'Active',
      createdAt: new Date(),
    };
    db.users.push(demoUser);
    await supabaseClient.upsertRecord('users', demoUser);
  }

  // Ensure default settings exist
  const defaultSettings = {
    voltage_min: '195',
    voltage_max: '250',
    current_limit: '15',
    temp_limit: '60',
    ai_enabled: 'true',
    firebase_notifications: 'false',
    mqtt_broker: 'broker.hivemq.com',
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    if (db.settings[key] === undefined) {
      db.settings[key] = value;
      await supabaseClient.upsertRecord('settings', { key, value });
    }
  }
}

// ──────────────────────────────────────────
//  TELEMETRY SIMULATION
// ──────────────────────────────────────────
let telemetryState = { voltage: 220, current: 0, power: 0, panelTemp: 35, riskScore: 0, status: 'SAFE' };

function computeTelemetry() {
  const activeDevices = db.devices.filter(d => d.state === 1);
  const totalPower = activeDevices.reduce((s, d) => s + (d.powerRating || 0), 0);
  const current = totalPower / 220;
  const noiseV = (Math.random() - 0.5) * 4;
  const voltage = 220 + noiseV;
  const panelTemp = 30 + (totalPower / 500) + (Math.random() - 0.5) * 2;

  let riskScore = 0;
  const vMin = parseInt(db.settings.voltage_min || '195');
  const vMax = parseInt(db.settings.voltage_max || '250');
  const iLimit = parseInt(db.settings.current_limit || '15');
  const tLimit = parseInt(db.settings.temp_limit || '60');

  if (voltage < vMin || voltage > vMax) riskScore += 30;
  if (current > iLimit * 0.7) riskScore += Math.min(40, ((current / iLimit) * 40));
  if (panelTemp > tLimit * 0.8) riskScore += Math.min(30, ((panelTemp / tLimit) * 30));
  riskScore = Math.min(100, Math.round(riskScore + Math.random() * 5));

  const status = riskScore >= 80 ? 'DANGER' : riskScore >= 50 ? 'WARNING' : 'SAFE';

  telemetryState = { voltage: parseFloat(voltage.toFixed(2)), current: parseFloat(current.toFixed(3)), power: totalPower, panelTemp: parseFloat(panelTemp.toFixed(1)), riskScore, status };
  return telemetryState;
}

async function addNotification(userId, message, type = 'Info') {
  const n = { id: nextId('notif'), userId, message, type, status: 'Unread', timestamp: new Date() };
  db.notifications.push(n);
  await supabaseClient.upsertRecord('notifications', n);
  return n;
}

async function addAlert(title, message, severity, deviceId = null, deviceName = null, userId = null) {
  const a = { id: nextId('alert'), title, message, severity, status: 'Active', deviceId, deviceName, userId, timestamp: new Date() };
  db.alerts.push(a);
  await supabaseClient.upsertRecord('alerts', a);
  return a;
}

async function addAuditLog(deviceName, action) {
  const log = { id: Date.now().toString(), deviceName, action, timestamp: new Date() };
  db.logs.push(log);
  await supabaseClient.upsertRecord('logs', log);
  return log;
}

// ──────────────────────────────────────────
//  JWT MIDDLEWARE
// ──────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token.' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.userType !== 'Admin') return res.status(403).json({ error: 'Admin only.' });
  next();
}

// ──────────────────────────────────────────
//  MAIN BOOT
// ──────────────────────────────────────────
app.prepare().then(async () => {
  await syncFromSupabase();
  await seedAdmin();

  const expressApp = express();
  const server = http.createServer(expressApp);
  const io = new Server(server, { cors: { origin: '*' } });

  const cors = require('cors');
  expressApp.use(cors());
  expressApp.use(express.json());

  // ──────────────────────────────────────────
  //  SOCKET.IO
  // ──────────────────────────────────────────
  io.on('connection', (socket) => {
    socket.on('join_room', (roomId) => socket.join(roomId));
    socket.on('leave_room', (roomId) => socket.leave(roomId));
  });

  // ──────────────────────────────────────────
  //  TELEMETRY LOOP (every 5s)
  // ──────────────────────────────────────────
  setInterval(async () => {
    const tel = computeTelemetry();
    io.emit('live_telemetry', tel);

    // Update device metrics
    const TICK_HOURS = 5 / 3600;
    let metricsChanged = false;

    for (const device of db.devices) {
      if (device.state !== 1) continue;
      const addedEnergy = (device.powerRating / 1000) * TICK_HOURS;
      device.currentWorkingHours = (device.currentWorkingHours || 0) + TICK_HOURS;
      device.currentConsumption = (device.currentConsumption || 0) + addedEnergy;
      device.todayConsumption = (device.todayConsumption || 0) + addedEnergy;
      device.monthlyConsumption = (device.monthlyConsumption || 0) + addedEnergy;
      metricsChanged = true;

      // Sync active devices telemetry to Supabase periodically to preserve metrics
      await supabaseClient.upsertRecord('devices', device);

      // Check hours exceeded
      if (!device._hoursWarned && device.currentWorkingHours >= device.maxWorkingHours) {
        device._hoursWarned = true;
        const a = await addAlert(
          '⏱️ Operating Hours Exceeded',
          `Device "${device.name}" has exceeded its daily operating limit of ${device.maxWorkingHours} hours.`,
          'Warning', device.id, device.name, device.userId
        );
        const n = await addNotification(device.userId, `⏱️ ${device.name} has exceeded its daily operating limit.`, 'Warning');
        io.emit('limit_warning_alert', { title: a.title, message: a.message, deviceId: device.id });
        io.to(device.userId).emit('notification', n);
      }

      // Check energy exceeded
      if (!device._energyWarned && device.currentConsumption >= device.maxEnergyConsumption) {
        device._energyWarned = true;
        const severity = 'Danger';
        const a = await addAlert(
          '⚡ Energy Limit Exceeded',
          `Device "${device.name}" consumed ${device.currentConsumption.toFixed(3)} kWh, exceeding its limit of ${device.maxEnergyConsumption} kWh.`,
          severity, device.id, device.name, device.userId
        );
        const n = await addNotification(device.userId, `⚡ ${device.name} exceeded energy limit! Auto-shutdown ${device.autoShutdown ? 'activated' : 'disabled'}.`, 'Critical Alert');
        io.emit('limit_warning_alert', { title: a.title, message: a.message, deviceId: device.id });
        io.to(device.userId).emit('notification', n);

        // Auto-shutdown
        if (device.autoShutdown) {
          device.state = 0;
          await addNotification(device.userId, `🔴 ${device.name} was automatically turned OFF (energy limit reached).`, 'Device Stopped');
          await addAuditLog(device.name, 'OFF');
          await supabaseClient.upsertRecord('devices', device);
        }
      }
    }

    if (metricsChanged) {
      io.emit('device_metrics_updated');
    }
  }, 5000);

  // ══════════════════════════════════════════
  //  AUTH APIs
  // ══════════════════════════════════════════

  // POST /api/auth/signup
  expressApp.post('/api/auth/signup', async (req, res) => {
    const { name, email, phone, password, userType, adminSecretKey } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required.' });
    if (userType === 'Admin' && adminSecretKey !== 'fakherkoky@2010') {
      return res.status(403).json({ error: 'Incorrect Admin Secret Password.' });
    }
    if (db.users.find(u => u.email === email)) return res.status(409).json({ error: 'Email already registered.' });
    const hashed = await bcrypt.hash(password, 10);
    const user = { id: nextId('user'), name, email, phone: phone || '', password: hashed, userType: userType || 'User', status: 'Active', createdAt: new Date() };
    db.users.push(user);
    await supabaseClient.upsertRecord('users', user);
    await addNotification(user.id, `Welcome to Smart Power Home AI, ${name}! Your account is ready.`, 'Info');
    res.json({ message: 'Account created successfully.' });
  });

  // POST /api/auth/login
  expressApp.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const normalizedInput = (email || '').trim().toLowerCase();
    const user = db.users.find(u => 
      u.email.toLowerCase() === normalizedInput || 
      (u.phone && u.phone.replace(/\s+/g, '') === normalizedInput.replace(/\s+/g, ''))
    );
    if (!user) return res.status(401).json({ error: 'Invalid email/phone or password.' });
    if (user.status === 'Suspended') return res.status(403).json({ error: 'Your account has been suspended. Contact the administrator.' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });
    const token = jwt.sign({ id: user.id, email: user.email, userType: user.userType, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  });

  // ══════════════════════════════════════════
  //  DEVICE APIs
  // ══════════════════════════════════════════

  // GET /api/devices
  expressApp.get('/api/devices', auth, (req, res) => {
    let devices = req.user.userType === 'Admin'
      ? db.devices
      : db.devices.filter(d => d.userId === req.user.id);
    res.json(devices);
  });

  // POST /api/devices
  expressApp.post('/api/devices', auth, async (req, res) => {
    const { name, type, location, imageIcon, customImage, customImageName, powerRating, maxWorkingHours, maxEnergyConsumption, auth_password, autoShutdown } = req.body;
    if (!name || !type || !location) return res.status(400).json({ error: 'Name, type, and location are required.' });
    if (auth_password !== DEVICE_PASSWORD) return res.status(403).json({ error: 'Incorrect device registration password.' });

    const device = {
      id: nextId('device'),
      userId: req.user.id,
      name, type,
      location,
      imageIcon: imageIcon || 'fa-plug',
      customImage: customImage || '',
      customImageName: customImageName || '',
      powerRating: powerRating || 1000,
      maxWorkingHours: maxWorkingHours || 8,
      maxEnergyConsumption: maxEnergyConsumption || 10,
      autoShutdown: autoShutdown || false,
      state: 0,
      currentWorkingHours: 0,
      currentConsumption: 0,
      todayConsumption: 0,
      monthlyConsumption: 0,
      _hoursWarned: false,
      _energyWarned: false,
      createdAt: new Date(),
    };
    db.devices.push(device);
    await supabaseClient.upsertRecord('devices', device);

    await addNotification(req.user.id, `✅ Device "${name}" has been registered successfully.`, 'Device Added');
    io.emit('device_metrics_updated');
    res.json(device);
  });

  // PUT /api/devices/:id
  expressApp.put('/api/devices/:id', auth, async (req, res) => {
    const device = db.devices.find(d => d.id === req.params.id && (req.user.userType === 'Admin' || d.userId === req.user.id));
    if (!device) return res.status(404).json({ error: 'Device not found.' });
    const { name, type, location, power_rating, max_working_hours, max_energy_consumption, imageIcon, customImage, customImageName, autoShutdown, currentWorkingHours, currentConsumption } = req.body;
    if (name) device.name = name;
    if (type) device.type = type;
    if (location) device.location = location;
    if (power_rating) device.powerRating = power_rating;
    if (max_working_hours !== undefined) { device.maxWorkingHours = max_working_hours; device._hoursWarned = false; }
    if (max_energy_consumption !== undefined) { device.maxEnergyConsumption = max_energy_consumption; device._energyWarned = false; }
    if (imageIcon) device.imageIcon = imageIcon;
    if (customImage !== undefined) device.customImage = customImage;
    if (customImageName !== undefined) device.customImageName = customImageName;
    if (autoShutdown !== undefined) device.autoShutdown = autoShutdown;
    if (currentWorkingHours !== undefined) device.currentWorkingHours = currentWorkingHours;
    if (currentConsumption !== undefined) device.currentConsumption = currentConsumption;
    
    await supabaseClient.upsertRecord('devices', device);
    io.emit('device_metrics_updated');
    res.json(device);
  });

  // DELETE /api/devices/:id
  expressApp.delete('/api/devices/:id', auth, async (req, res) => {
    const idx = db.devices.findIndex(d => d.id === req.params.id && (req.user.userType === 'Admin' || d.userId === req.user.id));
    if (idx === -1) return res.status(404).json({ error: 'Device not found.' });
    const device = db.devices[idx];
    db.devices.splice(idx, 1);
    
    await supabaseClient.deleteRecord('devices', 'id', req.params.id);
    await addNotification(device.userId, `🗑️ Device "${device.name}" has been removed.`, 'Device Removed');
    io.emit('device_metrics_updated');
    res.json({ message: 'Device removed.' });
  });

  // POST /api/devices/:id/toggle
  expressApp.post('/api/devices/:id/toggle', auth, async (req, res) => {
    const device = db.devices.find(d => d.id === req.params.id && (req.user.userType === 'Admin' || d.userId === req.user.id));
    if (!device) return res.status(404).json({ error: 'Device not found.' });
    const { state } = req.body;
    const newState = state !== undefined ? state : (device.state === 1 ? 0 : 1);
    device.state = newState;

    if (newState === 1) {
      device._hoursWarned = false;
      device._energyWarned = false;
      await addNotification(device.userId, `🟢 "${device.name}" turned ON.`, 'Device Started');
      await addAuditLog(device.name, 'ON');
    } else {
      await addNotification(device.userId, `🔴 "${device.name}" turned OFF.`, 'Device Stopped');
      await addAuditLog(device.name, 'OFF');
    }
    
    await supabaseClient.upsertRecord('devices', device);
    io.emit('device_metrics_updated');
    res.json(device);
  });

  // POST /api/devices/:id/restart (reset counters)
  expressApp.post('/api/devices/:id/restart', auth, async (req, res) => {
    const device = db.devices.find(d => d.id === req.params.id && (req.user.userType === 'Admin' || d.userId === req.user.id));
    if (!device) return res.status(404).json({ error: 'Device not found.' });
    device.currentWorkingHours = 0;
    device.currentConsumption = 0;
    device.todayConsumption = 0;
    device._hoursWarned = false;
    device._energyWarned = false;
    
    await supabaseClient.upsertRecord('devices', device);
    io.emit('device_metrics_updated');
    res.json({ message: 'Device counters reset.' });
  });

  // ══════════════════════════════════════════
  //  NOTIFICATION APIs
  // ══════════════════════════════════════════

  // GET /api/notifications
  expressApp.get('/api/notifications', auth, (req, res) => {
    const userNotifs = req.user.userType === 'Admin'
      ? db.notifications
      : db.notifications.filter(n => n.userId === req.user.id);
    res.json(userNotifs.slice().reverse().slice(0, 50));
  });

  // POST /api/notifications/read-all
  expressApp.post('/api/notifications/read-all', auth, async (req, res) => {
    for (const n of db.notifications) {
      if (n.userId === req.user.id || req.user.userType === 'Admin') {
        n.status = 'Read';
        await supabaseClient.upsertRecord('notifications', n);
      }
    }
    res.json({ message: 'All marked as read.' });
  });

  // ══════════════════════════════════════════
  //  ALERTS APIs
  // ══════════════════════════════════════════

  // GET /api/alerts
  expressApp.get('/api/alerts', auth, (req, res) => {
    const userAlerts = req.user.userType === 'Admin'
      ? db.alerts
      : db.alerts.filter(a => !a.userId || a.userId === req.user.id);
    res.json(userAlerts.slice().reverse());
  });

  // PUT /api/alerts/:id/resolve
  expressApp.put('/api/alerts/:id/resolve', auth, async (req, res) => {
    const alert = db.alerts.find(a => a.id === req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found.' });
    alert.status = 'Resolved';
    await supabaseClient.upsertRecord('alerts', alert);
    res.json(alert);
  });

  // ══════════════════════════════════════════
  //  COMPLAINT APIs
  // ══════════════════════════════════════════

  // GET /api/complaints
  expressApp.get('/api/complaints', auth, (req, res) => {
    const list = req.user.userType === 'Admin'
      ? db.complaints
      : db.complaints.filter(c => c.userId === req.user.id);
    res.json(list.slice().reverse());
  });

  // POST /api/complaints
  expressApp.post('/api/complaints', auth, async (req, res) => {
    const { name, email, phone, address, deviceName, deviceType, category, priority, subject, description } = req.body;
    if (!subject || !description) return res.status(400).json({ error: 'Subject and description required.' });
    const complaint = {
      id: nextId('complaint'),
      complaintId: complaintId(),
      userId: req.user.id,
      name: name || req.user.name,
      email: email || req.user.email,
      phone: phone || '',
      address: address || '',
      deviceName: deviceName || '',
      deviceType: deviceType || '',
      category: category || 'Other',
      priority: priority || 'Medium',
      subject,
      description,
      status: 'Open',
      adminReply: '',
      createdAt: new Date(),
    };
    db.complaints.push(complaint);
    await supabaseClient.upsertRecord('complaints', complaint);
    await addNotification(req.user.id, `🎫 Your support ticket "${subject}" has been submitted (${complaint.complaintId}).`, 'Info');
    io.emit('new_complaint');
    res.json(complaint);
  });

  // PUT /api/complaints/:cid
  expressApp.put('/api/complaints/:cid', auth, async (req, res) => {
    const complaint = db.complaints.find(c => c.complaintId === req.params.cid);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });
    const { status, admin_reply } = req.body;
    if (status) complaint.status = status;
    if (admin_reply) complaint.adminReply = admin_reply;
    complaint.updatedAt = new Date();
    
    await supabaseClient.upsertRecord('complaints', complaint);
    await addNotification(complaint.userId, `📋 Your ticket ${complaint.complaintId} status updated to "${status}".`, 'Info');
    io.emit('complaint_updated');
    res.json(complaint);
  });

  // DELETE /api/complaints/:cid
  expressApp.delete('/api/complaints/:cid', auth, adminOnly, async (req, res) => {
    const idx = db.complaints.findIndex(c => c.complaintId === req.params.cid);
    if (idx === -1) return res.status(404).json({ error: 'Complaint not found.' });
    db.complaints.splice(idx, 1);
    await supabaseClient.deleteRecord('complaints', 'complaintId', req.params.cid);
    res.json({ message: 'Complaint deleted.' });
  });

  // GET /api/complaints/:cid/messages
  expressApp.get('/api/complaints/:cid/messages', auth, (req, res) => {
    const msgs = db.complaintMessages.filter(m => m.complaintId === req.params.cid);
    res.json(msgs);
  });

  // POST /api/complaints/:cid/messages
  expressApp.post('/api/complaints/:cid/messages', auth, async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required.' });
    const complaint = db.complaints.find(c => c.complaintId === req.params.cid);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });
    const msg = {
      id: Date.now().toString(),
      complaintId: req.params.cid,
      senderId: req.user.id,
      senderName: req.user.name,
      senderType: req.user.userType,
      message,
      timestamp: new Date(),
    };
    db.complaintMessages.push(msg);
    await supabaseClient.upsertRecord('complaint_messages', msg);
    
    if (complaint.status === 'Open' && req.user.userType === 'Admin') {
      complaint.status = 'In Progress';
      await supabaseClient.upsertRecord('complaints', complaint);
    }
    io.to(req.params.cid).emit('chat_message', msg);
    res.json(msg);
  });

  // ══════════════════════════════════════════
  //  DEVICE AUTHORIZATION REQUEST APIs
  // ══════════════════════════════════════════

  // GET /api/admin/requests
  expressApp.get('/api/admin/requests', auth, (req, res) => {
    const list = req.user.userType === 'Admin'
      ? db.authRequests
      : db.authRequests.filter(r => r.userId === req.user.id);
    res.json(list.slice().reverse());
  });

  // POST /api/admin/requests
  expressApp.post('/api/admin/requests', auth, async (req, res) => {
    const { userName, email, deviceName, reason, message } = req.body;
    const req_obj = {
      id: nextId('authReq'),
      userId: req.user.id,
      userName: userName || req.user.name,
      email: email || req.user.email,
      deviceName: deviceName || 'Unknown',
      reason: reason || 'New Device Installation',
      message: message || '',
      status: 'Pending',
      adminNotes: '',
      date: new Date(),
    };
    db.authRequests.push(req_obj);
    await supabaseClient.upsertRecord('auth_requests', req_obj);
    
    await addNotification(req.user.id, `📝 Device access request for "${deviceName}" submitted. Awaiting admin approval.`, 'Info');
    
    // Notify admins
    for (const admin of db.users.filter(u => u.userType === 'Admin')) {
      await addNotification(admin.id, `🔔 New device request from ${req.user.name} for "${deviceName}".`, 'Warning');
    }
    io.emit('new_auth_request');
    res.json(req_obj);
  });

  // POST /api/admin/requests/:id/action
  expressApp.post('/api/admin/requests/:id/action', auth, adminOnly, async (req, res) => {
    const r = db.authRequests.find(r => r.id === req.params.id);
    if (!r) return res.status(404).json({ error: 'Request not found.' });
    const { status, admin_notes } = req.body;
    r.status = status;
    r.adminNotes = admin_notes || '';
    r.actionDate = new Date();
    
    await supabaseClient.upsertRecord('auth_requests', r);
    await addNotification(r.userId,
      status === 'Approved'
        ? `✅ Your device request for "${r.deviceName}" was approved! You can now register it.`
        : `❌ Your device request for "${r.deviceName}" was rejected. Reason: ${admin_notes || 'Not specified.'}`,
      status === 'Approved' ? 'Info' : 'Warning'
    );
    io.emit('request_action', { requestId: r.id, status });
    res.json(r);
  });

  // ══════════════════════════════════════════
  //  ADMIN USER APIs
  // ══════════════════════════════════════════

  // GET /api/admin/users
  expressApp.get('/api/admin/users', auth, adminOnly, (req, res) => {
    const users = db.users.map(({ password, ...u }) => u);
    res.json(users);
  });

  // POST /api/admin/users/:id/status
  expressApp.post('/api/admin/users/:id/status', auth, adminOnly, async (req, res) => {
    const user = db.users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    user.status = req.body.status;
    
    await supabaseClient.upsertRecord('users', user);
    await addNotification(user.id, `Your account status has been changed to "${req.body.status}" by an administrator.`, 'Warning');
    res.json({ message: 'Status updated.' });
  });

  // DELETE /api/admin/users/:id
  expressApp.delete('/api/admin/users/:id', auth, adminOnly, async (req, res) => {
    const idx = db.users.findIndex(u => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found.' });
    db.users.splice(idx, 1);
    await supabaseClient.deleteRecord('users', 'id', req.params.id);
    
    // Remove user's devices locally & on Supabase
    db.devices = db.devices.filter(d => d.userId !== req.params.id);
    await supabaseClient.deleteRecord('devices', 'userId', req.params.id);
    res.json({ message: 'User deleted.' });
  });

  // ══════════════════════════════════════════
  //  SETTINGS API
  // ══════════════════════════════════════════

  // GET /api/settings
  expressApp.get('/api/settings', auth, adminOnly, (req, res) => {
    res.json(db.settings);
  });

  // POST /api/settings
  expressApp.post('/api/settings', auth, adminOnly, async (req, res) => {
    db.settings = { ...db.settings, ...req.body };
    for (const [key, value] of Object.entries(db.settings)) {
      await supabaseClient.upsertRecord('settings', { key, value });
    }
    res.json(db.settings);
  });

  // ══════════════════════════════════════════
  //  PROFILE API
  // ══════════════════════════════════════════

  // PUT /api/profile/update
  expressApp.put('/api/profile/update', auth, async (req, res) => {
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (req.body.name) user.name = req.body.name;
    if (req.body.phone) user.phone = req.body.phone;
    if (req.body.password) user.password = await bcrypt.hash(req.body.password, 10);
    
    await supabaseClient.upsertRecord('users', user);
    const { password, ...safe } = user;
    res.json(safe);
  });

  // ══════════════════════════════════════════
  //  REPORTS & HISTORY APIs
  // ══════════════════════════════════════════

  // GET /api/reports/list
  expressApp.get('/api/reports/list', auth, (req, res) => {
    const devices = req.user.userType === 'Admin' ? db.devices : db.devices.filter(d => d.userId === req.user.id);
    const highConsumers = devices.filter(d => d.currentConsumption > d.maxEnergyConsumption * 0.7);
    const reports = [];
    if (highConsumers.length > 0) {
      reports.push({
        title: `⚡ High Consumption Alert — ${highConsumers.length} device(s)`,
        overload_risk: `${highConsumers.map(d => d.name).join(', ')} are approaching or exceeding consumption limits.`,
        fire_risk: highConsumers.some(d => d.powerRating > 2000) ? 'High-wattage devices running near limits increase fire risk.' : null,
        failure_risk: `Continuous overloading may reduce device lifespan significantly.`,
        recommendations: highConsumers.map(d => `• Reduce usage of ${d.name} (${d.currentConsumption.toFixed(2)} / ${d.maxEnergyConsumption} kWh)`).join('\n'),
      });
    }
    if (devices.filter(d => d.state === 1).length > 5) {
      reports.push({
        title: '📊 Peak Load Management',
        overload_risk: 'Multiple devices running simultaneously may overload your circuit.',
        fire_risk: null,
        failure_risk: null,
        recommendations: '• Consider using a staggered schedule for high-wattage devices.\n• Enable auto-shutdown on non-critical devices.',
      });
    }
    res.json(reports);
  });

  // GET /api/history/logs
  expressApp.get('/api/history/logs', auth, (req, res) => {
    res.json(db.logs.slice().reverse().slice(0, 100));
  });

  // ══════════════════════════════════════════
  //  NEXT.JS HANDLER
  // ══════════════════════════════════════════
  expressApp.all('/{*path}', (req, res) => handle(req, res));

  server.listen(PORT, () => {
    console.log(`\n🚀 Smart Power Home AI`);
    console.log(`   ➜  http://localhost:${PORT}`);
    console.log(`   ➜  Mode: ${dev ? 'DEVELOPMENT' : 'PRODUCTION'}`);
    console.log(`\n👤 Demo Accounts:`);
    console.log(`   Admin  → admin@smartpowerhome.com / Admin123`);
    console.log(`   User   → user@smartpowerhome.com / User123`);
    console.log(`\n🔑 Device Registration Password: fakherk@2010\n`);
  });
});
