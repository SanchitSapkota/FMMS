// src/pages/AdminUsersPage.jsx
import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { ROLES, ROLE_LABELS } from '../config/roles';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: ROLES.REP,
    area: 'Central Commercial Zone',
  });

  const loadAll = async () => {
    const [u, l] = await Promise.all([adminService.getUsers(), adminService.getActivityLogs()]);
    setUsers(u);
    setLogs(l);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    await adminService.createUser(form);
    setForm({ name: '', email: '', role: ROLES.REP, area: 'Central Commercial Zone' });
    loadAll();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Users & Activity Logs</h1>
        <p className="text-xs text-slate-500">Manage representatives, managers, and audit trail</p>
      </div>

      <form
        onSubmit={handleCreateUser}
        className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-5"
      >
        <input
          type="text"
          placeholder="Full name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="email"
          placeholder="Email *"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value={ROLES.REP}>{ROLE_LABELS[ROLES.REP]}</option>
          <option value={ROLES.MANAGER}>{ROLE_LABELS[ROLES.MANAGER]}</option>
          <option value={ROLES.ADMIN}>{ROLE_LABELS[ROLES.ADMIN]}</option>
        </select>
        <input
          type="text"
          placeholder="Assigned area"
          value={form.area}
          onChange={(e) => setForm({ ...form, area: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Create User
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Area</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3 text-slate-700">{ROLE_LABELS[u.role] || u.role}</td>
                <td className="px-4 py-3 text-slate-600">{u.area}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <h2 className="mb-3 text-sm font-bold text-slate-900">Activity Audit Logs</h2>
        <div className="divide-y divide-slate-100 text-xs">
          {logs.map((log) => (
            <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div>
                <span className="font-semibold text-slate-800">{log.actor}</span> —{' '}
                <span className="font-mono text-indigo-700">{log.action}</span>: {log.detail}
              </div>
              <span className="text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}