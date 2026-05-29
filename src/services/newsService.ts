export interface NewsItem {
  source: string;
  title: string;
  link?: string;
  category: string;
}

const CACHE_TTL = 5 * 60 * 1000;

const FALLBACK_NEWS: NewsItem[] = [
  { source: 'Billboard', category: 'music', title: 'Taylor Swift Extends Eras Tour Through 2027', link: 'https://www.billboard.com' },
  { source: 'Billboard', category: 'music', title: 'New Album Releases: Top 50 Albums This Week', link: 'https://www.billboard.com' },
  { source: 'Billboard', category: 'music', title: 'Summer Music Festivals 2026: Complete Guide', link: 'https://www.billboard.com' },
  { source: 'Rolling Stone', category: 'music', title: 'The 100 Greatest Albums of the 21st Century', link: 'https://www.rollingstone.com' },
  { source: 'Rolling Stone', category: 'music', title: 'Indie Artists Breaking Through in 2026', link: 'https://www.rollingstone.com' },
  { source: 'Rolling Stone', category: 'music', title: 'Classic Rock Revival: New Bands Channeling Old Sounds', link: 'https://www.rollingstone.com' },
  { source: 'NPR', category: 'culture', title: 'Jazz Legends: New Generation Keeping the Genre Alive', link: 'https://www.npr.org' },
  { source: 'NPR', category: 'culture', title: 'World Music: Global Sounds Influencing Modern Radio', link: 'https://www.npr.org' },
  { source: 'NPR', category: 'culture', title: 'The Rise of Podcast Culture and Audio Storytelling', link: 'https://www.npr.org' },
  { source: 'Pitchfork', category: 'music', title: 'Electronic Music Scene: Underground to Mainstream', link: 'https://pitchfork.com' },
  { source: 'Pitchfork', category: 'music', title: 'Album of the Year contenders emerging mid-2026', link: 'https://pitchfork.com' },
  { source: 'Pitchfork', category: 'music', title: 'Experimental and Avant-Garde Music Recommendations', link: 'https://pitchfork.com' },
  { source: 'NME', category: 'music', title: 'UK Music Scene: Best New Bands of 2026', link: 'https://www.nme.com' },
  { source: 'NME', category: 'music', title: 'Latin Music Explosion: Global Charts Impact', link: 'https://www.nme.com' },
  { source: 'NME', category: 'music', title: 'Hip-Hop and R&B: Genre-Blending Trends', link: 'https://www.nme.com' },
  { source: 'Colossal', category: 'culture', title: 'Art and Design: Creative Movements in Music Visuals', link: 'https://www.thisiscolossal.com' },
  { source: 'Colossal', category: 'culture', title: 'Music Photography and Album Art Trends', link: 'https://www.thisiscolossal.com' },
  { source: 'Consequence', category: 'music', title: 'Concert Reviews and Live Music Highlights', link: 'https://consequence.net' },
  { source: 'Consequence', category: 'music', title: 'Emerging Artists: Ones to Watch in 2026', link: 'https://consequence.net' },
  { source: 'Consequence', category: 'music', title: 'Genre-Defying Music: Blending Rock, Electronic, and Folk', link: 'https://consequence.net' },
];

const topicCaches: Record<string, { items: NewsItem[]; ts: number }> = {};

export async function getNews(topic?: string): Promise<NewsItem[]> {
  const now = Date.now();
  const topicKey = topic || '__all__';
  const cached = topicCaches[topicKey];
  if (cached && (now - cached.ts) < CACHE_TTL) return cached.items;
  try {
    const query = topic ? `?topic=${encodeURIComponent(topic)}` : '';
    const res = await fetch(`/api/rss-news${query}`, { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        data.sort(() => Math.random() - 0.5);
        const items = data.slice(0, 50);
        topicCaches[topicKey] = { items, ts: now };
        return items;
      }
    }
  } catch {}
  if (cached) return cached.items;
  const fallback = [...FALLBACK_NEWS].sort(() => Math.random() - 0.5);
  topicCaches[topicKey] = { items: fallback, ts: now };
  return fallback;
}

export function getCachedNews(topic?: string): NewsItem[] {
  const cached = topicCaches[topic || '__all__'];
  return cached?.items || [];
}

export function categorizeNews(items: NewsItem[]): Record<string, NewsItem[]> {
  const categorized: Record<string, NewsItem[]> = {};
  for (const item of items) {
    const cat = item.category || 'general';
    if (!categorized[cat]) categorized[cat] = [];
    categorized[cat].push(item);
  }
  return categorized;
}

export function summarizeNewsForAi(items: NewsItem[]): string {
  if (items.length === 0) {
    return 'No news stories available at this time.';
  }
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  const subset = shuffled.slice(0, 20);
  const byCat = categorizeNews(subset);
  const parts: string[] = [];
  for (const [cat, catItems] of Object.entries(byCat)) {
    const headlines = catItems.map(i => {
      const linkPart = i.link ? ` (${i.link})` : '';
      return `• [${i.source}] ${i.title}${linkPart}`;
    }).join('\n');
    parts.push(`=== ${cat.toUpperCase()} (${catItems.length}) ===\n${headlines}`);
  }
  return `📰 NEWS DIGEST — ${subset.length} stories\n\n${parts.join('\n\n')}`;
}
