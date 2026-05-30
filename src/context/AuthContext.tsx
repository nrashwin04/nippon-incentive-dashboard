"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Role = "admin" | "officer" | null;

interface AuthContextType {
  user: any | null;
  role: Role;
  userName: string | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  userName: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        try {
          const { data, error } = await supabase.from("users").select("*").eq("email", user.email).single();
          if (error) {
            console.error("Supabase query error in AuthContext:", error);
          }
          if (data) {
            setRole(data.role || null);
            setUserName(data.full_name || user.email || null);
          } else {
            setRole(null);
            setUserName(null);
          }
        } catch (error) {
          console.error("Exception in AuthContext:", error);
          setRole(null);
          setUserName(null);
        }
      } else {
        setRole(null);
        setUserName(null);
      }
      setLoading(false);
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const { data, error } = await supabase.from("users").select("*").eq("email", session.user.email).single();
          if (error) {
            console.error("Auth listener query error:", error);
          }
          if (data) {
            setRole(data.role || null);
            setUserName(data.full_name || session.user.email || null);
          }
        } else {
          setUser(null);
          setRole(null);
          setUserName(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, userName, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
