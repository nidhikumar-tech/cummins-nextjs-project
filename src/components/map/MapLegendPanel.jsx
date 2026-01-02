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
  vehicleFuelTypeFilter,
  setVehicleFuelTypeFilter,
  heatmapPointCount,
  vehiclesLoading,
  showProductionPlants,
  setShowProductionPlants,
  ppFilters,    
  setPpFilters
}) {
  //Helper to toggle specific fuel filters
  const togglePpFilter = (type) => {
    setPpFilters(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportType, setExportType] = useState('all');
  
  // Generate years array from 2020 to 2040
  const years = ['all', ...Array.from({ length: 21 }, (_, i) => (2020 + i).toString())];
  
  //All US states
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
    { key: 'production_plant', label: 'Production Plant', icon: '/images/round.png' }
  ];

  const fuelLegends = [
    { key: 'elec', label: 'Electric (ELEC)', icon: iconMap.elec },
    { key: 'cng', label: 'CNG', icon: iconMap.cng },
  ];

  const isStateSelected = stateFilter && stateFilter !== 'all';
  const handleExport = async () => {
    try {
      const response = await fetch(`/api/export-data?type=${exportType}`);
      
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Set filename based on export type
      let filename = `cummins_data_${new Date().toISOString().slice(0, 10)}.csv`;
      if (exportType === 'stations') {
        filename = `fuel_stations_${new Date().toISOString().slice(0, 10)}.csv`;
      } else if (exportType === 'vehicles') {
        filename = `vehicle_data_${new Date().toISOString().slice(0, 10)}.csv`;
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Close the export panel after successful download
      setIsExportOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
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
         <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
           <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              //Change cursor based on state
              cursor: isStateSelected ? 'pointer' : 'not-allowed', 
              marginBottom: '4px',
              //Change opacity based on state (visual cue)
              opacity: isStateSelected ? 1 : 0.5 
            }}>
              <input 
                type="checkbox" 
                checked={showProductionPlants}
                onChange={(e) => setShowProductionPlants(e.target.checked)}
                //Disable the input if no state is selected
                disabled={!isStateSelected} 
                style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
              />
              <span className={styles.filterTriggerButton}>
                Show Production Plants
              </span>
           </label>
           
           {/*Helper Text to explain why it's disabled */}
           {!isStateSelected && (
             <span style={{ fontSize: '11px', color: '#dc2626', marginLeft: '28px', fontStyle: 'italic' }}>
               * Select a state filter to enable
             </span>
           )}
         </div>

         {/* Sub-Checkboxes (Only visible if checked) */}
         {showProductionPlants && (
           <div style={{ marginLeft: '28px', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
             {/* CNG/Diesel/Electric Checkboxes */}
             <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={ppFilters.cng}
                  onChange={() => togglePpFilter('cng')}
                  style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                />
                <span style={{ fontSize: '14px', color: '#475569' }}>CNG</span>
             </label>
             <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={ppFilters.diesel}
                  onChange={() => togglePpFilter('diesel')}
                  style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                />
                <span style={{ fontSize: '14px', color: '#475569' }}>Diesel</span>
             </label>
             <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={ppFilters.electric}
                  onChange={() => togglePpFilter('electric')}
                  style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                />
                <span style={{ fontSize: '14px', color: '#475569' }}>Electric</span>
             </label>
           </div>
         )}
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
                    {exportType === 'all' && 'Downloads both fuel stations and vehicle data in a single CSV file.'}
                    {exportType === 'stations' && 'Downloads fuel station data including location, fuel type, and status.'}
                    {exportType === 'vehicles' && 'Downloads vehicle data including counts by class and fuel type.'}
                  </p>
                </div>
              </div>

              {/* Export Button */}
              <div className={styles.filterGroup}>
                <button 
                  className={styles.filterTriggerButton}
                  onClick={handleExport}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {/* <span>⬇️</span> */}
                  <span style={{ textDecoration: 'underline'}}>Download CSV</span>
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

              {/* Vehicle Fuel Type Filter - for Heatmap */}
              {(showHeatmap === 'heatmap' || showHeatmap === 'both') && (
                <div className={styles.filterGroup}>
                  <h4 className={styles.filterGroupTitle}>Heatmap - Vehicle Type</h4>
                  <div className={styles.filterItems}>
                    <label className={styles.filterLabel}>
                      <input
                        type="radio"
                        name="vehicleFuelType"
                        className={styles.filterCheckbox}
                        checked={vehicleFuelTypeFilter === 'all'}
                        onChange={() => setVehicleFuelTypeFilter('all')}
                      />
                      <span>All Vehicle Types</span>
                    </label>
                    <label className={styles.filterLabel}>
                      <input
                        type="radio"
                        name="vehicleFuelType"
                        className={styles.filterCheckbox}
                        checked={vehicleFuelTypeFilter === 'cng'}
                        onChange={() => setVehicleFuelTypeFilter('cng')}
                      />
                      <span>CNG</span>
                    </label>
                    <label className={styles.filterLabel}>
                      <input
                        type="radio"
                        name="vehicleFuelType"
                        className={styles.filterCheckbox}
                        checked={vehicleFuelTypeFilter === 'hybrid'}
                        onChange={() => setVehicleFuelTypeFilter('hybrid')}
                      />
                      <span>Hybrid</span>
                    </label>
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
                  <label className={styles.filterLabel}>
                    <input
                      type="radio"
                      name="fuelType"
                      className={styles.filterCheckbox}
                      checked={selectedFuelType === 'diesel'}
                      onChange={() => selectFuelType('diesel')}
                    />
                    <span>Diesel (RD + BD)</span>
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
