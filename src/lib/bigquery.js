import { BigQuery } from '@google-cloud/bigquery';

// Initialize BigQuery client
const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
  ...(process.env.GOOGLE_APPLICATION_CREDENTIALS && {
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  }),
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
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE_2}\`
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
  `;

  const options = {
    query: query,
    location: 'US', // frontend_custom_data is in US multi-region (Default)
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
    console.warn('BigQuery disabled: Build phase or missing GCP_PROJECT_ID');
    return [];
  }

  // Validate required environment variables
  if (!process.env.BIGQUERY_DATASET_2 || !process.env.BIGQUERY_TABLE_1) {
    console.error('Missing required environment variables: BIGQUERY_DATASET_2 or BIGQUERY_TABLE_1');
    throw new Error('BigQuery configuration incomplete');
  }
  
  // Simple query to fetch all data - let BigQuery return whatever columns exist
  // We'll filter in JavaScript if needed
  const query = `
    SELECT *
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET_2}.${process.env.BIGQUERY_TABLE_1}\`
    LIMIT 1000
  `;

  const options = {
    query: query,
    location: process.env.BIGQUERY_LOCATION_2, // Changed from 'US' to match dataset region
  };

  console.log('BigQuery Query Config:', {
    project: process.env.GCP_PROJECT_ID,
    dataset: process.env.BIGQUERY_DATASET_2,
    table: process.env.BIGQUERY_TABLE_1
  });

  try {
    const [rows] = await bigquery.query(options);
    
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
    console.error('BigQuery Error Details:', {
      message: error.message,
      code: error.code,
      dataset: process.env.BIGQUERY_DATASET_2,
      table: process.env.BIGQUERY_TABLE_1,
      project: process.env.GCP_PROJECT_ID
    });
    throw error;
  }
}

export default bigquery;