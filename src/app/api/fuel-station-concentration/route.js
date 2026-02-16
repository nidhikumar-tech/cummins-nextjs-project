import { NextResponse } from 'next/server';
import { getFuelStationConcentrationData } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const state = searchParams.get('state');
    const fuelType = searchParams.get('fuelType');

    if (!year || !state || !fuelType) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: year, state, and fuelType' },
        { status: 400 }
      );
    }

    const rows = await getFuelStationConcentrationData(year, state, fuelType);

    const formattedData = rows.map((row) => ({
      year: parseInt(row.year),
      state: row.state,
      fuelType: row.fuel_type,
      concentrationVehicleType: row.concentration_vehicle_type,
      totalVin: parseInt(row.total_vin) || 0,
      fuelStationCount: parseInt(row.fuel_station_count) || 0,
    }));

    const response = NextResponse.json({
      success: true,
      data: formattedData,
      count: formattedData.length,
      filters: { year, state, fuelType }
    });
    
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
        error: 'Failed to fetch fuel station concentration data',
        details: error.message
      },
      { status: 500 }
    );
  }
}
