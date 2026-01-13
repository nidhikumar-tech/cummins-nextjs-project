import { NextResponse } from 'next/server';
import { getFuelStations } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Parse query params to allow fetching specific fuel types
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type'); // e.g., 'CNG', 'ELEC'
    const statusParam = searchParams.get('status'); //'E' for Available, 'P' for Planned
    console.log(`Starting fetch for: ${typeParam || 'ALL'} ${statusParam ? `(${statusParam})` : ''}`);
    const startTime = Date.now();

    let data = [];
    if (typeParam) {
      data = await getFuelStations(typeParam, statusParam);
    } else {
      // Slow path (Legacy): Fetch everything in parallel
    const [cngData, elecData, rdData, bdData] = await Promise.all([
      getFuelStations('CNG'),
      getFuelStations('ELEC'),
      getFuelStations('RD'),
      getFuelStations('BD'),
    ]);
    data = [...cngData, ...elecData, ...rdData, ...bdData];
    }

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
      metadata: {
        type: typeParam || 'mixed'
      }
    });
    
    // Cache for 24 hours with 48 hour stale-while-revalidate
    // Fuel station data changes infrequently, so aggressive caching is appropriate
    response.headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=172800');
    
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