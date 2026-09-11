import { useEffect, useState } from 'react';
import { useSEO } from "../hooks/useSEO";
import { motion } from 'motion/react';
import { ArrowRight, MapPin, Calendar, HeartHandshake, CheckCircle2, Sparkles, FolderPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { ProjectItem } from '../admin/AdminProjects';
import { LoadingSpinner } from '../components/LoadingSpinner';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function Projects() {
  useSEO("Our Projects & Causes", "Discover the ongoing, upcoming, and completed humanitarian initiatives spearheaded by HEA Foundation.");
  const [projectsList, setProjectsList] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const sanitizeCachedProjects = (raw: any[]): ProjectItem[] => {
    return raw.filter(p => !['p-1', 'p-2', 'p-3', 'p-4'].includes(p.id));
  };

  useEffect(() => {
    // 1. Initial cached check
    try {
      const cached = localStorage.getItem('hea_cached_projects');
      if (cached) {
        setProjectsList(sanitizeCachedProjects(JSON.parse(cached)));
      }
    } catch {}

    // 2. Real-time Firestore snapshot listener
    const unsub = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const loaded: ProjectItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ProjectItem));
      const sanitized = sanitizeCachedProjects(loaded);
      setProjectsList(sanitized);
      localStorage.setItem('hea_cached_projects', JSON.stringify(sanitized));
      setLoading(false);
    }, (err) => {
      console.warn("Projects live snapshot listener error, using cache", err);
      try {
        const cached = localStorage.getItem('hea_cached_projects');
        if (cached) {
          setProjectsList(sanitizeCachedProjects(JSON.parse(cached)));
        }
      } catch {}
      setLoading(false);
    });

    const handleLocal = () => {
      try {
        const cached = localStorage.getItem('hea_cached_projects');
        if (cached) setProjectsList(sanitizeCachedProjects(JSON.parse(cached)));
      } catch {}
    };

    window.addEventListener('storage', handleLocal);
    window.addEventListener('hea_stats_updated', handleLocal);

    return () => {
      unsub();
      window.removeEventListener('storage', handleLocal);
      window.removeEventListener('hea_stats_updated', handleLocal);
    };
  }, []);

  const filtered = projectsList.filter(p => {
    if (filterStatus === 'All') return true;
    return p.status === filterStatus;
  });

  return (
    <div className="pt-24 pb-24 min-h-screen transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <span className="inline-block py-1 px-3.5 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-800 dark:text-brand-300 text-xs font-semibold tracking-wide mb-4">
            Our Initiatives
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-medium text-zinc-900 dark:text-zinc-50 mb-4 leading-tight">
            Transformative Community Projects
          </h1>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            From winter emergency aid to sustainable clean drinking water, explore where our dedicated team and volunteers are working.
          </p>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {['All', 'Active', 'Upcoming', 'Completed'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white shadow-md shadow-purple-600/25 scale-105'
                    : 'bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {st} Projects
              </button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div className="py-20">
            <LoadingSpinner text="Loading community initiatives..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {filtered.map((project) => (
              <motion.div 
                key={project.id || project.title}
                variants={fadeIn}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                className="bg-white/90 dark:bg-zinc-900/90 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-zinc-200/80 dark:border-zinc-800/80 transition-all flex flex-col group"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <img 
                    src={project.image} 
                    alt={project.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-sm ${
                      project.status === 'Active' 
                        ? 'bg-emerald-500/90 text-white' 
                        : project.status === 'Upcoming'
                        ? 'bg-blue-500/90 text-white'
                        : 'bg-zinc-800/90 text-zinc-200'
                    }`}>
                      {project.status}
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-brand-600 dark:text-brand-400" />
                        {project.location}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-brand-600 dark:text-brand-400" />
                        {project.date}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-serif font-semibold text-zinc-900 dark:text-zinc-50 mb-3 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {project.title}
                    </h2>
                    
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                      {project.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <Link 
                      to="/donate"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                    >
                      <HeartHandshake size={15} />
                      <span>Support This Cause</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      to="/volunteer"
                      className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 underline"
                    >
                      Join as Volunteer
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {filtered.length === 0 && !loading && (
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-3xl p-12 sm:p-16 text-center border border-purple-200/60 dark:border-purple-900/40 max-w-xl mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-4 border border-purple-200 dark:border-purple-800/40">
              <FolderPlus size={30} />
            </div>
            <h3 className="text-xl font-serif font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              No Community Projects Yet
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-md mx-auto leading-relaxed">
              Community projects are added directly by the administrative team. Once an initiative is launched, it appears here and dynamically increments the Live Impact Tracker.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/volunteer"
                className="px-5 py-2.5 bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white rounded-xl text-xs font-medium shadow-md shadow-purple-600/25 transition-all"
              >
                Join Volunteer Network
              </Link>
              <Link
                to="/admin/projects"
                className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-medium transition-colors"
              >
                Admin: Add Project
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
