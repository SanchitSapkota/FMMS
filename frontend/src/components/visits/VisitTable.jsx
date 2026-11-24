// src/components/visits/VisitTable.jsx
import React from 'react';
import StatusBadge from '../common/StatusBadge';

export default function VisitTable({ visits, onSelect }) {
  if (!visits.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        No visit records match the selected filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Business</th>
            <th className="px-4 py-3">Rep</th>
            <th className="px-4 py-3">Area</th>
            <th className="px-4 py-3">Outcome</th>
            <th className="px-4 py-3">Date & Time</th>
            <th className="px-4 py-3 text-right">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {visits.map((v) => (
            <tr key={v.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{v.businessName}</p>
                <p className="text-xs text-slate-500">{v.ownerName || '—'}</p>
              </td>
              <td className="px-4 py-3 text-slate-700">{v.repName}</td>
              <td className="px-4 py-3 text-slate-600">{v.area || '—'}</td>
              <td className="px-4 py-3">
                <StatusBadge label={v.outcome} />
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {new Date(v.visitedAt).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  type="button"
                  onClick={() => onSelect(v)}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}