import { BigQuery } from '@google-cloud/bigquery';

// Initialize BigQuery client
const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
//   keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// Returns the array of fuel stations from BigQuery
// @param {string|null} fuelType - Optional fuel type filter (e.g., 'CNG', 'ELEC', 'RD', 'BD', null for all types)
export async function getFuelStations(fuelType = null) {

  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  // Build WHERE clause with optional fuel type filter
  let whereClause = 'WHERE Latitude IS NOT NULL AND Longitude IS NOT NULL';
  if (fuelType) {
    whereClause += ` AND fuel_type_code = '${fuelType}'`;
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
    const fuelTypeLabel = fuelType || 'All';
    console.log(`BigQuery Fuel Stations Fetch (${fuelTypeLabel}) - Rows Retrieved:`, rows.length);
    return rows;
  } catch (error) {
    console.error(`Error fetching fuel stations for type ${fuelType}:`, error);
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
      cng_price AS price, 
      actual_cng_vehicles AS actual_vehicles, 
      predicted_cng_vehicles AS predicted_vehicles, 
      fuel_type
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_1}\`
    
    UNION ALL
    
    SELECT 
      year, 
      state, 
      hybrid_price AS price, 
      actual_hybrid_vehicles AS actual_vehicles, 
      predicted_hybrid_vehicles AS predicted_vehicles, 
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

// Returns the array of HYBRID vehicle data
export async function getHybridVehicleData(year = null) {
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

export default bigquery;