import React from 'react';
import { CharacterSheet } from '../types';
import { X, Sparkles, User, Shield, Music, Volume2, HeartHandshake, Briefcase, Eye } from 'lucide-react';

interface CharacterDetailModalProps {
  character: CharacterSheet | null;
  onClose: () => void;
}

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({ character, onClose }) => {
  if (!character) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl text-zinc-100 flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-300 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero Banner with Character Art and Avatar Icon */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-zinc-900 border-b border-zinc-800">
          <img
            src={character.photoUrl || character.avatarIcon}
            alt={character.name}
            className="w-full h-full object-cover object-top filter brightness-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

          {/* Character Identity on Banner */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3.5">
            <img
              src={character.avatarIcon || character.photoUrl}
              alt={character.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-amber-500 shadow-xl flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold font-heading text-amber-300 leading-tight">
                  {character.name} {character.surname !== '—' ? character.surname : ''}
                </h2>
                {character.nickname && character.nickname !== '—' && (
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-mono-pip border border-amber-500/40">
                    «{character.nickname}»
                  </span>
                )}
              </div>
              <div className="text-xs text-zinc-300 font-mono-pip mt-1 flex flex-wrap items-center gap-2">
                <span>{character.race}</span>
                <span>•</span>
                <span>{character.age}</span>
                <span>•</span>
                <span className="text-amber-400 font-semibold">{character.faction}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body with Authentic Template Layout */}
        <div className="p-6 space-y-6">
          {/* Creator Badge */}
          <div className="p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-amber-400" />
              <span className="text-zinc-400">Игрок (ТГ):</span>
              <span className="font-bold text-amber-300 font-mono-pip">{character.creatorTelegram}</span>
            </div>
            {character.creatorDustTownName && character.creatorDustTownName !== '—' && (
              <div className="text-zinc-400">
                <span>Ник в ДТ: </span>
                <span className="text-zinc-200 font-semibold">{character.creatorDustTownName}</span>
              </div>
            )}
          </div>

          {/* Section 1: Magic & Cutie Mark */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-1.5">
              <span className="text-[11px] font-mono-pip text-amber-400 uppercase tracking-wider font-bold">
                ✧ Знак отличия:
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed">{character.cutieMark || '—'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-1.5">
              <span className="text-[11px] font-mono-pip text-cyan-400 uppercase tracking-wider font-bold">
                ✧ Магия / Способности:
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed">{character.magic || '—'}</p>
            </div>
          </div>

          {/* Section 2: Faction, Job, Hobby, Relatives */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800">
              <div className="text-[10px] text-zinc-500 font-mono-pip uppercase">Фракция</div>
              <div className="text-xs font-bold text-zinc-200 mt-0.5">{character.faction}</div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800">
              <div className="text-[10px] text-zinc-500 font-mono-pip uppercase">Работа</div>
              <div className="text-xs font-bold text-zinc-200 mt-0.5">{character.job || '—'}</div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800">
              <div className="text-[10px] text-zinc-500 font-mono-pip uppercase">Хобби</div>
              <div className="text-xs font-bold text-zinc-200 mt-0.5">{character.hobby || '—'}</div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800">
              <div className="text-[10px] text-zinc-500 font-mono-pip uppercase">Родня</div>
              <div className="text-xs font-bold text-zinc-200 mt-0.5">{character.relatives || '—'}</div>
            </div>
          </div>

          {/* Section 3: Character & Biography */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <div className="text-xs font-bold font-heading text-amber-400 uppercase tracking-wider">
                Характер
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                {character.character || '—'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <div className="text-xs font-bold font-heading text-amber-400 uppercase tracking-wider">
                Биография
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                {character.biography || '—'}
              </p>
            </div>

            {character.features && character.features !== '—' && (
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <div className="text-xs font-bold font-heading text-amber-400 uppercase tracking-wider">
                  Особые приметы и черты
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{character.features}</p>
              </div>
            )}
          </div>

          {/* Section 4: Audio & Voice & Custom (+) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {character.track && character.track !== '—' && (
              <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex items-start gap-2.5">
                <Music className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] font-mono-pip text-zinc-500 uppercase">Подходящий трек</div>
                  <div className="text-xs text-purple-300 font-semibold mt-0.5">{character.track}</div>
                </div>
              </div>
            )}

            {character.voice && character.voice !== '—' && (
              <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex items-start gap-2.5">
                <Volume2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] font-mono-pip text-zinc-500 uppercase">Голос персонажа</div>
                  <div className="text-xs text-cyan-300 font-semibold mt-0.5">{character.voice}</div>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Плюсик (Custom items, arsenal, notes) */}
          {character.plusCustom && character.plusCustom !== '—' && (
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
              <span className="text-xs font-mono-pip text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Дополнительно (Плюсик):
              </span>
              <p className="text-xs text-amber-100/90 leading-relaxed whitespace-pre-line">
                {character.plusCustom}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
