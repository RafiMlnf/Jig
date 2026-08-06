'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { fetchMasterList, fetchVendors, HttpError } from '@/lib/api/phase3';

interface DocumentInfo {
  id: string;
  path2D: string | null;
  loc2D: string | null;
  approvalStatus: string;
}

interface RevHistoryInfo {
  id: string;
  revStatus: string;
  description: string;
  poNumber: string | null;
  cost: number;
  leadTime: number | null;
  approvedByName: string | null;
  createdAt: string;
  vendorName: string;
  changedBy: string;
}

interface AbnormalityInfo {
  id: string;
  type: string;
  description: string;
  status: 'OPEN' | 'MONITORING' | 'CLOSED';
  dateFound: string;
  foundBy: string;
  rootCause: string;
  tempAction: string;
  correctiveAction: string;
  actionPic: string;
  linkToRevision: boolean;
  createdAt: string;
  reportedBy: string;
}

interface MasterItem {
  id: string;
  noReg: string;
  assyPartName: string;
  qty: string;
  noItem: string;
  type: 'JF' | 'EQ';
  lifecycleStatus: 'ACTIVE' | 'UNDER_REPAIR' | 'UNDER_IMPROVEMENT' | 'OBSOLETE' | 'SCRAP';
  inventoryStatus: 'RED' | 'YELLOW' | 'GREEN';
  abnormalityStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  minimumStock: number;
  actualStock: number;
  designDateNew: string | null;
  revStatus: string;
  lineProduct: string;
  process: string;
  vendor: { id: string; name: string } | null;
  documents: DocumentInfo[];
  revisionHistories: RevHistoryInfo[];
  abnormalities: AbnormalityInfo[];
}

