import { NextResponse } from 'next/server';
import { getProductionPlants } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    //Fetch data from BigQuery
    const plants = await getProductionPlants();

    //Transform data to match frontend format
    // BigQuery returns an array of objects. We map them to the structure
    // your frontend expects: { vendor, operator, state, fuel_type, lat, lng }
    const formattedPlants = plants.map(plant => {
      // Handle potential casing differences (CSV headers vs BigQuery schema)
      const vendor = plant.Vendor || plant.vendor || '';
      const operator = plant.Operator || plant.operator || '';
      const state = plant.State || plant.state || '';
      
      // Handle Fuel Type safely
      const rawFuel = plant.Fuel_Type || plant.fuel_type || 'unknown';
      const fuelType = rawFuel.toLowerCase();

      // Handle Coordinates
      const lat = plant.Latitude || plant.latitude;
      const lng = plant.Longitude || plant.longitude;

      return {
        vendor: vendor,
        operator: operator,
        state: state,
        fuel_type: fuelType,
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: formattedPlants,
      count: formattedPlants.length 
    });

  } catch (error) {
    console.error('Error loading production plants:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load production plants',
        message: error.message 
      }, 
      { status: 500 }
    );
  }
}