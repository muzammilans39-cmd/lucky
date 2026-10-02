import React, { useState, useEffect } from 'react';
import { Sparkles, Volume2, RefreshCw, Heart, Quote } from 'lucide-react';
import { sound } from '../utils/audioFeedback';
import { speech } from '../utils/speechEngine';

interface AffirmationItem {
  id: string;
  quote: string;
  author: string;
  theme: string;
}

const AFFIRMATIONS: AffirmationItem[] = [
  {
    id: 'aff-1',
    quote: 'Today is a brand new day, full of quiet joy and simple blessings. Take it one pleasant moment at a time.',
    author: 'Daily Gentle Wisdom',
    theme: 'Peace & Contentment',
  },
  {
    id: 'aff-2',
    quote: 'You are loved, appreciated, and deeply cherished. Your presence brings warmth to everyone around you.',
    author: 'Loving Affirmation',
    theme: 'Family & Warmth',
  },
  {
    id: 'aff-3',
    quote: 'Enjoy the little things, for one day you may look back and realize they were the truly big things.',
    author: 'Robert Brault',
    theme: 'Mindfulness',
  },
  {
    id: 'aff-4',
    quote: 'Every breath is a fresh start. Inhale peace, exhale worry, and enjoy today at your own comfortable pace.',
    author: 'Gentle Encouragement',
    theme: 'Calm & Relaxation',
  },
  {
    id: 'aff-5',
    quote: 'Kind words can be short and easy to speak, but their echoes are truly endless.',
    author: 'Mother Teresa',
    theme: 'Kindness',
  },
  {
    id: 'aff-6',
    quote: 'Your life is a rich tapestry of wisdom, resilience, and love. Be proud of every chapter you have lived.',
    author: 'Golden Wisdom',
    theme: 'Inner Strength',
  },
  {
    id: 'aff-7',
    quote: 'Peace comes from within. Grant yourself grace and take comfort in a peaceful heart today.',
    author: 'Daily Reflection',
    theme: 'Inner Harmony',
  },
  {
    id: 'aff-8',
    quote: 'The secret of health for both mind and body is to live in the present moment wisely and earnestly.',
    author: 'Buddha',
    theme: 'Wellbeing',
  },
];

export const DailyAffirmationCard: React.FC = () => {
  // Deterministic daily index based on day of the year
  const getDailyIndex = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = (now.getTime() - start.getTime()) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return dayOfYear % AFFIRMATIONS.length;
  };

  const [currentIndex, setCurrentIndex] = useState(getDailyIndex);
  const current = AFFIRMATIONS[currentIndex];

  const handleNextQuote = () => {
    sound.playTap();
    setCurrentIndex((prev) => (prev + 1) % AFFIRMATIONS.length);
  };

  const handleSpeakAffirmation = () => {
    sound.playTap();
    const textToSpeak = `Today's uplifting affirmation: "${current.quote}". Attributed to ${current.author}.`;
    speech.speakText(textToSpeak);
  };

  return (
    <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-slate-900 border-3 border-purple-400/80 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Quote text with high-contrast font and theme badge */}
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-slate-900/90 rounded-2xl border-2 border-purple-400/50 shadow-md flex-shrink-0 text-purple-300">
            <Heart className="w-8 h-8 fill-purple-400/20 stroke-[2.5]" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase bg-purple-950 text-purple-300 border border-purple-500/50 px-2.5 py-0.5 rounded-md font-black flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Daily Affirmation
              </span>
              <span className="text-xs text-purple-300/80 font-bold">
                {current.theme}
              </span>
            </div>

            {/* Large High-Contrast Quote Text */}
            <blockquote className="text-xl md:text-2xl lg:text-3xl font-black text-white leading-snug tracking-tight">
              "{current.quote}"
            </blockquote>

            {/* Author */}
            <p className="text-amber-300 font-bold text-sm md:text-base">
              — {current.author}
            </p>
          </div>
        </div>

        {/* Right: Audio Read Aloud & Next Quote buttons */}
        <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
          <button
            onClick={handleSpeakAffirmation}
            className="flex items-center gap-2 px-4 py-3 bg-purple-400 hover:bg-purple-300 active:bg-purple-500 text-slate-950 font-black rounded-2xl shadow-lg border-2 border-purple-300 text-base transition-transform active:scale-95"
            aria-label={`Read daily affirmation aloud: ${current.quote}`}
            title="Read affirmation aloud"
          >
            <Volume2 className="w-6 h-6 stroke-[2.5]" />
            <span>Read Aloud</span>
          </button>

          <button
            onClick={handleNextQuote}
            className="p-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-purple-200 hover:text-white rounded-2xl border border-slate-700 shadow-sm"
            aria-label="Show another positive affirmation"
            title="Next affirmation"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
