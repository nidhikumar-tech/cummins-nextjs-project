import { BigQuery } from '@google-cloud/bigquery';

// Initialize BigQuery client
const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
});

export async function getFuelStations(fuelType = null, status = null) {

  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  //WHERE clause with optional fuel type filter and status
  let whereClause = 'WHERE Latitude IS NOT NULL AND Longitude IS NOT NULL';
  if (fuelType) {
    whereClause += ` AND fuel_type_code = '${fuelType}'`;
  }

  if (status) {
    whereClause += ` AND Status_Code = '${status}'`;
  }

  const query = `
  SELECT
    fuel_type_code AS fuel_type_code,
    station_name AS station_name,
    street_address AS street_address,
    City AS city,
    State AS state,
    ZIP AS zip,
    Plus4 AS plus4,
    Country AS country,
    Status_Code AS status_code,
    Station_Phone AS station_phone,
    Expected_Date AS expected_date,
    Access_Code AS access_code,
    Latitude AS latitude,
    Longitude AS longitude,
    ID AS id
  FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_2}\`
  ${whereClause}
`;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    const label = `${fuelType || 'All'}${status ? `-${status}` : ''}`;
    console.log(`BigQuery Fetch (${label}) - Rows:`, rows.length);
    return rows;
  } catch (error) {
    console.error(`Error fetching stations:`, error);
    throw error;
  }
}

export async function getVehicleData(year = null) {

  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }
  
  // Simple query to fetch all data - let BigQuery return whatever columns exist
  // We'll filter in JavaScript if needed
  const query = `
  SELECT 
      year, 
      state, 
      cng_fuel_price AS price, 
      actual_cng_vehicles AS actual_vehicles, 
      predicted_cng_vehicles AS predicted_vehicles, 
      fuel_type
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_1}\`
    
    UNION ALL
    
    SELECT 
      year, 
      state, 
      electric_price AS price, 
      actual_ev_vehicles AS actual_vehicles, 
      predicted_ev_vehicles AS predicted_vehicles, 
      fuel_type
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_3}\`
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    
    // Filter by year in JavaScript if needed
    let filteredRows = rows;
    if (year && year !== 'all') {
      filteredRows = rows.filter(row => {
        const rowYear = row.year || row.Year || row.YEAR;
        return String(rowYear) === String(year);
      });
    }
    
    return filteredRows;
  } catch (error) {
    throw error;
  }
}

// Returns the array of vehicle data from BigQuery
// @param {string|null} year - Optional year filter (e.g., '2020', '2025', null for all years)
// NEW: Fetch CNG data for YEARWISE (US Aggregate) from cng_forecast_final_prophet
export async function getCNGDataYearwise(year = null) {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }
  
  // Debug: Log environment variables
  console.log('ENV DEBUG - Yearwise:', {
    project: process.env.GCP_PROJECT_ID,
    dataset: process.env.BIGQUERY_DATASET_2,
    table: process.env.BIGQUERY_TABLE_5,
    location: process.env.BIGQUERY_LOCATION_2
  });
  
  const query = `
    SELECT 
      year,
      cng_price,
      predicted_cng_vehicles,
      actual_cng_vehicles,
      fuel_type
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_5}\`
    ORDER BY year
  `;

  console.log('Generated Query:', query);

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    console.log('BigQuery CNG Yearwise Data Fetch - Rows Retrieved:', rows.length);
    
    // Filter by year in JavaScript if needed
    let filteredRows = rows;
    if (year && year !== 'all') {
      filteredRows = rows.filter(row => {
        const rowYear = row.year || row.Year || row.YEAR;
        return String(rowYear) === String(year);
      });
    }
    
    return filteredRows;
  } catch (error) {
    console.error('Error fetching CNG yearwise data:', error);
    throw error;
  }
}

// NEW: Fetch CNG data for STATEWISE from cng_prophet_forecast_2010_2040_final
export async function getCNGDataStatewise(year = null) {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }
  
  // Debug: Log environment variables
  console.log('ENV DEBUG - Statewise:', {
    project: process.env.GCP_PROJECT_ID,
    dataset: process.env.BIGQUERY_DATASET_2,
    table: process.env.BIGQUERY_TABLE_9,
    location: process.env.BIGQUERY_LOCATION_2
  });
  
  const query = `
    SELECT 
      year,
      state,
      fuel_type,
      cng_fuel_price,
      actual_cng_vehicles,
      predicted_cng_vehicles
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_1}\`
    ORDER BY year, state
  `;

  console.log('Generated Query:', query);

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    console.log('BigQuery CNG Statewise Data Fetch - Rows Retrieved:', rows.length);
    
    // Filter by year in JavaScript if needed
    let filteredRows = rows;
    if (year && year !== 'all') {
      filteredRows = rows.filter(row => {
        const rowYear = row.year || row.Year || row.YEAR;
        return String(rowYear) === String(year);
      });
    }
    
    return filteredRows;
  } catch (error) {
    console.error('Error fetching CNG statewise data:', error);
    throw error;
  }
}

