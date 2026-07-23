const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabaseClient = require('./supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'smart_power_secret_key_9876';
const DEVICE_PASSWORD = 'fakherkoky@2010';

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

let initialized = false;
let idCounters = { user: 1, device: 1, alert: 1, complaint: 1, authReq: 1, notif: 1 };

const tableMap = {
  users: 'user',
  devices: 'device',
  alerts: 'alert',
  complaints: 'complaint',
  auth_requests: 'authReq',
  notifications: 'notif'
};

function updateCounter(list, key) {
  if (list && list.length > 0) {
    const ids = list.map(item => {
      const m = (item.id || '').match(/\d+/);
      return m ? parseInt(m[0]) : 0;
    });
    idCounters[key] = Math.max(0, ...ids) + 1;
  }
}

async function refreshTable(tableName) {
  if (!supabaseClient.isConfigured()) return;
  try {
    const listName = tableName === 'auth_requests' ? 'authRequests' : (tableName === 'complaint_messages' ? 'complaintMessages' : tableName);
    const data = await supabaseClient.fetchTable(tableName);
    if (data) {
      db[listName] = data;
      const key = tableMap[tableName];
      if (key) {
        updateCounter(data, key);
      }
    }
  } catch (err) {
    console.error(`Error refreshing ${tableName}:`, err.message);
  }
}

function nextId(type) {
  return `${type}_${idCounters[type]++}`;
}

function complaintId() {
  return 'TKT-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

async function initStore() {
  if (initialized) return;
  initialized = true;

  // Sync with Supabase if configured
  if (supabaseClient.isConfigured()) {
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
      updateCounter(db.users, 'user');
      updateCounter(db.devices, 'device');
      updateCounter(db.alerts, 'alert');
      updateCounter(db.complaints, 'complaint');
      updateCounter(db.authRequests, 'authReq');
      updateCounter(db.notifications, 'notif');
    } catch (err) {
      console.error('Supabase sync error:', err.message);
    }
  }

  // Seed default admin and user if not exists
  if (!db.users.find(u => u.email === 'admin@smartpowerhome.com')) {
    const admin = {
      id: nextId('user'),
      name: 'System Administrator',
      email: 'admin@smartpowerhome.com',
      phone: '+966500000000',
      password: await bcrypt.hash('Admin123', 10),
      userType: 'Admin',
      status: 'Active',
      createdAt: new Date().toISOString(),
    };
    db.users.push(admin);
    await supabaseClient.upsertRecord('users', admin);
  }

  if (!db.users.find(u => u.email === 'user@smartpowerhome.com')) {
    const demoUser = {
      id: nextId('user'),
      name: 'Demo User',
      email: 'user@smartpowerhome.com',
      phone: '+966511111111',
      password: await bcrypt.hash('User123', 10),
      userType: 'User',
      status: 'Active',
      createdAt: new Date().toISOString(),
    };
    db.users.push(demoUser);
    await supabaseClient.upsertRecord('users', demoUser);
  }

  // Default settings
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

function verifyAuth(authHeader) {
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

module.exports = {
  db,
  initStore,
  refreshTable,
  verifyAuth,
  nextId,
  complaintId,
  JWT_SECRET,
  DEVICE_PASSWORD,
};
