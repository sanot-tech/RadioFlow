import axios from 'axios';
import { descriptionCache } from './descriptionCache';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const PRIMARY_MODEL = 'google/gemma-4-26b-a4b-it:free';
const FALLBACK_MODELS = [
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
];

const MIN_REQUEST_INTERVAL = 5000;
let lastRequestTime = 0;
let consecutiveErrors = 0;
let accountExhausted = false;

function enforceRateLimit() {
  if (accountExhausted) return Promise.resolve();
  const now = Date.now();
  const backoff = Math.min(consecutiveErrors * 3000, 60000);
  const wait = Math.max(0, MIN_REQUEST_INTERVAL + backoff - (now - lastRequestTime));
  if (wait > 0) {
    return new Promise<void>(resolve => setTimeout(resolve, wait));
  }
  return Promise.resolve();
}

const PROMPT_TEMPLATES = [
  `Station name: "{name}". Write a very long, flowing, artistic description of this radio station. Don't mention genre, country, or style. Just imagine what kind of atmosphere this name suggests and describe it poetically. Use vivid imagery, emotions, and sensory details. Write at least 12-15 sentences. Make it beautiful and immersive, like a short prose poem. Make it feel endless and hypnotic.`,
  `"{name}" — what world does this name open? Write a very long creative description (12+ sentences) that paints a picture of the experience of listening to this station. Use metaphor and imagery. Don't analyze the name — feel it. Describe the mood, the time of day, the light, the feeling. Avoid mentioning specific music genres or countries. Let the text flow like music itself.`,
  `Imagine you're describing "{name}" to someone who's never heard it. Don't tell them what genre it is — tell them what it FEELS like. Write a very long, flowing meditation (12-15 sentences) on the atmosphere of this station. Use the name as your only clue. Be poetic, abstract, and immersive. Every sentence should make them want to tune in. Write like a beautiful dream.`,
  `"{name}" — write a very long poetic description (minimum 12 sentences) that captures the essence of this radio station through its name alone. Describe the sensation of listening: the mood it creates, the memories it evokes, the time of day it suits best. Be abstract and beautiful. No genre labels, no country names. Just pure atmospheric writing that goes on and on like a gentle stream.`,
  `You're a writer creating the liner notes for "{name}". Write a very long, dreamy description (12-15 sentences) that makes the listener fall in love with the station before they even hear it. Focus on the name's emotional resonance. Use rich language, metaphors, and sensory details. Avoid technical details about genre or format. Let the description wander and explore like improvisation.`,
];

