// src/pages/AreasPage.jsx
import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';

export default function AreasPage() {
  const [areas, setAreas] = useState([]);
  const [form, setForm] = useState({ name: '', assignedRep: 'Rohan Thapa', targetVisits: 25 });

  const loadAreas = () => adminService.getAreas().then(setAreas);

  useEffect(() => {
    loadAreas();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await adminService.createArea({ ...form, targetVisits: Number(form.targetVisits) || 20 });
    setForm({ name: '', assignedRep: 'Rohan Thapa', targetVisits: 25 });
    loadAreas();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Marketing Areas</h1>
        <p className="text-xs text-slate-500">Territories, assigned representatives, and visit targets</p>
      </div>

      <form
        onSubmit={handleAdd}
        className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-4"
      >
        <input
          type="text"
          placeholder="Area / Zone name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Assigned Rep"
          value={form.assignedRep}
          onChange={(e) => setForm({ ...form, assignedRep: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
          placeholder="Target visits"
          value={form.targetVisits}
          onChange={(e) => setForm({ ...form, targetVisits: e.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Add Area
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {areas.map((a) => (
          <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="font-bold text-slate-900">{a.name}</p>
            <p className="mt-1 text-xs text-slate-500">Assigned: {a.assignedRep}</p>
            <p className="mt-3 text-xs font-medium text-slate-700">
              Progress: {a.completedVisits} / {a.targetVisits} visits
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}