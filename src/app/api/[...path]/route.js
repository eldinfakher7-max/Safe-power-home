import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, initStore, refreshTable, verifyAuth, nextId, complaintId, JWT_SECRET, DEVICE_PASSWORD } from '@/lib/backendStore';
import supabaseClient from '@/lib/supabase';

// Helper for JSON response with CORS headers
function jsonResponse(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function OPTIONS() {
  return jsonResponse({}, 200);
}

export async function GET(request, { params }) {
  await initStore();
  const pathSegments = (await params).path || [];
  const routePath = pathSegments.join('/');
  const authHeader = request.headers.get('authorization');
  const user = verifyAuth(authHeader);

  // 1. GET /api/devices
  if (routePath === 'devices') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    await refreshTable('devices');
    const devices = user.userType === 'Admin' ? db.devices : db.devices.filter(d => d.userId === user.id);
    return jsonResponse(devices);
  }

  // 2. GET /api/notifications
  if (routePath === 'notifications') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    await refreshTable('notifications');
    const userNotifs = user.userType === 'Admin' ? db.notifications : db.notifications.filter(n => n.userId === user.id);
    return jsonResponse(userNotifs.slice().reverse().slice(0, 50));
  }

  // 3. GET /api/alerts
  if (routePath === 'alerts') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    await refreshTable('alerts');
    const userAlerts = user.userType === 'Admin' ? db.alerts : db.alerts.filter(a => !a.userId || a.userId === user.id);
    return jsonResponse(userAlerts.slice().reverse());
  }

  // 4. GET /api/complaints
  if (routePath === 'complaints') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    await refreshTable('complaints');
    const list = user.userType === 'Admin' ? db.complaints : db.complaints.filter(c => c.userId === user.id);
    return jsonResponse(list.slice().reverse());
  }

  // 5. GET /api/complaints/:cid/messages
  if (pathSegments.length === 3 && pathSegments[0] === 'complaints' && pathSegments[2] === 'messages') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    const cid = pathSegments[1];
    const msgs = db.complaintMessages.filter(m => m.complaintId === cid);
    return jsonResponse(msgs);
  }

  // 6. GET /api/admin/requests
  if (routePath === 'admin/requests') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    const list = user.userType === 'Admin' ? db.authRequests : db.authRequests.filter(r => r.userId === user.id);
    return jsonResponse(list.slice().reverse());
  }

  // 7. GET /api/admin/users
  if (routePath === 'admin/users') {
    if (!user || user.userType !== 'Admin') return jsonResponse({ error: 'Admin only' }, 403);
    const safeUsers = db.users.map(({ password, ...u }) => u);
    return jsonResponse(safeUsers);
  }

  // 8. GET /api/settings
  if (routePath === 'settings') {
    if (!user || user.userType !== 'Admin') return jsonResponse({ error: 'Admin only' }, 403);
    return jsonResponse(db.settings);
  }

  // 9. GET /api/reports/list
  if (routePath === 'reports/list') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    const devices = user.userType === 'Admin' ? db.devices : db.devices.filter(d => d.userId === user.id);
    const highConsumers = devices.filter(d => d.currentConsumption > (d.maxEnergyConsumption || 10) * 0.7);
    const reports = [];
    if (highConsumers.length > 0) {
      reports.push({
        title: `⚡ High Consumption Alert — ${highConsumers.length} device(s)`,
        overload_risk: `${highConsumers.map(d => d.name).join(', ')} are approaching or exceeding consumption limits.`,
        fire_risk: highConsumers.some(d => d.powerRating > 2000) ? 'High-wattage devices running near limits increase fire risk.' : null,
        failure_risk: 'Continuous overloading may reduce device lifespan significantly.',
        recommendations: highConsumers.map(d => `• Reduce usage of ${d.name} (${(d.currentConsumption || 0).toFixed(2)} / ${d.maxEnergyConsumption} kWh)`).join('\n'),
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
    return jsonResponse(reports);
  }

  // 10. GET /api/history/logs
  if (routePath === 'history/logs') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    return jsonResponse(db.logs.slice().reverse().slice(0, 100));
  }

  return jsonResponse({ error: 'Route not found' }, 404);
}

