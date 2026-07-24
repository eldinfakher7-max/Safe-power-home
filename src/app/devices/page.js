'use client';
import { useState, useEffect } from 'react';
import LayoutWrapper, { useToast } from '@/components/LayoutWrapper';
import io from 'socket.io-client';

let socket;

const DEVICE_ICONS = [
  { label: '🌬️ Air Conditioner', value: 'fa-wind' },
  { label: '❄️ Refrigerator', value: 'fa-snowflake' },
  { label: '🔥 Water Heater', value: 'fa-faucet-drip' },
  { label: '📺 Television', value: 'fa-tv' },
  { label: '🔋 EV Charger', value: 'fa-car-battery' },
  { label: '💡 Lamp / Lighting', value: 'fa-lightbulb' },
  { label: '🔌 General Outlet', value: 'fa-plug' },
  { label: '🖨️ Computer / PC', value: 'fa-desktop' },
  { label: '🍳 Microwave / Oven', value: 'fa-fire-burner' },
  { label: '🫧 Washing Machine', value: 'fa-shirt' },
];

const DEVICE_TYPES = ['AC', 'Refrigerator', 'Water Heater', 'TV', 'EV Charger', 'Lighting', 'Appliance', 'Computer', 'Washer', 'Other'];

const APPLIANCE_MAPPINGS = [
  { keywords: ['ac', 'air conditioner', 'cool', 'aircon'], label: 'Air Conditioner', icon: 'fa-wind' },
  { keywords: ['fridge', 'refrigerator', 'freezer', 'cold'], label: 'Refrigerator', icon: 'fa-snowflake' },
  { keywords: ['heater', 'water heater', 'boiler'], label: 'Water Heater', icon: 'fa-faucet-drip' },
  { keywords: ['tv', 'television', 'screen', 'monitor'], label: 'Television', icon: 'fa-tv' },
  { keywords: ['car', 'ev', 'charger', 'tesla'], label: 'EV Charger', icon: 'fa-car-battery' },
  { keywords: ['lamp', 'light', 'bulb', 'led'], label: 'Lamp / Lighting', icon: 'fa-lightbulb' },
  { keywords: ['washer', 'washing', 'laundry', 'dryer'], label: 'Washing Machine', icon: 'fa-shirt' },
  { keywords: ['pc', 'computer', 'laptop', 'desktop'], label: 'Computer / PC', icon: 'fa-desktop' },
  { keywords: ['microwave', 'oven', 'stove', 'cooker'], label: 'Microwave / Oven', icon: 'fa-fire-burner' },
];

