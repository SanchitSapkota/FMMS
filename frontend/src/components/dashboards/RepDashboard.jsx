import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, CheckCircle2, Camera, PlusCircle, MapPin, CalendarClock } from 'lucide-react';
import StatCard from '../common/StatCard';
import StatusBadge from '../common/StatusBadge';
import VisitStatsChart from '../charts/VisitStatsChart';
import VisitTable from '../visits/VisitTable';

export default function RepDashboard({ user, visits = [], areas = [], followUps = [], onSelectVisit }) {
  const convertedCount = visits.filter((v) => v.outcome === 'Converted').length;
  const photosCount = visits.reduce((acc, v) => acc + (v.photos?.length || 0), 0);

  const myFollowUps = followUps.filter(
    (f) => !f.repName || f.repName.toLowerCase() === (user?.name || '').toLowerCase()
  );

  const assignedAreas = areas.filter(
    (a) =>
      a.assignedRep?.toLowerCase() === (user?.name || '').toLowerCase() ||
      (user?.area && a.name?.toLowerCase().includes(user.area.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5">
        <div>
          <span className="inline-block rounded-full bg-emerald-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
            Representative Field Console
          </span>
          <h1 className="mt-1.5 text-xl font-bold text-slate-900">Welcome, {user?.name}</h1>
          <p className="text-xs text-slate-600">
            Assigned Territory: <strong>{user?.area || 'General Field Zone'}</strong> • Personal visit & follow-up hub
          </p>
        </div>

        <Link
          to="/visits/new"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700"
        >
          <PlusCircle className="h-4 w-4" />
          Log New Visit
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="My Recorded Visits"
          value={visits.length}
          subtitle="Visits logged by you"
          icon={ClipboardList}
        />
        <StatCard
          title="My Conversions"
          value={convertedCount}
          subtitle="Converted shop visits"
          icon={CheckCircle2}
        />
        <StatCard
          title="My Visit Photos"
          value={photosCount}
          subtitle="GPS & timestamped captures"
          icon={Camera}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <VisitStatsChart visits={visits} />
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">My Territory Targets</h2>
          </div>

          {assignedAreas.length ? (
            <div className="space-y-3">
              {assignedAreas.map((area) => {
                const pct = Math.min(
                  100,
                  Math.round(((area.completedVisits || 0) / Math.max(1, area.targetVisits || 1)) * 100)
                );
                return (
                  <div key={area.id} className="rounded-lg bg-slate-50 p-3 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{area.name}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full bg-emerald-600" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-slate-500">
                      {area.completedVisits || 0} / {area.targetVisits || 0} target visits
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Active Zone: <strong>{user?.area || 'Unassigned'}</strong>
            </p>
          )}

          <div className="border-t border-slate-100 pt-3">
            <div className="mb-2 flex items-center gap-1.5">
              <CalendarClock className="h-4 w-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase text-slate-700">My Follow-Ups</h3>
            </div>
            {myFollowUps.length ? (
              <div className="space-y-2 text-xs">
                {myFollowUps.slice(0, 3).map((fu) => (
                  <div key={fu.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-2">
                    <div>
                      <p className="font-medium text-slate-800">{fu.targetName}</p>
                      <p className="text-[11px] text-slate-500">Due: {fu.dueDate}</p>
                    </div>
                    <StatusBadge label={fu.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No pending follow-ups assigned.</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">My Recent Visits</h2>
        <VisitTable visits={visits.slice(0, 5)} onSelect={onSelectVisit} />
      </div>
    </div>
  );
}