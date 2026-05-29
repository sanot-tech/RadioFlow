import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, Loader2, X, Minimize2, Music, Radio, Disc3, Headphones, Waves, PartyPopper, Shuffle, Globe, RadioTower, Heart, Podcast, Monitor, Atom } from "lucide-react";
import { getNews, summarizeNewsForAi } from "@/services/newsService";
import { useGenres } from "@/services/radioService";
import { useRadioPlayer } from "@/context/RadioPlayerContext";
import type { Station } from "@/services/radioService";
import { Download, Trash2, Library } from "lucide-react";
import { saveTrack, getAllTracks, deleteTrack, clearAllTracks } from "@/services/trackCacheService";
import type { CachedTrack } from "@/services/trackCacheService";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  recommendations?: string[];
  stations?: Station[];
}

const NEWS_BUTTONS = [
  { label: 'New Music', icon: Music, iconColor: 'text-emerald-400', category: 'music', prompt: 'Analyze recent album releases and new singles from current news. Recommend radio genres and stations featuring fresh releases. Include station links.' },
  { label: 'Festivals', icon: PartyPopper, iconColor: 'text-yellow-400', category: '', prompt: 'Review festival announcements and live event coverage from current news. Recommend radio genres and stations with event programming. Include station links.' },
  { label: 'Artists', icon: Headphones, iconColor: 'text-sky-400', category: 'music', prompt: 'Examine artist news, interviews, and featured content. Recommend radio genres and stations highlighting these performers. Include station links.' },
  { label: 'Culture', icon: Disc3, iconColor: 'text-violet-400', category: 'culture', prompt: 'Survey arts and culture news beyond music. Recommend radio genres and stations with cultural programming. Include station links.' },
  { label: 'Throwback', icon: Waves, iconColor: 'text-orange-400', category: '', prompt: 'Identify retro and nostalgia-focused news. Recommend throwback radio genres and classic music stations. Include station links.' },
  { label: 'Trending', icon: Shuffle, iconColor: 'text-rose-400', category: '', prompt: 'Identify trending topics and emerging patterns in current news. Recommend radio genres and stations aligned with current trends. Include station links.' },
  { label: 'Surprise', icon: Sparkles, iconColor: 'text-fuchsia-400', category: '', prompt: 'Discover unexpected stories and unique angles in current news. Recommend distinctive radio genres and uncommon stations. Include station links.' },
  { label: 'Night Life', icon: RadioTower, iconColor: 'text-cyan-400', category: '', prompt: 'Scan news for nightlife, club events, and after-dark culture. Recommend radio genres and stations for evening listening. Include station links.' },
  { label: 'Deep Focus', icon: Monitor, iconColor: 'text-blue-400', category: '', prompt: 'Find news about ambient, study, and concentration music scenes. Recommend radio genres and stations for deep focus and relaxation. Include station links.' },
  { label: 'Global Beat', icon: Globe, iconColor: 'text-teal-400', category: 'culture', prompt: 'Cover world music, international artists, and cross-cultural news. Recommend radio genres and stations from different countries. Include station links.' },
  { label: 'High Energy', icon: Atom, iconColor: 'text-red-400', category: '', prompt: 'Identify high-energy news: sports, action, adrenaline culture. Recommend energetic radio genres and stations. Include station links.' },
  { label: 'Morning', icon: Heart, iconColor: 'text-pink-400', category: '', prompt: 'Curate morning-friendly news: light stories, positive updates. Recommend morning radio genres and stations. Include station links.' },
  { label: 'Voices', icon: Podcast, iconColor: 'text-amber-400', category: 'culture', prompt: 'Focus on talk radio, interviews, storytelling, and spoken word news. Recommend talk radio genres and stations. Include station links.' },
];

