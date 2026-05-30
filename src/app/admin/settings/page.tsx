"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Settings, Bell, Lock, Globe } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading text-[var(--text-dark)]">System Settings</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Configure application rules and system options</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-2">
          {[
            { label: "General Settings", icon: Settings, active: true },
            { label: "Notifications", icon: Bell },
            { label: "Security & Passwords", icon: Lock },
            { label: "Branch Preferences", icon: Globe },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
                  item.active
                    ? "bg-[var(--toyota-red)] text-white"
                    : "bg-white text-[var(--text-muted)] hover:bg-[var(--red-light)] hover:text-[var(--toyota-red)] border border-[var(--border-user)]"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="md:col-span-2">
          <Card className="rounded-xl border-[var(--border-user)] shadow-sm">
            <CardContent className="p-6 space-y-6">
              <h3 className="text-lg font-bold font-heading border-b border-[var(--border-user)] pb-3">General Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--text-dark)] mb-1">Branch Name</label>
                  <input
                    type="text"
                    defaultValue="Kochi Branch"
                    className="w-full border border-[var(--border-user)] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[var(--toyota-red)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--text-dark)] mb-1">Base Currency</label>
                  <input
                    type="text"
                    defaultValue="INR (₹)"
                    disabled
                    className="w-full border border-[var(--border-user)] rounded-lg px-3 py-2 text-sm bg-gray-50 text-[var(--text-muted)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--text-dark)] mb-1">Incentive Distribution Cycle</label>
                  <select className="w-full border border-[var(--border-user)] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[var(--toyota-red)]">
                    <option>Monthly (End of month)</option>
                    <option>Quarterly</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-user)] flex justify-end">
                <button className="bg-[var(--toyota-red)] hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
                  Save Changes
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
