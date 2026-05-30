"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Shield, Award } from "lucide-react";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { supabase } = useAuth();

  useEffect(() => {
    if (!supabase) return;
    
    const fetchUsers = async () => {
      try {
        const { data } = await supabase.from("users").select("*");
        setEmployees(data || []);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [supabase]);

  const totalStaff = employees.length;
  const adminCount = employees.filter(e => e.role === "admin").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading text-[var(--text-dark)]">Employees Directory</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Manage sales officers and branch roles</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-xl border-[var(--border-user)] shadow-sm">
          <CardContent className="p-5 flex items-center space-x-4">
            <div className="h-10 w-10 rounded-full bg-[var(--red-light)] flex items-center justify-center">
              <Users className="h-5 w-5 text-[var(--toyota-red)]" />
            </div>
            <div>
              <div className="text-2xl font-bold">{totalStaff}</div>
              <div className="text-sm text-[var(--text-muted)]">Total Staff</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-[var(--border-user)] shadow-sm">
          <CardContent className="p-5 flex items-center space-x-4">
            <div className="h-10 w-10 rounded-full bg-[var(--red-light)] flex items-center justify-center">
              <Shield className="h-5 w-5 text-[var(--toyota-red)]" />
            </div>
            <div>
              <div className="text-2xl font-bold">{adminCount}</div>
              <div className="text-sm text-[var(--text-muted)]">Admins</div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-[var(--border-user)] shadow-sm">
          <CardContent className="p-5 flex items-center space-x-4">
            <div className="h-10 w-10 rounded-full bg-[var(--red-light)] flex items-center justify-center">
              <Award className="h-5 w-5 text-[var(--toyota-red)]" />
            </div>
            <div>
              <div className="text-2xl font-bold">N/A</div>
              <div className="text-sm text-[var(--text-muted)]">Top Performer</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border-[var(--border-user)] shadow-sm">
        <CardContent className="p-0">
          <div className="p-6 border-b border-[var(--border-user)] bg-white rounded-t-xl">
            <h3 className="text-lg font-bold font-heading">Active Staff</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Role</th>
                  <th className="px-6 py-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-user)] bg-white">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-4 text-center">Loading staff...</td></tr>
                ) : employees.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-4 text-center">No staff found.</td></tr>
                ) : (
                  employees.map((emp, index) => (
                    <tr key={index} className="hover:bg-[var(--red-light)] transition-colors">
                      <td className="px-6 py-4 font-semibold text-[var(--text-dark)]">{emp.full_name || 'N/A'}</td>
                      <td className="px-6 py-4 text-[var(--text-muted)]">{emp.email}</td>
                      <td className="px-6 py-4 text-[var(--text-dark)] uppercase text-xs tracking-wider">{emp.role}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-bold">
                          Active
                        </span>
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
