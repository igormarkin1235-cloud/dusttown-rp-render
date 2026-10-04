import React, { useState } from 'react';
import { CaseBox, CaseItemDefinition, UserProfile, InventoryItem } from '../types';
import { CaseGeometricSkin } from './CaseGeometricSkin';
import { Coins, Sparkles, X, Check, Eye, HelpCircle } from 'lucide-react';

interface CasesViewProps {
  cases: CaseBox[];
  caseItems: CaseItemDefinition[];
  currentUser: UserProfile;
  onOpenCase: (caseBox: CaseBox, wonItem: CaseItemDefinition) => void;
  onApplyCosmeticDirectly?: (item: CaseItemDefinition) => void;
  onOpenAdminPanel?: () => void;
  isAdmin: boolean;
}

export const CasesView: React.FC<CasesViewProps> = ({
  cases,
  caseItems,
  currentUser,
  onOpenCase,
  onApplyCosmeticDirectly,
  onOpenAdminPanel,
  isAdmin
}) => {
  const [openingCaseId, setOpeningCaseId] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isOpeningAnim, setIsOpeningAnim] = useState(false);
  const [wonItem, setWonItem] = useState<CaseItemDefinition | null>(null);
  const [previewCase, setPreviewCase] = useState<CaseBox | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStartOpening = (box: CaseBox) => {
    // Check balance
    const isInfinite = currentUser.isInfiniteEquivaxes || currentUser.username === '@MrWhitePio';
    if (!isInfinite && currentUser.equivaxes < box.price) {
      setErrorMsg(`Недостаточно Эквиваксов! Требуется: ${box.price} ℰQ (У вас: ${currentUser.equivaxes} ℰQ)`);
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    // Determine drop
    const possibleItems = caseItems.filter(i => box.dropItemIds.includes(i.id));
    const itemsPool = possibleItems.length > 0 ? possibleItems : caseItems;
    const randomWon = itemsPool[Math.floor(Math.random() * itemsPool.length)];

    setOpeningCaseId(box.id);
    setIsShaking(true);
    setErrorMsg(null);

    // Telegram Haptic
    try {
      (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred('heavy');
    } catch (e) {}

    // Sequence
    setTimeout(() => {
      setIsShaking(false);
      setIsOpeningAnim(true);
    }, 1200);

    setTimeout(() => {
      setIsOpeningAnim(false);
      setWonItem(randomWon);
      onOpenCase(box, randomWon);

      try {
        (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success');
      } catch (e) {}
    }, 2400);
  };

  const handleCloseWonModal = () => {
    setWonItem(null);
    setOpeningCaseId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📦</span>
            <h2 className="text-xl font-bold font-heading text-amber-400 uppercase tracking-wide">
              Кейсы и Реликвии Пустоши
            </h2>
          </div>
          <p className="mt-1 text-xs text-zinc-300 max-w-xl leading-relaxed">
            Открывайте контейнеры довоенных технологий за Эквиваксы! Испытайте удачу: выбивайте уникальные стили профиля, неоновые цвета и легендарную тему «Чёрное Древо Пустоши».
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono-pip font-extrabold text-sm flex items-center gap-1.5 shadow">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>
              {currentUser.isInfiniteEquivaxes || currentUser.username === '@MrWhitePio'
                ? '∞'
                : currentUser.equivaxes.toLocaleString()} ℰQ
            </span>
          </div>

          {isAdmin && onOpenAdminPanel && (
            <button
              onClick={onOpenAdminPanel}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono-pip border border-zinc-700"
            >
              Настройка кейсов
            </button>
          )}
        </div>
      </div>

      {/* Error alert if balance too low */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-950/70 border border-red-500 text-red-200 text-xs font-mono-pip text-center animate-fade-in shadow-lg">
          {errorMsg}
        </div>
      )}

      {/* Cases Grid */}
      {cases.length === 0 ? (
        <div className="p-10 rounded-3xl bg-zinc-950 border border-dashed border-zinc-800 text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mx-auto">
            📦
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold font-heading text-zinc-200">
              В Пустоши пока нет созданных кейсов
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              Все демонстрационные кейсы были очищены. Создайте свои уникальные контейнеры с редкими 3D-рамками, радиационными фонами и стилями текста в панели администратора!
            </p>
          </div>
          {isAdmin && onOpenAdminPanel && (
            <button
              onClick={onOpenAdminPanel}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-950/40 transition"
            >
              Перейти в админ-панель и создать кейс →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map(box => {
          const isCurrentlyOpening = openingCaseId === box.id;
          const isInfinite = currentUser.isInfiniteEquivaxes || currentUser.username === '@MrWhitePio';
          const canAfford = isInfinite || currentUser.equivaxes >= box.price;

          return (
            <div
              key={box.id}
              className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 shadow-xl flex flex-col justify-between transition-all"
            >
              <div>
                {/* Case Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold font-heading text-amber-300">
                      {box.name}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                      {box.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono-pip font-bold text-xs flex-shrink-0">
                    <Coins className="w-3.5 h-3.5" />
                    <span>{box.price} ℰQ</span>
                  </div>
                </div>

                {/* Geometric Case Visual Display */}
                <div className="my-6 py-4 flex items-center justify-center">
                  <CaseGeometricSkin
                    skinType={box.skinType}
                    isShaking={isCurrentlyOpening && isShaking}
                    isOpening={isCurrentlyOpening && isOpeningAnim}
                    size="md"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewCase(box)}
                  className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-mono-pip border border-zinc-800 flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Возможный лут ({box.dropItemIds.length})</span>
                </button>

                <button
                  type="button"
                  disabled={isCurrentlyOpening}
                  onClick={() => handleStartOpening(box)}
                  className={`px-5 py-2.5 rounded-xl font-heading font-black text-xs uppercase tracking-wider transition active:scale-95 shadow-lg flex items-center gap-1.5 ${
                    isCurrentlyOpening
                      ? 'bg-amber-600 text-black animate-pulse cursor-wait'
                      : canAfford
                      ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-950/50'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isCurrentlyOpening ? 'Открытие...' : `Открыть (${box.price} ℰQ)`}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Won Item Celebration Modal */}
      {wonItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-zinc-950 border-2 border-amber-500 shadow-2xl p-6 text-center text-zinc-100 space-y-4">
            {/* Close */}
            <button
              onClick={handleCloseWonModal}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-2xl animate-bounce">
              🎉
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono-pip text-amber-400 font-bold uppercase tracking-widest">
                ВАМ ВЫПАЛО:
              </span>
              <h3 className={`text-xl font-black font-heading ${wonItem.textStyle}`}>
                {wonItem.name}
              </h3>
              <span className="inline-block px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-mono-pip uppercase tracking-wider text-zinc-400">
                {wonItem.rarity}
              </span>
            </div>

            {/* Item Card Preview */}
            <div className={`p-4 rounded-2xl border bg-gradient-to-br ${wonItem.bgStyle} shadow-inner`}>
              <img
                src={wonItem.photoUrl}
                alt={wonItem.name}
                className="w-28 h-28 object-contain mx-auto filter drop-shadow-lg"
              />
            </div>

            {/* Direct Apply or Put to Inventory Buttons */}
            <div className="space-y-2 pt-2">
              {wonItem.type !== 'item' && onApplyCosmeticDirectly && (
                <button
                  onClick={() => {
                    onApplyCosmeticDirectly(wonItem);
                    handleCloseWonModal();
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider shadow-lg transition"
                >
                  Применить к профилю прямо сейчас!
                </button>
              )}

              <button
                onClick={handleCloseWonModal}
                className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono-pip text-xs transition"
              >
                Сохранить в инвентарь
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loot Preview Modal */}
      {previewCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl p-6 text-zinc-100 flex flex-col">
            <button
              onClick={() => setPreviewCase(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold font-heading text-amber-300 mb-1">
              Возможный лут: {previewCase.name}
            </h3>
            <p className="text-xs text-zinc-400 mb-4 font-mono-pip">
              Стоимость открытия: {previewCase.price} ℰQ
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              {caseItems
                .filter(i => previewCase.dropItemIds.includes(i.id))
                .map(item => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-2xl border bg-gradient-to-br ${item.bgStyle} flex flex-col justify-between`}
                  >
                    <div className="text-center">
                      <img
                        src={item.photoUrl}
                        alt={item.name}
                        className="w-14 h-14 object-contain mx-auto drop-shadow"
                      />
                      <span className={`block text-xs mt-2 line-clamp-2 ${item.textStyle}`}>
                        {item.name}
                      </span>
                    </div>
                    <span className="block text-center mt-2 text-[10px] font-mono-pip text-zinc-400 uppercase">
                      {item.rarity}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