export default function ViewDataPage() {
  const { logout } = useApp();
  const [items, setItems] = useState<MasterItem[]>([]);
  const [vendors, setVendors] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [lineFilter, setLineFilter] = useState('All');
  const [processFilter, setProcessFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [vendorFilter, setVendorFilter] = useState('All');
  const [lifecycleFilter, setLifecycleFilter] = useState('All');
  const [revFilter, setRevFilter] = useState('All');
  const [inventoryFilter, setInventoryFilter] = useState('All');
  const [abnormalityFilter, setAbnormalityFilter] = useState('All');

  // Table expanded row state
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [activeDetailsTab, setActiveDetailsTab] = useState<'info' | 'rev' | 'cost' | 'stock' | 'abn'>('info');

  // Column export selector checklist
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportCols, setExportCols] = useState({
    noReg: true,
    assyPartName: true,
    lineProduct: true,
    process: true,
    type: true,
    lifecycleStatus: true,
    revStatus: true,
    cost: true,
    stock: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, vList] = await Promise.all([fetchMasterList(), fetchVendors()]);
      setItems(list);
      setVendors(vList);
    } catch (e: any) {
      console.error(e);
      if (e.status === 401 || e.status === 403) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter data logic
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.noReg.toLowerCase().includes(search.toLowerCase()) ||
      item.assyPartName.toLowerCase().includes(search.toLowerCase()) ||
      item.noItem.toLowerCase().includes(search.toLowerCase());

    const matchesLine = lineFilter === 'All' || item.lineProduct === lineFilter;
    const matchesProcess = processFilter === 'All' || item.process === processFilter;
    const matchesType = typeFilter === 'All' || item.type === typeFilter;
    const matchesVendor = vendorFilter === 'All' || item.vendor?.id === vendorFilter;
    const matchesLifecycle = lifecycleFilter === 'All' || item.lifecycleStatus === lifecycleFilter;
    const matchesRev = revFilter === 'All' || item.revStatus === revFilter;
    const matchesInv = inventoryFilter === 'All' || item.inventoryStatus === inventoryFilter;
    
    const matchesAbn =
      abnormalityFilter === 'All' ||
      (abnormalityFilter === 'OPEN' && item.abnormalityStatus !== 'RESOLVED') ||
      (abnormalityFilter === 'CLOSED' && item.abnormalityStatus === 'RESOLVED');

    return matchesSearch && matchesLine && matchesProcess && matchesType && matchesVendor && matchesLifecycle && matchesRev && matchesInv && matchesAbn;
  });

  // Unique list derivations for select inputs
  const uniqueLines = Array.from(new Set(items.map((i) => i.lineProduct).filter(Boolean)));
  const uniqueProcesses = Array.from(new Set(items.map((i) => i.process).filter(Boolean)));
  const uniqueRevs = Array.from(new Set(items.map((i) => i.revStatus).filter(Boolean)));

  const handleExport = () => {
    // CSV builder based on checked columns
    let csvHeaders: string[] = [];
    if (exportCols.noReg) csvHeaders.push('Registration No');
    if (exportCols.assyPartName) csvHeaders.push('Assembly Part Name');
    if (exportCols.lineProduct) csvHeaders.push('Production Line');
    if (exportCols.process) csvHeaders.push('Process (OP)');
    if (exportCols.type) csvHeaders.push('Type');
    if (exportCols.lifecycleStatus) csvHeaders.push('Lifecycle Status');
    if (exportCols.revStatus) csvHeaders.push('Latest Revision');
    if (exportCols.cost) csvHeaders.push('Latest Cost');
    if (exportCols.stock) csvHeaders.push('Stock (Min/Actual)');

    const headerLine = csvHeaders.join(',') + '\n';
    const rows = filteredItems
      .map((item) => {
        let values: string[] = [];
        if (exportCols.noReg) values.push(`"${item.noReg}"`);
        if (exportCols.assyPartName) values.push(`"${item.assyPartName}"`);
        if (exportCols.lineProduct) values.push(`"${item.lineProduct}"`);
        if (exportCols.process) values.push(`"${item.process}"`);
        if (exportCols.type) values.push(`"${item.type}"`);
        if (exportCols.lifecycleStatus) values.push(`"${item.lifecycleStatus}"`);
        if (exportCols.revStatus) values.push(`"Rev ${item.revStatus}"`);
        if (exportCols.cost) {
          const lastCost = item.revisionHistories[0]?.cost || 0;
          values.push(`"${lastCost}"`);
        }
        if (exportCols.stock) values.push(`"${item.actualStock}/${item.minimumStock}"`);
        return values.join(',');
      })
      .join('\n');

    const blob = new Blob([headerLine + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `JigFixture_MasterList_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-white h-full overflow-hidden">
      {/* Header */}
      <header className="flex justify-between items-center mb-3">
        <div>
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-blue-600 text-lg">database</span>
            Master View Data Jig &amp; Fixture
          </h2>
          <p className="text-[10px] text-gray-500">
            Penelusuran menyeluruh informasi Jig, riwayat modifikasi vendor/cost, log abnormality, serta status stok.
          </p>
        </div>

        {/* Download feature trigger */}
        <button
          onClick={() => setShowExportModal(true)}
          className="bg-blue-600 text-white px-3.5 py-1.5 rounded-full text-[10px] font-bold hover:bg-blue-700 transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
        >
          <span className="material-symbols-outlined text-xs">download</span> Unduh Master List
        </button>
      </header>

      {/* Grid of filters */}
      <div className="grid grid-cols-5 gap-2 bg-gray-50 p-3 rounded-xl mb-3 border border-gray-150 text-[9px] font-semibold text-gray-600">
        {/* Search */}
        <div className="col-span-2 relative">
          <label className="block text-[8px] text-gray-400 mb-0.5">CARI REG ID / PART NAME / ASSY NO</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">search</span>
            <input
              className="pl-6 pr-2 py-1 bg-white border border-gray-300 rounded-lg w-full text-[10px] outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              placeholder="Ketik No. Reg / Part Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Production Line */}
        <div>
          <label className="block text-[8px] text-gray-400 mb-0.5">LINE</label>
          <select value={lineFilter} onChange={(e) => setLineFilter(e.target.value)} className="w-full border border-gray-350 bg-white rounded p-1 text-[9px] outline-none">
            <option value="All">All Lines</option>
            {uniqueLines.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* OP Number / Process */}
        <div>
          <label className="block text-[8px] text-gray-400 mb-0.5">OP NUMBER</label>
          <select value={processFilter} onChange={(e) => setProcessFilter(e.target.value)} className="w-full border border-gray-350 bg-white rounded p-1 text-[9px] outline-none">
            <option value="All">All OP</option>
            {uniqueProcesses.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="block text-[8px] text-gray-400 mb-0.5">TYPE</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full border border-gray-350 bg-white rounded p-1 text-[9px] outline-none">
            <option value="All">All Types</option>
            <option value="JF">JF (Jig Fixture)</option>
            <option value="EQ">EQ (Equipment)</option>
          </select>
        </div>

        {/* Vendor */}
        <div>
          <label className="block text-[8px] text-gray-400 mb-0.5">VENDOR</label>
          <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} className="w-full border border-gray-350 bg-white rounded p-1 text-[9px] outline-none">
            <option value="All">All Vendors</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>

        {/* Lifecycle Status */}
        <div>
          <label className="block text-[8px] text-gray-400 mb-0.5">LIFECYCLE STATUS</label>
          <select value={lifecycleFilter} onChange={(e) => setLifecycleFilter(e.target.value)} className="w-full border border-gray-350 bg-white rounded p-1 text-[9px] outline-none">
            <option value="All">All Lifecycle</option>
            <option value="ACTIVE">Active</option>
            <option value="UNDER_REPAIR">Under Repair</option>
            <option value="UNDER_IMPROVEMENT">Under Improvement</option>
            <option value="OBSOLETE">Obsolete</option>
            <option value="SCRAP">Scrap</option>
          </select>
        </div>

        {/* Revision Status */}
        <div>
          <label className="block text-[8px] text-gray-400 mb-0.5">REVISION STATUS</label>
          <select value={revFilter} onChange={(e) => setRevFilter(e.target.value)} className="w-full border border-gray-350 bg-white rounded p-1 text-[9px] outline-none">
            <option value="All">All Rev</option>
            {uniqueRevs.map((r) => (
              <option key={r} value={r}>Rev {r}</option>
            ))}
          </select>
        </div>

        {/* Inventory Indicator Status */}
        <div>
          <label className="block text-[8px] text-gray-400 mb-0.5">INVENTORY STATUS</label>
          <select value={inventoryFilter} onChange={(e) => setInventoryFilter(e.target.value)} className="w-full border border-gray-350 bg-white rounded p-1 text-[9px] outline-none">
            <option value="All">All Stock Status</option>
            <option value="GREEN">Green (Aman)</option>
            <option value="YELLOW">Yellow (Warning)</option>
            <option value="RED">Red (Stok 0)</option>
          </select>
        </div>

        {/* Abnormality Status */}
        <div>
          <label className="block text-[8px] text-gray-400 mb-0.5">ABNORMALITY STATUS</label>
          <select value={abnormalityFilter} onChange={(e) => setAbnormalityFilter(e.target.value)} className="w-full border border-gray-350 bg-white rounded p-1 text-[9px] outline-none">
            <option value="All">All Abnormality</option>
            <option value="OPEN">Open (Problematic)</option>
            <option value="CLOSED">Closed (Selesai)</option>
          </select>
        </div>
      </div>

      {/* Main Datatable */}
      <div className="flex-1 overflow-y-auto no-scrollbar rounded-lg border border-gray-200 bg-white">
        {loading ? (
          <div className="h-full flex flex-col justify-center items-center text-gray-400 text-xs">
            <span className="material-symbols-outlined animate-spin text-2xl mb-1 text-blue-600">sync</span>
            <span>Memuat data master...</span>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200 sticky top-0 z-10">
                <th className="px-3 py-2 text-center w-8">Exp</th>
                <th className="px-2 py-2">No. Reg</th>
                <th className="px-2 py-2">Assy Part Name</th>
                <th className="px-2 py-2">Line</th>
                <th className="px-2 py-2">OP (Process)</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2 text-center">Lifecycle</th>
                <th className="px-2 py-2 text-center">Rev</th>
                <th className="px-2 py-2 text-center">Stock</th>
                <th className="px-2 py-2 text-center">Abn</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {filteredItems.map((item) => {
                const isExpanded = expandedRowId === item.id;
                const isRed = item.actualStock < item.minimumStock * 0.5;
                const isYellow = item.actualStock < item.minimumStock && item.actualStock >= item.minimumStock * 0.5;
                
                return (
                  <React.Fragment key={item.id}>
                    <tr
                      onClick={() => {
                        setExpandedRowId(isExpanded ? null : item.id);
                        setActiveDetailsTab('info');
                      }}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/20' : ''}`}
                    >
                      <td className="px-3 py-2 text-center">
                        <span className="material-symbols-outlined text-gray-400 text-xs select-none">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </td>
                      <td className="px-2 py-2 font-mono font-bold text-gray-900">{item.noReg}</td>
                      <td className="px-2 py-2 font-medium">{item.assyPartName}</td>
                      <td className="px-2 py-2 text-gray-550">{item.lineProduct}</td>
                      <td className="px-2 py-2 text-gray-550">{item.process}</td>
                      <td className="px-2 py-2 font-bold text-gray-500">{item.type}</td>
                      <td className="px-2 py-2 text-center">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                          item.lifecycleStatus === 'UNDER_REPAIR' ? 'bg-orange-100 text-orange-700' :
                          item.lifecycleStatus === 'UNDER_IMPROVEMENT' ? 'bg-blue-100 text-blue-700' :
                          item.lifecycleStatus === 'OBSOLETE' ? 'bg-gray-100 text-gray-700' :
                          item.lifecycleStatus === 'SCRAP' ? 'bg-red-100 text-red-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {item.lifecycleStatus || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center font-bold">Rev {item.revStatus}</td>
                      <td className="px-2 py-2 text-center font-medium">
                        <span className={`px-1.5 py-0.5 rounded ${isRed ? 'bg-red-100 text-red-700 font-bold' : isYellow ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-750'}`}>
                          {item.actualStock} / {item.minimumStock}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className={`w-2.5 h-2.5 rounded-full inline-block ${item.abnormalityStatus === 'RESOLVED' ? 'bg-green-500' : item.abnormalityStatus === 'IN_PROGRESS' ? 'bg-yellow-400' : 'bg-red-500 animate-pulse'}`}></span>
                      </td>
                    </tr>

                    {/* Expandable detailed content wrapper */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={10} className="bg-gray-50/50 px-6 py-4 border-b border-gray-200">
                          {/* Inner Tabs Navigation */}
                          <div className="flex gap-2 mb-3 border-b border-gray-200 text-[10px] font-bold">
                            <button
                              onClick={() => setActiveDetailsTab('info')}
                              className={`pb-1.5 px-1 border-b-2 transition-all ${activeDetailsTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                              A &amp; B. Info Umum &amp; Desain
                            </button>
                            <button
                              onClick={() => setActiveDetailsTab('rev')}
                              className={`pb-1.5 px-1 border-b-2 transition-all ${activeDetailsTab === 'rev' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                              C. Riwayat Revisi
                            </button>
                            <button
                              onClick={() => setActiveDetailsTab('cost')}
                              className={`pb-1.5 px-1 border-b-2 transition-all ${activeDetailsTab === 'cost' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                              D. Vendor &amp; Biaya PO
                            </button>
                            <button
                              onClick={() => setActiveDetailsTab('stock')}
                              className={`pb-1.5 px-1 border-b-2 transition-all ${activeDetailsTab === 'stock' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                              E. Status Inventaris
                            </button>
                            <button
                              onClick={() => setActiveDetailsTab('abn')}
                              className={`pb-1.5 px-1 border-b-2 transition-all ${activeDetailsTab === 'abn' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                              F. Log Abnormality
                            </button>
                          </div>

                          {/* Tab Content 1: Info Umum & Desain */}
                          {activeDetailsTab === 'info' && (
                            <div className="grid grid-cols-3 gap-6 text-[10px] leading-relaxed text-gray-700">
                              <div>
                                <h4 className="font-bold text-gray-800 border-b pb-1 mb-2">A. General Info</h4>
                                <p><strong>Unique ID:</strong> {item.id}</p>
                                <p><strong>Line Product:</strong> {item.lineProduct}</p>
                                <p><strong>OP (Process):</strong> {item.process}</p>
                                <p><strong>Type:</strong> {item.type}</p>
                                <p><strong>Registration No:</strong> {item.noReg}</p>
                                <p><strong>Item / Assy No:</strong> {item.noItem || 'N/A'}</p>
                                <p><strong>Lifecycle Status:</strong> {item.lifecycleStatus}</p>
                              </div>
                              <div className="col-span-2">
                                <h4 className="font-bold text-gray-800 border-b pb-1 mb-2">B. Design Information</h4>
                                <p><strong>Latest Revision:</strong> Rev {item.revStatus}</p>
                                <p><strong>Revision Date:</strong> {item.designDateNew ? new Date(item.designDateNew).toLocaleDateString('id-ID') : 'N/A'}</p>
                                <p><strong>Approval Status:</strong> {item.documents[0]?.approvalStatus || 'APPROVED'}</p>
                                
                                <div className="flex gap-2.5 mt-3">
                                  {/* Download 2D */}
                                  {item.documents[0]?.loc2D ? (
                                    <a
                                      href={item.documents[0].loc2D}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 bg-red-550 text-white font-bold px-3 py-1 rounded hover:bg-red-650 transition-colors"
                                    >
                                      <span className="material-symbols-outlined text-xs">picture_as_pdf</span>
                                      Unduh 2D PDF Drawing
                                    </a>
                                  ) : (
                                    <span className="bg-gray-100 text-gray-400 font-bold px-3 py-1 rounded cursor-not-allowed">2D Drawing N/A</span>
                                  )}

                                  {/* Download 3D */}
                                  {item.documents[0]?.path2D ? (
                                    <span className="bg-gray-100 text-gray-400 font-bold px-3 py-1 rounded cursor-not-allowed">3D Model N/A</span>
                                  ) : (
                                    <span className="bg-gray-150 text-gray-400 font-bold px-3 py-1 rounded cursor-not-allowed">3D Model N/A</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Tab Content 2: Riwayat Revisi */}
                          {activeDetailsTab === 'rev' && (
                            <div className="text-[10px] text-gray-700">
                              <h4 className="font-bold text-gray-800 border-b pb-1 mb-2">C. Revision History Log</h4>
                              {item.revisionHistories.length === 0 ? (
                                <p className="italic text-gray-400">Belum ada riwayat revisi terdaftar.</p>
                              ) : (
                                <table className="w-full border">
                                  <thead>
                                    <tr className="bg-gray-100 text-gray-600 font-bold">
                                      <th className="p-1.5 border">Rev</th>
                                      <th className="p-1.5 border">Tanggal</th>
                                      <th className="p-1.5 border">Change Reason (Deskripsi)</th>
                                      <th className="p-1.5 border">Vendor</th>
                                      <th className="p-1.5 border text-right">Cost</th>
                                      <th className="p-1.5 border">Approved By</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.revisionHistories.map((rev) => (
                                      <tr key={rev.id} className="hover:bg-white transition-colors">
                                        <td className="p-1.5 border text-center font-bold">Rev {rev.revStatus}</td>
                                        <td className="p-1.5 border">{new Date(rev.createdAt).toLocaleDateString('id-ID')}</td>
                                        <td className="p-1.5 border">{rev.description}</td>
                                        <td className="p-1.5 border">{rev.vendorName}</td>
                                        <td className="p-1.5 border text-right font-bold text-gray-800">Rp {rev.cost.toLocaleString('id-ID')}</td>
                                        <td className="p-1.5 border font-semibold text-green-700">{rev.approvedByName || 'N/A'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          )}

                          {/* Tab Content 3: Vendor & Cost History */}
                          {activeDetailsTab === 'cost' && (
                            <div className="text-[10px] text-gray-700">
                              <h4 className="font-bold text-gray-800 border-b pb-1 mb-2">D. Vendor &amp; Cost History</h4>
                              {item.revisionHistories.length === 0 ? (
                                <p className="italic text-gray-400">Belum ada histori transaksi vendor.</p>
                              ) : (
                                <table className="w-full border">
                                  <thead>
                                    <tr className="bg-gray-100 text-gray-600 font-bold">
                                      <th className="p-1.5 border">Vendor Name</th>
                                      <th className="p-1.5 border">PO Number</th>
                                      <th className="p-1.5 border text-center">Lead Time</th>
                                      <th className="p-1.5 border text-right">Cost</th>
                                      <th className="p-1.5 border">Tanggal PO</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.revisionHistories.map((rev) => (
                                      <tr key={rev.id} className="hover:bg-white transition-colors">
                                        <td className="p-1.5 border font-medium">{rev.vendorName}</td>
                                        <td className="p-1.5 border font-mono">{rev.poNumber || 'N/A'}</td>
                                        <td className="p-1.5 border text-center">{rev.leadTime ? `${rev.leadTime} Hari` : 'N/A'}</td>
                                        <td className="p-1.5 border text-right font-bold">Rp {rev.cost.toLocaleString('id-ID')}</td>
                                        <td className="p-1.5 border text-gray-400">{new Date(rev.createdAt).toLocaleDateString('id-ID')}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          )}

                          {/* Tab Content 4: Inventory Status */}
                          {activeDetailsTab === 'stock' && (
                            <div className="text-[10px] text-gray-700">
                              <h4 className="font-bold text-gray-800 border-b pb-1 mb-2">E. Inventory Status &amp; Consumables</h4>
                              <p><strong>Minimum Stock Limit:</strong> {item.minimumStock} Units</p>
                              <p><strong>Actual Stock count:</strong> {item.actualStock} Units</p>
                              <p><strong>Stock Indicator Status:</strong> 
                                <span className={`ml-2 px-2 py-0.5 rounded font-bold ${isRed ? 'bg-red-100 text-red-700' : isYellow ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                  {isRed ? 'RED (Kritis <50%)' : isYellow ? 'YELLOW (Warning 50%-99%)' : 'GREEN (Aman)'}
                                </span>
                              </p>
                            </div>
                          )}

                          {/* Tab Content 5: Log Abnormality */}
                          {activeDetailsTab === 'abn' && (
                            <div className="text-[10px] text-gray-700">
                              <h4 className="font-bold text-gray-800 border-b pb-1 mb-2">F. Abnormality History</h4>
                              {item.abnormalities.length === 0 ? (
                                <p className="italic text-gray-400">Belum pernah terjadi abnormality pada Jig ini.</p>
                              ) : (
                                <table className="w-full border">
                                  <thead>
                                    <tr className="bg-gray-100 text-gray-600 font-bold">
                                      <th className="p-1.5 border">Tipe</th>
                                      <th className="p-1.5 border">Deskripsi Masalah</th>
                                      <th className="p-1.5 border">Tanggal Temuan</th>
                                      <th className="p-1.5 border">Ditemukan Oleh</th>
                                      <th className="p-1.5 border">PIC Tindakan</th>
                                      <th className="p-1.5 border text-center">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.abnormalities.map((abn) => (
                                      <tr key={abn.id} className="hover:bg-white transition-colors">
                                        <td className="p-1.5 border font-bold text-orange-600">{abn.type}</td>
                                        <td className="p-1.5 border" title={abn.description}>{abn.description}</td>
                                        <td className="p-1.5 border">{new Date(abn.dateFound).toLocaleDateString('id-ID')}</td>
                                        <td className="p-1.5 border text-gray-500">{abn.foundBy}</td>
                                        <td className="p-1.5 border font-semibold">{abn.actionPic || 'N/A'}</td>
                                        <td className="p-1.5 border text-center">
                                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${abn.status === 'CLOSED' ? 'bg-green-100 text-green-700' : abn.status === 'MONITORING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                            {abn.status}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-400">
                    Tidak ada data master Jig &amp; Fixture yang cocok dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Export Columns Selector Checklist Modal */}
      {showExportModal && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
          <div className="max-w-xs w-full bg-white border border-gray-300 rounded-2xl p-4 text-gray-800 shadow-2xl relative">
            <h3 className="font-bold text-xs text-gray-800 mb-2 border-b border-gray-100 pb-1.5">
              Pilih Kolom Ekspor (Select Columns)
            </h3>
            <p className="text-[9px] text-gray-500 mb-3 leading-tight">
              Centang kolom data spesifikasi Jig &amp; Fixture yang ingin Anda sertakan di dalam file unduhan CSV/Excel.
            </p>

            <div className="flex flex-col gap-2 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportCols.noReg}
                  onChange={(e) => setExportCols({ ...exportCols, noReg: e.target.checked })}
                />
                <span>Registration Number</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportCols.assyPartName}
                  onChange={(e) => setExportCols({ ...exportCols, assyPartName: e.target.checked })}
                />
                <span>Assembly Part Name</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportCols.lineProduct}
                  onChange={(e) => setExportCols({ ...exportCols, lineProduct: e.target.checked })}
                />
                <span>Production Line</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportCols.process}
                  onChange={(e) => setExportCols({ ...exportCols, process: e.target.checked })}
                />
                <span>Process (OP Number)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportCols.type}
                  onChange={(e) => setExportCols({ ...exportCols, type: e.target.checked })}
                />
                <span>Type (JF/EQ)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportCols.lifecycleStatus}
                  onChange={(e) => setExportCols({ ...exportCols, lifecycleStatus: e.target.checked })}
                />
                <span>Lifecycle Status</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportCols.revStatus}
                  onChange={(e) => setExportCols({ ...exportCols, revStatus: e.target.checked })}
                />
                <span>Revision Status</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportCols.cost}
                  onChange={(e) => setExportCols({ ...exportCols, cost: e.target.checked })}
                />
                <span>Vendor Cost (Biaya)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportCols.stock}
                  onChange={(e) => setExportCols({ ...exportCols, stock: e.target.checked })}
                />
                <span>Stock Levels (Min/Act)</span>
              </label>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-[10px] font-bold hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleExport}
                className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
