import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Trash2, Search, Eye, X, Check, Clock, AlertCircle, Phone, Mail, MapPin, Heart, XCircle, CheckCircle2, UserCheck } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';

export interface VolunteerApplication {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  location?: string;
  interests?: string[] | string;
  reason?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt?: number;
}

export const INITIAL_VOLUNTEERS: VolunteerApplication[] = [];

export function AdminVolunteers() {
  const [volunteers, setVolunteers] = useState<VolunteerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [selectedVol, setSelectedVol] = useState<VolunteerApplication | null>(null);

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

  const sanitizeVolunteers = (list: VolunteerApplication[]): VolunteerApplication[] => {
    // Purge mock dummy vol-1 through vol-4 IDs so initial count starts at 0 as requested
    return list.filter(v => !['vol-1', 'vol-2', 'vol-3', 'vol-4'].includes(v.id));
  };

  // Helper to persist to localStorage
  const saveToCache = (data: VolunteerApplication[]) => {
    try {
      const sanitized = sanitizeVolunteers(data);
      localStorage.setItem('hea_cached_volunteers', JSON.stringify(sanitized));
      window.dispatchEvent(new CustomEvent('hea_stats_updated'));
    } catch (err) {
      console.warn('Failed to cache volunteers to localStorage', err);
    }
  };

  useEffect(() => {
    // Initial load from cache
    try {
      const cached = localStorage.getItem('hea_cached_volunteers');
      if (cached) {
        const sanitized = sanitizeVolunteers(JSON.parse(cached));
        setVolunteers(sanitized);
        localStorage.setItem('hea_cached_volunteers', JSON.stringify(sanitized));
      } else {
        setVolunteers([]);
        saveToCache([]);
      }
    } catch (e) {
      setVolunteers([]);
    }

    try {
      const q = query(collection(db, 'volunteers'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const fromDb: VolunteerApplication[] = snapshot.docs.map(d => {
            const data = d.data();
            // Normalize status
            let normalizedStatus: 'Pending' | 'Approved' | 'Rejected' = 'Pending';
            const rawStatus = (data.status || '').toLowerCase();
            if (rawStatus === 'approved') normalizedStatus = 'Approved';
            else if (rawStatus === 'rejected') normalizedStatus = 'Rejected';

            return {
              id: d.id,
              ...data,
              status: normalizedStatus,
            } as VolunteerApplication;
          });

          // Check if local cache has newer or modified items
          setVolunteers(prev => {
            const map = new Map<string, VolunteerApplication>();
            // Add from DB
            fromDb.forEach(item => map.set(item.id, item));
            // Prioritize any local updates not yet in DB
            prev.forEach(item => {
              if (!map.has(item.id)) {
                map.set(item.id, item);
              }
            });
            const merged = Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            saveToCache(merged);
            return merged;
          });
        }
        setLoading(false);
      }, (err) => {
        console.warn("Volunteer snapshot error, using cached data", err);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      setLoading(false);
    }
  }, []);

  // Update status handler
  const executeStatusUpdate = async (id: string, newStatus: 'Pending' | 'Approved' | 'Rejected') => {
    // 1. Update React state immediately
    const updated = volunteers.map(v => v.id === id ? { ...v, status: newStatus } : v);
    setVolunteers(updated);
    saveToCache(updated);

    if (selectedVol && selectedVol.id === id) {
      setSelectedVol({ ...selectedVol, status: newStatus });
    }

    showNotification(`Application status marked as "${newStatus}"`, newStatus === 'Rejected' ? 'info' : 'success');

    // 2. Sync with Firestore
    try {
      await updateDoc(doc(db, 'volunteers', id), { 
        status: newStatus 
      });
    } catch (err) {
      console.warn("Firestore updateDoc fallback to local cache:", err);
    }
  };

  // Request status change with confirmation for Reject
  const handleRequestStatusChange = (id: string, newStatus: 'Pending' | 'Approved' | 'Rejected', applicantName: string) => {
    if (newStatus === 'Rejected') {
      setConfirmModal({
        isOpen: true,
        title: 'Reject Volunteer Application?',
        message: `Are you sure you want to mark ${applicantName}'s application as "Rejected"? They will be moved to the Rejected list.`,
        confirmText: 'Yes, Reject',
        variant: 'danger',
        icon: 'reject',
        action: async () => {
          await executeStatusUpdate(id, 'Rejected');
        }
      });
    } else if (newStatus === 'Approved') {
      executeStatusUpdate(id, 'Approved');
    } else {
      executeStatusUpdate(id, 'Pending');
    }
  };

  // Delete handler with confirmation
  const handleRequestDelete = (id: string, applicantName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Volunteer Application?',
      message: `Are you sure you want to permanently remove ${applicantName}'s volunteer application from the system? This action cannot be undone.`,
      confirmText: 'Delete Record',
      variant: 'danger',
      icon: 'trash',
      action: async () => {
        const updated = volunteers.filter(v => v.id !== id);
        setVolunteers(updated);
        saveToCache(updated);
        if (selectedVol && selectedVol.id === id) {
          setSelectedVol(null);
        }
        showNotification('Volunteer record deleted successfully.');

        try {
          await deleteDoc(doc(db, 'volunteers', id));
        } catch (err) {
          console.warn("Firestore deleteDoc fallback to local cache:", err);
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

  // Filtered applications
  const filtered = volunteers.filter(v => {
    const name = (v.name || `${v.firstName || ''} ${v.lastName || ''}`).toLowerCase();
    const email = (v.email || '').toLowerCase();
    const location = (v.location || '').toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || 
                          email.includes(searchTerm.toLowerCase()) ||
                          location.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Status counts
  const totalCount = volunteers.length;
  const pendingCount = volunteers.filter(v => v.status === 'Pending').length;
  const approvedCount = volunteers.filter(v => v.status === 'Approved').length;
  const rejectedCount = volunteers.filter(v => v.status === 'Rejected').length;

  if (loading) return <LoadingSpinner text="Loading volunteer applications..." />;

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-medium text-zinc-900 dark:text-zinc-50">Volunteer Applications</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Review applicant motivations, contact details, approve or reject submissions.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4 rounded-2xl shadow-sm border border-zinc-200/80 dark:border-zinc-800/80 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, email, or area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50/80 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
              statusFilter === 'All'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                : 'bg-zinc-100/90 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <span>All</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/20 font-mono">{totalCount}</span>
          </button>

          <button
            onClick={() => setStatusFilter('Pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
              statusFilter === 'Pending'
                ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/20'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50'
            }`}
          >
            <span>Pending</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 font-mono font-semibold">{pendingCount}</span>
          </button>

          <button
            onClick={() => setStatusFilter('Approved')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
              statusFilter === 'Approved'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
            }`}
          >
            <span>Approved</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 font-mono font-semibold">{approvedCount}</span>
          </button>

          <button
            onClick={() => setStatusFilter('Rejected')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
              statusFilter === 'Rejected'
                ? 'bg-red-600 text-white shadow-sm shadow-red-500/20'
                : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
            }`}
          >
            <span>Rejected</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500/20 font-mono font-semibold">{rejectedCount}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl shadow-sm border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/50 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="p-4">Status</th>
                <th className="p-4">Applicant</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Location</th>
                <th className="p-4">Interests</th>
                <th className="p-4">Submitted</th>
                <th className="p-4 text-right">Quick Decision / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70 text-xs text-zinc-700 dark:text-zinc-300">
              {filtered.map(vol => {
                const displayName = vol.name || `${vol.firstName || ''} ${vol.lastName || ''}`.trim() || 'Anonymous Applicant';
                const st = vol.status || 'Pending';

                return (
                  <tr key={vol.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="p-4 whitespace-nowrap">
                      <select
                        value={st}
                        onChange={(e) => handleRequestStatusChange(vol.id, e.target.value as 'Pending' | 'Approved' | 'Rejected', displayName)}
                        className={`text-xs font-semibold border rounded-full px-3 py-1 outline-none cursor-pointer transition-colors ${
                          st === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                            : st === 'Rejected'
                            ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-800'
                            : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>

                    <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs uppercase">
                          {displayName[0] || 'V'}
                        </div>
                        <span>{displayName}</span>
                      </div>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <div><a href={`mailto:${vol.email}`} className="hover:underline text-brand-600 dark:text-brand-400 font-mono text-[11px]">{vol.email}</a></div>
                      <div className="text-zinc-500 font-mono text-[11px]">{vol.phone}</div>
                    </td>

                    <td className="p-4 whitespace-nowrap text-zinc-500">
                      {vol.location || '-'}
                    </td>

                    <td className="p-4 max-w-xs truncate" title={Array.isArray(vol.interests) ? vol.interests.join(', ') : vol.interests}>
                      {Array.isArray(vol.interests) ? vol.interests.join(', ') : (vol.interests || 'General Support')}
                    </td>

                    <td className="p-4 whitespace-nowrap text-zinc-500 font-mono text-[11px]">
                      {vol.createdAt ? new Date(vol.createdAt).toLocaleDateString() : '-'}
                    </td>

                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Approve Button */}
                        {st !== 'Approved' && (
                          <button
                            onClick={() => executeStatusUpdate(vol.id, 'Approved')}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-400 rounded-lg transition-colors"
                            title="Approve Applicant"
                          >
                            <Check size={15} />
                          </button>
                        )}

                        {/* Quick Reject Button (Triggers Confirm Modal) */}
                        {st !== 'Rejected' && (
                          <button
                            onClick={() => handleRequestStatusChange(vol.id, 'Rejected', displayName)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900 text-red-700 dark:text-red-400 rounded-lg transition-colors"
                            title="Reject Applicant"
                          >
                            <X size={15} />
                          </button>
                        )}

                        {/* View Full Application */}
                        <button 
                          onClick={() => setSelectedVol(vol)}
                          className="p-1.5 text-zinc-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950 rounded-lg transition-colors"
                          title="View Full Application"
                        >
                          <Eye size={15} />
                        </button>

                        {/* Delete Application (Triggers Confirm Modal) */}
                        <button 
                          onClick={() => handleRequestDelete(vol.id, displayName)} 
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                          title="Delete Application Record"
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
                  <td colSpan={7} className="p-12 text-center text-zinc-500">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <AlertCircle size={28} className="mx-auto text-zinc-400" />
                      <p className="font-medium text-sm text-zinc-700 dark:text-zinc-300">No applications found</p>
                      <p className="text-xs text-zinc-500">
                        {statusFilter !== 'All' ? `There are currently no "${statusFilter}" applications.` : 'No volunteer applications match your search criteria.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedVol && (
        <div 
          onClick={() => setSelectedVol(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="max-w-lg w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <Heart size={20} />
                </div>
                <div>
                  <h3 className="text-base font-serif font-semibold text-zinc-900 dark:text-zinc-50">
                    {selectedVol.name || `${selectedVol.firstName || ''} ${selectedVol.lastName || ''}`.trim() || 'Volunteer Application'}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Submitted: {selectedVol.createdAt ? new Date(selectedVol.createdAt).toLocaleString() : 'Recent'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVol(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl">
                <div>
                  <span className="text-zinc-400 block mb-0.5">Email</span>
                  <a href={`mailto:${selectedVol.email}`} className="text-brand-600 dark:text-brand-400 font-mono underline">
                    {selectedVol.email}
                  </a>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-0.5">Phone</span>
                  <span className="font-mono text-zinc-800 dark:text-zinc-200">{selectedVol.phone}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-0.5">Location</span>
                  <span className="text-zinc-800 dark:text-zinc-200">{selectedVol.location || 'Not provided'}</span>
                </div>
                <div>
                  <span className="text-zinc-400 block mb-0.5">Current Status</span>
                  <span className={`font-semibold uppercase ${
                    selectedVol.status === 'Approved' ? 'text-emerald-600 dark:text-emerald-400' :
                    selectedVol.status === 'Rejected' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                  }`}>
                    {selectedVol.status}
                  </span>
                </div>
              </div>

              {selectedVol.interests && (
                <div>
                  <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Areas of Interest</h4>
                  <p className="text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl">
                    {Array.isArray(selectedVol.interests) ? selectedVol.interests.join(', ') : selectedVol.interests}
                  </p>
                </div>
              )}

              {selectedVol.reason && (
                <div>
                  <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Motivation & Reason to Join</h4>
                  <p className="text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl leading-relaxed whitespace-pre-wrap">
                    {selectedVol.reason}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => executeStatusUpdate(selectedVol.id, 'Approved')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium transition-colors shadow-xs"
                >
                  Approve Application
                </button>
                <button
                  onClick={() => handleRequestStatusChange(selectedVol.id, 'Rejected', selectedVol.name || 'Applicant')}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-medium transition-colors shadow-xs"
                >
                  Reject Application
                </button>
              </div>

              <button
                onClick={() => setSelectedVol(null)}
                className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
