import { useSEO } from "../hooks/useSEO";

import { motion } from 'motion/react';
import { Target, Heart, Users, Shield } from 'lucide-react';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const values = [
  {
    icon: Heart,
    title: "Compassion First",
    description: "Every action we take is rooted in genuine care for the communities we serve, ensuring dignity and respect in all our interactions."
  },
  {
    icon: Target,
    title: "Sustainable Impact",
    description: "We don't just provide temporary relief; we build long-term solutions that empower communities to thrive independently."
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Our projects are guided by the voices and needs of the local people, fostering collaboration and mutual growth."
  },
  {
    icon: Shield,
    title: "Transparency",
    description: "We maintain complete openness in our operations and funding, ensuring every donation reaches its intended destination."
  }
];

export default function About() {
  return (
    <div className="pt-24 pb-24 min-h-screen bg-gradient-to-b from-purple-50/40 via-white to-indigo-50/30 dark:from-zinc-950 dark:via-[#130722] dark:to-zinc-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <motion.div 
          initial="initial"
          animate="animate"
          variants={stagger}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <motion.span variants={fadeIn} className="inline-block py-1 px-3.5 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-950/60 dark:to-indigo-950/60 text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 text-xs font-semibold tracking-wide mb-6">
            Our Story
          </motion.span>
          <motion.h1 variants={fadeIn} className="text-4xl md:text-6xl font-serif font-medium text-zinc-900 dark:text-zinc-50 mb-6 leading-tight">
            Empowering Lives, Inspiring Hope.
          </motion.h1>
          <motion.p variants={fadeIn} className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            HEA Foundation is a non-profit organization dedicated to alleviating poverty, providing education, and offering disaster relief. We believe in a world where everyone has access to basic necessities and the opportunity to build a better future.
          </motion.p>
        </motion.div>

        {/* Vision & Mission */}
        <div className="grid md:grid-cols-2 gap-12 mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-white/90 dark:bg-zinc-900/90 rounded-3xl p-10 shadow-sm border border-purple-100 dark:border-purple-900/40"
          >
            <h2 className="text-3xl font-serif font-medium text-zinc-900 dark:text-zinc-50 mb-4">Our Mission</h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-lg">
              To empower marginalized communities by providing essential resources, quality education, and sustainable livelihood opportunities, fostering a culture of self-reliance and resilience.
            </p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-br from-purple-700 via-indigo-600 to-purple-800 rounded-3xl p-10 shadow-xl shadow-purple-600/20 text-white"
          >
            <h2 className="text-3xl font-serif font-medium mb-4">Our Vision</h2>
            <p className="text-purple-100 leading-relaxed text-lg">
              A compassionate and equitable world where every individual, regardless of their background, can live with dignity and achieve their full potential.
            </p>
          </motion.div>
        </div>

        {/* Core Values */}
        <motion.div 
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="mb-12"
        >
          <motion.h2 variants={fadeIn} className="text-3xl font-serif font-medium text-zinc-900 dark:text-zinc-50 text-center mb-16">
            Our Core Values
          </motion.h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div 
                  key={index}
                  variants={fadeIn}
                  className="bg-white/90 dark:bg-zinc-900/90 p-8 rounded-3xl shadow-sm border border-purple-100 dark:border-purple-900/30 text-center group hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                >
                  <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform border border-purple-200/50 dark:border-purple-800/40">
                    <Icon size={30} />
                  </div>
                  <h3 className="text-xl font-medium text-zinc-900 dark:text-zinc-50 mb-3">{value.title}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
