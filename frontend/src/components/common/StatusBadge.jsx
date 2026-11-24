// src/components/common/StatusBadge.jsx
import React from 'react';

const STYLES = {
  Converted: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Won: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Interested: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Proposal Sent': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Follow-Up Needed': 'bg-amber-100 text-amber-800 border-amber-200',
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Not Interested': 'bg-rose-100 text-rose-800 border-rose-200',
};

export default function StatusBadge({ label }) {
  const cls = STYLES[label] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}