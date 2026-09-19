const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://wpwgrilgfnowqphkqdrn.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'sb_publishable_HQOgJurAufg1C-NimBMxjQ_k6EURoxu';

let supabase = null;
let isConfigured = false;

// Only initialize if URL is real (not placeholder)
const isRealUrl = supabaseUrl && supabaseUrl.includes('.supabase.co') && !supabaseUrl.includes('your-project-id');

if (isRealUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    isConfigured = true;
    console.log('🔌 Supabase client initialized successfully.');
    console.log('   ➜  URL:', supabaseUrl);
  } catch (err) {
    console.error('❌ Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('⚠️  Supabase not configured. Running in Local Memory DB mode.');
  console.log('   ➜  To enable Supabase: set SUPABASE_URL in .env');
}

module.exports = {
  supabase,
  isConfigured: () => isConfigured,

  // Safety wrapper for fetching data
  fetchTable: async (tableName) => {
    if (!isConfigured) return null;
    try {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) {
        console.error(`Supabase error fetching ${tableName}:`, error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.error(`Network error fetching ${tableName}:`, err.message);
      return null;
    }
  },

  // Generic upsert (insert or update)
  upsertRecord: async (tableName, record) => {
    if (!isConfigured) return;
    try {
      let cleanRecord = { ...record };
      if (tableName === 'users') {
        const allowed = ['id', 'name', 'email', 'phone', 'password', 'userType', 'status', 'createdAt'];
        const sanitized = {};
        allowed.forEach(k => { if (cleanRecord[k] !== undefined) sanitized[k] = cleanRecord[k]; });
        cleanRecord = sanitized;
      }
      const { error } = await supabase.from(tableName).upsert(cleanRecord);
      if (error) {
        console.error(`Supabase error upserting to ${tableName}:`, error.message);
      } else {
        console.log(`✅ Successfully synced record to Supabase table: ${tableName}`);
      }
    } catch (err) {
      console.error(`Network error upserting to ${tableName}:`, err.message);
    }
  },

  // Partial update - only updates specific fields for a record by id
  updateFields: async (tableName, id, fields) => {
    if (!isConfigured) return;
    try {
      const { error } = await supabase.from(tableName).update(fields).eq('id', id);
      if (error) {
        console.error(`Supabase error updating fields in ${tableName}:`, error.message);
      }
    } catch (err) {
      console.error(`Network error updating fields in ${tableName}:`, err.message);
    }
  },

  // Delete record
  deleteRecord: async (tableName, idField, idValue) => {
    if (!isConfigured) return;
    try {
      const { error } = await supabase.from(tableName).delete().eq(idField, idValue);
      if (error) {
        console.error(`Supabase error deleting from ${tableName}:`, error.message);
      }
    } catch (err) {
      console.error(`Network error deleting from ${tableName}:`, err.message);
    }
  },

  // Direct OTP and password helpers for Serverless / Supabase resilience
  saveOtp: async (userId, otpRecord) => {
    if (!isConfigured) return;
    try {
      await supabase.from('settings').upsert({
        key: 'otp_' + userId,
        value: JSON.stringify(otpRecord)
      });
    } catch (err) {
      console.error('Error saving OTP to Supabase settings:', err.message);
    }
  },

  getOtp: async (userId) => {
    if (!isConfigured) return null;
    try {
      const { data, error } = await supabase.from('settings').select('value').eq('key', 'otp_' + userId);
      if (error || !data || data.length === 0) return null;
      return JSON.parse(data[0].value);
    } catch (err) {
      console.error('Error reading OTP from Supabase settings:', err.message);
      return null;
    }
  },

  deleteOtp: async (userId) => {
    if (!isConfigured) return;
    try {
      await supabase.from('settings').delete().eq('key', 'otp_' + userId);
    } catch (err) {
      console.error('Error deleting OTP from Supabase settings:', err.message);
    }
  },

  updateUserPassword: async (userId, hashedPassword) => {
    if (!isConfigured) return;
    try {
      const { error } = await supabase.from('users').update({ password: hashedPassword }).eq('id', userId);
      if (error) {
        console.error('Error updating password in Supabase:', error.message);
      } else {
        console.log(`✅ Successfully updated password for user ${userId} in Supabase`);
      }
    } catch (err) {
      console.error('Network error updating password in Supabase:', err.message);
    }
  }
};
