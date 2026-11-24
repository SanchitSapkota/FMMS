// src/components/charts/VisitStatsChart.jsx
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function VisitStatsChart({ visits = [] }) {
  const outcomes = ['Interested', 'Follow-Up Needed', 'Converted', 'Not Interested'];
  const counts = outcomes.map((label) => visits.filter((v) => v.outcome === label).length);

  const data = {
    labels: outcomes,
    datasets: [
      {
        label: 'Visits by Outcome',
        data: counts,
        backgroundColor: ['#4f46e5', '#f59e0b', '#10b981', '#f43f5e'],
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  return (
    <div className="h-64 w-full rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <h3 className="mb-2 text-sm font-semibold text-slate-900">Visit Outcomes Overview</h3>
      <div className="h-48">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}