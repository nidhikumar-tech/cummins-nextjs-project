import { NextResponse } from 'next/server';
import { getElectricVehicleDataForLineChart } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

export async function GET(request) {
  try {
    const rows = await getElectricVehicleDataForLineChart();

    const formattedData = rows.map((row) => ({
      year: parseInt(row.year) || 0,
      actualVehicles: parseInt(row.actual_ev_vehicles) || null,
      predictedVehicles: parseInt(row.predicted_ev_vehicles) || null,
      evPrice: parseFloat(row.ev_price) || null,
      fuelType: row.fuel_type || 'electric',
      annualMileage: parseFloat(row.annual_mileage) || null,
      incentive: parseInt(row.incentive) || null,
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
    console.error('Full error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch electric vehicle data',
        details: error.message
      },
      { status: 500 }
    );
  }
}
