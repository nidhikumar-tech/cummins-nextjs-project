import { NextResponse } from 'next/server';
import { getFuelStationCountByStateYear } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fuelType = searchParams.get('fuelType');

    if (!fuelType) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: fuelType' },
        { status: 400 }
      );
    }

    const rows = await getFuelStationCountByStateYear(fuelType);

    const formattedData = rows.map((row) => ({
      year: parseInt(row.year),
      state: row.state,
      totalFuelStationCount: parseInt(row.total_fuel_station_count) || 0,
    }));

    const response = NextResponse.json({
      success: true,
      data: formattedData,
      count: formattedData.length,
      filters: { fuelType }
    });

    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');

    return response;
  } catch (error) {
    console.error('API Error (fuel station count):', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch fuel station count data',
        details: error.message
      },
      { status: 500 }
    );
  }
}
