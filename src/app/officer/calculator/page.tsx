"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatIndianCurrency } from "@/lib/incentiveCalc";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";

interface Slab {
  id: string;
  tier_name: string;
  min_cars: number;
  max_cars: number | null;
  incentive_per_car: number;
}

interface CarModel {
  id: string;
  model_name: string;
  variant: string;
}

export default function OfficerCalculator() {
  const { user, userName } = useAuth();
  const supabase = createClient();

  const [slabs, setSlabs] = useState<Slab[]>([]);
  const [cars, setCars] = useState<CarModel[]>([]);
  const [salesVolumes, setSalesVolumes] = useState<{ [key: string]: number }>({});
  const [selectedMonth, setSelectedMonth] = useState("May 2026");

  const [existingSales, setExistingSales] = useState<any>(null);
  const [existingCars, setExistingCars] = useState(0);

  const [result, setResult] = useState<number | null>(null);
  const [activeTier, setActiveTier] = useState<string>("None");
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: slabsData } = await supabase.from("incentive_slabs").select("*").order("min_cars", { ascending: true });
      if (slabsData) setSlabs(slabsData);

      const { data: carsData } = await supabase.from("cars").select("*").order("model_name", { ascending: true });
      if (carsData) {
        setCars(carsData);
        const initVols: { [key: string]: number } = {};
        carsData.forEach(c => initVols[c.id] = 0);
        setSalesVolumes(initVols);
      }
    };
    fetchData();
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    const fetchExistingMonthData = async () => {
      const { data, error } = await supabase
        .from("monthly_sales")
        .select("*")
        .eq("user_id", user.id)
        .eq("month", selectedMonth)
        .single();
        
      if (data) {
        setExistingSales(data);
        setExistingCars(data.total_cars || 0);
      } else {
        setExistingSales(null);
        setExistingCars(0);
      }
      
      // Reset current input volumes when month changes
      const initVols: { [key: string]: number } = {};
      cars.forEach(c => initVols[c.id] = 0);
      setSalesVolumes(initVols);
      setResult(null);
    };
    
    fetchExistingMonthData();
  }, [selectedMonth, user, supabase, cars.length]);

  const newlyAddedCars = Object.values(salesVolumes).reduce((acc, val) => acc + (Number(val) || 0), 0);
  const totalCarsSold = existingCars + newlyAddedCars;

  const handleVolumeChange = (carId: string, value: string) => {
    const num = parseInt(value, 10);
    setSalesVolumes(prev => ({ ...prev, [carId]: isNaN(num) ? 0 : num }));
  };

  const handleCalculate = () => {
    let totalIncentive = 0;
    let currentTierName = "None";
    const currentBreakdown = [];

    const sortedSlabs = [...slabs].sort((a, b) => a.min_cars - b.min_cars);

    for (const slab of sortedSlabs) {
      if (totalCarsSold >= slab.min_cars) {
        currentTierName = slab.tier_name;
      }

      const start = slab.min_cars;
      const end = slab.max_cars || Infinity;
      const carsInSlab = Math.max(0, Math.min(totalCarsSold, end) - start + 1);

      if (carsInSlab > 0) {
        const payout = carsInSlab * slab.incentive_per_car;
        totalIncentive += payout;
        currentBreakdown.push({
          tier: slab.tier_name,
          carsInSlab,
          rate: slab.incentive_per_car,
          payout
        });
      }
    }

    setResult(totalIncentive);
    setActiveTier(currentTierName);
    setBreakdown(currentBreakdown);
  };

  useEffect(() => {
    if (result !== null) {
      handleCalculate();
    }
  }, [salesVolumes, slabs, existingCars]);

  const handleSaveToDB = async () => {
    if (!user) return alert("You must be logged in to save.");
    setIsSaving(true);
    
    try {
      if (existingSales) {
        // Update existing row
        await supabase.from("monthly_sales").update({
          total_cars: totalCarsSold,
          total_incentive: result,
          breakdown: breakdown
        }).eq("id", existingSales.id);
      } else {
        // Insert new row
        const { data } = await supabase.from("monthly_sales").insert({
          user_id: user.id,
          user_name: userName,
          month: selectedMonth,
          total_cars: totalCarsSold,
          total_incentive: result,
          breakdown: breakdown
        }).select().single();
        
        if (data) setExistingSales(data);
      }
      
      alert("Sales merged and updated successfully!");
      
      // Update local state to reflect the new baseline
      setExistingCars(totalCarsSold);
      const initVols: { [key: string]: number } = {};
      cars.forEach(c => initVols[c.id] = 0);
      setSalesVolumes(initVols);
      
    } catch (error) {
      console.error("Error saving sales", error);
      alert("Failed to save sales.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading text-[var(--text-dark)]">Log Sales & Incentives</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Input your new sales to merge into your monthly total</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left - Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-xl border-[var(--border-user)] shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6 border-b border-[var(--border-user)] pb-4">
                <h3 className="text-lg font-bold font-heading">Add New Volume</h3>
                <Select value={selectedMonth} onValueChange={(val) => val && setSelectedMonth(val)}>
                  <SelectTrigger className="w-[140px] bg-white text-xs border-[var(--border-user)]">
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="May 2026">May 2026</SelectItem>
                    <SelectItem value="April 2026">April 2026</SelectItem>
                    <SelectItem value="March 2026">March 2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="mb-4 flex items-start space-x-2 bg-blue-50 text-blue-800 p-3 rounded-lg text-xs">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <p>You have already logged <strong>{existingCars} cars</strong> for {selectedMonth}. Any new cars entered below will be added to this total and your incentive will be upgraded automatically.</p>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {cars.length === 0 ? (
                  <div className="text-sm text-gray-500">No cars found. Ask admin to add inventory.</div>
                ) : (
                  cars.map((car) => (
                    <div key={car.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div>
                        <div className="text-sm font-bold text-[var(--text-dark)]">{car.model_name}</div>
                        <div className="text-xs text-[var(--text-muted)]">{car.variant}</div>
                      </div>
                      <div className="w-24">
                        <Input 
                          type="number" 
                          min="0"
                          value={salesVolumes[car.id] || ""} 
                          onChange={e => handleVolumeChange(car.id, e.target.value)} 
                          className="bg-white border-[var(--border-user)] text-center font-bold focus-visible:ring-1 focus-visible:ring-[var(--toyota-red)]" 
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border-user)]">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-[var(--text-muted)] text-xs">Previously Logged</span>
                  <span className="font-bold text-gray-600">{existingCars}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-[var(--text-muted)] text-xs">Newly Added</span>
                  <span className="font-bold text-[var(--toyota-red)]">+{newlyAddedCars}</span>
                </div>
                <div className="flex justify-between items-center mb-6 pt-2 border-t border-dashed">
                  <span className="font-bold text-[var(--text-dark)] uppercase tracking-wider text-xs">Total Month Volume</span>
                  <span className="text-2xl font-bold stat-number text-[#1A1A1A]">{totalCarsSold}</span>
                </div>
                <Button onClick={handleCalculate} className="w-full bg-[var(--toyota-red)] text-white hover:bg-[var(--red-hover)] py-6 text-lg font-bold shadow-md">
                  Calculate Combined Payout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right - Result */}
        <div className="lg:col-span-7">
          <Card className="rounded-xl border-[var(--border-user)] shadow-md bg-white overflow-hidden h-full">
            <div className="h-2 w-full bg-[#1A1A1A]"></div>
            <CardContent className="p-8 flex flex-col h-full">
              
              <div className="mb-8">
                <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Progressive Incentive Earned</h3>
                <motion.div 
                  key={result}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-6xl md:text-7xl payout-number tracking-wider mb-6 text-[#1A1A1A]"
                >
                  {result !== null ? formatIndianCurrency(result) : existingSales ? formatIndianCurrency(existingSales.total_incentive) : "₹0"}
                </motion.div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm font-medium border-b border-[var(--border-user)] pb-8 border-dashed">
                  <div className="flex items-center space-x-2">
                    <span className="text-[var(--text-muted)]">Highest Tier Reached:</span>
                    <span className={`px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wider ${
                      activeTier !== "None" ? "bg-[var(--toyota-red)] text-white" : "bg-[#F0F0F0] text-[#1A1A1A]"
                    }`}>
                      {activeTier}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">Combined Breakdown by Slabs</h4>
                <div className="space-y-3">
                  <AnimatePresence>
                    {breakdown.length === 0 && result !== null && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-gray-500 italic">
                        Not enough sales to qualify for incentives.
                      </motion.div>
                    )}
                    {breakdown.map((b, i) => (
                      <motion.div 
                        key={b.tier}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[var(--red-light)] text-[var(--toyota-red)] flex items-center justify-center font-bold text-sm">
                            {b.carsInSlab}
                          </div>
                          <div>
                            <div className="font-bold text-[var(--text-dark)]">{b.tier}</div>
                            <div className="text-xs text-[var(--text-muted)]">@ {formatIndianCurrency(b.rate)} / car</div>
                          </div>
                        </div>
                        <div className="text-lg font-bold font-heading text-[var(--toyota-red)]">
                          {formatIndianCurrency(b.payout)}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[var(--border-user)] flex flex-col sm:flex-row items-center gap-4">
                <Button 
                  onClick={handleSaveToDB} 
                  disabled={isSaving || result === null || newlyAddedCars === 0}
                  className="w-full sm:w-auto px-8 bg-black text-white hover:bg-gray-800"
                >
                  {isSaving ? "Saving..." : existingSales ? "Merge & Update Database" : "Save to Database"}
                </Button>
                <div className="text-xs text-[var(--text-muted)]">
                  Updates your total log for {selectedMonth}.
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
