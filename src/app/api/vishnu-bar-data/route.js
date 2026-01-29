import { NextResponse } from 'next/server';
import { getVishnuBarChartData } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET(request) {
  try {
    const rows = await getVishnuBarChartData();
    // Format specifically for frontend
    const formattedData = rows.map(row => ({
      year: parseInt(row.year),
      value: parseInt(row.total_vehicle_consumption)
    }));
    return NextResponse.json({ success: true, data: formattedData });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}