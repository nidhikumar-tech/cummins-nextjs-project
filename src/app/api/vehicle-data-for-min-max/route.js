import { NextResponse } from 'next/server';
import { getCNGDataYearwise, getCNGDataStatewise } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

export async function GET(request) {
  try {
    // Get parameters from query string
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || 'all';
    const dataType = searchParams.get('dataType') || 'statewise'; // 'yearwise' or 'statewise'
    
    let data;
    let formattedVehicles;
    
    if (dataType === 'yearwise') {
      // Fetch US aggregate data from cng_forecast_final_prophet
      data = await getCNGDataYearwise(year === 'all' ? null : year);
      
      // Transform yearwise data to match frontend format
      formattedVehicles = data.map((vehicle) => {
        const normalized = Object.fromEntries(
          Object.entries(vehicle).map(([key, value]) => [key.toLowerCase(), value])
        );
        
        return {
          year: parseInt(normalized.year) || 0,
          state: 'US', // Yearwise data represents entire US
          vehicleCount: parseInt(normalized.predicted_cng_vehicles) || 0,
          cngPrice: parseFloat(normalized.cng_price) || 0,
          actualVehicles: parseInt(normalized.actual_cng_vehicles) || 0,
          dataType: 'yearwise'
        };
      });
      
    } else {
      // Fetch state-wise data from cng_prophet_forecast_2010_2040_final
      data = await getCNGDataStatewise(year === 'all' ? null : year);
      
      // Transform statewise data to match frontend format
      formattedVehicles = data.map((vehicle) => {
        const normalized = Object.fromEntries(
          Object.entries(vehicle).map(([key, value]) => [key.toLowerCase(), value])
        );
        
        return {
          year: parseInt(normalized.year) || 0,
          state: normalized.state || '',
          vehicleCount: parseInt(normalized.predicted_cng_vehicles) || 0,
          cngPrice: parseFloat(normalized.cng_fuel_price) || 0,
          actualVehicles: parseInt(normalized.actual_cng_vehicles) || 0,
          dataType: 'statewise'
        };
      });
    }

    const response = NextResponse.json({
      success: true,
      data: formattedVehicles,
      count: formattedVehicles.length,
      dataType: dataType
    });
    
    // Cache for 1 hour
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    
    return response;
  } catch (error) {
    console.error('API Error:', error);
    console.error('Full error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch vehicle data',
        message: error.message,
        details: error.code || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