// LEGACY: Keep for backward compatibility (currently used by old implementation)
export async function getVehicleDataForMinMax(year = null) {

  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }
  
  // Simple query to fetch all data - let BigQuery return whatever columns exist
  // We'll filter in JavaScript if needed
  const query = `
    SELECT *
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_1}\`
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    console.log('BigQuery Vehicle Data Fetch - Rows Retrieved:', rows.length);
    // Log the first row to see what columns we actually have
    if (rows.length > 0) {
      // Column info available for debugging if needed
    }
    
    // Filter by year in JavaScript if needed
    let filteredRows = rows;
    if (year && year !== 'all') {
      filteredRows = rows.filter(row => {
        const rowYear = row.year || row.Year || row.YEAR;
        return String(rowYear) === String(year);
      });
    }
    
    return filteredRows;
  } catch (error) {
    throw error;
  }
}

// Returns the array of vehicle data from BigQuery
// @param {string|null} year - Optional year filter (e.g., '2020', '2025', null for all years)
export async function getCNGVehicleData(year = null) {

  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }
  
  // Simple query to fetch all data - let BigQuery return whatever columns exist
  // We'll filter in JavaScript if needed


    const query = `
    SELECT *
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_1}\`
    LIMIT 10000
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    
    // Filter by year in JavaScript if needed
    let filteredRows = rows;
    if (year && year !== 'all') {
      filteredRows = rows.filter(row => {
        const rowYear = row.year || row.Year || row.YEAR;
        return String(rowYear) === String(year);
      });
    }
    
    return filteredRows;
  } catch (error) {
    throw error;
  }
}

// Returns electric vehicle forecast data from BigQuery
export async function getElectricVehicleDataForLineChart() {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  const query = `
    SELECT 
      year,
      actual_ev_vehicles,
      predicted_ev_vehicles,
      ev_price,
      fuel_type,
      annual_mileage,
      incentive,
      CMI_VIN
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_4}\`
    WHERE fuel_type = 'electric' AND year <= 2025
    ORDER BY year ASC
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    console.log('BigQuery Electric Vehicle Data Fetch - Rows Retrieved:', rows.length);
    return rows;
  } catch (error) {
    console.error('Error fetching electric vehicle data:', error);
    throw error;
  }
}

// Returns CNG vehicle forecast data from BigQuery
export async function getCNGVehicleDataForLineChart() {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  const query = `
    SELECT 
      year,
      actual_cng_vehicles,
      predicted_cng_vehicles,
      cng_price,
      fuel_type,
      annual_mileage,
      incentive,
      CMI_VIN
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_5}\`
    WHERE fuel_type = 'cng' AND year <= 2025
    ORDER BY year ASC
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    console.log('BigQuery CNG Vehicle Data Fetch - Rows Retrieved:', rows.length);
    return rows;
  } catch (error) {
    console.error('Error fetching CNG vehicle data:', error);
    throw error;
  }
}

// Returns incentive vehicle data from BigQuery (Electric and Natural Gas)
// export async function getIncentiveVehicleData() {
//   if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
//     return [];
//   }

//   const query = `
//     SELECT 
//       year,
//       electric_vehicles ,
//       natural_gas
//     FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_6}\`
//     ORDER BY year ASC
//   `;

//   const options = {
//     query: query,
//     location: process.env.BIGQUERY_LOCATION_2 || 'US',
//   };

//   try {
//     const [rows] = await bigquery.query(options);
//     console.log('BigQuery Incentive Vehicle Data Fetch - First Row:', rows[0]);
//     return rows;
//   } catch (error) {
//     console.error('Error fetching incentive vehicle data:', error);
//     throw error;
//   }
// }

// Returns CNG XGBoost vehicle data only from BigQuery
// @param {string|null} year - Optional year filter
// export async function getCNGVehicleData(year = null) {
//   if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
//     return [];
//   }
  
//   const query = `
//     SELECT *
//     FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_1}\`
//     LIMIT 10000
//   `;

//   const options = {
//     query: query,
//     location: process.env.BIGQUERY_LOCATION_2 || 'US',
//   };

