import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Plus, Edit2, Trash2, MapPin, Calendar, Search, CheckCircle, ExternalLink, X, Image as ImageIcon } from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';

export interface ProjectItem {
  id?: string;
  title: string;
  description: string;
  location: string;
  date: string;
  category?: string;
  status: 'Active' | 'Upcoming' | 'Completed';
  image: string;
  targetGoal?: number;
  raisedAmount?: number;
  createdAt?: number;
  updatedAt?: number;
}

export const DEFAULT_PROJECTS: ProjectItem[] = [];

export function AdminProjects() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
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

  // Form fields
  const [formData, setFormData] = useState<Partial<ProjectItem>>({
    title: '',
    description: '',
    location: '',
    date: '',
    category: 'Relief',
    status: 'Active',
    image: '',
    targetGoal: 100000,
    raisedAmount: 0
  });

  const sanitizeCachedProjects = (raw: any[]): ProjectItem[] => {
    // Purge mock dummy p-1 to p-4 IDs so initial count starts at 0 as requested
    return raw.filter(p => !['p-1', 'p-2', 'p-3', 'p-4'].includes(p.id));
  };

  useEffect(() => {
    // 1. Initial cached check
    try {
      const cached = localStorage.getItem('hea_cached_projects');
      if (cached) {
        const sanitized = sanitizeCachedProjects(JSON.parse(cached));
        setProjects(sanitized);
        localStorage.setItem('hea_cached_projects', JSON.stringify(sanitized));
      }
    } catch {}

    // 2. Real-time Firestore snapshot
    const unsub = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const loaded: ProjectItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ProjectItem));
      const sanitized = sanitizeCachedProjects(loaded);
      setProjects(sanitized);
      localStorage.setItem('hea_cached_projects', JSON.stringify(sanitized));
      window.dispatchEvent(new CustomEvent('hea_stats_updated'));
      setLoading(false);
    }, (err) => {
      console.warn("Projects snapshot listener error, using cache", err);
      try {
        const cached = localStorage.getItem('hea_cached_projects');
        if (cached) {
          const sanitized = sanitizeCachedProjects(JSON.parse(cached));
          setProjects(sanitized);
        }
      } catch {}
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleOpenAdd = () => {
    setEditingProject(null);
    setFormData({
      title: '',
      description: '',
      location: '',
      date: 'Active 2025',
      category: 'Relief',
      status: 'Active',
      image: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&q=80&w=1200',
      targetGoal: 100000,
      raisedAmount: 0
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (proj: ProjectItem) => {
    setEditingProject(proj);
    setFormData({ ...proj });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;
    setSaving(true);

    const now = Date.now();
    const itemData: ProjectItem = {
      title: formData.title || '',
      description: formData.description || '',
      location: formData.location || 'Bangladesh',
      date: formData.date || 'Ongoing',
      category: formData.category || 'General',
      status: (formData.status as any) || 'Active',
      image: formData.image || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=1200',
      targetGoal: Number(formData.targetGoal) || 100000,
      raisedAmount: Number(formData.raisedAmount) || 0,
      updatedAt: now,
      createdAt: editingProject?.createdAt || now,
    };

    try {
      if (editingProject && editingProject.id) {
        // Try Firestore update
        try {
          await updateDoc(doc(db, 'projects', editingProject.id), itemData as any);
        } catch (dbErr) {
          console.warn("Firestore update skipped, updating local state", dbErr);
        }

        const updated = projects.map(p => p.id === editingProject.id ? { ...p, ...itemData } : p);
        setProjects(updated);
        localStorage.setItem('hea_cached_projects', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('hea_stats_updated'));
      } else {
        // Try Firestore add
        let newId = 'proj-' + Date.now();
        try {
          const docRef = await addDoc(collection(db, 'projects'), itemData as any);
          newId = docRef.id;
        } catch (dbErr) {
          console.warn("Firestore addDoc skipped, adding to local state", dbErr);
        }

        const updated = [{ ...itemData, id: newId }, ...projects];
        setProjects(updated);
        localStorage.setItem('hea_cached_projects', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('hea_stats_updated'));
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving project:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, title?: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Project Campaign?',
      message: `Are you sure you want to permanently delete "${title || 'this project'}"? All campaign records and progress will be removed.`,
      action: async () => {
        const updated = projects.filter(p => p.id !== id);
        setProjects(updated);
        localStorage.setItem('hea_cached_projects', JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('hea_stats_updated'));

        try {
          await deleteDoc(doc(db, 'projects', id));
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

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner text="Loading projects..." />;
  }

  return (
    <div>
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Delete Project"
        variant="danger"
        icon="trash"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-medium text-zinc-900 dark:text-zinc-50">Community Projects</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage and publish charitable campaigns and relief initiatives.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm shadow-brand-500/20 shrink-0"
        >
          <Plus size={18} />
          <span>Add New Project</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search projects by title or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['All', 'Active', 'Upcoming', 'Completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                filterStatus === status
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredProjects.map((project) => {
          const percent = project.targetGoal && project.targetGoal > 0 
            ? Math.min(100, Math.round(((project.raisedAmount || 0) / project.targetGoal) * 100))
            : 0;

          return (
            <div 
              key={project.id} 
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm flex flex-col group transition-all"
            >
              <div className="relative h-48 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${
                    project.status === 'Active' ? 'bg-emerald-500/90 text-white' :
                    project.status === 'Upcoming' ? 'bg-blue-500/90 text-white' :
                    'bg-zinc-800/90 text-white'
                  }`}>
                    {project.status}
                  </span>
                  {project.category && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-black/50 text-white backdrop-blur-md">
                      {project.category}
                    </span>
                  )}
                </div>

                <div className="absolute top-3 right-3 flex gap-1 bg-black/40 backdrop-blur-md rounded-lg p-1">
                  <button
                    onClick={() => handleOpenEdit(project)}
                    className="p-1.5 text-white hover:text-brand-300 hover:bg-white/10 rounded transition-colors"
                    title="Edit Project"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => project.id && handleDelete(project.id, project.title)}
                    className="p-1.5 text-red-300 hover:text-red-100 hover:bg-red-500/30 rounded transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-serif font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                    {project.title}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                    {project.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} className="text-brand-600 dark:text-brand-400" />
                      {project.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} className="text-brand-600 dark:text-brand-400" />
                      {project.date}
                    </span>
                  </div>

                  {project.targetGoal && project.targetGoal > 0 && (
                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1.5">
                        <span className="text-zinc-700 dark:text-zinc-300 font-mono">
                          ৳{(project.raisedAmount || 0).toLocaleString()} raised
                        </span>
                        <span className="text-brand-600 dark:text-brand-400 font-mono">
                          {percent}% of ৳{project.targetGoal.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-600 dark:bg-brand-500 rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center border border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500 text-sm">No projects found matching your filter criteria.</p>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-xl font-serif font-medium text-zinc-900 dark:text-zinc-50">
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Winter Clothes Distribution"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Relief">Relief & Food</option>
                    <option value="Education">Education</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Water">Clean Water</option>
                    <option value="Community">Community Development</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g. Kurigram, Bangladesh"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Timeline / Date
                  </label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g. Ongoing 2025"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Target Goal (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.targetGoal}
                    onChange={(e) => setFormData({ ...formData, targetGoal: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Funds Raised (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.raisedAmount}
                    onChange={(e) => setFormData({ ...formData, raisedAmount: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Cover Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="flex-1 px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-xs font-mono"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder="Describe the mission, beneficiaries, and impact..."
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium text-xs transition-colors shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
