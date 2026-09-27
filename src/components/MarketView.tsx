import React, { useState } from 'react';
import {
  ShopWeeklyItem,
  AuctionListing,
  UserProfile,
  InventoryItem,
  CaseItemDefinition,
  Rarity
} from '../types';
import { AvatarWithFrame } from './AvatarWithFrame';
import {
  ShoppingBag,
  Gavel,
  Tag,
  Coins,
  Search,
  Plus,
  Trash2,
  Check,
  Sparkles,
  ArrowRight,
  Shield,
  Crown,
  AlertCircle,
  X,
  Flame
} from 'lucide-react';

interface MarketViewProps {
  currentUser: UserProfile;
  profiles: UserProfile[];
  weeklyItems: ShopWeeklyItem[];
  auctionListings: AuctionListing[];
  caseItems: CaseItemDefinition[];
  isAdmin: boolean;
  onBuyWeeklyItem: (item: ShopWeeklyItem) => void;
  onAddWeeklyItem: (newItem: ShopWeeklyItem) => void;
  onRemoveWeeklyItem: (itemId: string) => void;
  onListItemOnAuction: (item: InventoryItem, price: number) => void;
  onCancelAuctionListing: (listingId: string) => void;
  onBuyAuctionItem: (listing: AuctionListing) => void;
}

