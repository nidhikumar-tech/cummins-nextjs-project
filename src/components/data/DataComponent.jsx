"use client";

import DataCharts from "@/components/data/charts/DataCharts";
import DataMap from "@/components/data/map/DataMap";

export default function PredictionComponent() {
  return (
    <div>
        <DataMap/>
        <DataCharts/>
    </div>
  );
}