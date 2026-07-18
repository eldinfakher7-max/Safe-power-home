const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  passwordHash: { type: String, required: true },
  userType: { type: String, enum: ['User', 'Admin'], default: 'User' },
  status: { type: String, default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

const DeviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  location: { type: String, required: true },
  status: { type: String, enum: ['Online', 'Offline'], default: 'Online' },
  powerLimit: { type: Number, default: 3000.0 },
  tempLimit: { type: Number, default: 60.0 },
  state: { type: Number, default: 0 }, // 1 = ON, 0 = OFF
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  imageIcon: { type: String, default: 'fa-plug' },
  powerRating: { type: Number, default: 1500.0 },
  maxWorkingHours: { type: Number, default: 8.0 },
  maxEnergyConsumption: { type: Number, default: 10.0 },
  currentConsumption: { type: Number, default: 0.0 },
  currentWorkingHours: { type: Number, default: 0.0 },
  lastTurnedOn: String,
  hoursExceededNotified: { type: Number, default: 0 },
  energyExceededNotified: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const AlertSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  severity: { type: String, enum: ['Info', 'Warning', 'Danger'], default: 'Info' },
  status: { type: String, enum: ['Active', 'Resolved'], default: 'Active' },
  deviceName: String,
  consumption: Number,
  exceededAmount: Number,
  timestamp: { type: Date, default: Date.now }
});

const AuthRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String, required: true },
  email: { type: String, required: true },
  deviceName: { type: String, required: true },
  reason: String,
  message: String,
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  adminNotes: String,
  approvalTime: String
});

const ApprovedBypassSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deviceName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const ComplaintSchema = new mongoose.Schema({
  complaintId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  address: String,
  deviceName: String,
  deviceType: String,
  category: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
  adminReply: String,
  filePath: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ComplaintMessageSchema = new mongoose.Schema({
  complaintId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  roleTarget: String, // 'Admin' or 'User'
  message: { type: String, required: true },
  status: { type: String, default: 'Unread' },
  timestamp: { type: Date, default: Date.now }
});

const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }
});

module.exports = {
  User: mongoose.models.User || mongoose.model('User', UserSchema),
  Device: mongoose.models.Device || mongoose.model('Device', DeviceSchema),
  Alert: mongoose.models.Alert || mongoose.model('Alert', AlertSchema),
  AuthRequest: mongoose.models.AuthRequest || mongoose.model('AuthRequest', AuthRequestSchema),
  ApprovedBypass: mongoose.models.ApprovedBypass || mongoose.model('ApprovedBypass', ApprovedBypassSchema),
  Complaint: mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema),
  ComplaintMessage: mongoose.models.ComplaintMessage || mongoose.model('ComplaintMessage', ComplaintMessageSchema),
  Notification: mongoose.models.Notification || mongoose.model('Notification', NotificationSchema),
  Setting: mongoose.models.Setting || mongoose.model('Setting', SettingSchema)
};
