import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Plus, Trash2, Image as ImageIcon, Search, X, Eye, Calendar, Tag } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';

export interface GalleryItem {
  id?: string;
  title: string;
  caption?: string;
  category: 'Relief' | 'Education' | 'Healthcare' | 'Clean Water' | 'Community';
  image: string;
  date: string;
  createdAt?: number;
}

export const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'g-1',
    title: 'Winter Warmth for Elders',
    caption: 'Handing out heavy wool blankets and winter essentials to elderly villagers in Panchagarh.',
    category: 'Relief',
    image: 'https://images.unsplash.com/photo-1544365558-35aa4afcf11f?auto=format&fit=crop&q=80&w=1200',
    date: 'January 2025'
  },
  {
    id: 'g-2',
    title: 'New Books & Bright Smiles',
    caption: 'Students receiving their annual learning kits and story books at our informal urban school.',
    category: 'Education',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=1200',
    date: 'February 2025'
  },
  {
    id: 'g-3',
    title: 'First Fresh Water Flowing',
    caption: 'Villagers celebrating the opening of a deep tube-well providing safe, arsenic-free water.',
    category: 'Clean Water',
    image: 'https://images.unsplash.com/photo-1541819349272-132d733db9b8?auto=format&fit=crop&q=80&w=1200',
    date: 'March 2025'
  },
  {
    id: 'g-4',
    title: 'Volunteer Medical Diagnostics',
    caption: 'Doctors conducting free blood pressure, sugar, and vision screenings for mothers.',
    category: 'Healthcare',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=1200',
    date: 'January 2025'
  },
  {
    id: 'g-5',
    title: 'Emergency Food Relief Drive',
    caption: 'Essential dry food parcels and baby nutrition delivered to flood-affected families.',
    category: 'Relief',
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=1200',
    date: 'August 2024'
  },
  {
    id: 'g-6',
    title: 'Youth Leadership & Team Spirit',
    caption: 'Our passionate youth volunteers coordinating logistical support across 5 field centers.',
    category: 'Community',
    image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&q=80&w=1200',
    date: 'November 2024'
  }
];

export function AdminGallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Confirm delete modal state
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
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState<Partial<GalleryItem>>({
    title: '',
    caption: '',
    category: 'Relief',
    image: '',
    date: 'March 2025'
  });

  const loadGallery = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'gallery'));
      if (!snap.empty) {
        const loaded: GalleryItem[] = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as GalleryItem));
        setItems(loaded);
        localStorage.setItem('hea_cached_gallery', JSON.stringify(loaded));
      } else {
        const cached = localStorage.getItem('hea_cached_gallery');
        if (cached) {
          setItems(JSON.parse(cached));
        } else {
          setItems(DEFAULT_GALLERY_ITEMS);
          localStorage.setItem('hea_cached_gallery', JSON.stringify(DEFAULT_GALLERY_ITEMS));
        }
      }
    } catch (e) {
      console.warn("Using local gallery items:", e);
      const cached = localStorage.getItem('hea_cached_gallery');
      setItems(cached ? JSON.parse(cached) : DEFAULT_GALLERY_ITEMS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      title: '',
      caption: '',
      category: 'Community',
      image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=1200',
      date: 'March 2025'
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.image) return;
    setSaving(true);

    const now = Date.now();
    const newItem: GalleryItem = {
      title: formData.title,
      caption: formData.caption || '',
      category: (formData.category as any) || 'Community',
      image: formData.image,
      date: formData.date || '2025',
      createdAt: now
    };

    try {
      let docId = 'g-' + now;
      try {
        const docRef = await addDoc(collection(db, 'gallery'), newItem as any);
        docId = docRef.id;
      } catch (dbErr) {
        console.warn("Firestore gallery write skipped", dbErr);
      }

      const updated = [{ ...newItem, id: docId }, ...items];
      setItems(updated);
      localStorage.setItem('hea_cached_gallery', JSON.stringify(updated));
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving gallery item:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, title?: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Photo from Gallery?',
      message: `Are you sure you want to remove "${title || 'this photo'}" from the gallery? It will no longer appear on public pages.`,
      action: async () => {
        const updated = items.filter(i => i.id !== id);
        setItems(updated);
        localStorage.setItem('hea_cached_gallery', JSON.stringify(updated));

        try {
          await deleteDoc(doc(db, 'gallery', id));
        } catch (dbErr) {
          console.warn("Firestore delete skipped", dbErr);
        }
      }
    });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await confirmModal.action();
    } finally {
      setIsDeleting(false);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  const filteredItems = items.filter(i => {
    const matchesSearch = i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (i.caption || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || i.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <LoadingSpinner text="Loading gallery..." />;
  }

  return (
    <div>
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Remove Photo"
        variant="danger"
        icon="trash"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-medium text-zinc-900 dark:text-zinc-50">Photo Gallery</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Curate on-ground photography and field impact moments.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm shadow-brand-500/20 shrink-0"
        >
          <Plus size={18} />
          <span>Add Photo / Story</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search moments by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['All', 'Relief', 'Education', 'Clean Water', 'Healthcare', 'Community'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div 
            key={item.id}
            className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm flex flex-col group transition-all"
          >
            <div className="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-800">
              <img 
                src={item.image} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-2.5 left-2.5">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-black/60 text-white backdrop-blur-md">
                  {item.category}
                </span>
              </div>
              <div className="absolute top-2.5 right-2.5 flex gap-1 bg-black/50 backdrop-blur-md rounded-lg p-1">
                <button
                  onClick={() => setPreviewItem(item)}
                  className="p-1 text-white hover:text-brand-300 rounded"
                  title="Enlarge"
                >
                  <Eye size={15} />
                </button>
                <button
                  onClick={() => item.id && handleDelete(item.id, item.title)}
                  className="p-1 text-red-300 hover:text-red-100 rounded"
                  title="Delete Photo"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-semibold text-sm text-zinc-900 dark:text-zinc-50 mb-1">
                  {item.title}
                </h3>
                {item.caption && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.caption}
                  </p>
                )}
              </div>
              <div className="pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {item.date}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center border border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500 text-sm">No photos found in this category.</p>
        </div>
      )}

      {/* Add Photo Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-lg font-serif font-medium text-zinc-900 dark:text-zinc-50">Add Photo to Gallery</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Photo Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Winter Blanket Distribution"
                  className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  >
                    <option value="Relief">Relief & Food</option>
                    <option value="Education">Education</option>
                    <option value="Clean Water">Clean Water</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Community">Community</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Date / Period
                  </label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    placeholder="e.g. March 2025"
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Image URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Short Caption / Story (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  placeholder="Describe this moment..."
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
                  {saving ? 'Adding...' : 'Add to Gallery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enlarge Preview Modal */}
      {previewItem && (
        <div 
          onClick={() => setPreviewItem(null)} 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="max-w-2xl w-full bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-800"
          >
            <div className="relative max-h-[65vh] bg-black">
              <img src={previewItem.image} alt={previewItem.title} className="w-full h-full object-contain max-h-[65vh]" />
              <button
                onClick={() => setPreviewItem(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                {previewItem.category}
              </span>
              <h3 className="text-lg font-serif font-semibold text-zinc-900 dark:text-zinc-50 mt-2 mb-1">
                {previewItem.title}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {previewItem.caption}
              </p>
              <p className="text-xs text-zinc-400 mt-3">{previewItem.date}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