//   try {
//     const [rows] = await bigquery.query(options);
    
//     let filteredRows = rows;
//     if (year && year !== 'all') {
//       filteredRows = rows.filter(row => {
//         const rowYear = row.year || row.Year || row.YEAR;
//         return String(rowYear) === String(year);
//       });
//     }
    
//     return filteredRows;
//   } catch (error) {
//     throw error;
//   }
// }

// Returns Hybrid XGBoost vehicle data only from BigQuery
// @param {string|null} year - Optional year filter
// export async function getHybridVehicleData(year = null) {
//   if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
//     return [];
//   }
  
//   const query = `
//     SELECT *
//     FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_3}\`
//     LIMIT 10000
//   `;

//   const options = {
//     query: query,
//     location: process.env.BIGQUERY_LOCATION_2 || 'US',
//   };

//   try {
//     const [rows] = await bigquery.query(options);
    
//     let filteredRows = rows;
//     if (year && year !== 'all') {
//       filteredRows = rows.filter(row => {
//         const rowYear = row.year || row.Year || row.YEAR;
//         return String(rowYear) === String(year);
//       });
//     }
    
//     return filteredRows;
//   } catch (error) {
//     throw error;
//   }
// }

export async function getProductionPlants() {

  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  // Selects all columns from the production plants table
  const query = `
    SELECT *
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE_PP}\`
    WHERE Latitude IS NOT NULL AND Longitude IS NOT NULL
  `;

  const options = {
    query: query,
    location: 'US', 
  };

  try {
    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    console.error('BigQuery Production Plant Fetch Error:', error);
    throw error;
  }
}

// Returns the array of HYBRID vehicle data
export async function getHybridVehicleDataForMinMax(year = null) {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  const query = `
    SELECT *
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_3}\`
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    
    // Filter by year in JavaScript if needed
    let filteredRows = rows;
    if (year && year !== 'all') {
      filteredRows = rows.filter(row => {
        const rowYear = row.year || row.Year || row.YEAR;
        return String(rowYear) === String(year);
      });
    }
    
    return filteredRows;
  } catch (error) {
    throw error;
  }
}

// NEW: Fetch Electric/Hybrid data for YEARWISE (US Aggregate) from electric_forecast_final_prophet
export async function getElectricDataYearwise(year = null) {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }
  
  const query = `
    SELECT 
      year,
      ev_price,
      predicted_ev_vehicles,
      actual_ev_vehicles,
      fuel_type
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_14}\`
    ORDER BY year
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    console.log('BigQuery Electric Yearwise Data Fetch - Rows Retrieved:', rows.length);
    
    // Filter by year in JavaScript if needed
    let filteredRows = rows;
    if (year && year !== 'all') {
      filteredRows = rows.filter(row => {
        const rowYear = row.year || row.Year || row.YEAR;
        return String(rowYear) === String(year);
      });
    }
    
    return filteredRows;
  } catch (error) {
    console.error('Error fetching Electric yearwise data:', error);
    throw error;
  }
}

// NEW: Fetch Electric/Hybrid data for STATEWISE from electric_forecast_schema
export async function getElectricDataStatewise(year = null) {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }
  //removed electric_price from select (electric_price,)
  const query = `
    SELECT 
      year,
      state,
      fuel_type,
      electric_price,
      actual_ev_vehicles,
      predicted_ev_vehicles
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_3}\`
    ORDER BY year, state
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    console.log('BigQuery Electric Statewise Data Fetch - Rows Retrieved:', rows.length);
    
    // Filter by year in JavaScript if needed
    let filteredRows = rows;
    if (year && year !== 'all') {
      filteredRows = rows.filter(row => {
        const rowYear = row.year || row.Year || row.YEAR;
        return String(rowYear) === String(year);
      });
    }
    
    return filteredRows;
  } catch (error) {
    console.error('Error fetching Electric statewise data:', error);
    throw error;
  }
}

// Returns the array of ELECTRIC vehicle data
export async function getElectricVehicleData(year = null) {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }


  const query = `
    SELECT *
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_3}\`
    LIMIT 10000
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    
    // Filter by year in JavaScript if needed
    let filteredRows = rows;
    if (year && year !== 'all') {
      filteredRows = rows.filter(row => {
        const rowYear = row.year || row.Year || row.YEAR;
        return String(rowYear) === String(year);
      });
    }
    
    return filteredRows;
  } catch (error) {
    throw error;
  }
}

// Fetches vehicle fuel consumption data for bar graph
export async function getVehicleConsumptionData() {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  const query = `
    SELECT year, total_vehicle_consumption
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_7}\`
    ORDER BY year ASC
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    console.error('Error fetching vehicle consumption data:', error);
    throw error;
  }
}

// Fetches production vs consumption data for grouped bar graph
export async function getProductionVsConsumptionData() {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  const query = `
    SELECT year, total_consumption, total_production
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_8}\`
    ORDER BY year ASC
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    console.error('Error fetching production vs consumption data:', error);
    throw error;
  }
}

// Fetches cumulative emission data for EmissionBarGraph
export async function getCumulativeEmissionData() {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }
  const query = `
    SELECT Manufacturer, Model_Year, Engine_Test_Model, Pollutant_Name, TR_Cert_Result, Actual_Cng_Vehicles, Emission_Cert_Status
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_9}\`
    WHERE Manufacturer IS NOT NULL AND Model_Year IS NOT NULL AND Engine_Test_Model IS NOT NULL AND Pollutant_Name IS NOT NULL
    ORDER BY Model_Year ASC
  `;
  const options = {
    query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };
  try {
    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    throw error;
  }
}

