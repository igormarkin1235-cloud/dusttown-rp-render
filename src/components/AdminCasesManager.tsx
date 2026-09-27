import React, { useState } from 'react';
import { CaseBox, CaseItemDefinition, Rarity } from '../types';
import { CaseGeometricSkin } from './CaseGeometricSkin';
import { ImageUploadInput } from './ImageUploadInput';
import { Package, Plus, Trash2, Sparkles, Eye, Palette } from 'lucide-react';

interface AdminCasesManagerProps {
  cases: CaseBox[];
  caseItems: CaseItemDefinition[];
  onCreateCase: (newCase: CaseBox) => void;
  onDeleteCase: (caseId: string) => void;
  onCreateItem: (newItem: CaseItemDefinition) => void;
}

export const AdminCasesManager: React.FC<AdminCasesManagerProps> = ({
  cases,
  caseItems,
  onCreateCase,
  onDeleteCase,
  onCreateItem
}) => {
  // Case Form State
  const [caseName, setCaseName] = useState('');
  const [casePrice, setCasePrice] = useState(100);
  const [caseDescription, setCaseDescription] = useState('');
  const [skinType, setSkinType] = useState<CaseBox['skinType']>('supply_crate');
  const [animationType, setAnimationType] = useState<CaseBox['animationType']>('shake_burst');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Item / Cosmetic Form State
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState<CaseItemDefinition['type']>('profile_text_color');
  const [itemRarity, setItemRarity] = useState<Rarity>('epic');
  const [itemPhotoUrl, setItemPhotoUrl] = useState('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=80');
  const [itemAppliedValue, setItemAppliedValue] = useState('text-cyan-400 font-bold');

  const toggleItemSelection = (id: string) => {
    if (selectedItemIds.includes(id)) {
      setSelectedItemIds(selectedItemIds.filter(i => i !== id));
    } else {
      setSelectedItemIds([...selectedItemIds, id]);
    }
  };

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseName.trim()) return;

    const newCase: CaseBox = {
      id: 'case_' + Date.now(),
      name: caseName.trim(),
      price: Math.max(10, Number(casePrice)),
      description: caseDescription.trim() || 'Новый контейнер пустошей с редким лутом.',
      skinType,
      animationType,
      dropItemIds: selectedItemIds.length > 0 ? selectedItemIds : caseItems.slice(0, 4).map(i => i.id)
    };

    onCreateCase(newCase);
    setCaseName('');
    setCaseDescription('');
    setSelectedItemIds([]);
  };

  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    let bgStyle = 'from-zinc-900 to-zinc-950 border-zinc-700';
    let textStyle = 'text-zinc-200';

    if (itemType === 'profile_text_color') {
      bgStyle = 'from-indigo-950/60 to-purple-950/40 border-purple-500/50';
      textStyle = itemAppliedValue;
    } else if (itemType === 'profile_text_bg') {
      bgStyle = 'from-slate-900 to-zinc-950 border-cyan-500/40';
      textStyle = 'text-cyan-200';
    } else if (itemType === 'profile_theme') {
      bgStyle = 'from-stone-950 via-rose-950/40 to-zinc-950 border-rose-600/50';
      textStyle = 'text-rose-300 font-bold';
    } else if (itemType === 'avatar_frame') {
      bgStyle = 'from-amber-950/60 via-zinc-950 to-yellow-950 border-amber-500/60';
      textStyle = 'text-amber-300 font-bold';
    }

    const newItem: CaseItemDefinition = {
      id: 'custom_item_' + Date.now(),
      name: itemName.trim(),
      photoUrl: itemPhotoUrl,
      bgStyle,
      textStyle,
      rarity: itemRarity,
      type: itemType,
      appliedValue: itemAppliedValue
    };

    onCreateItem(newItem);
    setIsCreatingItem(false);
    setItemName('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold font-heading text-amber-400 uppercase tracking-wide">
          Управление кейсами и лутом
        </h3>
        <p className="text-xs text-zinc-400">
          Создавайте и удаляйте кейсы с выбором геометрического скина (с живым примером!), анимацией и настраивайте выпадающие предметы (включая цвета текста и фоны профиля).
        </p>
      </div>

      {/* Case Creation Form */}
      <form
        onSubmit={handleCreateCase}
        className="p-5 rounded-2xl bg-zinc-900 border border-amber-500/40 shadow-xl space-y-4"
      >
        <div className="flex items-center gap-2 text-sm font-bold font-heading text-amber-300">
          <Package className="w-4 h-4 text-amber-400" />
          <span>Конструктор нового кейса</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono-pip text-amber-300 mb-1">
              Название кейса:
            </label>
            <input
              type="text"
              required
              placeholder="Например: Ящик Брони Анклава"
              value={caseName}
              onChange={e => setCaseName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono-pip text-amber-300 mb-1">
              Стоимость (в Эквиваксах ℰQ):
            </label>
            <input
              type="number"
              min="10"
              required
              value={casePrice}
              onChange={e => setCasePrice(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
            Описание кейса:
          </label>
          <input
            type="text"
            placeholder="Что скрывается внутри этого контейнера..."
            value={caseDescription}
            onChange={e => setCaseDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Skin Selection with Live Geometric Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-mono-pip text-zinc-300 mb-2">
              Внешний вид и геометрия кейса:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'supply_crate', label: 'Ящик Снабжения (Металл + Болты)' },
                { type: 'quantum_crystal', label: 'Квантовый Кристалл (Ромб + Неон)' },
                { type: 'reliquary', label: 'Реликварий (Золото + Крылья)' },
                { type: 'cosmetic_box', label: 'Косметик-Бокс (Призма)' }
              ].map(s => (
                <button
                  key={s.type}
                  type="button"
                  onClick={() => setSkinType(s.type as any)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-heading font-bold transition ${
                    skinType === s.type
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Animation Selector */}
            <div className="mt-3">
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                Тип анимации открытия:
              </label>
              <select
                value={animationType}
                onChange={e => setAnimationType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono-pip"
              >
                <option value="shake_burst">Встряска и световая вспышка (Shake Burst)</option>
                <option value="crystal_split">Раскол кристалла на грани (Crystal Split)</option>
                <option value="golden_unfold">Золотое развертывание (Golden Unfold)</option>
              </select>
            </div>
          </div>

          {/* Live Preview of Skin */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center">
            <span className="text-[10px] font-mono-pip text-zinc-500 uppercase mb-2">
              Живой пример геометрии:
            </span>
            <CaseGeometricSkin skinType={skinType} size="sm" />
          </div>
        </div>

        {/* Drop Items Picker */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <label className="text-xs font-mono-pip text-zinc-300">
              Выберите выпадающие предметы (выбрано: {selectedItemIds.length}):
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const frameIds = caseItems.filter(i => i.type === 'avatar_frame').map(i => i.id);
                  setSelectedItemIds(Array.from(new Set([...selectedItemIds, ...frameIds])));
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-amber-300 hover:bg-zinc-700 font-mono-pip border border-zinc-700"
              >
                + Все рамки
              </button>
              <button
                type="button"
                onClick={() => {
                  const themeIds = caseItems.filter(i => i.type === 'profile_theme').map(i => i.id);
                  setSelectedItemIds(Array.from(new Set([...selectedItemIds, ...themeIds])));
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-emerald-300 hover:bg-zinc-700 font-mono-pip border border-zinc-700"
              >
                + Все темы
              </button>
              <button
                type="button"
                onClick={() => setSelectedItemIds(caseItems.map(i => i.id))}
                className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 hover:bg-zinc-700 font-mono-pip border border-zinc-700"
              >
                Выбрать всё
              </button>
              <button
                type="button"
                onClick={() => setSelectedItemIds([])}
                className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-mono-pip border border-zinc-700"
              >
                Снять выбор
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingItem(!isCreatingItem)}
                className="text-xs font-mono-pip text-amber-400 hover:underline flex items-center gap-1 ml-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Создать свой</span>
              </button>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto p-2 rounded-xl bg-zinc-950 border border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {caseItems.map(item => {
              const isSelected = selectedItemIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleItemSelection(item.id)}
                  className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={item.photoUrl} alt={item.name} className="w-7 h-7 rounded object-contain" />
                    <span className="text-xs truncate font-mono-pip">{item.name}</span>
                  </div>
                  <span className="text-[9px] uppercase px-1 rounded bg-black/60 font-mono-pip">
                    {item.rarity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider shadow"
          >
            Создать кейс
          </button>
        </div>
      </form>

      {/* New Item / Cosmetic Modal Form */}
      {isCreatingItem && (
        <form
          onSubmit={handleCreateNewItem}
          className="p-5 rounded-2xl bg-zinc-900 border-2 border-purple-500/50 shadow-2xl space-y-4 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold font-heading text-purple-300 uppercase flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-400" />
              <span>Добавить предмет или косметику профиля</span>
            </h4>
            <button
              type="button"
              onClick={() => setIsCreatingItem(false)}
              className="text-xs text-zinc-400 font-mono-pip"
            >
              Отмена
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">Название:</label>
              <input
                type="text"
                required
                placeholder="Стиль: Неоновый Лазурный"
                value={itemName}
                onChange={e => setItemName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">Тип лута:</label>
              <select
                value={itemType}
                onChange={e => setItemType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono-pip"
              >
                <option value="avatar_frame">Рамка для аватарки (3D / Анимированная / Неон)</option>
                <option value="profile_theme">Анимированная тема профиля (Радиация / Квант / Неон)</option>
                <option value="profile_text_color">Цвет текста профиля</option>
                <option value="profile_text_bg">Фон карточки профиля</option>
                <option value="item">Обычный предмет / Оружие / Артефакт</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">Редкость:</label>
              <select
                value={itemRarity}
                onChange={e => setItemRarity(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono-pip"
              >
                <option value="common">Common (Обычный)</option>
                <option value="rare">Rare (Редкий)</option>
                <option value="epic">Epic (Эпический)</option>
                <option value="legendary">Legendary (Легендарный)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <ImageUploadInput
              label="Фотография / Иконка предмета (из галереи или URL):"
              value={itemPhotoUrl}
              onChange={setItemPhotoUrl}
              helperText="Нажмите «Из галереи», чтобы загрузить своё фото с телефона или ПК."
            />

            <div>
              <label className="block text-xs font-mono-pip text-zinc-300 mb-1">Применяемый CSS-класс / Значение:</label>
              <input
                type="text"
                value={itemAppliedValue}
                onChange={e => setItemAppliedValue(e.target.value)}
                placeholder="text-cyan-400 font-bold"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-heading font-black text-xs uppercase shadow"
            >
              Добавить в базу предметов
            </button>
          </div>
        </form>
      )}

      {/* Existing Cases List with Delete Button */}
      <div className="space-y-3">
        <h4 className="text-xs font-mono-pip text-zinc-400 uppercase tracking-wider font-bold">
          Доступные кейсы в магазине ({cases.length}):
        </h4>

        <div className="space-y-2">
          {cases.map(box => (
            <div
              key={box.id}
              className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <CaseGeometricSkin skinType={box.skinType} size="sm" />
                <div>
                  <h5 className="text-sm font-bold font-heading text-amber-300">
                    {box.name}
                  </h5>
                  <div className="text-xs text-zinc-400 font-mono-pip">
                    Цена: <span className="text-amber-400 font-bold">{box.price} ℰQ</span> • Предметов в пуле:{' '}
                    {box.dropItemIds.length}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDeleteCase(box.id)}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 border border-zinc-800 transition"
                title="Удалить кейс"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
