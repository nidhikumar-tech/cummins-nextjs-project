import { NextResponse } from 'next/server';
import { getCNGLinePlotData } from '@/lib/bigquery';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const label = searchParams.get('label'); // Optional: Total Supply, Consumption by Sector, Natural Gas Spot Price at Henry Hub

    const data = await getCNGLinePlotData(label);

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('Error in CNG Line Plot API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch CNG line plot data',
      },
      { status: 500 }
    );
  }
}
