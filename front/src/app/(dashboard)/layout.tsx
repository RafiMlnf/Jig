'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { fetchDashboardAlerts } from '@/lib/api/phase3';

interface AlertData {
  redItems: Array<{ id: string; noReg: string; assyPartName: string }>;
  delayedAbnormalities: Array<{ id: string; design: { noReg: string; assyPartName: string } }>;
  waitingApprovalsCount: number;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, approvals } = useApp();
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertData>({
    redItems: [],
    delayedAbnormalities: [],
    waitingApprovalsCount: 0,
  });

  const waitingApprovalsCount = approvals.filter((a) => a.status === 'WAITING').length;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardAlerts()
        .then(setAlerts)
        .catch(() => {});
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#1a1c1f] h-full w-full text-white">
        <span className="material-symbols-outlined animate-spin text-3xl text-primary">sync</span>
        <p className="text-xs text-gray-400 mt-2 font-medium">Checking PE Session authorization...</p>
      </div>
    );
  }

  if (!user) {
    return null; // block unauthorized render
  }

  const hasAlerts = alerts.redItems.length > 0 || alerts.delayedAbnormalities.length > 0 || waitingApprovalsCount > 0;

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex h-full bg-[#f8f9fa] rounded-l-2xl overflow-hidden relative shadow-[-10px_0_20px_rgba(0,0,0,0.2)]">
        <main className="flex-1 flex flex-col h-full overflow-hidden text-surface z-20">
          {/* Alerts Banner Section */}
          {hasAlerts && (
            <div className="bg-red-50 border-b border-red-200 px-4 py-1.5 flex items-center justify-between shadow-sm text-[10px]">
              <div className="flex items-center gap-3 font-medium text-gray-700">
                <div className="flex items-center gap-1 text-red-800 font-bold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-xs animate-pulse">warning</span>
                  <span>System Alert:</span>
                </div>
                
                {/* Consolidate Red Items */}
                {alerts.redItems.length > 0 && (
                  <Link
                    href="/inventory"
                    className="flex items-center gap-1 bg-red-100 border border-red-200 px-2 py-0.5 rounded text-red-750 hover:bg-red-200 transition-all font-semibold"
                  >
                    <span className="w-1 h-1 rounded-full bg-red-650 animate-ping"></span>
                    <span>{alerts.redItems.length} Jig out of stock (Stok 0)</span>
                  </Link>
                )}

                {/* Consolidate Abnormality Delay */}
                {alerts.delayedAbnormalities.length > 0 && (
                  <Link
                    href="/update-abnormality"
                    className="flex items-center gap-1 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded text-orange-755 hover:bg-orange-200 transition-all font-semibold"
                  >
                    <span className="material-symbols-outlined text-[10px]">report_problem</span>
                    <span>{alerts.delayedAbnormalities.length} Abnormality open &gt; 2 hari</span>
                  </Link>
                )}

                {/* Consolidate Approvals */}
                {waitingApprovalsCount > 0 && (
                  <Link
                    href="/approval-center"
                    className="flex items-center gap-1 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded text-blue-755 hover:bg-blue-200 transition-all font-semibold"
                  >
                    <span className="material-symbols-outlined text-[10px]">pending</span>
                    <span>{waitingApprovalsCount} Approval waiting review</span>
                  </Link>
                )}
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </>
  );
}