// Fetches statewise emission data for EmissionBarGraph
export async function getStatewiseEmissionData(state = null) {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }
  let query = `
    SELECT Manufacturer, Model_Year, State, Engine_Test_Model, Pollutant_Name, TR_Cert_Result, Actual_Cng_Vehicles, Emission_Cert_Status
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_10}\`
    WHERE Manufacturer IS NOT NULL AND Model_Year IS NOT NULL AND Engine_Test_Model IS NOT NULL AND Pollutant_Name IS NOT NULL
  `;
  if (state) {
    query += ` AND State = @state`;
  }
  query += ' ORDER BY Model_Year ASC';
  const options = {
    query,
    params: state ? { state } : undefined,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };
  try {
    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    throw error;
  }
}



// Fetches and combines Electric Generation and Consumption for bar charts 
export async function getElectricityGenConsData() {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return { generation: [], consumption: [] };
  }

  // Fetch Generation
  // Schema: year, total, coal, petroleum, natural_gas, other_fossil_gas, nuclear, hydroelectric, other
  const genQuery = `
    SELECT year, coal, petroleum, natural_gas, other_fossil_gas, nuclear, hydroelectric, other
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_13}\`
    ORDER BY year ASC
  `;

  // Fetch Consumption
  // Schema: year, total, residential, commercial, industrial, transportation
  const consQuery = `
    SELECT year, residential, commercial, industrial, transportation, direct_use
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_12}\`
    ORDER BY year ASC
  `;

  const options = { location: process.env.BIGQUERY_LOCATION_2 || 'US' };

  try {
    // Run queries in parallel for speed
    const [genResult, consResult] = await Promise.all([
      bigquery.query({ ...options, query: genQuery }),
      bigquery.query({ ...options, query: consQuery })
    ]);
    
    // The query method returns [rows, metadata], we want rows (index 0)
    return { generation: genResult[0], consumption: consResult[0] };
  } catch (error) {
    console.error('Error fetching Electricity Gen/Cons data:', error);
    throw error;
  }
}

//Fetches Capacity Data
// Schema: year, total, coal, petroleum, natural_gas, other_fossil_gas, nuclear, hydroelectric, other
export async function getElectricityCapacityData() {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  const query = `
    SELECT year, coal, petroleum, natural_gas, other_fossil_gas, nuclear, hydroelectric, other
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_11}\`
    ORDER BY year ASC
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    console.error('Error fetching Electricity Capacity data:', error);
    throw error;
  }
}





//To fetch CNG pipeline data
export async function getCNGPipelinesData() {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  // Uses the new BIGQUERY_TABLE_17 variable
  const query = `
    SELECT 
      feature_id, 
      company_operator, 
      operational_status, 
      coordinates 
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_17}\`
    
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    console.error("Error fetching CNG Pipelines:", error);
    throw error;
  }
}

//Electric capacity prediction chart
export async function getElectricCapacityPredictions(state) {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  const query = `
    SELECT 
      year, 
      actual_capacity_mwh, 
      predicted_capacity_mwh, 
      min_predicted_capacity_mwh, 
      max_predicted_capacity_mwh
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_18}\`
    WHERE state = @state
    ORDER BY year ASC
  `;

  const options = {
    query: query,
    params: { state: state },
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    console.error(`Error fetching Electric Predictions for ${state}:`, error);
    throw error;
  }
}