const COSMIC_TEMPLATES = [
  `"{name}" — There are stations you listen to, and then there are stations you feel. {name} is the latter, a frequency that doesn't just travel through the air but settles somewhere deep inside, finding a home in the spaces between your thoughts. From the first moment the signal locks in, you realize this is not background music — it's a presence, a companion that understands the rhythm of your day without you having to explain it. The tracks flow like chapters in a book you never want to put down, each one leading naturally into the next, telling a story that only your ears can decode. It's the kind of station that makes you miss your exit because you were lost in the moment, that turns a simple drive into a journey, that transforms an ordinary evening into something that feels almost cinematic. You don't choose {name}. Somehow, it chooses you.`,

  `"{name}" — Imagine standing at the edge of a city as the sun begins to set, the sky painted in colors that don't have names yet. That's where {name} lives, in that brief moment between day and night when anything feels possible. The music drifts through the air like conversations from distant windows, fragments of stories that you piece together in your mind. Each song is a door opening to a different room, a different memory, a different version of yourself that you'd forgotten existed. There's a warmth here, a sense of belonging that has nothing to do with knowing the lyrics and everything to do with feeling the rhythm. {name} doesn't ask you to dance — it makes you want to. It doesn't demand your attention — it earns it, moment by moment, note by note, until you realize you've been listening for hours and the world outside has softened around the edges.`,

  `"{name}" — Some frequencies carry music. This one carries atmosphere. {name} is a place you visit without moving, a destination that exists purely in sound, where every track is a landmark and every transition is a gentle turn on an unfamiliar road. The beauty of this station is that it doesn't try to impress you with what it plays — it trusts that the right song will find you at the right moment, and somehow, impossibly, it always does. There are mornings when {name} feels like the first cup of coffee, warm and promising. There are nights when it becomes a lullaby for the restless mind. It adapts, it breathes, it lives in the background of your life until you suddenly realize it's been the foreground all along.`,

  `"{name}" — Close your eyes and let the signal guide you. {name} is not a collection of songs but a continuous stream of consciousness, a river of sound that flows through the landscape of your day. Sometimes it's a gentle current carrying you forward, sometimes it's a deep wave that pulls you under into reflection. The voices on this frequency speak in melodies, the pauses between tracks are punctuation marks in a long beautiful sentence that never really ends. What makes {name} special isn't any particular song but the space between them, the anticipation, the quiet thrill of not knowing what comes next but trusting that it will be exactly what you needed. This is radio as it was meant to be — not as background noise but as a thread weaving through the fabric of everyday life, making everything feel a little more connected, a little more meaningful.`,

  `"{name}" — There's a moment, about twenty minutes into listening, when you stop noticing the individual songs and start experiencing the flow. That's when {name} works its magic. The station becomes a texture, a mood, a subtle shift in the atmosphere of whatever room you're in. It's the kind of presence that makes silence feel less empty and noise feel less chaotic. {name} has a personality that you can't quite describe — it's not happy or sad, energetic or calm. It simply IS, and that authenticity is what draws you back. You find yourself returning to this frequency the way you return to a favorite book or a familiar view, not because it surprises you but because it comforts you. And in a world that's constantly demanding your attention, {name} is the rare space that asks nothing of you except to listen.`,

  `"{name}" — If radio waves could paint, they would create the soundscape of {name}. This is a station that exists in the margins of the day, in the early hours when the world is still waking up and the late nights when everyone else has gone to sleep. It's a companion for the solitary moments, the commutes, the work sessions, the quiet dinners, the lazy Sunday afternoons. {name} understands that music is not just entertainment — it's the scaffolding of memory, the backdrop of our lives. Every song that plays on this frequency becomes part of someone's story, a timestamp in the album of their life. And {name} curates those moments with an invisible hand, guiding the experience without ever getting in the way. It's the art of selection elevated to craft, the subtle magic of knowing exactly what the moment requires.`,

  `"{name}" — Tune in and let the world fade away. {name} operates on a simple philosophy: that music should be felt before it's understood. The tracks that flow through this channel are chosen not for their popularity but for their emotional weight, their ability to resonate at frequencies that bypass the brain and speak directly to something deeper. You might not know the name of every artist or the title of every song, but you'll know exactly how each one makes you feel. And that, in the end, is what matters. {name} is not about information — it's about transformation. It's about the way a particular chord progression can unlock a memory you didn't know you had, the way a certain tempo can change your entire outlook on the day ahead. This is radio as therapy, as revelation, as the gentle hand on your shoulder reminding you that you're not alone.`,

  `"{name}" — Every great station has a soul, and {name} wears its soul on its frequency. This is not a place for passive listening — it's an invitation to engage, to feel, to let the music wash over you and carry you somewhere new. The programming flows like a conversation between old friends, where every track builds on the last and nothing feels out of place. There's a intelligence behind the selection, a sensibility that you can trust implicitly. {name} knows when you need energy and when you need calm. It knows when you need to dance and when you need to think. It reads the room of your life and responds accordingly, a tireless DJ that never misreads the crowd because the crowd is just you. And that personal connection, that sense that the station is playing just for you, is the rarest magic in the world of radio. {name} has it in abundance.`,
];

const TINY_NAMES = new Set([
  'fm', 'radio', 'live', 'stream', 'online', 'digital', 'web', 'hd', 'plus',
  'hit', 'hits', 'star', 'top', 'best', 'one', '1', '2', '3', '4', '5',
  'gold', 'silver', 'plus', 'extra', 'max', 'ultra',
]);

