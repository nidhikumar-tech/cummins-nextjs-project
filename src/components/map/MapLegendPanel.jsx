import { useState } from 'react';
import { iconMap } from '@/constants/mapConfig';
import { getClassColor, getVehicleTypeDescription } from '@/utils/csvParser';
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
  vehicleClassFilter,
  setVehicleClassFilter,
  selectedFuel,
  setSelectedFuel,
  heatmapPointCount,
  vehiclesLoading
}) {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportType, setExportType] = useState('all');
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
    { key: 'available', label: 'Available Stations', icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' },
    { key: 'planned', label: 'Planned Stations', icon: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png' },
  ];

  const fuelLegends = [
    { key: 'elec', label: 'Electric (ELEC)', icon: iconMap.elec },
    { key: 'cng', label: 'CNG', icon: iconMap.cng },
  ];

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
      <div className={styles.legendSection}>
        <h3 className={styles.sectionTitle}>Station Status</h3>
        {legends.map(({ key, label, icon }) => (
          <div key={key} className={styles.legendItem}>
            <img src={icon} className={styles.legendIcon} alt={label} />
            <span className={styles.legendLabel}>{label}</span>
          </div>
        ))}
      </div>

      <div className={styles.filterTriggerSection}>
        <button 
          className={styles.filterTriggerButton}
          onClick={() => setIsFilterOpen(true)}
        >
          <span>🔍</span>
          <span>Filter Stations</span>
        </button>
      </div>

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

      <div className={styles.filterTriggerSection}>
        <button 
          className={styles.filterTriggerButton}
          onClick={() => setIsExportOpen(true)}
        >
          {/* <span>⬇️</span> */}
          <span>Export Data</span>
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
                  <span>Download CSV</span>
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
              <h3 className={styles.filterPanelTitle}>Filters</h3>
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

              {/* Ownership Filter */}
              <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>Ownership</h4>
                <div className={styles.filterItems}>
                  <select 
                    className={styles.filterSelect}
                    value={ownershipFilter}
                    onChange={(e) => setOwnershipFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              {/* Fuel Type Filter */}
              <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>Fuel Type</h4>
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
              
              {/* View Mode */}
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
                    <span>Markers Only</span>
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

              {/* Vehicle Class Filter - shown when heatmap is active */}
              {(showHeatmap === 'heatmap' || showHeatmap === 'both') && (
                <div className={styles.filterGroup}>
                  <h4 className={styles.filterGroupTitle}>Vehicle Class</h4>
                  <div className={styles.filterItems}>
                    <label className={styles.filterLabel}>
                      <input
                        type="radio"
                        name="vehicleClass"
                        className={styles.filterCheckbox}
                        checked={vehicleClassFilter === '6'}
                        onChange={() => setVehicleClassFilter('6')}
                      />
                      <span>Medium Duty (Class 6)</span>
                    </label>
                    <label className={styles.filterLabel}>
                      <input
                        type="radio"
                        name="vehicleClass"
                        className={styles.filterCheckbox}
                        checked={vehicleClassFilter === '7'}
                        onChange={() => setVehicleClassFilter('7')}
                      />
                      <span>Heavy Duty (Class 7)</span>
                    </label>
                    <label className={styles.filterLabel}>
                      <input
                        type="radio"
                        name="vehicleClass"
                        className={styles.filterCheckbox}
                        checked={vehicleClassFilter === '8'}
                        onChange={() => setVehicleClassFilter('8')}
                      />
                      <span>Bus (Class 8)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Truck Fuel Type Filter - shown when heatmap is active */}
              {(showHeatmap === 'heatmap' || showHeatmap === 'both') && (
                <div className={styles.filterGroup}>
                  <h4 className={styles.filterGroupTitle}>Truck Fuel Type</h4>
                  <div className={styles.filterItems}>
                    <label className={styles.filterLabel}>
                      <input
                        type="radio"
                        name="truckFuelType"
                        className={styles.filterCheckbox}
                        checked={selectedFuel === 'CNG'}
                        onChange={() => setSelectedFuel('CNG')}
                      />
                      <span>CNG</span>
                    </label>
                    <label className={styles.filterLabel}>
                      <input
                        type="radio"
                        name="truckFuelType"
                        className={styles.filterCheckbox}
                        checked={selectedFuel === 'EV'}
                        onChange={() => setSelectedFuel('EV')}
                      />
                      <span>EV</span>
                    </label>
                  </div>
                </div>
              )}
              
              {/* Station Status Filter */}
              <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>Station Status</h4>
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}
