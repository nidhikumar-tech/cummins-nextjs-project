"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import MapComponent from "@/components/predictions/MapComponent";

export default function MapRoute() {
  return (
    <DashboardLayout>
      <MapComponent />
    </DashboardLayout>
  );
}
