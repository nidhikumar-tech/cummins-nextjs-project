import { useState } from 'react';
import { iconMap } from '@/constants/mapConfig';
import styles from './MapComponent.module.css';

export default function MapLegendPanel({ 
  selectedFuelType,
  selectFuelType,
  stationStatusFilter,
  setStationStatusFilter,
  stateFilter,
  setStateFilter,
  ownershipFilter,
  setOwnershipFilter,
  stationCount, 
  isFilterOpen, 
  setIsFilterOpen,
  showHeatmap,
  setShowHeatmap,
  selectedYear,
  setSelectedYear,
  heatmapPointCount,
  vehiclesLoading,
  showProductionPlants,
  setShowProductionPlants
}) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportType, setExportType] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  
  // Generate years array from 2020 to 2040
  const years = ['all', ...Array.from({ length: 21 }, (_, i) => (2020 + i).toString())];
  
  // All US states
  const allStates = [
    { code: 'AL', name: 'Alabama' },
    { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' },
    { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' },
    { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' },
    { code: 'DE', name: 'Delaware' },
    { code: 'DC', name: 'District of Columbia' },
    { code: 'FL', name: 'Florida' },
    { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' },
    { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' },
    { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' },
    { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' },
    { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' },
    { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' },
    { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' },
    { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' },
    { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' },
    { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' },
    { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' },
    { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' },
    { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' },
    { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' },
    { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' },
    { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' },
    { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' },
    { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' },
    { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' },
    { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' },
    { code: 'WY', name: 'Wyoming' }
  ];
  const legends = [
    { key: 'available_public', label: 'Available / Non-Commercial', icon: '/images/green.png' },
    { key: 'available_commercial', label: 'Available / Commercial', icon: '/images/green-dot.png' },
    { key: 'planned_public', label: 'Planned / Non-Commercial', icon: '/images/red.png' },
    { key: 'planned_commercial', label: 'Planned / Commercial', icon: '/images/red-dot.png' },
  ];

  const fuelLegends = [
    { key: 'elec', label: 'Electric (ELEC)', icon: iconMap.elec },
    { key: 'cng', label: 'CNG', icon: iconMap.cng },
  ];

  const handleExport = async () => {
    if (isExporting) return; // Prevent multiple clicks
    
    setIsExporting(true);
    try {
      console.log('📥 Starting export...', { type: exportType });
      const response = await fetch(`/api/export-data?type=${exportType}`);
      
      if (!response.ok) {
        throw new Error(`Export failed with status: ${response.status}`);
      }
      
      // Log data source from headers
      const stationsSource = response.headers.get('X-Data-Source-Stations');
      const vehiclesSource = response.headers.get('X-Data-Source-Vehicles');
      console.log('📊 Data sources:', { stations: stationsSource, vehicles: vehiclesSource });
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Set filename based on export type
      const dateStr = new Date().toISOString().slice(0, 10);
      let filename = `cummins_data_${dateStr}.csv`;
      if (exportType === 'stations') {
        filename = `fuel_stations_${dateStr}.csv`;
      } else if (exportType === 'vehicles') {
        filename = `cng_vehicle_forecast_${dateStr}.csv`;
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ Export completed:', filename);
      
      // Close the export panel after successful download
      setIsExportOpen(false);
    } catch (error) {
      console.error('❌ Export error:', error);
      alert(`Failed to export data: ${error.message}\n\nPlease check the console for more details.`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <button 
          className={styles.filterTriggerButton}
          onClick={() => setIsFilterOpen(true)}
        >
          <span>Apply Filters</span><span className={styles.spanChild}></span>
      </button>
      
{/* Disabled - Panel to show number of heatpoints and fuel stations in focus
      <div className={styles.statsSection}>
        <h3 className={styles.sectionTitle}>Statistics</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Stations Displayed</span>
            <span className={styles.statValue}>{stationCount}</span>
          </div>
          {(showHeatmap === 'heatmap' || showHeatmap === 'both') && (
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Heatmap Points</span>
              <span className={styles.statValue}>{vehiclesLoading ? 'Loading...' : (heatmapPointCount || 0)}</span>
            </div>
          )}
        </div>
      </div>
*/}

      <div className={styles.filterTriggerSection} style={{ marginBottom: '16px' }}>
         <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={showProductionPlants}
              onChange={(e) => setShowProductionPlants(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
            />
            <span style={{ fontWeight: '600', color: '#1e293b' }}>
              Show Production Plants
            </span>
         </label>
      </div>

      {/* Legend  */}
      <div className={styles.legendSection}>
        <h3 className={styles.sectionTitle}>Legend</h3>
        {legends.map(({ key, label, icon }) => (
          <div key={key} className={styles.legendItem}>
            <img src={icon} className={styles.legendIcon} alt={label} />
            <span className={styles.legendLabel}>{label}</span>
          </div>
        ))}
      </div>
      


      {/* Download button*/}
      <div>
        <button 
          className={styles.downloadButton}
          onClick={() => setIsExportOpen(true)}
        >
        </button>
      </div>

    
      {/* Export Slide Panel */}
      {isExportOpen && (
        <div className={styles.filterOverlay} onClick={() => setIsExportOpen(false)}>
          <div 
            className={`${styles.filterSlidePanel} ${isExportOpen ? styles.open : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.filterPanelHeader}>
              <h3 className={styles.filterPanelTitle}>Export Data</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setIsExportOpen(false)}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.filterPanelContent}>
              {/* Export Type Selection */}
              <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>Select Data to Export</h4>
                <div className={styles.filterItems}>
                  <label className={styles.filterLabel}>
                    <input
                      type="radio"
                      name="exportType"
                      className={styles.filterCheckbox}
                      checked={exportType === 'all'}
                      onChange={() => setExportType('all')}
                    />
                    <span>All Data (Stations + Vehicles)</span>
                  </label>
                  <label className={styles.filterLabel}>
                    <input
                      type="radio"
                      name="exportType"
                      className={styles.filterCheckbox}
                      checked={exportType === 'stations'}
                      onChange={() => setExportType('stations')}
                    />
                    <span>Fuel Stations Only</span>
                  </label>
                  <label className={styles.filterLabel}>
                    <input
                      type="radio"
                      name="exportType"
                      className={styles.filterCheckbox}
                      checked={exportType === 'vehicles'}
                      onChange={() => setExportType('vehicles')}
                    />
                    <span>Vehicle Data Only</span>
                  </label>
                </div>
              </div>

              {/* Export Info */}
              <div className={styles.filterGroup}>
                <div style={{ padding: '10px', backgroundColor: '#f0f9ff', borderRadius: '8px', fontSize: '13px' }}>
                  <p style={{ margin: '0 0 8px', fontWeight: '500', color: '#0369a1' }}>
                    📊 Export Information
                  </p>
                  <p style={{ margin: '0', color: '#075985', lineHeight: '1.5' }}>
                    {exportType === 'all' && 'Downloads both fuel stations and CNG vehicle forecast data from BigQuery in a single CSV file.'}
                    {exportType === 'stations' && 'Downloads fuel station data including location, fuel type, and availability status from BigQuery.'}
                    {exportType === 'vehicles' && 'Downloads CNG vehicle forecast data (2020-2040) including predicted/actual vehicles, CNG prices, and state-level data from BigQuery.'}
                  </p>
                  <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '12px', fontStyle: 'italic' }}>
                    {isExporting ? 'Fetching data from BigQuery...' : 'Data source: BigQuery (with CSV fallback)'}
                  </p>
                </div>
              </div>

              {/* Export Button */}
              <div className={styles.filterGroup}>
                <button 
                  className={styles.filterTriggerButton}
                  onClick={handleExport}
                  disabled={isExporting}
                  style={{ 
                    width: '100%', 
                    justifyContent: 'center',
                    opacity: isExporting ? 0.6 : 1,
                    cursor: isExporting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isExporting ? (
                    <>
                      <span>⏳</span>
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <span>⬇️</span>
                      <span style={{ textDecoration: 'underline'}}>Download CSV</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        
      )}

      {/* Filter Slide Panel */}
      {isFilterOpen && (
        <div className={styles.filterOverlay} onClick={() => setIsFilterOpen(false)}>
          <div 
            className={`${styles.filterSlidePanel} ${isFilterOpen ? styles.open : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.filterPanelHeader}>
              <h3 className={styles.filterPanelTitle}>Apply Filters</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setIsFilterOpen(false)}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.filterPanelContent}>
              {/* State Filter */}
              <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>State</h4>
                <div className={styles.filterItems}>
                  <select
                    className={styles.filterSelect}
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                  >
                    <option value="all">All States</option>
                    {allStates.map(state => (
                      <option key={state.code} value={state.code}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>




              {/* View Mode Filter - Heatmap Only or Fuel Stations Only or Both*/}
              <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>View Mode</h4>
                <div className={styles.filterItems}>
                  <label className={styles.filterLabel}>
                    <input
                      type="radio"
                      name="viewMode"
                      className={styles.filterCheckbox}
                      checked={showHeatmap === 'markers'}
                      onChange={() => setShowHeatmap('markers')}
                    />
                    <span>Fuel Stations Only</span>
                  </label>
                  <label className={styles.filterLabel}>
                    <input
                      type="radio"
                      name="viewMode"
                      className={styles.filterCheckbox}
                      checked={showHeatmap === 'heatmap'}
                      onChange={() => setShowHeatmap('heatmap')}
                    />
                    <span>Heatmap Only</span>
                  </label>
                  <label className={styles.filterLabel}>
                    <input
                      type="radio"
                      name="viewMode"
                      className={styles.filterCheckbox}
                      checked={showHeatmap === 'both'}
                      onChange={() => setShowHeatmap('both')}
                    />
                    <span>Both</span>
                  </label>
                </div>
              </div>



              {/* Year Filter - for Heatmap */}
              {(showHeatmap === 'heatmap' || showHeatmap === 'both') && (
                <div className={styles.filterGroup}>
                  <h4 className={styles.filterGroupTitle}>Heatmap - Year</h4>
                  <div className={styles.filterItems}>
                    <select
                      className={styles.filterSelect}
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '14px',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {years.map(year => (
                        <option key={year} value={year}>
                          {year === 'all' ? 'All Years (2020-2040)' : year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              



              {/* Fuel Type Filter - Fuel Stations */}
              <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>Fuel Stations - Fuel Type</h4>
                <div className={styles.filterItems}>
                  <label className={styles.filterLabel}>
                    <input
                      type="radio"
                      name="fuelType"
                      className={styles.filterCheckbox}
                      checked={selectedFuelType === 'all'}
                      onChange={() => selectFuelType('all')}
                    />
                    <span>All Fuel Types</span>
                  </label>
                  <label className={styles.filterLabel}>
                    <input
                      type="radio"
                      name="fuelType"
                      className={styles.filterCheckbox}
                      checked={selectedFuelType === 'cng'}
                      onChange={() => selectFuelType('cng')}
                    />
                    <span>CNG</span>
                  </label>
                  <label className={styles.filterLabel}>
                    <input
                      type="radio"
                      name="fuelType"
                      className={styles.filterCheckbox}
                      checked={selectedFuelType === 'elec'}
                      onChange={() => selectFuelType('elec')}
                    />
                    <span>Electric (ELEC)</span>
                  </label>
                </div>
              </div>
              






              
              {/* Station Status Filter - Fuel Stations*/}
              <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>Fuel Stations - Station Status</h4>
                <div className={styles.filterItems}>
                  <label className={styles.filterLabel}>
                    <input
                      type="radio"
                      name="stationStatus"
                      className={styles.filterCheckbox}
                      checked={stationStatusFilter === 'all'}
                      onChange={() => setStationStatusFilter('all')}
                    />
                    <span>All</span>
                  </label>
                  <label className={styles.filterLabel}>
                    <input
                      type="radio"
                      name="stationStatus"
                      className={styles.filterCheckbox}
                      checked={stationStatusFilter === 'available'}
                      onChange={() => setStationStatusFilter('available')}
                    />
                    <span>Available</span>
                  </label>
                  <label className={styles.filterLabel}>
                    <input
                      type="radio"
                      name="stationStatus"
                      className={styles.filterCheckbox}
                      checked={stationStatusFilter === 'planned'}
                      onChange={() => setStationStatusFilter('planned')}
                    />
                    <span>Planned</span>
                  </label>
                </div>
              </div>

              {/* Station Type Filter - Fuel Stations*/}
              
              <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>Fuel Stations - Station Type</h4>
                <div className={styles.filterItems}>
                  <select 
                    className={styles.filterSelect}
                    value={ownershipFilter}
                    onChange={(e) => setOwnershipFilter(e.target.value)}
                  >
                    <option value="all">Both</option>
                    <option value="public">Non-Commercial</option>
                    <option value="private">Commerical</option>
                  </select>
                </div>
              </div>
              


            </div>
          </div>
        </div>
      )}
    </>
  );
}