const THIRTY_SMART_DEVICES = [
  { name: 'LG Split AC (Dual Inverter)', type: 'AC', location: 'Living Room', imageIcon: 'fa-wind', imageUrl: '/preset_ac.jpg', powerRating: 1450, maxWorkingHours: 10, maxEnergyConsumption: 14.5, targetTemp: 22 },
  { name: 'Samsung Twin Cooling Refrigerator', type: 'Refrigerator', location: 'Kitchen', imageIcon: 'fa-snowflake', imageUrl: '/preset_fridge.jpg', powerRating: 350, maxWorkingHours: 24, maxEnergyConsumption: 8.4, targetTemp: 3 },
  { name: 'Ariston Pro1 Eco Water Heater', type: 'Water Heater', location: 'Bathroom', imageIcon: 'fa-faucet-drip', imageUrl: '/preset_heater.jpg', powerRating: 2000, maxWorkingHours: 4, maxEnergyConsumption: 8.0, targetTemp: 60 },
  { name: 'Sony Bravia 4K Smart TV', type: 'TV', location: 'Living Room', imageIcon: 'fa-tv', imageUrl: '/preset_tv.jpg', powerRating: 150, maxWorkingHours: 6, maxEnergyConsumption: 0.9, targetTemp: 24 },
  { name: 'Tesla Wall Connector EV Charger', type: 'EV Charger', location: 'Garage', imageIcon: 'fa-car-battery', imageUrl: '/preset_ev.jpg', powerRating: 7400, maxWorkingHours: 5, maxEnergyConsumption: 37.0, targetTemp: 25 },
  { name: 'Philips Hue Smart LED Bulb', type: 'Lighting', location: 'Bedroom', imageIcon: 'fa-lightbulb', imageUrl: '/preset_lamp.jpg', powerRating: 9, maxWorkingHours: 12, maxEnergyConsumption: 0.11, targetTemp: 25 },
  { name: 'Bosch Series 6 Washing Machine', type: 'Washer', location: 'Laundry Room', imageIcon: 'fa-shirt', imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&auto=format&fit=crop&q=80', powerRating: 2200, maxWorkingHours: 2, maxEnergyConsumption: 4.4, targetTemp: 40 },
  { name: 'Dell OptiPlex Workstation PC', type: 'Computer', location: 'Home Office', imageIcon: 'fa-desktop', imageUrl: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400&auto=format&fit=crop&q=80', powerRating: 250, maxWorkingHours: 8, maxEnergyConsumption: 2.0, targetTemp: 35 },
  { name: 'Panasonic Inverter Microwave', type: 'Appliance', location: 'Kitchen', imageIcon: 'fa-fire-burner', powerRating: 1100, maxWorkingHours: 1, maxEnergyConsumption: 1.1, targetTemp: 180 },
  { name: 'DeLonghi Magnifica Espresso Maker', type: 'Appliance', location: 'Kitchen', imageIcon: 'fa-mug-hot', powerRating: 1450, maxWorkingHours: 2, maxEnergyConsumption: 2.9, targetTemp: 92 },
  { name: 'Dyson Pure Cool Air Purifier', type: 'Appliance', location: 'Bedroom', imageIcon: 'fa-fan', powerRating: 40, maxWorkingHours: 12, maxEnergyConsumption: 0.48, targetTemp: 21 },
  { name: 'iRobot Roomba Robot Vacuum', type: 'Appliance', location: 'Living Room', imageIcon: 'fa-broom', powerRating: 35, maxWorkingHours: 3, maxEnergyConsumption: 0.1, targetTemp: 25 },
  { name: 'Sony PlayStation 5 Console', type: 'Appliance', location: 'Gaming Room', imageIcon: 'fa-gamepad', powerRating: 200, maxWorkingHours: 5, maxEnergyConsumption: 1.0, targetTemp: 45 },
  { name: 'Sonos Arc Dolby Soundbar', type: 'Appliance', location: 'Living Room', imageIcon: 'fa-volume-high', powerRating: 60, maxWorkingHours: 8, maxEnergyConsumption: 0.48, targetTemp: 25 },
  { name: 'Miele G7000 Smart Dishwasher', type: 'Appliance', location: 'Kitchen', imageIcon: 'fa-sink', powerRating: 1800, maxWorkingHours: 2, maxEnergyConsumption: 3.6, targetTemp: 55 },
  { name: 'Daikin Bedroom Inverter AC', type: 'AC', location: 'Bedroom', imageIcon: 'fa-wind', imageUrl: '/preset_ac.jpg', powerRating: 1200, maxWorkingHours: 8, maxEnergyConsumption: 9.6, targetTemp: 24 },
  { name: 'LG Instaview Double Door Refrigerator', type: 'Refrigerator', location: 'Kitchen', imageIcon: 'fa-snowflake', imageUrl: '/preset_fridge.jpg', powerRating: 400, maxWorkingHours: 24, maxEnergyConsumption: 9.6, targetTemp: 2 },
  { name: 'Siemens Heat Pump Clothes Dryer', type: 'Washer', location: 'Laundry Room', imageIcon: 'fa-shirt', powerRating: 900, maxWorkingHours: 3, maxEnergyConsumption: 2.7, targetTemp: 50 },
  { name: 'Apple iMac M3 Workstation', type: 'Computer', location: 'Studio', imageIcon: 'fa-desktop', powerRating: 140, maxWorkingHours: 10, maxEnergyConsumption: 1.4, targetTemp: 32 },
  { name: 'Breville Smart Toaster Oven', type: 'Appliance', location: 'Kitchen', imageIcon: 'fa-fire-burner', powerRating: 1800, maxWorkingHours: 1, maxEnergyConsumption: 1.8, targetTemp: 200 },
  { name: 'Nest Thermostat Smart Controller', type: 'Appliance', location: 'Hallway', imageIcon: 'fa-temperature-quarter', powerRating: 5, maxWorkingHours: 24, maxEnergyConsumption: 0.12, targetTemp: 23 },
  { name: 'Aquarium Submersible Water Heater', type: 'Water Heater', location: 'Living Room', imageIcon: 'fa-water', powerRating: 100, maxWorkingHours: 24, maxEnergyConsumption: 2.4, targetTemp: 26 },
  { name: 'Smart Garage Door Opener Motor', type: 'Appliance', location: 'Garage', imageIcon: 'fa-warehouse', powerRating: 500, maxWorkingHours: 1, maxEnergyConsumption: 0.5, targetTemp: 25 },
  { name: 'Lawn Smart Irrigation Controller Pump', type: 'Appliance', location: 'Garden', imageIcon: 'fa-faucet', powerRating: 750, maxWorkingHours: 2, maxEnergyConsumption: 1.5, targetTemp: 20 },
  { name: 'Krups Electric Water Kettle', type: 'Appliance', location: 'Kitchen', imageIcon: 'fa-mug-saucer', powerRating: 2200, maxWorkingHours: 1, maxEnergyConsumption: 2.2, targetTemp: 100 },
  { name: 'Wine Storage Climate Refrigerator', type: 'Refrigerator', location: 'Dining Room', imageIcon: 'fa-wine-glass', powerRating: 120, maxWorkingHours: 24, maxEnergyConsumption: 2.88, targetTemp: 12 },
  { name: 'Honeywell Smart Space Heater', type: 'Water Heater', location: 'Study Room', imageIcon: 'fa-fire', powerRating: 1500, maxWorkingHours: 6, maxEnergyConsumption: 9.0, targetTemp: 28 },
  { name: 'Smart Swimming Pool Filtration Pump', type: 'Appliance', location: 'Outdoor Pool', imageIcon: 'fa-life-ring', powerRating: 1100, maxWorkingHours: 8, maxEnergyConsumption: 8.8, targetTemp: 27 },
  { name: 'Yeelight Smart Ceiling Light', type: 'Lighting', location: 'Hallway', imageIcon: 'fa-lightbulb', imageUrl: '/preset_lamp.jpg', powerRating: 28, maxWorkingHours: 10, maxEnergyConsumption: 0.28, targetTemp: 25 },
  { name: 'Smart Dehumidifier Unit', type: 'Appliance', location: 'Basement', imageIcon: 'fa-droplet-slash', powerRating: 420, maxWorkingHours: 8, maxEnergyConsumption: 3.36, targetTemp: 20 },
];

const PRESET_LIBRARY_DEVICES = [
  {
    name: 'Samsung Twin Cooling Refrigerator',
    brand: 'Samsung',
    type: 'Refrigerator',
    imageUrl: '/preset_fridge.jpg',
    imageIcon: 'fa-snowflake',
    powerRating: 350,
    maxWorkingHours: 24,
    maxEnergyConsumption: 8.4,
    description: 'Smart refrigerator with auto temperature control & Twin Cooling System.'
  },
  {
    name: 'LG Dual Inverter Air Conditioner',
    brand: 'LG',
    type: 'AC',
    imageUrl: '/preset_ac.jpg',
    imageIcon: 'fa-wind',
    powerRating: 1450,
    maxWorkingHours: 10,
    maxEnergyConsumption: 14.5,
    description: 'Energy-saving air conditioner with active cooling control and Dual Inverter technology.'
  },
  {
    name: 'Ariston Pro1 Eco Water Heater',
    brand: 'Ariston',
    type: 'Water Heater',
    imageUrl: '/preset_heater.jpg',
    imageIcon: 'fa-faucet-drip',
    powerRating: 2000,
    maxWorkingHours: 4,
    maxEnergyConsumption: 8.0,
    description: 'Eco Evo smart function water heater with absolute safety system.'
  },
  {
    name: 'Sony Bravia 4K Smart TV',
    brand: 'Sony',
    type: 'TV',
    imageUrl: '/preset_tv.jpg',
    imageIcon: 'fa-tv',
    powerRating: 150,
    maxWorkingHours: 6,
    maxEnergyConsumption: 0.9,
    description: 'Vivid color low power LED screen with HDR processor.'
  },
  {
    name: 'Tesla Wall Connector EV Charger',
    brand: 'Tesla',
    type: 'EV Charger',
    imageUrl: '/preset_ev.jpg',
    imageIcon: 'fa-car-battery',
    powerRating: 7400,
    maxWorkingHours: 5,
    maxEnergyConsumption: 37.0,
    description: 'Fast home EV charging connector compatible with all electric vehicles.'
  },
  {
    name: 'Philips Hue Smart LED Bulb',
    brand: 'Philips',
    type: 'Lighting',
    imageUrl: '/preset_lamp.jpg',
    imageIcon: 'fa-lightbulb',
    powerRating: 9,
    maxWorkingHours: 12,
    maxEnergyConsumption: 0.11,
    description: 'Smart dimmable RGB lighting control with home automation integration.'
  },
  {
    name: 'Bosch Series 6 Washing Machine',
    brand: 'Bosch',
    type: 'Washer',
    imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&auto=format&fit=crop&q=80',
    imageIcon: 'fa-shirt',
    powerRating: 2200,
    maxWorkingHours: 2,
    maxEnergyConsumption: 4.4,
    description: 'EcoSilence Drive silent washing with SpeedPerfect option.'
  },
  {
    name: 'Dell OptiPlex Workstation PC',
    brand: 'Dell',
    type: 'Computer',
    imageUrl: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=400&auto=format&fit=crop&q=80',
    imageIcon: 'fa-desktop',
    powerRating: 250,
    maxWorkingHours: 8,
    maxEnergyConsumption: 2.0,
    description: 'Standard office workstation with intelligent audio and express response.'
  }
];

function Modal({ show, onClose, title, children }) {
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h3 style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 16 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [editDevice, setEditDevice] = useState(null);
  const [requestedName, setRequestedName] = useState('');
  const [alert, setAlert] = useState(null);
  const [user, setUser] = useState(null);

  // AI Mismatch Assist States
  const [showAiAssist, setShowAiAssist] = useState(false);
  const [aiContext, setAiContext] = useState(null);

  // Preset Selection flow states
  const [selectedPresetItem, setSelectedPresetItem] = useState(null);
  const [showPresetDetails, setShowPresetDetails] = useState(false);

  const [addForm, setAddForm] = useState({
    name: '',
    type: 'AC',
    location: '',
    imageIcon: 'fa-wind',
    customImage: '',
    customImageName: '',
    powerRating: 1500,
    maxWorkingHours: 8,
    maxEnergyConsumption: 10,
    auth_password: ''
  });

  const [requestForm, setRequestForm] = useState({ reason: 'New Device Installation', message: '' });

  // Always read token dynamically so SSR doesn't give empty string
  function getToken() {
    return typeof window !== 'undefined' ? localStorage.getItem('sph_token') || '' : '';
  }

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('sph_user') || '{}');
    setUser(u);
    loadDevices();

    socket = io();
    socket.on('device_metrics_updated', () => loadDevices());
    socket.on('limit_warning_alert', (data) => {
      showAlert(data.message, 'danger');
    });

    // Client-side real-time simulated metric updates (every 3 seconds)
    const interval = setInterval(() => {
      setDevices(prevDevices => {
        let changed = false;
        const updated = prevDevices.map(d => {
          if (d.state === 1) {
            // Simulate 0.05 hours (3 minutes) of usage every 3 seconds for visible feedback
            const elapsed = 0.05;
            const kw = (d.powerRating || 1000) / 1000;
            const energy = kw * elapsed;
            changed = true;

            const updatedDevice = {
              ...d,
              currentWorkingHours: (d.currentWorkingHours || 0) + elapsed,
              currentConsumption: (d.currentConsumption || 0) + energy,
              todayConsumption: (d.todayConsumption || 0) + energy,
              monthlyConsumption: (d.monthlyConsumption || 0) + energy
            };

            // Trigger real-time alert toast if threshold exceeded
            if (updatedDevice.currentWorkingHours >= updatedDevice.maxWorkingHours && !d._hoursAlerted) {
              updatedDevice._hoursAlerted = true;
              showAlert(`⏱️ Alert: "${d.name}" exceeded maximum operating limit (${d.maxWorkingHours} hrs)!`, 'danger');
            }
            if (updatedDevice.currentConsumption >= updatedDevice.maxEnergyConsumption && !d._energyAlerted) {
              updatedDevice._energyAlerted = true;
              showAlert(`⚡ Alert: "${d.name}" exceeded maximum energy limit (${d.maxEnergyConsumption} kWh)!`, 'danger');
            }

            // Non-blocking sync to server
            fetch(`/api/devices/${d._id || d.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
              body: JSON.stringify({
                power_rating: d.powerRating,
                max_working_hours: d.maxWorkingHours,
                max_energy_consumption: d.maxEnergyConsumption,
                currentWorkingHours: updatedDevice.currentWorkingHours,
                currentConsumption: updatedDevice.currentConsumption
              })
            }).catch(() => {});

            return updatedDevice;
          }
          return d;
        });

        return updated;
      });
    }, 3000);

    return () => {
      if (socket) socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  async function loadDevices() {
    setLoading(true);
    const tk = getToken();
    try {
      const res = await fetch('/api/devices', { headers: { Authorization: `Bearer ${tk}` } });
      if (res.ok) {
        const data = await res.json();
        setDevices(Array.isArray(data) ? data : []);
      } else {
        console.error('loadDevices failed:', res.status);
      }
    } catch (err) {
      console.error('loadDevices error:', err);
    }
    setLoading(false);
  }

  function showAlert(msg, type = 'success') {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  }

  // Handle custom image uploads
  function handleImageUpload(e, isEdit = false) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEdit) {
        setEditDevice(p => ({ ...p, customImage: reader.result, customImageName: file.name }));
      } else {
        setAddForm(p => ({ ...p, customImage: reader.result, customImageName: file.name }));
      }
    };
    reader.readAsDataURL(file);
  }

  // Detect matching conflicts between name and image/icon
  function checkMatchingConflict(name, icon, customImageName) {
    const lowerName = name.toLowerCase();
    const targetSource = customImageName ? customImageName.toLowerCase() : '';

    // Check if name has key mismatch with preset icon
    let expectedIcon = null;
    let expectedLabel = '';

    for (const mapping of APPLIANCE_MAPPINGS) {
      if (mapping.keywords.some(k => lowerName.includes(k) || targetSource.includes(k))) {
        expectedIcon = mapping.icon;
        expectedLabel = mapping.label;
        break;
      }
    }

    if (expectedIcon && expectedIcon !== icon) {
      const currentIconLabel = DEVICE_ICONS.find(i => i.value === icon)?.label || 'Other Appliance';
      return {
        expectedIcon,
        expectedLabel,
        currentIconLabel,
        suggestedName: `${expectedLabel}`
      };
    }
    return null;
  }

  // Process Add Device Submission with AI matcher
  async function triggerAddDevice(e) {
    e.preventDefault();
    
    // Check match
    const conflict = checkMatchingConflict(addForm.name, addForm.imageIcon, addForm.customImageName);
    if (conflict) {
      setAiContext({
        type: 'add',
        name: addForm.name,
        icon: addForm.imageIcon,
        customImage: addForm.customImage,
        customImageName: addForm.customImageName,
        expectedIcon: conflict.expectedIcon,
        expectedLabel: conflict.expectedLabel,
        currentIconLabel: conflict.currentIconLabel,
        suggestedName: `${addForm.location ? addForm.location + ' ' : ''}${conflict.suggestedName}`
      });
      setShowAiAssist(true);
      return;
    }

    await submitAddDevice(addForm);
  }

  async function submitAddDevice(formData) {
    const tk = getToken();
    const res = await fetch('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tk}` },
      body: JSON.stringify(formData)
    });
    const data = await res.json();

    if (res.ok) {
      setShowAdd(false);
      setAddForm({ name: '', type: 'AC', location: '', imageIcon: 'fa-wind', customImage: '', customImageName: '', powerRating: 1500, maxWorkingHours: 8, maxEnergyConsumption: 10, auth_password: '' });
      loadDevices();
      showAlert('Device registered successfully!', 'success');
    } else if (res.status === 403) {
      setShowAdd(false);
      setRequestedName(formData.name);
      setRequestForm({ reason: 'New Device Installation', message: '' });
      showAlert('Incorrect Device Registration Password.', 'danger');
      setTimeout(() => setShowRequest(true), 600);
    } else {
      showAlert(data.error || 'Failed to add device.', 'danger');
    }
  }

  // Process Edit Device Submission with AI matcher
  async function triggerEditDevice(e) {
    e.preventDefault();
    
    const conflict = checkMatchingConflict(editDevice.name, editDevice.imageIcon, editDevice.customImageName);
    if (conflict) {
      setAiContext({
        type: 'edit',
        name: editDevice.name,
        icon: editDevice.imageIcon,
        customImage: editDevice.customImage,
        customImageName: editDevice.customImageName,
        expectedIcon: conflict.expectedIcon,
        expectedLabel: conflict.expectedLabel,
        currentIconLabel: conflict.currentIconLabel,
        suggestedName: `${editDevice.location ? editDevice.location + ' ' : ''}${conflict.suggestedName}`
      });
      setShowAiAssist(true);
      return;
    }

    await submitEditDevice(editDevice);
  }

  async function submitEditDevice(deviceData) {
    const res = await fetch(`/api/devices/${deviceData._id || deviceData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({
        name: deviceData.name,
        type: deviceData.type,
        location: deviceData.location,
        imageIcon: deviceData.imageIcon,
        customImage: deviceData.customImage,
        customImageName: deviceData.customImageName,
        power_rating: deviceData.powerRating,
        max_working_hours: deviceData.maxWorkingHours,
        max_energy_consumption: deviceData.maxEnergyConsumption
      })
    });
    if (res.ok) {
      setShowEdit(false);
      loadDevices();
      showAlert('Device updated successfully!');
    }
  }

  // Handle AI Mismatch Choices
  async function handleAiResolution(option) {
    setShowAiAssist(false);
    if (!aiContext) return;

    let updatedForm = {
      name: aiContext.name,
      imageIcon: aiContext.icon,
      customImage: aiContext.customImage,
      customImageName: aiContext.customImageName
    };

    if (option === 'fix_image') {
      updatedForm.imageIcon = aiContext.expectedIcon;
      updatedForm.customImage = ''; // Clear custom image mismatch
      updatedForm.customImageName = '';
      showAlert(`🤖 AI updated device image/icon to match "${aiContext.name}"!`);
    } else if (option === 'fix_name') {
      updatedForm.name = aiContext.suggestedName;
      showAlert(`🤖 AI updated device name to "${aiContext.suggestedName}"!`);
    } else if (option === 'ai_decide') {
      updatedForm.name = aiContext.suggestedName;
      updatedForm.imageIcon = aiContext.expectedIcon;
      updatedForm.customImage = '';
      updatedForm.customImageName = '';
      showAlert(`🤖 AI Assistant optimized both: Name ➔ "${aiContext.suggestedName}" & Icon ➔ Correct Type!`);
    }

    if (aiContext.type === 'add') {
      const mergedForm = { ...addForm, ...updatedForm };
      setAddForm(mergedForm);
      await submitAddDevice(mergedForm);
    } else {
      const mergedEdit = { ...editDevice, ...updatedForm };
      setEditDevice(mergedEdit);
      await submitEditDevice(mergedEdit);
    }
  }

  async function submitRequest(e) {
    e.preventDefault();
    const u = JSON.parse(localStorage.getItem('sph_user') || '{}');
    const res = await fetch('/api/admin/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({
        userName: u.name,
        email: u.email,
        deviceName: requestedName,
        reason: requestForm.reason,
        message: requestForm.message
      })
    });
    if (res.ok) {
      setShowRequest(false);
      showAlert('Access request submitted to Admin.', 'success');
    }
  }

  async function toggleDevice(id, state) {
    const nextState = state === 1 ? 0 : 1;
    // Optimistic update so switch turns ON/OFF instantly
    setDevices(prev => prev.map(d => ((d._id || d.id) === id ? { ...d, state: nextState } : d)));

    try {
      await fetch(`/api/devices/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ state: nextState })
      });
    } catch (err) {
      console.error('Toggle error:', err);
    }
  }

  async function deleteDevice(id) {
    if (!confirm('Remove this device permanently?')) return;
    await fetch(`/api/devices/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getToken()}` } });
    loadDevices();
    showAlert('Device removed.', 'danger');
  }

  async function restartDevice(id) {
    await fetch(`/api/devices/${id}/restart`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` } });
    loadDevices();
    showAlert('Device counters reset.');
  }

  async function updateDeviceMetric(id, updates) {
    const dev = devices.find(d => (d._id || d.id) === id);
    if (!dev) return;
    const devId = dev._id || dev.id;

    const newPower = updates.powerRating !== undefined ? updates.powerRating : dev.powerRating;
    const newHours = updates.maxWorkingHours !== undefined ? updates.maxWorkingHours : dev.maxWorkingHours;
    const newTemp = updates.targetTemp !== undefined ? updates.targetTemp : (dev.targetTemp || 24);

    setDevices(prev => prev.map(d => ((d._id || d.id) === devId ? { ...d, powerRating: newPower, maxWorkingHours: newHours, targetTemp: newTemp } : d)));

    await fetch(`/api/devices/${devId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({
        name: dev.name,
        type: dev.type,
        location: dev.location,
        power_rating: newPower,
        max_working_hours: newHours,
        targetTemp: newTemp
      })
    });
  }

  async function seedThirtyDevices() {
    if (!confirm('Add 30 smart home devices to your account?')) return;
    setLoading(true);
    let count = 0;
    for (const item of THIRTY_SMART_DEVICES) {
      const payload = {
        name: item.name,
        type: item.type,
        location: item.location,
        imageIcon: item.imageIcon,
        customImage: item.imageUrl || '',
        customImageName: item.name,
        powerRating: item.powerRating,
        maxWorkingHours: item.maxWorkingHours,
        maxEnergyConsumption: item.maxEnergyConsumption,
        targetTemp: item.targetTemp || 24,
        auth_password: 'fakherkoky@2010'
      };
      try {
        const res = await fetch('/api/devices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
          body: JSON.stringify(payload)
        });
        if (res.ok) count++;
      } catch {}
    }
    await loadDevices();
    setLoading(false);
    showAlert(`🎉 Successfully registered ${count} Smart Home Devices!`, 'success');
  }

  return (
    <LayoutWrapper pageTitle="Device Management">
      {/* Alert bar */}
      {alert && (
        <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, background: alert.type === 'success' ? '#DCFCE7' : '#FEE2E2', color: alert.type === 'success' ? '#15803D' : '#DC2626', border: `1px solid ${alert.type === 'success' ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}` }}>
          <i className={`fa-solid ${alert.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`} />
          {alert.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 20 }}>Smart Devices</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{devices.length} registered channels · {devices.filter(d => d.state === 1).length} active</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <i className="fa-solid fa-plus" /> Add Device
        </button>
      </div>

      {/* Devices Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          Loading devices...
        </div>
      ) : devices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-microchip" style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }} />
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No devices registered</div>
          <p style={{ fontSize: 13 }}>Click "Add Device" to register your first smart device.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {devices.map(d => {
            const hoursExceeded = d.currentWorkingHours >= d.maxWorkingHours;
            const energyExceeded = d.currentConsumption >= d.maxEnergyConsumption;
            const hoursPercent = Math.min((d.currentWorkingHours / d.maxWorkingHours) * 100, 100);
            const energyPercent = Math.min((d.currentConsumption / d.maxEnergyConsumption) * 100, 100);

            return (
              <div key={d._id || d.id} className="device-card">
                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: d.state === 1 ? 'rgba(16,185,129,0.12)' : 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)', overflow: 'hidden' }}>
                      {d.customImage ? (
                        <img src={d.customImage} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <i className={`fa-solid ${d.imageIcon || 'fa-plug'}`} style={{ fontSize: 20, color: d.state === 1 ? 'var(--success)' : 'var(--text-muted)' }} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.type} · {d.location}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {(hoursExceeded || energyExceeded) && (
                      <span style={{ fontSize: 16, animation: 'pulse-border 1.5s infinite' }} title="Limit exceeded">⚠️</span>
                    )}
                    <label className="toggle-switch">
                      <input type="checkbox" checked={d.state === 1} onChange={() => toggleDevice(d._id || d.id, d.state)} />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>

                {/* Status pill + power rating */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <span className={`pill ${d.state === 1 ? 'pill-active' : 'pill-offline'}`}>
                    <i className={`fa-solid ${d.state === 1 ? 'fa-circle' : 'fa-circle-dot'}`} style={{ fontSize: 6 }} />
                    {d.state === 1 ? 'ON' : 'OFF'}
                  </span>
                  <span className="pill pill-info">{d.powerRating}W</span>
                  <span className="pill" style={{ background: 'rgba(139,92,246,0.1)', color: '#7C3AED' }}>{d.type}</span>
                  <span className="pill" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                    <i className="fa-solid fa-temperature-half" style={{ fontSize: 10, marginRight: 4 }} />
                    {d.targetTemp || 24}°C
                  </span>
                </div>

                {/* Quick Interactive Control Bar: Time, Watts & Temperature */}
                <div style={{ background: 'rgba(243, 244, 246, 0.7)', borderRadius: 10, padding: '10px 12px', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid rgba(0,0,0,0.05)' }}>
                  
                  {/* Power Rating / Watts Control */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                    <span style={{ fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="fa-solid fa-bolt" style={{ color: '#F59E0B' }} /> Watts:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => updateDeviceMetric(d._id || d.id, { powerRating: Math.max(10, d.powerRating - 50) })} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: '#E5E7EB', color: '#1F2937', cursor: 'pointer', fontWeight: 700 }}>-</button>
                      <span style={{ fontWeight: 700, color: '#1F2937', minWidth: 50, textAlign: 'center' }}>{d.powerRating}W</span>
                      <button onClick={() => updateDeviceMetric(d._id || d.id, { powerRating: d.powerRating + 50 })} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: '#E5E7EB', color: '#1F2937', cursor: 'pointer', fontWeight: 700 }}>+</button>
                    </div>
                  </div>

                  {/* Max Working Hours Control */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                    <span style={{ fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="fa-regular fa-clock" style={{ color: '#3B82F6' }} /> Max Time:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => updateDeviceMetric(d._id || d.id, { maxWorkingHours: Math.max(1, d.maxWorkingHours - 1) })} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: '#E5E7EB', color: '#1F2937', cursor: 'pointer', fontWeight: 700 }}>-</button>
                      <span style={{ fontWeight: 700, color: '#1F2937', minWidth: 50, textAlign: 'center' }}>{d.maxWorkingHours} hrs</span>
                      <button onClick={() => updateDeviceMetric(d._id || d.id, { maxWorkingHours: d.maxWorkingHours + 1 })} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: '#E5E7EB', color: '#1F2937', cursor: 'pointer', fontWeight: 700 }}>+</button>
                    </div>
                  </div>

                  {/* Temperature Control (°C) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                    <span style={{ fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="fa-solid fa-temperature-half" style={{ color: '#EF4444' }} /> Temp:
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => updateDeviceMetric(d._id || d.id, { targetTemp: Math.max(10, (d.targetTemp || 24) - 1) })} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: '#E5E7EB', color: '#1F2937', cursor: 'pointer', fontWeight: 700 }}>-</button>
                      <span style={{ fontWeight: 700, color: '#1F2937', minWidth: 50, textAlign: 'center' }}>{d.targetTemp || 24}°C</span>
                      <button onClick={() => updateDeviceMetric(d._id || d.id, { targetTemp: Math.min(90, (d.targetTemp || 24) + 1) })} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: '#E5E7EB', color: '#1F2937', cursor: 'pointer', fontWeight: 700 }}>+</button>
                    </div>
                  </div>

                </div>

                {/* Progress Bars */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                    <span style={{ color: hoursExceeded ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 600 }}>
                      <i className="fa-regular fa-clock" style={{ marginRight: 4 }} />
                      Working Hours
                    </span>
                    <span style={{ color: hoursExceeded ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 700 }}>
                      {d.currentWorkingHours.toFixed(2)} / {d.maxWorkingHours} hrs
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${hoursPercent}%`, background: hoursExceeded ? 'var(--danger)' : hoursPercent > 80 ? 'var(--warning)' : 'var(--success)' }} />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                    <span style={{ color: energyExceeded ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 600 }}>
                      <i className="fa-solid fa-bolt" style={{ marginRight: 4 }} />
                      Energy Consumption
                    </span>
                    <span style={{ color: energyExceeded ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 700 }}>
                      {d.currentConsumption.toFixed(3)} / {d.maxEnergyConsumption} kWh
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${energyPercent}%`, background: energyExceeded ? 'var(--danger)' : energyPercent > 80 ? 'var(--warning)' : 'var(--secondary)' }} />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setEditDevice({ ...d }); setShowEdit(true); }} style={{ flex: 1, justifyContent: 'center' }}>
                    <i className="fa-regular fa-pen-to-square" /> Edit
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => restartDevice(d._id || d.id)} style={{ justifyContent: 'center' }} title="Reset counters">
                    <i className="fa-solid fa-rotate" />
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteDevice(d._id || d.id)} style={{ justifyContent: 'center' }}>
                    <i className="fa-regular fa-trash-can" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Device Modal */}
      <Modal show={showAdd} onClose={() => setShowAdd(false)} title="🔌 Register New Smart Device">
        <form onSubmit={triggerAddDevice}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Quick Pick Device Library Section */}
            <div style={{ padding: '14px', background: 'rgba(77,163,255,0.06)', borderRadius: 12, border: '1px solid rgba(77,163,255,0.15)', marginBottom: 6 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="fa-solid fa-wand-magic-sparkles" style={{ color: 'var(--secondary)' }} />
                AI Pre-Configured Device Library
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                Select a standard device template below to automatically configure optimal power limit parameters.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, maxHeight: 150, overflowY: 'auto', paddingRight: 4 }}>
                {PRESET_LIBRARY_DEVICES.map((item) => (
                  <div
                    key={item.name}
                    onClick={() => {
                      setSelectedPresetItem(item);
                      setShowPresetDetails(true);
                    }}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      background: 'var(--card-bg, #ffffff)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div style={{ width: '100%', height: 70, borderRadius: 8, background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', overflow: 'hidden' }}>
                      <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                      {item.brand}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Device Name *</label>
              <input className="form-input" placeholder="e.g. Living Room Air Conditioner" value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Device Type</label>
                <select className="form-input" value={addForm.type} onChange={e => setAddForm(p => ({ ...p, type: e.target.value }))}>
                  {DEVICE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Room / Location</label>
                <input className="form-input" placeholder="e.g. Living Room" value={addForm.location} onChange={e => setAddForm(p => ({ ...p, location: e.target.value }))} required />
              </div>
            </div>

            {/* Custom Image Upload / Preset Icon selector */}
            <div style={{ padding: 14, background: 'var(--accent)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--primary)', marginBottom: 10 }}>🖼️ Device Image & Icon</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, display: 'block' }}>Select Preset Icon</label>
                  <select className="form-input" value={addForm.imageIcon} onChange={e => setAddForm(p => ({ ...p, imageIcon: e.target.value }))}>
                    {DEVICE_ICONS.map(ic => <option key={ic.value} value={ic.value}>{ic.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, display: 'block' }}>Or Upload Custom Image</label>
                  <input type="file" accept="image/*" className="form-input" style={{ padding: '6px' }} onChange={e => handleImageUpload(e, false)} />
                </div>
              </div>
              {addForm.customImage && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src={addForm.customImage} alt="Preview" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                  <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>Custom image uploaded successfully!</span>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Power Rating (W)</label>
                <input type="number" className="form-input" value={addForm.powerRating} onChange={e => setAddForm(p => ({ ...p, powerRating: +e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Max Daily Hours</label>
                <input type="number" step="0.1" className="form-input" value={addForm.maxWorkingHours} onChange={e => setAddForm(p => ({ ...p, maxWorkingHours: +e.target.value }))} required />
              </div>
            </div>
            
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Max Daily Energy (kWh)</label>
              <input type="number" step="0.1" className="form-input" value={addForm.maxEnergyConsumption} onChange={e => setAddForm(p => ({ ...p, maxEnergyConsumption: +e.target.value }))} required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary"><i className="fa-solid fa-plug" /> Register Device</button>
          </div>
        </form>
      </Modal>

      {/* Access Request Modal */}
      <Modal show={showRequest} onClose={() => setShowRequest(false)} title="🔒 Request Device Access">
        <form onSubmit={submitRequest}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#FFFBEB', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: '#B45309', fontWeight: 600 }}>
              ⚠️ Incorrect password was entered. Please submit a request to your administrator to grant access.
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Requested Device</label>
              <input className="form-input" value={requestedName} disabled style={{ background: 'rgba(0,0,0,0.04)', opacity: 0.7 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Reason for Request</label>
              <select className="form-input" value={requestForm.reason} onChange={e => setRequestForm(p => ({ ...p, reason: e.target.value }))}>
                <option>New Device Installation</option>
                <option>Hardware Replacement</option>
                <option>Passcode Forgotten</option>
                <option>Urgent System Override</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Detailed Message to Admin</label>
              <textarea className="form-input" rows="3" placeholder="Explain why you need access..." value={requestForm.message} onChange={e => setRequestForm(p => ({ ...p, message: e.target.value }))} required style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowRequest(false)}>Close</button>
            <button type="submit" className="btn btn-danger"><i className="fa-solid fa-paper-plane" /> Submit Request</button>
          </div>
        </form>
      </Modal>

      {/* Edit Device Modal */}
      {editDevice && (
        <Modal show={showEdit} onClose={() => setShowEdit(false)} title="✏️ Edit Device Parameters">
          <form onSubmit={triggerEditDevice}>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Device Name</label>
                <input className="form-input" value={editDevice.name} onChange={e => setEditDevice(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Type</label>
                  <select className="form-input" value={editDevice.type} onChange={e => setEditDevice(p => ({ ...p, type: e.target.value }))}>
                    {DEVICE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Location</label>
                  <input className="form-input" value={editDevice.location} onChange={e => setEditDevice(p => ({ ...p, location: e.target.value }))} required />
                </div>
              </div>

              {/* Edit Image upload */}
              <div style={{ padding: 14, background: 'var(--accent)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--primary)', marginBottom: 10 }}>🖼️ Edit Image & Icon</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, display: 'block' }}>Preset Icon</label>
                    <select className="form-input" value={editDevice.imageIcon} onChange={e => setEditDevice(p => ({ ...p, imageIcon: e.target.value }))}>
                      {DEVICE_ICONS.map(ic => <option key={ic.value} value={ic.value}>{ic.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5, display: 'block' }}>Upload Custom Image</label>
                    <input type="file" accept="image/*" className="form-input" style={{ padding: '6px' }} onChange={e => handleImageUpload(e, true)} />
                  </div>
                </div>
                {editDevice.customImage && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src={editDevice.customImage} alt="Preview" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                    <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>Custom image active.</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Power Rating (W)</label>
                  <input type="number" className="form-input" value={editDevice.powerRating} onChange={e => setEditDevice(p => ({ ...p, powerRating: +e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Max Hours/Day</label>
                  <input type="number" step="0.1" className="form-input" value={editDevice.maxWorkingHours} onChange={e => setEditDevice(p => ({ ...p, maxWorkingHours: +e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Max Energy (kWh)</label>
                  <input type="number" step="0.1" className="form-input" value={editDevice.maxEnergyConsumption} onChange={e => setEditDevice(p => ({ ...p, maxEnergyConsumption: +e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary"><i className="fa-solid fa-floppy-disk" /> Save Changes</button>
            </div>
          </form>
        </Modal>
      )}

      {/* AI Smart Mismatch Assist Modal */}
      <Modal show={showAiAssist} onClose={() => setShowAiAssist(false)} title="🤖 AI Assistant: Name & Image Mismatch Detected">
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#FFFBEB', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '14px', fontSize: 13, color: '#B45309', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <i className="fa-solid fa-circle-exclamation" style={{ fontSize: 18, marginTop: 2 }} />
            <div>
              <strong>Mismatch Identified:</strong>
              <div style={{ marginTop: 6 }}>
                • Device Name: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>"{aiContext?.name}"</span>
              </div>
              <div>
                • Selected Icon: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{aiContext?.currentIconLabel}</span>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.5, opacity: 0.9 }}>
                To maintain safety audit reliability, device name patterns should align with their corresponding electrical icon parameters. Please resolve the mismatch using one of the AI assistance paths below.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
            <button type="button" className="btn btn-secondary" onClick={() => handleAiResolution('fix_image')} style={{ justifyContent: 'flex-start', padding: '12px 16px', background: 'rgba(77,163,255,0.06)' }}>
              🤖 <strong>Change Image to match Name:</strong> Auto-set to {aiContext?.expectedLabel} icon
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => handleAiResolution('fix_name')} style={{ justifyContent: 'flex-start', padding: '12px 16px', background: 'rgba(139,92,246,0.06)' }}>
              ✏️ <strong>Change Name to match Image:</strong> Rename to "{aiContext?.suggestedName}"
            </button>
            <button type="button" className="btn btn-primary" onClick={() => handleAiResolution('ai_decide')} style={{ justifyContent: 'flex-start', padding: '12px 16px' }}>
              🧠 <strong>Let AI decide (Optimize Pairing):</strong> Set Name to "{aiContext?.suggestedName}" & correct icon type
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => handleAiResolution('keep')} style={{ justifyContent: 'flex-start', padding: '12px 16px', color: 'var(--text-muted)', borderStyle: 'dashed' }}>
              ❌ <strong>Ignore & Keep Selection:</strong> Continue anyway
            </button>
          </div>
        </div>
      </Modal>

      {/* Preset Details Modal */}
      {selectedPresetItem && (
        <Modal show={showPresetDetails} onClose={() => setShowPresetDetails(false)} title="📋 Review Pre-Configured Device Details">
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'var(--accent)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.04)' }}>
                <img src={selectedPresetItem.imageUrl} alt={selectedPresetItem.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>{selectedPresetItem.name}</h4>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selectedPresetItem.type}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--accent)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Brand</span>
                <strong style={{ color: 'var(--primary)' }}>{selectedPresetItem.brand}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--accent)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Maximum Operating Time</span>
                <strong style={{ color: 'var(--primary)' }}>{selectedPresetItem.maxWorkingHours} hours/day</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--accent)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Maximum Watt Consumption</span>
                <strong style={{ color: 'var(--primary)' }}>{selectedPresetItem.powerRating} W</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--accent)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Recommended Max Energy</span>
                <strong style={{ color: 'var(--primary)' }}>{selectedPresetItem.maxEnergyConsumption} kWh/day</strong>
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {selectedPresetItem.description}
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowPresetDetails(false)}>Cancel</button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setAddForm(p => ({
                  ...p,
                  name: selectedPresetItem.name,
                  type: selectedPresetItem.type,
                  imageIcon: selectedPresetItem.imageIcon,
                  customImage: selectedPresetItem.imageUrl,
                  customImageName: selectedPresetItem.name + '.jpg',
                  powerRating: selectedPresetItem.powerRating,
                  maxWorkingHours: selectedPresetItem.maxWorkingHours,
                  maxEnergyConsumption: selectedPresetItem.maxEnergyConsumption
                }));
                setShowPresetDetails(false);
                showAlert(`Selected ${selectedPresetItem.name}! Form pre-filled successfully.`, 'success');
              }}
            >
              <i className="fa-solid fa-circle-check" /> Confirm Device
            </button>
          </div>
        </Modal>
      )}
    </LayoutWrapper>
  );
}
