'use client';

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { canApprove } from '@/lib/rbac';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ReviewApprovalPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const { approvals, items, processApproval, user, isLoading } = useApp();
  const isApprover = !isLoading && canApprove(user?.role);

  const approval = approvals.find((a) => a.id === id);
  const item = approval ? items.find((i) => i.noReg === approval.noReg) : null;

  const [comment, setComment] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!approval || !item) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="text-center">
          <p className="text-sm font-bold text-red-500 mb-2">Approval Request Not Found</p>
          <Link href="/approval-center" className="text-xs text-blue-500 underline">
            Back to Approval Center
          </Link>
        </div>
      </div>
    );
  }

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processApproval(approval.id, 'APPROVE', comment);
    setToastMessage('Request has been APPROVED successfully!');
    setShowApproveModal(false);
    setComment('');
    
    setTimeout(() => {
      router.push('/approval-center');
    }, 1500);
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      alert('Reject comment is required.');
      return;
    }
    
    processApproval(approval.id, 'REJECT', comment);
    setToastMessage('Request has been REJECTED.');
    setShowRejectModal(false);
    setComment('');
    
    setTimeout(() => {
      router.push('/approval-center');
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-white h-full overflow-hidden relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg z-50 transition-opacity duration-300">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Link href="/approval-center" className="text-gray-500 hover:text-gray-800 flex items-center">
            <span className="material-symbols-outlined text-base font-bold">arrow_back</span>
          </Link>
          <div>
            <h2 className="text-sm font-bold text-gray-800">Review Approval Request</h2>
            <p className="text-[9px] text-gray-500">ID Reference: {approval.id} &bull; Submitted {approval.date}</p>
          </div>
        </div>
        <span className="text-[9px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold uppercase">
          Fase 2 Flow
        </span>
      </header>

      {/* Layout Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        
        {/* Left Side: Drawing & Specifications */}
        <div className="w-1/2 bg-surface-container-low border border-outline-variant/30 rounded-xl p-3 flex flex-col justify-between overflow-hidden relative">
          <div className="flex justify-between items-center mb-2 z-10">
            <span className="text-[8px] bg-gray-900 text-white font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px] text-primary">view_in_ar</span>
              Engineering Specification
            </span>
            <span className="text-[8px] text-on-surface-variant font-semibold">
              Code: {item.noReg}
            </span>
          </div>

          {/* Visual Model */}
          <div className="flex-1 rounded-lg bg-surface flex items-center justify-center relative overflow-hidden mb-3 border border-outline-variant/20 shadow-inner">
            <img 
              src={item.newVisualDesign || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&q=80"} 
              alt="CAD drawing" 
              className="object-cover w-full h-full opacity-60 mix-blend-luminosity" 
            />
            <div className="absolute inset-0 bg-pattern-dots opacity-10 mix-blend-overlay"></div>
            <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm rounded p-1.5 border border-white/10">
              <p className="text-[8px] text-gray-300 leading-none mb-0.5">Part Name</p>
              <p className="text-[10px] font-bold text-white truncate leading-none">{item.assyPartName}</p>
            </div>
          </div>

          {/* Details list */}
          <div className="text-[9px] text-on-surface-variant grid grid-cols-2 gap-1.5 bg-surface/50 border border-outline-variant/10 rounded-lg p-2">
            <div>
              <span className="block font-medium">Line Product</span>
              <span className="text-on-surface font-bold truncate block">{item.lineProduct}</span>
            </div>
            <div>
              <span className="block font-medium">Process Name</span>
              <span className="text-on-surface font-bold truncate block">{item.process}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Timeline & Decision Actions */}
        <div className="w-1/2 flex flex-col gap-3 justify-between">
          
          {/* Notes Section */}
          <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 flex flex-col gap-2">
            <h3 className="font-bold text-xs text-gray-800 border-b border-gray-200 pb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">sticky_note_2</span>
              PIC Revision Note
            </h3>
            <div className="bg-white border border-gray-200 rounded p-2 text-[10px] text-gray-700 italic">
              "{approval.note}"
            </div>
          </div>

          {/* Timeline Section */}
          <div className="flex-1 border border-gray-200 rounded-xl p-3 bg-gray-50 flex flex-col gap-2">
            <h3 className="font-bold text-xs text-gray-800 border-b border-gray-200 pb-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">event_note</span>
              Approval Timeline
            </h3>
            
            {/* Steps Container */}
            <div className="flex-1 flex flex-col justify-around py-1 text-[9px] relative pl-4 border-l border-gray-300 ml-1.5 space-y-3">
              {/* Step 1: PIC submit */}
              <div className="relative">
                <span className="absolute -left-[20px] top-0.5 bg-green-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold">
                  ✓
                </span>
                <p className="font-bold text-gray-800 leading-none">Submitted by PIC</p>
                <p className="text-gray-400 mt-0.5 flex items-center gap-1">
                  <span className="font-semibold text-gray-600">{approval.author}</span> &bull; {approval.date}
                </p>
              </div>

              {/* Step 2: Section Head */}
              <div className="relative">
                {approval.status === 'APPROVED' ? (
                  <span className="absolute -left-[20px] top-0.5 bg-green-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold">
                    ✓
                  </span>
                ) : approval.status === 'REJECTED' ? (
                  <span className="absolute -left-[20px] top-0.5 bg-red-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold">
                    ✗
                  </span>
                ) : (
                  <span className="absolute -left-[20px] top-0.5 bg-yellow-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold animate-pulse">
                    ⏳
                  </span>
                )}
                <p className="font-bold text-gray-800 leading-none">PE Section Head Review</p>
                <p className="text-gray-400 mt-0.5">
                  {approval.status === 'WAITING' ? (
                    <span className="text-yellow-600 font-bold">Awaiting decision</span>
                  ) : approval.status === 'APPROVED' ? (
                    <span className="text-green-600 font-bold">Approved</span>
                  ) : (
                    <span className="text-red-600 font-bold">Rejected</span>
                  )}
                </p>
              </div>

              {/* Step 3: Dept Head */}
              <div className="relative">
                {approval.status === 'APPROVED' ? (
                  <span className="absolute -left-[20px] top-0.5 bg-green-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold">
                    ✓
                  </span>
                ) : (
                  <span className="absolute -left-[20px] top-0.5 bg-gray-300 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold">
                    -
                  </span>
                )}
                <p className="font-bold text-gray-400 leading-none">PE Dept Head Review</p>
                <p className="text-gray-400 mt-0.5">
                  {approval.status === 'APPROVED' ? (
                    <span className="text-green-600 font-bold">Approved</span>
                  ) : (
                    <span>Pending Section Head approval</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons (Only show if WAITING status and user is Approver) */}
          <div className="flex gap-2">
            {approval.status === 'WAITING' ? (
              isApprover ? (
                <>
                  <button
                    onClick={() => { setComment(''); setShowRejectModal(true); }}
                    className="flex-1 py-1.5 border border-red-500 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm font-semibold">cancel</span>
                    Reject Request
                  </button>
                  <button
                    onClick={() => { setComment(''); setShowApproveModal(true); }}
                    className="flex-1 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm font-semibold">check_circle</span>
                    Approve Request
                  </button>
                </>
              ) : (
                <div className="flex-1 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-2 text-center text-xs font-bold">
                  Awaiting review from Section / Department Head
                </div>
              )
            ) : (
              <div className="flex-1 bg-gray-100 rounded-lg p-2 text-center text-xs font-bold text-gray-500 border border-gray-200">
                Decision finalized: Request is {approval.status}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Reject comment modal */}
      {showRejectModal && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
          <form 
            onSubmit={handleRejectSubmit} 
            className="max-w-xs w-full bg-white border border-gray-300 rounded-2xl p-4 text-gray-800 shadow-2xl relative animate-scale-up"
          >
            <h3 className="font-bold text-xs text-red-600 mb-1.5 flex items-center gap-1 border-b border-gray-100 pb-1.5">
              <span className="material-symbols-outlined text-sm font-semibold">cancel</span>
              Reject Request
            </h3>
            
            <p className="text-[9px] text-gray-500 mb-2 leading-tight">
              Tuliskan alasan penolakan untuk revisi/update Jig ini. PIC akan menerima catatan ini.
            </p>

            <textarea
              className="w-full border border-gray-300 rounded-lg p-2 text-[10px] h-20 outline-none focus:ring-1 focus:ring-red-500 text-gray-700 bg-white placeholder-gray-400"
              placeholder="Contoh: Toleransi pin locator harus diperbaiki..."
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-1 border border-gray-300 text-gray-600 rounded-lg text-[10px] font-bold hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-1 bg-red-600 text-white rounded-lg text-[10px] font-bold hover:bg-red-700 transition-colors cursor-pointer"
              >
                Reject
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Approve comment modal */}
      {showApproveModal && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
          <form 
            onSubmit={handleApproveSubmit} 
            className="max-w-xs w-full bg-white border border-gray-300 rounded-2xl p-4 text-gray-800 shadow-2xl relative animate-scale-up"
          >
            <h3 className="font-bold text-xs text-green-600 mb-1.5 flex items-center gap-1 border-b border-gray-100 pb-1.5">
              <span className="material-symbols-outlined text-sm font-semibold">check_circle</span>
              Approve Request
            </h3>
            
            <p className="text-[9px] text-gray-500 mb-2 leading-tight">
              Berikan catatan persetujuan untuk update/revisi Jig ini (opsional).
            </p>

            <textarea
              className="w-full border border-gray-300 rounded-lg p-2 text-[10px] h-20 outline-none focus:ring-1 focus:ring-green-500 text-gray-700 bg-white placeholder-gray-400"
              placeholder="Contoh: Desain disetujui, siap fabrikasi..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="flex-1 py-1 border border-gray-300 text-gray-600 rounded-lg text-[10px] font-bold hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 py-1 bg-green-600 text-white rounded-lg text-[10px] font-bold hover:bg-green-700 transition-colors cursor-pointer"
              >
                Approve
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
