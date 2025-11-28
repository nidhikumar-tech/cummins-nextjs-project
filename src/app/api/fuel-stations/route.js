import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export async function GET() {
  try {
    // Read CSV file from public directory
    const filePath = path.join(process.cwd(), 'public', 'custom_fuel_dataset_5000.csv');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Parse CSV
    const { data } = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    // Transform data to match frontend format
    const formattedStations = data
      .filter(station => station.Latitude && station.Longitude)
      .map((station) => ({
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

// Cache for 1 hour
export const revalidate = 3600;