export const MarketView: React.FC<MarketViewProps> = ({
  currentUser,
  profiles,
  weeklyItems,
  auctionListings,
  caseItems,
  isAdmin,
  onBuyWeeklyItem,
  onAddWeeklyItem,
  onRemoveWeeklyItem,
  onListItemOnAuction,
  onCancelAuctionListing,
  onBuyAuctionItem
}) => {
  const [subTab, setSubTab] = useState<'weekly' | 'auction'>('weekly');
  const [search, setSearch] = useState('');
  const [filterRarity, setFilterRarity] = useState<string>('all');

  // Modals
  const [showAddWeeklyModal, setShowAddWeeklyModal] = useState(false);
  const [showListAuctionModal, setShowListAuctionModal] = useState(false);

  // New Weekly Item Form
  const [selectedCaseItemId, setSelectedCaseItemId] = useState(caseItems[0]?.id || '');
  const [weeklyPrice, setWeeklyPrice] = useState<number>(200);
  const [weeklyOldPrice, setWeeklyOldPrice] = useState<number>(280);
  const [weeklyBadge, setWeeklyBadge] = useState('ХИТ НЕДЕЛИ 🔥');

  // New Auction Listing Form
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState<string>(
    currentUser.inventory?.[0]?.id || ''
  );
  const [auctionAskingPrice, setAuctionAskingPrice] = useState<number>(100);

  const isOwner = currentUser.username.toLowerCase() === '@mrwhitepio';

  const handleAddWeeklySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sourceDef = caseItems.find(c => c.id === selectedCaseItemId);
    if (!sourceDef) return;

    const newItem: ShopWeeklyItem = {
      id: 'weekly_' + Date.now(),
      itemId: sourceDef.id,
      name: sourceDef.name,
      description: 'Эксклюзивный товар недели из довоенных хранилищ DustTown.',
      photoUrl: sourceDef.photoUrl,
      bgStyle: sourceDef.bgStyle,
      textStyle: sourceDef.textStyle,
      rarity: sourceDef.rarity,
      type: sourceDef.type,
      appliedValue: sourceDef.appliedValue,
      price: Math.max(1, weeklyPrice),
      oldPrice: weeklyOldPrice > weeklyPrice ? weeklyOldPrice : undefined,
      badge: weeklyBadge.trim() || undefined,
      addedBy: currentUser.username,
      addedAt: new Date().toISOString()
    };

    onAddWeeklyItem(newItem);
    setShowAddWeeklyModal(false);
  };

  const handleCreateAuctionListing = (e: React.FormEvent) => {
    e.preventDefault();
    const targetItem = currentUser.inventory?.find(i => i.id === selectedInventoryItemId);
    if (!targetItem) return;

    if (auctionAskingPrice <= 0) {
      alert('Укажите корректную цену в Эквиваксах!');
      return;
    }

    onListItemOnAuction(targetItem, Math.floor(auctionAskingPrice));
    setShowListAuctionModal(false);
  };

  const filteredAuction = auctionListings.filter(l => {
    const matchesSearch =
      l.item.name.toLowerCase().includes(search.toLowerCase()) ||
      l.sellerDisplayName.toLowerCase().includes(search.toLowerCase()) ||
      l.sellerUsername.toLowerCase().includes(search.toLowerCase());
    const matchesRarity = filterRarity === 'all' || l.item.rarity === filterRarity;
    return matchesSearch && matchesRarity;
  });

  const getRarityBadgeColor = (rarity: Rarity) => {
    switch (rarity) {
      case 'legendary':
        return 'text-amber-400 border-amber-500/60 bg-amber-950/40';
      case 'epic':
        return 'text-purple-400 border-purple-500/60 bg-purple-950/40';
      case 'rare':
        return 'text-cyan-400 border-cyan-500/60 bg-cyan-950/40';
      default:
        return 'text-zinc-400 border-zinc-700 bg-zinc-900/60';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-black font-heading text-amber-400 uppercase tracking-wider">
              Торговый Пост Даст Таун Колектив
            </h2>
          </div>
          <p className="mt-1 text-xs text-zinc-300 max-w-lg">
            Официальный магазин Пустошей: покупайте раритетные товары недели от администрации или торгуйте предметами с другими игроками на живом аукционе.
          </p>
        </div>

        {/* Balance Display */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-black/60 border border-amber-500/50 text-amber-300 font-mono-pip text-sm font-bold shadow-inner">
          <Coins className="w-4 h-4 text-amber-400" />
          <span>
            {currentUser.isInfiniteEquivaxes || isOwner
              ? 'Баланс: ∞ ℰQ'
              : `Баланс: ${currentUser.equivaxes.toLocaleString()} ℰQ`}
          </span>
        </div>
      </div>

      {/* Sub-tabs: Товары Недели vs Аукцион */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('weekly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-heading font-black uppercase tracking-wider transition ${
              subTab === 'weekly'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-900/40'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Товары Недели ({weeklyItems.length})</span>
          </button>

          <button
            onClick={() => setSubTab('auction')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-heading font-black uppercase tracking-wider transition ${
              subTab === 'auction'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-lg shadow-cyan-900/40'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Gavel className="w-4 h-4" />
            <span>Аукцион игроков ({auctionListings.length})</span>
          </button>
        </div>

        {/* Quick Action Button */}
        {subTab === 'weekly' && isAdmin && (
          <button
            onClick={() => setShowAddWeeklyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-heading font-bold uppercase transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Добавить товар</span>
          </button>
        )}

        {subTab === 'auction' && (
          <button
            onClick={() => setShowListAuctionModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-heading font-bold uppercase transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Выставить лот</span>
          </button>
        )}
      </div>

      {/* --- 1. ТОВАРЫ НЕДЕЛИ --- */}
      {subTab === 'weekly' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono-pip text-zinc-400 uppercase tracking-wider">
              ⭐ Регулярный завоз от караванщиков и торговцев Даст Таун Колектив
            </span>
          </div>

          {weeklyItems.length === 0 ? (
            <div className="p-12 rounded-3xl bg-zinc-950 border border-dashed border-zinc-800 text-center text-zinc-500 text-xs space-y-2">
              <ShoppingBag className="w-10 h-10 text-zinc-600 mx-auto" />
              <p>На этой неделе все товары распроданы. Загляните позже!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {weeklyItems.map(item => {
                const canAfford =
                  currentUser.isInfiniteEquivaxes || isOwner || currentUser.equivaxes >= item.price;

                return (
                  <div
                    key={item.id}
                    className={`relative rounded-3xl border overflow-hidden p-5 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] shadow-xl ${
                      item.bgStyle || 'bg-zinc-900/90 border-zinc-800'
                    }`}
                  >
                    {/* Badge */}
                    {item.badge && (
                      <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full bg-amber-500 text-black font-black text-[9px] uppercase tracking-wider shadow flex items-center gap-1">
                        <Flame className="w-2.5 h-2.5" />
                        <span>{item.badge}</span>
                      </div>
                    )}

                    {/* Admin Delete */}
                    {isAdmin && (
                      <button
                        onClick={() => onRemoveWeeklyItem(item.id)}
                        className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-black/60 hover:bg-red-950 text-zinc-400 hover:text-red-400 border border-zinc-800 transition"
                        title="Удалить из товаров недели"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div>
                      {/* Image Preview */}
                      <div className="relative w-full h-36 rounded-2xl overflow-hidden mb-3 bg-black/40 border border-white/10 flex items-center justify-center">
                        <img
                          src={item.photoUrl}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                        <span
                          className={`absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-mono-pip font-extrabold uppercase border backdrop-blur-md ${getRarityBadgeColor(
                            item.rarity
                          )}`}
                        >
                          {item.rarity}
                        </span>
                      </div>

                      {/* Title & Desc */}
                      <h3 className={`text-base font-bold font-heading line-clamp-1 ${item.textStyle || 'text-white'}`}>
                        {item.name}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-300/80 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Price & Buy Button */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                      <div>
                        {item.oldPrice && (
                          <div className="text-[10px] text-zinc-500 line-through font-mono-pip">
                            {item.oldPrice} ℰQ
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-amber-300 font-mono-pip font-bold text-sm">
                          <Coins className="w-3.5 h-3.5 text-amber-400" />
                          <span>{item.price} ℰQ</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onBuyWeeklyItem(item)}
                        disabled={!canAfford}
                        className={`px-4 py-2 rounded-xl text-xs font-heading font-black uppercase tracking-wider transition shadow-md flex items-center gap-1.5 ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-950/40'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Купить</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- 2. АУКЦИОН ИГРОКОВ --- */}
      {subTab === 'auction' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
              <input
                type="text"
                placeholder="Поиск по названию или продавцу..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {['all', 'legendary', 'epic', 'rare', 'common'].map(rarity => (
                <button
                  key={rarity}
                  onClick={() => setFilterRarity(rarity)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono-pip capitalize transition ${
                    filterRarity === rarity
                      ? 'bg-cyan-500 text-black font-bold shadow'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {rarity === 'all' ? 'Все' : rarity}
                </button>
              ))}
            </div>
          </div>

          {filteredAuction.length === 0 ? (
            <div className="p-12 rounded-3xl bg-zinc-950 border border-dashed border-zinc-800 text-center text-zinc-500 text-xs space-y-2">
              <Gavel className="w-10 h-10 text-zinc-600 mx-auto" />
              <p>На аукционе пока нет активных лотов. Будьте первым, кто выставит предмет из инвентаря!</p>
              <button
                onClick={() => setShowListAuctionModal(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold font-heading uppercase"
              >
                <Plus className="w-3.5 h-3.5" /> Выставить свой лот
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAuction.map(listing => {
                const isMyListing = listing.sellerId === currentUser.id;
                const canAfford =
                  currentUser.isInfiniteEquivaxes || isOwner || currentUser.equivaxes >= listing.price;
                const isSellerOwner = listing.sellerUsername.toLowerCase() === '@mrwhitepio';

                return (
                  <div
                    key={listing.id}
                    className={`rounded-3xl border border-zinc-800 p-4 bg-zinc-950/80 flex flex-col justify-between shadow-xl transition-all hover:border-cyan-500/40 ${
                      listing.item.bgStyle || ''
                    }`}
                  >
                    <div>
                      {/* Seller Tag */}
                      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-zinc-800/80 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={listing.sellerAvatarUrl}
                            alt={listing.sellerDisplayName}
                            className="w-5 h-5 rounded-full object-cover border border-zinc-700"
                          />
                          <span className="font-heading font-bold text-zinc-300 truncate">
                            {listing.sellerDisplayName}
                          </span>
                        </div>

                        {isSellerOwner ? (
                          <span className="badge-owner-shimmer text-black text-[8px] font-black uppercase px-1.5 py-0.2 rounded-full shadow">
                            Создатель
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500 font-mono-pip truncate">
                            {listing.sellerUsername}
                          </span>
                        )}
                      </div>

                      {/* Item Preview */}
                      <div className="relative w-full h-32 rounded-2xl overflow-hidden mb-3 bg-black/40 border border-white/10 flex items-center justify-center">
                        <img
                          src={listing.item.photoUrl}
                          alt={listing.item.name}
                          className="w-full h-full object-cover"
                        />
                        <span
                          className={`absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-mono-pip font-extrabold uppercase border backdrop-blur-md ${getRarityBadgeColor(
                            listing.item.rarity
                          )}`}
                        >
                          {listing.item.rarity}
                        </span>
                      </div>

                      <h4 className={`text-sm font-bold font-heading line-clamp-1 ${listing.item.textStyle || 'text-white'}`}>
                        {listing.item.name}
                      </h4>
                      <div className="text-[10px] text-zinc-400 font-mono-pip mt-0.5">
                        Выставлен: {new Date(listing.listedAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-cyan-300 font-mono-pip font-bold text-sm">
                        <Coins className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{listing.price} ℰQ</span>
                      </div>

                      {isMyListing ? (
                        <button
                          onClick={() => onCancelAuctionListing(listing.id)}
                          className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-200 text-xs font-heading font-bold uppercase transition"
                        >
                          Снять лот
                        </button>
                      ) : (
                        <button
                          onClick={() => onBuyAuctionItem(listing)}
                          disabled={!canAfford}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-black uppercase tracking-wider transition shadow flex items-center gap-1.5 ${
                            canAfford
                              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-cyan-950/40'
                              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                          }`}
                        >
                          <Gavel className="w-3.5 h-3.5" />
                          <span>Купить</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD WEEKLY ITEM (ADMIN ONLY) */}
      {showAddWeeklyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-zinc-950 border border-amber-500/50 p-6 shadow-2xl space-y-4 text-zinc-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-heading font-bold text-base">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>Добавление Товара Недели</span>
              </div>
              <button
                onClick={() => setShowAddWeeklyModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddWeeklySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                  Выберите предмет из каталога игры:
                </label>
                <select
                  value={selectedCaseItemId}
                  onChange={e => setSelectedCaseItemId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-400"
                >
                  {caseItems.map(c => (
                    <option key={c.id} value={c.id}>
                      [{c.rarity.toUpperCase()}] {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                    Цена продажи (ℰQ):
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={weeklyPrice}
                    onChange={e => setWeeklyPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-amber-300 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                    Старая цена (для скидки):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={weeklyOldPrice}
                    onChange={e => setWeeklyOldPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-400 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                  Бейдж/Шильдик (например «ХИТ НЕДЕЛИ 🔥» или «СКИДКА -30%»):
                </label>
                <input
                  type="text"
                  value={weeklyBadge}
                  onChange={e => setWeeklyBadge(e.target.value)}
                  placeholder="ХИТ НЕДЕЛИ 🔥"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider transition shadow-lg"
              >
                Опубликовать в товарах недели
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LIST ITEM ON AUCTION */}
      {showListAuctionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-zinc-950 border border-cyan-500/50 p-6 shadow-2xl space-y-4 text-zinc-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-heading font-bold text-base">
                <Gavel className="w-4 h-4 text-cyan-400" />
                <span>Выставить предмет на Аукцион</span>
              </div>
              <button
                onClick={() => setShowListAuctionModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(!currentUser.inventory || currentUser.inventory.length === 0) ? (
              <div className="p-6 rounded-2xl bg-zinc-900 text-center text-xs text-zinc-400 space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <p>Ваш инвентарь пуст! Откройте пару кейсов, чтобы получить предметы для продажи.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateAuctionListing} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                    Выберите предмет из своего инвентаря:
                  </label>
                  <select
                    value={selectedInventoryItemId}
                    onChange={e => setSelectedInventoryItemId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-cyan-400"
                  >
                    {currentUser.inventory.map(i => (
                      <option key={i.id} value={i.id}>
                        [{i.rarity.toUpperCase()}] {i.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono-pip text-zinc-300 mb-1">
                    Ваша цена продажи (ℰQ):
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={auctionAskingPrice}
                    onChange={e => setAuctionAskingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-cyan-300 font-mono text-base font-bold focus:outline-none focus:border-cyan-400"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1 font-mono-pip">
                    💡 Совет: средняя награда за РП-сессию составляет ~100 ℰQ.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-heading font-black text-xs uppercase tracking-wider transition shadow-lg"
                >
                  Разместить лот на аукционе
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
