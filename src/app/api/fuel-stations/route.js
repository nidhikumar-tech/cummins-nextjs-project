import { NextResponse } from 'next/server';
import { getFuelStations } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    // Fetch data from BigQuery
    const data = await getFuelStations();

    // Transform data to match frontend format
    const formattedStations = data
      .filter(station => station.latitude && station.longitude)
      .map((station) => ({
        lat: parseFloat(station.latitude),
        lng: parseFloat(station.longitude),
        station_id: station.id || station.station_name,
        fuel_type: station.fuel_type_code ? station.fuel_type_code.toLowerCase() : 'unknown',
        station_name: station.station_name,
        street_address: station.street_address,
        city: station.city,
        state: station.state,
        zip: station.zip,
        plus4: station.plus4,
        country: station.country,
        status_code: station.status_code,
        station_phone: station.station_phone,
        expected_date: station.expected_date,
        access_code: station.access_code,
      }));

    const response = NextResponse.json({
      success: true,
      data: formattedStations,
      count: formattedStations.length,
    });
    
    // Cache for 1 hour
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    
    return response;
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch fuel stations',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// Cache for 1 hour
// export const revalidate = 3600;