export async function POST(request, { params }) {
  await initStore();
  const pathSegments = (await params).path || [];
  const routePath = pathSegments.join('/');
  const authHeader = request.headers.get('authorization');
  const user = verifyAuth(authHeader);

  let body = {};
  try {
    body = await request.json();
  } catch {}

  // 1. POST /api/auth/signup
  if (routePath === 'auth/signup') {
    await refreshTable('users');
    const { name, email, phone, password, userType, adminSecretKey } = body;
    if (!name || !email || !password) return jsonResponse({ error: 'Name, email, and password are required.' }, 400);
    if (userType === 'Admin' && adminSecretKey !== 'fakherkoky@2010') {
      return jsonResponse({ error: 'Incorrect Admin Secret Password.' }, 403);
    }
    
    const trimmedName = (name || '').trim();
    const trimmedEmail = (email || '').trim().toLowerCase();
    const cleanedPhone = (phone || '').replace(/\s+/g, '');

    if (db.users.some(u => (u.name || '').trim().toLowerCase() === trimmedName.toLowerCase())) {
      return jsonResponse({ error: 'Username / Full Name is already taken.' }, 409);
    }
    if (db.users.some(u => (u.email || '').trim().toLowerCase() === trimmedEmail)) {
      return jsonResponse({ error: 'Email address is already registered.' }, 409);
    }
    if (cleanedPhone && db.users.some(u => u.phone && u.phone.replace(/\s+/g, '') === cleanedPhone)) {
      return jsonResponse({ error: 'Phone number is already registered.' }, 409);
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = { id: nextId('user'), name: trimmedName, email: trimmedEmail, phone: phone || '', password: hashed, userType: userType || 'User', status: 'Active', createdAt: new Date().toISOString() };
    db.users.push(newUser);
    await supabaseClient.upsertRecord('users', newUser);
    return jsonResponse({ message: 'Account created successfully.' });
  }

  // 2. POST /api/auth/login
  if (routePath === 'auth/login') {
    await refreshTable('users');
    const { email, password } = body;
    const normalizedInput = (email || '').trim().toLowerCase();
    const existingUser = db.users.find(u => 
      u.email.toLowerCase() === normalizedInput || 
      (u.phone && u.phone.replace(/\s+/g, '') === normalizedInput.replace(/\s+/g, ''))
    );
    if (!existingUser) return jsonResponse({ error: 'Invalid email/phone or password.' }, 401);
    if (existingUser.status === 'Suspended') return jsonResponse({ error: 'Your account has been suspended. Contact administrator.' }, 403);
    const valid = await bcrypt.compare(password, existingUser.password);
    if (!valid) return jsonResponse({ error: 'Invalid email or password.' }, 401);
    const token = jwt.sign({ id: existingUser.id, email: existingUser.email, userType: existingUser.userType, name: existingUser.name }, JWT_SECRET, { expiresIn: '24h' });
    const { password: _, ...safeUser } = existingUser;
    return jsonResponse({ token, user: safeUser });
  }

  // 3. POST /api/devices
  if (routePath === 'devices') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    await refreshTable('devices');
    const { name, type, location, imageIcon, customImage, customImageName, powerRating, maxWorkingHours, maxEnergyConsumption, auth_password, autoShutdown, targetTemp } = body;
    if (!name || !type || !location) return jsonResponse({ error: 'Name, type, and location are required.' }, 400);
    if (auth_password !== DEVICE_PASSWORD) return jsonResponse({ error: 'Incorrect device registration password.' }, 403);

    const device = {
      id: nextId('device'),
      userId: user.id,
      name, type, location,
      imageIcon: imageIcon || 'fa-plug',
      customImage: customImage || '',
      customImageName: customImageName || '',
      powerRating: powerRating || 1000,
      maxWorkingHours: maxWorkingHours || 8,
      maxEnergyConsumption: maxEnergyConsumption || 10,
      autoShutdown: autoShutdown || false,
      targetTemp: targetTemp || 24,
      state: 0,
      currentWorkingHours: 0,
      currentConsumption: 0,
      todayConsumption: 0,
      monthlyConsumption: 0,
      createdAt: new Date().toISOString(),
    };
    db.devices.push(device);
    await supabaseClient.upsertRecord('devices', device);
    return jsonResponse(device);
  }

  // 4. POST /api/devices/:id/toggle
  if (pathSegments.length === 3 && pathSegments[0] === 'devices' && pathSegments[2] === 'toggle') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    await refreshTable('devices');
    const device = db.devices.find(d => d.id === pathSegments[1] && (user.userType === 'Admin' || d.userId === user.id));
    if (!device) return jsonResponse({ error: 'Device not found.' }, 404);
    const newState = body.state !== undefined ? body.state : (device.state === 1 ? 0 : 1);
    device.state = newState;
    await supabaseClient.upsertRecord('devices', device);
    return jsonResponse(device);
  }

  // 5. POST /api/devices/:id/restart
  if (pathSegments.length === 3 && pathSegments[0] === 'devices' && pathSegments[2] === 'restart') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    await refreshTable('devices');
    const device = db.devices.find(d => d.id === pathSegments[1] && (user.userType === 'Admin' || d.userId === user.id));
    if (!device) return jsonResponse({ error: 'Device not found.' }, 404);
    device.currentWorkingHours = 0;
    device.currentConsumption = 0;
    device.todayConsumption = 0;
    await supabaseClient.upsertRecord('devices', device);
    return jsonResponse({ message: 'Counters reset' });
  }

  // 6. POST /api/notifications/read-all
  if (routePath === 'notifications/read-all') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    db.notifications.forEach(n => {
      if (n.userId === user.id || user.userType === 'Admin') n.status = 'Read';
    });
    return jsonResponse({ message: 'Marked all as read' });
  }

  // 7. POST /api/complaints
  if (routePath === 'complaints') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    const { name, email, phone, address, deviceName, deviceType, category, priority, subject, description } = body;
    if (!subject || !description) return jsonResponse({ error: 'Subject and description required.' }, 400);
    const complaint = {
      id: nextId('complaint'),
      complaintId: complaintId(),
      userId: user.id,
      name: name || user.name,
      email: email || user.email,
      phone: phone || '',
      address: address || '',
      deviceName: deviceName || '',
      deviceType: deviceType || '',
      category: category || 'Other',
      priority: priority || 'Medium',
      subject, description,
      status: 'Open',
      adminReply: '',
      createdAt: new Date().toISOString(),
    };
    db.complaints.push(complaint);
    await supabaseClient.upsertRecord('complaints', complaint);
    return jsonResponse(complaint);
  }

  // 8. POST /api/complaints/:cid/messages
  if (pathSegments.length === 3 && pathSegments[0] === 'complaints' && pathSegments[2] === 'messages') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    const cid = pathSegments[1];
    const { message } = body;
    if (!message) return jsonResponse({ error: 'Message required' }, 400);
    const msg = {
      id: Date.now().toString(),
      complaintId: cid,
      senderId: user.id,
      senderName: user.name,
      senderType: user.userType,
      message,
      timestamp: new Date().toISOString(),
    };
    db.complaintMessages.push(msg);
    await supabaseClient.upsertRecord('complaint_messages', msg);
    return jsonResponse(msg);
  }

  // 9. POST /api/admin/requests
  if (routePath === 'admin/requests') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    const { userName, email, deviceName, reason, message } = body;
    const req_obj = {
      id: nextId('authReq'),
      userId: user.id,
      userName: userName || user.name,
      email: email || user.email,
      deviceName: deviceName || 'Unknown',
      reason: reason || 'New Device Installation',
      message: message || '',
      status: 'Pending',
      adminNotes: '',
      date: new Date().toISOString(),
    };
    db.authRequests.push(req_obj);
    await supabaseClient.upsertRecord('auth_requests', req_obj);
    return jsonResponse(req_obj);
  }

  // 10. POST /api/admin/requests/:id/action
  if (pathSegments.length === 4 && pathSegments[0] === 'admin' && pathSegments[1] === 'requests' && pathSegments[3] === 'action') {
    if (!user || user.userType !== 'Admin') return jsonResponse({ error: 'Admin only' }, 403);
    const reqItem = db.authRequests.find(r => r.id === pathSegments[2]);
    if (!reqItem) return jsonResponse({ error: 'Request not found' }, 404);
    reqItem.status = body.status;
    reqItem.adminNotes = body.admin_notes || '';
    await supabaseClient.upsertRecord('auth_requests', reqItem);
    return jsonResponse(reqItem);
  }

  // 11. POST /api/admin/users/:id/status
  if (pathSegments.length === 4 && pathSegments[0] === 'admin' && pathSegments[1] === 'users' && pathSegments[3] === 'status') {
    if (!user || user.userType !== 'Admin') return jsonResponse({ error: 'Admin only' }, 403);
    const targetUser = db.users.find(u => u.id === pathSegments[2]);
    if (!targetUser) return jsonResponse({ error: 'User not found' }, 404);
    targetUser.status = body.status;
    await supabaseClient.upsertRecord('users', targetUser);
    return jsonResponse({ message: 'Status updated' });
  }

  // 12. POST /api/settings
  if (routePath === 'settings') {
    if (!user || user.userType !== 'Admin') return jsonResponse({ error: 'Admin only' }, 403);
    db.settings = { ...db.settings, ...body };
    for (const [key, value] of Object.entries(db.settings)) {
      await supabaseClient.upsertRecord('settings', { key, value });
    }
    return jsonResponse(db.settings);
  }

  return jsonResponse({ error: 'Route not found' }, 404);
}

