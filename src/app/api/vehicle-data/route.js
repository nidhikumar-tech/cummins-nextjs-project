import { NextResponse } from 'next/server';
import { getVehicleData } from '@/lib/bigquery';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

// Fallback function to read local CSV file
// async function getVehicleDataFromCSV() {
//   try {
//     const csvPath = path.join(process.cwd(), 'public', 'vehicle_demo_data.csv');
//     const fileContent = fs.readFileSync(csvPath, 'utf-8');
//     const parsed = Papa.parse(fileContent, {
//       header: true,
//       skipEmptyLines: true,
//     });
//     console.log('✅ Loaded data from CSV fallback:', parsed.data.length, 'records');
//     return parsed.data;
//   } catch (csvError) {
//     console.error('CSV Fallback Error:', csvError.message);
//     return [];
//   }
// }

export async function GET(request) {
  try {
    // Get year parameter from query string
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || 'all';
    
    let data;
    let dataSource = 'bigquery';
    
    // Try BigQuery first, fallback to CSV on error
    try {
      data = await getVehicleData(year === 'all' ? null : year);
    } catch (bigqueryError) {
      console.warn('⚠️ BigQuery failed, using CSV fallback:', bigqueryError.message);
      // data = await getVehicleDataFromCSV();
      // dataSource = 'csv_fallback';
    }

    // Transform data to match frontend format - handle flexible column names
    const formattedVehicles = data.map((vehicle) => {
      // Try different possible column name variations
      const year = vehicle.year || vehicle.Year || vehicle.YEAR;
      const state = vehicle.state || vehicle.State || vehicle.STATE;
      const vehicleCount = vehicle.predicted_cng_vehicles || vehicle.Predicted_CNG_Vehicles || 
                          vehicle.predicted_vehicles || vehicle.vehicles || 0;
      const cngPrice = vehicle.cng_price || vehicle.CNG_Price || vehicle.price || 0;
      const actualVehicles = vehicle.actual_cng_vehicles || vehicle.Actual_CNG_Vehicles || 
                            vehicle.actual_vehicles || 0;
      const dataType = vehicle.data_type || vehicle.Data_Type || vehicle.type || '';
      const fuelType = vehicle.fuel_type || vehicle.Fuel_Type || vehicle.FUEL_TYPE || '';
      
      return {
        year: parseInt(year) || 0,
        state: state || '',
        predicted_vehicles: parseInt(vehicleCount) || 0,
        cngPrice: parseFloat(cngPrice) || 0,
        actualVehicles: parseInt(actualVehicles) || 0,
        dataType: dataType,
        fuel_type: fuelType.toLowerCase(),
      };
    });

    const response = NextResponse.json({
      success: true,
      data: formattedVehicles,
      count: formattedVehicles.length,
      source: dataSource,
      timestamp: new Date().toISOString(),
    });
    
    // Cache for 1 hour
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    
    return response;
  } catch (error) {
    console.error('❌ API Error:', error);
    console.error('Full error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    // Provide helpful error message based on error type
    let errorMessage = 'Failed to fetch vehicle data';
    let troubleshooting = [];
    
    if (error.code === 404) {
      errorMessage = 'BigQuery dataset or table not found';
      troubleshooting = [
        'Verify BIGQUERY_DATASET_2 and BIGQUERY_TABLE_1 in .env.local',
        'Check if dataset exists in GCP Console',
        'Ensure proper access permissions'
      ];
    } else if (error.code === 403) {
      errorMessage = 'Access denied to BigQuery';
      troubleshooting = [
        'Check BigQuery API is enabled',
        'Verify service account permissions',
        'Ensure GOOGLE_APPLICATION_CREDENTIALS is set'
      ];
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: error.message,
        code: error.code || 'Unknown error',
        troubleshooting,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Cache for 1 hour
// export const revalidate = 3600;
