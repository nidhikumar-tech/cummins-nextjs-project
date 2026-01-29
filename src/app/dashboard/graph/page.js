"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import VishnuBarChart from "@/components/vishnu-graphs/VishnuBarChart";
import VishnuLineChart from "@/components/vishnu-graphs/VishnuLineChart";

export default function GraphRoute() {
  return (
    <DashboardLayout>
      <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '32px', color: '#0f172a' }}>
          Test Graphs
        </h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <VishnuLineChart />
          <VishnuBarChart />
        </div>
      </div>
    </DashboardLayout>
  );
}