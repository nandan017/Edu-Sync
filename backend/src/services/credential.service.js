const crypto = require('crypto');

const ALGO = 'aes-256-cbc';

function getKeyAndIV() {
  const key = Buffer.from(process.env.CREDENTIAL_ENCRYPTION_KEY, 'hex').slice(0, 32);
  // Pad key to 32 bytes if shorter
  const paddedKey = Buffer.alloc(32);
  key.copy(paddedKey);
  return paddedKey;
}

function encrypt(text) {
  const key = getKeyAndIV();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText) {
  const key = getKeyAndIV();
  const [ivHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Generate a random password: 8 chars, mix of upper+lower+digits
function generatePassword() {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const all = upper + lower + digits;
  let pass = '';
  pass += upper[Math.floor(Math.random() * upper.length)];
  pass += lower[Math.floor(Math.random() * lower.length)];
  pass += digits[Math.floor(Math.random() * digits.length)];
  for (let i = 3; i < 8; i++) pass += all[Math.floor(Math.random() * all.length)];
  return pass.split('').sort(() => Math.random() - 0.5).join('');
}

// Generate username from full name: firstname.lastname (lowercase)
function generateUsername(fullName, existingUsernames = []) {
  const parts = fullName.trim().toLowerCase().split(/\s+/);
  let base = parts.length >= 2 ? `${parts[0]}.${parts[parts.length - 1]}` : parts[0];
  base = base.replace(/[^a-z0-9.]/g, '');
  let username = base;
  let counter = 1;
  while (existingUsernames.includes(username)) {
    username = `${base}${counter}`;
    counter++;
  }
  return username;
}

module.exports = { encrypt, decrypt, generatePassword, generateUsername };
