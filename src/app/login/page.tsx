"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        const { data: userData, error: userError } = await supabase.from("users").select("role").eq("email", email).single();
        
        if (userError) {
          console.error("Error fetching user role:", userError);
        }

        const role = userData?.role;
        console.log("Fetched role:", role);
        
        if (role === "admin") {
          router.push("/admin/dashboard");
        } else if (role === "officer") {
          router.push("/officer/dashboard");
        } else {
          setError(`Invalid role assigned to user. Role found: ${role || 'None'}`);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)] p-4 md:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          {/* Toyota Logo */}
          <div className="flex items-center justify-center mb-2">
            <Image src="/loginlogo.png" alt="Nippon Toyota Logo" width={400} height={160} className="object-contain" />
          </div>
          <h2 className="text-3xl font-bold text-[var(--text-dark)]">Welcome Back</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Sign in to access your dashboard</p>
        </div>

        <Card className="border-0 bg-transparent shadow-none">
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-dark)]">Employee Email</label>
                <Input
                  type="email"
                  placeholder="employee@nippotoyota.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-[var(--border-user)] bg-white focus-visible:ring-[var(--toyota-red)]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-dark)]">Password</label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-[var(--border-user)] bg-white focus-visible:ring-[var(--toyota-red)]"
                />
              </div>
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--toyota-red)] text-white hover:bg-[var(--red-hover)]"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              
              <div className="text-center">
                <a href="#" className="text-xs text-[var(--text-muted)] hover:text-[var(--toyota-red)]">
                  Forgot your password?
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center text-xs text-[var(--text-muted)]">
          Secure portal · TLS encrypted
        </p>
      </div>
    </div>
  );
}
