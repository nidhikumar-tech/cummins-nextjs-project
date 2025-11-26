import { legendStyle, iconMap } from '@/constants/mapConfig';

export default function MapLegendPanel({ filters, toggleFilter, stationCount }) {
  return (
    <div style={legendStyle}>
      <h2>Fuel Station Legends</h2>

      {/* Legends */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
        <img src={iconMap.elec} width={24} style={{ marginRight: 10 }} alt="Electric" />
        <span>Electric (ELEC)</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
        <img src={iconMap.cng} width={24} style={{ marginRight: 10 }} alt="CNG" />
        <span>CNG</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
        <img src={iconMap.lng} width={24} style={{ marginRight: 10 }} alt="LNG" />
        <span>LNG</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
        <img src={iconMap.bd} width={24} style={{ marginRight: 10 }} alt="Biodiesel" />
        <span>Biodiesel (BD)</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
        <img src={iconMap.e85} width={24} style={{ marginRight: 10 }} alt="Ethanol" />
        <span>Ethanol (E85)</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
        <img src={iconMap.hy} width={24} style={{ marginRight: 10 }} alt="Hydrogen" />
        <span>Hydrogen (HY)</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
        <img src={iconMap.lpg} width={24} style={{ marginRight: 10 }} alt="Propane" />
        <span>Propane (LPG)</span>
      </div>

      <hr style={{ margin: "20px 0" }} />

      <h3>Filters</h3>

      {/* FILTERS UI */}
      <div>
        <label style={{ display: "block", marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={filters.elec}
            onChange={() => toggleFilter("elec")}
          />{" "}
          Electric
        </label>

        <label style={{ display: "block", marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={filters.cng}
            onChange={() => toggleFilter("cng")}
          />{" "}
          CNG
        </label>

        <label style={{ display: "block", marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={filters.lng}
            onChange={() => toggleFilter("lng")}
          />{" "}
          LNG
        </label>

        <label style={{ display: "block", marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={filters.bd}
            onChange={() => toggleFilter("bd")}
          />{" "}
          Biodiesel
        </label>

        <label style={{ display: "block", marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={filters.e85}
            onChange={() => toggleFilter("e85")}
          />{" "}
          Ethanol (E85)
        </label>

        <label style={{ display: "block", marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={filters.hy}
            onChange={() => toggleFilter("hy")}
          />{" "}
          Hydrogen
        </label>

        <label style={{ display: "block", marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={filters.lpg}
            onChange={() => toggleFilter("lpg")}
          />{" "}
          Propane (LPG)
        </label>
      </div>

      <hr style={{ margin: "20px 0" }} />
      <h3>Stations Displayed: {stationCount}</h3>
    </div>
  );
}
