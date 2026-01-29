import { NextResponse } from 'next/server';
import { getVishnuLineChartData } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET(request) {
  try {
    const rows = await getVishnuLineChartData();
    // Format specifically for frontend
    const formattedData = rows.map(row => ({
      year: parseInt(row.year),
      value: parseInt(row.electric_vehicles)
    }));
    return NextResponse.json({ success: true, data: formattedData });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}