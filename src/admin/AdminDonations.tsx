import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { HandCoins, Check, X, Search, Plus, Copy, CheckCheck, Clock, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';

export interface DonationItem {
  id?: string;
  name: string;
  email?: string;
  phone: string;
  amount: number;
  transactionId: string;
  method?: 'bKash' | 'Nagad' | 'Bank Transfer' | 'Cash' | string;
  purpose?: string;
  note?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  adminNotes?: string;
  createdAt: number;
}

export const INITIAL_DONATIONS: DonationItem[] = [
  {
    id: 'don-1',
    name: 'Tanvir Hossain',
    email: 'tanvir.h@gmail.com',
    phone: '01711223344',
    amount: 5000,
    transactionId: '9KL209X1A',
    method: 'bKash',
    purpose: 'Winter Relief',
    note: 'Hope this provides warm blankets for children.',
    status: 'Approved',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: 'don-2',
    name: 'Nusrat Jahan',
    email: 'nusrat.jahan@hotmail.com',
    phone: '01844998877',
    amount: 2500,
    transactionId: '8AB301C7F',
    method: 'Nagad',
    purpose: 'Education for All',
    note: 'For school kits and tuition fees.',
    status: 'Approved',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: 'don-3',
    name: 'Rafiqul Islam',
    email: 'rafiq.bd@yahoo.com',
    phone: '01912345678',
    amount: 1000,
    transactionId: '9ZX554P9L',
    method: 'bKash',
    purpose: 'Clean Water Project',
    note: 'Sent via bKash personal.',
    status: 'Pending',
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
  }
];

export function AdminDonations() {
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant: 'danger' | 'warning' | 'primary';
    icon: 'trash' | 'warning' | 'reject';
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'danger',
    icon: 'warning',
    action: async () => {},
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Manual donation modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    amount: 1000,
    method: 'bKash' as 'bKash' | 'Nagad' | 'Bank Transfer' | 'Cash',
    transactionId: '',
    purpose: 'General Fund',
    note: '',
    status: 'Approved' as 'Pending' | 'Approved' | 'Rejected',
  });

  const loadDonations = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'donations'));
      if (!snap.empty) {
        const loaded: DonationItem[] = snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as DonationItem));
        loaded.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setDonations(loaded);
        localStorage.setItem('hea_cached_donations', JSON.stringify(loaded));
      } else {
        const cached = localStorage.getItem('hea_cached_donations');
        if (cached) {
          setDonations(JSON.parse(cached));
        } else {
          setDonations(INITIAL_DONATIONS);
          localStorage.setItem('hea_cached_donations', JSON.stringify(INITIAL_DONATIONS));
        }
      }
    } catch (e) {
      console.warn("Using local donations:", e);
      const cached = localStorage.getItem('hea_cached_donations');
      setDonations(cached ? JSON.parse(cached) : INITIAL_DONATIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  const updateStatus = async (id: string, newStatus: 'Pending' | 'Approved' | 'Rejected') => {
    const updated = donations.map(d => d.id === id ? { ...d, status: newStatus } : d);
    setDonations(updated);
    localStorage.setItem('hea_cached_donations', JSON.stringify(updated));
    showNotification(`Donation marked as "${newStatus}"`, newStatus === 'Rejected' ? 'info' : 'success');

    try {
      await updateDoc(doc(db, 'donations', id), { status: newStatus });
    } catch (dbErr) {
      console.warn("Firestore donation update skipped", dbErr);
    }
  };

  const handleRequestReject = (id: string, donorName: string, amount: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reject Donation Record?',
      message: `Are you sure you want to mark the donation of ৳${amount.toLocaleString()} from ${donorName} as "Rejected"?`,
      confirmText: 'Yes, Reject',
      variant: 'danger',
      icon: 'reject',
      action: async () => {
        await updateStatus(id, 'Rejected');
      }
    });
  };

  const handleRequestDelete = (id: string, donorName: string, trxId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Donation Record?',
      message: `Are you sure you want to delete the donation record for ${donorName} (TrxID: ${trxId})? This action cannot be undone.`,
      confirmText: 'Delete Record',
      variant: 'danger',
      icon: 'trash',
      action: async () => {
        const updated = donations.filter(d => d.id !== id);
        setDonations(updated);
        localStorage.setItem('hea_cached_donations', JSON.stringify(updated));
        showNotification('Donation record deleted.');

        try {
          await deleteDoc(doc(db, 'donations', id));
        } catch (dbErr) {
          console.warn("Firestore donation delete skipped", dbErr);
        }
      }
    });
  };

  const handleConfirmModalAction = async () => {
    setIsProcessing(true);
    try {
      await confirmModal.action();
    } finally {
      setIsProcessing(false);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleCopyTrx = (trx: string, id: string) => {
    navigator.clipboard.writeText(trx);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.amount) return;
    setSaving(true);

    const now = Date.now();
    const newDonation: DonationItem = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      amount: Number(formData.amount),
      method: formData.method || 'bKash',
      transactionId: formData.transactionId.trim().toUpperCase() || ('OFFLINE-' + Math.floor(100000 + Math.random() * 900000)),
      purpose: formData.purpose,
      note: formData.note,
      status: formData.status,
      createdAt: now,
    };

    try {
      let newId = 'don-' + now;
      try {
        const docRef = await addDoc(collection(db, 'donations'), newDonation as any);
        newId = docRef.id;
      } catch (dbErr) {
        console.warn("Firestore donation write skipped", dbErr);
      }

      const updated = [{ ...newDonation, id: newId }, ...donations];
      setDonations(updated);
      localStorage.setItem('hea_cached_donations', JSON.stringify(updated));
      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        amount: 1000,
        method: 'bKash',
        transactionId: '',
        purpose: 'General Fund',
        note: '',
        status: 'Approved',
      });
    } catch (err) {
      console.error("Error adding donation:", err);
    } finally {
      setSaving(false);
    }
  };

  // Calculations
  const verifiedTotal = donations
    .filter(d => d.status === 'Approved')
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  const pendingCount = donations.filter(d => d.status === 'Pending').length;
  const approvedCount = donations.filter(d => d.status === 'Approved').length;

  const filtered = donations.filter(d => {
    const matchesSearch = 
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.includes(searchTerm) ||
      (d.transactionId || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner text="Loading donation verifications..." />;
  }

  return (
    <div>
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-24 right-6 z-50 animate-in fade-in slide-in-from-top-3">
          <div className="px-4 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl shadow-xl border border-zinc-800 dark:border-zinc-200 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400 dark:text-emerald-600" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        icon={confirmModal.icon}
        isLoading={isProcessing}
        onConfirm={handleConfirmModalAction}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-medium text-zinc-900 dark:text-zinc-50">Donations & Verification</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Review and confirm manual bKash, Nagad & mobile banking contributions.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm shadow-brand-500/20 shrink-0"
        >
          <Plus size={18} />
          <span>Record Offline Donation</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Total Verified Raised</p>
            <p className="text-2xl font-serif font-bold text-brand-600 dark:text-brand-400 mt-1">
              ৳{verifiedTotal.toLocaleString()}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <HandCoins size={22} />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Pending Verifications</p>
            <p className="text-2xl font-serif font-bold text-amber-600 dark:text-amber-400 mt-1">
              {pendingCount}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Verified Donors</p>
            <p className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {approvedCount}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCheck size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4 rounded-2xl shadow-sm border border-zinc-200/80 dark:border-zinc-800/80 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by TrxID, donor name, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50/80 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Donations Table */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl shadow-sm border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/50 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="p-4">Status</th>
                <th className="p-4">Donor Details</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Channel & TrxID</th>
                <th className="p-4">Date</th>
                <th className="p-4">Note</th>
                <th className="p-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70 text-xs text-zinc-700 dark:text-zinc-300">
              {filtered.map((d) => {
                const isBkash = (d.method || 'bKash').toLowerCase().includes('bkash');
                const isNagad = (d.method || '').toLowerCase().includes('nagad');
                return (
                  <tr key={d.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        d.status === 'Approved'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                          : d.status === 'Pending'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                          : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
                      }`}>
                        {d.status}
                      </span>
                    </td>

                    <td className="p-4">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{d.name}</p>
                      <p className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">{d.phone}</p>
                      {d.email && <p className="text-zinc-400 text-[11px] truncate">{d.email}</p>}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <span className="font-serif font-bold text-sm text-zinc-900 dark:text-zinc-50">
                        ৳{Number(d.amount).toLocaleString()}
                      </span>
                      {d.purpose && <p className="text-[11px] text-zinc-500">{d.purpose}</p>}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold w-fit ${
                          isNagad
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : isBkash
                            ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isNagad ? 'bg-amber-500' : isBkash ? 'bg-pink-500' : 'bg-zinc-400'}`} />
                          {d.method || 'bKash'}
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md w-fit font-medium text-xs">
                          <span>{d.transactionId}</span>
                          <button
                            onClick={() => d.id && handleCopyTrx(d.transactionId, d.id)}
                            className="text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 p-0.5"
                            title="Copy TrxID"
                          >
                            {copiedId === d.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 whitespace-nowrap text-zinc-500">
                      {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '-'}
                    </td>

                    <td className="p-4 max-w-xs truncate text-zinc-600 dark:text-zinc-400" title={d.note}>
                      {d.note || '-'}
                    </td>

                  <td className="p-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {d.status !== 'Approved' && (
                        <button
                          onClick={() => d.id && updateStatus(d.id, 'Approved')}
                          className="p-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-400 rounded-lg transition-colors"
                          title="Verify / Approve"
                        >
                          <Check size={15} />
                        </button>
                      )}
                      {d.status !== 'Rejected' && (
                        <button
                          onClick={() => d.id && handleRequestReject(d.id, d.name, d.amount)}
                          className="p-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-400 rounded-lg transition-colors"
                          title="Reject (Requires Confirmation)"
                        >
                          <X size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => d.id && handleRequestDelete(d.id, d.name, d.transactionId)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Delete Record (Requires Confirmation)"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    No donation records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Donation Record Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-lg font-serif font-medium text-zinc-900 dark:text-zinc-50">Record Offline / Manual Donation</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Donor Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Shakil Ahmed"
                  className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="017xxxxxxxx"
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="donor@example.com"
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Amount (৳) *</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Payment Channel</label>
                  <select
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash / Offline</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Transaction ID / Reference</label>
                <input
                  type="text"
                  value={formData.transactionId}
                  onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                  placeholder="e.g. 8KL2901B (or auto-generated)"
                  className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Campaign Purpose</label>
                <select
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                >
                  <option value="General Fund">General Charitable Fund</option>
                  <option value="Winter Relief">Winter Relief Campaign</option>
                  <option value="Education for All">Education for All</option>
                  <option value="Clean Water Project">Clean Water Project</option>
                  <option value="Healthcare Camp">Healthcare & Medicine Camp</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Note (Optional)</label>
                <textarea
                  rows={2}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Additional remarks..."
                  className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 resize-none text-sm"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-medium shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Recording...' : 'Confirm & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
