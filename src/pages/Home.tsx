import { useSEO } from "../hooks/useSEO";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { ArrowRight, Heart, Users, Globe2, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
const MotionLink = motion.create(Link);

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

export default function Home() {
  const [stats, setStats] = useState(() => {
    try {
      const saved = localStorage.getItem('hea_impact_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          projects: parsed.projects || "0",
          activeVolunteers: parsed.activeVolunteers || "0",
          eventsHosted: parsed.eventsHosted || "0",
          volunteerApps: parsed.volunteerApps || "0"
        };
      }
    } catch {}
    return { 
      projects: "0", 
      activeVolunteers: "0", 
      eventsHosted: "0", 
      volunteerApps: "0" 
    };
  });

  useEffect(() => {
    let isMounted = true;
    let liveProjects = 0;
    let liveApprovedVolunteers = 0;
    let liveTotalVolunteers = 0;
    let liveEvents = 0;
    let customSettings: any = null;

    const recalculateAndSetStats = () => {
      if (!isMounted) return;

      // Check if custom overrides exist from Admin Settings
      const customProj = customSettings?.projects?.trim();
      const customActiveVol = customSettings?.activeVolunteers?.trim();
      const customEvents = customSettings?.eventsHosted?.trim();
      const customApps = customSettings?.volunteerApps?.trim();

      const projectsDisplay = customProj ? customProj : `${liveProjects}`;
      const activeVolunteersDisplay = customActiveVol ? customActiveVol : `${liveApprovedVolunteers}`;
      const eventsHostedDisplay = customEvents ? customEvents : `${liveEvents}`;
      const volunteerAppsDisplay = customApps ? customApps : `${liveTotalVolunteers}`;

      setStats({
        projects: projectsDisplay,
        activeVolunteers: activeVolunteersDisplay,
        eventsHosted: eventsHostedDisplay,
        volunteerApps: volunteerAppsDisplay
      });
    };

    // 1. Real-time listener for Settings / Impact custom configuration
    const unsubSettings = onSnapshot(
      doc(db, "settings", "impact"),
      (docSnap) => {
        if (docSnap.exists()) {
          customSettings = docSnap.data();
        } else {
          try {
            const localSaved = localStorage.getItem('hea_impact_settings');
            if (localSaved) customSettings = JSON.parse(localSaved);
          } catch {}
        }
        recalculateAndSetStats();
      },
      () => {
        try {
          const localSaved = localStorage.getItem('hea_impact_settings');
          if (localSaved) customSettings = JSON.parse(localSaved);
        } catch {}
        recalculateAndSetStats();
      }
    );

    // 2. Real-time listener for Projects collection
    const unsubProjects = onSnapshot(
      collection(db, "projects"),
      (snapshot) => {
        liveProjects = snapshot.docs.length;
        recalculateAndSetStats();
      },
      () => {
        try {
          const cached = localStorage.getItem('hea_cached_projects');
          if (cached) liveProjects = JSON.parse(cached).length || 0;
        } catch {}
        recalculateAndSetStats();
      }
    );

    // 3. Real-time listener for Volunteers collection
    const unsubVolunteers = onSnapshot(
      collection(db, "volunteers"),
      (snapshot) => {
        const items = snapshot.docs.map(d => d.data());
        liveTotalVolunteers = items.length;
        liveApprovedVolunteers = items.filter(
          d => (d.status || '').toLowerCase() === 'approved'
        ).length;
        recalculateAndSetStats();
      },
      () => {
        try {
          const cached = localStorage.getItem('hea_cached_volunteers');
          if (cached) {
            const list = JSON.parse(cached);
            liveTotalVolunteers = list.length;
            liveApprovedVolunteers = list.filter((v: any) => (v.status || '').toLowerCase() === 'approved').length;
          }
        } catch {}
        recalculateAndSetStats();
      }
    );

    // 4. Real-time listener for Events collection
    const unsubEvents = onSnapshot(
      collection(db, "events"),
      (snapshot) => {
        liveEvents = snapshot.docs.length;
        recalculateAndSetStats();
      },
      () => {
        try {
          const cached = localStorage.getItem('hea_cached_events');
          if (cached) liveEvents = JSON.parse(cached).length || 0;
        } catch {}
        recalculateAndSetStats();
      }
    );

    // 5. Local storage and cross-component update listener
    const handleLocalUpdate = () => {
      try {
        const localSaved = localStorage.getItem('hea_impact_settings');
        if (localSaved) customSettings = JSON.parse(localSaved);

        const cachedProj = localStorage.getItem('hea_cached_projects');
        if (cachedProj) liveProjects = JSON.parse(cachedProj).length;

        const cachedEvents = localStorage.getItem('hea_cached_events');
        if (cachedEvents) liveEvents = JSON.parse(cachedEvents).length;

        const cachedVol = localStorage.getItem('hea_cached_volunteers');
        if (cachedVol) {
          const list = JSON.parse(cachedVol);
          liveTotalVolunteers = list.length;
          liveApprovedVolunteers = list.filter((v: any) => (v.status || '').toLowerCase() === 'approved').length;
        }
      } catch {}
      recalculateAndSetStats();
    };

    window.addEventListener('storage', handleLocalUpdate);
    window.addEventListener('hea_stats_updated', handleLocalUpdate);

    return () => {
      isMounted = false;
      unsubSettings();
      unsubProjects();
      unsubVolunteers();
      unsubEvents();
      window.removeEventListener('storage', handleLocalUpdate);
      window.removeEventListener('hea_stats_updated', handleLocalUpdate);
    };
  }, []);
  return (
    <div className="w-full bg-white dark:bg-zinc-950 transition-colors">
      {/* 1. HERO SECTION */}
      <section className="relative h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1593113512396-193ebc54e1de?q=80&w=2000&auto=format&fit=crop" 
            alt="Community" 
            className="w-full h-full object-cover opacity-20 dark:opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/80 to-white dark:from-zinc-950/70 dark:via-zinc-950/90 dark:to-zinc-950 backdrop-blur-[2px]" />
          <div className="absolute top-0 right-0 -mr-48 -mt-48 w-96 h-96 rounded-full bg-brand-400/30 dark:bg-brand-600/20 blur-3xl mix-blend-multiply animate-pulse" />
          <div className="absolute bottom-0 left-0 -ml-48 -mb-48 w-96 h-96 rounded-full bg-amber-400/20 dark:bg-amber-600/10 blur-3xl mix-blend-multiply animate-pulse" style={{ animationDelay: "2s" }} />
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <motion.span variants={fadeUp} className="inline-block py-1 px-3 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-800 dark:text-brand-400 text-sm font-medium tracking-wide mb-6">
              Empowering Communities
            </motion.span>
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-serif font-semibold text-zinc-900 dark:text-zinc-50 mb-8 leading-[1.1] tracking-tight">
              Creating Hope.<br className="hidden md:block"/> Inspiring Change.
            </motion.h1>
            <motion.p variants={fadeUp} className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-3xl mx-auto font-light leading-relaxed">
              We are dedicated to uplifting underprivileged communities through sustainable education, health initiatives, and compassionate humanitarian action.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <MotionLink to="/donate" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 17 }} className="w-full sm:w-auto px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-full font-medium text-lg transition-colors shadow-md hover:shadow-xl flex items-center justify-center gap-2">
                Donate Now <Heart size={18} />
              </MotionLink>
              <MotionLink to="/projects" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 17 }} className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-brand-200 dark:hover:border-brand-800 hover:text-brand-600 dark:hover:text-brand-400 text-zinc-900 dark:text-zinc-50 rounded-full font-medium text-lg transition-colors hover:shadow-xl flex items-center justify-center gap-2 group">
                Explore Our Work <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </MotionLink>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 2. WHO WE ARE */}
      <section className="py-24 md:py-32 bg-white dark:bg-zinc-950">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <span className="text-brand-600 dark:text-brand-400 font-medium tracking-widest uppercase text-sm mb-4 block">Who We Are</span>
          <h2 className="text-3xl md:text-5xl font-serif font-medium text-zinc-900 dark:text-zinc-50 leading-tight mb-8">
            A foundation built on the belief that every individual deserves the opportunity to thrive.
          </h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mb-10 max-w-2xl mx-auto">
            HEA Foundation is a non-profit organization focused on driving sustainable change. We work closely with local communities to provide resources, education, and immediate relief where it is needed most.
          </p>
          <Link to="/about" className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 font-medium hover:text-brand-800 dark:hover:text-brand-300 transition-colors">
            Discover Our Story <ArrowRight size={16} />
          </Link>
        </motion.div>
      </section>

      {/* 3. OUR VISION */}
      <section className="py-32 relative bg-zinc-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <motion.img 
            initial={{ scale: 1.1 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 10, ease: "linear" }}
            src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2000&auto=format&fit=crop" 
            alt="Vision" 
            className="w-full h-full object-cover opacity-30 mix-blend-overlay"
          />
        </div>
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <span className="text-brand-400 font-medium tracking-widest uppercase text-sm mb-6 block">Our Vision</span>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif font-medium leading-tight max-w-5xl mx-auto">
            A world where poverty and inequality no longer dictate human potential.
          </h2>
        </motion.div>
      </section>

      {/* 4. OUR MISSION & 5. WHAT WE DO */}
      <section className="py-24 md:py-32 bg-zinc-50 dark:bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-brand-600 dark:text-brand-400 font-medium tracking-widest uppercase text-sm mb-4 block">Our Mission</span>
              <h2 className="text-3xl md:text-5xl font-serif font-medium text-zinc-900 dark:text-zinc-50 leading-tight mb-6">
                Equipping communities with the tools they need to build their own futures.
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                We don't just provide aid; we build sustainable systems. From funding education programs to delivering emergency relief, our mission is to stand alongside communities as they build resilience and self-reliance.
              </p>
            </motion.div>
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6"
            >
              <motion.div variants={fadeUp} className="bg-white dark:bg-zinc-950 p-8 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
                <BookOpen className="text-brand-600 dark:text-brand-400 mb-4" size={32} />
                <h3 className="font-serif text-xl font-medium mb-2 text-zinc-900 dark:text-zinc-50">Education</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">Providing access to quality learning and developmental resources.</p>
              </motion.div>
              <motion.div variants={fadeUp} className="bg-white dark:bg-zinc-950 p-8 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 mt-0 sm:mt-8">
                <Users className="text-brand-600 dark:text-brand-400 mb-4" size={32} />
                <h3 className="font-serif text-xl font-medium mb-2 text-zinc-900 dark:text-zinc-50">Community Support</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">Empowering local leaders and supporting vulnerable families.</p>
              </motion.div>
              <motion.div variants={fadeUp} className="bg-white dark:bg-zinc-950 p-8 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
                <Globe2 className="text-brand-600 dark:text-brand-400 mb-4" size={32} />
                <h3 className="font-serif text-xl font-medium mb-2 text-zinc-900 dark:text-zinc-50">Humanitarian Action</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">Immediate response and sustainable aid during crises.</p>
              </motion.div>
              <motion.div variants={fadeUp} className="bg-brand-50 dark:bg-brand-900/20 p-8 rounded-2xl border border-brand-100 dark:border-brand-800/30 mt-0 sm:mt-8 flex flex-col justify-center">
                <h3 className="font-serif text-xl font-medium mb-4 text-brand-900 dark:text-brand-100">Learn more about our core initiatives.</h3>
                <Link to="/about" className="text-brand-600 dark:text-brand-400 font-medium hover:text-brand-800 transition-colors flex items-center gap-2 text-sm">
                  Explore Initiatives <ArrowRight size={16} />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. OUR IMPACT */}
      {/* 6. OUR IMPACT */}
      <section className="py-24 bg-gradient-to-b from-purple-50/40 via-white to-indigo-50/30 dark:from-zinc-950 dark:via-[#130722] dark:to-zinc-950 relative overflow-hidden transition-colors">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/15 via-transparent to-transparent dark:from-purple-600/15 pointer-events-none" />
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
        >
          <motion.div variants={fadeUp} className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-950/70 dark:to-indigo-950/70 text-purple-900 dark:text-purple-300 text-xs font-semibold tracking-wide mb-4 border border-purple-300/60 dark:border-purple-800/60 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              Live Impact Tracker
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-semibold text-zinc-900 dark:text-zinc-50">Making a real difference</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3 max-w-xl mx-auto">
              Real-time numbers dynamically reflecting our initiatives, active volunteers, and community projects.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Community projects", number: stats.projects, note: "Initiatives added" },
              { label: "Active volunteers", number: stats.activeVolunteers, note: "Approved members" },
              { label: "Events hosted", number: stats.eventsHosted, note: "Field & charity sessions" },
              { label: "Volunteer applications", number: stats.volunteerApps, note: "Submitted applications" },
            ].map((stat, idx) => (
              <motion.div 
                key={idx} 
                variants={fadeUp} 
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative overflow-hidden rounded-3xl p-8 border transition-all group bg-white/90 dark:bg-gradient-to-br dark:from-[#1e1035]/80 dark:via-[#140b24]/90 dark:to-[#0f071a]/95 border-purple-100 dark:border-purple-900/40 hover:border-purple-400 dark:hover:border-purple-600/80 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 dark:hover:shadow-purple-950/40"
              >
                <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/10 dark:from-purple-500/25 dark:to-indigo-500/15 blur-2xl group-hover:scale-150 transition-transform pointer-events-none" />
                <div className="text-4xl md:text-5xl font-serif font-bold bg-gradient-to-r from-purple-700 via-indigo-600 to-fuchsia-600 dark:from-purple-400 dark:via-indigo-300 dark:to-fuchsia-400 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-zinc-900 dark:text-zinc-100 font-semibold text-base mb-1">{stat.label}</div>
                <div className="text-xs text-purple-600/80 dark:text-purple-400/80 font-medium">{stat.note}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
      {/* 11. VOLUNTEER & 12. DONATE */}
      <section className="py-24 md:py-32 bg-white dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-zinc-50 dark:bg-zinc-900 rounded-3xl p-10 md:p-16 flex flex-col justify-center items-start border border-zinc-100 dark:border-zinc-800"
            >
              <span className="inline-block py-1 px-3 rounded-full bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-sm font-medium tracking-wide mb-6 border border-zinc-200 dark:border-zinc-700">
                Volunteer
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-medium text-zinc-900 dark:text-zinc-50 mb-4">
                Change Starts With People Like You.
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                Join our network of dedicated volunteers. Your time and skills can make a profound difference in someone's life.
              </p>
              <MotionLink to="/volunteer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 17 }} className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-white rounded-full font-medium transition-colors block text-center inline-block">
                Become a Volunteer
              </MotionLink>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-brand-50 dark:bg-brand-900/20 rounded-3xl p-10 md:p-16 flex flex-col justify-center items-start border border-brand-100 dark:border-brand-800/30"
            >
              <span className="inline-block py-1 px-3 rounded-full bg-white dark:bg-brand-900/50 text-brand-600 dark:text-brand-400 text-sm font-medium tracking-wide mb-6 border border-brand-200 dark:border-brand-800/50">
                Donate
              </span>
              <h2 className="text-3xl md:text-4xl font-serif font-medium text-zinc-900 dark:text-zinc-50 mb-4">
                Be Part of Something Bigger.
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                Your financial support allows us to fund critical projects and reach more communities in need.
              </p>
              <MotionLink to="/donate" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 17 }} className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-full font-medium transition-colors block text-center inline-block">
                Donate via bKash / Nagad
              </MotionLink>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
