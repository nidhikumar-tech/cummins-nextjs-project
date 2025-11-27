"use client";

import { redirect } from "next/navigation";

export default function Dashboard() {
  // Redirect to heatmap by default
  redirect("/dashboard/heatmap");
}
