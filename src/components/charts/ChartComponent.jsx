import LineChart from './LineChart';
import ProductionLineChart from './ProductionLineChart';
import VehicleConsumptionBarGraph from './VehicleConsumptionBarGraph';

export default function ChartComponent() {
  return (
    <div>
      <div style={{padding: '32px 24px', background:'#f8f9fa', minHeight: '100vh', maxWidth: '1600px', margin: '0 auto'}}>
        <div style={{marginBottom: '32px', textAlign: 'center'}}>
          <h1 style={{fontSize: '2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.025em'}}>
            Line Charts
          </h1>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '24px'}}>
          <LineChart dataType="vehicles" showFuelTypeSelector={true} borderColor='#10b981' backgroundColor='#10b981'/>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginTop: '24px'}}>
          <LineChart dataType="price" showFuelTypeSelector={true} borderColor='#f59e0b' backgroundColor='#f59e0b' />
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginTop: '24px'}}>
          <ProductionLineChart />
        </div>
      </div>
      <div style={{padding: '32px 24px', background:'#f8f9fa', minHeight: '100vh', maxWidth: '1600px', margin: '0 auto'}}>
        <div style={{marginBottom: '32px', textAlign: 'center'}}>
          <h1 style={{fontSize: '2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.025em'}}>
            Bar Graphs
          </h1>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '24px'}}>
          <VehicleConsumptionBarGraph borderColor="#facc15" backgroundColor="#fde68a" />
        </div>
      </div>
    </div>
  );
}