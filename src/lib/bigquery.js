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
      \`Fuel Type Code\` as Fuel_Type_Code,
      \`Station Name\` as Station_Name,
      \`Street Address\` as Street_Address,
      City,
      State,
      ZIP,
      Plus4,
      Country,
      \`Status Code\` as Status_Code,
      \`Station Phone\` as Station_Phone,
      \`Expected Date\` as Expected_Date,
      \`Access Code\` as Access_Code,
      Latitude,
      Longitude,
      ID
    FROM \`${process.env.GCP_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.${process.env.BIGQUERY_TABLE}\`
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

export default bigquery;