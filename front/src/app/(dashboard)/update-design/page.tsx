'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { canEdit } from '@/lib/rbac';
import { fetchDesignItems, submitDesignUpdate, fetchVendors } from '@/lib/api/phase3';

interface DesignItem {
  id: string;
  noReg: string;
  assyPartName: string;
  lineProduct: string;
  revStatus: string;
  designDateNew: string | null;
  docLocation2D: string | null;
  docLocation3D?: string | null;
}

interface VendorItem {
  id: string;
  name: string;
  code: string;
}

export default function UpdateDesignPage() {
  const { user, isLoading } = useApp();
  const isPic = !isLoading && canEdit(user?.role);

  const [items, setItems] = useState<DesignItem[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<DesignItem | null>(null);

  // Form fields
  const [revStatus, setRevStatus] = useState('1');
  const [designDateNew, setDesignDateNew] = useState(new Date().toISOString().split('T')[0]);
  const [docLocation2D, setDocLocation2D] = useState('');
  const [docLocation3D, setDocLocation3D] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [cost, setCost] = useState<number>(0);
  const [leadTime, setLeadTime] = useState<number>(1);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    fetchDesignItems()
      .then(setItems)
      .catch(() => setItems([]));

    fetchVendors()
      .then(setVendors)
      .catch(() => setVendors([]));
  }, []);

  const filteredItems = items.filter(
    (i) =>
      i.noReg.toLowerCase().includes(search.toLowerCase()) ||
      i.assyPartName.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelectItem = (item: DesignItem) => {
    setSelectedItem(item);
    // Auto-calculate next revision status
    const currentRev = parseInt(item.revStatus || '0', 10);
    const nextRev = isNaN(currentRev) ? '1' : String(currentRev + 1);
    setRevStatus(nextRev);
    
    setDocLocation2D(item.docLocation2D || '');
    setDocLocation3D(item.docLocation3D || '');
    setDesignDateNew(new Date().toISOString().split('T')[0]);
    setRevisionNote('');
    setSelectedVendorId('');
    setPoNumber('');
    setCost(0);
    setLeadTime(1);
    setToast(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      await submitDesignUpdate(selectedItem.id, {
        revStatus,
        designDateNew: designDateNew || undefined,
        docLocation2D: docLocation2D || undefined,
        docLocation3D: docLocation3D || undefined,
        revisionNote: revisionNote || undefined,
        vendorId: selectedVendorId || undefined,
        poNumber: poNumber || undefined,
        cost: cost ? parseFloat(String(cost)) : undefined,
        leadTime: leadTime ? parseInt(String(leadTime)) : undefined,
      });
      setToast({ type: 'success', msg: `Revisi ${selectedItem.noReg} (Rev ${revStatus}) berhasil diajukan ke Approval Center!` });
      setSelectedItem(null);
      
      // Refresh list
      const refreshed = await fetchDesignItems();
      setItems(refreshed);
    } catch (err: any) {
      setToast({ type: 'error', msg: err.message || 'Gagal submit revisi.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isPic) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-gray-300 mb-3 block">lock</span>
          <p className="text-sm font-bold text-gray-500">Akses Ditolak</p>
          <p className="text-[10px] text-gray-400 mt-1">Hanya PIC Jig Fixture yang dapat memperbarui data desain.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 bg-white h-full overflow-hidden relative">
      {/* Toast */}
      {toast && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 text-xs font-semibold px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          <span className="material-symbols-outlined text-sm">{toast.type === 'success' ? 'check_circle' : 'error'}</span>
          {toast.msg}
          {toast.type === 'success' && (
            <Link href="/approval-center" className="underline ml-2">Lihat Approval →</Link>
          )}
          <button onClick={() => setToast(null)} className="ml-2 text-white font-bold">✕</button>
        </div>
      )}

      {/* Header */}
      <header className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-green-600 text-lg">design_services</span>
            Update Design Revisi
          </h2>
          <p className="text-[10px] text-gray-500">Unggah revisi gambar 2D/3D baru beserta PO, vendor, dan rincian biaya terkait</p>
        </div>
        <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold uppercase">Fase 3</span>
      </header>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left: Item Selector */}
        <div className="w-1/2 flex flex-col border border-gray-200 rounded-xl overflow-hidden bg-white">
          <div className="p-2.5 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">search</span>
              <input
                className="pl-7 pr-3 py-1 bg-white border border-gray-300 rounded-full text-[10px] w-full focus:ring-1 focus:ring-green-500 outline-none text-gray-700"
                placeholder="Cari No.Reg atau Part Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {filteredItems.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-[10px] text-gray-400">Tidak ada item ditemukan.</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`w-full text-left px-3 py-2 border-b border-gray-100 hover:bg-green-50 transition-colors block ${selectedItem?.id === item.id ? 'bg-green-50 border-l-2 border-l-green-500' : ''}`}
                >
                  <p className="text-[10px] font-bold text-gray-800 font-mono leading-none">{item.noReg}</p>
                  <p className="text-[9px] text-gray-500 truncate mt-1 leading-none">{item.assyPartName}</p>
                  <p className="text-[8px] text-gray-400 mt-0.5 leading-none">Rev Saat Ini: {item.revStatus || '0'}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Form */}
        <div className="w-1/2 flex flex-col min-h-0 bg-white">
          {!selectedItem ? (
            <div className="flex-1 flex items-center justify-center border border-dashed border-gray-300 rounded-xl">
              <div className="text-center">
                <span className="material-symbols-outlined text-3xl text-gray-300 mb-2 block">arrow_back</span>
                <p className="text-[10px] text-gray-400">Pilih item dari daftar kiri untuk mulai memperbarui revisi desain.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3.5 border border-gray-200 rounded-xl p-4 bg-gray-50 overflow-y-auto no-scrollbar pb-6">
              <div className="border-b border-gray-250 pb-2">
                <h3 className="text-xs font-bold text-gray-800 flex justify-between items-center">
                  <span>Edit Revisi — <span className="font-mono text-green-600">{selectedItem.noReg}</span></span>
                  <span className="text-[9px] bg-green-150 text-green-700 font-bold px-1.5 py-0.5 rounded">
                    Rev {selectedItem.revStatus || '0'} &rarr; Rev {revStatus}
                  </span>
                </h3>
              </div>

              {/* Revision fields Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Revision Number */}
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Nomor Revisi *</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-1 focus:ring-green-500 outline-none text-gray-700 font-bold"
                    value={revStatus}
                    onChange={(e) => setRevStatus(e.target.value)}
                  />
                </div>

                {/* Design Date New */}
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Tanggal Desain Baru *</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-1 focus:ring-green-500 outline-none text-gray-700"
                    value={designDateNew}
                    onChange={(e) => setDesignDateNew(e.target.value)}
                  />
                </div>

                {/* Upload Drawing 2D */}
                <div className="col-span-2">
                  <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Upload Drawing 2D (Path/Link) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: \\SERVER-MTM\Drawings\2D\TXMACH-ASAU..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-1 focus:ring-green-500 outline-none text-gray-700 font-mono"
                    value={docLocation2D}
                    onChange={(e) => setDocLocation2D(e.target.value)}
                  />
                </div>

                {/* Upload 3D Model */}
                <div className="col-span-2">
                  <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Upload 3D Model (Path/Link)</label>
                  <input
                    type="text"
                    placeholder="Contoh: \\SERVER-MTM\Drawings\3D\TXMACH-ASAU.step"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-1 focus:ring-green-500 outline-none text-gray-700 font-mono"
                    value={docLocation3D}
                    onChange={(e) => setDocLocation3D(e.target.value)}
                  />
                </div>

                {/* Vendor select */}
                <div className="col-span-2">
                  <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Vendor Pembuat</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-1 focus:ring-green-500 outline-none text-gray-700 font-semibold"
                    value={selectedVendorId}
                    onChange={(e) => setSelectedVendorId(e.target.value)}
                  >
                    <option value="">-- Pilih Vendor --</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} ({v.code})</option>
                    ))}
                  </select>
                </div>

                {/* PO Number */}
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">PO Number</label>
                  <input
                    type="text"
                    placeholder="Contoh: PO/2026/XYZ/0123"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-1 focus:ring-green-500 outline-none text-gray-700"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                  />
                </div>

                {/* Cost */}
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Biaya Pembuatan (Cost IDR)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 15000000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-1 focus:ring-green-500 outline-none text-gray-700 font-bold"
                    value={cost}
                    onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                  />
                </div>

                {/* Lead Time */}
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Lead Time (Hari)</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-1 focus:ring-green-500 outline-none text-gray-700"
                    value={leadTime}
                    onChange={(e) => setLeadTime(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              {/* Change Reason / Revision Note */}
              <div>
                <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Change Reason (Alasan Perubahan) *</label>
                <textarea
                  placeholder="Jelaskan secara terperinci alasan modifikasi atau revisi desain Jig ini..."
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  required
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-1 focus:ring-green-500 outline-none resize-none text-gray-700"
                />
              </div>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-[9px] text-blue-700 flex items-start gap-1.5">
                <span className="material-symbols-outlined text-[12px] mt-0.5">info</span>
                <span>Submit akan otomatis membuat <strong>Approval Request</strong> baru di Approval Center untuk disetujui oleh Section Head &amp; Dept Head.</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                >
                  {submitting ? (
                    <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">send</span>
                      Ajukan ke Approval
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
