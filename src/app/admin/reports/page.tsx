"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download, FileText, TrendingUp } from "lucide-react";

const DATA = [
  { name: 'Jan', revenue: 4000000, payout: 150000 },
  { name: 'Feb', revenue: 4500000, payout: 180000 },
  { name: 'Mar', revenue: 5200000, payout: 220000 },
  { name: 'Apr', revenue: 4800000, payout: 195000 },
  { name: 'May', revenue: 6100000, payout: 245600 },
];

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading text-[var(--text-dark)]">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Export data and analyze historical payout trends</p>
        </div>
        <button className="mt-4 md:mt-0 flex items-center space-x-2 bg-[var(--toyota-red)] hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
          <Download className="h-4 w-4" />
          <span>Export All Data</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-xl border-[var(--border-user)] shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold font-heading mb-6 flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-[var(--toyota-red)]" />
              <span>Historical Sales Revenue</span>
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E2D9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#7A7A7A' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7A7A7A' }} tickFormatter={(val) => `₹${val/100000}L`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="revenue" fill="var(--toyota-red)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-[var(--border-user)] shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold font-heading mb-6 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-[var(--toyota-red)]" />
              <span>Recent Downloads</span>
            </h3>
            <div className="space-y-4">
              {[
                { title: "May 2026 Incentives Report", date: "May 28, 2026", size: "1.2 MB" },
                { title: "April 2026 Performance Audit", date: "April 30, 2026", size: "2.4 MB" },
                { title: "Fiscal Year Q1 Incentive Summary", date: "April 15, 2026", size: "4.8 MB" },
              ].map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-[var(--bg-page)] rounded-lg hover:bg-[var(--red-light)] transition-colors cursor-pointer group">
                  <div>
                    <h4 className="text-sm font-semibold text-[var(--text-dark)] group-hover:text-[var(--toyota-red)] transition-colors">{doc.title}</h4>
                    <span className="text-xs text-[var(--text-muted)]">{doc.date}</span>
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-muted)]">{doc.size}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
