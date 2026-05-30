"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { formatIndianCurrency } from "@/lib/incentiveCalc";
import { Car, Trophy, Award } from "lucide-react";

export default function OfficerDashboard() {
  const { user, userName, supabase } = useAuth();
  const [salesData, setSalesData] = useState<any[]>([]);
  const [month, setMonth] = useState("May 2026");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.from("monthly_sales").select("*").eq("month", month);
        setSalesData(data || []);
      } catch (err) {
        console.error("Error fetching sales logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [month, supabase]);

  const mySales = salesData
    .filter(s => s.user_id === user?.id)
    .sort((a, b) => (b.total_cars || 0) - (a.total_cars || 0))[0];

  const totalCarsSold = mySales?.total_cars || 0;
  const totalPayout = mySales?.total_incentive || 0;
  const breakdown = mySales?.breakdown || [];
  
  let activeTierName = "None";
  if (breakdown.length > 0) {
    activeTierName = breakdown[breakdown.length - 1].tier;
  }

  // Deduplicate salesData to handle any leftover legacy duplicate logs
  const userMap = new Map();
  salesData.forEach(log => {
    if (!userMap.has(log.user_id) || userMap.get(log.user_id).total_cars < log.total_cars) {
      userMap.set(log.user_id, log);
    }
  });
  const dedupedSales = Array.from(userMap.values());

  // Sort leaderboard by most cars
  const leaderboard = [...dedupedSales].sort((a, b) => (b.total_cars || 0) - (a.total_cars || 0));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading text-[var(--text-dark)]">
          Good morning, {userName || "Officer"}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Nippon Toyota, Kochi · {month}</p>
      </div>

      {/* Row 1 - Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-xl border-[var(--border-user)] shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">My Cars Sold</div>
                <div className="text-4xl stat-number">{totalCarsSold}</div>
              </div>
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Car className="h-5 w-5 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl border border-[var(--toyota-red)] shadow-sm bg-[var(--red-light)] relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10">
            <Award size={100} className="text-[var(--toyota-red)]" />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="text-sm font-semibold text-[var(--toyota-red)] uppercase tracking-wider mb-2">My Incentive</div>
            <motion.div className="text-4xl payout-number tracking-wider">
              {formatIndianCurrency(totalPayout)}
            </motion.div>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl border-[var(--border-user)] shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Active Tier</div>
                <div className="mt-1">
                  {activeTierName !== "None" ? (
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-bold bg-[var(--toyota-red)] text-white">
                      {activeTierName}
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-bold bg-gray-200 text-gray-500">
                      None
                    </span>
                  )}
                </div>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-[var(--border-user)] shadow-sm">
        <h3 className="font-bold font-heading text-[var(--text-dark)] ml-2">Viewing data for:</h3>
        <Select value={month} onValueChange={(v) => v && setMonth(v)}>
          <SelectTrigger className="w-[180px] bg-[var(--bg-page)] border-[var(--border-user)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="May 2026">May 2026</SelectItem>
            <SelectItem value="April 2026">April 2026</SelectItem>
            <SelectItem value="March 2026">March 2026</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Leaderboard */}
        <div className="lg:col-span-7">
          <Card className="rounded-xl border-[var(--border-user)] shadow-sm">
            <CardContent className="p-0">
              <div className="p-6 border-b border-[var(--border-user)] bg-white rounded-t-xl">
                <h3 className="text-lg font-bold font-heading">Kochi Branch Leaderboard ({month})</h3>
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
                      leaderboard.map((entry, index) => {
                        const isMe = entry.user_id === user?.id;
                        return (
                          <tr key={entry.id} className={`transition-colors group ${isMe ? 'bg-[var(--red-light)]' : 'hover:bg-gray-50'}`}>
                            <td className={`px-6 py-4 font-bold ${isMe ? 'text-[var(--toyota-red)]' : 'text-gray-600 group-hover:text-[var(--toyota-red)]'}`}>
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 font-semibold text-[var(--text-dark)] flex items-center gap-2">
                              {entry.user_name || 'Unknown Officer'}
                              {isMe && (
                                <span className="bg-[var(--toyota-red)] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">YOU</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-[var(--text-dark)]">{entry.total_cars}</td>
                            <td className={`px-6 py-4 text-right stat-number text-lg ${isMe ? 'text-[var(--toyota-red)]' : 'text-[var(--text-dark)] group-hover:text-[var(--toyota-red)]'}`}>
                              {formatIndianCurrency(entry.total_incentive)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Your Payout Breakdown */}
        <div className="lg:col-span-5">
          <div className="sticky top-8">
            <Card className="rounded-2xl shadow-lg border-0 border-t-4 border-t-[var(--toyota-red)]">
              <CardContent className="p-8">
                <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">MY PAYOUT BREAKDOWN</h3>
                <motion.div className="text-6xl payout-number tracking-wider mb-4 text-[#1A1A1A]">
                  {formatIndianCurrency(totalPayout)}
                </motion.div>
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <span className="text-[var(--text-muted)]">Active Tier:</span>
                  {activeTierName !== "None" ? (
                    <span className="bg-[var(--red-light)] text-[var(--toyota-red)] px-2 py-0.5 rounded-full font-bold">{activeTierName}</span>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </div>

                <div className="my-6 border-t border-[var(--border-user)] border-dashed"></div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-[var(--text-dark)] mb-4">How you earned it</h4>
                  
                  <AnimatePresence>
                    {breakdown.length === 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-lg border border-gray-100">
                        You haven't logged enough sales to qualify for incentives this month. Head over to the Calculator to log your sales!
                      </motion.div>
                    )}
                    {breakdown.map((b: any, i: number) => (
                      <motion.div 
                        key={b.tier}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100 shadow-sm mb-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--red-light)] text-[var(--toyota-red)] flex items-center justify-center font-bold text-xs">
                            {b.carsInSlab}
                          </div>
                          <div>
                            <div className="font-bold text-[var(--text-dark)] text-sm">{b.tier}</div>
                            <div className="text-[10px] text-[var(--text-muted)]">@ {formatIndianCurrency(b.rate)} / car</div>
                          </div>
                        </div>
                        <div className="text-sm font-bold font-heading text-[var(--toyota-red)]">
                          {formatIndianCurrency(b.payout)}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                </div>

                <div className="my-6 border-t border-[var(--border-user)] border-dashed"></div>

                <div className="text-center">
                  <span className="text-2xl stat-number tracking-wider">{totalCarsSold}</span>
                  <span className="ml-2 text-sm text-[var(--text-muted)] font-medium">cars sold total</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
