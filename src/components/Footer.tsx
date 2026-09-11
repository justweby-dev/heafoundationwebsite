import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, MapPin, Phone, ArrowRight } from 'lucide-react';
import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { HeaLogo } from './HeaLogo';

export function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      await addDoc(collection(db, 'newsletter'), {
        email,
        createdAt: Date.now()
      });
      setStatus('success');
      setEmail('');
    } catch (error) {
      console.error('Error subscribing:', error);
      setStatus('error');
    }
  };

  return (
    <footer className="bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 pt-16 pb-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12">
          
          <div className="md:col-span-4">
            <Link to="/" className="flex items-center gap-3 mb-4 group">
              <HeaLogo size={38} className="group-hover:scale-105 transition-transform" />
              <span className="font-serif font-semibold text-xl text-zinc-900 dark:text-zinc-50">
                HEA Foundation
              </span>
            </Link>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-6">
              A registered non-profit charitable organization dedicated to creating hope and inspiring change in communities worldwide through sustainable projects and humanitarian action.
            </p>
            <div className="flex items-center gap-4 text-zinc-400 dark:text-zinc-500">
              <a href="https://www.facebook.com/share/1DYZ4GP8XX/?mibextid=wwXIfr" target="_blank" rel="noreferrer" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"><Facebook size={20} /></a>
              <a href="https://www.instagram.com/hea.foundation.official" target="_blank" rel="noreferrer" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"><Instagram size={20} /></a>
            </div>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-serif font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Links</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">About Us</Link></li>
              <li><Link to="/projects" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Our Projects</Link></li>
              <li><Link to="/gallery" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Gallery</Link></li>
              <li><Link to="/volunteer" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Volunteer</Link></li>
              <li><Link to="/donate" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Donate</Link></li>
              <li><Link to="/admin" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Admin Login</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-serif font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><Link to="/privacy" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Terms of Service</Link></li>
              <li><a href="#" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Cookie Policy</a></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h3 className="font-serif font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Newsletter</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Subscribe to get the latest news and updates from our projects.
            </p>
            <form onSubmit={handleSubscribe} className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full pl-4 pr-12 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-zinc-900 dark:text-zinc-50"
                disabled={status === 'loading' || status === 'success'}
              />
              <button
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-brand-600 hover:bg-brand-700 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <ArrowRight size={16} />
              </button>
            </form>
            {status === 'success' && <p className="text-xs text-green-600 dark:text-green-400 mt-2">Thank you for subscribing!</p>}
            {status === 'error' && <p className="text-xs text-red-600 dark:text-red-400 mt-2">An error occurred. Please try again.</p>}
          </div>

        </div>

        <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            © {new Date().getFullYear()} HEA Foundation. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="mailto:heafoundationofficial@gmail.com" className="text-zinc-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-2 text-xs">
              <Mail size={14} /> heafoundationofficial@gmail.com
            </a>
            <span className="text-zinc-400 flex items-center gap-2 text-xs">
              <Phone size={14} /> +880 1915 648 432
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
