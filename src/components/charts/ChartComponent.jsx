import LineChart from './Line/LineChart';
// import IncentivesLineChart from './Line/IncentivesLineChart';
import VehicleConsumptionBarGraph from './Bar/VehicleConsumptionBarGraph';
import ProductionAndConsumptionBarGraph from './Bar/ProductionAndConsumptionBarGraph';
import VinCountBarGraph from './Bar/VinCountBarGraph';
import EmissionBarGraph from './Bar/EmissionBarGraph';
import GenerationConsumptionBarChart from './Bar/GenerationConsumptionBarChart';
import CapacityBarChart from './Bar/CapacityBarChart';
import ElectricCapacityPredictionChart from './Line/ElectricCapacityPredictionChart';

export default function ChartComponent() {
  return (
    <div>
      <div style={{padding: '32px 24px', background:'#f8f9fa', minHeight: '100vh', maxWidth: '1600px', margin: '0 auto'}}>
        <div style={{marginBottom: '32px', textAlign: 'center'}}>
          <h1 style={{fontSize: '2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.025em'}}>
            Line Charts
          </h1>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px'}}>
          <LineChart dataType="vehicles" showFuelTypeSelector={true} borderColor='#10b981' backgroundColor='#10b981'/>
          <LineChart dataType="price" showFuelTypeSelector={true} borderColor='#f59e0b' backgroundColor='#f59e0b' />
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px'}}>
          <LineChart dataType="incentive" showFuelTypeSelector={true} borderColor='#2563eb' backgroundColor='#2563eb'/>
          <LineChart dataType="annual_mileage" showFuelTypeSelector={true} borderColor='#fb7185' backgroundColor='#fb7185' />
        </div>
      </div>
      <div style={{padding: '32px 24px', background:'#f8f9fa', minHeight: '100vh', maxWidth: '1600px', margin: '0 auto'}}>
        <div style={{marginBottom: '32px', textAlign: 'center'}}>
          <h1 style={{fontSize: '2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.025em'}}>
            Bar Graphs
          </h1>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px'}}>
          <VehicleConsumptionBarGraph borderColor="#facc15" backgroundColor="#fde68a" />
          <VinCountBarGraph prodColor='#22c55e' consColor='#a7f3d0' borderColor='#16a34a' />
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px'}}>
          <EmissionBarGraph />
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px'}}>
          <ProductionAndConsumptionBarGraph prodColor="#e47215" consColor="#fde68a" borderColor="#ebc325" />
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px'}}>
          <GenerationConsumptionBarChart />
          <CapacityBarChart />
        </div>
      </div>

      <div style={{padding: '32px 24px', background:'#f8f9fa', minHeight: '100vh', maxWidth: '1600px', margin: '0 auto'}}>
        <div style={{marginBottom: '32px', textAlign: 'center'}}>
          <h1 style={{fontSize: '2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.025em'}}>
            Predictions
          </h1>
        </div>
        
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px'}}>
          
          {/* 1. Electric Prediction Chart */}
          <ElectricCapacityPredictionChart />
          
          {/* 2. Placeholder for Future CNG Chart */}
          <div style={{
            background: '#f1f5f9', 
            borderRadius: '12px', 
            border: '2px dashed #cbd5e1', 
            height: '500px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#94a3b8',
            fontWeight: '600'
          }}>
            CNG Forecast (Coming Soon)
          </div>

        </div>
      </div>
    </div>
  );
}