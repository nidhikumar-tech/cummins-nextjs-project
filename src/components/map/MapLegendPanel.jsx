import { iconMap } from '@/constants/mapConfig';
import styles from './MapComponent.module.css';

export default function MapLegendPanel({ 
  filters, 
  toggleFilter, 
  regionFilter,
  setRegionFilter,
  ownershipFilter,
  setOwnershipFilter,
  stationCount, 
  isFilterOpen, 
  setIsFilterOpen 
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
              {/* Region Filter */}
              <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>Region</h4>
                <div className={styles.filterItems}>
                  <input
                    type="text"
                    className={styles.filterInput}
                    placeholder="Search by state or city..."
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                  />
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}
