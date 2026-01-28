import { NextResponse } from 'next/server';
import { getProductionVsConsumptionData } from '@/lib/bigquery';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET(request) {
  try {
    const rows = await getProductionVsConsumptionData();
    const formattedData = rows.map(row => ({
      year: parseInt(row.year),
      total_consumption: parseInt(row.total_consumption),
      total_production: parseInt(row.total_production)
    }));
    return NextResponse.json({ success: true, data: formattedData, count: formattedData.length });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch production vs consumption data',
      details: error.message
    }, { status: 500 });
  }
}
