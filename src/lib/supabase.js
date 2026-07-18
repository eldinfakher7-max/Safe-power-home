const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;
let isConfigured = false;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    });
    isConfigured = true;
    console.log('🔌 Supabase client initialized successfully.');
  } catch (err) {
    console.error('❌ Failed to initialize Supabase client:', err.message);
  }
} else {
  console.log('⚠️ Supabase URL or Key not set. Running in Local Memory Database mode.');
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
      // Map _id/id field
      const cleanRecord = { ...record };
      const { error } = await supabase.from(tableName).upsert(cleanRecord);
      if (error) {
        console.error(`Supabase error upserting to ${tableName}:`, error.message);
      }
    } catch (err) {
      console.error(`Network error upserting to ${tableName}:`, err.message);
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
  }
};
