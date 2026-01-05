import { NextResponse } from 'next/server';
import { getVehicleDataForMinMax } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

export async function GET(request) {
  try {
    // Get year parameter from query string
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || 'all';
    
    // Fetch data from BigQuery with year filter
    const data = await getVehicleDataForMinMax(year === 'all' ? null : year);

    // Transform data to match frontend format - handle flexible column names
    const formattedVehicles = data.map((vehicle) => {
      // Try different possible column name variations
      const year = vehicle.year || vehicle.Year || vehicle.YEAR;
      const state = vehicle.state || vehicle.State || vehicle.STATE;
      const vehicleCount = vehicle.predicted_cng_vehicles || vehicle.Predicted_CNG_Vehicles || 
                          vehicle.predicted_vehicles || vehicle.vehicles || 0;
      const cngPrice = vehicle.cng_price || vehicle.CNG_Price || vehicle.price || 0;
      const actualVehicles = vehicle.actual_cng_vehicles || vehicle.Actual_CNG_Vehicles || 
                            vehicle.actual_vehicles || 0;
      const dataType = vehicle.data_type || vehicle.Data_Type || vehicle.type || '';
      
      return {
        year: parseInt(year) || 0,
        state: state || '',
        vehicleCount: parseInt(vehicleCount) || 0,
        cngPrice: parseFloat(cngPrice) || 0,
        actualVehicles: parseInt(actualVehicles) || 0,
        dataType: dataType,
      };
    });

    const response = NextResponse.json({
      success: true,
      data: formattedVehicles,
      count: formattedVehicles.length,
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

// Cache for 1 hour
// export const revalidate = 3600;
