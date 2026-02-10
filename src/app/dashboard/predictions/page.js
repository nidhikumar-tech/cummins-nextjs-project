"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PredictionComponent from "@/components/predictions/PredictionComponent";

export default function PredictionRoute() {
  return (
    <DashboardLayout>
      <PredictionComponent/>
    </DashboardLayout>
  );
}