//cng capacity prediction chart
export async function getCNGCapacityPredictions(state) {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  const query = `
    SELECT 
      year, 
      actual_capacity_mmcf, 
      predicted_capacity_mmcf, 
      min_predicted_capacity_mmcf, 
      max_predicted_capacity_mmcf
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_19}\`
    WHERE state = @state
    ORDER BY year ASC
  `;

  const options = {
    query: query,
    params: { state: state },
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    console.error(`Error fetching CNG Predictions for ${state}:`, error);
    throw error;
  }
}

// NEW: Fetch Electric data for LINE CHART STATEWISE from electric_prophet_forecast_2010_2040_final
export async function getElectricDataStatewiseForLineChart(year = null) {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  const query = `
    SELECT 
      year,
      state,
      fuel_type,
      ev_price,
      actual_ev_vehicles,
      predicted_ev_vehicles,
      annual_mileage,
      CMI_VIN
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_20}\`
    WHERE year <= 2025
    ORDER BY year, state
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    console.log('BigQuery Electric Statewise Line Chart Data Fetch - Rows Retrieved:', rows.length);
    
    // Filter by year in JavaScript if needed
    let filteredRows = rows;
    if (year && year !== 'all') {
      filteredRows = rows.filter(row => {
        const rowYear = row.year || row.Year || row.YEAR;
        return String(rowYear) === String(year);
      });
    }
    
    return filteredRows;
  } catch (error) {
    console.error('Error fetching Electric statewise line chart data:', error);
    throw error;
  }
}

// NEW: Fetch CNG data for LINE CHART STATEWISE from cng_prophet_forecast_2010_2040_final
export async function getCNGDataStatewiseForLineChart(year = null) {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  const query = `
    SELECT 
      year,
      state,
      fuel_type,
      cng_price,
      actual_cng_vehicles,
      predicted_cng_vehicles,
      annual_mileage,
      CMI_VIN
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_21}\`
    WHERE year <= 2025
    ORDER BY year, state
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    console.log('BigQuery CNG Statewise Line Chart Data Fetch - Rows Retrieved:', rows.length);
    
    // Filter by year in JavaScript if needed
    let filteredRows = rows;
    if (year && year !== 'all') {
      filteredRows = rows.filter(row => {
        const rowYear = row.year || row.Year || row.YEAR;
        return String(rowYear) === String(year);
      });
    }
    
    return filteredRows;
  } catch (error) {
    console.error('Error fetching CNG statewise line chart data:', error);
    throw error;
  }
}

//Fetch CNG Production Plant data 
export async function getCNGProductionPlants() {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  const query = `
    SELECT 
      plant_name, 
      state, 
      latitude, 
      longitude, 
      capacity, 
      liquid_storage
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_15}\`
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    console.log('CNG Plants Fetched:', rows.length);
    return rows;
  } catch (error) {
    console.error('Error fetching CNG Production Plants:', error);
    throw error;
  }
}

//Fetch Electric Production Plant data 
export async function getElectricProductionPlants() {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  const query = `
    SELECT 
      plant_code,
      plant_name, 
      state, 
      latitude, 
      longitude, 
      nameplate_capacity, 
      gross_generation, 
      net_generation
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_16}\`
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    console.log('Electric Plants Fetched:', rows.length);
    return rows;
  } catch (error) {
    console.error('Error fetching Electric Production Plants:', error);
    throw error;
  }
}

//Fetch CNG Production by State per Year
export async function getCNGProductionByState() {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }


  const query = `
    SELECT * FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_22}\`
    ORDER BY date ASC
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    console.error("Error fetching CNG Production by State:", error);
    throw error;
  }
}

// Fetches fuel station concentration data for Pie Chart
export async function getFuelStationConcentrationData(year, state, fuelType) {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  // Select table based on fuel type
  const table = fuelType.toLowerCase() === 'electric' 
    ? process.env.BIGQUERY_TABLE_23_ELECTRIC 
    : process.env.BIGQUERY_TABLE_24_CNG;

  // Always fetch ALL data (all years, all states) for client-side filtering
  const query = `
    SELECT 
      year,
      state,
      fuel_type,
      concentration_vehicle_type,
      SUM(vin) as total_vin,
      MAX(fuel_station_count) as fuel_station_count
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${table}\`
    WHERE LOWER(fuel_type) = LOWER(@fuelType)
    GROUP BY year, state, fuel_type, concentration_vehicle_type
    ORDER BY year, state, total_vin DESC
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
    params: { fuelType: fuelType },
  };

  try {
    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    console.error("Error fetching fuel station concentration data:", error);
    throw error;
  }
}

// Fetches fuel station count per state per year for a given fuel type
// Uses SUM(fuel_station_count) GROUP BY year, state to get accurate totals
export async function getFuelStationCountByStateYear(fuelType) {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  const table = fuelType.toLowerCase() === 'electric'
    ? process.env.BIGQUERY_TABLE_23_ELECTRIC
    : process.env.BIGQUERY_TABLE_24_CNG;

  const query = `
    SELECT 
      year,
      state,
      SUM(fuel_station_count) AS total_fuel_station_count
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${table}\`
    WHERE LOWER(fuel_type) = LOWER(@fuelType)
    GROUP BY year, state
    ORDER BY year, state
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
    params: { fuelType: fuelType },
  };

  try {
    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    console.error("Error fetching fuel station count data:", error);
    throw error;
  }
}

// Fetches CNG Line Plot data from Line_Plot_CNG_Final table
// Returns data for Total Supply, Consumption by Sector, and Natural Gas Spot Price
export async function getCNGLinePlotData(label = null) {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  let query = `
    SELECT 
      Label,
      \`Case\`,
      Units,
      \`2023\` as year_2023,
      \`2024\` as year_2024,
      \`2025\` as year_2025,
      \`2026\` as year_2026,
      \`2027\` as year_2027,
      \`2028\` as year_2028,
      \`2029\` as year_2029,
      \`2030\` as year_2030,
      \`2031\` as year_2031,
      \`2032\` as year_2032,
      \`2033\` as year_2033,
      \`2034\` as year_2034,
      \`2035\` as year_2035,
      \`2036\` as year_2036,
      \`2037\` as year_2037,
      \`2038\` as year_2038,
      \`2039\` as year_2039,
      \`2040\` as year_2040,
      \`2041\` as year_2041,
      \`2042\` as year_2042,
      \`2043\` as year_2043,
      \`2044\` as year_2044,
      \`2045\` as year_2045,
      \`2046\` as year_2046,
      \`2047\` as year_2047,
      \`2048\` as year_2048,
      \`2049\` as year_2049,
      \`2050\` as year_2050
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_25}\`
  `;

  if (label) {
    query += ` WHERE Label = @label`;
  }

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
    params: label ? { label: label } : undefined,
  };

  try {
    const [rows] = await bigquery.query(options);
    console.log('CNG Line Plot Data Fetched:', rows.length);
    return rows;
  } catch (error) {
    console.error('Error fetching CNG Line Plot data:', error);
    throw error;
  }
}

