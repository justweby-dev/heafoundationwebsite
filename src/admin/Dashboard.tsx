import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { FolderKanban, Users, HandCoins, MessageSquare, Plus, ArrowRight, CheckCircle2, Clock, Sparkles, TrendingUp, AlertCircle, Eye, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ProjectItem } from './AdminProjects';
import { INITIAL_DONATIONS, DonationItem } from './AdminDonations';

export default function Dashboard() {
  const [stats, setStats] = useState({
    projects: 0,
    events: 0,
    volunteers: 0,
    pendingVolunteers: 0,
    donationsTotal: 0,
    pendingDonations: 0,
    messages: 0,
    unreadMessages: 0,
  });
  const [recentVolunteers, setRecentVolunteers] = useState<any[]>([]);
  const [recentDonations, setRecentDonations] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // 1. Live Projects listener
    const unsubProjects = onSnapshot(collection(db, 'projects'), (snap) => {
      const pCount = snap.docs.length;
      setStats(prev => ({ ...prev, projects: pCount }));
    }, () => {
      try {
        const cached = localStorage.getItem('hea_cached_projects');
        if (cached) setStats(prev => ({ ...prev, projects: JSON.parse(cached).length }));
      } catch {}
    });

    // 2. Live Events listener
    const unsubEvents = onSnapshot(collection(db, 'events'), (snap) => {
      const eCount = snap.docs.length;
      setStats(prev => ({ ...prev, events: eCount }));
    }, () => {
      try {
        const cached = localStorage.getItem('hea_cached_events');
        if (cached) setStats(prev => ({ ...prev, events: JSON.parse(cached).length }));
      } catch {}
    });

    // 3. Live Volunteers listener
    const unsubVolunteers = onSnapshot(collection(db, 'volunteers'), (snap) => {
      let volList = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      volList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setRecentVolunteers(volList.slice(0, 5));
      const pendingCount = volList.filter(v => (v.status || '').toLowerCase() === 'pending').length;
      setStats(prev => ({
        ...prev,
        volunteers: volList.length,
        pendingVolunteers: pendingCount
      }));
      setLoading(false);
    }, () => {
      try {
        const cached = localStorage.getItem('hea_cached_volunteers');
        if (cached) {
          const list = JSON.parse(cached);
          list.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
          setRecentVolunteers(list.slice(0, 5));
          const pendingCount = list.filter((v: any) => (v.status || '').toLowerCase() === 'pending').length;
          setStats(prev => ({ ...prev, volunteers: list.length, pendingVolunteers: pendingCount }));
        }
      } catch {}
      setLoading(false);
    });

    // 4. Live Donations listener
    const unsubDonations = onSnapshot(collection(db, 'donations'), (snap) => {
      let donList: DonationItem[] = [];
      if (!snap.empty) {
        donList = snap.docs.map(d => ({ id: d.id, ...d.data() } as DonationItem));
      } else {
        const cached = localStorage.getItem('hea_cached_donations');
        donList = cached ? JSON.parse(cached) : INITIAL_DONATIONS;
      }
      donList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setRecentDonations(donList.slice(0, 5));
      const verifiedTotal = donList
        .filter(d => d.status === 'Approved')
        .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      const pendingDon = donList.filter(d => d.status === 'Pending').length;
      setStats(prev => ({
        ...prev,
        donationsTotal: verifiedTotal,
        pendingDonations: pendingDon
      }));
    }, () => {
      const cached = localStorage.getItem('hea_cached_donations');
      const donList: DonationItem[] = cached ? JSON.parse(cached) : INITIAL_DONATIONS;
      donList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setRecentDonations(donList.slice(0, 5));
      const verifiedTotal = donList
        .filter(d => d.status === 'Approved')
        .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      const pendingDon = donList.filter(d => d.status === 'Pending').length;
      setStats(prev => ({ ...prev, donationsTotal: verifiedTotal, pendingDonations: pendingDon }));
    });

    // 5. Live Messages listener
    const unsubMessages = onSnapshot(collection(db, 'messages'), (snap) => {
      const msgList = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const unreadCount = msgList.filter(m => !m.isRead).length;
      setStats(prev => ({
        ...prev,
        messages: msgList.length,
        unreadMessages: unreadCount
      }));
    }, () => {});

    const handleLocalUpdate = () => {
      try {
        const cachedP = localStorage.getItem('hea_cached_projects');
        if (cachedP) setStats(prev => ({ ...prev, projects: JSON.parse(cachedP).length }));
        const cachedE = localStorage.getItem('hea_cached_events');
        if (cachedE) setStats(prev => ({ ...prev, events: JSON.parse(cachedE).length }));
        const cachedV = localStorage.getItem('hea_cached_volunteers');
        if (cachedV) {
          const list = JSON.parse(cachedV);
          setStats(prev => ({
            ...prev,
            volunteers: list.length,
            pendingVolunteers: list.filter((v: any) => (v.status || '').toLowerCase() === 'pending').length
          }));
        }
      } catch {}
    };

    window.addEventListener('storage', handleLocalUpdate);
    window.addEventListener('hea_stats_updated', handleLocalUpdate);

    return () => {
      active = false;
      unsubProjects();
      unsubEvents();
      unsubVolunteers();
      unsubDonations();
      unsubMessages();
      window.removeEventListener('storage', handleLocalUpdate);
      window.removeEventListener('hea_stats_updated', handleLocalUpdate);
    };
  }, []);

  const handleApproveDonation = async (id: string) => {
    try {
      try {
        await updateDoc(doc(db, 'donations', id), { status: 'Approved' });
      } catch (e) {
        // Fallback
      }
      setRecentDonations(prev => prev.map(d => d.id === id ? { ...d, status: 'Approved' } : d));
      const cached = localStorage.getItem('hea_cached_donations');
      if (cached) {
        const parsed = JSON.parse(cached).map((d: any) => d.id === id ? { ...d, status: 'Approved' } : d);
        localStorage.setItem('hea_cached_donations', JSON.stringify(parsed));
      }
    } catch (err) {
      console.error("Error approving donation", err);
    }
  };

  const handleUpdateVolunteer = async (id: string, status: string) => {
    try {
      try {
        await updateDoc(doc(db, 'volunteers', id), { status });
      } catch (e) {
        // Fallback
      }
      setRecentVolunteers(prev => prev.map(v => v.id === id ? { ...v, status } : v));
    } catch (err) {
      console.error("Error updating volunteer", err);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading admin dashboard..." />;
  }

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              Live Real-Time Sync Active
            </span>
            <span className="text-xs text-zinc-400">HEA Foundation Management</span>
          </div>
          <h1 className="text-3xl font-serif font-medium text-zinc-900 dark:text-zinc-50">
            Executive Overview
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            to="/admin/events" 
            className="px-4 py-2 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <CalendarDays size={15} /> Hosted Events ({stats.events})
          </Link>
          <Link 
            to="/admin/settings" 
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-2xl text-xs font-semibold transition-colors"
          >
            System Settings
          </Link>
        </div>
      </div>

      {/* 5 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Projects */}
        <Link to="/admin/projects" className="bg-white dark:bg-zinc-900 p-5 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:border-purple-400 dark:hover:border-purple-600 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Community Projects</span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FolderKanban size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold font-serif text-zinc-900 dark:text-zinc-50 mb-1">{stats.projects}</p>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1 font-medium">
            Manage campaigns <ArrowRight size={12} />
          </p>
        </Link>

        {/* Events */}
        <Link to="/admin/events" className="bg-white dark:bg-zinc-900 p-5 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:border-purple-400 dark:hover:border-purple-600 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Hosted Events</span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarDays size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold font-serif text-zinc-900 dark:text-zinc-50 mb-1">{stats.events}</p>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 flex items-center gap-1 font-medium">
            Manage hosted events <ArrowRight size={12} />
          </p>
        </Link>

        {/* Volunteers */}
        <Link to="/admin/volunteers" className="bg-white dark:bg-zinc-900 p-5 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:border-purple-400 dark:hover:border-purple-600 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Volunteers</span>
            <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold font-serif text-zinc-900 dark:text-zinc-50 mb-1">{stats.volunteers}</p>
          <p className="text-[11px] text-brand-600 dark:text-brand-400 flex items-center gap-1 font-medium">
            {stats.pendingVolunteers} pending review <ArrowRight size={12} />
          </p>
        </Link>

        {/* Donations */}
        <Link to="/admin/donations" className="bg-white dark:bg-zinc-900 p-5 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:border-purple-400 dark:hover:border-purple-600 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Verified Donations</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <HandCoins size={18} />
            </div>
          </div>
          <p className="text-2xl font-bold font-serif text-zinc-900 dark:text-zinc-50 mb-1">
            ৳{stats.donationsTotal.toLocaleString()}
          </p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
            {stats.pendingDonations} pending <ArrowRight size={12} />
          </p>
        </Link>

        {/* Messages */}
        <Link to="/admin/messages" className="bg-white dark:bg-zinc-900 p-5 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:border-purple-400 dark:hover:border-purple-600 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Messages</span>
            <div className="w-9 h-9 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare size={18} />
            </div>
          </div>
          <p className="text-3xl font-bold font-serif text-zinc-900 dark:text-zinc-50 mb-1">{stats.messages}</p>
          <p className="text-[11px] text-fuchsia-600 dark:text-fuchsia-400 flex items-center gap-1 font-medium">
            {stats.unreadMessages} unread <ArrowRight size={12} />
          </p>
        </Link>
      </div>

      {/* Quick Action Navigation Bar - Styled with Image 1 signature purple-indigo gradient */}
      <div className="bg-gradient-to-r from-[#2c0850] via-[#1a124c] to-[#250a44] border border-purple-800/40 text-white rounded-3xl p-6 shadow-xl shadow-purple-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
            <Sparkles size={13} className="text-purple-300" />
            Quick Administrator Actions
          </span>
          <h2 className="text-xl font-serif font-semibold mt-1 text-white">Direct Operations Center</h2>
          <p className="text-xs text-purple-200/80 mt-1 max-w-lg">
            Create initiatives, register hosted events, curate gallery photos, review applications, and confirm bKash & Nagad donation receipts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 relative z-10">
          <Link
            to="/admin/projects"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-xs font-medium text-white transition-colors flex items-center gap-1.5 border border-white/10"
          >
            <Plus size={14} /> New Project
          </Link>
          <Link
            to="/admin/events"
            className="px-4 py-2 bg-purple-500/30 hover:bg-purple-500/40 text-purple-200 border border-purple-400/30 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <Plus size={14} /> Add Event
          </Link>
          <Link
            to="/admin/gallery"
            className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-xs font-medium text-white transition-colors flex items-center gap-1.5 border border-white/10"
          >
            <Plus size={14} /> Add Photo
          </Link>
          <Link
            to="/admin/donations"
            className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <HandCoins size={14} /> Verify Donations
          </Link>
        </div>
      </div>

      {/* Split Section: Recent Donations & Recent Volunteers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Donations Verification Panel */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-serif font-semibold text-lg text-zinc-900 dark:text-zinc-50">Recent Donations</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">bKash & Nagad transfer verification queue</p>
            </div>
            <Link to="/admin/donations" className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {recentDonations.map((d) => {
              const isNagad = ((d as any).method || '').toLowerCase().includes('nagad');
              const isBkash = ((d as any).method || 'bkash').toLowerCase().includes('bkash');
              return (
                <div
                  key={d.id}
                  className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{d.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        isNagad
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : isBkash
                          ? 'bg-pink-500/15 text-pink-600 dark:text-pink-400'
                          : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                      }`}>
                        {(d as any).method || 'bKash'}
                      </span>
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                        {d.transactionId}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {d.phone} • {d.purpose || 'General Fund'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-serif font-bold text-sm text-zinc-900 dark:text-zinc-50">
                      ৳{Number(d.amount).toLocaleString()}
                    </span>
                    {d.status === 'Pending' ? (
                      <button
                        onClick={() => d.id && handleApproveDonation(d.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        Verify
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 rounded-full">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {recentDonations.length === 0 && (
              <p className="text-xs text-zinc-400 py-6 text-center">No donations recorded yet.</p>
            )}
          </div>
        </div>

        {/* Recent Volunteers Queue */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-serif font-semibold text-lg text-zinc-900 dark:text-zinc-50">Volunteer Applications</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Incoming join requests and reviews</p>
            </div>
            <Link to="/admin/volunteers" className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {recentVolunteers.map((vol) => (
              <div
                key={vol.id}
                className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{vol.name}</p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {vol.email} • {vol.phone}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={vol.status || 'Pending'}
                    onChange={(e) => handleUpdateVolunteer(vol.id, e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
            ))}

            {recentVolunteers.length === 0 && (
              <div className="py-6 text-center text-xs text-zinc-400">
                <p>No volunteer applications received yet.</p>
                <Link to="/volunteer" className="text-brand-600 dark:text-brand-400 underline mt-1 inline-block">
                  Test submit a volunteer application
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
