"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DataCharts from "@/components/data/charts/DataCharts";
import DataMap from "@/components/data/map/DataMap";

export default function ChartRoute() {
  return (
    <DashboardLayout>
      <DataMap/>
      <DataCharts/>
    </DashboardLayout>
  );
}
