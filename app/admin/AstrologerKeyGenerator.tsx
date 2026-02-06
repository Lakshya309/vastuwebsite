// app/admin/AstrologerKeyGenerator.tsx
'use client';

import React, { useState } from 'react';

export default function AstrologerKeyGenerator() {
  const [duration, setDuration] = useState(30);
  const [generatedKey, setGeneratedKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateKey = async () => {
    setLoading(true);
    setError('');
    setGeneratedKey('');

    try {
      const response = await fetch('/api/admin/generate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_days: duration }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate key');
      }

      setGeneratedKey(data.key);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedKey);
    // Optionally, show a "Copied!" message
  };

  return (
    <div className="p-6 my-6 bg-white border border-gray-200 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Astrologer Key Generator</h2>
      <div className="flex items-center space-x-4">
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
            Validity (Days)
          </label>
          <input
            type="number"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value, 10))}
            className="mt-1 block w-32 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            min="1"
          />
        </div>
        <button
          onClick={handleGenerateKey}
          disabled={loading}
          className="self-end px-6 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
        >
          {loading ? 'Generating...' : 'Generate Key'}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {generatedKey && (
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700">
            Generated Key:
          </label>
          <div className="flex items-center mt-1">
            <input
              type="text"
              readOnly
              value={generatedKey}
              className="flex-grow px-3 py-2 bg-gray-50 border border-gray-300 rounded-l-md shadow-sm focus:outline-none sm:text-sm"
            />
            <button
              onClick={handleCopyToClipboard}
              className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-r-md border border-l-0 border-gray-300 hover:bg-gray-300"
            >
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
