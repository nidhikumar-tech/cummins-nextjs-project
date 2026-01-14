"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, user } = useAuth();
  const router = useRouter();

  // If user is already logged in, kick them to dashboard
  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      console.error(err);
      setError("Invalid credentials.");
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f5f9" }}>
      <div style={{ background: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", width: "100%", maxWidth: "400px" }}>
        <h1 style={{ color: "#0f172a", fontSize: "24px", fontWeight: "700", marginBottom: "8px", textAlign: "center" }}>Cummins Analytics</h1>
        <p style={{ color: "#64748b", textAlign: "center", marginBottom: "32px", fontSize: "14px" }}>Sign in to access dashboard</p>
        
        {error && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px", borderRadius: "6px", marginBottom: "16px", fontSize: "14px", textAlign: "center" }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "14px", fontWeight: "500", color: "#334155" }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: "12px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "14px", fontWeight: "500", color: "#334155" }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: "12px", border: "1px solid #cbd5e1", borderRadius: "6px" }} />
          </div>
          <button type="submit" style={{ backgroundColor: "#0f172a", color: "white", padding: "12px", borderRadius: "6px", fontWeight: "600", cursor: "pointer", border: "none", marginTop: "8px" }}>Sign In</button>
        </form>
      </div>
    </div>
  );
}