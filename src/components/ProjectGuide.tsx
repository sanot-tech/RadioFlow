import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "overview", label: "About RadioFlow", icon: "◈" },
  { id: "gettingstarted", label: "How to Start", icon: "▶" },
  { id: "browse", label: "Browse Stations", icon: "◉" },
  { id: "player", label: "Player Controls", icon: "♫" },
  { id: "genres", label: "Genres", icon: "♯" },
  { id: "countries", label: "Countries", icon: "⊕" },
  { id: "favorites", label: "Favorites", icon: "★" },
  { id: "trending", label: "Trending & Top", icon: "⚡" },
  { id: "aichat", label: "AI Chat", icon: "◆" },
  { id: "search", label: "Search", icon: "⌕" },
  { id: "recognition", label: "Now Playing", icon: "◎" },
  { id: "recording", label: "Record & Download", icon: "⬤" },
  { id: "history", label: "Your History", icon: "↻" },
  { id: "random", label: "Shuffle Mode", icon: "⟳" },
  { id: "settings", label: "Settings", icon: "⚙" },
  { id: "tips", label: "Pro Tips", icon: "✦" },
] as const;

type SectionId = (typeof NAV_ITEMS)[number]["id"];

const Section: React.FC<{ id: SectionId; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
  <div id={id} className="scroll-mt-24 mb-10 last:mb-0">
    <div className="flex items-center gap-3 mb-5">
      <div className="h-8 w-1 rounded-full bg-gradient-to-b from-indigo-400 to-purple-500" />
      <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
    </div>
    <div className="space-y-3 text-sm text-muted-foreground/90 leading-relaxed">
      {children}
    </div>
  </div>
);

