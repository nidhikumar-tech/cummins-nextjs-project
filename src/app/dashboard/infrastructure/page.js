"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import CNGProductionMap from "@/components/maps/CNGProductionMap";
import ElectricProductionMap from "@/components/maps/ElectricProductionMap";

export default function InfrastructurePage() {
  return (
    <DashboardLayout>
      <div style={{ padding: '32px 24px', maxWidth: '1600px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.025em' }}>
            Energy Production Infrastructure
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '800px' }}>
            Visualizing energy production capacity and distribution networks across the United States.
          </p>
        </div>

        {/* CNG Production Map Section */}
        <section style={{ marginBottom: '48px' }}>
          <CNGProductionMap />
        </section>

        {/* Electric Production Map Section */}
        <section>
          <ElectricProductionMap />
        </section>

      </div>
    </DashboardLayout>
  );
}