"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => { {/* Check if there is an existing */}
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Session expiry check
  useEffect(() => {
    if (user) {
      const sessionDuration = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
      
      // Set fresh login time when user logs in
      localStorage.setItem('lastLoginTime', Date.now().toString());
      
      // Check session expiry every 10 seconds
      const intervalId = setInterval(() => {
        const lastLogin = localStorage.getItem('lastLoginTime');
        const now = Date.now();
        
        if (lastLogin && (now - parseInt(lastLogin)) > sessionDuration) {
          logout(); // Force logout after session expires
        }
      }, 10000); // Check every 10 seconds
      
      // Cleanup interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [user]);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    localStorage.removeItem('lastLoginTime'); // Clear the timestamp on logout
    setUser(null);
    await signOut(auth);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};