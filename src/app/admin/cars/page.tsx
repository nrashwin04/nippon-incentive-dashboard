"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit2, Trash2 } from "lucide-react";

interface CarModel {
  id: string;
  model_name: string;
  variant: string;
  base_suffix: string;
  stock: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  tier: "Tier A" | "Tier S" | "Tier Premium";
}

export default function AdminCarsPage() {
  const [cars, setCars] = useState<CarModel[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const supabase = createClient();
  
  // Form State
  const [modelName, setModelName] = useState("");
  const [variant, setVariant] = useState("");
  const [baseSuffix, setBaseSuffix] = useState("");
  const [stock, setStock] = useState<number | "">("");
  const [status, setStatus] = useState<"In Stock" | "Low Stock" | "Out of Stock">("In Stock");
  const [tier, setTier] = useState<"Tier A" | "Tier S" | "Tier Premium">("Tier A");

  useEffect(() => {
    fetchCars();

    const channel = supabase.channel("custom-all-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "cars" }, (payload) => {
        fetchCars();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCars = async () => {
    const { data } = await supabase.from("cars").select("*").order("model_name", { ascending: true });
    if (data) setCars(data);
  };

  const filteredCars = useMemo(() => {
    return cars.filter(c => 
      c.model_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.variant.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [cars, searchTerm]);

  const totalStock = cars.reduce((acc, car) => acc + Number(car.stock), 0);
  const lowStockCount = cars.filter(c => c.status === "Low Stock").length;
  const outOfStockCount = cars.filter(c => c.status === "Out of Stock").length;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
      model_name: modelName, 
      variant, 
      base_suffix: baseSuffix, 
      stock: Number(stock), 
      status, 
      tier 
    };
    try {
      if (editId) {
        await supabase.from("cars").update(payload).eq("id", editId);
      } else {
        await supabase.from("cars").insert(payload);
      }
      setIsModalOpen(false);
      resetForm();
      fetchCars(); // Instantly update the UI
    } catch (err) {
      console.error("Error saving car:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this car?")) {
      try {
        await supabase.from("cars").delete().eq("id", id);
        fetchCars(); // Instantly update the UI
      } catch (err) {
        console.error("Error deleting car:", err);
      }
    }
  };

  const openEdit = (car: CarModel) => {
    setEditId(car.id);
    setModelName(car.model_name);
    setVariant(car.variant);
    setBaseSuffix(car.base_suffix);
    setStock(car.stock);
    setStatus(car.status);
    setTier(car.tier);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditId(null);
    setModelName("");
    setVariant("");
    setBaseSuffix("");
    setStock("");
    setStatus("In Stock");
    setTier("Tier A");
  };

  const getTierBadgeClass = (t: string) => {
    switch (t) {
      case "Tier S": return "bg-[var(--toyota-red)] text-white";
      case "Tier Premium": return "bg-[#1A1A1A] text-white border border-[#C9A84C]";
      default: return "bg-[#F0F0F0] text-[#1A1A1A]";
    }
  };

  const getStatusBadgeClass = (s: string) => {
    switch (s) {
      case "In Stock": return "bg-[#D1FAE5] text-[#065F46]";
      case "Low Stock": return "bg-[#FEF3C7] text-[#92400E]";
      case "Out of Stock": return "bg-[#FEE2E2] text-[#991B1B]";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading text-[var(--text-dark)]">Car Inventory</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Manage vehicle stock and incentive tiers</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button 
            className="bg-[var(--toyota-red)] text-white hover:bg-[var(--red-hover)]"
            onClick={() => { resetForm(); setIsModalOpen(true); }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New Model
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-[var(--border-user)]">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input 
            placeholder="Search by model or variant..." 
            className="pl-10 border-0 shadow-none focus-visible:ring-0 bg-[var(--bg-page)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="hidden sm:block text-sm text-[var(--text-muted)] font-medium">
          {filteredCars.length} vehicles
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[var(--border-user)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Model Name</th>
                <th className="px-6 py-4 font-semibold">Variant</th>
                <th className="px-6 py-4 font-semibold">Base Suffix</th>
                <th className="px-6 py-4 font-semibold">Incentive Tier</th>
                <th className="px-6 py-4 font-semibold">Stock</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-user)] bg-white">
              {filteredCars.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No vehicles found. Add some cars to your inventory.
                  </td>
                </tr>
              ) : filteredCars.map((car) => (
                <tr key={car.id} className="hover:bg-[var(--red-light)] transition-colors group">
                  <td className="px-6 py-4 font-semibold text-[var(--text-dark)]">{car.model_name}</td>
                  <td className="px-6 py-4 text-[var(--text-dark)]">{car.variant}</td>
                  <td className="px-6 py-4 text-xs text-[var(--text-muted)]">{car.base_suffix}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${getTierBadgeClass(car.tier)}`}>
                      {car.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-[var(--text-dark)]">{car.stock}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[11px] font-semibold ${getStatusBadgeClass(car.status)}`}>
                      {car.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(car)} className="p-1 text-gray-500 hover:text-[var(--toyota-red)]">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(car.id)} className="p-1 text-gray-500 hover:text-red-600">
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

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[var(--border-user)] shadow-sm text-center">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Total Models</p>
          <p className="text-2xl font-bold font-heading mt-1">{cars.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[var(--border-user)] shadow-sm text-center">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Total Stock</p>
          <p className="text-2xl font-bold font-heading mt-1 text-green-600">{totalStock}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[var(--border-user)] shadow-sm text-center">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Low Stock</p>
          <p className="text-2xl font-bold font-heading mt-1 text-amber-600">{lowStockCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-[var(--border-user)] shadow-sm text-center">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Out of Stock</p>
          <p className="text-2xl font-bold font-heading mt-1 text-red-600">{outOfStockCount}</p>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white border-[var(--border-user)]">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Model" : "Add New Model"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Model Name</label>
              <Input required value={modelName} onChange={e => setModelName(e.target.value)} placeholder="e.g. Innova Hycross" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Variant</label>
              <Input required value={variant} onChange={e => setVariant(e.target.value)} placeholder="e.g. GX 7-Seater" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Base Suffix</label>
              <Input required value={baseSuffix} onChange={e => setBaseSuffix(e.target.value)} placeholder="e.g. Hybrid" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Stock</label>
                <Input required type="number" value={stock} onChange={e => setStock(Number(e.target.value))} min="0" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={status} onValueChange={(v) => setStatus(v as "In Stock" | "Low Stock" | "Out of Stock")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In Stock">In Stock</SelectItem>
                    <SelectItem value="Low Stock">Low Stock</SelectItem>
                    <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Incentive Tier</label>
              <Select value={tier} onValueChange={(v) => setTier(v as "Tier A" | "Tier S" | "Tier Premium")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tier A">Tier A</SelectItem>
                  <SelectItem value="Tier S">Tier S</SelectItem>
                  <SelectItem value="Tier Premium">Tier Premium</SelectItem>
                </SelectContent>
              </Select>
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
