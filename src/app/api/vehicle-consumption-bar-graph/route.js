import { NextResponse } from 'next/server';
import { getVehicleConsumptionData } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET(request) {
  try {
    const rows = await getVehicleConsumptionData();
    const formattedData = rows.map(row => ({
      year: parseInt(row.year),
      total_vehicle_consumption: parseInt(row.total_vehicle_consumption)
    }));
    return NextResponse.json({ success: true, data: formattedData, count: formattedData.length });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch vehicle consumption data',
      details: error.message
    }, { status: 500 });
  }
}
