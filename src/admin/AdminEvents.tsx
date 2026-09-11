import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Calendar, Plus, Trash2, Edit, Search, MapPin, Users, CheckCircle2, Clock } from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { LoadingSpinner } from '../components/LoadingSpinner';

export interface EventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  beneficiaries?: number | string;
  description: string;
  imageUrl?: string;
  createdAt: number;
}

export function AdminEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    category: 'Community Support',
    beneficiaries: '',
    description: '',
    imageUrl: ''
  });

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Real-time snapshot listener for events
    let q;
    try {
      q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
    } catch {
      q = collection(db, 'events');
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: EventItem[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as EventItem);
        });
        setEvents(list);
        setLoading(false);
        try {
          localStorage.setItem('hea_cached_events', JSON.stringify(list));
          window.dispatchEvent(new CustomEvent('hea_stats_updated'));
        } catch {}
      },
      (error) => {
        console.warn("Firestore events fetch error, reading fallback cache", error);
        try {
          const cached = localStorage.getItem('hea_cached_events');
          if (cached) {
            setEvents(JSON.parse(cached));
          }
        } catch {}
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleOpenModal = (event?: EventItem) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        date: event.date,
        location: event.location,
        category: event.category,
        beneficiaries: event.beneficiaries ? String(event.beneficiaries) : '',
        description: event.description,
        imageUrl: event.imageUrl || ''
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        category: 'Community Support',
        beneficiaries: '',
        description: '',
        imageUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const id = editingEvent ? editingEvent.id : `evt-${Date.now()}`;
    const payload: EventItem = {
      id,
      title: formData.title.trim(),
      date: formData.date,
      location: formData.location.trim() || 'Bangladesh',
      category: formData.category,
      beneficiaries: formData.beneficiaries ? Number(formData.beneficiaries) || formData.beneficiaries : '',
      description: formData.description.trim(),
      imageUrl: formData.imageUrl.trim() || '',
      createdAt: editingEvent ? editingEvent.createdAt : Date.now()
    };

    try {
      await setDoc(doc(db, 'events', id), payload);
      // Update local state immediately
      const updated = editingEvent 
        ? events.map(ev => ev.id === id ? payload : ev)
        : [payload, ...events];
      setEvents(updated);
      localStorage.setItem('hea_cached_events', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('hea_stats_updated'));
      setIsModalOpen(false);
    } catch (err) {
      console.warn("Error saving event to Firestore, falling back to local storage", err);
      const updated = editingEvent 
        ? events.map(ev => ev.id === id ? payload : ev)
        : [payload, ...events];
      setEvents(updated);
      localStorage.setItem('hea_cached_events', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('hea_stats_updated'));
      setIsModalOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'events', deleteId));
      const updated = events.filter(ev => ev.id !== deleteId);
      setEvents(updated);
      localStorage.setItem('hea_cached_events', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('hea_stats_updated'));
    } catch (err) {
      console.warn("Failed to delete event from Firestore, deleting locally", err);
      const updated = events.filter(ev => ev.id !== deleteId);
      setEvents(updated);
      localStorage.setItem('hea_cached_events', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('hea_stats_updated'));
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const filtered = events.filter(ev => {
    const matchesSearch = ev.title.toLowerCase().includes(search.toLowerCase()) ||
                          ev.location.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || ev.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <span>Hosted Events</span>
            <span className="text-xs px-2.5 py-1 rounded-full font-sans font-medium bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              {events.length} Total Hosted
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Log humanitarian relief events, health camps, and community drives. This directly increments the Homepage "Events Hosted" counter in real time.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-purple-500/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add Hosted Event</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search events by title or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="All">All Categories</option>
          <option value="Community Support">Community Support</option>
          <option value="Health & Medical">Health & Medical</option>
          <option value="Education & Schools">Education & Schools</option>
          <option value="Disaster Relief">Disaster Relief</option>
          <option value="Youth Empowerment">Youth Empowerment</option>
        </select>
      </div>

      {/* Events List */}
      {loading ? (
        <LoadingSpinner text="Loading events..." />
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 text-center border border-zinc-200 dark:border-zinc-800">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-4">
            <Calendar size={28} />
          </div>
          <h3 className="text-lg font-serif font-medium text-zinc-900 dark:text-zinc-100 mb-1">
            No events found
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
            Click "+ Add Hosted Event" to record field drives, medical camps, or food distributions. The homepage counter will update to reflect your real events!
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-medium hover:bg-purple-700 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Add First Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between hover:border-purple-300 dark:hover:border-purple-800 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    {item.category}
                  </span>
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Clock size={12} /> {item.date}
                  </span>
                </div>

                <h3 className="text-base font-serif font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                  {item.title}
                </h3>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-4">
                  {item.description || "No description provided."}
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-purple-500" />
                  <span className="truncate max-w-[120px]">{item.location}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenModal(item)}
                    className="p-1.5 text-zinc-500 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Edit Event"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteId(item.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Delete Event"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-serif font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              {editingEvent ? 'Edit Hosted Event' : 'Record New Hosted Event'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Winter Blanket & Food Relief Camp"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Community Support">Community Support</option>
                    <option value="Health & Medical">Health & Medical</option>
                    <option value="Education & Schools">Education & Schools</option>
                    <option value="Disaster Relief">Disaster Relief</option>
                    <option value="Youth Empowerment">Youth Empowerment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Kurigram, Rangpur"
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Beneficiaries / Attendees
                  </label>
                  <input
                    type="number"
                    value={formData.beneficiaries}
                    onChange={(e) => setFormData({ ...formData, beneficiaries: e.target.value })}
                    placeholder="e.g. 350"
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Description & Impact Details
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details about activities conducted, supplies distributed, or team members involved..."
                  className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-xl transition-colors shadow-sm"
                >
                  {editingEvent ? 'Save Changes' : 'Record Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Event Record?"
        message="Are you sure you want to delete this event record? This will also update the total hosted events count on the homepage."
        confirmText="Delete Event"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isLoading={isDeleting}
      />
    </div>
  );
}

export default AdminEvents;
