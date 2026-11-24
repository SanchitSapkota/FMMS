// src/components/map/VisitsMapView.jsx
import React, { useState, useMemo } from 'react';
import { MapPin } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

/**
 * Normalizes GPS coordinates onto a bounded map canvas so pins remain interactive
 * without requiring external map tiles. Swap in Leaflet/Mapbox later if desired.
 */
export default function VisitsMapView({ visits = [], onInspect }) {
  const located = useMemo(
    () => visits.filter((v) => v.location && typeof v.location.lat === 'number'),
    [visits]
  );
  const [selectedId, setSelectedId] = useState(located[0]?.id || null);

  const bounds = useMemo(() => {
    if (!located.length) {
      return { minLat: 27.66, maxLat: 27.71, minLng: 84.41, maxLng: 84.46 };
    }
    const lats = located.map((v) => v.location.lat);
    const lngs = located.map((v) => v.location.lng);
    const pad = 0.005;
    return {
      minLat: Math.min(...lats) - pad,
      maxLat: Math.max(...lats) + pad,
      minLng: Math.min(...lngs) - pad,
      maxLng: Math.max(...lngs) + pad,
    };
  }, [located]);

  const toPercent = (lat, lng) => {
    const x =
      ((lng - bounds.minLng) / Math.max(0.0001, bounds.maxLng - bounds.minLng)) * 84 + 8;
    const y =
      (1 - (lat - bounds.minLat) / Math.max(0.0001, bounds.maxLat - bounds.minLat)) * 78 + 11;
    return { x, y };
  };

  const selectedVisit = located.find((v) => v.id === selectedId) || located[0] || null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="relative h-96 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 lg:col-span-2">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        {located.map((visit) => {
          const { x, y } = toPercent(visit.location.lat, visit.location.lng);
          const isSelected = selectedVisit?.id === visit.id;
          return (
            <button
              key={visit.id}
              type="button"
              onClick={() => setSelectedId(visit.id)}
              style={{ left: `${x}%`, top: `${y}%` }}
              className={`group -translate-x-1/2 -translate-y-full absolute flex flex-col items-center transition ${
                isSelected ? 'z-20 scale-110' : 'z-10 hover:scale-105'
              }`}
              title={visit.businessName}
            >
              <span
                className={`rounded-full p-1.5 shadow-md ${
                  isSelected ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-200'
                }`}
              >
                <MapPin className="h-4 w-4" />
              </span>
              <span className="mt-0.5 rounded bg-slate-900/85 px-1.5 py-0.5 text-[10px] font-medium text-white whitespace-nowrap">
                {visit.businessName}
              </span>
            </button>
          );
        })}

        {!located.length && (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            No visits with GPS coordinates available.
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <h3 className="text-sm font-semibold text-slate-900">Selected Visit Pin</h3>
        {selectedVisit ? (
          <div className="mt-3 space-y-3 text-xs">
            <div>
              <p className="text-sm font-bold text-slate-900">{selectedVisit.businessName}</p>
              <p className="text-slate-500">{selectedVisit.location.address}</p>
            </div>
            <StatusBadge label={selectedVisit.outcome} />
            <p className="text-slate-600">
              <strong>Rep:</strong> {selectedVisit.repName}
            </p>
            <p className="text-slate-600">
              <strong>Coords:</strong> {selectedVisit.location.lat.toFixed(5)},{' '}
              {selectedVisit.location.lng.toFixed(5)}
            </p>
            <p className="text-slate-600">
              <strong>Time:</strong> {new Date(selectedVisit.visitedAt).toLocaleString()}
            </p>
            {onInspect && (
              <button
                type="button"
                onClick={() => onInspect(selectedVisit)}
                className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Open Full Visit Record
              </button>
            )}
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500">Click a marker on the map to inspect details.</p>
        )}
      </div>
    </div>
  );
}