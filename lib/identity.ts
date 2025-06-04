import { createHash } from 'crypto';

export function generateIdentity(username: string | null | undefined, password: string | null | undefined) {
  // Clean and validate inputs
  const cleanUsername = username ? String(username).trim() : '';
  const cleanPassword = password ? String(password).trim() : '';
  
  console.log('Generating identity with:', {
    originalUsername: username,
    originalPassword: password,
    cleanUsername,
    cleanPassword
  });
  
  // If neither is provided, return null values
  if (!cleanUsername && !cleanPassword) {
    console.log('No inputs provided, returning null values');
    return { hash: null, emoji: null, display: null };
  }
  
  // Generate separate hashes for username and password
  const usernameHash = cleanUsername ? createHash('sha256').update(cleanUsername).digest('hex') : '';
  const passwordHash = cleanPassword ? createHash('sha256').update(cleanPassword).digest('hex') : '';
  
  console.log('Generated hashes:', {
    usernameHash,
    passwordHash
  });
  
  // Combine the hashes
  const combinedHash = `${usernameHash}:${passwordHash}`;
  console.log('Combined hash:', combinedHash);
  
  // Generate final hash and emoji
  const hash = createHash('sha256').update(combinedHash).digest('hex');
  const emoji = getEmojiFromHash(hash);
  const hashSuffix = hash.slice(-4); // Get last 4 characters of the hash
  
  // Create display string with emoji and hash suffix
  const display = `${emoji} <span style="font-size: 0.7em; color: #666;">${hashSuffix}</span>`;
  
  console.log('Final result:', { hash, emoji, hashSuffix, display });
  return { hash, emoji, display };
}

function getEmojiFromHash(hash: string): string {
  // Use the first 4 characters of the hash to select an emoji
  const emojiIndex = parseInt(hash.slice(0, 4), 16) % 100;
  const emojis = ['🌮', '🌯', '🌮', '🌯', '🌮', '🌯', '🌮', '🌯', '🌮', '🌯'];
  return emojis[emojiIndex % emojis.length];
} 