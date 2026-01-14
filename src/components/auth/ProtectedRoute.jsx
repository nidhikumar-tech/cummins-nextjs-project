"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth has finished loading and there is no user, redirect to login
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // 1. Show Loading Spinner (Fixes Hydration Error by isolating UI)
  if (loading) {
    return (
      <div style={{ 
        height: "100vh", 
        display: "flex", 
        flexDirection: "column",
        alignItems: "center", 
        justifyContent: "center",
        gap: "15px"
      }}>
        {/* Simple CSS spinner without styled-jsx to prevent hydration mismatches */}
        <div style={{
          width: "40px",
          height: "40px",
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #3b82f6",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
        <div style={{ color: "#64748b", fontFamily: "sans-serif" }}>Loading Application...</div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  // 2. If no user (and redirect hasn't happened yet), render nothing to protect content
  if (!user) {
    return null;
  }

  // 3. User is authenticated, render the protected content
  return <>{children}</>;
}