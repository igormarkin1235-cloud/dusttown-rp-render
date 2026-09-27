import React, { useState } from 'react';
import { CharacterSheet, UserProfile } from '../types';
import { ImageUploadInput } from './ImageUploadInput';
import { Sparkles, Plus, Search, Filter, User, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface CharactersViewProps {
  characters: CharacterSheet[];
  currentUser: UserProfile;
  onCreateCharacter: (char: CharacterSheet) => void;
  onSelectCharacter: (char: CharacterSheet) => void;
}

const FACTION_OPTIONS = [
  'Все фракции',
  'Ополчение DustTown',
  'Вольные Сталкеры',
  'Стальные Рейнджеры',
  'Торговая Гильдия',
  'Анклав Пегасов',
  'Последователи Апокалипсиса',
  'Одиночка / Без фракции'
];

export const CharactersView: React.FC<CharactersViewProps> = ({
  characters,
  currentUser,
  onCreateCharacter,
  onSelectCharacter
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [search, setSearch] = useState('');
  const [factionFilter, setFactionFilter] = useState('Все фракции');

  // Form State initialized with template defaults
  const [formData, setFormData] = useState({
    creatorTelegram: currentUser.username || '@Player',
    creatorDustTownName: '',
    name: '',
    surname: '',
    patronymic: '',
    nickname: '',
    age: '',
    race: 'Единорог',
    cutieMark: '',
    magic: '',
    hobby: '',
    job: '',
    faction: 'Ополчение DustTown',
    relatives: '',
    character: '',
    biography: '',
    features: '',
    track: '',
    voice: '',
    photoUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    avatarIcon: currentUser.avatarUrl || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=200&q=80',
    plusCustom: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newChar: CharacterSheet = {
      id: 'char_' + Date.now(),
      creatorTelegram: formData.creatorTelegram || currentUser.username,
      creatorDustTownName: formData.creatorDustTownName || '—',
      name: formData.name,
      surname: formData.surname || '—',
      patronymic: formData.patronymic || '—',
      nickname: formData.nickname || '—',
      age: formData.age || '—',
      race: formData.race,
      cutieMark: formData.cutieMark || '—',
      magic: formData.magic || '—',
      hobby: formData.hobby || '—',
      job: formData.job || '—',
      faction: formData.faction,
      relatives: formData.relatives || '—',
      character: formData.character || '—',
      biography: formData.biography || '—',
      features: formData.features || '—',
      track: formData.track || '—',
      voice: formData.voice || '—',
      photoUrl: formData.photoUrl || formData.avatarIcon,
      avatarIcon: formData.avatarIcon || formData.photoUrl,
      plusCustom: formData.plusCustom || '—',
      createdAt: new Date().toISOString(),
      status: 'approved'
    };

    onCreateCharacter(newChar);
    setIsCreating(false);
  };

  const filteredCharacters = characters.filter(char => {
    const matchesSearch =
      char.name.toLowerCase().includes(search.toLowerCase()) ||
      char.creatorTelegram.toLowerCase().includes(search.toLowerCase()) ||
      char.faction.toLowerCase().includes(search.toLowerCase());

    const matchesFaction =
      factionFilter === 'Все фракции' || char.faction === factionFilter;

    return matchesSearch && matchesFaction;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/30 via-zinc-900 to-zinc-950 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <h2 className="text-xl font-bold font-heading text-amber-400 uppercase tracking-wide">
              Анкеты персонажей DustTown
            </h2>
          </div>
          <p className="mt-1 text-xs text-zinc-300 max-w-xl leading-relaxed">
            В этом разделе собраны анкеты всех персонажей! Это помогает знать, кто с нами выживает в пустошах и за кого вы играете.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-bold text-xs shadow-lg shadow-amber-950/40 flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? 'Закрыть форму' : 'Создать персонажа'}</span>
        </button>
      </div>

      {/* Guide Dropdown according to user prompt */}
      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 overflow-hidden">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full p-3.5 flex items-center justify-between text-left text-xs text-amber-300 font-heading font-bold hover:bg-zinc-800/40 transition"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>💡 Как правильно заполнять анкету персонажа (Правила и подсказки)</span>
          </div>
          {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showGuide && (
          <div className="p-4 pt-1 border-t border-zinc-800 text-xs text-zinc-300 space-y-2.5 font-mono-pip bg-black/40">
            <div className="text-amber-400 font-bold">✧ ▬▭▬ ▬▭▬ ▬▭▬ ▬▭▬ ✧</div>
            <p className="text-zinc-200">
              Здесь нет жесткой духоты, но сохранять изначальную форму анкеты обязательно. Чтобы вам было проще, мы оставили в шаблоне специальные пометки:
            </p>
            <div className="space-y-1.5 pl-2 border-l-2 border-amber-500/50">
              <div><strong className="text-amber-300">(*) (Одна звездочка)</strong> — Пункт по желанию. Не хотите заполнять? Просто ставьте прочерк.</div>
              <div><strong className="text-amber-300">(**) (Две звездочки)</strong> — Тоже по желанию. Можно поставить прочерк, пару слов, или подробное полотно текста.</div>
              <div><strong className="text-amber-300">(+) (Плюсик)</strong> — Место для вашей фантазии. Арсенал сумок, тайники, особые привычки.</div>
              <div><strong className="text-amber-300">[текст] (Квадратные скобки)</strong> — Наша подсказка. Прочитали, стерли скобки с текстом и написали свое.</div>
            </div>
            <div className="text-amber-400 font-bold">─── ･ ｡ﾟ☆: .☽ . :☆ﾟ. ───</div>
          </div>
        )}
      </div>

      {/* Create Character Form Modal / Inline Box */}
      {isCreating && (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-3xl bg-zinc-900 border-2 border-amber-500/60 shadow-2xl space-y-5 animate-fade-in"
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-lg font-bold font-heading text-amber-400 uppercase">
              Новая анкета персонажа
            </h3>
            <span className="text-xs text-zinc-400 font-mono-pip">Заполните поля по шаблону</span>
          </div>

          {/* Section: Telegram Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono-pip text-amber-300 mb-1">
                Юз и имя ТГ аккаунта:
              </label>
              <input
                type="text"
                required
                value={formData.creatorTelegram}
                onChange={e => setFormData({ ...formData, creatorTelegram: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono-pip text-amber-300 mb-1">
                Имя аккаунта в ДТ*:
              </label>
              <input
                type="text"
                placeholder="Если нет — ставьте прочерк"
                value={formData.creatorDustTownName}
                onChange={e => setFormData({ ...formData, creatorDustTownName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="text-center text-zinc-600 font-mono text-xs">─── ･ ｡ﾟ☆: .☽ . :☆ﾟ. ───</div>

          {/* Section: Core Character Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">Имя: *обязательно*</label>
              <input
                type="text"
                required
                placeholder="Например: Айрон"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono-pip text-zinc-400 mb-1">Фамилия*:</label>
              <input
                type="text"
                placeholder="—"
                value={formData.surname}
                onChange={e => setFormData({ ...formData, surname: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono-pip text-zinc-400 mb-1">Кликуха\Прозвище*:</label>
              <input
                type="text"
                placeholder="—"
                value={formData.nickname}
                onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">Сколько лет:</label>
              <input
                type="text"
                placeholder="Например: 24 года"
                value={formData.age}
                onChange={e => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">Раса:</label>
              <select
                value={formData.race}
                onChange={e => setFormData({ ...formData, race: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              >
                <option value="Единорог">Единорог</option>
                <option value="Пегас">Пегас</option>
                <option value="Земной пони">Земной пони</option>
                <option value="Зебра">Зебра</option>
                <option value="Грифон">Грифон</option>
                <option value="Гуль">Гуль (Радиоактивный пони)</option>
                <option value="Чейнджлинг">Чейнджлинг</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">Фракция:</label>
              <select
                value={formData.faction}
                onChange={e => setFormData({ ...formData, faction: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              >
                {FACTION_OPTIONS.filter(f => f !== 'Все фракции').map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-center text-zinc-600 font-mono text-xs">─── ･ ｡ﾟ☆: .☽ . :☆ﾟ. ───</div>

          {/* Section: Magic & Cutie Mark */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                Знак отличия: [описание, артик\фотка, или прочерк]
              </label>
              <textarea
                rows={2}
                placeholder="Описание кьютимарки..."
                value={formData.cutieMark}
                onChange={e => setFormData({ ...formData, cutieMark: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                Магия: [цвет магии, какая именно магия]
              </label>
              <textarea
                rows={2}
                placeholder="Цвет ауры и тип заклинаний..."
                value={formData.magic}
                onChange={e => setFormData({ ...formData, magic: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Section: Character & Bio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                Характер**: [пара слов или полотно]
              </label>
              <textarea
                rows={3}
                placeholder="Опишите нрав персонажа..."
                value={formData.character}
                onChange={e => setFormData({ ...formData, character: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                Биография**: [история персонажа]
              </label>
              <textarea
                rows={3}
                placeholder="Откуда прибыл, что пережил в Пустоши..."
                value={formData.biography}
                onChange={e => setFormData({ ...formData, biography: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Section: Audio & Media & Avatar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImageUploadInput
              label="Иконка-аватар персонажа (из галереи или URL):"
              value={formData.avatarIcon}
              onChange={url => setFormData({ ...formData, avatarIcon: url })}
              placeholder="Загрузите из галереи или вставьте URL..."
            />
            <ImageUploadInput
              label="Фото / Скриншот персонажа (из галереи или URL):"
              value={formData.photoUrl}
              onChange={url => setFormData({ ...formData, photoUrl: url })}
              placeholder="Загрузите арт или фото персонажа..."
            />
          </div>

          {/* Section: Plus Custom */}
          <div>
            <label className="block text-xs font-mono-pip text-amber-300 mb-1">
              Плюсик (+): [арсенал сумок, оружие, инвентарь, особые вещи]
            </label>
            <textarea
              rows={2}
              placeholder="Дополнительные детали от вашей фантазии..."
              value={formData.plusCustom}
              onChange={e => setFormData({ ...formData, plusCustom: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono-pip"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs tracking-wider uppercase shadow-lg shadow-amber-950/40"
            >
              Сохранить анкету
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
          <input
            type="text"
            placeholder="Поиск по имени, создателю или фракции..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={factionFilter}
            onChange={e => setFactionFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 focus:outline-none focus:border-amber-500 font-mono-pip"
          >
            {FACTION_OPTIONS.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Characters List Cards with Click to Open Sheet Modal */}
      {filteredCharacters.length === 0 ? (
        <div className="p-8 rounded-2xl bg-zinc-900/40 border border-dashed border-zinc-800 text-center text-sm text-zinc-500">
          Персонажей не найдено. Создайте первую анкету!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCharacters.map(char => (
            <div
              key={char.id}
              onClick={() => onSelectCharacter(char)}
              className="group p-4 rounded-3xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/60 shadow-lg hover:shadow-amber-950/20 transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Character Photo / Icon & Basic info */}
                <div className="flex items-start gap-3.5">
                  <div className="relative flex-shrink-0">
                    <img
                      src={char.avatarIcon || char.photoUrl}
                      alt={char.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/60 group-hover:border-amber-400 shadow transition"
                    />
                    <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded bg-black/80 text-[9px] font-mono-pip text-amber-300 border border-zinc-700">
                      {char.race.substring(0, 3)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-bold font-heading text-zinc-100 group-hover:text-amber-400 transition leading-tight truncate">
                      {char.name} {char.surname !== '—' ? char.surname : ''}
                    </h4>
                    {char.nickname && char.nickname !== '—' && (
                      <span className="text-[11px] text-amber-400 font-mono-pip">
                        «{char.nickname}»
                      </span>
                    )}
                    <div className="text-[10px] text-zinc-400 font-mono-pip mt-0.5">
                      {char.faction}
                    </div>
                  </div>
                </div>

                {/* Snippet Bio / Features */}
                <p className="mt-3 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {char.biography !== '—' ? char.biography : char.character !== '—' ? char.character : 'Анкета заполнена сталкером.'}
                </p>
              </div>

              {/* Footer with Creator and Sheet action */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono-pip text-zinc-400">
                <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                  <User className="w-3 h-3 text-amber-500" />
                  <span className="truncate">{char.creatorTelegram}</span>
                </div>
                <span className="text-amber-400 group-hover:underline">
                  Анкета →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
