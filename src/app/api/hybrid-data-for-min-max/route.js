import { NextResponse } from 'next/server';
import { getHybridVehicleDataForMinMax } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || 'all';
    
    const data = await getHybridVehicleDataForMinMax(year === 'all' ? null : year);

    // Transform data to match frontend chart format
      const formattedVehicles = data.map((vehicle) => {
       const normalized = Object.fromEntries(
        Object.entries(vehicle).map(([key, value]) => [key.toLowerCase(), value])
      ); 
        const yearVal = normalized.year;
        const state = normalized.state;
      
      // HYBRID SPECIFIC MAPPING
      // We map the specific hybrid columns to the generic names expected by the chart
      const vehicleCount = normalized.predicted_hybrid_vehicles || 0;
      const actualVehicles = normalized.actual_hybrid_vehicles || 0;
      
      return {
        year: parseInt(yearVal) || 0,
        state: state || '',
        vehicleCount: parseInt(vehicleCount) || 0, // Maps to 'Forecasted Data'
        actualVehicles: parseInt(actualVehicles) || 0, // Maps to 'Actual Data'
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedVehicles,
      count: formattedVehicles.length,
    });
    
  } catch (error) {
    console.error('Hybrid API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}