const supabaseClient = require('../src/lib/supabase');

async function checkUsers() {
  const users = await supabaseClient.fetchTable('users');
  console.log('Users in Supabase users table:', users);
}

checkUsers();
