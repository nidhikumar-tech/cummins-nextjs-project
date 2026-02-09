"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DataCharts from "@/components/charts/DataCharts";
import DataMap from "@/components/predictions/DataMap";

export default function ChartRoute() {
  return (
    <DashboardLayout>
      <DataMap/>
      <DataCharts/>
    </DashboardLayout>
  );
}
