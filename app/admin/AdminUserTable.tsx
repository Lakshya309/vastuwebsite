// app/admin/AdminUserTable.tsx
'use client';

import React, { useState } from 'react';

interface UserData {
  id: string;
  email: string | null;
  role: string;
  credits: number;
  valid_from: string | null;
  valid_to: string | null;
}

interface AdminUserTableProps {
  users: UserData[];
}

export default function AdminUserTable({ users: initialUsers }: AdminUserTableProps) {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [validFrom, setValidFrom] = useState<string>('');
  const [validTo, setValidTo] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleEditClick = (user: UserData) => {
    setEditingUserId(user.id);
    setNewRole(user.role);
    setCreditAmount(0); // Reset for new credit adjustments
    setValidFrom(user.valid_from ? new Date(user.valid_from).toISOString().split('T')[0] : '');
    setValidTo(user.valid_to ? new Date(user.valid_to).toISOString().split('T')[0] : '');
    setMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setMessage(null);
  };

  const callAdminApi = async (action: string, body: any) => {
    setMessage(null); // Clear previous messages
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...body }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      setMessage({ type: 'success', text: data.message });
      // Re-fetch users after successful action
      window.location.reload(); 
    } catch (error: any) {
      console.error("Admin API error:", error);
      setMessage({ type: 'error', text: error.message || 'An unknown error occurred.' });
    }
  };

  const handleUpdateRole = async (userId: string) => {
    await callAdminApi('updateRole', { userId, newRole });
  };

  const handleAdjustCredits = async (userId: string) => {
    await callAdminApi('adjustCredits', { userId, amount: creditAmount });
  };

  const handleUpdateAstrologerAccess = async (userId: string) => {
    await callAdminApi('updateAstrologerAccess', { userId, validFrom: validFrom + 'T00:00:00Z', validTo: validTo + 'T23:59:59Z' });
  };

  return (
    <div className="overflow-x-auto">
      {message && (
        <div className={`p-3 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">ID</th>
            <th className="py-2 px-4 border-b">Email</th>
            <th className="py-2 px-4 border-b">Role</th>
            <th className="py-2 px-4 border-b">Credits</th>
            <th className="py-2 px-4 border-b">Valid From</th>
            <th className="py-2 px-4 border-b">Valid To</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <React.Fragment key={user.id}>
              <tr>
                <td className="py-2 px-4 border-b text-sm">{user.id}</td>
                <td className="py-2 px-4 border-b text-sm">{user.email || 'N/A'}</td>
                <td className="py-2 px-4 border-b text-sm">{user.role}</td>
                <td className="py-2 px-4 border-b text-sm">{user.credits}</td>
                <td className="py-2 px-4 border-b text-sm">
                  {user.valid_from ? new Date(user.valid_from).toLocaleDateString() : 'N/A'}
                </td>
                <td className="py-2 px-4 border-b text-sm">
                  {user.valid_to ? new Date(user.valid_to).toLocaleDateString() : 'N/A'}
                </td>
                <td className="py-2 px-4 border-b text-sm">
                  <button
                    onClick={() => handleEditClick(user)}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs mr-2"
                  >
                    Edit
                  </button>
                </td>
              </tr>
              {editingUserId === user.id && (
                <tr className="bg-gray-50">
                  <td colSpan={7} className="p-4 border-b">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Role Editor */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Change Role</label>
                        <select
                          value={newRole}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="user">User</option>
                          <option value="astrologer">Astrologer</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleUpdateRole(user.id)}
                          className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-xs"
                        >
                          Update Role
                        </button>
                      </div>

                      {/* Credits Adjuster */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Adjust Credits</label>
                        <input
                          type="number"
                          value={creditAmount}
                          onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                          className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                        />
                        <button
                          onClick={() => handleAdjustCredits(user.id)}
                          className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-xs"
                        >
                          Apply Credits
                        </button>
                      </div>

                      {/* Astrologer Access Dates */}
                      {newRole === 'astrologer' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Valid From</label>
                          <input
                            type="date"
                            value={validFrom}
                            onChange={(e) => setValidFrom(e.target.value)}
                            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                          />
                          <label className="block text-sm font-medium text-gray-700 mt-2">Valid To</label>
                          <input
                            type="date"
                            value={validTo}
                            onChange={(e) => setValidTo(e.target.value)}
                            className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                          />
                          <button
                            onClick={() => handleUpdateAstrologerAccess(user.id)}
                            className="mt-2 bg-green-600 text-white px-3 py-1 rounded text-xs"
                          >
                            Update Access
                          </button>
                        </div>
                      )}

                      <div className="md:col-span-3 text-right">
                        <button
                          onClick={handleCancelEdit}
                          className="bg-gray-500 text-white px-3 py-1 rounded text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}