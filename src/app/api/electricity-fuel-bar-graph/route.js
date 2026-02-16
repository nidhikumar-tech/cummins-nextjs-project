import { NextResponse } from 'next/server';
import { getElectricityFuelData } from '@/lib/bigquery';

export async function GET(request) {
  try {
    const data = await getElectricityFuelData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in electricity-fuel-bar-graph API route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch electricity fuel bar graph data', details: error.message },
      { status: 500 }
    );
  }
}
