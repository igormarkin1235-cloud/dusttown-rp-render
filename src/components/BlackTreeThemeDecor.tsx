import React from 'react';

export const BlackTreeThemeDecor: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-0">
      {/* Background Gradient: white-grey to deep wasteland dark */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-200/90 via-stone-800/95 to-zinc-950 opacity-95" />
      
      {/* Vignette & fog overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_transparent_30%,_rgba(9,9,11,0.85)_100%)]" />

      {/* Black Tree Silhouette in the Bottom-Right Corner */}
      <div className="absolute -bottom-2 -right-4 w-72 h-80 opacity-90 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
        <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Main Trunk */}
          <path
            d="M170 240 C165 200 155 170 148 140 C144 120 135 95 130 75 C125 55 120 30 115 10 C114 8 111 8 111 11 C112 25 116 45 114 60 C110 75 95 90 85 100 C75 110 60 120 40 125 C37 126 37 130 41 129 C55 127 75 120 85 115 C95 110 105 105 110 120 C115 135 120 160 125 180 C130 200 135 220 140 240 Z"
            fill="#09090b"
          />
          {/* Main Left Twisted Branch */}
          <path
            d="M148 140 C135 130 110 128 90 135 C70 142 50 155 30 170 C27 172 25 168 28 166 C48 152 70 135 92 128 C108 122 130 124 140 132 Z"
            fill="#09090b"
          />
          {/* Secondary Higher Left Branch */}
          <path
            d="M130 75 C115 65 95 60 75 62 C55 64 35 72 20 82 C17 84 15 80 18 78 C35 68 55 58 76 56 C98 54 118 60 128 68 Z"
            fill="#09090b"
          />
          {/* Twig off branch */}
          <path
            d="M80 60 C75 48 65 40 50 35 C47 34 46 38 49 39 C62 44 70 50 74 61 Z"
            fill="#09090b"
          />
          {/* Right Upper Branch */}
          <path
            d="M125 45 C135 35 150 28 165 25 C180 22 195 24 198 25 C200 26 200 29 197 29 C183 29 170 27 158 31 C146 35 134 42 124 50 Z"
            fill="#09090b"
          />
          {/* Right Mid Branch */}
          <path
            d="M135 95 C150 90 168 88 185 92 C192 94 190 98 184 97 C168 93 152 95 137 100 Z"
            fill="#09090b"
          />
          {/* Gnarled Roots */}
          <path
            d="M140 240 C130 235 110 236 90 239 C87 239 87 240 90 240 L195 240 C190 236 175 235 165 240 Z"
            fill="#09090b"
          />
        </svg>
      </div>

      {/* Animated Falling Leaves (Crimson, Rose-Pink, Deep Wine) */}
      <div className="absolute inset-0">
        {/* Leaf 1 - Crimson Red */}
        <div className="absolute top-2 right-28 w-4 h-4 text-red-600 animate-falling-leaf-1 filter drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]">
          🍂
        </div>
        {/* Leaf 2 - Wine / Burgundy */}
        <div className="absolute top-0 right-44 w-3.5 h-3.5 text-rose-900 animate-falling-leaf-2 filter drop-shadow-[0_0_5px_rgba(159,18,57,0.8)]">
          🍁
        </div>
        {/* Leaf 3 - Bright Rose Pink */}
        <div className="absolute top-6 right-16 w-3 h-3 text-pink-400 animate-falling-leaf-3 filter drop-shadow-[0_0_8px_rgba(244,114,182,0.9)]">
          🍃
        </div>
        {/* Leaf 4 - Wine / Ruby */}
        <div className="absolute top-1 right-36 w-4 h-4 text-red-700 animate-falling-leaf-4 filter drop-shadow-[0_0_6px_rgba(185,28,28,0.7)]">
          🍂
        </div>
        {/* Leaf 5 - Pink-Red */}
        <div className="absolute top-10 right-20 w-3 h-3 text-rose-500 animate-falling-leaf-5 filter drop-shadow-[0_0_7px_rgba(244,63,94,0.8)]">
          🍁
        </div>
        {/* Leaf 6 - Dark Wine */}
        <div className="absolute top-4 right-52 w-3.5 h-3.5 text-red-950 animate-falling-leaf-6 filter drop-shadow-[0_0_5px_rgba(136,19,55,0.9)]">
          🍃
        </div>
      </div>
    </div>
  );
};
