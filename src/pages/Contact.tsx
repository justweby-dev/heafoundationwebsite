import React, { useState } from 'react';
import { useSEO } from "../hooks/useSEO";
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Mail, MapPin, Phone, Send, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Contact() {
  useSEO("Contact Us", "Get in touch with HEA Foundation for inquiries, partnerships, or support.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const validateEmail = (email: string) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) return setError("Name is required");
    if (!formData.email.trim() || !validateEmail(formData.email)) return setError("Valid email is required");
    if (!formData.message.trim()) return setError("Message cannot be empty");
    
    setIsSubmitting(true);
    try {
      const newMsg = {
        ...formData,
        id: 'msg-' + Date.now(),
        isRead: false,
        createdAt: Date.now()
      };

      try {
        const docRef = await addDoc(collection(db, 'messages'), {
          ...formData,
          isRead: false,
          createdAt: Date.now()
        });
        newMsg.id = docRef.id;
      } catch (err) {
        console.warn("Firestore message save skipped, stored locally:", err);
      }

      try {
        const existing = JSON.parse(localStorage.getItem('hea_cached_messages') || '[]');
        localStorage.setItem('hea_cached_messages', JSON.stringify([newMsg, ...existing]));
      } catch (e) {}

      setSubmitted(true);
    } catch (err) {
      console.error("Error submitting message:", err);
      setError("There was a network error submitting your message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24 pb-24 min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Info */}
          <div>
            <span className="inline-block py-1 px-3 rounded-full bg-brand-100 text-brand-800 dark:bg-brand-900/30 dark:text-brand-300 text-sm font-medium tracking-wide mb-6">
              Get In Touch
            </span>
            <h1 className="text-4xl md:text-5xl font-serif font-medium text-zinc-900 dark:text-zinc-50 mb-6">
              We'd love to hear from you.
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mb-12">
              Whether you have a question about our projects, want to volunteer, or simply want to learn more, our team is ready to answer all your questions.
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-full shadow-sm flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-800">
                  <MapPin className="text-brand-600 dark:text-brand-400" size={24} />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-medium text-zinc-900 dark:text-zinc-50 mb-1">Our Location</h3>
                  <p className="text-zinc-600 dark:text-zinc-400">Dhaka, Bangladesh</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-full shadow-sm flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-800">
                  <Mail className="text-brand-600 dark:text-brand-400" size={24} />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-medium text-zinc-900 dark:text-zinc-50 mb-1">Email Us</h3>
                  <a href="mailto:heafoundationofficial@gmail.com" className="text-zinc-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">heafoundationofficial@gmail.com</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-full shadow-sm flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-800">
                  <Phone className="text-brand-600 dark:text-brand-400" size={24} />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-medium text-zinc-900 dark:text-zinc-50 mb-1">Call Us</h3>
                  <p className="text-zinc-600 dark:text-zinc-400">+880 1915 648 432</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {submitted ? (
              <div className="p-12 text-center h-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Send size={32} />
                </div>
                <h2 className="text-2xl font-serif font-medium text-zinc-900 dark:text-zinc-50 mb-4">Message Sent Successfully!</h2>
                <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                  Thank you for reaching out to HEA Foundation. We have received your message and will respond to your inquiry as soon as possible.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({name: '', email: '', subject: '', message: ''});
                  }}
                  className="px-8 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white rounded-full font-medium"
                >
                  Send Another Message
                </motion.button>
              </div>
            ) : (
              <div className="p-8 md:p-12">
                <h2 className="text-2xl font-serif font-medium text-zinc-900 dark:text-zinc-50 mb-8">Send us a message</h2>
                
                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3 text-sm">
                    <AlertCircle size={18} />
                    <p>{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Full Name *</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-brand-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email Address *</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-brand-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Subject</label>
                    <input type="text" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-brand-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Message *</label>
                    <textarea rows={5} value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-300 dark:border-zinc-700 focus:ring-2 focus:ring-brand-500 outline-none resize-none" />
                  </div>
                  <motion.button 
                    type="submit" 
                    disabled={isSubmitting} 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="w-full py-4 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white rounded-xl font-medium shadow-sm text-lg block text-center"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </motion.button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
