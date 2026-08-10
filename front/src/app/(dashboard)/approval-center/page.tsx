'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { canApprove, isGuest } from '@/lib/rbac';

export default function ApprovalCenterPage() {
  const { approvals, user, isLoading } = useApp();
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WAITING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'Design Rev' | 'Inventory Update'>('ALL');

  // Tamu cannot access Approval Center at all
  if (!isLoading && isGuest(user?.role)) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="text-center max-w-xs">
          <span className="material-symbols-outlined text-4xl text-gray-300 mb-3 block">lock</span>
          <p className="text-sm font-bold text-gray-500 mb-1">Akses Ditolak</p>
          <p className="text-[10px] text-gray-400">Halaman Approval Center tidak dapat diakses oleh Guest / Tamu.</p>
          <Link href="/" className="mt-3 inline-block text-xs text-blue-500 underline">Kembali ke Dashboard</Link>
        </div>
      </div>
    );
  }

  // Derive role flags
  const userIsApprover = !isLoading && canApprove(user?.role);
  const userIsPic = !isLoading && user?.role === 'PE_JIG_FIXTURE';

  // Filter items
  const filteredApprovals = approvals.filter((app) => {
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || app.type === typeFilter;
    return matchesStatus && matchesType;
  });

  return (
    <div className="flex-1 flex flex-col p-4 bg-white h-full overflow-hidden">
      {/* Header controls */}
      <header className="flex justify-between items-center pb-3 mb-3 border-b border-gray-150">
        <div>
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#0063ff] text-lg">fact_check</span>
            Approval Center
          </h2>
          <p className="text-[10px] text-gray-500">Multistage approval gatekeeper for design revisions & critical stock updates</p>
        </div>

        {/* Toggle Filters */}
        <div className="flex items-center gap-2">
          {/* Status Select */}
          <div className="relative flex items-center gap-1 text-[9px] text-gray-500 font-semibold border border-gray-200 rounded-full px-2 py-0.5 cursor-pointer hover:bg-gray-50">
            <span>Status: {statusFilter}</span>
            <span className="material-symbols-outlined text-[12px]">expand_more</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="absolute inset-0 opacity-0 cursor-pointer text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="WAITING">Waiting</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Type Select */}
          <div className="relative flex items-center gap-1 text-[9px] text-gray-500 font-semibold border border-gray-200 rounded-full px-2 py-0.5 cursor-pointer hover:bg-gray-50">
            <span>Type: {typeFilter}</span>
            <span className="material-symbols-outlined text-[12px]">expand_more</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="absolute inset-0 opacity-0 cursor-pointer text-xs"
            >
              <option value="ALL">All Types</option>
              <option value="Design Rev">Design Revision</option>
              <option value="Inventory Update">Inventory Update</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto no-scrollbar rounded-lg border border-gray-200 bg-gray-50 p-2">
        <div className="grid grid-cols-1 gap-3">
          {filteredApprovals.map((app) => {
            const isWaiting = app.status === 'WAITING';
            const isApproved = app.status === 'APPROVED';
            const isRejected = app.status === 'REJECTED';

            const statusBadgeColor = isWaiting
              ? 'bg-yellow-100 text-yellow-700'
              : isApproved
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700';

            return (
              <div
                key={app.id}
                className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm relative group overflow-hidden"
              >
                {/* Visual Accent */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${app.type === 'Design Rev' ? 'bg-[#0063ff]' : 'bg-[#00c6ff]'
                  }`}></div>

                <div className="pl-2 grid grid-cols-2 gap-4">
                  {/* Left Column: Info */}
                  <div className="flex flex-col justify-between pr-2">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded font-mono">
                          {app.noReg}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusBadgeColor}`}>
                          {app.status}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-gray-800 leading-tight mb-1">
                        {app.itemName}
                      </h3>
                      <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                        Tipe: {app.type}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-full w-fit mt-3">
                      <img className="w-5 h-5 rounded-full border border-gray-300" src={app.authorAvatar} alt={app.author} />
                      <span className="text-[10px] font-bold text-gray-600">{app.author}</span>
                    </div>
                  </div>

                  {/* Right Column: Deskripsi */}
                  <div className="border-l border-gray-200 pl-4 flex flex-col justify-between">
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Deskripsi / Alasan</span>
                      <p className="text-[11px] text-gray-500 italic bg-gray-50 p-2 rounded leading-relaxed">
                        "{app.note}"
                      </p>
                    </div>

                    <div className="flex justify-end mt-3">
                      <Link
                        href={`/approval-center/${app.id}`}
                        className="py-1 px-3 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        Review
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredApprovals.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-xs">
              No items awaiting review.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
