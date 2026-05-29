import React, { lazy, Suspense, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { RadioPlayerProvider } from "./context/RadioPlayerContext";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider, useChat } from "./context/ChatContext";
import RadioPlayerBar from "@/components/RadioPlayerBar";
import FloatingRobot from "@/components/FloatingRobot";
import LLMChatPanel from "@/components/LLMChatPanel";
import { useAudioPersistence } from "./hooks/useAudioPersistence";
import { useFpsMonitor } from "./hooks/useFpsMonitor";

function LocationTracker() {
  useAudioPersistence();
  return null;
}

function FpsOverlay() {
  const [show, setShow] = useState(false);
  const { fps, minFps } = useFpsMonitor(show);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'F') { setShow(p => !p); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  if (!show) return null;
  return (
    <div className="fixed top-2 right-2 z-[9999] bg-black/80 text-xs font-mono px-2 py-1 rounded border border-yellow-500/50 text-yellow-300 pointer-events-none select-none">
      FPS: <span className={fps < 30 ? 'text-red-400' : fps < 55 ? 'text-yellow-300' : 'text-green-400'}>{fps}</span>
      <span className="text-gray-500"> | Min: {minFps}</span>
    </div>
  );
}

function ChatManager() {
  const { chatState, openChat, minimizeChat, closeChat } = useChat();
  return (
    <>
      {chatState === 'open' && (
        <>
          <div className="fixed inset-0 z-[9998] backdrop-blur-sm bg-black/10 transition-all duration-500" />
          <LLMChatPanel onMinimize={minimizeChat} onClose={closeChat} />
        </>
      )}
      {(chatState === 'minimized' || chatState === 'closed') && <FloatingRobot onClick={openChat} />}
    </>
  );
}

const RadioFlow = lazy(() => import("./pages/RadioFlow"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const CountryStationsPage = lazy(() => import("./pages/CountryStationsPage"));
const GenreStationsPage = lazy(() => import("./pages/GenreStationsPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TopStationsPage = lazy(() => import("./pages/TopStationsPage"));
const TrendingStationsPage = lazy(() => import("./pages/TrendingStationsPage"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <RadioPlayerProvider>
          <ChatProvider>
            <BrowserRouter>
              <LocationTracker />
              <div className="h-screen flex flex-col bg-background overflow-hidden">
                <FpsOverlay />
                <ChatManager />
                <Suspense fallback={
                  <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
                    <p>Loading application...</p>
                  </div>
                }>
                  <Routes>
                    <Route path="/" element={<RadioFlow />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/country/:countryName" element={<CountryStationsPage />} />
                    <Route path="/genre/:genreName" element={<GenreStationsPage />} />
                    <Route path="/favorites" element={<FavoritesPage />} />
                    <Route path="/genre/top-vote" element={<TopStationsPage />} />
                    <Route path="/genre/trending" element={<TrendingStationsPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <RadioPlayerBar />
              </div>
            </BrowserRouter>
          </ChatProvider>
        </RadioPlayerProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
