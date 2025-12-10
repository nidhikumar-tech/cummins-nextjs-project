# Chart and Graph Component Implementation Guide

## Overview

This document explains the implementation of the Chart and Graph components in the Cummins Fuel Station Analytics dashboard. Both components visualize fuel station data from the `custom_fuel_dataset_5000.csv` file using Chart.js library.

---

## Table of Contents

1. [Component Architecture](#component-architecture)
2. [Chart Component (Pie Charts)](#chart-component-pie-charts)
3. [Graph Component (Bar Charts)](#graph-component-bar-charts)
4. [Data Processing](#data-processing)
5. [Styling and Layout](#styling-and-layout)
6. [Key Features](#key-features)
7. [Usage Examples](#usage-examples)

---

## Component Architecture

### Technology Stack

- **Framework**: Next.js 16.0.3 (React 19.2.0)
- **Charting Library**: Chart.js 4.5.1
- **React Wrapper**: react-chartjs-2 5.3.1
- **Styling**: Tailwind CSS v4
- **Data Source**: CSV file (`/public/custom_fuel_dataset_5000.csv`)

### File Structure

```
src/components/
├── chart/
│   ├── ChartPage.jsx          # Pie chart visualizations
│   ├── ChartPage.module.css   # (Legacy - being removed)
│   └── index.js               # Export file
├── graph/
│   ├── GraphPage.jsx          # Bar chart visualizations
│   ├── GraphPage.module.css   # (Legacy - being removed)
│   └── index.js               # Export file
```

---

## Chart Component (Pie Charts)

### Location
`src/components/chart/ChartPage.jsx`

### Purpose
Displays percentage-based distribution of fuel station data using pie charts.

### Visualizations

#### 1. **Fuel Type Distribution**
- **Purpose**: Shows the breakdown of stations by fuel type (ELEC, CNG, etc.)
- **Data Field**: `Fuel_Type_Code`
- **Chart Type**: Pie Chart
- **Position**: Top section

**Code Implementation:**
```javascript
// Fuel Type Pie Chart Data
const sortedFuelTypes = Object.entries(fuelTypeCounts).sort((a, b) => b[1] - a[1]);
setFuelTypeData({
  labels: sortedFuelTypes.map(([type]) => type),
  datasets: [{
    data: sortedFuelTypes.map(([, count]) => count),
    backgroundColor: ['#1976D2', '#388E3C', '#F57C00', '#5E35B1', '#00796B'],
    borderColor: ['#1976D2', '#388E3C', '#F57C00', '#5E35B1', '#00796B'],
    borderWidth: 2,
  }],
});
```

#### 2. **Top 10 States Distribution**
- **Purpose**: Shows which states have the most fuel stations
- **Data Field**: `State`
- **Chart Type**: Pie Chart
- **Features**: Limited to top 10 states for readability
- **State Names**: Full names displayed (California, Texas, etc.)
- **Position**: Middle section

**Code Implementation:**
```javascript
// State Pie Chart Data (Top 10)
const sortedStates = Object.entries(stateCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

const stateNames = {
  'CA': 'California', 'TX': 'Texas', 'NY': 'New York', // ... mapping
};

setStateData({
  labels: sortedStates.map(([state]) => stateNames[state] || state),
  datasets: [{
    data: sortedStates.map(([, count]) => count),
    backgroundColor: [
      '#1976D2', '#388E3C', '#F57C00', '#5E35B1', '#00796B',
      '#C62828', '#0288D1', '#7B1FA2', '#FBC02D', '#455A64'
    ],
    borderWidth: 2,
  }],
});
```

#### 3. **Operational Status Breakdown**
- **Purpose**: Shows stations by operational status
- **Data Field**: `Status_Code`
- **Chart Type**: Pie Chart
- **Status Types**:
  - **E (Existing)**: Green (#388E3C) - Operational stations
  - **P (Planned)**: Orange (#F57C00) - Future stations
  - **T (Temporarily Unavailable)**: Red (#C62828) - Inactive stations
- **Position**: Bottom section

**Code Implementation:**
```javascript
// Status Pie Chart Data
const statusLabels = {
  'E': 'Existing',
  'P': 'Planned',
  'T': 'Temporarily Unavailable',
};

const sortedStatuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);
setStatusData({
  labels: sortedStatuses.map(([code]) => statusLabels[code] || code),
  datasets: [{
    data: sortedStatuses.map(([, count]) => count),
    backgroundColor: ['#388E3C', '#F57C00', '#C62828'],
    borderWidth: 2,
  }],
});
```

### Chart Configuration

```javascript
const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        font: { size: 12, weight: '500' },
        color: '#0f172a',
        padding: 15,
        usePointStyle: true,
        pointStyle: 'circle',
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      callbacks: {
        label: function(context) {
          const value = context.parsed || 0;
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${context.label}: ${value.toLocaleString()} (${percentage}%)`;
        },
      },
    },
  },
};
```

---

## Graph Component (Bar Charts)

### Location
`src/components/graph/GraphPage.jsx`

### Purpose
Displays count-based comparisons using bar charts with detailed breakdowns.

### Visualizations

#### 1. **Fuel Type Count**
- **Purpose**: Compares the number of stations for each fuel type
- **Data Field**: `Fuel_Type_Code`
- **Chart Type**: Vertical Bar Chart
- **X-axis**: Fuel types (ELEC, CNG, etc.)
- **Y-axis**: Number of stations
- **Sorting**: Descending order by count
- **Position**: Top section

**Code Implementation:**
```javascript
// Fuel Type Bar Chart
const sortedEntries = Object.entries(fuelTypeCounts).sort((a, b) => b[1] - a[1]);
const labels = sortedEntries.map(([type]) => type);
const data = sortedEntries.map(([, count]) => count);

setChartData({
  labels,
  datasets: [{
    label: 'Number of Stations',
    data,
    backgroundColor: [
      '#1976D2', '#388E3C', '#F57C00', '#5E35B1', 
      '#00796B', '#C62828', '#0288D1', '#7B1FA2'
    ],
    borderWidth: 2,
    borderRadius: 6,
    barThickness: 60,
  }],
});
```

#### 2. **Stations per State**
- **Purpose**: Compares station counts across states
- **Data Field**: `State`
- **Chart Type**: Vertical Bar Chart
- **Features**: Top 10 states only, full state names
- **X-axis**: State names (California, Texas, etc.)
- **Y-axis**: Number of stations
- **Position**: Middle section

**Code Implementation:**
```javascript
// State Bar Chart (Top 10)
const sortedStates = Object.entries(stateCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

const stateLabels = sortedStates.map(([state]) => stateNames[state] || state);
const stateData = sortedStates.map(([, count]) => count);

setStateChartData({
  labels: stateLabels,
  datasets: [{
    label: 'Number of Stations',
    data: stateData,
    backgroundColor: [
      '#1976D2', '#388E3C', '#F57C00', '#5E35B1', '#00796B',
      '#C62828', '#0288D1', '#7B1FA2', '#FBC02D', '#455A64'
    ],
    borderWidth: 2,
    borderRadius: 6,
    barThickness: 50,
  }],
});
```

#### 3. **Station Operational Status by State**
- **Purpose**: Shows operational status breakdown for each state
- **Data Field**: `State` + `Status_Code`
- **Chart Type**: Grouped Bar Chart
- **Features**: 
  - Three bars per state (Existing, Planned, Temporarily Unavailable)
  - Top 10 states by total station count
  - Legend showing status types
- **X-axis**: State names
- **Y-axis**: Number of stations
- **Position**: Bottom section

**Code Implementation:**
```javascript
// Status by State Chart
const stateStatusBreakdown = {};

// Build status breakdown per state
for (let i = 1; i < lines.length; i++) {
  // ... CSV parsing logic ...
  const state = values[4];
  const status = values[8];
  
  if (state && status) {
    if (!stateStatusBreakdown[state]) {
      stateStatusBreakdown[state] = { E: 0, P: 0, T: 0 };
    }
    if (status === 'E' || status === 'P' || status === 'T') {
      stateStatusBreakdown[state][status]++;
    }
  }
}

// Sort and get top 10 states
const statesWithTotals = Object.entries(stateStatusBreakdown)
  .map(([state, statuses]) => ({
    state,
    total: statuses.E + statuses.P + statuses.T,
    ...statuses
  }))
  .sort((a, b) => b.total - a.total)
  .slice(0, 10);

// Create datasets for grouped bars
setStatusChartData({
  labels: statesWithTotals.map(s => stateNames[s.state] || s.state),
  datasets: [
    {
      label: 'Existing',
      data: statesWithTotals.map(s => s.E),
      backgroundColor: '#388E3C',
      borderWidth: 2,
      borderRadius: 6,
    },
    {
      label: 'Planned',
      data: statesWithTotals.map(s => s.P),
      backgroundColor: '#F57C00',
      borderWidth: 2,
      borderRadius: 6,
    },
    {
      label: 'Temporarily Unavailable',
      data: statesWithTotals.map(s => s.T),
      backgroundColor: '#C62828',
      borderWidth: 2,
      borderRadius: 6,
    },
  ],
});
```

### Chart Configuration

```javascript
const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }, // Hidden for single-dataset charts
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      callbacks: {
        label: function(context) {
          return `Stations: ${context.parsed.y.toLocaleString()}`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 12, weight: '500' }, color: '#64748b' },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0, 0, 0, 0.05)' },
      ticks: {
        callback: function(value) {
          return value.toLocaleString();
        },
      },
    },
  },
};

// Special options for grouped status chart
const statusChartOptions = {
  ...options,
  plugins: {
    ...options.plugins,
    legend: {
      display: true,
      position: 'top',
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
      },
    },
  },
};
```

---

## Data Processing

### CSV Parsing Strategy

Both components use a custom CSV parser that handles:
- Quoted fields with commas (e.g., `"City, Name"`)
- Empty values
- Large datasets (5000+ rows)

**Parsing Implementation:**
```javascript
// Proper CSV line parsing with quoted field support
const csvRegex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
const values = [];
let match;

