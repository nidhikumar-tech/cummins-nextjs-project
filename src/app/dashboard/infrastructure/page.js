"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import CNGProductionMap from "@/components/maps/CNGProductionMap";
import VehicleConsumptionBarGraph from "@/components/charts/Bar/VehicleConsumptionBarGraph";
import ProductionAndConsumptionBarGraphs from "@/components/charts/Bar/ProductionAndConsumptionBarGraph";
import ElectricProductionMap from "@/components/maps/ElectricProductionMap";

export default function InfrastructurePage() {
  
  // Reusable style for the empty chart placeholders
  const placeholderStyle = {
    background: '#f8fafc', 
    border: '2px dashed #cbd5e1', 
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94a3b8',
    fontWeight: '600',
    height: '100%',
    width: '100%'
  };

  return (
    <DashboardLayout>
      <div style={{ 
        padding: '24px', 
        maxWidth: '1800px', 
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '64px' // Space between the two major sections
      }}>
        
        {/* ==================================================== */}
        {/* SECTION 1: CNG INFRASTRUCTURE TILE                   */}
        {/* ==================================================== */}
        <div style={{ 
          height: '90vh',   
          minHeight: '800px',
          display: 'grid',
          gridTemplateRows: '6fr 4fr', // 60% Map, 40% Charts
          gap: '20px'
        }}>
          
          {/* Top: CNG Map */}
          <div style={{ width: '100%', height: '100%', minHeight: '0' }}>
            <CNGProductionMap />
          </div>

          {/* Bottom: 3 Chart Slots */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            gap: '20px',
            height: '100%',
            minHeight: '0'
          }}>
            {/* Slot 1: Actual Chart */}
            <div style={{ width: '100%', height: '100%' }}>
              <VehicleConsumptionBarGraph />
            </div>

            {/* Slot 2: Actual Chart */}
            <div style={{ width: '100%', height: '100%' }}>
              <ProductionAndConsumptionBarGraphs />
            </div>

            {/* Slot 3: Placeholder */}
            <div style={placeholderStyle}>
              Future Component
            </div>
          </div>
        </div>


        {/* ==================================================== */}
        {/* SECTION 2: ELECTRIC INFRASTRUCTURE TILE              */}
        {/* ==================================================== */}
        <div style={{ 
          height: '90vh',   // Same height as CNG tile for consistency
          minHeight: '800px',
          display: 'grid',
          gridTemplateRows: '6fr 4fr', // Same 60/40 split
          gap: '20px'
        }}>
          
          {/* Top: Electric Map */}
          <div style={{ width: '100%', height: '100%', minHeight: '0' }}>
            <ElectricProductionMap />
          </div>

          {/* Bottom: 3 Empty Chart Slots */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            gap: '20px',
            height: '100%',
            minHeight: '0'
          }}>
            {/* Slot 1: Empty */}
            <div style={placeholderStyle}>
              Electric Chart 1 (Future)
            </div>

            {/* Slot 2: Empty */}
            <div style={placeholderStyle}>
              Electric Chart 2 (Future)
            </div>

            {/* Slot 3: Empty */}
            <div style={placeholderStyle}>
              Electric Chart 3 (Future)
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}