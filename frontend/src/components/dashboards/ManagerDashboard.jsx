import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, ClipboardList, CheckCircle2, Map } from 'lucide-react';
import StatCard from '../common/StatCard';
import VisitStatsChart from '../charts/VisitStatsChart';
import VisitTable from '../visits/VisitTable';
import VisitsMapView from '../map/VisitsMapView';

export default function ManagerDashboard({ user, visits = [], areas = [], users = [], onSelectVisit }) {
  const convertedCount = visits.filter((v) => v.outcome === 'Converted').length;

  const teamReps = useMemo(() => {
    const reps = users.filter((u) => u.role === 'rep');
    const direct = reps.filter((r) => r.managerId && r.managerId === user?.id);
    return direct.length ? direct : reps;
  }, [users, user?.id]);

  const repVisitCounts = useMemo(() => {
    return teamReps.map((rep) => ({
      ...rep,
      visitCount: visits.filter(
        (v) => v.repId === rep.id || v.repName?.toLowerCase() === rep.name?.toLowerCase()
      ).length,
    }));
  }, [teamReps, visits]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 sm:p-5">
        <div>
          <span className="inline-block rounded-full bg-indigo-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
            Territory Manager Hub
          </span>
          <h1 className="mt-1.5 text-xl font-bold text-slate-900">{user?.name} — Team Overview</h1>
          <p className="text-xs text-slate-600">
            Supervising territory: <strong>{user?.area || 'Assigned Region'}</strong> • {areas.length} active areas
          </p>
        </div>

        <Link
          to="/map"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700"
        >
          Open Full Territory Map
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Territory Visits"
          value={visits.length}
          subtitle="Visits across your scope"
          icon={ClipboardList}
        />
        <StatCard
          title="Team Conversions"
          value={convertedCount}
          subtitle="Converted business leads"
          icon={CheckCircle2}
        />
        <StatCard
          title="Active Field Reps"
          value={teamReps.length}
          subtitle="Representatives in roster"
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <VisitStatsChart visits={visits} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900">Visits by Representative</h2>
          <div className="mt-3 divide-y divide-slate-100 text-sm">
            {repVisitCounts.length ? (
              repVisitCounts.map((rep) => (
                <div key={rep.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="font-medium text-slate-800">{rep.name}</p>
                    <p className="text-xs text-slate-500">{rep.area || 'Field Zone'}</p>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    {rep.visitCount} visits
                  </span>
                </div>
              ))
            ) : (
              <p className="py-4 text-xs text-slate-500">No representative records found.</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Territory Visit Map</h2>
        <VisitsMapView visits={visits} onInspect={onSelectVisit} />
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Recent Territory Visits</h2>
        <VisitTable visits={visits.slice(0, 6)} onSelect={onSelectVisit} />
      </div>
    </div>
  );
}