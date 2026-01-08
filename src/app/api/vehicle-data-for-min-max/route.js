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
      const normalized = Object.fromEntries(
        Object.entries(vehicle).map(([key, value]) => [key.toLowerCase(), value])
      );
      // Try different possible column name variations
      const yearVal = normalized.year;
      const state = normalized.state;
      const vehicleCount = normalized.predicted_cng_vehicles || 
                           normalized.predicted_vehicles || 
                           normalized.vehicles || 0;
      const cngPrice = normalized.cng_price || normalized.price || 0;
      const actualVehicles = normalized.actual_cng_vehicles || 
                             normalized.actual_vehicles || 0;
      //const dataType = normalized.data_type || normalized.type || '';
      
      return {
        year: parseInt(yearVal) || 0,
        state: state || '',
        vehicleCount: parseInt(vehicleCount) || 0,
        cngPrice: parseFloat(cngPrice) || 0,
        actualVehicles: parseInt(actualVehicles) || 0,
        //dataType: dataType,
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
