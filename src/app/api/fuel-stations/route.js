import { NextResponse } from 'next/server';
import { getFuelStations } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Cache for 24 hours (fuel station data changes infrequently)

export async function GET() {
  try {
    console.log('Starting parallel fuel station queries...');
    const startTime = Date.now();

    // Fetch data from BigQuery in parallel by fuel type for better performance
    // Each smaller query executes faster than one large query
    const [cngData, elecData, rdData, bdData] = await Promise.all([
      getFuelStations('CNG'),
      getFuelStations('ELEC'),
      getFuelStations('RD'),
      getFuelStations('BD'),
    ]);

    // Combine all fuel type data
    const data = [...cngData, ...elecData, ...rdData, ...bdData];
    
    const fetchTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Parallel fetch completed in ${fetchTime}s - Total stations: ${data.length}`);

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
        fetchTimeSeconds: parseFloat(fetchTime),
        cngCount: cngData.length,
        elecCount: elecData.length,
        rdCount: rdData.length,
        bdCount: bdData.length,
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