const VALID_GENRES = [
  "Acoustic","Afrobeat","Alternative","Ambient","Avant-garde","Bachata","Ballads","Baroque","Bass","Bebop","Big Band","Blues","Bollywood","Bossa Nova","Brazilian Music","Celtic","Chanson","Chillout","Christian Contemporary","Christian Music","Classic Rock","Classical","Country","Cumbia","Dance","Dancehall","Deep House","Disco","Discofox","Drum'n'Bass","Dub","Easy Listening","Electro","Electronica","Eurodance","Experimental","Fado","Folk","Funk","Fusion","Garage","Glam Rock","Gospel","Gothic","Grime","Hard Rock","Hardcore","Hardstyle","Heavy Metal","Hip Hop","House","Industrial","Instrumental","Indie","Indian Music","Italo Disco","Jazz","Jungle","J-Pop","K-Pop","Kizomba","Latin","Latin Jazz","Latin Music","Lounge","Manele","Mariachi","Merengue","Metal","Minimal","Neo-Medieval","New Age","New Wave","Oldies","Opera","Orchestral","Psychedelic","Pop","Pop Rock","Progressive House","Progressive Rock","Punk","R&B","Rap","Reggae","Reggaeton","Rock","Rock'n'Roll","Roots","Salsa","Samba","Schlager","Soft Rock","Soul","Swing","Talk","Tamil","Tango","Techno","Top 40 & Charts","Traditional","Traditional music","Trance","Trap","Urban","World","Zouk and Tropical","2000s","20s 30s 40s 50s 60s","50s","60s","70s","80s","90s"
];

function seedId(): string {
  return `s${Math.random().toString(36).slice(2, 6)}`;
}

function dailySeedDirective(): string {
  const seeds = [
    'Focus on underrated stations and niche programming.',
    'Prioritize international and world music genres.',
    'Highlight stations with live DJs and talk formats.',
    'Emphasize emerging artists and indie labels.',
    'Look for educational and cultural programming.',
    'Spotlight community radio and local music scenes.',
    'Feature electronic and experimental music genres.',
    'Recommend stations with diverse genre-blending playlists.',
  ];
  return seeds[Math.floor(Math.random() * seeds.length)];
}

const ALL_GENRES = VALID_GENRES.join(", ");

const ANALYSIS_PROMPT = `Session ${seedId()} — Current context:
{news_summary}

Task: Analyze the news above and recommend radio genres and stations.

${dailySeedDirective()}

Requirements:
- Respond in English (4-6 sentences)
- Analyze trends, then suggest 3-5 specific radio genres from the master list below
- For each suggested genre, explain why it fits the current news climate
- Include source links from the news items in your analysis
- Pick DIFFERENT genres each session — avoid repeating the same selections

Master genre list (choose ONLY from these):
${ALL_GENRES}

Conclude with 3-5 genres on one line: [GENRES] genre1, genre2, genre3, genre4, genre5`;

const GENERAL_PROMPT = `Session ${seedId()} — Current context:
{news_summary}

User query: {user_input}

${dailySeedDirective()}

Requirements:
- Respond in English (3-5 sentences)
- Use the news context to inform your recommendations
- Suggest 3-5 specific radio genres from the master list below
- Include source links from news items
- Vary your recommendations each time

Master genre list (choose ONLY from these):
${ALL_GENRES}

Conclude with 3-5 genres on one line: [GENRES] genre1, genre2, genre3, genre4, genre5`;

const QWEN_MODELS = [
  'qwen3.5-flash',
  'qwen3.6-plus',
  'qwen3-coder-plus',
  'qwen3.7-max',
];



function extractGenresFromAi(text: string): string[] {
  const match = text.match(/\[GENRES\]\s*(.+)/i);
  if (match) {
    return match[1].split(',').map(g => g.trim()).filter(Boolean);
  }
  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const g of VALID_GENRES) {
    if (lower.includes(g.toLowerCase())) {
      found.push(g);
      if (found.length >= 4) break;
    }
  }
  return found;
}

function stripAiBoilerplate(text: string): string {
  return text.replace(/<details>[\s\S]*?<\/details>/gi, '').trim();
}

function mapGenresToValid(genres: string[]): string[] {
  const valid = new Set(VALID_GENRES.map(g => g.toLowerCase()));
  return genres.filter(g => valid.has(g.toLowerCase()));
}

async function callQwenAi(prompt: string, token: string): Promise<{ text: string; error?: string } | null> {
  const baseUrl = (() => {
    try { return import.meta.env.VITE_QWEN_API_BASE || 'https://qwen.aikit.club'; } catch { return 'https://qwen.aikit.club'; }
  })();
  for (const model of QWEN_MODELS) {
    try {
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a professional RadioFlow assistant. Respond in English with concise, data-driven insights. Base all recommendations exclusively on provided news data.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 600,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return { text };
      }
      if (res.status !== 429) {
        return { text: '', error: `Qwen model ${model} returned ${res.status}` };
      }
    } catch (err: any) {
      if (err.name === 'AbortError') continue;
      return { text: '', error: `Qwen network error: ${err.message}` };
    }
  }
  return null;
}

function getQwenToken(): string {
  try { return import.meta.env.VITE_QWEN_API_TOKEN || ''; } catch { return ''; }
}

