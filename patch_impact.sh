sed -i '191,215c\
      {/* 6. OUR IMPACT */}\
      <section className="py-24 bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">\
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-100/40 via-transparent to-transparent dark:from-brand-900/10 pointer-events-none" />\
        <motion.div \
          initial="hidden"\
          whileInView="visible"\
          viewport={{ once: true }}\
          variants={staggerContainer}\
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"\
        >\
          <motion.div variants={fadeUp} className="text-center mb-16">\
            <span className="inline-block py-1 px-3 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-800 dark:text-brand-400 text-sm font-medium tracking-wide mb-4 border border-brand-200 dark:border-brand-800/50">Our Impact So Far</span>\
            <h2 className="text-3xl md:text-5xl font-serif font-semibold text-zinc-900 dark:text-zinc-50">Making a real difference</h2>\
          </motion.div>\
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">\
            {[\
              { label: "Community projects", number: stats.projects },\
              { label: "Active volunteers", number: stats.activeVolunteers },\
              { label: "Events hosted", number: stats.eventsHosted },\
              { label: "Volunteer applications", number: stats.volunteerApps },\
            ].map((stat, idx) => (\
              <motion.div key={idx} variants={fadeUp} className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col justify-center items-start transition-all hover:shadow-md hover:border-brand-200 dark:hover:border-brand-800">\
                <div className="text-4xl md:text-5xl font-semibold text-brand-600 dark:text-brand-400 mb-3">{stat.number}</div>\
                <div className="text-zinc-500 dark:text-zinc-400 font-medium">{stat.label}</div>\
              </motion.div>\
            ))}\
          </div>\
        </motion.div>\
      </section>' src/pages/Home.tsx
