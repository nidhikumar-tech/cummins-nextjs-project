import { NextResponse } from 'next/server';
import { getElectricDataYearwise, getElectricDataStatewise } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 86400;

export async function GET(request) {
  try {
    // Get parameters from query string
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || 'all';
    const dataType = searchParams.get('dataType') || 'statewise'; // 'yearwise' or 'statewise'
    
    let data;
    let formattedVehicles;
    
    if (dataType === 'yearwise') {
      // Fetch US aggregate data from electric_forecast_final_prophet
      data = await getElectricDataYearwise(year === 'all' ? null : year);
      
      // Transform yearwise data to match frontend format
      formattedVehicles = data.map((vehicle) => {
        const normalized = Object.fromEntries(
          Object.entries(vehicle).map(([key, value]) => [key.toLowerCase(), value])
        );
        
        return {
          year: parseInt(normalized.year) || 0,
          state: 'US', // Yearwise data represents entire US
          vehicleCount: parseInt(normalized.predicted_ev_vehicles) || 0,
          actualVehicles: parseInt(normalized.actual_ev_vehicles) || 0,
          dataType: 'yearwise'
        };
      });
      
    } else {
      // Fetch state-wise data from electric_forecast_schema
      data = await getElectricDataStatewise(year === 'all' ? null : year);
      
      // Transform statewise data to match frontend format
      formattedVehicles = data.map((vehicle) => {
        const normalized = Object.fromEntries(
          Object.entries(vehicle).map(([key, value]) => [key.toLowerCase(), value])
        );
        
        return {
          year: parseInt(normalized.year) || 0,
          state: normalized.state || '',
          vehicleCount: parseInt(normalized.predicted_ev_vehicles) || 0,
          actualVehicles: parseInt(normalized.actual_ev_vehicles) || 0,
          dataType: 'statewise'
        };
      });
    }

    return NextResponse.json({
      success: true,
      data: formattedVehicles,
      count: formattedVehicles.length,
      dataType: dataType
    });
    
  } catch (error) {
    console.error('Electric Hybrid API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}