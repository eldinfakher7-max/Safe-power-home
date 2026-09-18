const supabaseClient = require('../src/lib/supabase');
const bcrypt = require('bcryptjs');

async function updateEmail(adminVerificationPassword) {
  console.log('🔒 Verifying Admin Verification Password...');
  
  const expectedPassword = process.env.ADMIN_VERIFICATION_PASSWORD || process.env.LOGIN_PASSWORD || 'fakherkoky@2010';

  if (!adminVerificationPassword || adminVerificationPassword !== expectedPassword) {
    console.error('❌ REJECTED: Invalid admin verification password.');
    process.exit(1);
  }

  console.log('✅ Admin verification password accepted.');

  try {
    const users = (await supabaseClient.fetchTable('users')) || [];
    
    // Find existing account by ID or email
    let targetUser = users.find(u => 
      u.id === 'user_eyad_ai' || 
      (u.email || '').toLowerCase() === 'eyadfakherahmed@gmail.com' ||
      (u.email || '').toLowerCase() === 'fakher-eyad-ahmed@gmail.com'
    );

    if (targetUser) {
      console.log(`Found existing user account (ID: ${targetUser.id}, Current Email: ${targetUser.email})`);
      targetUser.email = 'Fakher-Eyad-Ahmed@gmail.com';
    } else {
      console.log('Creating/initializing dedicated user account with new email...');
      const hashedPassword = await bcrypt.hash('fakherkoky@2010', 10);
      targetUser = {
        id: 'user_eyad_ai',
        name: 'Eyad Fakher Ahmed',
        email: 'Fakher-Eyad-Ahmed@gmail.com',
        phone: '01068710846',
        password: hashedPassword,
        userType: 'Admin',
        status: 'Active',
        createdAt: new Date().toISOString()
      };
    }

    // Persist to Supabase
    await supabaseClient.upsertRecord('users', targetUser);
    console.log('✅ Account successfully saved to Supabase with email: Fakher-Eyad-Ahmed@gmail.com');

    // Verification step
    const refreshed = await supabaseClient.fetchTable('users');
    const verifiedUser = refreshed.find(u => u.email === 'Fakher-Eyad-Ahmed@gmail.com' || u.id === targetUser.id);

    if (verifiedUser && verifiedUser.email === 'Fakher-Eyad-Ahmed@gmail.com') {
      console.log('\n🎉 VERIFICATION SUCCESSFUL:');
      console.log(`   ID: ${verifiedUser.id}`);
      console.log(`   Name: ${verifiedUser.name}`);
      console.log(`   Email: ${verifiedUser.email}`);
      console.log(`   UserType: ${verifiedUser.userType}`);
      console.log(`   Status: ${verifiedUser.status}`);
    } else {
      console.error('❌ VERIFICATION FAILED: Email does not match in database.');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Update failed with error:', err.message);
    process.exit(1);
  }
}

const passwordArg = process.argv[2];
updateEmail(passwordArg);
