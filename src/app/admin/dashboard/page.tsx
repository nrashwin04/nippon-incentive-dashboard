"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, IndianRupee, Target, Star, Percent } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MOCK_LINE_DATA = [
  { name: 'Jan', sales: 0 },
  { name: 'Feb', sales: 0 },
  { name: 'Mar', sales: 0 },
  { name: 'Apr', sales: 0 },
  { name: 'May', sales: 0 }, // We will replace May with real data
];

export default function AdminDashboard() {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { userName } = useAuth();
  const supabase = createClient();
  const [selectedMonth, setSelectedMonth] = useState("May 2026");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await supabase.from("monthly_sales").select("*").eq("month", selectedMonth);
        setSalesData(data || []);
      } catch (err) {
        console.error("Error fetching sales logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedMonth, supabase]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Deduplicate salesData to handle any leftover legacy duplicate logs
  const userMap = new Map();
  salesData.forEach(log => {
    if (!userMap.has(log.user_id) || userMap.get(log.user_id).total_cars < log.total_cars) {
      userMap.set(log.user_id, log);
    }
  });
  const dedupedSales = Array.from(userMap.values());

  const totalCars = dedupedSales.reduce((acc, curr) => acc + (curr.total_cars || 0), 0);
  const totalIncentive = dedupedSales.reduce((acc, curr) => acc + (curr.total_incentive || 0), 0);
  
  // Sort leaderboard by most cars
  const leaderboard = [...dedupedSales].sort((a, b) => (b.total_cars || 0) - (a.total_cars || 0));

  // Update mock chart data with real May data for demonstration
  const chartData = MOCK_LINE_DATA.map(d => 
    d.name === 'May' ? { ...d, sales: totalCars, payout: totalIncentive } : d
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading text-[var(--text-dark)]">Performance Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Track your sales performance and incentives · {selectedMonth}</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Select value={selectedMonth} onValueChange={(val) => val && setSelectedMonth(val)}>
            <SelectTrigger className="w-[180px] bg-white border-[var(--border-user)]">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="May 2026">May 2026</SelectItem>
              <SelectItem value="April 2026">April 2026</SelectItem>
              <SelectItem value="March 2026">March 2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Car, val: totalCars.toString(), label: "Total Branch Sales", badge: "Live" },
          { icon: IndianRupee, val: formatCurrency(totalIncentive), label: "Total Incentives Earned", badge: "Live" },
          { icon: Target, val: leaderboard.length.toString(), label: "Active Officers", badge: "Live" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="rounded-xl border-[var(--border-user)] shadow-sm">
              <CardContent className="p-5 flex flex-col relative">
                <div className="absolute top-5 right-5">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                    {stat.badge}
                  </span>
                </div>
                <div className="h-10 w-10 rounded-full bg-[var(--red-light)] flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-[var(--toyota-red)]" />
                </div>
                <div className="text-3xl stat-number tracking-wide">{stat.val}</div>
                <div className="text-sm text-[var(--text-muted)] mt-1">{stat.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <Card className="lg:col-span-6 rounded-xl border-[var(--border-user)] shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold font-heading mb-6">Monthly Sales Trend</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E2D9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#7A7A7A' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7A7A7A' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="var(--toyota-red)" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: 'var(--toyota-red)', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-4 rounded-xl border-[var(--border-user)] shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold font-heading mb-6">Incentive Analytics</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E2D9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#7A7A7A' }} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#7A7A7A' }} 
                    tickFormatter={(val) => val >= 100000 ? `₹${(val/100000).toFixed(1)}L` : `₹${val}`} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--red-light)' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Bar dataKey="payout" fill="var(--toyota-red)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card className="rounded-xl border-[var(--border-user)] shadow-sm">
        <CardContent className="p-0">
          <div className="p-6 border-b border-[var(--border-user)] bg-white rounded-t-xl">
            <h3 className="text-lg font-bold font-heading">Kochi Branch Leaderboard ({selectedMonth})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-semibold">Rank</th>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Cars Sold</th>
                  <th className="px-6 py-4 font-semibold text-right">Payout This Month</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-user)] bg-white">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-4 text-center">Loading leaderboard...</td></tr>
                ) : leaderboard.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-4 text-center">No sales recorded for this month yet.</td></tr>
                ) : (
                  leaderboard.map((entry, index) => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-gray-600 group-hover:text-[var(--toyota-red)]">{index + 1}</td>
                      <td className="px-6 py-4 font-semibold text-[var(--text-dark)] flex items-center gap-2">
                        {entry.user_name || 'Unknown Officer'}
                        {entry.user_name === userName && (
                          <span className="bg-[var(--red-light)] text-[var(--toyota-red)] text-[10px] px-2 py-0.5 rounded-full font-bold">YOU</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-dark)]">{entry.total_cars}</td>
                      <td className="px-6 py-4 text-right stat-number text-lg text-[var(--text-dark)] group-hover:text-[var(--toyota-red)]">
                        {formatCurrency(entry.total_incentive)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
