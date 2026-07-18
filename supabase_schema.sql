-- SQL Schema for Smart Power Home AI Database Setup
-- Run this in your Supabase SQL Editor

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    "userType" TEXT DEFAULT 'User',
    status TEXT DEFAULT 'Active',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Devices Table
CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    location TEXT NOT NULL,
    "imageIcon" TEXT DEFAULT 'fa-plug',
    "powerRating" NUMERIC DEFAULT 1500.0,
    "maxWorkingHours" NUMERIC DEFAULT 8.0,
    "maxEnergyConsumption" NUMERIC DEFAULT 10.0,
    "autoShutdown" BOOLEAN DEFAULT FALSE,
    state INTEGER DEFAULT 0,
    "currentWorkingHours" NUMERIC DEFAULT 0.0,
    "currentConsumption" NUMERIC DEFAULT 0.0,
    "todayConsumption" NUMERIC DEFAULT 0.0,
    "monthlyConsumption" NUMERIC DEFAULT 0.0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT DEFAULT 'Info',
    status TEXT DEFAULT 'Active',
    "deviceId" TEXT,
    "deviceName" TEXT,
    "userId" TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY,
    "complaintId" TEXT UNIQUE NOT NULL,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    "deviceName" TEXT,
    "deviceType" TEXT,
    category TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium',
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'Open',
    "adminReply" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Complaint Messages Table
CREATE TABLE IF NOT EXISTS complaint_messages (
    id TEXT PRIMARY KEY,
    "complaintId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Device Authorization Requests Table
CREATE TABLE IF NOT EXISTS auth_requests (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "userName" TEXT NOT NULL,
    email TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    reason TEXT,
    message TEXT,
    status TEXT DEFAULT 'Pending',
    "adminNotes" TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'Info',
    status TEXT DEFAULT 'Unread',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Settings Table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 9. Audit Logs Table
CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    "deviceName" TEXT NOT NULL,
    action TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
