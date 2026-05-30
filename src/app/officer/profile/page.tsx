"use client";

import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Shield, Phone, MapPin } from "lucide-react";

export default function OfficerProfilePage() {
  const { userName, role, user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading text-[var(--text-dark)]">My Profile</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">View and manage your account details</p>
      </div>

      <Card className="rounded-xl border-[var(--border-user)] shadow-sm overflow-hidden">
        <div className="h-32 bg-[var(--toyota-red)]" />
        <CardContent className="p-6 relative">
          <div className="absolute -top-16 left-6">
            <div className="h-24 w-24 rounded-full border-4 border-white bg-[var(--toyota-red)] text-white flex items-center justify-center text-3xl font-bold shadow-md">
              {userName ? userName.substring(0, 2).toUpperCase() : "U"}
            </div>
          </div>
          
          <div className="pt-10 space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-heading text-[var(--text-dark)]">{userName || "Sales Officer"}</h2>
              <span className="inline-block mt-1 bg-[var(--red-light)] text-[var(--toyota-red)] text-xs px-2.5 py-1 rounded-full font-bold capitalize">
                {role || "Officer"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[var(--border-user)] pt-6">
              <div className="flex items-center space-x-3 text-sm">
                <Mail className="h-4 w-4 text-[var(--text-muted)]" />
                <span className="text-[var(--text-dark)]">{user?.email || "officer@toyota.com"}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Shield className="h-4 w-4 text-[var(--text-muted)]" />
                <span className="text-[var(--text-dark)] capitalize">{role || "officer"} Account</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Phone className="h-4 w-4 text-[var(--text-muted)]" />
                <span className="text-[var(--text-dark)]">+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <MapPin className="h-4 w-4 text-[var(--text-muted)]" />
                <span className="text-[var(--text-dark)]">Kochi Branch, Kerala</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