function getZhipuKey(): string {
  try { return import.meta.env.VITE_ZHIPUAI_API_KEY || ''; } catch { return ''; }
}

function getZhipuBaseUrl(): string {
  try { return import.meta.env.VITE_ZHIPUAI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4'; } catch { return 'https://open.bigmodel.cn/api/paas/v4'; }
}

async function callZhipuAi(prompt: string, apiKey: string): Promise<{ text: string; error?: string } | null> {
  const baseUrl = getZhipuBaseUrl();
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'glm-4-plus',
        messages: [
          { role: 'system', content: 'You are a professional RadioFlow assistant. Respond in English with concise, data-driven insights.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 600,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return { text };
    }
    return { text: '', error: `ZhipuAI returned ${res.status}` };
  } catch (err: any) {
    return { text: '', error: `ZhipuAI network error: ${err.message}` };
  }
}

const API_SERVERS = [
  'https://de1.api.radio-browser.info/json',
  'https://de2.api.radio-browser.info/json',
  'https://at1.api.radio-browser.info/json',
];

async function fetchStationsByGenre(genre: string, limit = 5): Promise<Station[]> {
  const tag = encodeURIComponent(genre.toLowerCase());
  for (const base of API_SERVERS) {
    try {
      const offset = Math.floor(Math.random() * 15);
      const res = await fetch(
        `${base}/stations/search?tag=${tag}&limit=${limit}&offset=${offset}&hidebroken=true&order=random`
      );
      if (!res.ok) continue;
      const data = await res.json();
      if (!data || data.length === 0) continue;
      return data
        .map((s: any) => ({
          id: s.stationuuid,
          name: s.name,
          genre,
          country: s.country || 'Unknown',
          imageUrl: s.favicon || '',
          streams: [{ bitrate: s.bitrate || 128, url: s.url_resolved || '' }],
          currentStreamUrl: s.url_resolved || '',
          currentBitrate: `${s.bitrate || 128}kbps`,
        }))
        .filter((s: Station) => s.currentStreamUrl);
    } catch {
      continue;
    }
  }
  return [];
}

function pickRandom<T>(arr: T[]): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4);
}

function formatMessage(content: string): React.ReactNode {
  const paragraphs = content.split('\n\n').filter(Boolean);
  return (
    <div className="space-y-2">
      {paragraphs.map((para, i) => {
        const withLinks = para.split(/(https?:\/\/[^\s]+)/).map((part, j) => {
          if (part.startsWith('http://') || part.startsWith('https://')) {
            return (
              <a key={j} href={part} target="_blank" rel="noopener noreferrer"
                className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2 break-all"
              >{part.length > 50 ? part.slice(0, 50) + '…' : part}</a>
            );
          }
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="text-indigo-200 font-bold">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('* ') || part.startsWith('- ')) {
            const items = part.split('\n').filter(Boolean);
            return (
              <ul key={j} className="list-disc list-inside space-y-0.5">
                {items.map((item, k) => (
                  <li key={k} className="text-indigo-100">{item.replace(/^[*-]\s*/, '')}</li>
                ))}
              </ul>
            );
          }
          return <span key={j} className="text-indigo-100">{part}</span>;
        });
        return <p key={i} className="leading-relaxed">{withLinks}</p>;
      })}
    </div>
  );
}

interface LLMChatPanelProps {
  onMinimize: () => void;
  onClose: () => void;
}

const CHAT_STORAGE_KEY = 'radioflow_chat_messages';