export async function PUT(request, { params }) {
  await initStore();
  const pathSegments = (await params).path || [];
  const routePath = pathSegments.join('/');
  const authHeader = request.headers.get('authorization');
  const user = verifyAuth(authHeader);

  let body = {};
  try {
    body = await request.json();
  } catch {}

  // 1. PUT /api/devices/:id
  if (pathSegments.length === 2 && pathSegments[0] === 'devices') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    await refreshTable('devices');
    const device = db.devices.find(d => d.id === pathSegments[1] && (user.userType === 'Admin' || d.userId === user.id));
    if (!device) return jsonResponse({ error: 'Device not found' }, 404);
    const { name, type, location, power_rating, max_working_hours, max_energy_consumption, imageIcon, customImage, customImageName, autoShutdown, currentWorkingHours, currentConsumption, targetTemp } = body;
    if (name) device.name = name;
    if (type) device.type = type;
    if (location) device.location = location;
    if (power_rating) device.powerRating = power_rating;
    if (max_working_hours !== undefined) device.maxWorkingHours = max_working_hours;
    if (max_energy_consumption !== undefined) device.maxEnergyConsumption = max_energy_consumption;
    if (imageIcon) device.imageIcon = imageIcon;
    if (customImage !== undefined) device.customImage = customImage;
    if (customImageName !== undefined) device.customImageName = customImageName;
    if (autoShutdown !== undefined) device.autoShutdown = autoShutdown;
    if (currentWorkingHours !== undefined) device.currentWorkingHours = currentWorkingHours;
    if (currentConsumption !== undefined) device.currentConsumption = currentConsumption;
    if (targetTemp !== undefined) device.targetTemp = targetTemp;
    await supabaseClient.upsertRecord('devices', device);
    return jsonResponse(device);
  }

  // 2. PUT /api/alerts/:id/resolve
  if (pathSegments.length === 3 && pathSegments[0] === 'alerts' && pathSegments[2] === 'resolve') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    await refreshTable('alerts');
    const alert = db.alerts.find(a => a.id === pathSegments[1]);
    if (!alert) return jsonResponse({ error: 'Alert not found' }, 404);
    alert.status = 'Resolved';
    await supabaseClient.upsertRecord('alerts', alert);
    return jsonResponse(alert);
  }

  // 3. PUT /api/complaints/:cid
  if (pathSegments.length === 2 && pathSegments[0] === 'complaints') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    await refreshTable('complaints');
    const complaint = db.complaints.find(c => c.complaintId === pathSegments[1]);
    if (!complaint) return jsonResponse({ error: 'Complaint not found' }, 404);
    if (body.status) complaint.status = body.status;
    if (body.admin_reply) complaint.adminReply = body.admin_reply;
    await supabaseClient.upsertRecord('complaints', complaint);
    return jsonResponse(complaint);
  }

  // 4. PUT /api/profile/update
  if (routePath === 'profile/update') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    await refreshTable('users');
    const existingUser = db.users.find(u => u.id === user.id);
    if (!existingUser) return jsonResponse({ error: 'User not found' }, 404);
    if (body.name) existingUser.name = body.name;
    if (body.phone) existingUser.phone = body.phone;
    if (body.password) existingUser.password = await bcrypt.hash(body.password, 10);
    await supabaseClient.upsertRecord('users', existingUser);
    const { password: _, ...safe } = existingUser;
    return jsonResponse(safe);
  }

  return jsonResponse({ error: 'Route not found' }, 404);
}

