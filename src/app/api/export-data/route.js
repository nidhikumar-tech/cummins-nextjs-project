import { NextResponse } from 'next/server';
import { getFuelStations, getVehicleData } from '@/lib/bigquery';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';

// Fallback function to read vehicle CSV
async function getVehicleDataFromCSV() {
  try {
    const csvPath = path.join(process.cwd(), 'public', 'vehicle_demo_data.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const parsed = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });
    return parsed.data;
  } catch (error) {
    console.error('CSV Fallback Error:', error.message);
    return [];
  }
}

// Fallback function to read fuel stations CSV
async function getFuelStationsFromCSV() {
  try {
    const csvPath = path.join(process.cwd(), 'public', 'custom_fuel_dataset_5000.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const parsed = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });
    return parsed.data;
  } catch (error) {
    console.error('Fuel Stations CSV Fallback Error:', error.message);
    return [];
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    let csvContent = '';
    let dataSource = { stations: 'unknown', vehicles: 'unknown' };

    if (type === 'stations' || type === 'all') {
      let stations;
      try {
        stations = await getFuelStations();
        dataSource.stations = 'bigquery';
        console.log('✅ Exported fuel stations from BigQuery:', stations.length);
      } catch (error) {
        console.warn('⚠️ BigQuery failed for stations, using CSV fallback');
        stations = await getFuelStationsFromCSV();
        dataSource.stations = 'csv_fallback';
      }
      
      const stationHeaders = [
        'ID', 'Station_Name', 'Fuel_Type_Code', 'Street_Address', 'City', 
        'State', 'ZIP', 'Plus4', 'Country', 'Status_Code', 'Station_Phone', 
        'Expected_Date', 'Access_Code', 'Latitude', 'Longitude'
      ];
      
      let stationsCsv = stationHeaders.join(',') + '\n';
      stations.forEach(station => {
        const row = [
          station.id || station.ID || '',
          `"${((station.station_name || station.Station_Name || '').toString()).replace(/"/g, '""')}"`,
          station.fuel_type_code || station.Fuel_Type_Code || '',
          `"${((station.street_address || station.Street_Address || '').toString()).replace(/"/g, '""')}"`,
          station.city || station.City || '',
          station.state || station.State || '',
          station.zip || station.ZIP || '',
          station.plus4 || station.Plus4 || '',
          station.country || station.Country || '',
          station.status_code || station.Status_Code || '',
          station.station_phone || station.Station_Phone || '',
          station.expected_date || station.Expected_Date || '',
          station.access_code || station.Access_Code || '',
          station.latitude || station.Latitude || '',
          station.longitude || station.Longitude || ''
        ];
        stationsCsv += row.join(',') + '\n';
      });
      
      csvContent += stationsCsv;
    }

    if (type === 'vehicles' || type === 'all') {
      let vehicles;
      try {
        vehicles = await getVehicleData();
        dataSource.vehicles = 'bigquery';
        console.log('✅ Exported vehicle data from BigQuery:', vehicles.length);
      } catch (error) {
        console.warn('⚠️ BigQuery failed for vehicles, using CSV fallback');
        vehicles = await getVehicleDataFromCSV();
        dataSource.vehicles = 'csv_fallback';
      }
      
      if (type === 'all' && csvContent) {
        csvContent += '\n\n';
      }
      
      const vehicleHeaders = [
        'Year', 'State', 'CNG_Price', 'Predicted_CNG_Vehicles', 'Actual_CNG_Vehicles', 'Data_Type'
      ];
      
      let vehiclesCsv = vehicleHeaders.join(',') + '\n';
      vehicles.forEach(vehicle => {
        const row = [
          vehicle.year || vehicle.Year || '',
          vehicle.state || vehicle.State || '',
          vehicle.cng_price || vehicle.CNG_Price || vehicle.cngPrice || '',
          vehicle.predicted_cng_vehicles || vehicle.Predicted_CNG_Vehicles || vehicle.vehicleCount || '',
          vehicle.actual_cng_vehicles || vehicle.Actual_CNG_Vehicles || vehicle.actualVehicles || '',
          vehicle.data_type || vehicle.Data_Type || vehicle.dataType || ''
        ];
        vehiclesCsv += row.join(',') + '\n';
      });
      
      csvContent += vehiclesCsv;
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    let filename = `cummins_data_${dateStr}.csv`;
    if (type === 'stations') {
      filename = `fuel_stations_${dateStr}.csv`;
    } else if (type === 'vehicles') {
      filename = `cng_vehicle_forecast_${dateStr}.csv`;
    }

    console.log('📥 Export completed:', {
      type,
      filename,
      dataSource,
      contentLength: csvContent.length
    });

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Data-Source-Stations': dataSource.stations || 'n/a',
        'X-Data-Source-Vehicles': dataSource.vehicles || 'n/a',
      },
    });
  } catch (error) {
    console.error('❌ Export Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export data',
        message: error.message,
        troubleshooting: [
          'Check BigQuery authentication',
          'Verify dataset and table names',
          'Ensure CSV fallback files exist in public folder'
        ]
      },
      { status: 500 }
    );
  }
}
