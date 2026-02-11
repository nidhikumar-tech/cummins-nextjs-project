import EmissionBarGraph from '@/components/charts/Bar/EmissionBarGraph';
import FuelStationPieChart from '@/components/data/charts/FuelStationPieChart';
import LineChart from './LineChart';

export default function ChartComponent() {
  return (
    <div>
      <div style={{padding: '32px 24px', background:'#f8f9fa', minHeight: '100vh', maxWidth: '1600px', margin: '0 auto'}}>
        <div style={{marginBottom: '32px', textAlign: 'center'}}>
          <h1 style={{fontSize: '2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.025em'}}>
            Vehicle Level Data
          </h1>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px'}}>
          <LineChart dataType="vehicles" showFuelTypeSelector={true} showAggregateSelector={true} borderColor='#10b981' backgroundColor='#10b981'/>
          <LineChart dataType="price" showFuelTypeSelector={true} showAggregateSelector={true} borderColor='#f59e0b' backgroundColor='#f59e0b' />
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px'}}>
          <LineChart dataType="incentive" showFuelTypeSelector={true} borderColor='#2563eb' backgroundColor='#2563eb'/>
          <LineChart dataType="annual_mileage" showFuelTypeSelector={true} showAggregateSelector={true} borderColor='#fb7185' backgroundColor='#fb7185' />
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px'}}>
          <EmissionBarGraph />
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px'}}>
          {/* FuelStationPieChart with default colors. To customize, pass colors prop:
              <FuelStationPieChart colors={{
                'Highly Concentrated Locally truck': '#ff0000',
                'Highly Concentrated Locally bus': '#00ff00',
                ...
              }} />
          */}
          <FuelStationPieChart />
        </div>
      </div>
    </div>
  );
}