// Fetches CNG Bar Graph data from bar_graph_cng_final table
// Returns data for Production, Net Import, and Consumption by Sector
export async function getCNGBarGraphData(label = null) {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  let query = `
    SELECT 
      Label,
      Sub_Label,
      \`Case\`,
      Units,
      \`2023\` as year_2023,
      \`2024\` as year_2024,
      \`2025\` as year_2025,
      \`2026\` as year_2026,
      \`2027\` as year_2027,
      \`2028\` as year_2028,
      \`2029\` as year_2029,
      \`2030\` as year_2030,
      \`2031\` as year_2031,
      \`2032\` as year_2032,
      \`2033\` as year_2033,
      \`2034\` as year_2034,
      \`2035\` as year_2035,
      \`2036\` as year_2036,
      \`2037\` as year_2037,
      \`2038\` as year_2038,
      \`2039\` as year_2039,
      \`2040\` as year_2040,
      \`2041\` as year_2041,
      \`2042\` as year_2042,
      \`2043\` as year_2043,
      \`2044\` as year_2044,
      \`2045\` as year_2045,
      \`2046\` as year_2046,
      \`2047\` as year_2047,
      \`2048\` as year_2048,
      \`2049\` as year_2049,
      \`2050\` as year_2050
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_26}\`
  `;

  if (label) {
    query += ` WHERE Label = @label`;
  }

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
    params: label ? { label: label } : undefined,
  };

  try {
    const [rows] = await bigquery.query(options);
    console.log('CNG Bar Graph Data Fetched:', rows.length);
    return rows;
  } catch (error) {
    console.error('Error fetching CNG Bar Graph data:', error);
    throw error;
  }
}

