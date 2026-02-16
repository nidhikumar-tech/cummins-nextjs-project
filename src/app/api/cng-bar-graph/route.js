import { NextResponse } from 'next/server';
import { getCNGBarGraphData } from '@/lib/bigquery';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const label = searchParams.get('label');

    const data = await getCNGBarGraphData(label);
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Error fetching CNG bar graph data:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to fetch CNG bar graph data' 
    }, { status: 500 });
  }
}
