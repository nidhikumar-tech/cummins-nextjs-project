import { NextResponse } from 'next/server';
import { getFuelStations } from '@/lib/bigquery';

export async function GET() {
  try {
    // Query BigQuery
    const stations = await getFuelStations();

    // Transform data to match your frontend format
    const formattedStations = stations.map((station) => ({
      lat: parseFloat(station.Latitude),
      lng: parseFloat(station.Longitude),
      station_id: station.ID || station.Station_Name,
      fuel_type: station.Fuel_Type_Code ? station.Fuel_Type_Code.toLowerCase() : 'unknown',
      station_name: station.Station_Name,
      street_address: station.Street_Address,
      city: station.City,
      state: station.State,
      zip: station.ZIP,
      plus4: station.Plus4,
      country: station.Country,
      status_code: station.Status_Code,
      station_phone: station.Station_Phone,
      expected_date: station.Expected_Date,
      access_code: station.Access_Code,
    }));

    return NextResponse.json({
      success: true,
      data: formattedStations,
      count: formattedStations.length,
    });
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

// Caching to reduce BigQuery costs
export const revalidate = 86400; // Revalidate every day