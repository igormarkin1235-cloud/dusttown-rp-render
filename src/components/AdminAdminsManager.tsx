import React, { useState } from 'react';
import { AdminInfo } from '../types';
import { Shield, Plus, X, Trash2, Tag } from 'lucide-react';

interface AdminAdminsManagerProps {
  admins: AdminInfo[];
  onAddAdmin: (newAdmin: AdminInfo) => void;
  onRemoveAdmin: (username: string) => void;
  onUpdateAdminTags: (username: string, tags: string[]) => void;
}

const PRESET_TAGS = [
  'Главный Создатель',
  'Supreme GM',
  'Архитектор DustTown',
  'ГМ Событий',
  'Куратор Квентов',
  'Магитех-Инженер',
  'Шериф Поселения',
  'Экономист'
];

export const AdminAdminsManager: React.FC<AdminAdminsManagerProps> = ({
  admins,
  onAddAdmin,
  onRemoveAdmin,
  onUpdateAdminTags
}) => {
  const [newUsername, setNewUsername] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['ГМ Событий']);
  const [customTagInput, setCustomTagInput] = useState('');

  const handleAddTagToSelection = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleRemoveTagFromSelection = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleAddCustomTag = () => {
    if (customTagInput.trim() && !selectedTags.includes(customTagInput.trim())) {
      setSelectedTags([...selectedTags, customTagInput.trim()]);
      setCustomTagInput('');
    }
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    const formatted = newUsername.trim().startsWith('@')
      ? newUsername.trim()
      : `@${newUsername.trim()}`;

    // Check if already admin
    if (admins.some(a => a.username.toLowerCase() === formatted.toLowerCase())) {
      alert('Этот пользователь уже является администратором!');
      return;
    }

    const admin: AdminInfo = {
      username: formatted,
      tags: selectedTags.length > 0 ? selectedTags : ['Администратор'],
      addedAt: new Date().toISOString(),
      isMainCreator: formatted.toLowerCase() === '@mrwhitepio'
    };

    onAddAdmin(admin);
    setNewUsername('');
    setSelectedTags(['ГМ Событий']);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold font-heading text-amber-400 uppercase tracking-wide">
          Управление Администраторами и Мастерами
        </h3>
        <p className="text-xs text-zinc-400">
          Назначайте доверенных администраторов по Telegram-юзернейму (@username) и выдавайте им настраиваемые теги роли.
        </p>
      </div>

      {/* Add New Admin Form */}
      <form
        onSubmit={handleCreateAdmin}
        className="p-5 rounded-2xl bg-zinc-900 border border-amber-500/40 shadow-xl space-y-4"
      >
        <div className="flex items-center gap-2 text-sm font-bold font-heading text-amber-300">
          <Shield className="w-4 h-4 text-amber-400" />
          <span>Назначить нового администратора</span>
        </div>

        <div>
          <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
            Telegram Юзернейм (например, @username):
          </label>
          <input
            type="text"
            required
            placeholder="@username"
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono-pip"
          />
        </div>

        {/* Selected Tags Chips */}
        <div>
          <label className="block text-xs font-mono-pip text-zinc-300 mb-1.5">
            Теги администратора (отображаются в профиле и панели):
          </label>
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {selectedTags.map(tag => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono-pip flex items-center gap-1.5"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTagFromSelection(tag)}
                  className="hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Quick preset tags buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-zinc-500 font-mono-pip mr-1">Пресеты:</span>
            {PRESET_TAGS.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => handleAddTagToSelection(preset)}
                className="px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono-pip border border-zinc-700 transition"
              >
                + {preset}
              </button>
            ))}
          </div>

          {/* Custom tag input */}
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              placeholder="Свой тег роли..."
              value={customTagInput}
              onChange={e => setCustomTagInput(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            />
            <button
              type="button"
              onClick={handleAddCustomTag}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono-pip"
            >
              Добавить тег
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider shadow"
          >
            Назначить администратором
          </button>
        </div>
      </form>

      {/* Admin List */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono-pip text-zinc-400 uppercase tracking-wider font-bold">
          Действующие администраторы ({admins.length}):
        </h4>

        {admins.map(admin => {
          const isMain = admin.username.toLowerCase() === '@mrwhitepio' || admin.isMainCreator;

          return (
            <div
              key={admin.username}
              className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-300 font-mono-pip text-sm">
                    {admin.username}
                  </span>
                  {isMain && (
                    <span className="px-2 py-0.5 rounded bg-amber-500 text-black font-extrabold text-[9px] uppercase tracking-wider">
                      Создатель
                    </span>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {admin.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-300 text-[10px] font-mono-pip border border-zinc-700 flex items-center gap-1"
                    >
                      <Tag className="w-2.5 h-2.5 text-amber-400" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {!isMain && (
                <button
                  onClick={() => onRemoveAdmin(admin.username)}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 border border-zinc-800 transition text-xs font-mono-pip flex items-center gap-1"
                  title="Снять права администратора"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Снять</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
