import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Settings, Shield, KeyRound, Check, RefreshCw, Building2, Phone, Mail, MapPin, Database, CheckCircle2, BarChart3, Sparkles } from 'lucide-react';
import { DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_EMAIL } from '../store/authStore';
import { DEFAULT_PROJECTS } from './AdminProjects';
import { DEFAULT_GALLERY_ITEMS } from './AdminGallery';

export function AdminSettings() {
  const [orgName, setOrgName] = useState('HEA Foundation');
  const [tagline, setTagline] = useState('A registered non-profit charitable organization');
  const [officialEmail, setOfficialEmail] = useState('heafoundationofficial@gmail.com');
  const [officialPhone, setOfficialPhone] = useState('+880 1915 648 432');
  const [bkashNumber, setBkashNumber] = useState('01915648432');

  // Impact Statistics Counters (Homepage)
  const [impactProjects, setImpactProjects] = useState('4+');
  const [impactVolunteers, setImpactVolunteers] = useState('25+');
  const [impactEvents, setImpactEvents] = useState('12+');
  const [impactVolunteerApps, setImpactVolunteerApps] = useState('40+');
  const [impactSaved, setImpactSaved] = useState(false);
  
  // Security
  const [currentPass, setCurrentPass] = useState(
    localStorage.getItem('hea_custom_admin_password') || DEFAULT_ADMIN_PASSWORD
  );
  const [newPass, setNewPass] = useState('');
  const [passSaved, setPassSaved] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  useEffect(() => {
    // Check saved settings
    try {
      const saved = localStorage.getItem('hea_org_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.orgName) setOrgName(parsed.orgName);
        if (parsed.tagline) setTagline(parsed.tagline);
        if (parsed.officialEmail) setOfficialEmail(parsed.officialEmail);
        if (parsed.officialPhone) setOfficialPhone(parsed.officialPhone);
        if (parsed.bkashNumber) setBkashNumber(parsed.bkashNumber);
      }
    } catch (e) {
      // Ignore
    }

    // Load impact statistics from Firestore or localStorage
    async function loadImpactStats() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'impact'));
        if (snap.exists()) {
          const data = snap.data();
          if (data.projects) setImpactProjects(data.projects);
          if (data.activeVolunteers) setImpactVolunteers(data.activeVolunteers);
          if (data.eventsHosted) setImpactEvents(data.eventsHosted);
          if (data.volunteerApps) setImpactVolunteerApps(data.volunteerApps);
        } else {
          const savedImpact = localStorage.getItem('hea_impact_settings');
          if (savedImpact) {
            const parsed = JSON.parse(savedImpact);
            if (parsed.projects) setImpactProjects(parsed.projects);
            if (parsed.activeVolunteers) setImpactVolunteers(parsed.activeVolunteers);
            if (parsed.eventsHosted) setImpactEvents(parsed.eventsHosted);
            if (parsed.volunteerApps) setImpactVolunteerApps(parsed.volunteerApps);
          }
        }
      } catch (err) {
        const savedImpact = localStorage.getItem('hea_impact_settings');
        if (savedImpact) {
          const parsed = JSON.parse(savedImpact);
          if (parsed.projects) setImpactProjects(parsed.projects);
          if (parsed.activeVolunteers) setImpactVolunteers(parsed.activeVolunteers);
          if (parsed.eventsHosted) setImpactEvents(parsed.eventsHosted);
          if (parsed.volunteerApps) setImpactVolunteerApps(parsed.volunteerApps);
        }
      }
    }
    loadImpactStats();
  }, []);

  const handleSaveImpactStats = async (e: React.FormEvent) => {
    e.preventDefault();
    const statsPayload = {
      projects: impactProjects,
      activeVolunteers: impactVolunteers,
      eventsHosted: impactEvents,
      volunteerApps: impactVolunteerApps,
      updatedAt: Date.now()
    };

    localStorage.setItem('hea_impact_settings', JSON.stringify(statsPayload));
    window.dispatchEvent(new CustomEvent('hea_stats_updated'));

    try {
      await setDoc(doc(db, 'settings', 'impact'), statsPayload);
    } catch (err) {
      console.warn("Saved impact stats to local storage fallback", err);
    }

    setImpactSaved(true);
    setTimeout(() => setImpactSaved(false), 2500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const settings = {
      orgName,
      tagline,
      officialEmail,
      officialPhone,
      bkashNumber,
      updatedAt: Date.now()
    };
    localStorage.setItem('hea_org_settings', JSON.stringify(settings));
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass || newPass.trim().length < 4) {
      alert("Password must be at least 4 characters long");
      return;
    }
    const clean = newPass.trim();
    localStorage.setItem('hea_custom_admin_password', clean);
    setCurrentPass(clean);
    setNewPass('');
    setPassSaved(true);
    setTimeout(() => setPassSaved(false), 3000);
  };

  const handleResetPassword = () => {
    localStorage.removeItem('hea_custom_admin_password');
    setCurrentPass(DEFAULT_ADMIN_PASSWORD);
    setPassSaved(true);
    setTimeout(() => setPassSaved(false), 2000);
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      localStorage.setItem('hea_cached_projects', JSON.stringify(DEFAULT_PROJECTS));
      localStorage.setItem('hea_cached_gallery', JSON.stringify(DEFAULT_GALLERY_ITEMS));
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch (err) {
      console.error("Error seeding sample data:", err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-medium text-zinc-900 dark:text-zinc-50">Foundation Settings</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Configure organization identity, bKash donation channels, and security keys.
        </p>
      </div>

      {/* Security & Password Manager */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-lg font-serif font-semibold text-zinc-900 dark:text-zinc-50">
              Admin Password & Authentication
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Master credentials for logging into this administrator portal.
            </p>
          </div>
        </div>

        {/* Current Active Password Box */}
        <div className="bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 rounded-2xl p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-brand-900 dark:text-brand-300 mb-1">
                Active Admin Master Password
              </p>
              <p className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-wider">
                {currentPass}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Associated Email: <span className="font-mono text-zinc-700 dark:text-zinc-300">{DEFAULT_ADMIN_EMAIL}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(currentPass);
                  alert("Password copied to clipboard: " + currentPass);
                }}
                className="px-3 py-1.5 bg-white dark:bg-zinc-900 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 rounded-lg text-xs font-medium hover:bg-brand-50"
              >
                Copy Password
              </button>
              {currentPass !== DEFAULT_ADMIN_PASSWORD && (
                <button
                  type="button"
                  onClick={handleResetPassword}
                  className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg text-xs font-medium hover:bg-zinc-200"
                >
                  Reset to Default
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Change Master Password
            </label>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md">
              <div className="relative flex-1">
                <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Enter new password (e.g. hea2026!)"
                  className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-medium transition-colors shadow-sm whitespace-nowrap"
              >
                Update Password
              </button>
            </div>
          </div>
          {passSaved && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Password updated successfully!
            </p>
          )}
        </form>
      </div>

      {/* Organization Profile Settings */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
            <Building2 size={20} />
          </div>
          <div>
            <h2 className="text-lg font-serif font-semibold text-zinc-900 dark:text-zinc-50">
              Organization & Contact Profile
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Details displayed across footer, donation forms, and legal pages.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-sm max-w-2xl">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Official Foundation Name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Legal Status / Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={officialEmail}
                onChange={(e) => setOfficialEmail(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Official Phone Number
              </label>
              <input
                type="text"
                value={officialPhone}
                onChange={(e) => setOfficialPhone(e.target.value)}
                className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Official Mobile Banking Number (bKash & Nagad)
            </label>
            <input
              type="text"
              value={bkashNumber}
              onChange={(e) => setBkashNumber(e.target.value)}
              className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm font-mono"
            />
            <p className="text-[11px] text-zinc-400 mt-1">This number is displayed for both bKash and Nagad transfers on the /donate page.</p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-medium shadow-sm transition-colors"
            >
              Save Organization Profile
            </button>
            {profileSaved && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check size={14} /> Profile settings saved!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Impact Statistics & Counters (Homepage) */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <BarChart3 size={20} />
          </div>
          <div>
            <h2 className="text-lg font-serif font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              "Our Impact So Far" Counters
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Auto-Sync
              </span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Control the four highlight numbers displayed in the homepage impact section. These sync to visitors in real time.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveImpactStats} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                1. Community Projects
              </label>
              <input
                type="text"
                value={impactProjects}
                onChange={(e) => setImpactProjects(e.target.value)}
                placeholder="e.g. 4+"
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-base font-semibold text-brand-600 dark:text-brand-400 outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[11px] text-zinc-400 mt-1">Default auto-tracks total projects</p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                2. Active Volunteers
              </label>
              <input
                type="text"
                value={impactVolunteers}
                onChange={(e) => setImpactVolunteers(e.target.value)}
                placeholder="e.g. 25+"
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-base font-semibold text-brand-600 dark:text-brand-400 outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[11px] text-zinc-400 mt-1">Increments as volunteers get approved</p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                3. Events Hosted
              </label>
              <input
                type="text"
                value={impactEvents}
                onChange={(e) => setImpactEvents(e.target.value)}
                placeholder="e.g. 12+"
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-base font-semibold text-brand-600 dark:text-brand-400 outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[11px] text-zinc-400 mt-1">Field distributions & camps hosted</p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/60">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                4. Volunteer Applications
              </label>
              <input
                type="text"
                value={impactVolunteerApps}
                onChange={(e) => setImpactVolunteerApps(e.target.value)}
                placeholder="e.g. 40+"
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-base font-semibold text-brand-600 dark:text-brand-400 outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[11px] text-zinc-400 mt-1">Updates live whenever a form is submitted</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-medium shadow-sm transition-colors"
            >
              Update Impact Numbers
            </button>
            {impactSaved && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check size={14} /> Impact statistics saved and synced to live Homepage!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Database & Sample Content Reset */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Database size={20} />
          </div>
          <div>
            <h2 className="text-lg font-serif font-semibold text-zinc-900 dark:text-zinc-50">
              Content Sync & Initial Data
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Restore sample projects and gallery photos if empty.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-md">
            Clicking reset will ensure the 4 flagship community initiatives and 6 high-resolution field photos are populated across the site.
          </p>
          <button
            onClick={handleSeedData}
            disabled={seeding}
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-medium transition-colors shrink-0"
          >
            <RefreshCw size={14} className={seeding ? 'animate-spin' : ''} />
            <span>{seeding ? 'Syncing...' : 'Sync Default Content'}</span>
          </button>
        </div>
        {seedSuccess && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-3 flex items-center gap-1.5">
            <Check size={14} /> Sample projects & gallery photos synced successfully!
          </p>
        )}
      </div>
    </div>
  );
}
