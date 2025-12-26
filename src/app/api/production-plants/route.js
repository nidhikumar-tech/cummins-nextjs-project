import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // 1. Locate the file
    const filePath = path.join(process.cwd(), 'public', 'us_cng_fuel_suppliers.csv');
    
    // 2. Read the file
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // 3. Parse CSV manually (No external library required)
    const rows = fileContent.split(/\r?\n/); // Split by new line (handles Windows/Mac)
    const headers = rows[0].split(',').map(h => h.trim()); // Get headers from first line
    
    const plants = rows.slice(1)
      .filter(row => row.trim() !== '') // Remove empty lines
      .map(row => {
        // This regex splits by comma ONLY if the comma is not inside quotes
        // Matches standard CSV format: "Value, Inc",Address,City
        const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        // Map headers to values
        const entry = {};
        headers.forEach((header, index) => {
          // Clean up quotes and whitespace (removes surrounding "" if present)
          const val = values[index] ? values[index].trim().replace(/^"|"$/g, '') : '';
          entry[header] = val;
        });
        
        return entry;
      })
      // 4. Map to your frontend structure
      .filter(plant => plant.Latitude && plant.Longitude) // Ensure coords exist
      .map(plant => ({
        vendor: plant.Vendor,
        address: plant.Street_Address,
        city: plant.City,
        state: plant.State,
        zip: plant.Zip_Code,
        phone: plant.Telephone,
        description: plant.Description_of_Service,
        lat: parseFloat(plant.Latitude),
        lng: parseFloat(plant.Longitude)
      }));

    return NextResponse.json({ success: true, data: plants });

  } catch (error) {
    console.error('Error loading production plants:', error);
    return NextResponse.json({ success: false, error: 'Failed to load plants' }, { status: 500 });
  }
}