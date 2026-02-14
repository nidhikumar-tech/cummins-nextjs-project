import { NextResponse } from 'next/server';
import { getElectricityGenerationLinePlotData } from '@/lib/bigquery';

export async function GET(request) {
  try {
    const data = await getElectricityGenerationLinePlotData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in electricity-generation-line-plot API route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch electricity generation line plot data', details: error.message },
      { status: 500 }
    );
  }
}