function loadChatMessages(): ChatMessage[] {
  try {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [
    { role: 'assistant', content: 'RadioFlow AI Assistant active.\n\nNews intelligence feed connected. Select a category from the sidebar or enter a query to receive curated radio recommendations.' }
  ];
}

function saveChatMessages(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch {}
}

const LLMChatPanel: React.FC<LLMChatPanelProps> = ({ onMinimize, onClose }) => {
  const navigate = useNavigate();
  const { data: allGenres } = useGenres();
  const { playStation, getAudioElement } = useRadioPlayer();
  const [messages, setMessages] = useState<ChatMessage[]>(loadChatMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newsLoaded, setNewsLoaded] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [recordingStationId, setRecordingStationId] = useState<string | null>(null);
  const [cachedTracks, setCachedTracks] = useState<CachedTrack[]>([]);
  const [showSavedTracks, setShowSavedTracks] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    getAllTracks().then(setCachedTracks).catch(() => {});
  }, []);

  useEffect(() => {
    getNews().then(() => setNewsLoaded(true)).catch(() => setNewsLoaded(true));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    saveChatMessages(messages);
  }, [messages]);

  const handleCategoryClick = (label: string, prompt: string) => {
    if (isLoading) return;
    setActiveButton(label);
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    handleAIAction(prompt, label);
  };

  const handleAIAction = async (userText: string, topic?: string) => {
    setIsLoading(true);
    const summaryResult = await getNews(topic);
    const summary = summarizeNewsForAi(summaryResult);
    const qwenToken = getQwenToken();
    const zhipuKey = getZhipuKey();
    const isNewsAnalysis = userText.toLowerCase().includes('news') || userText.toLowerCase().includes('trend');
    const systemPrompt = isNewsAnalysis
      ? ANALYSIS_PROMPT.replace('{news_summary}', summary)
      : GENERAL_PROMPT.replace('{news_summary}', summary).replace('{user_input}', userText);

    let aiResult = qwenToken ? await callQwenAi(systemPrompt, qwenToken) : null;
    if (aiResult === null && zhipuKey) {
      aiResult = await callZhipuAi(systemPrompt, zhipuKey);
    }

    if (aiResult?.text) {
      let genres = extractGenresFromAi(aiResult.text);
      const validGenres = mapGenresToValid(genres);
      const genresToFetch = validGenres.length > 0 ? validGenres : genres.slice(0, 2);
      const cleanText = stripAiBoilerplate(aiResult.text.replace(/\[GENRES\][\s\S]*$/i, ''));

      let stationResults: Station[] = [];
      if (genresToFetch.length > 0) {
        const results = await Promise.all(genresToFetch.map(g => fetchStationsByGenre(g, 10)));
        stationResults = results.flat().slice(0, 12);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: cleanText, recommendations: genres, stations: stationResults }]);
    } else {
      const realGenres = (allGenres || []).map(g => g.name);
      const randomGenres = pickRandom(realGenres, 4);

      let stationResults: Station[] = [];
      if (randomGenres.length > 0) {
        const results = await Promise.all(randomGenres.slice(0, 4).map(g => fetchStationsByGenre(g, 10)));
        stationResults = results.flat().slice(0, 12);
      }

      const errorNote = aiResult?.error ? `\n\n⚠️ ${aiResult.error}` : '\n\n⚠️ AI temporarily unavailable';
      const emptyNews = !summary.includes('stories');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: emptyNews ? `Try these radio genres instead:\n\n${randomGenres.slice(0, 4).join(', ')}${errorNote}` : `📰 **Latest News:**\n\n${summary}${errorNote}`,
        recommendations: randomGenres,
        stations: stationResults,
      }]);
    }
    setIsLoading(false);
  };

  const handleSend = async () => {
    const q = input.trim();
    if (!q || isLoading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    await handleAIAction(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const startRecording = (station: Station) => {
    if (recordingStationId) return;
    const audio = getAudioElement();
    if (!audio) return;
    try {
      const stream = (audio as any).captureStream?.();
      if (!stream) return;
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const track: CachedTrack = {
          id: `${Date.now()}_${station.id}`,
          name: station.name.replace(/[^a-zA-Z0-9]/g, '_'),
          stationName: station.name,
          timestamp: Date.now(),
          size: blob.size,
          blob,
        };
        await saveTrack(track).catch(() => {});
        setCachedTracks(prev => [...prev, track]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${track.name}_radioflow.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setRecordingStationId(null);
      };
      recorder.start();
      setRecordingStationId(station.id);
    } catch {}
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .chat-glow {
          background: radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%);
        }
        .chat-bg {
          background: linear-gradient(135deg, rgba(15,15,35,0.97), rgba(30,27,75,0.95));
        }
        .msg-user {
          position: relative;
          overflow: hidden;
        }
        .msg-user::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(99,102,241,0.85), rgba(139,92,246,0.75), rgba(168,85,247,0.65));
          background-size: 200% 200%;
          animation: gradientShift 6s ease infinite;
          z-index: 0;
        }
        .msg-user > * {
          position: relative;
          z-index: 1;
        }
        .msg-ai {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(99,102,241,0.12);
          border-left: 2px solid rgba(99,102,241,0.4);
          box-shadow: 0 2px 12px rgba(0,0,0,0.2);
        }
        .msg-ai::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(30,27,75,0.6), rgba(79,70,229,0.15), rgba(30,27,75,0.6), rgba(99,102,241,0.1));
          background-size: 300% 300%;
          animation: gradientShift 8s ease infinite;
          z-index: 0;
        }
        .msg-ai > * {
          position: relative;
          z-index: 1;
        }
        .input-glass {
          background: rgba(30,27,75,0.4);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(99,102,241,0.12);
          transition: all 0.2s ease;
        }
        .input-glass:focus {
          border-color: rgba(99,102,241,0.35);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
          background: rgba(30,27,75,0.6);
        }
        .station-card {
          background: rgba(20,18,50,0.6);
          border: 1px solid rgba(99,102,241,0.1);
          transition: all 0.2s ease;
        }
        .station-card:hover {
          background: rgba(99,102,241,0.12);
          border-color: rgba(99,102,241,0.25);
        }
        .sidebar-btn {
          cursor: pointer;
          border: none;
          background: transparent;
          font-family: inherit;
          transition: all 0.15s ease;
          color: rgba(99,102,241,0.5);
          border-radius: 8px;
          position: relative;
          overflow: hidden;
        }
        .sidebar-btn:hover {
          color: rgba(165,180,252,0.95);
          background: rgba(99,102,241,0.15);
          box-shadow: 0 0 16px rgba(99,102,241,0.2);
          transform: scale(1.05);
        }
        .sidebar-btn:active {
          transform: scale(0.92);
        }
        .sidebar-btn:disabled {
          opacity: 0.15;
          cursor: default;
          transform: none;
        }
        .sidebar-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05));
          opacity: 0;
          transition: opacity 0.15s ease;
          border-radius: 8px;
        }
        .sidebar-btn:hover::before {
          opacity: 1;
        }
        .sidebar-btn:hover {
          color: rgba(165,180,252,0.9);
        }
        .sidebar-btn:active {
          transform: scale(0.95);
        }
        .sidebar-btn:disabled {
          opacity: 0.2;
          cursor: default;
          transform: none;
        }
        .sidebar-btn.active {
          color: rgba(165,180,252,1);
          background: rgba(99,102,241,0.18);
          box-shadow: 0 0 16px rgba(99,102,241,0.25), inset 0 0 20px rgba(99,102,241,0.05);
        }
        .sidebar-btn.active::before {
          opacity: 1;
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        .dot-pulse { animation: dotPulse 1.2s ease-in-out infinite; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-msg { animation: fadeIn 0.25s ease-out; }
      `}</style>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-3xl rounded-2xl flex flex-col animate-fade-in overflow-hidden chat-bg border border-indigo-500/15 shadow-2xl shadow-indigo-500/10"
          style={{ maxHeight: 'min(92vh, 800px)', height: '800px' }}>
          <div className="chat-glow absolute inset-0 pointer-events-none" />

          <div className="flex items-center justify-between px-4 py-2.5 border-b border-indigo-500/10 shrink-0 relative">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />
                <Bot className="h-3.5 w-3.5 text-white relative" />
              </div>
              <span className="font-bold text-indigo-100 text-xs tracking-wide">RadioFlow AI</span>
            </div>
            <div className="flex gap-1">
              <button onClick={onMinimize} className="text-indigo-400/40 hover:text-indigo-200 transition-all p-1 rounded hover:bg-white/5">
                <Minimize2 className="h-3 w-3" />
              </button>
              <button onClick={onClose} className="text-indigo-400/40 hover:text-indigo-200 transition-all p-1 rounded hover:bg-white/5">
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden relative">
            <div className="w-14 shrink-0 border-r border-indigo-500/8 flex flex-col items-center gap-0.5 py-2 bg-indigo-950/30 overflow-y-auto">
              {NEWS_BUTTONS.map((btn) => (
                <button
                  key={btn.label}
                  onClick={() => handleCategoryClick(btn.label, btn.prompt)}
                  disabled={isLoading}
                  className="sidebar-btn flex flex-col items-center gap-0.5 p-1.5 rounded-lg w-11"
                  title={btn.label}
                >
                  <btn.icon className={`h-4 w-4 ${btn.iconColor || ''}`} />
                  <span className="text-[7px] leading-tight font-bold text-center uppercase tracking-wider text-indigo-200">{btn.label}</span>
                </button>
              ))}
            </div>

            <CardContent className="flex-1 overflow-y-auto p-3 space-y-3 relative">
              {messages.map((msg, i) => (
                <div key={i} className={`flex flex-col fade-in-msg ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-base leading-relaxed ${
                    msg.role === 'user' ? 'msg-user text-white rounded-br-md' : 'msg-ai text-indigo-100 rounded-bl-md'
                  }`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1 mb-1.5">
                        <Sparkles className="h-3 w-3 text-indigo-400/80" />
                        <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-[0.15em]">AI</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap leading-relaxed text-sm">{formatMessage(msg.content)}</div>
                  </div>

                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5 max-w-[85%]">
                      {msg.recommendations.map(genre => (
                        <button
                          key={genre}
                          onClick={() => { onMinimize(); navigate(`/genre/${encodeURIComponent(genre)}`); }}
                          className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-500/20 to-purple-600/20 border border-indigo-400/20 text-indigo-200 hover:from-indigo-500/40 hover:to-purple-600/40 hover:border-indigo-400/40 hover:text-white transition-all active:scale-95"
                        >
                          <Music className="h-3 w-3 inline mr-1" />
                          {genre}
                        </button>
                      ))}
                    </div>
                  )}

                  {msg.stations && msg.stations.length > 0 && (
                    <div className="mt-2 max-w-[85%] w-full">
                      <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider mb-1.5 px-1">Recommended Stations</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {msg.stations.map(station => (
                          <div key={station.id} className="flex gap-1">
                            <button
                              onClick={() => playStation(station)}
                              className="station-card flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-indigo-200 hover:text-white flex-1 min-w-0 text-left"
                            >
                              {station.imageUrl ? (
                                <img
                                  src={station.imageUrl}
                                  alt=""
                                  className="w-6 h-6 rounded-lg object-cover bg-indigo-900/50 shrink-0"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-lg bg-indigo-900/50 flex items-center justify-center shrink-0">
                                  <Radio className="h-3 w-3 text-indigo-400/60" />
                                </div>
                              )}
                              <span className="truncate font-medium leading-tight">{station.name}</span>
                            </button>
                            <button
                              onClick={() => recordingStationId === station.id ? stopRecording() : startRecording(station)}
                              className={`station-card flex items-center justify-center w-9 shrink-0 rounded-xl transition-all ${
                                recordingStationId === station.id ? 'text-red-400 border-red-400/40' : 'text-indigo-400/60'
                              }`}
                              title={recordingStationId === station.id ? 'Stop recording' : 'Record & download'}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start fade-in-msg">
                  <div className="msg-ai rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1.5 items-center h-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 dot-pulse" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 dot-pulse" style={{ animationDelay: '200ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 dot-pulse" style={{ animationDelay: '400ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>
          </div>

          {cachedTracks.length > 0 && (
            <div className="border-t border-indigo-500/10 bg-indigo-950/20">
              <button
                onClick={() => setShowSavedTracks(!showSavedTracks)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold text-indigo-400/70 hover:text-indigo-200 uppercase tracking-wider w-full"
              >
                <Library className="h-3 w-3" />
                Saved Tracks ({cachedTracks.length})
                <span className="ml-auto">{showSavedTracks ? '▲' : '▼'}</span>
              </button>
              {showSavedTracks && (
                <div className="px-3 pb-2 max-h-32 overflow-y-auto space-y-1">
                  {cachedTracks.map(track => (
                    <div key={track.id} className="flex items-center gap-2 text-[11px] text-indigo-300 bg-indigo-900/20 rounded-lg px-2 py-1.5">
                      <span className="truncate flex-1">{track.stationName}</span>
                      <span className="text-indigo-500 text-[10px]">{(track.size / 1024 / 1024).toFixed(1)}MB</span>
                      <button
                        onClick={() => {
                          const url = URL.createObjectURL(track.blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${track.name}_radioflow.webm`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="text-indigo-400/60 hover:text-indigo-200"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                      <button
                        onClick={async () => {
                          await deleteTrack(track.id);
                          setCachedTracks(prev => prev.filter(t => t.id !== track.id));
                        }}
                        className="text-red-400/50 hover:text-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {cachedTracks.length > 0 && (
                    <button
                      onClick={async () => {
                        await clearAllTracks();
                        setCachedTracks([]);
                      }}
                      className="text-[10px] text-red-400/50 hover:text-red-300 px-1 py-0.5"
                    >
                      Clear all cached tracks
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="p-3 border-t border-indigo-500/10 shrink-0 relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter your query..."
                  className="w-full input-glass rounded-xl px-4 py-2 text-sm text-indigo-50 placeholder-indigo-400/40 focus:outline-none h-9"
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 disabled:opacity-40 shrink-0 transition-all duration-200"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LLMChatPanel;
