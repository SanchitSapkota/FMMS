// src/pages/MapPage.jsx
import React, { useEffect, useState } from 'react';
import { visitService } from '../services/visitService';
import VisitsMapView from '../components/map/VisitsMapView';
import VisitDetailModal from '../components/visits/VisitDetailModal';

export default function MapPage() {
  const [visits, setVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);

  useEffect(() => {
    visitService.list().then(setVisits);
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Visit Locations Map</h1>
        <p className="text-xs text-slate-500">Geographic view of recorded field visits</p>
      </div>
      <VisitsMapView visits={visits} onInspect={setSelectedVisit} />
      <VisitDetailModal visit={selectedVisit} onClose={() => setSelectedVisit(null)} />
    </div>
  );
}