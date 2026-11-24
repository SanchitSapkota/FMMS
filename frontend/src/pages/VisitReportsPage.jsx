// src/pages/VisitReportsPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import { visitService } from '../services/visitService';
import VisitFilters from '../components/visits/VisitFilters';
import VisitTable from '../components/visits/VisitTable';
import VisitDetailModal from '../components/visits/VisitDetailModal';

export default function VisitReportsPage() {
  const [visits, setVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    area: 'ALL',
    outcome: 'ALL',
    date: '',
  });

  useEffect(() => {
    visitService.list(filters).then(setVisits);
  }, [filters]);

  const areas = useMemo(
    () => Array.from(new Set(visits.map((v) => v.area).filter(Boolean))),
    [visits]
  );

  const exportCsv = () => {
    const headers = ['Business', 'Owner', 'Rep', 'Area', 'Outcome', 'VisitedAt', 'Lat', 'Lng'];
    const rows = visits.map((v) => [
      v.businessName,
      v.ownerName || '',
      v.repName || '',
      v.area || '',
      v.outcome || '',
      v.visitedAt || '',
      v.location?.lat ?? '',
      v.location?.lng ?? '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visits_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Visit Reports</h1>
          <p className="text-xs text-slate-500">Search, filter, and inspect recorded visits</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <VisitFilters filters={filters} onChange={setFilters} areas={areas} />
      <VisitTable visits={visits} onSelect={setSelectedVisit} />
      <VisitDetailModal visit={selectedVisit} onClose={() => setSelectedVisit(null)} />
    </div>
  );
}