function extractMeaningfulWords(name: string): string[] {
  const cleaned = name.replace(/[^a-zA-Z\s\u0400-\u04FF\u0500-\u052F]/g, ' ').toLowerCase();
  const words = cleaned.split(/\s+/).filter(w => w.length > 2 && !TINY_NAMES.has(w));
  return [...new Set(words)];
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateLongDescription(name: string): string {
  const words = extractMeaningfulWords(name);
  const nameRef = name.split(' ').slice(0, 3).join(' ');

  let template = pickRandom(COSMIC_TEMPLATES);
  let desc = template.replace(/\{name\}/g, nameRef);

  if (words.length > 0) {
    const extraWords = words.slice(0, 3).join(', ');
    const enhancers = [
      ` The word "${extraWords}" alone suggests a world of depth and character, and {name} delivers on that promise with every moment on air.`,
      ` There's something about the name that resonates — "${extraWords}" — a hint of the atmosphere that awaits anyone who tunes in.`,
      ` "${extraWords}" — even the name evokes a certain feeling, a certain time and place that {name} brings to life through its carefully crafted sound.`,
    ];
    desc += pickRandom(enhancers).replace(/\{name\}/g, nameRef);
  }

  const sentenceExtras = [
    ` And just when you think you've heard everything {name} has to offer, it shifts, evolves, reveals another layer, another texture, another reason to stay tuned.`,
    ` The longer you listen to {name}, the more you realize that every song was placed here deliberately, like brushstrokes on an infinite canvas.`,
    ` There's a reason listeners return to {name} day after day — not for any single track, but for the experience, the journey, the atmosphere that can't be found anywhere else.`,
    ` {name} is the kind of discovery you want to share with everyone, but also keep as your own secret, a hidden gem in the vast landscape of radio.`,
    ` To listen to {name} is to understand that radio, at its best, is not about filling silence — it's about creating meaning, connection, and beauty out of thin air.`,
    ` And so the music continues, the signal never fades, and {name} remains there, waiting for you, whenever you need to escape, to feel, or simply to listen.`,
  ];

  desc += ' ' + pickRandom(sentenceExtras).replace(/\{name\}/g, nameRef);
  desc += ' ' + pickRandom(sentenceExtras).replace(/\{name\}/g, nameRef);

  return `"${nameRef}" — ${desc}`;
}

function buildPrompt(name: string): string {
  const template = pickRandom(PROMPT_TEMPLATES);
  return template.replace("{name}", name);
}

function mockFallback(name: string): string {
  return generateLongDescription(name);
}

export interface StationData {
  name: string;
  country: string;
  genre: string;
  artist?: string;
  description?: string;
}

async function tryModel(model: string, prompt: string, timeoutMs: number, signal?: AbortSignal): Promise<string | null> {
  await enforceRateLimit();
  if (accountExhausted || signal?.aborted) return null;
  try {
    lastRequestTime = Date.now();
    const response = await axios.post(
      API_URL,
      { model, messages: [{ role: 'user', content: prompt }] },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'RadioFlow',
        },
        timeout: timeoutMs,
        signal,
      }
    );
    consecutiveErrors = 0;
    let text = response.data.choices[0].message.content;
    return text.replace(/^["']|["']$/g, '').trim();
  } catch (err: any) {
    if (err?.response?.status === 402) {
      accountExhausted = true;
      return null;
    }
    if (err?.response?.status === 429) {
      consecutiveErrors++;
      return null;
    }
    if (axios.isCancel(err)) throw err;
    consecutiveErrors++;
    return null;
  }
}

export const generateDescription = async (station: StationData, signal?: AbortSignal): Promise<string> => {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const cachedDescription = descriptionCache.get(station);
  if (cachedDescription && cachedDescription.startsWith('"')) {
    const lines = cachedDescription.split(' ').length;
    if (lines > 60) return cachedDescription;
  }

  if (!OPENROUTER_API_KEY || accountExhausted) {
    const desc = mockFallback(station.name);
    descriptionCache.set(station, desc);
    return desc;
  }

  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  const prompt = buildPrompt(station.name);
  const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let text: string | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    for (const model of modelsToTry) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const timeout = attempt === 0 ? 15000 : 25000;
      text = await tryModel(model, prompt, timeout, signal);
      if (text) break;
    }
    if (text) break;
  }

  if (text) {
    const result = `"${station.name}" — ${text}`;
    descriptionCache.set(station, result);
    return result;
  }

  const desc = mockFallback(station.name);
  descriptionCache.set(station, desc);
  return desc;
};
