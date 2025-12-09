import { NextResponse } from 'next/server';
import { getFuelStations, getVehicleData } from '@/lib/bigquery';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'stations', 'vehicles', or 'all'

    let csvContent = '';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (type === 'stations' || type === 'all') {
      // Fetch fuel stations data
      const stations = await getFuelStations();
      
      // Create CSV for stations
      const stationHeaders = [
        'ID', 'Station_Name', 'Fuel_Type_Code', 'Street_Address', 'City', 
        'State', 'ZIP', 'Plus4', 'Country', 'Status_Code', 'Station_Phone', 
        'Expected_Date', 'Access_Code', 'Latitude', 'Longitude'
      ];
      
      let stationsCsv = stationHeaders.join(',') + '\n';
      stations.forEach(station => {
        const row = [
          station.ID || '',
          `"${(station.Station_Name || '').replace(/"/g, '""')}"`,
          station.Fuel_Type_Code || '',
          `"${(station.Street_Address || '').replace(/"/g, '""')}"`,
          station.City || '',
          station.State || '',
          station.ZIP || '',
          station.Plus4 || '',
          station.Country || '',
          station.Status_Code || '',
          station.Station_Phone || '',
          station.Expected_Date || '',
          station.Access_Code || '',
          station.Latitude || '',
          station.Longitude || ''
        ];
        stationsCsv += row.join(',') + '\n';
      });
      
      csvContent += stationsCsv;
    }

    if (type === 'vehicles' || type === 'all') {
      // Fetch vehicle data
      const vehicles = await getVehicleData();
      
      if (type === 'all' && csvContent) {
        csvContent += '\n\n'; // Separator between datasets
      }
      
      // Create CSV for vehicles
      const vehicleHeaders = [
        'State', 'City', 'Vehicle_Count', 'Vehicle_Class', 'Vehicle_Type', 'Fuel_Type'
      ];
      
      let vehiclesCsv = vehicleHeaders.join(',') + '\n';
      vehicles.forEach(vehicle => {
        const row = [
          vehicle.State || '',
          vehicle.City || '',
          vehicle.Vehicle_Count || '',
          vehicle.Vehicle_Class || '',
          vehicle.Vehicle_Type || '',
          vehicle.Fuel_Type || ''
        ];
        vehiclesCsv += row.join(',') + '\n';
      });
      
      csvContent += vehiclesCsv;
    }

    // Create filename based on type
    let filename = `cummins_data_${timestamp}.csv`;
    if (type === 'stations') {
      filename = `fuel_stations_${timestamp}.csv`;
    } else if (type === 'vehicles') {
      filename = `vehicle_data_${timestamp}.csv`;
    }

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export data',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
