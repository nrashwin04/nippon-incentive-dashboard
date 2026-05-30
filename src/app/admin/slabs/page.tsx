"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { motion, Variants } from "framer-motion";

interface Slab {
  id: string;
  tier_name: string;
  min_cars: number;
  max_cars: number | null;
  incentive_per_car: number;
}

export default function AdminSlabsPage() {
  const [slabs, setSlabs] = useState<Slab[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const supabase = createClient();

  // Form State
  const [tierName, setTierName] = useState("");
  const [minCars, setMinCars] = useState<number | "">("");
  const [maxCars, setMaxCars] = useState<number | "">("");
  const [incentivePerCar, setIncentivePerCar] = useState<number | "">("");

  useEffect(() => {
    fetchSlabs();
    
    const channel = supabase.channel("custom-all-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "incentive_slabs" },
        (payload) => {
          fetchSlabs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSlabs = async () => {
    const { data } = await supabase.from("incentive_slabs").select("*").order("min_cars", { ascending: true });
    if (data) setSlabs(data);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      tier_name: tierName,
      min_cars: Number(minCars),
      max_cars: maxCars === "" ? null : Number(maxCars),
      incentive_per_car: Number(incentivePerCar)
    };
    try {
      if (editId) {
        await supabase.from("incentive_slabs").update(payload).eq("id", editId);
      } else {
        await supabase.from("incentive_slabs").insert(payload);
      }
      setIsModalOpen(false);
      resetForm();
      fetchSlabs(); // Instantly update UI
    } catch (err) {
      console.error("Error saving slab:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this slab?")) {
      try {
        await supabase.from("incentive_slabs").delete().eq("id", id);
        fetchSlabs(); // Instantly update UI
      } catch (err) {
        console.error("Error deleting slab:", err);
      }
    }
  };

  const openEdit = (slab: Slab) => {
    setEditId(slab.id);
    setTierName(slab.tier_name);
    setMinCars(slab.min_cars);
    setMaxCars(slab.max_cars === null ? "" : slab.max_cars);
    setIncentivePerCar(slab.incentive_per_car);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditId(null);
    setTierName("");
    setMinCars("");
    setMaxCars("");
    setIncentivePerCar("");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading text-[var(--text-dark)]">Incentive Slab Configuration</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Define performance tiers and payout rates</p>
      </div>

      {/* Visual Tier Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {slabs.length === 0 ? (
           <div className="text-sm text-gray-500 italic col-span-3">No slabs configured yet. Add them below.</div>
        ) : slabs.map((slab, index) => {
          const isTopTier = index === slabs.length - 1;
          const isCommonTier = index === Math.floor(slabs.length / 2) && slabs.length > 2;

          let cardClass = "bg-white border-gray-200 text-[#1A1A1A]";
          let badgeClass = "bg-[#F0F0F0] text-[#1A1A1A]";
          let textClass = "text-[var(--text-dark)]";

          if (isCommonTier) {
            cardClass = "bg-[var(--red-light)] border-[var(--toyota-red)] border-2 text-[var(--toyota-red)]";
            badgeClass = "bg-[var(--toyota-red)] text-white";
            textClass = "text-[var(--toyota-red)]";
          } else if (isTopTier) {
            cardClass = "bg-[#1A1A1A] border-[#C9A84C] border-2 text-white shadow-lg";
            badgeClass = "bg-[#1A1A1A] text-white border border-[#C9A84C]";
            textClass = "text-white";
          }

          return (
            <motion.div 
              key={`card-${slab.id}`}
              variants={itemVariants} 
              whileHover={{ scale: 1.02 }}
              className={`rounded-xl p-6 border shadow-sm relative cursor-pointer transition-all ${cardClass}`}
            >
              {isCommonTier && (
                <div className="absolute -top-3 right-4 bg-[var(--toyota-red)] text-white text-[10px] font-bold px-2 py-1 rounded-full tracking-wider shadow-sm">
                  MOST COMMON
                </div>
              )}
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${badgeClass}`}>
                {slab.tier_name}
              </div>
              <div className={`text-sm opacity-80 ${isTopTier ? "text-gray-300" : ""}`}>Sales Range</div>
              <div className={`text-2xl font-bold font-heading ${textClass}`}>
                {slab.min_cars} {slab.max_cars ? `– ${slab.max_cars}` : '+'} cars
              </div>
              <div className={`mt-4 pt-4 border-t ${isTopTier ? "border-[#333]" : isCommonTier ? "border-[var(--toyota-red)]/20" : "border-gray-100"}`}>
                <div className={`text-sm opacity-80 ${isTopTier ? "text-gray-300" : ""}`}>Payout Rate</div>
                <div className={`text-lg font-bold ${isTopTier ? "text-[#C9A84C]" : textClass}`}>
                  {formatCurrency(slab.incentive_per_car)} <span className="text-xs opacity-70">/ car</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Editor Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[var(--border-user)] overflow-hidden mt-8">
        <div className="p-6 border-b border-[var(--border-user)] flex justify-between items-center">
          <h3 className="text-lg font-bold font-heading">Slab Configuration</h3>
          <Button 
            className="bg-[var(--toyota-red)] text-white hover:bg-[var(--red-hover)]"
            onClick={() => { resetForm(); setIsModalOpen(true); }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Slab
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Tier Name</th>
                <th className="px-6 py-4 font-semibold">Min Cars</th>
                <th className="px-6 py-4 font-semibold">Max Cars</th>
                <th className="px-6 py-4 font-semibold">₹ Per Car</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-user)] bg-white">
              {slabs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No slabs configured. Please add slabs to enable calculations.
                  </td>
                </tr>
              ) : slabs.map((slab) => (
                <tr key={slab.id} className="hover:bg-[var(--red-light)] transition-colors group">
                  <td className="px-6 py-4 font-bold text-[var(--text-dark)]">{slab.tier_name}</td>
                  <td className="px-6 py-4 text-[var(--text-dark)]">{slab.min_cars}</td>
                  <td className="px-6 py-4 text-[var(--text-dark)] font-semibold text-lg">
                    {slab.max_cars === null ? "∞" : slab.max_cars}
                  </td>
                  <td className="px-6 py-4 text-[var(--text-dark)] stat-number tracking-wider">
                    {formatCurrency(slab.incentive_per_car)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(slab)} className="p-1 text-gray-500 hover:text-[var(--toyota-red)]">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(slab.id)} className="p-1 text-gray-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white border-[var(--border-user)]">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Slab" : "Add New Slab"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tier Name</label>
              <Input required value={tierName} onChange={e => setTierName(e.target.value)} placeholder="e.g. Tier S" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Cars</label>
                <Input required type="number" value={minCars} onChange={e => setMinCars(Number(e.target.value))} min="0" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Cars</label>
                <Input type="number" value={maxCars} onChange={e => setMaxCars(e.target.value ? Number(e.target.value) : "")} min="0" placeholder="Leave blank for ∞" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Incentive Per Car (₹)</label>
              <Input required type="number" value={incentivePerCar} onChange={e => setIncentivePerCar(Number(e.target.value))} min="0" />
            </div>
            
            {/* Live Preview */}
            <div className="mt-4 p-3 bg-[var(--bg-page)] rounded-lg border border-[var(--border-user)] text-sm">
              <span className="text-[var(--text-muted)]">Preview: </span>
              {tierName || "Tier"} (selling {minCars || 1} cars) = <span className="font-bold text-[var(--toyota-red)] stat-number tracking-wider">{formatCurrency(Number(minCars || 1) * Number(incentivePerCar || 0))}</span> total
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[var(--toyota-red)] text-white hover:bg-[var(--red-hover)]">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
