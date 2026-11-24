// src/components/visits/VisitDetailModal.jsx
import React from 'react';
import Modal from '../common/Modal';
import StatusBadge from '../common/StatusBadge';

export default function VisitDetailModal({ visit, onClose }) {
  if (!visit) return null;

  return (
    <Modal open={Boolean(visit)} title={visit.businessName} onClose={onClose}>
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusBadge label={visit.outcome} />
          <span className="text-xs text-slate-500">
            Logged by <strong>{visit.repName}</strong> • {new Date(visit.visitedAt).toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-3.5 text-xs sm:grid-cols-2">
          <p>
            <strong>Owner:</strong> {visit.ownerName || 'N/A'}
          </p>
          <p>
            <strong>Phone:</strong> {visit.phone || 'N/A'}
          </p>
          <p>
            <strong>Category:</strong> {visit.category || 'N/A'}
          </p>
          <p>
            <strong>Area:</strong> {visit.area || 'N/A'}
          </p>
          <p className="sm:col-span-2">
            <strong>GPS & Address:</strong>{' '}
            {visit.location
              ? `${visit.location.lat.toFixed(5)}, ${visit.location.lng.toFixed(5)} — ${visit.location.address}`
              : 'No GPS coordinates recorded'}
          </p>
        </div>

        {visit.notes && (
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Notes</p>
            <p className="mt-1 text-slate-700">{visit.notes}</p>
          </div>
        )}

        {Array.isArray(visit.photos) && visit.photos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase text-slate-500">Visit Photos</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {visit.photos.map((p) => (
                <img
                  key={p.id || p.url}
                  src={p.url}
                  alt={visit.businessName}
                  className="aspect-video w-full rounded-lg border border-slate-200 object-cover"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}