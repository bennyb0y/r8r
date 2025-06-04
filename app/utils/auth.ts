// Simple hash function that returns a number between 0 and max-1
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// List of emojis organized by categories
const userEmojis = {
  animals: [
    '🦊', '🐼', '🐨', '🦁', '🐯', '🐮', '🐷', '🐸',
    '🐙', '🦄', '🦋', '🐢', '🐬', '🦈', '🦭', '🦩',
    '🦜', '🐝', '🦖', '🐳', '🦚', '🦡', '🦨', '🦦'
  ],
  food: [
    '🌮', '🌯', '🍕', '🍔', '🍟', '🌭', '🍿', '🍪',
    '🍩', '🍰', '🍦', '🍨', '🍧', '🍫', '🍬', '🍭'
  ],
  faces: [
    '😊', '😎', '🤓', '😇', '🤠', '🤡', '🤖', '👻',
    '👽', '🤖', '🤪', '🤨', '🧐', '🤓', '😋', '🤤'
  ],
  nature: [
    '🌲', '🌳', '🌴', '🌵', '🌷', '🌸', '🌹', '🌺',
    '🌻', '🌼', '🌽', '🌾', '🌿', '🍀', '🍁', '🍂'
  ],
  objects: [
    '🎮', '🎲', '🎯', '🎨', '🎭', '🎪', '🎟️', '🎠',
    '🎡', '🎢', '🎣', '🎤', '🎧', '🎨', '🎩', '🎪'
  ]
};

export function validatePassword(password: string): boolean {
  return password.length >= 4 && password.length <= 10;
}

export function generateUserEmoji(password: string): string {
  if (!validatePassword(password)) {
    throw new Error('Password must be between 4 and 10 characters');
  }

  const hash = simpleHash(password);
  
  // Use different parts of the hash to select category and emoji
  const categoryIndex = hash % Object.keys(userEmojis).length;
  const category = Object.keys(userEmojis)[categoryIndex];
  const emojiList = userEmojis[category as keyof typeof userEmojis];
  const emojiIndex = (hash >> 8) % emojiList.length;
  
  return emojiList[emojiIndex];
}

// Type for the user identity
export interface UserIdentity {
  name: string;
  emoji: string;
} 