const ColorGrid: React.FC<{ items: { label: string; desc: string; icon: string; color: string }[] }> = ({ items }) => {
  const colorMap: Record<string, string> = {
    "99,102,241": "#6366f1",
    "245,158,11": "#f59e0b",
    "34,211,238": "#22d3ee",
    "139,92,246": "#8b5cf6",
    "16,185,129": "#10b981",
    "236,72,153": "#ec4899",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
      {items.map((item, i) => {
        const c = colorMap[item.color] || "#6366f1";
        return (
          <div key={i} className="group relative overflow-hidden rounded-xl p-4 border border-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
            style={{ background: `linear-gradient(135deg, ${c}0a, transparent)` }}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: `radial-gradient(circle at 30% 20%, ${c}0f, transparent 60%)` }}
            />
            <div className="relative z-10 flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{
                  background: `linear-gradient(135deg, ${c}26, ${c}0d)`,
                  color: c,
                  border: `1px solid ${c}26`,
                }}
              >
                {item.icon}
              </div>
              <div>
                <div className="font-semibold text-sm text-foreground/90 mb-0.5">{item.label}</div>
                <div className="text-xs text-muted-foreground/70">{item.desc}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ProjectGuide: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const guideRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    flashRef.current = setInterval(() => {
      const el = guideRef.current;
      if (!el || open) return;
      el.classList.remove('animate-water-ripple');
      void el.offsetWidth;
      el.classList.add('animate-water-ripple');
    }, 4000);
    return () => clearInterval(flashRef.current);
  }, [open]);

  const handleNavClick = (id: SectionId) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer flex items-center justify-center text-xs sm:text-sm font-medium text-muted-foreground/60 hover:text-foreground transition-all duration-300 hover:scale-105 active:scale-95">
          <div ref={guideRef} className="relative flex items-center gap-1.5 px-2 py-1.5 rounded-xl border border-transparent hover:border-white/[0.06] transition-all duration-300">
            <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <span className="hidden sm:inline">Gu<span className="ripple-i">i</span>de</span>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[920px] max-h-[85vh] border-0 bg-background/95 backdrop-blur-2xl shadow-2xl shadow-indigo-500/5 z-[101] p-0 my-8"
        style={{ borderRadius: "20px" }}
        onInteractOutside={(e: Event) => e.preventDefault()}
      >
        <div className="flex h-[78vh] relative rounded-[20px] overflow-hidden">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse at 15% 20%, #6366F1, transparent 50%),
                radial-gradient(ellipse at 85% 30%, #8B5CF6, transparent 50%),
                radial-gradient(ellipse at 50% 80%, #22C55E, transparent 50%)
              `
            }}
          />

          {/* Left Sidebar Navigation */}
          <div className="w-[220px] flex-shrink-0 border-r border-white/[0.04] overflow-y-auto py-4 relative z-10">
            <div className="px-4 pb-4 mb-3 border-b border-white/[0.04]">
              <div className="flex items-center gap-2.5 px-1">
                <div className="relative group cursor-pointer flex-shrink-0">
                  <span className="absolute inset-0 text-lg font-bold pointer-events-none select-none transition-all duration-500 opacity-0 group-hover:opacity-30" style={{ color: "#ff1744", transform: "translate(-0.8px, 0)" }}>
                    <span className="animate-logo-color-shift">R</span>adio<span className="animate-logo-color-shift" style={{ animationDelay: "3s" }}>F</span>low
                  </span>
                  <span className="absolute inset-0 text-lg font-bold pointer-events-none select-none transition-all duration-500 opacity-0 group-hover:opacity-30" style={{ color: "#00e5ff", transform: "translate(0.8px, 0)" }}>
                    <span className="animate-logo-color-shift">R</span>adio<span className="animate-logo-color-shift" style={{ animationDelay: "3s" }}>F</span>low
                  </span>
                  <div className="text-lg font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent whitespace-nowrap">
                    <span className="inline-block animate-logo-color-shift">R</span>adio<span className="inline-block animate-logo-color-shift" style={{ animationDelay: "3s" }}>F</span>low
                  </div>
                </div>
              </div>
            </div>
            <nav className="space-y-0.5 px-2">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 text-left",
                    activeSection === item.id
                      ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/15"
                      : "text-muted-foreground/60 hover:text-foreground/80 hover:bg-white/[0.02] border border-transparent"
                  )}
                >
                  <span className={cn(
                    "text-[13px]",
                    activeSection === item.id ? "text-indigo-400" : "text-muted-foreground/40"
                  )}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto relative z-10">
            <div className="sticky top-0 z-20 flex justify-end px-4 pt-3 pb-0 bg-gradient-to-b from-background/95 to-transparent backdrop-blur-sm">
              <DialogClose asChild>
                <button className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200 group">
                  <X className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground transition-colors duration-200" />
                </button>
              </DialogClose>
            </div>
            <div className="px-8 py-4">

              {/* About RadioFlow */}
              <Section id="overview" title="Welcome to RadioFlow">
                <p className="text-base font-medium text-foreground/80">
                  RadioFlow lets you listen to thousands of radio stations from all over the world &mdash; for free. Find music, news, talk shows, and more, all in one place.
                </p>
                <ColorGrid
                  items={[
                    { label: "100,000+ Stations", desc: "Radio from 195+ countries, any genre you can imagine", icon: "◉", color: "99,102,241" },
                    { label: "AI Recommendations", desc: "Smart suggestions based on what's trending globally", icon: "⚡", color: "245,158,11" },
                    { label: "Track Finder", desc: "See what song is playing and save it for later", icon: "◎", color: "34,211,238" },
                    { label: "AI Assistant", desc: "Chat to discover new music you'll love", icon: "◆", color: "139,92,246" },
                    { label: "Works Everywhere", desc: "Desktop, phone, tablet &mdash; even install as an app", icon: "⎔", color: "16,185,129" },
                    { label: "Save Favorites", desc: "Bookmark stations and listen again anytime", icon: "★", color: "236,72,153" },
                  ]}
                />
              </Section>

              {/* How to Start */}
              <Section id="gettingstarted" title="Getting Started">
                <p>
                  Just open the app and start exploring. Find the buttons at the top of the screen:
                </p>
                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] mt-4">
                  <ul className="space-y-3 text-xs">
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span><strong>Top Stations</strong> &mdash; Most popular stations right now</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span><strong>Trending</strong> &mdash; Stations matched to current music trends</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span><strong>Genres</strong> &mdash; Pick your favorite music style</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span><strong>Countries</strong> &mdash; Explore radio from around the world</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span><strong>Search</strong> &mdash; Find any station by name instantly</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span><strong>Shuffle</strong> &mdash; Play a random station for surprise discovery</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span><strong>AI Chat</strong> &mdash; Ask for music recommendations in plain English</span></li>
                  </ul>
                </div>
                <p className="mt-3 text-xs text-muted-foreground/60 italic">No account needed to listen. Sign in with Google to save favorites across devices.</p>
              </Section>

              {/* Browse Stations */}
              <Section id="browse" title="Finding Stations">
                <p>
                  Scroll through the main station feed to discover new radio. New stations load automatically as you scroll &mdash; no need to click &quot;load more&quot;.
                </p>
                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] mt-4">
                  <div className="font-semibold text-sm text-foreground/90 mb-2">Station Cards</div>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Click a card to start playing that station</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>The <strong>star icon</strong> saves a station to your favorites</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Click <strong>genre</strong> or <strong>country</strong> badges to find similar stations</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>The <strong>sparkle icon</strong> shows an AI-written description</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Active station has a green glow effect</span></li>
                  </ul>
                </div>
              </Section>

              {/* Player Controls */}
              <Section id="player" title="Using the Player">
                <p>
                  The player stays at the bottom of the screen while you browse. You can always see what&apos;s playing and control it.
                </p>
                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] mt-4">
                  <div className="font-semibold text-sm text-foreground/90 mb-2">What You Can Do</div>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span><strong>Play / Pause</strong> &mdash; Big center button</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span><strong>Skip</strong> &mdash; Previous and next station buttons</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span><strong>Volume</strong> &mdash; Slider on the right side of the player bar</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span><strong>AI Description</strong> &mdash; Click the sparkle icon on the album art for a written description of the current station</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span><strong>Equalizer</strong> &mdash; Visual bars dance to the music next to the volume</span></li>
                  </ul>
                </div>
              </Section>

              {/* Genres */}
              <Section id="genres" title="Browsing by Genre">
                <p>
                  Choose from over 110 genres &mdash; from Pop and Rock to Jazz, Classical, Hip Hop, Ambient, and many more.
                </p>
                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] mt-4">
                  <div className="font-semibold text-sm text-foreground/90 mb-2">How to Use</div>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Click <strong>Genres</strong> button in the middle toolbar</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Search for a genre or scroll the list</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Select a genre to filter all stations by that style</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>You can also click genre tags on any station card</span></li>
                  </ul>
                </div>
              </Section>

              {/* Countries */}
              <Section id="countries" title="Exploring by Country">
                <p>
                  Travel the world through radio. Every country has its own unique stations.
                </p>
                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] mt-4">
                  <div className="font-semibold text-sm text-foreground/90 mb-2">How to Use</div>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Click <strong>Country</strong> button in the middle toolbar</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Find a country by name or scroll the list</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Click any country to see all stations from there</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Country tags on station cards work too</span></li>
                  </ul>
                </div>
              </Section>

              {/* Favorites */}
              <Section id="favorites" title="Saving Favorites">
                <p>
                  Save stations you love so you can easily find them again. Your favorites follow you across devices when you sign in.
                </p>
                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] mt-4">
                  <div className="font-semibold text-sm text-foreground/90 mb-2">How to Use</div>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Click the <strong>star</strong> on any station card to save it</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Click <strong>Favorites</strong> button or the star in the header to see all saved stations</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Click the star again to remove from favorites</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span><strong>Sign in with Google</strong> to sync favorites across all your devices</span></li>
                  </ul>
                </div>
              </Section>

              {/* Trending & Top */}
              <Section id="trending" title="Trending &amp; Top Stations">
                <p>
                  Two special pages help you discover what&apos;s popular right now.
                </p>
                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] mt-4">
                  <div className="font-semibold text-sm text-foreground/90 mb-2">Pages</div>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span><strong>Top Stations</strong> &mdash; Community-ranked most popular stations with the highest ratings</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span><strong>Trending</strong> &mdash; AI-selected stations that match what&apos;s trending on YouTube Music, Spotify, and Apple Music right now</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Both pages work just like the main feed &mdash; play any station with one click</span></li>
                  </ul>
                </div>
              </Section>

              {/* AI Chat */}
              <Section id="aichat" title="AI Chat Assistant">
                <p>
                  Chat with an AI to discover new music. Ask for recommendations in natural language &mdash; like &quot;chill jazz for reading&quot; or &quot;high-energy workout music.&quot;
                </p>
                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] mt-4">
                  <div className="font-semibold text-sm text-foreground/90 mb-2">How to Use</div>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Click <strong>AI Chat</strong> button in the middle toolbar (or the floating robot icon)</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Type your request or click one of the 8 news categories (New Music, Festivals, Artists, etc.)</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>The AI will suggest stations you can play directly from the chat</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>You can also save recognized tracks and manage them in the chat</span></li>
                  </ul>
                </div>
              </Section>

              {/* Search */}
              <Section id="search" title="Quick Search">
                <p>
                  Find any station instantly by name.
                </p>
                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] mt-4">
                  <div className="font-semibold text-sm text-foreground/90 mb-2">How to Use</div>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Click the <strong>Search</strong> button in the middle toolbar</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Start typing &mdash; results appear after a short pause</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Use <strong>arrow keys</strong> to navigate results, <strong>Enter</strong> to play</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Press <strong>Esc</strong> or click outside to close</span></li>
                  </ul>
                </div>
              </Section>

              {/* Now Playing */}
              <Section id="recognition" title="Track Recognition">
                <p>
                  When a station is playing, you can identify the current track &mdash; see the song name and artist.
                </p>
                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] mt-4">
                  <div className="font-semibold text-sm text-foreground/90 mb-2">How to Use</div>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>When a station is playing, look for the <strong>recognize button</strong> on the Now Playing card</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>It usually finds the track in 1-2 seconds (or up to 10 seconds if it needs audio analysis)</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Recognized tracks are saved &mdash; view your history in the AI Chat panel</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Click the (×) button to clear and re-recognize</span></li>
                  </ul>
                </div>
              </Section>

              {/* Recording */}
              <Section id="recording" title="Record &amp; Download">
                <p>
                  Capture any song playing on a live radio stream. Record a snippet and save it as an audio file.
                </p>
                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] mt-4">
                  <div className="font-semibold text-sm text-foreground/90 mb-2">How to Use</div>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Click the <strong>Record &amp; Download</strong> button on the Now Playing card</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>The button turns red and shows &quot;Recording...&quot; &mdash; tap it again to stop</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>When you stop, a <strong>.webm</strong> file downloads automatically to your device</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Recorded tracks are also saved locally &mdash; view them in the AI Chat panel</span></li>
                  </ul>
                </div>
              </Section>

              {/* Your History */}
              <Section id="history" title="Recent Stations">
                <p>
                  Your recently played stations are always accessible. The &quot;Recent&quot; strip shows the last stations you listened to.
                </p>
                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] mt-4">
                  <div className="font-semibold text-sm text-foreground/90 mb-2">How to Use</div>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Scroll horizontally through the <strong>Recent</strong> strip just below the player card</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Click any station to jump back to it instantly</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>The list updates automatically as you listen to new stations</span></li>
                  </ul>
                </div>
              </Section>

              {/* Shuffle Mode */}
              <Section id="random" title="Shuffle (Random Mode)">
                <p>
                  Not sure what to listen to? Let RadioFlow surprise you.
                </p>
                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] mt-4">
                  <div className="font-semibold text-sm text-foreground/90 mb-2">How to Use</div>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Click the <strong>Shuffle</strong> button in the middle toolbar</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>A random station starts playing immediately</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>When the playlist runs out, new random stations load automatically</span></li>
                  </ul>
                </div>
              </Section>

              {/* Settings */}
              <Section id="settings" title="App Settings">
                <p>
                  Customize your experience in the Settings panel.
                </p>
                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] mt-4">
                  <div className="font-semibold text-sm text-foreground/90 mb-2">Available Settings</div>
                  <ul className="space-y-2 text-xs">
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span><strong>Now Playing Notifications</strong> &mdash; Toggle toast notifications when a station starts playing</span></li>
                    <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">▸</span><span>Access settings by clicking the <strong>gear icon</strong> in the top-right corner</span></li>
                  </ul>
                </div>
              </Section>

              {/* Pro Tips */}
              <Section id="tips" title="Pro Tips">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: "✦", title: "Sign In", desc: "Connect with Google to save your favorites across all your devices." },
                    { icon: "⟳", title: "Feeling Lucky", desc: "Hit Shuffle when you want something new. The app keeps finding fresh stations for you." },
                    { icon: "◆", title: "Ask the AI", desc: "Try &quot;show me relaxing piano stations&quot; or &quot;something upbeat for a road trip&quot; in AI Chat." },
                    { icon: "⚡", title: "Trending Daily", desc: "Check Trending every day &mdash; the AI updates its recommendations throughout the day." },
                    { icon: "◎", title: "Identify Songs", desc: "Use the recognize button to find out what&apos;s playing. Saved tracks live in the AI Chat." },
                    { icon: "♫", title: "Station Stories", desc: "Enable AI descriptions on station cards to learn about the music style and mood." },
                    { icon: "⌕", title: "Keyboard-Friendly", desc: "In search, use arrow keys to navigate and Enter to play. No mouse needed!" },
                    { icon: "★", title: "Keep Scrolling", desc: "Stations load automatically as you scroll &mdash; up to 500. The underline bar shows load status." },
                    { icon: "↻", title: "Quick Recall", desc: "Your last 10 stations are in the Recent strip. Jump back anytime." },
                    { icon: "◈", title: "Install the App", desc: "Your browser may offer to install RadioFlow as an app for a better experience." },
                  ].map((tip, i) => (
                    <div key={i} className="group relative overflow-hidden rounded-xl p-4 border border-white/[0.04] hover:border-white/[0.1] transition-all duration-300 bg-white/[0.01]">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                        style={{ background: "radial-gradient(circle at 20% 30%, rgba(99,102,241,0.04), transparent 60%)" }}
                      />
                      <div className="relative z-10 flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/15">
                          {tip.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-foreground/90 mb-0.5">{tip.title}</div>
                          <div className="text-xs text-muted-foreground/70 leading-relaxed">{tip.desc}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Footer */}
              <div className="mt-8 pt-5 border-t border-white/[0.04] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-1.5">
                    {["◈", "♫", "⚡"].map((s, i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/[0.06] text-[10px] text-indigo-400/60">
                        {s}
                      </div>
                    ))}
                  </div>
                  <span className="text-[11px] text-muted-foreground/40 tracking-wide">made by Sanot</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] text-muted-foreground/30 tracking-[0.15em] uppercase">&copy; 2026</span>
                  <span className="text-[10px] font-semibold text-muted-foreground/40">RadioFlow</span>
                  <span className="text-[10px] text-muted-foreground/30 tracking-[0.1em] uppercase">All rights reserved</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectGuide;
