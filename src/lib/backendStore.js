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

const TWELVE_DEFAULT_DEVICES = [
  { name: 'LG Split AC (Dual Inverter)', type: 'AC', location: 'Living Room', imageIcon: 'fa-wind', customImage: '/preset_ac.jpg', powerRating: 1450, maxWorkingHours: 10, maxEnergyConsumption: 14.5, targetTemp: 22 },
  { name: 'Samsung Twin Cooling Refrigerator', type: 'Refrigerator', location: 'Kitchen', imageIcon: 'fa-snowflake', customImage: '/preset_fridge.jpg', powerRating: 350, maxWorkingHours: 24, maxEnergyConsumption: 8.4, targetTemp: 3 },
  { name: 'Ariston Pro1 Eco Water Heater', type: 'Water Heater', location: 'Bathroom', imageIcon: 'fa-faucet-drip', customImage: '/preset_heater.jpg', powerRating: 2000, maxWorkingHours: 4, maxEnergyConsumption: 8.0, targetTemp: 60 },
  { name: 'Sony Bravia 4K Smart TV', type: 'TV', location: 'Living Room', imageIcon: 'fa-tv', customImage: '/preset_tv.jpg', powerRating: 150, maxWorkingHours: 6, maxEnergyConsumption: 0.9, targetTemp: 24 },
  { name: 'Tesla Wall Connector EV Charger', type: 'EV Charger', location: 'Garage', imageIcon: 'fa-car-battery', customImage: '/preset_ev.jpg', powerRating: 7400, maxWorkingHours: 5, maxEnergyConsumption: 37.0, targetTemp: 25 },
  { name: 'Philips Hue Smart LED Bulb', type: 'Lighting', location: 'Bedroom', imageIcon: 'fa-lightbulb', customImage: '/preset_lamp.jpg', powerRating: 9, maxWorkingHours: 12, maxEnergyConsumption: 0.11, targetTemp: 25 },
  { name: 'Bosch Series 6 Washing Machine', type: 'Washer', location: 'Laundry Room', imageIcon: 'fa-shirt', customImage: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&auto=format&fit=crop&q=80', powerRating: 2200, maxWorkingHours: 2, maxEnergyConsumption: 4.4, targetTemp: 40 },
  { name: 'Dell OptiPlex Workstation PC', type: 'Computer', location: 'Home Office', imageIcon: 'fa-desktop', customImage: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400&auto=format&fit=crop&q=80', powerRating: 250, maxWorkingHours: 8, maxEnergyConsumption: 2.0, targetTemp: 35 },
  { name: 'Panasonic Inverter Microwave', type: 'Appliance', location: 'Kitchen', imageIcon: 'fa-fire-burner', customImage: '', powerRating: 1100, maxWorkingHours: 1, maxEnergyConsumption: 1.1, targetTemp: 180 },
  { name: 'DeLonghi Espresso Maker', type: 'Appliance', location: 'Kitchen', imageIcon: 'fa-mug-hot', customImage: '', powerRating: 1450, maxWorkingHours: 2, maxEnergyConsumption: 2.9, targetTemp: 92 },
  { name: 'Dyson Pure Cool Air Purifier', type: 'Appliance', location: 'Bedroom', imageIcon: 'fa-fan', customImage: '', powerRating: 40, maxWorkingHours: 12, maxEnergyConsumption: 0.48, targetTemp: 21 },
  { name: 'iRobot Roomba Robot Vacuum', type: 'Appliance', location: 'Living Room', imageIcon: 'fa-broom', customImage: '', powerRating: 35, maxWorkingHours: 3, maxEnergyConsumption: 0.1, targetTemp: 25 }
];

async function seedUserTwelveDevices(userId) {
  const created = [];
  for (const item of TWELVE_DEFAULT_DEVICES) {
    const dev = {
      id: nextId('device'),
      userId,
      name: item.name,
      type: item.type,
      location: item.location,
      imageIcon: item.imageIcon,
      customImage: item.customImage || '',
      customImageName: item.name,
      powerRating: item.powerRating,
      maxWorkingHours: item.maxWorkingHours,
      maxEnergyConsumption: item.maxEnergyConsumption,
      autoShutdown: false,
      targetTemp: item.targetTemp || 24,
      state: 0,
      currentWorkingHours: 0,
      currentConsumption: 0,
      todayConsumption: 0,
      monthlyConsumption: 0,
      createdAt: new Date().toISOString()
    };
    db.devices.push(dev);
    await supabaseClient.upsertRecord('devices', dev);
    created.push(dev);
  }
  return created;
}

module.exports = {
  db,
  initStore,
  refreshTable,
  seedUserTwelveDevices,
  verifyAuth,
  nextId,
  complaintId,
  JWT_SECRET,
  DEVICE_PASSWORD,
};
