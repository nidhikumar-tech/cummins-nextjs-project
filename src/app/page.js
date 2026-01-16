"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    {/* When loading becomes false, check if user is logged in and decide to go to /dashboard/map or /login accordingly */}
    if (!loading) {
      if (user) {
        
        router.push("/dashboard/map");
      } else {
        
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  // A loader while deciding where to go
  return (
    <div style={{ 
      height: "100vh", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      gap: "15px" 
    }}>
      <div style={{
        width: "40px",
        height: "40px",
        border: "4px solid #f3f3f3",
        borderTop: "4px solid #3b82f6",
        borderRadius: "50%",
        animation: "spin 1s linear infinite"
      }} />
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}