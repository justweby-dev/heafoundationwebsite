import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Mail, Check, Trash2, Search, Eye, X, CheckCircle2, AlertCircle, Clock, Send, MessageSquare } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  isRead: boolean;
  createdAt: number;
}

export const INITIAL_MESSAGES: ContactMessage[] = [
  {
    id: 'msg-1',
    name: 'Farhana Akter',
    email: 'farhana.akter@gmail.com',
    subject: 'Partnership for School Supply Distribution',
    message: 'Greetings, our community youth group in Rangpur would love to partner with HEA Foundation for distributing textbooks and stationeries to 150 children. Looking forward to your response.',
    isRead: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
  },
  {
    id: 'msg-2',
    name: 'Dr. Kamal Hossain',
    email: 'kamal.dr@yahoo.com',
    subject: 'Volunteer Doctors for Next Health Camp',
    message: 'Hello team, our medical clinic team can provide 4 volunteer physicians and basic medicine supplies for your upcoming free health screening drive.',
    isRead: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 28,
  },
  {
    id: 'msg-3',
    name: 'Sadia Rahman',
    email: 'sadia.r@outlook.com',
    subject: 'Donation Receipt Query',
    message: 'I made a donation of ৳3,000 yesterday via bKash. Could you please confirm if my transaction has been recorded? Thank you for the noble cause.',
    isRead: false,
    createdAt: Date.now() - 1000 * 60 * 60 * 52,
  }
];

