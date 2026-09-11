import { useEffect, useState } from 'react';
import { useSEO } from "../hooks/useSEO";
import { motion } from 'motion/react';
import { Image as ImageIcon, Calendar, Tag, Eye, X } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { DEFAULT_GALLERY_ITEMS, GalleryItem } from '../admin/AdminGallery';
import { LoadingSpinner } from '../components/LoadingSpinner';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function Gallery() {
  useSEO("Impact Gallery", "Visual stories and captured moments of hope, relief, and community uplifting by HEA Foundation.");
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    async function loadGallery() {
      try {
        const snap = await getDocs(collection(db, 'gallery'));
        if (!snap.empty) {
          const loaded: GalleryItem[] = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as GalleryItem));
          setItems(loaded);
        } else {
          const cached = localStorage.getItem('hea_cached_gallery');
          setItems(cached ? JSON.parse(cached) : DEFAULT_GALLERY_ITEMS);
        }
      } catch (err) {
        const cached = localStorage.getItem('hea_cached_gallery');
        setItems(cached ? JSON.parse(cached) : DEFAULT_GALLERY_ITEMS);
      } finally {
        setLoading(false);
      }
    }
    loadGallery();
  }, []);

  const categories = ['All', 'Relief', 'Education', 'Clean Water', 'Healthcare', 'Community'];

  const filteredItems = items.filter(item => {
    if (selectedCategory === 'All') return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="pt-24 pb-24 min-h-screen bg-gradient-to-b from-purple-50/40 via-white to-indigo-50/30 dark:from-zinc-950 dark:via-[#130722] dark:to-zinc-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <span className="inline-block py-1 px-3.5 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-950/60 dark:to-indigo-950/60 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 text-xs font-semibold tracking-wide mb-4">
            Captured Moments
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-medium text-zinc-900 dark:text-zinc-50 mb-4 leading-tight">
            Our Ground Impact Gallery
          </h1>
          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            A visual chronicle of our relief distributions, clean water wells, healthcare camps, and smiling children across Bangladesh.
          </p>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 text-white shadow-md shadow-purple-600/25 scale-105'
                    : 'bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {loading ? (
          <div className="py-20">
            <LoadingSpinner text="Loading gallery photos..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item, idx) => (
              <motion.div
                key={item.id || idx}
                variants={fadeIn}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                className="bg-white/90 dark:bg-zinc-900/90 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-zinc-200/80 dark:border-zinc-800/80 group transition-all flex flex-col cursor-pointer"
                onClick={() => setLightboxItem(item)}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-60 group-hover:opacity-40 transition-opacity" />
                  
                  <div className="absolute top-3.5 left-3.5">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-black/60 text-white backdrop-blur-md">
                      {item.category}
                    </span>
                  </div>

                  <div className="absolute bottom-3.5 right-3.5 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye size={16} />
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-serif font-semibold text-zinc-900 dark:text-zinc-50 mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {item.title}
                    </h3>
                    {item.caption && (
                      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {item.caption}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-brand-600 dark:text-brand-400" />
                      {item.date}
                    </span>
                    <span className="text-brand-600 dark:text-brand-400 font-medium group-hover:underline">
                      View details
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {filteredItems.length === 0 && !loading && (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-16 text-center border border-zinc-200 dark:border-zinc-800 max-w-lg mx-auto">
            <p className="text-zinc-500 text-sm">No photos found in this category.</p>
          </div>
        )}

        {/* Lightbox Modal */}
        {lightboxItem && (
          <div 
            onClick={() => setLightboxItem(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="max-w-3xl w-full bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-zinc-800"
            >
              <div className="relative max-h-[70vh] bg-black">
                <img 
                  src={lightboxItem.image} 
                  alt={lightboxItem.title} 
                  className="w-full h-full object-contain max-h-[70vh]" 
                />
                <button
                  onClick={() => setLightboxItem(null)}
                  className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
                    {lightboxItem.category}
                  </span>
                  <span className="text-xs text-zinc-400">•</span>
                  <span className="text-xs text-zinc-400">{lightboxItem.date}</span>
                </div>
                <h3 className="text-2xl font-serif font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
                  {lightboxItem.title}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {lightboxItem.caption}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
