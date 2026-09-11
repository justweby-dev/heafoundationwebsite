import React, { useState } from 'react';
import { useSEO } from "../hooks/useSEO";
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Heart, Send, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Volunteer() {
  useSEO("Volunteer", "Join us and make a difference. Apply to become a volunteer at HEA Foundation.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    ageRange: '',
    location: '',
    skills: '',
    interests: '',
    reason: ''
  });

  const validateEmail = (email: string) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.name.trim()) return setError("Name is required");
    if (!formData.email.trim() || !validateEmail(formData.email)) return setError("Valid email is required");
    if (!formData.phone.trim()) return setError("Phone number is required");
    if (!formData.location.trim()) return setError("Location is required");
    if (!formData.reason.trim()) return setError("Please tell us why you want to volunteer");

    setIsSubmitting(true);
    try {
      const newVol = {
        ...formData,
        id: 'vol-' + Date.now(),
        status: 'Pending' as const,
        createdAt: Date.now()
      };

      try {
        const docRef = await addDoc(collection(db, 'volunteers'), {
          ...formData,
          status: 'Pending',
          createdAt: Date.now()
        });
        newVol.id = docRef.id;
      } catch (err) {
        console.warn("Firestore volunteer submission skipped, stored locally:", err);
      }

      try {
        const existing = JSON.parse(localStorage.getItem('hea_cached_volunteers') || '[]');
        localStorage.setItem('hea_cached_volunteers', JSON.stringify([newVol, ...existing]));
        window.dispatchEvent(new CustomEvent('hea_stats_updated'));
      } catch (e) {}

      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting application:", err);
      setError("There was a network error submitting your application. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24 pb-24 min-h-screen bg-gradient-to-b from-purple-50/40 via-white to-indigo-50/30 dark:from-zinc-950 dark:via-[#130722] dark:to-zinc-950 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <div className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-600/25 transform -rotate-6">
            <Heart size={30} />
          </div>
          <span className="inline-block py-1 px-3.5 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-950/60 dark:to-indigo-950/60 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 text-xs font-semibold tracking-wide mb-4">
            Get Involved
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-medium text-zinc-900 dark:text-zinc-50 mb-6">
            Change Starts With People Like You.
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            By volunteering with HEA Foundation, you become part of a dedicated community working to bring hope and sustainable development to those who need it most.
          </p>
        </div>

        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-3xl shadow-sm border border-purple-100 dark:border-purple-900/40 overflow-hidden">
          {submitted ? (
            <div className="p-12 text-center flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <Send size={32} />
              </div>
              <h2 className="text-2xl font-serif font-medium text-zinc-900 dark:text-zinc-50 mb-4">Application Received!</h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-md mx-auto leading-relaxed">
                Thank you for applying to volunteer with HEA Foundation. We are reviewing your application and will be in touch with you shortly regarding next steps.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    name: '', email: '', phone: '', ageRange: '', location: '', skills: '', interests: '', reason: ''
                  });
                }}
                className="px-8 py-3 bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white rounded-full font-medium shadow-md shadow-purple-600/25 cursor-pointer"
              >
                Submit Another Application
              </motion.button>
            </div>
          ) : (
            <div className="p-8 md:p-12">
              <h2 className="text-2xl font-serif font-medium text-zinc-900 dark:text-zinc-50 mb-8 border-b border-zinc-100 dark:border-zinc-800 pb-4">Volunteer Application Form</h2>
              
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3 text-sm">
                  <AlertCircle size={18} />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Full Name *</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email Address *</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Phone Number *</label>
                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-purple-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Age Range</label>
                    <select value={formData.ageRange} onChange={(e) => setFormData({...formData, ageRange: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-purple-500 outline-none">
                      <option value="">Select an option</option>
                      <option value="Under 18">Under 18</option>
                      <option value="18-24">18-24</option>
                      <option value="25-34">25-34</option>
                      <option value="35-44">35-44</option>
                      <option value="45+">45+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Location / City *</label>
                  <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Skills or Expertise</label>
                  <textarea rows={2} value={formData.skills} onChange={(e) => setFormData({...formData, skills: e.target.value})} placeholder="e.g. Teaching, medical, photography, event organization..." className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-purple-500 outline-none resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Areas of Interest</label>
                  <textarea rows={2} value={formData.interests} onChange={(e) => setFormData({...formData, interests: e.target.value})} placeholder="e.g. Education initiatives, disaster relief, admin support..." className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-purple-500 outline-none resize-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Why do you want to volunteer with us? *</label>
                  <textarea rows={4} value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-purple-500 outline-none resize-none" />
                </div>

                <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
                  <motion.button 
                    type="submit" 
                    disabled={isSubmitting} 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="w-full py-4 bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 hover:from-purple-800 hover:to-purple-900 disabled:opacity-50 text-white rounded-xl font-medium shadow-md shadow-purple-600/25 text-lg block text-center cursor-pointer transition-all"
                  >
                    {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
                  </motion.button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
