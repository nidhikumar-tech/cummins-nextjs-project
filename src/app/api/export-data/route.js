import { NextResponse } from 'next/server';
import { getFuelStations, getCNGVehicleData, getHybridVehicleData, getProductionPlants } from '@/lib/bigquery';
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

// Fallback function to read production plants CSV
async function getProductionPlantsFromCSV() {
  try {
    const csvPath = path.join(process.cwd(), 'public', 'all_pp_cleaned.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const parsed = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });
    return parsed.data;
  } catch (error) {
    console.error('Production Plants CSV Fallback Error:', error.message);
    return [];
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const vehicleType = searchParams.get('vehicleType') || 'cng';

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
        'Fuel_Type_Code', 'Station_Name', 'Street_Address', 'Intersection_Directions',
        'City', 'State', 'ZIP', 'Plus4', 'Station_Phone', 'Status_Code', 'Expected_Date',
        'Groups_With_Access_Code', 'Access_Days_Time', 'Cards_Accepted', 'BD_Blends',
        'NG_Fill_Type_Code', 'NG_PSI', 'EV_Level1_EVSE_Num', 'EV_Level2_EVSE_Num',
        'EV_DC_Fast_Count', 'EV_Other_Info', 'EV_Network', 'EV_Network_Web',
        'Geocode_Status', 'Latitude', 'Longitude', 'Date_Last_Confirmed', 'Updated_At',
        'Owner_Type_Code', 'Federal_Agency_ID', 'Federal_Agency_Name', 'Open_Date',
        'Hydrogen_Status_Link', 'NG_Vehicle_Class', 'LPG_Primary', 'E85_Blender_Pump',
        'EV_Connector_Types', 'Country', 'Intersection_Directions_French',
        'Access_Days_Time_French', 'BD_Blends_French', 'Groups_With_Access_Code_French',
        'Hydrogen_Is_Retail', 'Access_Code', 'Access_Detail_Code', 'Federal_Agency_Code',
        'Facility_Type', 'CNG_Dispenser_Num', 'CNG_OnSite_Renewable_Source',
        'CNG_Total_Compression_Capacity', 'CNG_Storage_Capacity', 'LNG_OnSite_Renewable_Source',
        'E85_Other_Ethanol_Blends', 'EV_Pricing', 'EV_Pricing_French', 'LPG_Nozzle_Types',
        'Hydrogen_Pressures', 'Hydrogen_Standards', 'CNG_Fill_Type_Code', 'CNG_PSI',
        'CNG_Vehicle_Class', 'LNG_Vehicle_Class', 'EV_OnSite_Renewable_Source',
        'Restricted_Access', 'RD_Blends', 'RD_Blends_French', 'RD_Blended_with_Biodiesel',
        'RD_Maximum_Biodiesel_Level', 'NPS_Unit_Name', 'CNG_Station_Sells_Renewable_Natural_Gas',
        'LNG_Station_Sells_Renewable_Natural_Gas', 'Maximum_Vehicle_Class', 'EV_Workplace_Charging',
        'Funding_Sources'
      ];
      
      let stationsCsv = stationHeaders.join(',') + '\n';
      stations.forEach(station => {
        const row = [
          station.fuel_type_code || station.Fuel_Type_Code || '',
          `"${((station.station_name || station.Station_Name || '').toString()).replace(/"/g, '""')}"`,
          `"${((station.street_address || station.Street_Address || '').toString()).replace(/"/g, '""')}"`,
          `"${((station.intersection_directions || station.Intersection_Directions || '').toString()).replace(/"/g, '""')}"`,
          station.City || station.city || '',
          station.State || station.state || '',
          station.ZIP || station.zip || '',
          station.Plus4 || station.plus4 || '',
          station.Station_Phone || station.station_phone || '',
          station.Status_Code || station.status_code || '',
          station.Expected_Date || station.expected_date || '',
          station.Groups_With_Access_Code || station.groups_with_access_code || '',
          `"${((station.Access_Days_Time || station.access_days_time || '').toString()).replace(/"/g, '""')}"`,
          station.Cards_Accepted || station.cards_accepted || '',
          station.BD_Blends || station.bd_blends || '',
          station.NG_Fill_Type_Code || station.ng_fill_type_code || '',
          station.NG_PSI || station.ng_psi || '',
          station.EV_Level1_EVSE_Num || station.ev_level1_evse_num || '',
          station.EV_Level2_EVSE_Num || station.ev_level2_evse_num || '',
          station.EV_DC_Fast_Count || station.ev_dc_fast_count || '',
          `"${((station.EV_Other_Info || station.ev_other_info || '').toString()).replace(/"/g, '""')}"`,
          station.EV_Network || station.ev_network || '',
          station.EV_Network_Web || station.ev_network_web || '',
          station.Geocode_Status || station.geocode_status || '',
          station.Latitude || station.latitude || '',
          station.Longitude || station.longitude || '',
          station.Date_Last_Confirmed || station.date_last_confirmed || '',
          station.Updated_At || station.updated_at || '',
          station.Owner_Type_Code || station.owner_type_code || '',
          station.Federal_Agency_ID || station.federal_agency_id || '',
          station.Federal_Agency_Name || station.federal_agency_name || '',
          station.Open_Date || station.open_date || '',
          station.Hydrogen_Status_Link || station.hydrogen_status_link || '',
          station.NG_Vehicle_Class || station.ng_vehicle_class || '',
          station.LPG_Primary || station.lpg_primary || '',
          station.E85_Blender_Pump || station.e85_blender_pump || '',
          station.EV_Connector_Types || station.ev_connector_types || '',
          station.Country || station.country || '',
          `"${((station.Intersection_Directions_French || station.intersection_directions_french || '').toString()).replace(/"/g, '""')}"`,
          `"${((station.Access_Days_Time_French || station.access_days_time_french || '').toString()).replace(/"/g, '""')}"`,
          station.BD_Blends_French || station.bd_blends_french || '',
          station.Groups_With_Access_Code_French || station.groups_with_access_code_french || '',
          station.Hydrogen_Is_Retail || station.hydrogen_is_retail || '',
          station.Access_Code || station.access_code || '',
          station.Access_Detail_Code || station.access_detail_code || '',
          station.Federal_Agency_Code || station.federal_agency_code || '',
          station.Facility_Type || station.facility_type || '',
          station.CNG_Dispenser_Num || station.cng_dispenser_num || '',
          station.CNG_OnSite_Renewable_Source || station.cng_onsite_renewable_source || '',
          station.CNG_Total_Compression_Capacity || station.cng_total_compression_capacity || '',
          station.CNG_Storage_Capacity || station.cng_storage_capacity || '',
          station.LNG_OnSite_Renewable_Source || station.lng_onsite_renewable_source || '',
          station.E85_Other_Ethanol_Blends || station.e85_other_ethanol_blends || '',
          station.EV_Pricing || station.ev_pricing || '',
          station.EV_Pricing_French || station.ev_pricing_french || '',
          station.LPG_Nozzle_Types || station.lpg_nozzle_types || '',
          station.Hydrogen_Pressures || station.hydrogen_pressures || '',
          station.Hydrogen_Standards || station.hydrogen_standards || '',
          station.CNG_Fill_Type_Code || station.cng_fill_type_code || '',
          station.CNG_PSI || station.cng_psi || '',
          station.CNG_Vehicle_Class || station.cng_vehicle_class || '',
          station.LNG_Vehicle_Class || station.lng_vehicle_class || '',
          station.EV_OnSite_Renewable_Source || station.ev_onsite_renewable_source || '',
          station.Restricted_Access || station.restricted_access || '',
          station.RD_Blends || station.rd_blends || '',
          station.RD_Blends_French || station.rd_blends_french || '',
          station.RD_Blended_with_Biodiesel || station.rd_blended_with_biodiesel || '',
          station.RD_Maximum_Biodiesel_Level || station.rd_maximum_biodiesel_level || '',
          station.NPS_Unit_Name || station.nps_unit_name || '',
          station.CNG_Station_Sells_Renewable_Natural_Gas || station.cng_station_sells_renewable_natural_gas || '',
          station.LNG_Station_Sells_Renewable_Natural_Gas || station.lng_station_sells_renewable_natural_gas || '',
          station.Maximum_Vehicle_Class || station.maximum_vehicle_class || '',
          station.EV_Workplace_Charging || station.ev_workplace_charging || '',
          station.Funding_Sources || station.funding_sources || ''
        ];
        stationsCsv += row.join(',') + '\n';
      });
      
      csvContent += stationsCsv;
    }

    if (type === 'vehicles' || type === 'all') {
      let vehicles;
      
      if (vehicleType === 'cng') {
        try {
          vehicles = await getCNGVehicleData();
          dataSource.vehicles = 'bigquery_cng';
          console.log('✅ Exported CNG vehicle data from BigQuery:', vehicles.length);
        } catch (error) {
          console.warn('⚠️ BigQuery failed for CNG vehicles, using CSV fallback');
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
        
      } else if (vehicleType === 'hybrid') {
        try {
          vehicles = await getHybridVehicleData();
          dataSource.vehicles = 'bigquery_hybrid';
          console.log('✅ Exported Hybrid vehicle data from BigQuery:', vehicles.length);
        } catch (error) {
          console.warn('⚠️ BigQuery failed for Hybrid vehicles');
          dataSource.vehicles = 'error';
          vehicles = [];
        }
        
        if (type === 'all' && csvContent) {
          csvContent += '\n\n';
        }
        
        const vehicleHeaders = [
          'Year', 'State', 'Hybrid_Price', 'Predicted_Hybrid_Vehicles', 'Actual_Hybrid_Vehicles', 'Data_Type'
        ];
        
        let vehiclesCsv = vehicleHeaders.join(',') + '\n';
        vehicles.forEach(vehicle => {
          const row = [
            vehicle.year || vehicle.Year || '',
            vehicle.state || vehicle.State || '',
            vehicle.hybrid_price || vehicle.Hybrid_Price || '',
            vehicle.predicted_hybrid_vehicles || vehicle.Predicted_Hybrid_Vehicles || '',
            vehicle.actual_hybrid_vehicles || vehicle.Actual_Hybrid_Vehicles || '',
            vehicle.data_type || vehicle.Data_Type || vehicle.dataType || ''
          ];
          vehiclesCsv += row.join(',') + '\n';
        });
        
        csvContent += vehiclesCsv;
      }
    }

    if (type === 'plants') {
      let plants;
      try {
        plants = await getProductionPlants();
        dataSource.plants = 'bigquery';
        console.log('✅ Exported production plants from BigQuery:', plants.length);
      } catch (error) {
        console.warn('⚠️ BigQuery failed for plants, using CSV fallback');
        plants = await getProductionPlantsFromCSV();
        dataSource.plants = 'csv_fallback';
      }
      
      const plantHeaders = ['Vendor', 'Operator', 'Latitude', 'Longitude', 'State', 'Fuel_Type'];
      
      let plantsCsv = plantHeaders.join(',') + '\n';
      plants.forEach(plant => {
        const row = [
          `"${((plant.Vendor || plant.vendor || '').toString()).replace(/"/g, '""')}"`,
          `"${((plant.Operator || plant.operator || '').toString()).replace(/"/g, '""')}"`,
          plant.Latitude || plant.latitude || '',
          plant.Longitude || plant.longitude || '',
          plant.State || plant.state || '',
          plant.Fuel_Type || plant.fuel_type || ''
        ];
        plantsCsv += row.join(',') + '\n';
      });
      
      csvContent += plantsCsv;
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    let filename = `cummins_data_${dateStr}.csv`;
    if (type === 'stations') {
      filename = `fuel_stations_${dateStr}.csv`;
    } else if (type === 'vehicles') {
      if (vehicleType === 'cng') {
        filename = `cng_xgboost_forecast_${dateStr}.csv`;
      } else if (vehicleType === 'hybrid') {
        filename = `hybrid_xgboost_forecast_${dateStr}.csv`;
      }
    } else if (type === 'plants') {
      filename = `production_plants_${dateStr}.csv`;
    }

    console.log('📥 Export completed:', {
      type,
      vehicleType,
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
        'X-Data-Source-Plants': dataSource.plants || 'n/a',
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
