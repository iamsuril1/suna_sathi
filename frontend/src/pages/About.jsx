import { Music2, Users, Target, Award, Heart, Zap } from "lucide-react";

export default function About() {
  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-gradient-to-l from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 mb-8">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">About SunaSathi</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight mb-8">
              <span className="block text-white mb-2">Your Music,</span>
              <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Perfectly Timed
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-400 leading-relaxed">
              SunaSathi is revolutionizing the way people experience music with intelligent 
              timing features and seamless streaming.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mission */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-indigo-400" />
              </div>
              <h2 className="text-3xl font-bold mb-4 text-white">Our Mission</h2>
              <p className="text-gray-400 leading-relaxed">
                To empower music lovers with intelligent tools that enhance their listening 
                experience. We believe music should adapt to your life, not the other way around. 
                Our mission is to create the perfect soundtrack for every moment of your day.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6">
                <Award className="w-7 h-7 text-purple-400" />
              </div>
              <h2 className="text-3xl font-bold mb-4 text-white">Our Vision</h2>
              <p className="text-gray-400 leading-relaxed">
                To become the world's leading music platform that seamlessly integrates into 
                users' daily routines. We envision a future where music timing is as natural 
                as breathing, helping millions achieve focus, relaxation, and joy through sound.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Our Core Values
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Heart className="w-7 h-7 text-indigo-400" />,
                title: "User-Centric",
                description: "Every feature is designed with our users in mind. Your experience is our priority."
              },
              {
                icon: <Zap className="w-7 h-7 text-purple-400" />,
                title: "Innovation",
                description: "We constantly push boundaries to bring you cutting-edge music technology."
              },
              {
                icon: <Music2 className="w-7 h-7 text-pink-400" />,
                title: "Quality",
                description: "From audio quality to user interface, we never compromise on excellence."
              },
              {
                icon: <Users className="w-7 h-7 text-indigo-400" />,
                title: "Community",
                description: "We're building a global community of music lovers who inspire each other."
              },
              {
                icon: <Target className="w-7 h-7 text-purple-400" />,
                title: "Accessibility",
                description: "Premium music experiences should be available to everyone, everywhere."
              },
              {
                icon: <Award className="w-7 h-7 text-pink-400" />,
                title: "Integrity",
                description: "We operate with transparency and respect for artists, users, and partners."
              },
            ].map((value, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-indigo-500/50 transition-all group">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{value.title}</h3>
                <p className="text-gray-400 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 sm:p-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-white">Our Story</h2>
            <div className="space-y-4 text-gray-400 leading-relaxed">
              <p>
                SunaSathi was born from a simple observation: people struggle to manage their 
                music listening time effectively. Whether it's falling asleep to music, timing 
                study sessions, or managing workout playlists, traditional music players lack 
                intelligent timing features.
              </p>
              <p>
                Founded in 2024 in Pātan, Nepal, our team of music enthusiasts and tech innovators 
                came together to solve this problem. We built SunaSathi to be more than just another 
                music streaming service—it's your intelligent music companion.
              </p>
              <p>
                Today, we serve over 2 million users across 180+ countries, helping them create 
                the perfect soundtrack for every moment of their lives. From students using our 
                timer for focused study sessions to fitness enthusiasts timing their workouts, 
                SunaSathi has become an essential part of daily routines worldwide.
              </p>
              <p className="text-white font-medium">
                We're just getting started. Join us on this journey to redefine music streaming.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: "2M+", label: "Active Users" },
              { num: "50M+", label: "Songs Available" },
              { num: "100M+", label: "Hours Streamed" },
              { num: "180+", label: "Countries" }
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform">
                  {stat.num}
                </div>
                <p className="text-gray-400 font-medium text-sm uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-t from-indigo-500/10 via-transparent to-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            <span className="block text-white mb-2">Ready to Experience</span>
            <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              The Future of Music?
            </span>
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join millions of users who have already transformed their music experience.
          </p>
          <button className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold shadow-lg shadow-indigo-500/50 hover:shadow-indigo-500/70 transition-all hover:-translate-y-1">
            Get Started Free
          </button>
        </div>
      </section>
    </main>
  );
}