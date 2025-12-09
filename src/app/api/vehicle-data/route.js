import { NextResponse } from 'next/server';
import { getVehicleData } from '@/lib/bigquery';

export async function GET() {
  try {
    // Fetch data from BigQuery
    const data = await getVehicleData();

    // Transform data to match frontend format
    const formattedVehicles = data.map((vehicle) => ({
      state: vehicle.State,
      city: vehicle.City,
      vehicleCount: parseInt(vehicle.Vehicle_Count) || 0,
      vehicleClass: vehicle.Vehicle_Class,
      vehicleType: vehicle.Vehicle_Type,
      fuelType: vehicle.Fuel_Type,
    }));

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
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch vehicle data',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// Cache for 1 hour
export const revalidate = 3600;
