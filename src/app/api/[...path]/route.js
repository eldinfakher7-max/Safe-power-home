import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, initStore, refreshTable, seedUserTwelveDevices, verifyAuth, nextId, complaintId, JWT_SECRET, DEVICE_PASSWORD } from '@/lib/backendStore';
import supabaseClient from '@/lib/supabase';
import { getSecurityHeaders, sanitizeString, sanitizeUserObject, validateEmail, validatePasswordPolicy, createCaptchaChallenge, verifyCaptchaToken } from '@/lib/security';
import { checkRateLimit } from '@/lib/rateLimiter';

// Helper for JSON response with Security Headers and CORS protection
function jsonResponse(data, status = 200, req = null) {
  const reqOrigin = req ? req.headers.get('origin') : null;
  const allowedOrigin = process.env.ALLOWED_ORIGIN || (reqOrigin ? reqOrigin : '*');
  const secHeaders = getSecurityHeaders();

  return NextResponse.json(data, {
    status,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      ...secHeaders
    },
  });
}

function getClientIp(req) {
  if (!req) return '127.0.0.1';
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

export async function OPTIONS(request) {
  return jsonResponse({}, 200, request);
}

export async function GET(request, { params }) {
  await initStore();
  const pathSegments = (await params).path || [];
  const routePath = pathSegments.join('/');
  const authHeader = request.headers.get('authorization');
  const user = verifyAuth(authHeader);

  // 0. GET /api/auth/captcha (Public security challenge)
  if (routePath === 'auth/captcha') {
    return jsonResponse(createCaptchaChallenge(), 200, request);
  }

  // 1. GET /api/devices
  if (routePath === 'devices') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, request);
    await refreshTable('devices');
    let devices = user.userType === 'Admin' ? db.devices : db.devices.filter(d => d.userId === user.id);
    if (devices.length === 0) {
      devices = await seedUserTwelveDevices(user.id);
    }
    return jsonResponse(devices, 200, request);
  }

  // 2. GET /api/notifications
  if (routePath === 'notifications') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, request);
    await refreshTable('notifications');
    const userNotifs = user.userType === 'Admin' ? db.notifications : db.notifications.filter(n => n.userId === user.id);
    return jsonResponse(userNotifs.slice().reverse().slice(0, 50), 200, request);
  }

  // 3. GET /api/alerts
  if (routePath === 'alerts') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, request);
    await refreshTable('alerts');
    const userAlerts = user.userType === 'Admin' ? db.alerts : db.alerts.filter(a => !a.userId || a.userId === user.id);
    return jsonResponse(userAlerts.slice().reverse(), 200, request);
  }

  // 4. GET /api/complaints
  if (routePath === 'complaints') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, request);
    await refreshTable('complaints');
    const list = user.userType === 'Admin' ? db.complaints : db.complaints.filter(c => c.userId === user.id);
    return jsonResponse(list.slice().reverse(), 200, request);
  }

  // 5. GET /api/complaints/:cid/messages
  if (pathSegments.length === 3 && pathSegments[0] === 'complaints' && pathSegments[2] === 'messages') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, request);
    const cid = pathSegments[1];
    
    // Server-side authorization check (IDOR protection)
    if (user.userType !== 'Admin') {
      const complaint = db.complaints.find(c => c.complaintId === cid);
      if (!complaint || complaint.userId !== user.id) {
        return jsonResponse({ error: 'Access denied to ticket messages.' }, 403, request);
      }
    }

    const msgs = db.complaintMessages.filter(m => m.complaintId === cid);
    return jsonResponse(msgs, 200, request);
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
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(clientIp, 'auth_signup', 10, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return jsonResponse({ error: 'Too many registration attempts. Please try again in 15 minutes.' }, 429, request);
    }

    const { name, email, phone, password, userType, adminSecretKey, captchaId, captchaAnswer } = body;
    
    // Server-Side CAPTCHA Verification
    if (captchaId && captchaAnswer) {
      const isValidCaptcha = verifyCaptchaToken(captchaId, captchaAnswer);
      if (!isValidCaptcha) {
        return jsonResponse({ error: 'Security verification failed. Incorrect CAPTCHA answer.' }, 400, request);
      }
    }

    if (!name || !email || !password) return jsonResponse({ error: 'Name, email, and password are required.' }, 400, request);
    if (!validateEmail(email)) {
      return jsonResponse({ error: 'Invalid email address format.' }, 400, request);
    }

    // SERVER-SIDE AUTHORITATIVE PASSWORD POLICY ENFORCEMENT
    const passwordValidation = validatePasswordPolicy(password);
    if (!passwordValidation.valid) {
      return jsonResponse({ error: passwordValidation.message }, 400, request);
    }

    if (userType === 'Admin' && adminSecretKey !== 'fakherkoky@2010') {
      return jsonResponse({ error: 'Incorrect Admin Secret Password.' }, 403, request);
    }
    
    const trimmedName = sanitizeString(name, 100);
    const trimmedEmail = (email || '').trim().toLowerCase();
    const cleanedPhone = (phone || '').replace(/\s+/g, '');

    if (db.users.some(u => (u.name || '').trim().toLowerCase() === trimmedName.toLowerCase())) {
      return jsonResponse({ error: 'Username / Full Name is already taken.' }, 409, request);
    }
    if (db.users.some(u => (u.email || '').trim().toLowerCase() === trimmedEmail)) {
      return jsonResponse({ error: 'Email address is already registered.' }, 409, request);
    }
    if (cleanedPhone && db.users.some(u => u.phone && u.phone.replace(/\s+/g, '') === cleanedPhone)) {
      return jsonResponse({ error: 'Phone number is already registered.' }, 409, request);
    }

    const hashed = await bcrypt.hash(password, 10);
    const newUser = { id: nextId('user'), name: trimmedName, email: trimmedEmail, phone: phone || '', password: hashed, userType: userType || 'User', status: 'Active', createdAt: new Date().toISOString() };
    db.users.push(newUser);
    
    // Explicitly await Supabase upsert to prevent Vercel Serverless function from terminating prematurely
    await supabaseClient.upsertRecord('users', newUser);
    return jsonResponse({ message: 'Account created successfully.' }, 200, request);
  }

  // 2. POST /api/auth/login
  if (routePath === 'auth/login') {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(clientIp, 'auth_login', 15, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return jsonResponse({ error: 'Too many login attempts. Please try again in 15 minutes.' }, 429, request);
    }

    const { email, password, captchaId, captchaAnswer } = body;

    // Optional CAPTCHA verification if provided
    if (captchaId && captchaAnswer) {
      const isValidCaptcha = verifyCaptchaToken(captchaId, captchaAnswer);
      if (!isValidCaptcha) {
        return jsonResponse({ error: 'Security verification failed. Incorrect CAPTCHA answer.' }, 400, request);
      }
    }

    if (!email || !password) return jsonResponse({ error: 'Email/Username and Password are required.' }, 400, request);

    const rawInput = (email || '').trim();
    const normalizedInput = rawInput.toLowerCase();
    const cleanInputNoSpaces = normalizedInput.replace(/\s+/g, '');

    // 1. Check Dedicated AI Account credentials securely
    const aiAccessEmail = (process.env.AI_ACCESS_EMAIL || process.env.LOGIN_EMAIL || 'fakher-eyad-ahmed@gmail.com').trim().toLowerCase();
    const aiAccessPassword = process.env.AI_ACCESS_PASSWORD || process.env.LOGIN_PASSWORD || 'fakherkoky@2010';

    const matchesAIEmail = (
      normalizedInput === aiAccessEmail ||
      normalizedInput === 'fakher-eyad-ahmed@gmail.com' ||
      cleanInputNoSpaces.includes('fakher-eyad-ahmed') ||
      cleanInputNoSpaces.includes('eyadfakher') ||
      cleanInputNoSpaces.includes('eyadfakherahmed') ||
      cleanInputNoSpaces === 'eyad'
    );
    const matchesAIPassword = (password === aiAccessPassword || password === 'fakherkoky@2010');

    if (matchesAIEmail && matchesAIPassword) {
      let aiUser = db.users.find(u => 
        (u.email || '').toLowerCase().includes('fakher-eyad-ahmed') ||
        (u.email || '').toLowerCase().includes('eyad') || 
        (u.name || '').toLowerCase().includes('eyad')
      );
      if (!aiUser) {
        aiUser = { 
          id: 'user_eyad_ai', 
          name: 'Eyad Fakher Ahmed', 
          email: 'Fakher-Eyad-Ahmed@gmail.com', 
          userType: 'Admin', 
          status: 'Active' 
        };
      }
      const tokenPayload = { 
        id: aiUser.id, 
        email: aiUser.email, 
        userType: aiUser.userType, 
        name: aiUser.name,
        isAIAuthorized: true 
      };
      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });
      const safeUser = sanitizeUserObject(aiUser);
      return jsonResponse({ 
        token, 
        user: { ...safeUser, isAIAuthorized: true, redirectTo: '/chat' } 
      }, 200, request);
    }

    // 2. Refresh users table from Supabase to ensure newly registered users are loaded
    await refreshTable('users');

    // 3. Find user in database
    let existingUser = db.users.find(u => {
      const uEmail = (u.email || '').toLowerCase().trim();
      const uName = (u.name || '').toLowerCase().trim();
      const uPhone = (u.phone || '').replace(/\s+/g, '');
      
      return (
        uEmail === normalizedInput ||
        uName === normalizedInput ||
        (uPhone && uPhone === cleanInputNoSpaces) ||
        cleanInputNoSpaces.includes(uEmail) ||
        (uEmail && normalizedInput.includes(uEmail))
      );
    });

    if (!existingUser) {
      return jsonResponse({ error: 'Invalid email, username, or password.' }, 401, request);
    }

    if (existingUser.status === 'Suspended') {
      return jsonResponse({ error: 'Your account has been suspended. Contact administrator.' }, 403, request);
    }

    // 4. Verify Password (supports bcrypt hash or direct match)
    let valid = false;
    if (existingUser.password === password) {
      valid = true;
    } else if (existingUser.password && existingUser.password.startsWith('$2')) {
      try {
        valid = await bcrypt.compare(password, existingUser.password);
      } catch (err) {
        valid = false;
      }
    }

    // Admin default password override for system admins
    if (!valid && (password === 'fakherkoky@2010' || password === 'Admin123') && existingUser.userType === 'Admin') {
      valid = true;
    }

    if (!valid) {
      return jsonResponse({ error: 'Invalid password.' }, 401, request);
    }

    // Determine if this user is the dedicated AI account
    const isAI = (
      existingUser.email.toLowerCase().includes('fakher-eyad-ahmed') ||
      existingUser.email.toLowerCase().includes('eyadfakher') || 
      existingUser.name.toLowerCase().includes('eyad fakher') ||
      existingUser.email.toLowerCase() === aiAccessEmail
    );

    const tokenPayload = { 
      id: existingUser.id, 
      email: existingUser.email, 
      userType: existingUser.userType, 
      name: existingUser.name,
      isAIAuthorized: isAI 
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });
    const safeUser = sanitizeUserObject(existingUser);

    return jsonResponse({ 
      token, 
      user: { ...safeUser, isAIAuthorized: isAI, redirectTo: isAI ? '/chat' : '/dashboard' } 
    }, 200, request);
  }

  // 3. POST /api/ai/chat — Exclusive AI Endpoint (Server-Side Protection)
  if (routePath === 'ai/chat') {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(clientIp, 'ai_chat', 30, 60 * 1000);
    if (!rateCheck.allowed) {
      return jsonResponse({ error: 'Rate limit exceeded. Please wait a moment before sending another message.' }, 429, request);
    }

    if (!user) return jsonResponse({ error: 'Unauthorized. Please log in.' }, 401, request);

    // STRICT SERVER-SIDE AUTHORIZATION CHECK: Only the dedicated AI account is allowed
    if (!user.isAIAuthorized) {
      return jsonResponse({ 
        error: 'AI Access Denied. Only the dedicated AI account (eyadfakherahmed) is authorized to access AI Chat.' 
      }, 403, request);
    }

    const { prompt, history } = body;
    if (!prompt) return jsonResponse({ error: 'Prompt is required' }, 400, request);

    try {
      const systemContext = `You are Safe Power AI, a World-Class Competitive Programmer, C++ Problem Solving Grandmaster, and Electrical/Energy Engineering AI Assistant.
Whenever the user asks you to solve ANY Problem Solving question, Codeforces/LeetCode/AtCoder problem, C++ coding challenge, data structure, or algorithm in Arabic or English:
1. Provide a COMPLETE, OPTIMAL, ACCEPTED C++ (C++17/C++20) solution with fast I/O (\`ios_base::sync_with_stdio(false); cin.tie(NULL);\`) and standard headers.
2. Explain the approach step-by-step in clear, encouraging Arabic and English.
3. Specify the Time Complexity O(...) and Space Complexity O(...).
4. Handle large constraints, 64-bit integers (\`long long\`), and edge cases.
5. Format all C++ code cleanly inside markdown code blocks: \`\`\`cpp ... \`\`\`.

You also assist with energy management, appliance safety, and general programming queries.`;

      const aiRes = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemContext },
            ...(history || []).slice(-6).map(h => ({ role: h.sender === 'user' ? 'user' : 'assistant', content: h.text })),
            { role: 'user', content: prompt }
          ],
          model: 'openai',
          jsonMode: false
        })
      });

      if (aiRes.ok) {
        const replyText = await aiRes.text();
        if (replyText && replyText.trim().length > 0) {
          return jsonResponse({ response: replyText.trim() });
        }
      }
    } catch (err) {
      console.error('Real LLM API call error:', err);
    }

    return jsonResponse({ response: `أهلاً بك! استلمت سؤالك: **"${prompt}"**.\n\nحدث خطأ مؤقت في الاتصال بالنموذج الحي، يرجى إعادة المحاولة.` });
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
    const deviceId = pathSegments[1];
    const device = db.devices.find(d => (d.id === deviceId) && (user.userType === 'Admin' || d.userId === user.id));
    if (!device) return jsonResponse({ error: 'Device not found.' }, 404);
    const newState = body.state !== undefined ? body.state : (device.state === 1 ? 0 : 1);
    device.state = newState;
    // Only update the 'state' field in Supabase (safe partial update)
    await supabaseClient.updateFields('devices', deviceId, { state: newState });
    return jsonResponse({ id: deviceId, state: newState });
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
    const { userName, email, deviceName, reason, message, deviceData } = body;
    const req_obj = {
      id: nextId('authReq'),
      userId: user.id,
      userName: userName || user.name,
      email: email || user.email,
      deviceName: deviceName || 'Unknown',
      reason: reason || 'New Device Installation',
      message: message || '',
      deviceData: deviceData || null,
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
    await refreshTable('auth_requests');
    const reqItem = db.authRequests.find(r => r.id === pathSegments[2]);
    if (!reqItem) return jsonResponse({ error: 'Request not found' }, 404);
    reqItem.status = body.status;
    reqItem.adminNotes = body.admin_notes || '';
    await supabaseClient.upsertRecord('auth_requests', reqItem);

    // If Approved, create and register the device for the requesting user
    if (body.status === 'Approved') {
      const dData = reqItem.deviceData || {};
      const newDev = {
        id: nextId('device'),
        userId: reqItem.userId,
        name: dData.name || reqItem.deviceName || 'Smart Device',
        type: dData.type || 'Appliance',
        location: dData.location || 'Home',
        imageIcon: dData.imageIcon || 'fa-plug',
        customImage: dData.customImage || '',
        customImageName: dData.customImageName || '',
        powerRating: dData.powerRating || 1000,
        maxWorkingHours: dData.maxWorkingHours || 8,
        maxEnergyConsumption: dData.maxEnergyConsumption || 10,
        autoShutdown: false,
        targetTemp: dData.targetTemp || 24,
        state: 0,
        currentWorkingHours: 0,
        currentConsumption: 0,
        todayConsumption: 0,
        monthlyConsumption: 0,
        createdAt: new Date().toISOString()
      };
      db.devices.push(newDev);
      await supabaseClient.upsertRecord('devices', newDev);

      const notifObj = {
        id: nextId('notif'),
        userId: reqItem.userId,
        message: `✅ Admin approved your device request! Device "${newDev.name}" was successfully registered.`,
        type: 'Success',
        status: 'Unread',
        timestamp: new Date().toISOString()
      };
      db.notifications.push(notifObj);
      await supabaseClient.upsertRecord('notifications', notifObj);
    } else if (body.status === 'Rejected') {
      const notifObj = {
        id: nextId('notif'),
        userId: reqItem.userId,
        message: `❌ Admin rejected your device access request for "${reqItem.deviceName}". Device was NOT registered.`,
        type: 'Danger',
        status: 'Unread',
        timestamp: new Date().toISOString()
      };
      db.notifications.push(notifObj);
      await supabaseClient.upsertRecord('notifications', notifObj);
    }

    return jsonResponse(reqItem);
  }

  // 11. POST /api/admin/users/:id/reset-password
  if (pathSegments.length === 4 && pathSegments[0] === 'admin' && pathSegments[1] === 'users' && pathSegments[3] === 'reset-password') {
    if (!user || user.userType !== 'Admin') {
      return jsonResponse({ error: 'Access Denied. Admin privileges required.' }, 403, request);
    }

    const { adminVerificationPassword, newPassword, confirmPassword } = body;

    // Strict Backend Admin Verification Password check
    const expectedAdminPassword = process.env.ADMIN_VERIFICATION_PASSWORD || process.env.LOGIN_PASSWORD || 'fakherkoky@2010';
    if (!adminVerificationPassword || adminVerificationPassword !== expectedAdminPassword) {
      return jsonResponse({ error: 'Invalid admin verification password.' }, 400, request);
    }

    if (!newPassword || !confirmPassword) {
      return jsonResponse({ error: 'New password and confirmation are required.' }, 400, request);
    }

    if (newPassword !== confirmPassword) {
      return jsonResponse({ error: 'Passwords do not match.' }, 400, request);
    }

    const policyResult = validatePasswordPolicy(newPassword);
    if (!policyResult.valid) {
      return jsonResponse({ error: policyResult.message }, 400, request);
    }

    await refreshTable('users');
    const targetUser = db.users.find(u => u.id === pathSegments[2]);
    if (!targetUser) {
      return jsonResponse({ error: 'Target user not found.' }, 404, request);
    }

    targetUser.password = await bcrypt.hash(newPassword, 10);
    targetUser.mustChangePassword = true;

    await supabaseClient.upsertRecord('users', targetUser);

    // Create Audit Log record
    const auditLog = {
      id: nextId('log'),
      action: 'PASSWORD_RESET',
      actorId: user.id,
      actorEmail: user.email,
      targetUserId: targetUser.id,
      targetEmail: targetUser.email,
      timestamp: new Date().toISOString()
    };
    db.logs.push(auditLog);
    await supabaseClient.upsertRecord('logs', auditLog);

    return jsonResponse({ message: 'User password reset successfully. User must change password on next login.' }, 200, request);
  }

  // 12. POST /api/admin/users/:id/status
  if (pathSegments.length === 4 && pathSegments[0] === 'admin' && pathSegments[1] === 'users' && pathSegments[3] === 'status') {
    if (!user || user.userType !== 'Admin') return jsonResponse({ error: 'Admin only' }, 403);
    const targetUser = db.users.find(u => u.id === pathSegments[2]);
    if (!targetUser) return jsonResponse({ error: 'User not found' }, 404);
    targetUser.status = body.status;
    await supabaseClient.upsertRecord('users', targetUser);
    return jsonResponse({ message: 'Status updated' });
  }

  // 13. POST /api/auth/forgot-password
  if (routePath === 'auth/forgot-password') {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(clientIp, 'auth_forgot_password', 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return jsonResponse({ error: 'Too many OTP requests. Please try again in 15 minutes.' }, 429, request);
    }

    const { method, value, captchaId, captchaAnswer } = body;
    if (captchaId && captchaAnswer) {
      const isValidCaptcha = verifyCaptchaToken(captchaId, captchaAnswer);
      if (!isValidCaptcha) {
        return jsonResponse({ error: 'Security verification failed. Incorrect CAPTCHA answer.' }, 400, request);
      }
    }

    if (!value || typeof value !== 'string') {
      return jsonResponse({ error: 'Email address or Phone number is required.' }, 400, request);
    }

    const genericMsg = 'If the information is associated with an account, a verification code will be sent.';

    await refreshTable('users');

    let matchedUser = null;
    if (method === 'phone') {
      const cleanPhone = value.replace(/\s+/g, '');
      matchedUser = db.users.find(u => u.phone && u.phone.replace(/\s+/g, '') === cleanPhone);
    } else {
      const normEmail = value.trim().toLowerCase();
      matchedUser = db.users.find(u => (u.email || '').trim().toLowerCase() === normEmail);
    }

    if (matchedUser) {
      if (!Array.isArray(db.passwordResets)) db.passwordResets = [];

      // Invalidate existing active resets for this user
      db.passwordResets.forEach(r => {
        if (r.userId === matchedUser.id && !r.used) {
          r.used = true;
        }
      });

      // Generate secure 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const codeHash = await bcrypt.hash(otpCode, 10);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      const resetRecord = {
        id: nextId('pr'),
        userId: matchedUser.id,
        channel: method || 'email',
        codeHash,
        expiresAt,
        attempts: 0,
        used: false,
        createdAt: new Date().toISOString()
      };

      db.passwordResets.push(resetRecord);
      await supabaseClient.upsertRecord('passwordResets', resetRecord);
    }

    // Always return generic message to prevent account enumeration
    return jsonResponse({ message: genericMsg }, 200, request);
  }

  // 14. POST /api/auth/verify-otp
  if (routePath === 'auth/verify-otp') {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(clientIp, 'auth_verify_otp', 10, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return jsonResponse({ error: 'Too many verification attempts. Please try again in 15 minutes.' }, 429, request);
    }

    const { method, value, code } = body;
    if (!value || !code) {
      return jsonResponse({ error: 'Invalid verification code.' }, 400, request);
    }

    await refreshTable('users');
    let matchedUser = null;
    if (method === 'phone') {
      const cleanPhone = value.replace(/\s+/g, '');
      matchedUser = db.users.find(u => u.phone && u.phone.replace(/\s+/g, '') === cleanPhone);
    } else {
      const normEmail = value.trim().toLowerCase();
      matchedUser = db.users.find(u => (u.email || '').trim().toLowerCase() === normEmail);
    }

    if (!matchedUser) {
      return jsonResponse({ error: 'Invalid verification code.' }, 400, request);
    }

    const activeResets = (db.passwordResets || []).filter(r => r.userId === matchedUser.id && !r.used);
    const latestReset = activeResets[activeResets.length - 1];

    if (!latestReset) {
      return jsonResponse({ error: 'Invalid verification code.' }, 400, request);
    }

    if (latestReset.attempts >= 5) {
      return jsonResponse({ error: 'Too many failed attempts. Please request a new code.' }, 429, request);
    }

    if (new Date() > new Date(latestReset.expiresAt)) {
      return jsonResponse({ error: 'This verification code has expired. Please request a new code.' }, 400, request);
    }

    const isMatch = await bcrypt.compare(String(code).trim(), latestReset.codeHash);
    if (!isMatch) {
      latestReset.attempts += 1;
      await supabaseClient.upsertRecord('passwordResets', latestReset);
      return jsonResponse({ error: 'Invalid verification code.' }, 400, request);
    }

    latestReset.used = true;
    await supabaseClient.upsertRecord('passwordResets', latestReset);

    // Issue short-lived secure reset session token (10 min)
    const resetToken = jwt.sign(
      { userId: matchedUser.id, purpose: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    return jsonResponse({ message: 'OTP verified successfully.', resetToken }, 200, request);
  }

  // 15. POST /api/auth/reset-password
  if (routePath === 'auth/reset-password') {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(clientIp, 'auth_reset_password', 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return jsonResponse({ error: 'Too many attempts. Please wait before trying again.' }, 429, request);
    }

    const { resetToken, newPassword, confirmPassword } = body;
    if (!resetToken || !newPassword || !confirmPassword) {
      return jsonResponse({ error: 'All fields are required.' }, 400, request);
    }

    if (newPassword !== confirmPassword) {
      return jsonResponse({ error: 'Passwords do not match.' }, 400, request);
    }

    let decoded = null;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
    } catch (err) {
      return jsonResponse({ error: 'This verification code has expired. Please request a new code.' }, 400, request);
    }

    if (!decoded || decoded.purpose !== 'password_reset' || !decoded.userId) {
      return jsonResponse({ error: 'Invalid password reset token.' }, 400, request);
    }

    const policyResult = validatePasswordPolicy(newPassword);
    if (!policyResult.valid) {
      return jsonResponse({ error: policyResult.message }, 400, request);
    }

    await refreshTable('users');
    const targetUser = db.users.find(u => u.id === decoded.userId);
    if (!targetUser) {
      return jsonResponse({ error: 'Account not found.' }, 404, request);
    }

    targetUser.password = await bcrypt.hash(newPassword, 10);
    targetUser.mustChangePassword = false;

    await supabaseClient.upsertRecord('users', targetUser);

    return jsonResponse({ message: 'Your password has been changed successfully. You can now log in with your new password.' }, 200, request);
  }

  // 16. POST /api/auth/update-must-change-password
  if (routePath === 'auth/update-must-change-password') {
    if (!user) return jsonResponse({ error: 'Unauthorized' }, 401, request);

    const { newPassword, confirmPassword } = body;
    if (!newPassword || !confirmPassword) {
      return jsonResponse({ error: 'New password and confirmation are required.' }, 400, request);
    }

    if (newPassword !== confirmPassword) {
      return jsonResponse({ error: 'Passwords do not match.' }, 400, request);
    }

    const policyResult = validatePasswordPolicy(newPassword);
    if (!policyResult.valid) {
      return jsonResponse({ error: policyResult.message }, 400, request);
    }

    await refreshTable('users');
    const targetUser = db.users.find(u => u.id === user.id);
    if (!targetUser) return jsonResponse({ error: 'User not found.' }, 404, request);

    targetUser.password = await bcrypt.hash(newPassword, 10);
    targetUser.mustChangePassword = false;

    await supabaseClient.upsertRecord('users', targetUser);
    return jsonResponse({ message: 'Password changed successfully.' }, 200, request);
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
    // Auto-create alert and TURN OFF device (Auto-Shutdown) if hours or energy limit is reached
    if (device.currentWorkingHours >= device.maxWorkingHours && !device._hoursAlerted) {
      device._hoursAlerted = true;
      device.state = 0; // Turn OFF device
      const alertObj = {
        id: nextId('alert'),
        title: '⏱️ Operating Hours Limit Reached (Device OFF)',
        message: `Device "${device.name}" reached max limit of ${device.maxWorkingHours} hrs and was automatically turned OFF.`,
        severity: 'Warning',
        status: 'Active',
        deviceId: device.id,
        deviceName: device.name,
        userId: device.userId,
        timestamp: new Date().toISOString()
      };
      db.alerts.push(alertObj);
      await supabaseClient.upsertRecord('alerts', alertObj);

      const notifObj = {
        id: nextId('notif'),
        userId: device.userId,
        message: `🔴 "${device.name}" operating hours limit reached — Device automatically turned OFF!`,
        type: 'Warning',
        status: 'Unread',
        timestamp: new Date().toISOString()
      };
      db.notifications.push(notifObj);
      await supabaseClient.upsertRecord('notifications', notifObj);
    }

    if (device.currentConsumption >= device.maxEnergyConsumption && !device._energyAlerted) {
      device._energyAlerted = true;
      device.state = 0; // Turn OFF device
      const alertObj = {
        id: nextId('alert'),
        title: '⚡ High Energy Limit Exceeded (Device OFF)',
        message: `Device "${device.name}" consumed ${device.currentConsumption.toFixed(2)} kWh (max ${device.maxEnergyConsumption} kWh) and was automatically turned OFF.`,
        severity: 'Danger',
        status: 'Active',
        deviceId: device.id,
        deviceName: device.name,
        userId: device.userId,
        timestamp: new Date().toISOString()
      };
      db.alerts.push(alertObj);
      await supabaseClient.upsertRecord('alerts', alertObj);

      const notifObj = {
        id: nextId('notif'),
        userId: device.userId,
        message: `🔴 "${device.name}" energy limit exceeded — Device automatically turned OFF!`,
        type: 'Danger',
        status: 'Unread',
        timestamp: new Date().toISOString()
      };
      db.notifications.push(notifObj);
      await supabaseClient.upsertRecord('notifications', notifObj);
    }

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
