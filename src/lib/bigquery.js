import { BigQuery } from '@google-cloud/bigquery';

// Initialize BigQuery client
const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
//   keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// Returns the array of fuel stations from BigQuery
export async function getFuelStations() {
  const query = `
    SELECT 
      Fuel_Type_Code,
      Station_Name,
      Street_Address,
      City,
      State,
      ZIP,
      Plus4,
      Country,
      Status_Code,
      Station_Phone,
      Expected_Date,
      Access_Code,
      Latitude,
      Longitude,
      ID
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE_2}\`
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
    console.error('BigQuery Error:', error);
    throw error;
  }
}

// Returns the array of vehicle data from BigQuery
export async function getVehicleData() {
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