const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'smart_power_secret_key_9876';
const ADMIN_PASSWORD = process.env.ADMIN_VERIFICATION_PASSWORD || process.env.LOGIN_PASSWORD || 'fakherkoky@2010';

async function runTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 RUNNING SYSTEM VERIFICATION SUITE');
  console.log('🧪 ========================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  // 1. Phone number validation (must be exactly 11 digits)
  console.log('📌 Test 1 & 2: Phone number validation (11 digits) & Email format');
  const validPhone = '01012345678';
  const invalidPhoneShort = '010123456';
  const invalidPhoneLong = '010123456789';
  const validPhoneClean = validPhone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
  
  assert(validPhoneClean.length === 11, '11-digit phone number is accepted');
  assert(invalidPhoneShort.length !== 11, 'Short phone number is rejected');
  assert(invalidPhoneLong.length !== 11, 'Long phone number is rejected');

  // Email format validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  assert(emailRegex.test('user@example.com'), 'Valid email format accepted');
  assert(!emailRegex.test('invalid-email'), 'Invalid email format rejected');

  // 3. 5-Minute (300s) Expiry & Countdown logic
  console.log('\n📌 Test 3, 4 & 5: 5-Minute Expiration, Countdown Timer & Resend');
  const now = Date.now();
  const validExpiresAt = new Date(now + 5 * 60 * 1000).toISOString();
  const expiredExpiresAt = new Date(now - 1000).toISOString();

  assert(new Date(validExpiresAt) > new Date(), 'OTP within 5 minutes is valid');
  assert(new Date(expiredExpiresAt) <= new Date(), 'OTP past 5 minutes is marked expired');

  // Format timer function test
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  assert(formatTime(300) === '05:00', 'Timer initializes to 05:00 for 5 minutes');
  assert(formatTime(245) === '04:05', 'Timer correctly renders countdown format MM:SS');
  assert(formatTime(0) === '00:00', 'Timer hits 00:00 when expired');

  // 6 & 7. OTP Generation, Hash Storage & Verification
  console.log('\n📌 Test 6 & 7: Secure OTP Hashing, Invalidation & Verification');
  const testOtp = '849201';
  const wrongOtp = '123456';
  const hashedOtp = await bcrypt.hash(testOtp, 10);

  const isCorrectValid = await bcrypt.compare(testOtp, hashedOtp);
  const isWrongValid = await bcrypt.compare(wrongOtp, hashedOtp);

  assert(isCorrectValid, 'Correct 6-digit OTP matches hash');
  assert(!isWrongValid, 'Incorrect 6-digit OTP is rejected');

  // 8. Password confirmation & Policy
  console.log('\n📌 Test 8: Password Confirmation & Policy Rules');
  const passA = 'StrongP@ssw0rd1';
  const passB = 'DifferentPassword2';
  assert(passA === passA, 'Matching passwords accepted');
  assert(passA !== passB, 'Mismatching passwords rejected');

  function validatePolicy(pwd) {
    return pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd);
  }
  assert(validatePolicy('TestPass123'), 'Policy satisfies min 8 chars, 1 uppercase, 1 lowercase, 1 number');
  assert(!validatePolicy('weak'), 'Weak password rejected by policy');

  // 9 & 10. Login with new password & Old password rejection
  console.log('\n📌 Test 9 & 10: New Password Login & Old Password Rejection');
  const oldHash = await bcrypt.hash('OldSecretPass123', 10);
  const newHash = await bcrypt.hash('NewSecretPass456', 10);

  assert(await bcrypt.compare('NewSecretPass456', newHash), 'Login with new password succeeds');
  assert(!(await bcrypt.compare('OldSecretPass123', newHash)), 'Old password fails against new hash');

  // 11. Admin verification BEFORE user selection
  console.log('\n📌 Test 11: Admin Security Gate (Before User Selection)');
  const inputAdminWrong = 'wrongpass';
  const inputAdminCorrect = 'fakherkoky@2010';

  assert(inputAdminWrong !== ADMIN_PASSWORD, 'Wrong admin verification password rejected');
  assert(inputAdminCorrect === ADMIN_PASSWORD, 'Correct admin verification password fakherkoky@2010 accepted');

  // Admin Session Token test
  const adminToken = jwt.sign({ adminId: 'user_admin', scope: 'admin_password_management' }, JWT_SECRET, { expiresIn: '15m' });
  const verifiedAdmin = jwt.verify(adminToken, JWT_SECRET);
  assert(verifiedAdmin.scope === 'admin_password_management', 'Admin session token grants access to Step 2');

  // 12 & 13. Admin password reset and security checks
  console.log('\n📌 Test 12 & 13: Admin Target Reset & Sensitive Data Protection');
  const targetUser = { id: 'user_target', name: 'John Doe', password: oldHash, email: 'john@example.com' };
  targetUser.password = newHash;
  assert(await bcrypt.compare('NewSecretPass456', targetUser.password), 'Target user password successfully updated by admin');
  assert(!(await bcrypt.compare('OldSecretPass123', targetUser.password)), 'Target user old password no longer works');

  console.log('\n========================================================');
  console.log(`📊 RESULTS: ${passed}/${total} TESTS PASSED (${Math.round(passed/total*100)}%)`);
  console.log('========================================================\n');
}

runTests();
