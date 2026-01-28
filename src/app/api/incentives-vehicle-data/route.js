import { NextResponse } from 'next/server';
import { getIncentiveVehicleData } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

export async function GET(request) {
  try {
    const rows = await getIncentiveVehicleData();

    const formattedData = rows.map((row) => ({
      year: parseInt(row.year) || 0,
      electricVehicles: parseInt(row['electric_vehicles']) || 0,
      naturalGas: parseInt(row.natural_gas) || 0,
    }));

    const response = NextResponse.json({
      success: true,
      data: formattedData,
      count: formattedData.length,
    });
    
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    
    return response;
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch incentive vehicle data',
        details: error.message
      },
      { status: 500 }
    );
  }
}