// Fetches Electricity Line Plot data from Line_Plot_Sector_Elec_Final table
// Returns data for Electricity Sales by Sector and Electricity Prices by Sector
// Sector is always "Commercial"
export async function getElectricityLinePlotData(label = null) {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  let query = `
    SELECT 
      Label,
      Sector,
      \`Case\` as \`Case\`,
      Units,
      \`2023\` as year_2023,
      \`2024\` as year_2024,
      \`2025\` as year_2025,
      \`2026\` as year_2026,
      \`2027\` as year_2027,
      \`2028\` as year_2028,
      \`2029\` as year_2029,
      \`2030\` as year_2030,
      \`2031\` as year_2031,
      \`2032\` as year_2032,
      \`2033\` as year_2033,
      \`2034\` as year_2034,
      \`2035\` as year_2035,
      \`2036\` as year_2036,
      \`2037\` as year_2037,
      \`2038\` as year_2038,
      \`2039\` as year_2039,
      \`2040\` as year_2040,
      \`2041\` as year_2041,
      \`2042\` as year_2042,
      \`2043\` as year_2043,
      \`2044\` as year_2044,
      \`2045\` as year_2045,
      \`2046\` as year_2046,
      \`2047\` as year_2047,
      \`2048\` as year_2048,
      \`2049\` as year_2049,
      \`2050\` as year_2050
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_27}\`
    WHERE Sector = 'Commercial'
  `;

  if (label) {
    query += ` AND Label = @label`;
  }

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
    params: label ? { label: label } : undefined,
  };

  try {
    const [rows] = await bigquery.query(options);
    console.log('Electricity Line Plot Data Fetched:', rows.length);
    return rows;
  } catch (error) {
    console.error('Error fetching Electricity Line Plot data:', error);
    throw error;
  }
}

// Fetches Electricity Fuel Bar Graph data from Final_Ele_Fuel table
// Returns data for Total Net Electricity Generation by Fuel
export async function getElectricityFuelData() {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  const query = `
    SELECT 
      Label,
      Fuel,
      \`Case\` as \`Case\`,
      Units,
      \`2023\` as year_2023,
      \`2024\` as year_2024,
      \`2025\` as year_2025,
      \`2026\` as year_2026,
      \`2027\` as year_2027,
      \`2028\` as year_2028,
      \`2029\` as year_2029,
      \`2030\` as year_2030,
      \`2031\` as year_2031,
      \`2032\` as year_2032,
      \`2033\` as year_2033,
      \`2034\` as year_2034,
      \`2035\` as year_2035,
      \`2036\` as year_2036,
      \`2037\` as year_2037,
      \`2038\` as year_2038,
      \`2039\` as year_2039,
      \`2040\` as year_2040,
      \`2041\` as year_2041,
      \`2042\` as year_2042,
      \`2043\` as year_2043,
      \`2044\` as year_2044,
      \`2045\` as year_2045,
      \`2046\` as year_2046,
      \`2047\` as year_2047,
      \`2048\` as year_2048,
      \`2049\` as year_2049,
      \`2050\` as year_2050
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_28}\`
    WHERE Label = 'Total Net Electricity Generation by Fuel'
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    console.log('Electricity Fuel Bar Graph Data Fetched:', rows.length);
    return rows;
  } catch (error) {
    console.error('Error fetching Electricity Fuel Bar Graph data:', error);
    throw error;
  }
}

// Fetches Electricity Generation Line Plot data from Line_Plot_Elec_Final table
// Returns data for Total Net Electricity Generation, Net Available to the Grid, 
// Net Generation to the Grid, and Total Use From Grid
export async function getElectricityGenerationLinePlotData() {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  const query = `
    SELECT 
      Label,
      \`Case\` as \`Case\`,
      Units,
      \`2023\` as year_2023,
      \`2024\` as year_2024,
      \`2025\` as year_2025,
      \`2026\` as year_2026,
      \`2027\` as year_2027,
      \`2028\` as year_2028,
      \`2029\` as year_2029,
      \`2030\` as year_2030,
      \`2031\` as year_2031,
      \`2032\` as year_2032,
      \`2033\` as year_2033,
      \`2034\` as year_2034,
      \`2035\` as year_2035,
      \`2036\` as year_2036,
      \`2037\` as year_2037,
      \`2038\` as year_2038,
      \`2039\` as year_2039,
      \`2040\` as year_2040,
      \`2041\` as year_2041,
      \`2042\` as year_2042,
      \`2043\` as year_2043,
      \`2044\` as year_2044,
      \`2045\` as year_2045,
      \`2046\` as year_2046,
      \`2047\` as year_2047,
      \`2048\` as year_2048,
      \`2049\` as year_2049,
      \`2050\` as year_2050
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_29}\`
    WHERE Label IN (
      'Total Net Electricity Generation',
      'Net Available to the Grid',
      'Net Generation to the Grid',
      'Total Use From Grid'
    )
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    console.log('Electricity Generation Line Plot Data Fetched:', rows.length);
    return rows;
  } catch (error) {
    console.error('Error fetching Electricity Generation Line Plot data:', error);
    throw error;
  }
}

// Fetch Overhead and Using from grid data
export async function getOverheadAndUsingElectricData() {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  const query = `
    SELECT state, year, gross_generation, net_generation, overhead_to_grid, using_from_grid
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_30}\`
    ORDER BY year ASC
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    console.error("Error fetching Overhead/Using Electric data:", error);
    throw error;
  }
}


// Fetches rule-based LLM Q&A from the llm_questions table
// @param {string|null} fuelType - 'CNG' or 'ELECTRIC', null for all
export async function getLLMQuestions(fuelType = null) {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  let whereClause = '';
  if (fuelType) {
    whereClause = `WHERE UPPER(fuel_type) = '${fuelType.toUpperCase()}'`;
  }

  const query = `
    SELECT
      question,
      answer,
      fuel_type
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_31}\`
    ${whereClause}
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    console.log('BigQuery LLM Questions Fetch - Rows Retrieved:', rows.length);
    return rows;
  } catch (error) {
    console.error('Error fetching LLM questions:', error);
    throw error;
  }
}

//Capacity predictions - Cummins+EIA. BQ TABLES 32, 33
export async function getCNGCapacityPredictionsBySource(source) {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  let query = '';
  
  if (source === 'cummins') {
    const table = process.env.BIGQUERY_TABLE_32; // cng_prophet_forecast_statewise_v1
    if (!table) throw new Error('BIGQUERY_TABLE_32 is not defined in environment variables.');
    
    query = `
      SELECT year, state, fuel_type, predicted_capacity_tcf, actual_capacity_tcf 
      FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${table}\` 
      ORDER BY year ASC
    `;
  } else if (source === 'eia') {
    const table = process.env.BIGQUERY_TABLE_33; // cng_eia_reference_data_v1
    if (!table) throw new Error('BIGQUERY_TABLE_33 is not defined in environment variables.');
    
    query = `
      SELECT year, fuel_type, eia_baseline_tcf 
      FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${table}\` 
      ORDER BY year ASC
    `;
  } else {
    throw new Error('Invalid source specified.');
  }

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    console.log(`BigQuery CNG Capacity Predictions (${source}) - Rows Retrieved:`, rows.length);
    return rows;
  } catch (error) {
    console.error(`Error fetching CNG Capacity Predictions for ${source}:`, error);
    throw error;
  }
}