while ((match = csvRegex.exec(line)) !== null) {
  let value = match[1];
  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1).replace(/""/g, '"');
  }
  values.push(value.trim());
}

// Column indices (based on CSV structure)
const fuelType = values[0];  // Fuel_Type_Code
const state = values[4];      // State
const status = values[8];     // Status_Code
```

### Data Aggregation

```javascript
// Counting occurrences
const fuelTypeCounts = {};
const stateCounts = {};
const statusCounts = {};

for (let i = 1; i < lines.length; i++) {
  // ... parse line ...
  
  if (fuelType) {
    fuelTypeCounts[fuelType] = (fuelTypeCounts[fuelType] || 0) + 1;
  }
  
  if (state) {
    stateCounts[state] = (stateCounts[state] || 0) + 1;
  }
  
  if (status) {
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  }
}
```

---

## Styling and Layout

### Layout Structure

Both components use a consistent grid layout:

```javascript
// Main container with gradient background
<div className="px-4 py-6 sm:px-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen max-w-[1600px] mx-auto">
  
  {/* Header */}
  <div className="mb-5 text-center">
    <h1 className="text-2xl font-bold text-slate-900">...</h1>
    <p className="text-base text-slate-600">...</p>
  </div>
  
  {/* Chart Section with Sidebar */}
  <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
    
    {/* Chart Area */}
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <h2 className="text-xl font-semibold mb-5 text-center">...</h2>
      <div className="h-96 w-full">
        {/* Chart Component */}
      </div>
    </div>
    
    {/* Sidebar with Stats */}
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        {/* Statistics */}
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        {/* Insights */}
      </div>
    </div>
    
  </div>
