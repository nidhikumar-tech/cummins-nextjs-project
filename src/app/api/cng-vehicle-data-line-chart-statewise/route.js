import { NextResponse } from 'next/server';
import { getCNGDataStatewiseForLineChart } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

export async function GET(request) {
  try {
    // Get parameters from query string
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || 'all';
    
    // Fetch state-wise data from cng_prophet_forecast_2010_2040_final (filtered to year <= 2025)
    const data = await getCNGDataStatewiseForLineChart(year === 'all' ? null : year);
    
    // Transform statewise data to match frontend format
    const formattedVehicles = data.map((vehicle) => {
      const normalized = Object.fromEntries(
        Object.entries(vehicle).map(([key, value]) => [key.toLowerCase(), value])
      );
      
      return {
        year: parseInt(normalized.year) || 0,
        state: normalized.state || '',
        vehicleCount: parseInt(normalized.predicted_cng_vehicles) || 0,
        cngPrice: parseFloat(normalized.cng_price) || null,
        actualVehicles: parseInt(normalized.actual_cng_vehicles) || 0,
        annualMileage: parseFloat(normalized.annual_mileage) || null,
        cmiVin: parseInt(normalized.cmi_vin) || null,
        dataType: 'statewise'
      };
    });

    const response = NextResponse.json({
      success: true,
      data: formattedVehicles,
      count: formattedVehicles.length,
      dataType: 'statewise'
    });
    
    // Cache for 1 hour
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    
    return response;
  } catch (error) {
    console.error('CNG Statewise Line Chart API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch CNG statewise data',
        details: error.message
      },
      { status: 500 }
    );
  }
}
