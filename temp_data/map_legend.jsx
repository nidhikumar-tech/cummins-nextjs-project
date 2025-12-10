import { iconMap } from '@/constants/mapConfig';
import { getClassColor, getVehicleTypeDescription } from '@/utils/csvParser';
import styles from './MapComponent.module.css';

export default function MapLegendPanel({ 
  filters, 
  toggleFilter, 
  stateFilter,
  setStateFilter,
  ownershipFilter,
  setOwnershipFilter,
  stationCount, 
  isFilterOpen, 
  setIsFilterOpen,
  showHeatmap,
  setShowHeatmap,
  vehicleClasses,
  selectedVehicleClass,
  setSelectedVehicleClass,
  heatmapPointCount
}) {
  const legends = [
    { key: 'available', label: 'Available Stations', icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' },
    { key: 'planned', label: 'Planned Stations', icon: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png' },
  ];

  const fuelLegends = [
    { key: 'elec', label: 'Electric (ELEC)', icon: iconMap.elec },
    { key: 'cng', label: 'CNG', icon: iconMap.cng },
  ];

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
          {showHeatmap && (
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Heatmap Points</span>
              <span className={styles.statValue}>{heatmapPointCount || 0}</span>
            </div>
          )}
        </div>
      </div>

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
                    <option value="AL">Alabama</option>
                    <option value="AK">Alaska</option>
                    <option value="AZ">Arizona</option>
                    <option value="AR">Arkansas</option>
                    <option value="CA">California</option>
                    <option value="CO">Colorado</option>
                    <option value="CT">Connecticut</option>
                    <option value="DE">Delaware</option>
                    <option value="DC">District of Columbia</option>
                    <option value="FL">Florida</option>
                    <option value="GA">Georgia</option>
                    <option value="HI">Hawaii</option>
                    <option value="ID">Idaho</option>
                    <option value="IL">Illinois</option>
                    <option value="IN">Indiana</option>
                    <option value="IA">Iowa</option>
                    <option value="KS">Kansas</option>
                    <option value="KY">Kentucky</option>
                    <option value="LA">Louisiana</option>
                    <option value="ME">Maine</option>
                    <option value="MD">Maryland</option>
                    <option value="MA">Massachusetts</option>
                    <option value="MI">Michigan</option>
                    <option value="MN">Minnesota</option>
                    <option value="MS">Mississippi</option>
                    <option value="MO">Missouri</option>
                    <option value="MT">Montana</option>
                    <option value="NE">Nebraska</option>
                    <option value="NV">Nevada</option>
                    <option value="NH">New Hampshire</option>
                    <option value="NJ">New Jersey</option>
                    <option value="NM">New Mexico</option>
                    <option value="NY">New York</option>
                    <option value="NC">North Carolina</option>
                    <option value="ND">North Dakota</option>
                    <option value="OH">Ohio</option>
                    <option value="OK">Oklahoma</option>
                    <option value="OR">Oregon</option>
                    <option value="PA">Pennsylvania</option>
                    <option value="RI">Rhode Island</option>
                    <option value="SC">South Carolina</option>
                    <option value="SD">South Dakota</option>
                    <option value="TN">Tennessee</option>
                    <option value="TX">Texas</option>
                    <option value="UT">Utah</option>
                    <option value="VT">Vermont</option>
                    <option value="VA">Virginia</option>
                    <option value="WA">Washington</option>
                    <option value="WV">West Virginia</option>
                    <option value="WI">Wisconsin</option>
                    <option value="WY">Wyoming</option>
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
                  {fuelLegends.map(({ key, label }) => (
                    <label key={key} className={styles.filterLabel}>
                      <input
                        type="checkbox"
                        className={styles.filterCheckbox}
                        checked={filters[key]}
                        onChange={() => toggleFilter(key)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Heatmap Controls */}
              <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>Vehicle Heatmap</h4>
                <div className={styles.filterItems}>
                  <label className={styles.filterLabel}>
                    <input
                      type="checkbox"
                      className={styles.filterCheckbox}
                      checked={showHeatmap}
                      onChange={(e) => setShowHeatmap(e.target.checked)}
                    />
                    <span>Show Heatmap</span>
                  </label>
                </div>

                {showHeatmap && vehicleClasses && vehicleClasses.length > 0 && (
                  <div className={styles.filterItems} style={{ marginTop: '10px' }}>
                    <label className={styles.filterGroupSubtitle}>Vehicle Class:</label>
                    {vehicleClasses.map(vehicleClass => (
                      <label key={vehicleClass} className={styles.filterLabel}>
                        <input
                          type="radio"
                          name="vehicleClass"
                          checked={selectedVehicleClass === vehicleClass}
                          onChange={() => setSelectedVehicleClass(vehicleClass)}
                          className={styles.filterCheckbox}
                        />
                        <span style={{ 
                          display: 'inline-block', 
                          width: '12px', 
                          height: '12px', 
                          backgroundColor: getClassColor(vehicleClass), 
                          marginRight: '5px',
                          borderRadius: '2px'
                        }}></span>
                        <span>Class {vehicleClass} - {getVehicleTypeDescription(vehicleClass)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
