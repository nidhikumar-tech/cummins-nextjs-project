import { NextResponse } from 'next/server';
import { getElectricityLinePlotData } from '@/lib/bigquery';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const label = searchParams.get('label'); // Optional: Electricity Sales by Sector, Electricity Prices by Sector

    const data = await getElectricityLinePlotData(label);

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('Error in Electricity Line Plot API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch electricity line plot data',
      },
      { status: 500 }
    );
  }
}
