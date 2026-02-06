// app/activate/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ActivatePage() {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleActivateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/astrologer/activate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to activate key');
      }

      setSuccess(data.message);
      // Redirect to portal after a short delay
      setTimeout(() => {
        router.push('/portal');
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900">Activate Astrologer Key</h1>
        
        <form onSubmit={handleActivateKey} className="space-y-6">
          <div>
            <label htmlFor="key" className="block text-sm font-medium text-gray-700">
              Activation Key
            </label>
            <input
              id="key"
              name="key"
              type="text"
              required
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="ASTRO-XXXX-XXXX-XXXX"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
            >
              {loading ? 'Activating...' : 'Activate'}
            </button>
          </div>
        </form>

        {error && <p className="text-center text-sm text-red-600">{error}</p>}
        {success && <p className="text-center text-sm text-green-600">{success}</p>}

        <p className="text-center text-sm text-gray-600">
          <Link href="/portal" className="font-medium text-indigo-600 hover:text-indigo-500">
            ← Back to Portal
          </Link>
        </p>
      </div>
    </div>
  );
}