export function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedMsg, setSelectedMsg] = useState<ContactMessage | null>(null);

  // Confirmation modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => {},
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const saveToCache = (data: ContactMessage[]) => {
    try {
      localStorage.setItem('hea_cached_messages', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to cache messages to localStorage', e);
    }
  };

  useEffect(() => {
    // 1. Initial cache check
    try {
      const cached = localStorage.getItem('hea_cached_messages');
      if (cached) {
        setMessages(JSON.parse(cached));
      } else {
        setMessages(INITIAL_MESSAGES);
        saveToCache(INITIAL_MESSAGES);
      }
    } catch (e) {
      setMessages(INITIAL_MESSAGES);
    }

    // 2. Firestore sync
    try {
      const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const fromDb = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
          } as ContactMessage));

          setMessages(prev => {
            const map = new Map<string, ContactMessage>();
            fromDb.forEach(m => map.set(m.id, m));
            prev.forEach(m => {
              if (!map.has(m.id)) map.set(m.id, m);
            });
            const merged = Array.from(map.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            saveToCache(merged);
            return merged;
          });
        }
        setLoading(false);
      }, (err) => {
        console.warn("Messages snapshot error, using cached data", err);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (e) {
      setLoading(false);
    }
  }, []);

  const toggleReadStatus = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const updated = messages.map(m => m.id === id ? { ...m, isRead: newStatus } : m);
    setMessages(updated);
    saveToCache(updated);

    if (selectedMsg && selectedMsg.id === id) {
      setSelectedMsg({ ...selectedMsg, isRead: newStatus });
    }

    showNotification(newStatus ? 'Message marked as read' : 'Message marked as unread', 'info');

    try {
      await updateDoc(doc(db, 'messages', id), { isRead: newStatus });
    } catch (e) {
      console.warn("Firestore message updateDoc fallback to local cache:", e);
    }
  };

  const handleRequestDelete = (msg: ContactMessage) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Message?',
      message: `Are you sure you want to permanently delete the message from ${msg.name} ("${msg.subject || 'No Subject'}")? This cannot be undone.`,
      action: async () => {
        // Immediate UI removal
        const updated = messages.filter(m => m.id !== msg.id);
        setMessages(updated);
        saveToCache(updated);

        if (selectedMsg && selectedMsg.id === msg.id) {
          setSelectedMsg(null);
        }

        showNotification('Message deleted successfully.');

        try {
          await deleteDoc(doc(db, 'messages', msg.id));
        } catch (e) {
          console.warn("Firestore deleteDoc fallback to local cache:", e);
        }
      }
    });
  };

  const handleConfirmAction = async () => {
    setIsProcessing(true);
    try {
      await confirmModal.action();
    } finally {
      setIsProcessing(false);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  // Filter messages
  const filtered = messages.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filter === 'all' ? true :
      filter === 'unread' ? !m.isRead :
      m.isRead;

    return matchesSearch && matchesFilter;
  });

  const unreadCount = messages.filter(m => !m.isRead).length;

  if (loading) return <LoadingSpinner text="Loading inbox messages..." />;

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
        confirmText="Delete Message"
        variant="danger"
        icon="trash"
        isLoading={isProcessing}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-medium text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <span>Inbox & Messages</span>
            {unreadCount > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-600 text-white font-sans font-medium">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Incoming communications from contact inquiries and community outreach.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4 rounded-2xl shadow-sm border border-zinc-200/80 dark:border-zinc-800/80 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by sender, email, subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50/80 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {(['all', 'unread', 'read'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {f === 'unread' ? `Unread (${unreadCount})` : f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl shadow-sm border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/50 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <th className="p-4 w-16">Status</th>
                <th className="p-4">Date</th>
                <th className="p-4">Sender</th>
                <th className="p-4">Email</th>
                <th className="p-4">Subject</th>
                <th className="p-4">Preview</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70 text-xs text-zinc-700 dark:text-zinc-300">
              {filtered.map(msg => (
                <tr 
                  key={msg.id} 
                  className={`hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors ${
                    msg.isRead ? 'opacity-70' : 'bg-brand-50/30 dark:bg-brand-950/20 font-medium'
                  }`}
                >
                  <td className="p-4 whitespace-nowrap">
                    <button 
                      onClick={() => toggleReadStatus(msg.id, msg.isRead)} 
                      className={`p-1.5 rounded-full transition-colors ${
                        msg.isRead 
                          ? 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-500' 
                          : 'bg-brand-100 text-brand-600 hover:bg-brand-200 dark:bg-brand-950 dark:text-brand-400'
                      }`}
                      title={msg.isRead ? "Mark as Unread" : "Mark as Read"}
                    >
                      {msg.isRead ? <Check size={14} /> : <Mail size={14} />}
                    </button>
                  </td>

                  <td className="p-4 whitespace-nowrap text-zinc-500 font-mono text-[11px]">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : '-'}
                  </td>

                  <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                    {msg.name}
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <a href={`mailto:${msg.email}`} className="text-brand-600 dark:text-brand-400 hover:underline font-mono text-[11px]">
                      {msg.email}
                    </a>
                  </td>

                  <td className="p-4 max-w-[200px] truncate text-zinc-900 dark:text-zinc-100 font-medium">
                    {msg.subject || 'No Subject'}
                  </td>

                  <td className="p-4 max-w-xs truncate text-zinc-500" title={msg.message}>
                    {msg.message}
                  </td>

                  <td className="p-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedMsg(msg);
                          if (!msg.isRead) toggleReadStatus(msg.id, false);
                        }}
                        className="p-1.5 text-zinc-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950 rounded-lg transition-colors"
                        title="Read Full Message"
                      >
                        <Eye size={15} />
                      </button>
                      <button 
                        onClick={() => handleRequestDelete(msg)} 
                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Delete Message (Requires Confirmation)"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-zinc-500">
                    <div className="max-w-xs mx-auto text-center space-y-2">
                      <MessageSquare size={28} className="mx-auto text-zinc-400" />
                      <p className="font-medium text-sm text-zinc-700 dark:text-zinc-300">No messages in inbox</p>
                      <p className="text-xs text-zinc-500">All caught up! There are no messages matching your current filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Reader Modal */}
      {selectedMsg && (
        <div 
          onClick={() => setSelectedMsg(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="max-w-lg w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="text-base font-serif font-semibold text-zinc-900 dark:text-zinc-50">
                    {selectedMsg.subject || 'Message Details'}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Received: {selectedMsg.createdAt ? new Date(selectedMsg.createdAt).toLocaleString() : 'Recent'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMsg(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-400">From:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedMsg.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Email:</span>
                <a href={`mailto:${selectedMsg.email}`} className="text-brand-600 dark:text-brand-400 font-mono underline">
                  {selectedMsg.email}
                </a>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Message Content:</label>
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl text-xs sm:text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                {selectedMsg.message}
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex gap-2">
                <a
                  href={`mailto:${selectedMsg.email}?subject=Re: ${encodeURIComponent(selectedMsg.subject || 'HEA Foundation Inquiry')}`}
                  className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Send size={13} />
                  <span>Reply via Email</span>
                </a>
                <button
                  onClick={() => handleRequestDelete(selectedMsg)}
                  className="px-3.5 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl text-xs font-medium transition-colors"
                >
                  Delete
                </button>
              </div>

              <button
                onClick={() => setSelectedMsg(null)}
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
