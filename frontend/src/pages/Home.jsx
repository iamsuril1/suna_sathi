import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/register');
  };

  return (
    <main className="bg-gradient-to-br from-[#0B0F1A] via-[#1a1f35] to-[#0B0F1A] text-white min-h-screen overflow-x-hidden">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-24 pb-40 sm:pt-32 sm:pb-52">
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-gradient-to-l from-blue-500/15 via-indigo-500/15 to-purple-500/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 left-1/4 w-[700px] h-[700px] bg-gradient-to-t from-purple-500/10 via-indigo-500/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-8 px-6 py-3 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium tracking-wide">Premium Music Experience</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.1] tracking-tight mb-8">
              <span className="block text-white mb-2">Your Music,</span>
              <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Perfectly Timed
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
              Experience music like never before with SunaSathi's intelligent song timer.
              Set precise listening sessions, discover personalized tracks, and enjoy
              crystal-clear streaming with smart time management.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                onClick={handleGetStarted}
                className="group relative px-8 py-4 rounded-xl font-semibold text-base
                  bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
                  hover:shadow-2xl hover:shadow-purple-500/50
                  transition-all duration-300 transform hover:-translate-y-1
                  overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center gap-2">
                  Start Listening Free
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>

              <button
                className="px-8 py-4 rounded-xl font-semibold text-base
                  bg-white/5 backdrop-blur-xl border border-white/10
                  hover:bg-white/10 hover:border-white/20
                  transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                  Watch Demo
                </span>
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
                Unlimited Songs
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Smart Timer
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                Free Forever
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="relative py-32 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Why Choose
              </span>
              <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                SunaSathi?
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Discover the perfect blend of music streaming and time management in one powerful platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-indigo-500/50 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-500" />
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Smart Song Timer</h3>
                <p className="text-gray-400 leading-relaxed mb-6">
                  Set custom timers for your music sessions. Perfect for study sessions, workouts,
                  or relaxation time with automatic fade-out.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400" /><span>Custom session lengths</span></div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-400" /><span>Auto-song switching</span></div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-pink-400" /><span>Usage analytics</span></div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-purple-500/50 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-500" />
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Music Discovery</h3>
                <p className="text-gray-400 leading-relaxed mb-6">
                  Explore tracks with recommendations tailored to your taste and listening habits.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-400" /><span>Mood-based playlists</span></div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-pink-400" /><span>Time-of-day recommendations</span></div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400" /><span>Cross-genre discovery</span></div>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-pink-500/50 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-500" />
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500/20 to-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">High-Quality Audio</h3>
                <p className="text-gray-400 leading-relaxed mb-6">
                  Enjoy crystal-clear sound with customizable equalizer settings for the perfect experience.
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-pink-400" /><span>Lossless 320kbps</span></div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400" /><span>10-band equalizer</span></div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-400" /><span>Spatial audio effects</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LEGENDARY SINGERS QUOTES SECTION */}
      <section className="py-32 bg-gradient-to-b from-white/[0.02] to-transparent relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 mb-6">
              <span className="text-lg">♪</span>
              <span className="text-sm font-medium text-gray-300">Words of Legends</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Voices That Defined Music
              </span>
            </h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              Timeless wisdom from the greatest musical legends the world has ever known
            </p>
          </div>

          {/* Quotes grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                quote: "Music is the one area where I can be totally free. No one can tell me what to do.",
                name: "Freddie Mercury",
                era: "1946 – 1991 · Queen",
                gradient: "from-indigo-500/20 to-purple-500/20",
                border: "border-indigo-500/30",
                accent: "text-indigo-400",
                accentFrom: "from-indigo-400",
                initial: "F",
              },
              {
                quote: "I won't be a rock star. I will be a legend.",
                name: "Freddie Mercury",
                era: "1946 – 1991 · Queen",
                gradient: "from-purple-500/20 to-pink-500/20",
                border: "border-purple-500/30",
                accent: "text-purple-400",
                accentFrom: "from-purple-400",
                initial: "F",
              },
              {
                quote: "Singing is my passion, my first love, and the secret of my energy. Music to me is like breathing — I can't live without it.",
                name: "Kishore Kumar",
                era: "1929 – 1987 · Bollywood",
                gradient: "from-amber-500/20 to-orange-500/20",
                border: "border-amber-500/30",
                accent: "text-amber-400",
                accentFrom: "from-amber-400",
                initial: "K",
              },
              {
                quote: "I am not afraid of death. I just don't want to be there when it happens. Music keeps me alive.",
                name: "Kishore Kumar",
                era: "1929 – 1987 · Bollywood",
                gradient: "from-orange-500/20 to-yellow-500/20",
                border: "border-orange-500/30",
                accent: "text-orange-400",
                accentFrom: "from-orange-400",
                initial: "K",
              },
              {
                quote: "A song is anything that can walk by itself.",
                name: "Bob Dylan",
                era: "1941 – Present · Folk Rock",
                gradient: "from-green-500/20 to-teal-500/20",
                border: "border-green-500/30",
                accent: "text-green-400",
                accentFrom: "from-green-400",
                initial: "B",
              },
              {
                quote: "Being noticed can be a burden. Jesus got himself crucified because he got himself noticed. So I disappear a lot.",
                name: "Bob Dylan",
                era: "1941 – Present · Folk Rock",
                gradient: "from-teal-500/20 to-cyan-500/20",
                border: "border-teal-500/30",
                accent: "text-teal-400",
                accentFrom: "from-teal-400",
                initial: "B",
              },
              {
                quote: "I decided to start anew, to strip away what I had been taught.",
                name: "Michael Jackson",
                era: "1958 – 2009 · Pop",
                gradient: "from-sky-500/20 to-blue-500/20",
                border: "border-sky-500/30",
                accent: "text-sky-400",
                accentFrom: "from-sky-400",
                initial: "M",
              },
              {
                quote: "To live is to be musical, starting with the blood dancing in your veins. Everything living has a rhythm. Do you feel your music?",
                name: "Michael Jackson",
                era: "1958 – 2009 · Pop",
                gradient: "from-blue-500/20 to-indigo-500/20",
                border: "border-blue-500/30",
                accent: "text-blue-400",
                accentFrom: "from-blue-400",
                initial: "M",
              },
              {
                quote: "I was born with music inside me. Music was one of my parts, like my ribs, my liver, my kidneys.",
                name: "Ray Charles",
                era: "1930 – 2004 · Soul & Jazz",
                gradient: "from-rose-500/20 to-pink-500/20",
                border: "border-rose-500/30",
                accent: "text-rose-400",
                accentFrom: "from-rose-400",
                initial: "R",
              },
              {
                quote: "Music is my religion.",
                name: "Jimi Hendrix",
                era: "1942 – 1970 · Rock",
                gradient: "from-violet-500/20 to-purple-500/20",
                border: "border-violet-500/30",
                accent: "text-violet-400",
                accentFrom: "from-violet-400",
                initial: "J",
              },
              {
                quote: "Knowledge speaks, but wisdom listens. And the greatest wisdom is found in music.",
                name: "Jimi Hendrix",
                era: "1942 – 1970 · Rock",
                gradient: "from-fuchsia-500/20 to-pink-500/20",
                border: "border-fuchsia-500/30",
                accent: "text-fuchsia-400",
                accentFrom: "from-fuchsia-400",
                initial: "J",
              },
              {
                quote: "Music gives a soul to the universe, wings to the mind, flight to the imagination, and life to everything.",
                name: "Ray Charles",
                era: "1930 – 2004 · Soul & Jazz",
                gradient: "from-pink-500/20 to-rose-500/20",
                border: "border-pink-500/30",
                accent: "text-pink-400",
                accentFrom: "from-pink-400",
                initial: "R",
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`relative p-7 rounded-2xl bg-gradient-to-br ${item.gradient} backdrop-blur-xl border ${item.border} hover:scale-[1.02] transition-all duration-300 flex flex-col`}
              >
                {/* Quote mark */}
                <div className={`text-5xl font-serif leading-none mb-4 ${item.accent} opacity-50`}>"</div>

                {/* Quote text */}
                <p className="text-gray-200 leading-relaxed text-sm italic mb-6 flex-1">
                  {item.quote}
                </p>

                {/* Attribution */}
                <div className="flex items-center gap-3">
                  {/* Avatar initial */}
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${item.gradient} border ${item.border} flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-sm font-bold ${item.accent}`}>{item.initial}</span>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${item.accent}`}>{item.name}</p>
                    <p className="text-xs text-gray-500">{item.era}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 mb-8">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Your Music Journey Starts Here</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="block text-gray-400 mb-2">Ready for Your</span>
            <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Perfect Music Journey?
            </span>
          </h2>

          <p className="text-xl sm:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Unlimited music. Intelligent timing.{' '}
            <span className="text-white font-semibold">Zero cost.</span>
          </p>

          <button
            onClick={handleGetStarted}
            className="group relative px-10 py-5 rounded-xl font-bold text-lg
              bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
              hover:shadow-2xl hover:shadow-purple-500/50
              transition-all duration-300 transform hover:-translate-y-1"
          >
            <span className="flex items-center gap-2">
              Get Started Free Now
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
        </div>
      </section>
    </main>
  );
};

export default Home;