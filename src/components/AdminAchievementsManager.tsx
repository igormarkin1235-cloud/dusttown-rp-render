import React, { useState, useRef } from 'react';
import {
  Achievement,
  AchievementType,
  AchievementRewardType,
  UserProfile
} from '../types';
import { PaletteColorSelector } from './PaletteColorSelector';
import { ALL_TEXT_COLORS, ALL_BG_COLORS } from '../services/palette';
import {
  Trophy,
  Plus,
  Trash2,
  Sparkles,
  Coins,
  Upload,
  CheckCircle2,
  X,
  AlertCircle,
  HelpCircle,
  Image as ImageIcon,
  Flame,
  Radio,
  FileText
} from 'lucide-react';

interface AdminAchievementsManagerProps {
  achievements: Achievement[];
  profiles: UserProfile[];
  currentAdminUsername: string;
  onCreateAchievement: (achievement: Achievement) => void;
  onDeleteAchievement: (achievementId: string) => void;
}

// Preset PNG Icons for achievements
const PRESET_PNG_ICONS = [
  { label: 'Знак Радиации ☢️', url: 'https://cdn-icons-png.flaticon.com/512/564/564445.png' },
  { label: 'Звезда Шерифа ⭐', url: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png' },
  { label: 'Шестерня Стали ⚙️', url: 'https://cdn-icons-png.flaticon.com/512/3524/3524659.png' },
  { label: 'Череп Рейдера 💀', url: 'https://cdn-icons-png.flaticon.com/512/3067/3067332.png' },
  { label: 'Квантовый Кристалл 💎', url: 'https://cdn-icons-png.flaticon.com/512/3132/3132693.png' },
  { label: 'Корона Власти 👑', url: 'https://cdn-icons-png.flaticon.com/512/2618/2618068.png' },
  { label: 'Монета Эквивакса 🪙', url: 'https://cdn-icons-png.flaticon.com/512/2933/2933116.png' },
  { label: 'Кубок Победителя 🏆', url: 'https://cdn-icons-png.flaticon.com/512/3112/3112946.png' },
  { label: 'Радиостанция Пип-Бой 📻', url: 'https://cdn-icons-png.flaticon.com/512/860/860324.png' },
  { label: 'Боевая Граната 💣', url: 'https://cdn-icons-png.flaticon.com/512/2972/2972531.png' }
];

export const AdminAchievementsManager: React.FC<AdminAchievementsManagerProps> = ({
  achievements = [],
  profiles = [],
  currentAdminUsername,
  onCreateAchievement,
  onDeleteAchievement
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [achievementType, setAchievementType] = useState<AchievementType>('any_event_count');
  const [targetValue, setTargetValue] = useState<number>(5);

  // Icon state
  const [iconUrl, setIconUrl] = useState(PRESET_PNG_ICONS[0].url);
  const [iconError, setIconError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reward state
  const [rewardType, setRewardType] = useState<AchievementRewardType>('equivaxes');
  const [rewardAmount, setRewardAmount] = useState<number>(200);
  const [selectedTextColor, setSelectedTextColor] = useState(ALL_TEXT_COLORS[1].value);
  const [selectedTextColorLabel, setSelectedTextColorLabel] = useState(ALL_TEXT_COLORS[1].label);
  const [selectedBgColor, setSelectedBgColor] = useState(ALL_BG_COLORS[1].value);
  const [selectedBgColorLabel, setSelectedBgColorLabel] = useState(ALL_BG_COLORS[1].label);

  // Handle PNG upload
  const handlePngUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIconError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict PNG validation requirement
    const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
    if (!isPng) {
      setIconError('Ошибка: допускаются исключительно файлы формата PNG (.png)!');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setIconError('Файл слишком велик (максимум 3 МБ)');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      if (typeof event.target?.result === 'string') {
        setIconUrl(event.target.result);
      }
    };
    reader.onerror = () => {
      setIconError('Не удалось прочитать файл изображения.');
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let rewardCosmeticId: string | undefined = undefined;
    let rewardCosmeticName: string | undefined = undefined;

    if (rewardType === 'text_color') {
      rewardCosmeticId = selectedTextColor;
      rewardCosmeticName = selectedTextColorLabel;
    } else if (rewardType === 'profile_bg') {
      rewardCosmeticId = selectedBgColor;
      rewardCosmeticName = selectedBgColorLabel;
    } else if (rewardType === 'both') {
      rewardCosmeticId = selectedTextColor;
      rewardCosmeticName = selectedTextColorLabel;
    }

    const newAchievement: Achievement = {
      id: 'ach_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: title.trim(),
      description: description.trim(),
      type: achievementType,
      targetValue: Number(targetValue) || 1,
      iconUrl: iconUrl || PRESET_PNG_ICONS[0].url,
      rewardType,
      rewardAmount: (rewardType === 'equivaxes' || rewardType === 'both') ? (Number(rewardAmount) || 0) : undefined,
      rewardCosmeticId,
      rewardCosmeticName,
      createdAt: new Date().toISOString(),
      createdBy: currentAdminUsername
    };

    onCreateAchievement(newAchievement);
    setTitle('');
    setDescription('');
    setIsFormOpen(false);
  };

  const getConditionLabel = (type: AchievementType, val: number) => {
    switch (type) {
      case 'events_count':
        return `Поучаствовать в ${val} ивентах или вылазках`;
      case 'rp_count':
        return `Поучаствовать в ${val} запланированных РП-сессиях`;
      case 'any_event_count':
        return `Поучаствовать в ${val} любых событиях/РП Даст Таун`;
      case 'time_in_bot_days':
        return `Провести в сообществе/боте от ${val} дней`;
      case 'rare_cases_count':
        return `Получить ${val} редких/эпических наград из кейсов`;
      case 'cases_opened_count':
        return `Открыть ${val} кейсов с лутом`;
      case 'characters_count':
        return `Создать ${val} анкет персонажей в гильдии`;
      case 'equivaxes_balance':
        return `Накопить баланс от ${val.toLocaleString()} ℰQ`;
      case 'auction_deals':
        return `Совершить ${val} сделок на аукционе Даст Таун`;
      case 'lottery_tickets':
        return `Стереть ${val} билетов лотереи Пустошей`;
      case 'awards_count':
        return `Заслужить ${val} орденов или медалей от администрации`;
      default:
        return `Выполнить условие (${val})`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold font-heading text-amber-400 uppercase tracking-wide">
              Интерактивный конструктор достижений
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Создавайте системные достижения для всех сталкеров Даст Таун с автоматическим отслеживанием прогресса и наградами.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider transition shadow flex items-center justify-center gap-1.5 active:scale-95"
        >
          {isFormOpen ? (
            <>
              <X className="w-4 h-4" />
              <span>Закрыть конструктор</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Создать достижение</span>
            </>
          )}
        </button>
      </div>

      {/* Interactive Creator Form */}
      {isFormOpen && (
        <form
          onSubmit={handleCreate}
          className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-amber-500/50 shadow-2xl space-y-5 animate-fade-in relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />

          <div className="flex items-center gap-2 text-sm font-bold font-heading text-amber-300 border-b border-zinc-800 pb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Новое достижение для игроков Даст Таун</span>
          </div>

          {/* Title and Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                Название достижения: *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="например: Ветеран Даст Таун"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-heading font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                Краткое описание / Легенда:
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="например: Пройдите сквозь радиоактивный шторм и выживите..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono-pip"
              />
            </div>
          </div>

          {/* Condition Type and Target Value */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                Тип отслеживаемого условия:
              </label>
              <select
                value={achievementType}
                onChange={e => setAchievementType(e.target.value as AchievementType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-400 font-mono-pip"
              >
                <optgroup label="События и РП:">
                  <option value="any_event_count">Любые события и РП (общее участие)</option>
                  <option value="events_count">Только ивенты и вылазки</option>
                  <option value="rp_count">Только запланированные РП-сессии</option>
                </optgroup>
                <optgroup label="Активность и время:">
                  <option value="time_in_bot_days">Время пребывания в боте (дни)</option>
                  <option value="characters_count">Создание анкет персонажей</option>
                  <option value="awards_count">Получение наград/орденов от админов</option>
                </optgroup>
                <optgroup label="Экономика и кейсы:">
                  <option value="rare_cases_count">Получение редких/эпик предметов из кейсов</option>
                  <option value="cases_opened_count">Количество открытых кейсов</option>
                  <option value="equivaxes_balance">Баланс Эквиваксов (ℰQ)</option>
                  <option value="auction_deals">Сделки на аукционе (покупки/продажи)</option>
                  <option value="lottery_tickets">Стёртые лотерейные билеты</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                Целевое значение (кол-во):
              </label>
              <input
                type="number"
                min="1"
                required
                value={targetValue}
                onChange={e => setTargetValue(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-amber-300 font-mono-pip font-bold focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Condition Preview Banner */}
          <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs font-mono-pip text-zinc-300 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Условие для игроков: <strong className="text-amber-300">{getConditionLabel(achievementType, targetValue)}</strong>
            </span>
          </div>

          {/* PNG Icon Uploader & Presets */}
          <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-mono-pip text-zinc-200 font-bold flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Иконка достижения (Обязательно формат PNG):</span>
              </label>

              {/* Upload PNG file button */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".png,image/png"
                  onChange={handlePngUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono-pip font-bold flex items-center gap-1.5 shadow transition active:scale-95"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Загрузить свой PNG</span>
                </button>
              </div>
            </div>

            {iconError && (
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs font-mono-pip flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{iconError}</span>
              </div>
            )}

            {/* Current icon preview + preset picker */}
            <div className="flex items-center gap-4 pt-1">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-zinc-950 border-2 border-amber-400/80 p-2 flex items-center justify-center shadow-lg shadow-amber-950/50">
                  <img
                    src={iconUrl}
                    alt="Achievement icon"
                    className="w-full h-full object-contain drop-shadow"
                    onError={() => setIconUrl(PRESET_PNG_ICONS[0].url)}
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 text-[9px] bg-amber-500 text-black font-black px-1 rounded font-mono-pip uppercase">
                  PNG
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-mono-pip text-zinc-400 block mb-1">
                  Или выберите из готовых PNG-значков Пустоши:
                </span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_PNG_ICONS.map(item => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setIconUrl(item.url);
                        setIconError(null);
                      }}
                      className={`w-9 h-9 p-1.5 rounded-xl border flex items-center justify-center transition ${
                        iconUrl === item.url
                          ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50'
                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                      }`}
                      title={item.label}
                    >
                      <img src={item.url} alt={item.label} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reward Section: Currency / Text Color / Profile Background */}
          <div className="space-y-4 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
            <label className="text-xs font-mono-pip text-zinc-200 font-bold flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Награда за выполнение достижения:</span>
            </label>

            {/* Reward Type Selection */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setRewardType('equivaxes')}
                className={`p-3 rounded-xl border text-xs font-heading font-bold uppercase transition flex flex-col items-center justify-center gap-1 ${
                  rewardType === 'equivaxes'
                    ? 'bg-amber-500 text-black border-amber-400 shadow'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>Эквиваксы (ℰQ)</span>
              </button>

              <button
                type="button"
                onClick={() => setRewardType('text_color')}
                className={`p-3 rounded-xl border text-xs font-heading font-bold uppercase transition flex flex-col items-center justify-center gap-1 ${
                  rewardType === 'text_color'
                    ? 'bg-purple-600 text-white border-purple-400 shadow'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Цвет текста</span>
              </button>

              <button
                type="button"
                onClick={() => setRewardType('profile_bg')}
                className={`p-3 rounded-xl border text-xs font-heading font-bold uppercase transition flex flex-col items-center justify-center gap-1 ${
                  rewardType === 'profile_bg'
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Фон профиля</span>
              </button>

              <button
                type="button"
                onClick={() => setRewardType('both')}
                className={`p-3 rounded-xl border text-xs font-heading font-bold uppercase transition flex flex-col items-center justify-center gap-1 ${
                  rewardType === 'both'
                    ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white border-amber-400 shadow'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                <Flame className="w-4 h-4" />
                <span>ℰQ + Цвет</span>
              </button>
            </div>

            {/* Currency Input (if equivaxes or both) */}
            {(rewardType === 'equivaxes' || rewardType === 'both') && (
              <div>
                <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                  Сумма валюты (ℰQ):
                </label>
                <input
                  type="number"
                  min="10"
                  step="10"
                  required
                  value={rewardAmount}
                  onChange={e => setRewardAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full sm:w-64 px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-amber-300 font-mono-pip font-bold focus:outline-none focus:border-amber-400"
                />
              </div>
            )}

            {/* Text Color Picker (if text_color or both) */}
            {(rewardType === 'text_color' || rewardType === 'both') && (
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <span className="text-xs font-mono-pip text-zinc-300 font-bold block">
                  Выберите цвет текста в качестве награды (20 стилей):
                </span>
                <PaletteColorSelector
                  type="text"
                  selectedValue={selectedTextColor}
                  onSelect={(val, label) => {
                    setSelectedTextColor(val);
                    setSelectedTextColorLabel(label);
                  }}
                  sampleText={title || 'Название достижения'}
                />
              </div>
            )}

            {/* Background Picker (if profile_bg) */}
            {rewardType === 'profile_bg' && (
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <span className="text-xs font-mono-pip text-zinc-300 font-bold block">
                  Выберите фон профиля в качестве награды (20 оттенков):
                </span>
                <PaletteColorSelector
                  type="bg"
                  selectedValue={selectedBgColor}
                  onSelect={(val, label) => {
                    setSelectedBgColor(val);
                    setSelectedBgColorLabel(label);
                  }}
                />
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-mono-pip"
            >
              Отмена
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-950/50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Создать и активировать</span>
            </button>
          </div>
        </form>
      )}

      {/* List of Existing Achievements */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono-pip text-zinc-400 uppercase tracking-wider">
          <span>Существующие достижения ({achievements.length}):</span>
          <span>Отображаются у всех сталкеров в профиле</span>
        </div>

        {achievements.length === 0 ? (
          <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 text-center space-y-2">
            <Trophy className="w-10 h-10 text-zinc-600 mx-auto" />
            <h4 className="text-sm font-heading font-bold text-zinc-300 uppercase">
              Нет созданных достижений
            </h4>
            <p className="text-xs text-zinc-500 font-mono-pip">
              Нажмите «Создать достижение» вверху, чтобы добавить первое испытание для игроков.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map(ach => (
              <div
                key={ach.id}
                className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 flex items-start justify-between gap-4 shadow-xl hover:border-zinc-700 transition"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-amber-500/40 p-2 shrink-0 flex items-center justify-center shadow">
                    <img
                      src={ach.iconUrl}
                      alt={ach.title}
                      className="w-full h-full object-contain drop-shadow"
                    />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <h4 className="text-sm font-bold font-heading text-zinc-100 truncate">
                      {ach.title}
                    </h4>

                    {ach.description && (
                      <p className="text-xs font-mono-pip text-zinc-400 line-clamp-2">
                        {ach.description}
                      </p>
                    )}

                    <div className="text-[11px] font-mono-pip text-amber-300/90 font-bold">
                      Условие: {getConditionLabel(ach.type, ach.targetValue)}
                    </div>

                    {/* Reward tag */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-mono-pip">
                      <span className="text-zinc-500">Награда:</span>
                      {ach.rewardAmount && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                          +{ach.rewardAmount} ℰQ
                        </span>
                      )}
                      {ach.rewardCosmeticName && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                          {ach.rewardCosmeticName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteAchievement(ach.id)}
                  className="p-2 rounded-xl bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 border border-zinc-800 transition shrink-0"
                  title="Удалить достижение"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
