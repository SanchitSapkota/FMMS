import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ClipboardList, Users, MapPin } from 'lucide-react';
import StatCard from '../common/StatCard';
import VisitStatsChart from '../charts/VisitStatsChart';
import VisitTable from '../visits/VisitTable';

export default function AdminDashboard({ user, visits = [], areas = [], users = [], onSelectVisit }) {
  const totalTarget = areas.reduce((sum, a) => sum + (Number(a.targetVisits) || 0), 0);
  const totalCompleted = areas.reduce((sum, a) => sum + (Number(a.completedVisits) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-slate-900 p-4 text-white sm:p-5">
        <div>
          <span className="inline-block rounded-full bg-indigo-500 px-2.5 py-0.5 text-[11px] font-semibold text-white">
            {user?.role === 'super_admin' ? 'Super Admin Control Center' : 'Admin Control Center'}
          </span>
          <h1 className="mt-1.5 text-xl font-bold">{user?.name}</h1>
          <p className="text-xs text-slate-300">
            System-wide operations, user permissions, territories, and audit visibility
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100"
          >
            <ShieldCheck className="h-4 w-4" />
            Manage Users & Logs
          </Link>
          <Link
            to="/areas"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-600 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <MapPin className="h-4 w-4" />
            Configure Areas
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="All System Visits"
          value={visits.length}
          subtitle="Across all representatives"
          icon={ClipboardList}
        />
        <StatCard
          title="Total Users"
          value={users.length}
          subtitle="Admins, managers & reps"
          icon={Users}
        />
        <StatCard
          title="Area Target Progress"
          value={`${totalCompleted} / ${totalTarget || 0}`}
          subtitle={`Across ${areas.length} marketing areas`}
          icon={MapPin}
        />
      </div>

      <VisitStatsChart visits={visits} />

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Latest System-Wide Visits</h2>
        <VisitTable visits={visits.slice(0, 6)} onSelect={onSelectVisit} />
      </div>
    </div>
  );
}