</div>
```

### Color Palette

**Material Design Colors (Industry Standard):**
```javascript
// Primary palette
'#1976D2' // Blue 700 (Primary)
'#388E3C' // Green 700 (Success/Existing)
'#F57C00' // Orange 700 (Warning/Planned)
'#C62828' // Red 800 (Error/Unavailable)
'#5E35B1' // Deep Purple 600
'#00796B' // Teal 700
'#0288D1' // Light Blue 700
'#7B1FA2' // Purple 700
'#FBC02D' // Yellow 700
'#455A64' // Blue Grey 700
```

### Responsive Design

```javascript
// Breakpoints
sm: 640px   // Small devices
md: 768px   // Medium devices
lg: 1024px  // Large devices
xl: 1280px  // Extra large devices

// Grid adjustments
grid-cols-1              // Mobile: single column
lg:grid-cols-[1fr_300px] // Desktop: main + 300px sidebar
```

---

## Key Features

### 1. **Real-time Data Loading**
- Fetches CSV data on component mount
- Loading state displayed during data fetch
- Error handling for failed requests

### 2. **Interactive Tooltips**
- Hover over chart segments to see details
- Displays:
  - Label name
  - Exact count
  - Percentage (pie charts)
- Formatted numbers with commas (1,234)

### 3. **Professional Legends**
- Position: Right side (pie charts), Top (grouped bar charts)
- Circular point style
- Clear, readable font
- Color-coded to match chart segments

### 4. **Statistics Sidebar**
- Total stations count
- Number of fuel types
- Top states shown
- Key insights for each visualization

### 5. **State Name Conversion**
- All 50 US states mapped
- Displays full names instead of abbreviations
- Example: `CA` → `California`

### 6. **Sorting and Filtering**
- All data sorted by count (descending)
- Top 10 limitation for readability
- Status breakdown grouped logically

---

## Usage Examples

### Accessing the Components

**Chart Component (Pie Charts):**
```
URL: http://localhost:3000/dashboard/chart
Navigation: Dashboard → Chart
```

**Graph Component (Bar Charts):**
```
URL: http://localhost:3000/dashboard/graph
Navigation: Dashboard → Graph
```

### Sample Data Flow

```
1. User navigates to /dashboard/chart or /dashboard/graph
2. Component mounts and useEffect triggers
3. Fetch CSV file from /public/custom_fuel_dataset_5000.csv
4. Parse CSV using custom regex parser
5. Aggregate data into counts (fuel types, states, statuses)
6. Sort data and apply limits (top 10 for states)
7. Format data for Chart.js
8. Render charts with configurations
9. Display statistics in sidebar
```

### Component Registration

Both components are registered in Chart.js:

```javascript
import {
  Chart as ChartJS,
  CategoryScale,    // For bar charts (x-axis categories)
  LinearScale,      // For bar charts (y-axis numbers)
  BarElement,       // Bar chart rendering
  ArcElement,       // Pie chart rendering
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);
```

---

## Performance Considerations

### Optimization Strategies

1. **Single Data Fetch**: CSV loaded once on mount, not on every render
2. **Memoization**: Data processing happens in useEffect with proper dependencies
3. **Top N Limiting**: Only shows top 10 states to reduce rendering load
4. **Lazy Loading**: Components only load when navigated to
5. **Chart.js Caching**: Chart.js internal optimizations handle re-renders efficiently

### Memory Management

- Data stored in component state (not global)
- Cleaned up automatically when component unmounts
- No memory leaks from event listeners

---

## Troubleshooting

### Common Issues

**1. Charts Not Displaying**
- Check if Chart.js components are registered
- Verify CSV file exists in `/public` directory
- Check browser console for errors

**2. Data Not Loading**
- Verify CSV file path is correct
- Check CSV format matches expected structure
- Look for parsing errors in console

**3. Colors Not Matching**
- Ensure color arrays have enough colors for data items
- Check Material Design color codes are correct

**4. State Names Not Converting**
- Verify `stateNames` object has all mappings
- Check CSV uses standard 2-letter state codes

---

## Future Enhancements

### Potential Improvements

1. **Data Filtering**
   - Add date range filters
   - Filter by multiple criteria simultaneously
   - Search functionality for states

2. **Export Capabilities**
   - Download charts as images
   - Export data to CSV/Excel
   - Print-friendly view

3. **Advanced Analytics**
   - Trend analysis over time
   - Predictive modeling
   - Comparative analysis

4. **Performance**
   - Virtual scrolling for large datasets
   - Web Workers for data processing
   - Progressive loading

5. **Accessibility**
   - Keyboard navigation
   - Screen reader support
   - High contrast mode

---

## API Reference

### ChartPage Component

**Props:** None (standalone component)

**State Variables:**
```javascript
fuelTypeData      // Pie chart data for fuel types
stateData         // Pie chart data for states
statusData        // Pie chart data for operational status
loading           // Boolean loading state
stats             // Object with totalStations, fuelTypes, topStates
```

### GraphPage Component

**Props:** None (standalone component)

**State Variables:**
```javascript
chartData         // Bar chart data for fuel types
stateChartData    // Bar chart data for states
statusChartData   // Grouped bar chart data for status by state
loading           // Boolean loading state
stats             // Object with totalStations, fuelTypes, topStates
```

---

## Conclusion

Both the Chart and Graph components provide comprehensive visualizations of fuel station data using industry-standard charting libraries and professional design patterns. They offer users multiple perspectives on the data through different chart types, making it easy to identify patterns, trends, and insights.

The implementation follows React best practices, uses efficient data processing, and maintains a consistent, professional appearance across all visualizations.
