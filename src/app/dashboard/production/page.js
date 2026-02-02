"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProductionMap from "@/components/production/ProductionMap";

export default function ProductionPage() {
  return (
    <DashboardLayout>
      <ProductionMap />
    </DashboardLayout>
  );
}