export async function DELETE(request, { params }) {
  await initStore();
  const pathSegments = (await params).path || [];
  const authHeader = request.headers.get('authorization');
  const user = verifyAuth(authHeader);

  // 1. DELETE /api/devices/:id
  if (pathSegments.length === 2 && pathSegments[0] === 'devices') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);
    await refreshTable('devices');
    const idx = db.devices.findIndex(d => d.id === pathSegments[1] && (user.userType === 'Admin' || d.userId === user.id));
    if (idx === -1) return jsonResponse({ error: 'Device not found' }, 404);
    db.devices.splice(idx, 1);
    await supabaseClient.deleteRecord('devices', 'id', pathSegments[1]);
    return jsonResponse({ message: 'Device removed' });
  }

  // 2. DELETE /api/complaints/:cid
  if (pathSegments.length === 2 && pathSegments[0] === 'complaints') {
    if (!user || user.userType !== 'Admin') return jsonResponse({ error: 'Admin only' }, 403);
    await refreshTable('complaints');
    const idx = db.complaints.findIndex(c => c.complaintId === pathSegments[1]);
    if (idx === -1) return jsonResponse({ error: 'Complaint not found' }, 404);
    db.complaints.splice(idx, 1);
    await supabaseClient.deleteRecord('complaints', 'complaintId', pathSegments[1]);
    return jsonResponse({ message: 'Complaint deleted' });
  }

  // 3. DELETE /api/admin/users/:id
  if (pathSegments.length === 3 && pathSegments[0] === 'admin' && pathSegments[1] === 'users') {
    if (!user || user.userType !== 'Admin') return jsonResponse({ error: 'Admin only' }, 403);
    const idx = db.users.findIndex(u => u.id === pathSegments[2]);
    if (idx === -1) return jsonResponse({ error: 'User not found' }, 404);
    db.users.splice(idx, 1);
    await supabaseClient.deleteRecord('users', 'id', pathSegments[2]);
    return jsonResponse({ message: 'User deleted' });
  }

  return jsonResponse({ error: 'Route not found' }, 404);
}
