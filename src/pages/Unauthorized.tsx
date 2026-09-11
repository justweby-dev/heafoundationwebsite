import { useSEO } from "../hooks/useSEO";
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { logout } from '../lib/firebase';
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function Unauthorized() {
  useSEO("Access Denied", "You do not have permission to access this page.");
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 pt-24 pb-12 text-center transition-colors">
      <ShieldAlert size={64} className="text-red-500 mb-6" />
      <h1 className="text-3xl font-serif font-medium text-zinc-900 dark:text-zinc-50 mb-4">Access Denied</h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-4 max-w-md">Your account ({user?.email || 'Unknown'}) does not have administrator privileges.</p>
      
      <div className="bg-zinc-100 dark:bg-zinc-900/50 p-6 rounded-2xl mb-8 max-w-md text-left border border-zinc-200 dark:border-zinc-800">
        <p className="text-sm text-zinc-900 dark:text-zinc-100 mb-3 font-medium">How to become an admin:</p>
        <ol className="text-sm text-zinc-600 dark:text-zinc-400 list-decimal pl-4 space-y-2 mb-4">
          <li>Open your Firebase Console.</li>
          <li>Go to the Firestore Database.</li>
          <li>Create a new document in the <code>admins</code> collection.</li>
          <li>Set the Document ID exactly to your UID below.</li>
        </ol>
        <div className="mt-2 p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl font-mono text-xs break-all text-zinc-800 dark:text-zinc-200 selection:bg-brand-100 selection:text-brand-900 dark:selection:bg-brand-900/50 dark:selection:text-brand-100">
          <strong>Your UID:</strong> <br/>
          <span className="mt-1 block text-brand-600 dark:text-brand-400 text-sm">{user?.uid || 'Not logged in'}</span>
        </div>
      </div>

      <div className="flex gap-4">
        <Link to="/" className="px-6 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl font-medium transition-colors flex items-center gap-2">
          <ArrowLeft size={18} />
          Go Home
        </Link>
        <button
          onClick={logout}
          className="px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
