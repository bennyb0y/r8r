'use client';

import { useState, useEffect } from 'react';
import { generateUserEmoji, validatePassword, UserIdentity } from '../utils/auth';

interface Props {
  onIdentitySubmit: (identity: UserIdentity) => void;
}

export default function UserIdentityForm({ onIdentitySubmit }: Props) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [emoji, setEmoji] = useState('');
  const [error, setError] = useState('');

  // Update emoji when password changes
  useEffect(() => {
    if (validatePassword(password)) {
      setEmoji(generateUserEmoji(password));
      setError('');
    } else {
      setEmoji('');
      if (password.length > 0) {
        setError('Password must be at least 4 characters');
      } else {
        setError('');
      }
    }
  }, [password]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!validatePassword(password)) {
      setError('Password must be at least 4 characters');
      return;
    }

    onIdentitySubmit({
      name: name.trim(),
      emoji
    });
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Welcome to Burrito Rater</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Your Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter your name"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="4-10 characters for your unique emoji identity"
            maxLength={10}
          />
        </div>

        {emoji && (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Your unique identifier:</p>
            <span className="text-4xl" role="img" aria-label="User emoji">
              {emoji}
            </span>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={!validatePassword(password) || !name.trim()}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${validatePassword(password) && name.trim()
              ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              : 'bg-gray-400 cursor-not-allowed'
            }`}
        >
          Continue
        </button>
      </form>
    </div>
  );
} 