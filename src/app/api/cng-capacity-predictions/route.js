import { NextResponse } from 'next/server';
import { getCNGCapacityPredictionsBySource } from '@/lib/bigquery'; 

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source'); // 'cummins' or 'eia'

    if (!source) {
      return NextResponse.json({ success: false, error: 'Source parameter is required' }, { status: 400 });
    }

    // Call the new helper function
    const data = await getCNGCapacityPredictionsBySource(source);
    
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error(`Error in cng-capacity-predictions API:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}