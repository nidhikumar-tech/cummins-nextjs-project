import { useState } from 'react';
import { FileDown, Loader2, Info } from 'lucide-react';
import { iconMap } from '@/constants/mapConfig';

export default function MapLegendPanel({   selectedFuelType,  selectFuelType,  stationStatusFilter,  setStationStatusFilter,  stateFilter,  setStateFilter,  ownershipFilter,  setOwnershipFilter,  stationCount,   isFilterOpen,   setIsFilterOpen,  showHeatmap,  setShowHeatmap,  selectedYear,  setSelectedYear,  vehicleFuelTypeFilter,  setVehicleFuelTypeFilter,  heatmapPointCount,  vehiclesLoading,  showProductionPlants,  setShowProductionPlants,  ppFilters,   setPpFilters}) {
  //Helper to toggle specific fuel filters
  const togglePpFilter = (type) => {
    setPpFilters(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportType, setExportType] = useState('vehicles');
  const [vehicleDataType, setVehicleDataType] = useState('cng'); // 'cng', 'electric', or 'both'
  const [aggregationType, setAggregationType] = useState('statewise'); // 'statewise' or 'cumulative'
  const [isExporting, setIsExporting] = useState(false);
  
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
    { key: 'planned_commercial', label: 'Planned / Commercial', icon: '/images/red-dot.png' } 
  ];

  const fuelLegends = [
    { key: 'elec', label: 'Electric (ELEC)', icon: iconMap.elec },
    { key: 'cng', label: 'CNG', icon: iconMap.cng },
  ];

  const isStateSelected = stateFilter && stateFilter !== 'all';

  // -----------------------------------------------------------------------------------------------------------------------------

  const handleExport = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      // Handle "both" vehicle types - download 2 files sequentially
      if (exportType === 'vehicles' && vehicleDataType === 'both') {
        console.log('Downloading both CNG and Electric data...');
        
        // Download CNG first
        await downloadSingleFile('cng');
        
        // Wait a bit before second download
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Download Electric second
        await downloadSingleFile('electric');
        
        console.log('Both files downloaded successfully');
        setIsExportOpen(false);
      } else {
        // Single download
        await downloadSingleFile(vehicleDataType);
        setIsExportOpen(false);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert(`Failed to export data: ${error.message}\n\nPlease check the console for more details.`);
    } finally {
      setIsExporting(false);
    }
  };

  // Helper function to download a single file
  const downloadSingleFile = async (vType) => {
    console.log('Starting export...', { type: exportType, vehicleType: vType, aggregationType });
    
    let url = `/api/export-data?type=${exportType}`;
    if (exportType === 'vehicles' || exportType === 'all') {
      url += `&vehicleType=${vType}&aggregationType=${aggregationType}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Export failed with status: ${response.status}`);
    }
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    
    const dateStr = new Date().toISOString().slice(0, 10);
    let filename = `cummins_data_${dateStr}.csv`;
    if (exportType === 'stations') {
      filename = `fuel_stations_${dateStr}.csv`;
    } else if (exportType === 'vehicles') {
      if (vType === 'cng') {
        filename = `cng_${aggregationType}_forecast_${dateStr}.csv`;
      } else if (vType === 'electric') {
        filename = `electric_${aggregationType}_forecast_${dateStr}.csv`;
      }
    } else if (exportType === 'plants') {
      filename = `production_plants_${dateStr}.csv`;
    }
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
    
    console.log('Export completed:', filename);
  };

  // -------------------------------------------------------------------------

  return (
    <>
      <button 
          style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '12px 16px', background: 'white', color: 'black', border: 'none', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', opacity: 0.65}}
          onClick={() => setIsFilterOpen(true)}
        >
          <span>Apply Filters</span><span style={{backgroundImage: 'url(/images/down.png)', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: 'contain', width: '25px', height: '25px', border: 'none', cursor: 'pointer'}}></span>
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
      {/*Disabled for Demo ->*/}
      
      <div style={{background: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)', padding: '20px', marginBottom: '16px', display:'none'}}>
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
              <span style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', padding: '12px 16px', background: 'white', color: 'black', border: 'none', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', opacity: 0.65}}>
                Show Production Plants
              </span>
           </label>
           
           {/*Helper Text to explain why it's disabled */}
           {!isStateSelected && (
             <span style={{ fontSize: '15px', color: '#dc2626', marginLeft: '28px', fontStyle: 'italic' }}>
               * Select a state filter to enable
             </span>
           )}
         </div>

         {/* Sub-Checkboxes (Only visible if checked) */}
         {showProductionPlants && (
           <div style={{ marginLeft: '28px', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
             {/* CNG/Electric Checkboxes */}
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
                  checked={ppFilters.electric}
                  onChange={() => togglePpFilter('electric')}
                  style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                />
                <span style={{ fontSize: '14px', color: '#475569' }}>Electric</span>
             </label>
           </div>
         )}
      </div>

      {/* Disabled for Demo ^ */}

      {/* Legend  */}
      <div style={{background: 'white', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)', padding: '20px'}}>
        <h3 style={{textAlign: 'center', textDecoration: 'underline', fontSize: '1rem', fontWeight: '600', color: '#000000', margin: '0', opacity: 0.65, marginBottom: '16px'}}>Legend</h3>
        {legends.map(({ key, label, icon }) => (
          <div key={key} style={{display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '12px'}}>
            <img src={icon} style={{width: '24px', height: '24px', flexShrink: 0}} alt={label} />
            <span style={{fontSize: '0.875rem', color: '#475569'}}>{label}</span>
          </div>
        ))}
      </div>
      


      {/* Download button*/}
      <div>
        <button 
          style={{backgroundImage: 'url(/images/download.png)', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: 'contain', width: '40px', height: '40px', border: 'none', cursor: 'pointer', backgroundColor: '#4299E1'}}
          onClick={() => setIsExportOpen(true)}
        >
        </button>
      </div>

    
      {/* Export Slide Panel */}
      {isExportOpen && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, animation: 'fadeIn 0.3s ease'}} onClick={() => setIsExportOpen(false)}>
          <div 
            style={{position: 'fixed', top: 0, right: isExportOpen ? 0 : '-400px', width: '334px', height: '100vh', background: 'white', boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)', transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 1001, display: 'flex', flexDirection: 'column'}}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid #e2e8f0', background: '#ffffff'}}>
              <h3 style={{fontSize: '1.25rem', fontWeight: '600', color: '#000000', opacity: 0.65, margin: 0}}>Export Data</h3>
              <button 
                style={{width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '1.25rem', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s'}}
                onClick={() => setIsExportOpen(false)}
              >
                ✕
              </button>
            </div>
            
            <div style={{flex: 1, padding: '24px', overflowY: 'auto'}}>
              {/* Export Type Selection */}
              <div style={{marginBottom: '24px'}}>
                <h4 style={{fontSize: '0.875rem', fontWeight: '600', color: '#000000', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0', paddingBottom: '8px', borderBottom: '2px solid #e2e8f0'}}>Select Data to Export</h4>
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  <label style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 16px', fontSize: '1rem', color: '#000000', opacity: 0.65, background: '#ffffff', border: 'none', fontWeight: '600'}}>
                    <input
                      type="radio"
                      name="exportType"
                      style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6'}}
                      checked={exportType === 'stations'}
                      onChange={() => setExportType('stations')}
                    />
                    <span>Fuel Stations Only</span>
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 16px', fontSize: '1rem', color: '#000000', opacity: 0.65, background: '#ffffff', border: 'none', fontWeight: '600'}}>
                    <input
                      type="radio"
                      name="exportType"
                      style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6'}}
                      checked={exportType === 'vehicles'}
                      onChange={() => setExportType('vehicles')}
                    />
                    <span>Vehicle Data Only</span>
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 16px', fontSize: '1rem', color: '#000000', opacity: 0.65, background: '#ffffff', border: 'none', fontWeight: '600'}}>
                    <input
                      type="radio"
                      name="exportType"
                      style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6'}}
                      checked={exportType === 'plants'}
                      onChange={() => setExportType('plants')}
                    />
                    <span>Production Plants Only</span>
                  </label>
                </div>
              </div>

              {/* Vehicle Dataset Type Selection - Only show when Vehicle Data is selected */}
              {exportType === 'vehicles' && (
                <>
                  <div style={{marginBottom: '24px'}}>
                    <h4 style={{fontSize: '0.875rem', fontWeight: '600', color: '#000000', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0', paddingBottom: '8px', borderBottom: '2px solid #e2e8f0'}}>Aggregation Type</h4>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                      <select
                        style={{width: '100%', padding: '10px 10px', fontSize: '1rem', color: '#000000', opacity: 0.65, background: '#ffffff', border: 'none', fontWeight: '600', cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%2364748b\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '40px'}}
                        value={aggregationType}
                        onChange={(e) => setAggregationType(e.target.value)}
                      >
                        <option value="statewise">Statewise</option>
                        <option value="cumulative">Cumulative (US Aggregate)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{marginBottom: '24px'}}>
                    <h4 style={{fontSize: '0.875rem', fontWeight: '600', color: '#000000', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0', paddingBottom: '8px', borderBottom: '2px solid #e2e8f0'}}>Vehicle Dataset Type</h4>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                      <label style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 16px', fontSize: '1rem', color: '#000000', opacity: 0.65, background: '#ffffff', border: 'none', fontWeight: '600'}}>
                        <input
                          type="radio"
                          name="vehicleDataType"
                          style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6'}}
                          checked={vehicleDataType === 'cng'}
                          onChange={() => setVehicleDataType('cng')}
                        />
                        <span>CNG {aggregationType === 'statewise' ? 'Statewise' : 'Cumulative'} Forecast</span>
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 16px', fontSize: '1rem', color: '#000000', opacity: 0.65, background: '#ffffff', border: 'none', fontWeight: '600'}}>
                        <input
                          type="radio"
                          name="vehicleDataType"
                          style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6'}}
                          checked={vehicleDataType === 'electric'}
                          onChange={() => setVehicleDataType('electric')}
                        />
                        <span>Electric {aggregationType === 'statewise' ? 'Statewise' : 'Cumulative'} Forecast</span>
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 16px', fontSize: '1rem', color: '#000000', opacity: 0.65, background: '#ffffff', border: 'none', fontWeight: '600'}}>
                        <input
                          type="radio"
                          name="vehicleDataType"
                          style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6'}}
                          checked={vehicleDataType === 'both'}
                          onChange={() => setVehicleDataType('both')}
                        />
                        <span>Both (2 separate files)</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Export Info */}
              <div style={{marginBottom: '24px'}}>
                <div style={{ padding: '10px', backgroundColor: '#f0f9ff', borderRadius: '8px', fontSize: '13px' }}>
                  <p style={{ margin: '0 0 8px', fontWeight: '500', color: '#0369a1', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Info size={18} style={{ verticalAlign: 'middle' }} />
                    Export Information
                  </p>
                  <p style={{ margin: '0', color: '#075985', lineHeight: '1.5' }}>
                    {exportType === 'stations' && 'Downloads fuel station data including location, fuel type, and availability status from BigQuery.'}
                    {exportType === 'vehicles' && (
                      <>
                        {vehicleDataType === 'cng' && `Downloads CNG ${aggregationType} vehicle forecast data (2020-2040) including predicted/actual vehicles${aggregationType === 'statewise' ? ', CNG prices, and state-level' : ' and US aggregate'} data from BigQuery.`}
                        {vehicleDataType === 'electric' && `Downloads Electric ${aggregationType} vehicle forecast data (2020-2040) including predicted/actual vehicles${aggregationType === 'statewise' ? ', Electric prices, and state-level' : ' and US aggregate'} data from BigQuery.`}
                        {vehicleDataType === 'both' && `Downloads BOTH CNG and Electric ${aggregationType} vehicle forecast datasets as 2 separate CSV files from BigQuery.`}
                      </>
                    )}
                    {exportType === 'plants' && 'Downloads production plant data including vendor, operator, location (latitude/longitude), state, and fuel type from BigQuery.'}
                  </p>
                  {/* <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '12px', fontStyle: 'italic' }}>
                    {isExporting ? 'Fetching data from BigQuery...' : 'Data source: BigQuery'}
                  </p> */}
                </div>
              </div>

              {/* Export Button */}
              <div style={{marginBottom: '24px'}}>
                <button 
                  style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 16px', background: 'white', color: 'black', border: 'none', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', opacity: isExporting ? 0.6 : 1}}
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <Loader2 size={18} className={styles.iconSpin} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                      <span style={{color: '#000000', opacity: 0.65}}>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <FileDown size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                      <span style={{color: '#000000', opacity: 0.65}}>Download CSV</span>
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
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', zIndex: 1000, animation: 'fadeIn 0.3s ease'}} onClick={() => setIsFilterOpen(false)}>
          <div 
            style={{position: 'fixed', top: 0, right: isFilterOpen ? 0 : '-400px', width: '334px', height: '100vh', background: 'white', boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)', transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 1001, display: 'flex', flexDirection: 'column'}}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid #e2e8f0', background: '#ffffff'}}>
              <h3 style={{fontSize: '1.25rem', fontWeight: '600', color: '#000000', opacity: 0.65, margin: 0}}>Apply Filters</h3>
              <button 
                style={{width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '1.25rem', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s'}}
                onClick={() => setIsFilterOpen(false)}
              >
                ✕
              </button>
            </div>
            
            <div style={{flex: 1, padding: '24px', overflowY: 'auto'}}>
              {/* State Filter */}
              <div style={{marginBottom: '24px'}}>
                <h4 style={{fontSize: '0.875rem', fontWeight: '600', color: '#000000', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0', paddingBottom: '8px', borderBottom: '2px solid #e2e8f0'}}>State</h4>
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  <select
                    style={{width: '100%', padding: '10px 10px', fontSize: '1rem', color: '#000000', opacity: 0.65, background: '#ffffff', border: 'none', fontWeight: '600', cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%2364748b\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '40px'}}
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
              <div style={{marginBottom: '24px'}}>
                <h4 style={{fontSize: '0.875rem', fontWeight: '600', color: '#000000', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0', paddingBottom: '8px', borderBottom: '2px solid #e2e8f0'}}>View Mode</h4>
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  <label style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 16px', fontSize: '1rem', color: '#000000', opacity: 0.65, background: '#ffffff', border: 'none', fontWeight: '600'}}>
                    <input
                      type="radio"
                      name="viewMode"
                      style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6'}}
                      checked={showHeatmap === 'markers'}
                      onChange={() => setShowHeatmap('markers')}
                    />
                    <span>Fuel Stations Only</span>
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 16px', fontSize: '1rem', color: '#000000', opacity: 0.65, background: '#ffffff', border: 'none', fontWeight: '600'}}>
                    <input
                      type="radio"
                      name="viewMode"
                      style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6'}}
                      checked={showHeatmap === 'heatmap'}
                      onChange={() => setShowHeatmap('heatmap')}
                    />
                    <span>Heatmap Only</span>
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 16px', fontSize: '1rem', color: '#000000', opacity: 0.65, background: '#ffffff', border: 'none', fontWeight: '600'}}>
                    <input
                      type="radio"
                      name="viewMode"
                      style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6'}}
                      checked={showHeatmap === 'both'}
                      onChange={() => setShowHeatmap('both')}
                    />
                    <span>Both</span>
                  </label>
                </div>
              </div>



              {/* Year Filter - for Heatmap */}
              {(showHeatmap === 'heatmap' || showHeatmap === 'both') && (
                <div style={{marginBottom: '24px'}}>
                  <h4 style={{fontSize: '0.875rem', fontWeight: '600', color: '#000000', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0', paddingBottom: '8px', borderBottom: '2px solid #e2e8f0'}}>Heatmap - Year</h4>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    <select
                      style={{width: '100%', padding: '10px 10px', fontSize: '1rem', color: '#000000', opacity: 0.65, background: '#ffffff', border: 'none', fontWeight: '600', cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23333\' d=\'M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '40px'}}
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
                <div style={{marginBottom: '24px'}}>
                  <h4 style={{fontSize: '0.875rem', fontWeight: '600', color: '#000000', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0', paddingBottom: '8px', borderBottom: '2px solid #e2e8f0'}}>Heatmap - Vehicle Type</h4>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    <label style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 16px', fontSize: '1rem', color: '#000000', opacity: 0.65, background: '#ffffff', border: 'none', fontWeight: '600'}}>
                      <input
                        type="radio"
                        name="vehicleFuelType"
                        style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6'}}
                        checked={vehicleFuelTypeFilter === 'all'}
                        onChange={() => setVehicleFuelTypeFilter('all')}
                      />
                      <span>All Vehicle Types</span>
                    </label>
                    <label style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 16px', fontSize: '1rem', color: '#000000', opacity: 0.65, background: '#ffffff', border: 'none', fontWeight: '600'}}>
                      <input
                        type="radio"
                        name="vehicleFuelType"
                        style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6'}}
                        checked={vehicleFuelTypeFilter === 'cng'}
                        onChange={() => setVehicleFuelTypeFilter('cng')}
                      />
                      <span>CNG</span>
                    </label>
                    <label style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 16px', fontSize: '1rem', color: '#000000', opacity: 0.65, background: '#ffffff', border: 'none', fontWeight: '600'}}>
                      <input
                        type="radio"
                        name="vehicleFuelType"
                        style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6'}}
                        checked={vehicleFuelTypeFilter === 'electric'}
                        onChange={() => setVehicleFuelTypeFilter('electric')}
                      />
                      <span>Electric</span>
                    </label>
                  </div>
                </div>
              )}
              



              {/* Fuel Type Filter - Fuel Stations */}
              <div style={{marginBottom: '24px'}}>
                <h4 style={{fontSize: '0.875rem', fontWeight: '600', color: '#000000', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0', paddingBottom: '8px', borderBottom: '2px solid #e2e8f0'}}>Fuel Stations - Fuel Type</h4>
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  <label style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 16px', fontSize: '1rem', color: '#000000', opacity: 0.65, background: '#ffffff', border: 'none', fontWeight: '600'}}>
                    <input
                      type="radio"
                      name="fuelType"
                      style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6'}}
                      checked={selectedFuelType === 'all'}
                      onChange={() => selectFuelType('all')}
                    />
                    <span>All Fuel Types</span>
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 16px', fontSize: '1rem', color: '#000000', opacity: 0.65, background: '#ffffff', border: 'none', fontWeight: '600'}}>
                    <input
                      type="radio"
                      name="fuelType"
                      style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6'}}
                      checked={selectedFuelType === 'cng'}
                      onChange={() => selectFuelType('cng')}
                    />
                    <span>CNG</span>
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 16px', fontSize: '1rem', color: '#000000', opacity: 0.65, background: '#ffffff', border: 'none', fontWeight: '600'}}>
                    <input
                      type="radio"
                      name="fuelType"
                      style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6'}}
                      checked={selectedFuelType === 'elec'}
                      onChange={() => selectFuelType('elec')}
                    />
                    <span>Electric</span>
                  </label>
                </div>
              </div>
              






              
              {/* Station Status Filter - Fuel Stations*/}
              <div style={{marginBottom: '24px'}}>
                <h4 style={{fontSize: '0.875rem', fontWeight: '600', color: '#000000', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0', paddingBottom: '8px', borderBottom: '2px solid #e2e8f0'}}>Fuel Stations - Station Status</h4>
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  <label style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 16px', fontSize: '1rem', color: '#000000', opacity: 0.65, background: '#ffffff', border: 'none', fontWeight: '600'}}>
                    <input
                      type="radio"
                      name="stationStatus"
                      style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6'}}
                      checked={stationStatusFilter === 'all'}
                      onChange={() => setStationStatusFilter('all')}
                    />
                    <span>All</span>
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 16px', fontSize: '1rem', color: '#000000', opacity: 0.65, background: '#ffffff', border: 'none', fontWeight: '600'}}>
                    <input
                      type="radio"
                      name="stationStatus"
                      style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6'}}
                      checked={stationStatusFilter === 'available'}
                      onChange={() => setStationStatusFilter('available')}
                    />
                    <span>Available</span>
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 16px', fontSize: '1rem', color: '#000000', opacity: 0.65, background: '#ffffff', border: 'none', fontWeight: '600'}}>
                    <input
                      type="radio"
                      name="stationStatus"
                      style={{width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3b82f6'}}
                      checked={stationStatusFilter === 'planned'}
                      onChange={() => setStationStatusFilter('planned')}
                    />
                    <span>Planned</span>
                  </label>
                </div>
              </div>

              {/* Station Type Filter - Fuel Stations*/}
              
              <div style={{marginBottom: '24px'}}>
                <h4 style={{fontSize: '0.875rem', fontWeight: '600', color: '#000000', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0', paddingBottom: '8px', borderBottom: '2px solid #e2e8f0'}}>Fuel Stations - Station Type</h4>
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                  <select 
                    style={{width: '100%', padding: '10px 10px', fontSize: '1rem', color: '#000000', opacity: 0.65, background: '#ffffff', border: 'none', fontWeight: '600', cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23333\' d=\'M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '40px'}}
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
