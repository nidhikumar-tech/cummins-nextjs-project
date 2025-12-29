import { BigQuery } from '@google-cloud/bigquery';

// Initialize BigQuery client
const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
//   keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// Returns the array of fuel stations from BigQuery
export async function getFuelStations() {

  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    console.log('⚠️  Skipping BigQuery query during build phase');
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
    location: 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    console.error('BigQuery Error:', error);
    throw error;
  }
}

// Returns the array of vehicle data from BigQuery
export async function getVehicleData() {

  if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.GCP_PROJECT_ID) {
    console.log('⚠️  Skipping BigQuery query during build phase');
    return [];
  }
  
  const query = `
    SELECT 
      State,
      City,
      Vehicle_Count,
      Vehicle_Class,
      Vehicle_Type,
      Fuel_Type
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE_1}\`
  `;

  const options = {
    query: query,
    location: 'US',
  };

  try {
    const [rows] = await bigquery.query(options);
    return rows;
  } catch (error) {
    console.error('BigQuery Error (Vehicle Data):', error);
    throw error;
  }
}

export default bigquery;