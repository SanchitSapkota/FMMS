// src/pages/LeadsFollowUpsPage.jsx
import React, { useEffect, useState } from 'react';
import { crmService } from '../services/crmService';
import StatusBadge from '../components/common/StatusBadge';

export default function LeadsFollowUpsPage() {
  const [leads, setLeads] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [leadForm, setLeadForm] = useState({
    businessName: '',
    contactPerson: '',
    phone: '',
    estimatedValue: '',
    stage: 'New',
  });
  const [fuForm, setFuForm] = useState({
    targetName: '',
    dueDate: '',
    notes: '',
  });

  const loadData = async () => {
    const [l, f] = await Promise.all([crmService.getLeads(), crmService.getFollowUps()]);
    setLeads(l);
    setFollowUps(f);
  };

  useEffect(() => {
    loadData();
  }, []);

  const addLead = async (e) => {
    e.preventDefault();
    if (!leadForm.businessName.trim()) return;
    await crmService.createLead({
      ...leadForm,
      estimatedValue: Number(leadForm.estimatedValue) || 0,
    });
    setLeadForm({ businessName: '', contactPerson: '', phone: '', estimatedValue: '', stage: 'New' });
    loadData();
  };

  const addFollowUp = async (e) => {
    e.preventDefault();
    if (!fuForm.targetName.trim() || !fuForm.dueDate) return;
    await crmService.createFollowUp(fuForm);
    setFuForm({ targetName: '', dueDate: '', notes: '' });
    loadData();
  };

  const toggleFollowUp = async (id) => {
    await crmService.toggleFollowUpStatus(id);
    loadData();
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">Leads Pipeline</h2>

        <form onSubmit={addLead} className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Business name *"
            value={leadForm.businessName}
            onChange={(e) => setLeadForm({ ...leadForm, businessName: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
          <input
            type="text"
            placeholder="Contact person"
            value={leadForm.contactPerson}
            onChange={(e) => setLeadForm({ ...leadForm, contactPerson: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
          <input
            type="number"
            placeholder="Estimated value"
            value={leadForm.estimatedValue}
            onChange={(e) => setLeadForm({ ...leadForm, estimatedValue: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Add Lead
          </button>
        </form>

        <div className="divide-y divide-slate-100">
          {leads.map((lead) => (
            <div key={lead.id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <p className="font-medium text-slate-900">{lead.businessName}</p>
                <p className="text-xs text-slate-500">
                  {lead.contactPerson || '—'} • Est. {Number(lead.estimatedValue || 0).toLocaleString()}
                </p>
              </div>
              <StatusBadge label={lead.stage} />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">Follow-Up Schedule</h2>

        <form onSubmit={addFollowUp} className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Shop / Lead name *"
            value={fuForm.targetName}
            onChange={(e) => setFuForm({ ...fuForm, targetName: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
          <input
            type="date"
            value={fuForm.dueDate}
            onChange={(e) => setFuForm({ ...fuForm, dueDate: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
          <input
            type="text"
            placeholder="Follow-up notes"
            value={fuForm.notes}
            onChange={(e) => setFuForm({ ...fuForm, notes: e.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Schedule Follow-Up
          </button>
        </form>

        <div className="divide-y divide-slate-100">
          {followUps.map((fu) => (
            <div key={fu.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div>
                <p className="font-medium text-slate-900">{fu.targetName}</p>
                <p className="text-xs text-slate-500">
                  Due: {fu.dueDate} {fu.notes ? `• ${fu.notes}` : ''}
                </p>
              </div>
              <button type="button" onClick={() => toggleFollowUp(fu.id)}>
                <StatusBadge label={fu.status} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}