export async function getCumminsElectricitySales() {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  const table = process.env.BIGQUERY_TABLE_34;
  if (!table) throw new Error('BIGQUERY_TABLE_34 is not defined in environment variables.');

  const query = `
    SELECT year, total 
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${table}\` 
    ORDER BY year ASC
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    console.log('Cummins Electricity Sales Data Fetched:', rows.length);
    return rows;
  } catch (error) {
    console.error('Error fetching Cummins Electricity Sales Data:', error);
    throw error;
  }
}

//For Cummins predictions of capacity, generation, usage:
export async function getCumminsElectricityStatewiseData() {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return { generation: [], capacity: [], demand: [] };
  }

  const tableGen = process.env.BIGQUERY_TABLE_35;
  const tableCap = process.env.BIGQUERY_TABLE_36;
  const tableDem = process.env.BIGQUERY_TABLE_37;

  if (!tableGen || !tableCap || !tableDem) {
    throw new Error('Missing BigQuery table env variables for Cummins statewise data.');
  }

  // Use aliases so the frontend receives a uniform format for all 3 metrics
  const qGen = `SELECT year, state, actual_generation_mwh as actual, predicted_generation_mwh as predicted FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${tableGen}\` ORDER BY year ASC`;
  const qCap = `SELECT year, state, actual_capacity_mwh as actual, predicted_capacity_mwh as predicted FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${tableCap}\` ORDER BY year ASC`;
  const qDem = `SELECT year, state, actual_demand_mwh as actual, predicted_demand_mwh as predicted FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${tableDem}\` ORDER BY year ASC`;

  const options = { location: process.env.BIGQUERY_LOCATION_2 || 'US' };

  try {
    // Run all 3 queries in parallel to drastically improve loading time
    const [genRows, capRows, demRows] = await Promise.all([
      bigquery.query({ ...options, query: qGen }),
      bigquery.query({ ...options, query: qCap }),
      bigquery.query({ ...options, query: qDem })
    ]);
    
    return { 
      generation: genRows[0], 
      capacity: capRows[0], 
      demand: demRows[0] 
    };
  } catch (error) {
    console.error('Error fetching Cummins Electricity Statewise Data:', error);
    throw error;
  }
}
export default bigquery;