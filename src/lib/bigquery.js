import { BigQuery } from '@google-cloud/bigquery';

// Initialize BigQuery client
const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
//   keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// Returns the array of fuel stations from BigQuery
export async function getFuelStations() {

  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }

  const query = `
    SELECT 
      fuel_type_code,
      station_name,
      street_address,
      city,
      state,
      zip,
      plus4,
      country,
      status_code,
      station_phone,
      expected_date,
      access_code,
      latitude,
      longitude,
      id
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_2}\`
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2 || 'us-central1',
  };

  try {
    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    throw error;
  }
}

// Returns the array of vehicle data from BigQuery
// @param {string|null} year - Optional year filter (e.g., '2020', '2025', null for all years)
export async function getVehicleData(year = null) {

  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }
  
  // Simple query to fetch all data - let BigQuery return whatever columns exist
  // We'll filter in JavaScript if needed
  const query = `
  SELECT *
  FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_1}\`

  UNION ALL

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

// Returns CNG XGBoost vehicle data only from BigQuery
// @param {string|null} year - Optional year filter
export async function getCNGVehicleData(year = null) {
  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    return [];
  }
  
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

// Returns Hybrid XGBoost vehicle data only from BigQuery
// @param {string|null} year - Optional year filter
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

export default bigquery;