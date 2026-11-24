// src/components/visits/VisitFilters.jsx
import React from 'react';
import { Search } from 'lucide-react';

export default function VisitFilters({ filters, onChange, areas = [] }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => update('search', e.target.value)}
          placeholder="Search shop, owner, rep..."
          className="w-full rounded-lg border border-slate-300 py-1.5 pr-3 pl-9 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <select
        value={filters.area || 'ALL'}
        onChange={(e) => update('area', e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
      >
        <option value="ALL">All Areas</option>
        {areas.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      <select
        value={filters.outcome || 'ALL'}
        onChange={(e) => update('outcome', e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
      >
        <option value="ALL">All Outcomes</option>
        <option value="Interested">Interested</option>
        <option value="Follow-Up Needed">Follow-Up Needed</option>
        <option value="Converted">Converted</option>
        <option value="Not Interested">Not Interested</option>
      </select>

      <input
        type="date"
        value={filters.date || ''}
        onChange={(e) => update('date', e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
      />
    </div>
  );
}