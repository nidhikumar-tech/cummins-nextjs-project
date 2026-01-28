import LineChart from './LineChart';

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
          <LineChart dataType="vehicles" showFuelTypeSelector={true} />
        </div>
        <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginTop: '24px'}}>
          <LineChart dataType="price" showFuelTypeSelector={true} />
        </div>
      </div>
    </div>
  );
}