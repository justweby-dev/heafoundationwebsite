import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { useAuthStore } from './store/authStore';
import './store/themeStore'; // Initialize theme

// Public Pages
import Home from './pages/Home';
import About from './pages/About';
import Projects from './pages/Projects';
import Gallery from './pages/Gallery';
import Volunteer from './pages/Volunteer';
import Donate from './pages/Donate';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingScreen } from './components/LoadingScreen';

// Admin Pages
import { AdminLayout } from './admin/AdminLayout';
import Dashboard from './admin/Dashboard';
import { AdminProjects } from './admin/AdminProjects';
import { AdminEvents } from './admin/AdminEvents';
import { AdminGallery } from './admin/AdminGallery';
import { AdminVolunteers } from './admin/AdminVolunteers';
import { AdminDonations } from './admin/AdminDonations';
import { AdminMessages } from './admin/AdminMessages';
import { AdminSettings } from './admin/AdminSettings';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const { checkAuth } = useAuthStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="flex flex-col min-h-screen bg-white/70 dark:bg-zinc-950/70 text-zinc-900 dark:text-zinc-50 font-sans transition-colors duration-300 relative">
      <LoadingScreen minDuration={850} />
      {/* Dynamic Animated Energy Background */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-energy-mesh animate-aurora">
        {/* Floating radiant ambient lights */}
        <div className="absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-brand-600/35 via-fuchsia-600/30 to-brand-400/25 blur-[130px] animate-float-slow" />
        <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-pink-500/30 via-purple-600/25 to-cyan-500/20 blur-[130px] animate-float-reverse" />
        <div className="absolute -bottom-32 left-1/4 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-amber-500/25 via-brand-600/25 to-emerald-500/20 blur-[140px] animate-pulse-energy" />
        <div className="absolute top-1/2 left-1/3 w-[450px] h-[450px] rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-600/20 blur-[120px] animate-float-slow" />
        
        {/* Tech grid & constellation dot pattern */}
        <div className="absolute inset-0 bg-dot-pattern opacity-60 dark:opacity-45 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <ScrollToTop />
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/volunteer" element={<Volunteer />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="gallery" element={<AdminGallery />} />
            <Route path="volunteers" element={<AdminVolunteers />} />
            <Route path="donations" element={<AdminDonations />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
