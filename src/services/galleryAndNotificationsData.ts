import { ArtworkPost, AppNotification, BotVersionRecord } from '../types';

export const INITIAL_ARTWORKS: ArtworkPost[] = [
  {
    id: 'art_weekly_1',
    title: 'Страж Цитадели Стальных Крыльев',
    description: 'Боевой пегас-паладин в модифицированной силовой броне Т-51b на закате над руинами Старого Кантерлота. Заказная работа для гильдии.',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    artistName: 'ПипСкетчер',
    artistUsername: '@pip_artist',
    artistAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    likesCount: 142,
    likedByUserIds: ['owner_mrwhitepio', 'user_pip_77', 'user_veteran_bos'],
    tipsReceived: 1850,
    tags: ['Персонаж', 'Фракция', 'Силовая Броня', 'Диджитал'],
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    isWeeklyTop: true,
    promoBadge: '🏆 Топ-1 Недели',
    viewsCount: 1240
  },
  {
    id: 'art_weekly_2',
    title: 'Закат над Даст Тауном: Радиоактивный Пепел',
    description: 'Панорамный вид на центральную площадь Даст Тауна, вывеску Бара «Ржавый гвоздь» и неоновые огни сквозь туман светящегося шторма.',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    artistName: 'SparkleBrush',
    artistUsername: '@sparkle_brush',
    artistAvatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    likesCount: 108,
    likedByUserIds: ['owner_mrwhitepio', 'user_stalker_shadow'],
    tipsReceived: 1200,
    tags: ['Пейзаж', 'Пустошь', 'Неон', 'Атмосфера'],
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    isWeeklyTop: true,
    promoBadge: '🥈 Топ-2 Недели',
    viewsCount: 890
  },
  {
    id: 'art_weekly_3',
    title: 'Рейдерская Засада в Каньоне Сьерра-Мадре',
    description: 'Динамичный боевой концепт: перестрелка караванщиков с налётчиками у разбитого броневика довоенного анклава.',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    artistName: 'WastelandArt',
    artistUsername: '@wasteland_art',
    artistAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    likesCount: 84,
    likedByUserIds: ['owner_mrwhitepio'],
    tipsReceived: 950,
    tags: ['Бой', 'РП-Событие', 'Концепт', 'Экшн'],
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    isWeeklyTop: true,
    promoBadge: '🥉 Топ-3 Недели',
    viewsCount: 710
  },
  {
    id: 'art_recent_1',
    title: 'Полевой Медик Медицинского Анклава',
    description: 'Портрет единорога-хирурга с телекинетическим скальпелем и набором стимуляторов. Готов спасать раненых после тяжелых РП-вылазок.',
    imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80',
    artistName: 'DoctorDoc',
    artistUsername: '@doc_brush',
    artistAvatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    likesCount: 42,
    likedByUserIds: [],
    tipsReceived: 350,
    tags: ['Персонаж', 'Медицина', 'Фракция'],
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    viewsCount: 320
  },
  {
    id: 'art_recent_2',
    title: 'Торговец Каравана у Квантового Источника',
    description: 'Уставший земнопони-купец считает крышки и эквиваксы на привале возле мерцающей аномалии.',
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
    artistName: 'CaravanSketches',
    artistUsername: '@caravan_art',
    artistAvatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    likesCount: 36,
    likedByUserIds: [],
    tipsReceived: 200,
    tags: ['Торговля', 'Персонаж', 'Аномалия'],
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    viewsCount: 280
  },
  {
    id: 'art_recent_3',
    title: 'Разведчик в Оптическом Прицеле',
    description: 'Ночной скетч: снайпер на вышке радиовещания выслеживает мутировавших тварей Пустоши.',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    artistName: 'NightOwl',
    artistUsername: '@scout_draws',
    artistAvatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80',
    likesCount: 29,
    likedByUserIds: [],
    tipsReceived: 150,
    tags: ['Скетч', 'Снайпер', 'Ночь'],
    createdAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
    viewsCount: 215
  },
  {
    id: 'art_archive_1',
    title: 'Убежище 101: Первые Дни Выхода',
    description: 'Архивная историческая сцена: первые сталкеры ступают на выжженную радиоактивную землю.',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    artistName: 'VaultHistorian',
    artistUsername: '@vault_lore',
    artistAvatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    likesCount: 65,
    likedByUserIds: [],
    tipsReceived: 450,
    tags: ['История', 'Убежище', 'Лор'],
    createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    viewsCount: 540
  },
  {
    id: 'art_archive_2',
    title: 'Чертёж Водоочистительного Фильтра',
    description: 'Технический стилизованный чертёж и плакат пропаганды инженеров Даст Тауна.',
    imageUrl: 'https://images.unsplash.com/photo-1589793907316-f94025b46850?auto=format&fit=crop&w=800&q=80',
    artistName: 'MechanicBob',
    artistUsername: '@wasteland_tech',
    artistAvatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    likesCount: 51,
    likedByUserIds: [],
    tipsReceived: 300,
    tags: ['Чертёж', 'Техника', 'Инженерия'],
    createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    viewsCount: 430
  }
];

export const INITIAL_BOT_VERSIONS: BotVersionRecord[] = [
  {
    version: 'v3.0.0',
    releaseDate: '2026-09-28',
    title: '🎨 Арт-Лента Художников & Интерактивный Центр Уведомлений',
    description: 'Глобальное творческое обновление: запуск Галереи Пустоши с Топом Недели, продвижением авторов и чаевыми в ℰQ, а также кликабельный колокольчик уведомлений со связными переходами и отслеживанием файлов бота.',
    changedFiles: [
      {
        fileName: 'src/components/WeeklyArtShowcase.tsx',
        changeType: 'created',
        description: 'Выделенный компонент витрины Топ-3 артов недели в стилизованных рамках и адаптивный безопасный рендерер любых форматов изображений ArtSafeImage'
      },
      {
        fileName: 'src/components/ArtGalleryView.tsx',
        changeType: 'modified',
        description: 'Интеграция WeeklyArtShowcase, поддержка прямой загрузки файлов с устройства и защита от искажений'
      },
      {
        fileName: 'src/components/NotificationModal.tsx',
        changeType: 'created',
        description: 'Интерактивный центр уведомлений (колокольчик) со связными переходами и трекером изменений бота'
      },
      {
        fileName: 'src/components/NavigationDock.tsx',
        changeType: 'modified',
        description: 'Добавлена новая вкладка навигации «Арт-Лента» с иконкой палитры'
      },
      {
        fileName: 'src/components/MiniAppHeader.tsx',
        changeType: 'modified',
        description: 'Интегрирована кнопка колокольчика со светящимся бейджем новых уведомлений'
      },
      {
        fileName: 'src/types.ts',
        changeType: 'modified',
        description: 'Добавлены интерфейсы ArtworkPost, AppNotification, BotVersionRecord и расширен AppStateData'
      }
    ],
    highlights: [
      '👑 Топ-3 Арта Недели в золотых, серебряных и пламенных премиум-рамках',
      '🪙 Поддержка художников: отправка чаевых в Эквиваксах (ℰQ) напрямую автору',
      '🔔 Кликабельный колокольчик: мгновенный переход к артам, аукциону, ивентам, фракциям и VIP',
      '📂 Система отслеживания старых и новых файлов кода бота с журналом изменений'
    ],
    targetTab: 'gallery',
    targetActionLabel: 'Открыть Арт-Ленту'
  },
  {
    version: 'v2.9.0',
    releaseDate: '2026-09-28',
    title: '🎰 Переработка Шансов Лотереи Пустошей',
    description: 'Полная замена статической комбинации «333» на честную математическую модель шансов (10% джекпот, 40% малый выигрыш, 50% проигрыш).',
    changedFiles: [
      {
        fileName: 'src/components/LotteryScratchModal.tsx',
        changeType: 'refactored',
        description: 'Реализована функция determineLotteryOutcome с фиксированными вероятностями и анимациями'
      },
      {
        fileName: 'src/App.tsx',
        changeType: 'modified',
        description: 'Учет лотерейных транзакций для прогресса достижений даже при 0 ℰQ'
      },
      {
        fileName: 'src/components/PlayerProfileModal.tsx',
        changeType: 'modified',
        description: 'Убраны жестко заданные тройки при выдаче лотерейных билетов'
      }
    ],
    highlights: [
      '10% шанс на крупный джекпот билета (выпадают высшие цифры)',
      '40% шанс на малый утешительный куш',
      '50% шанс на проигрыш с интригой «почти победа»',
      'Информационный бейдж с отображением шансов на самом билете'
    ],
    targetTab: 'profile',
    targetActionLabel: 'Проверить Билеты в Профиле'
  },
  {
    version: 'v2.8.0',
    releaseDate: '2026-09-27',
    title: '🛡️ Интерактивные Анимации Карточек Фракций',
    description: 'Визуальный апгрейд раздела фракций Даст Тауна: эффект левитации, подсветка контуров и динамический неоновый свет при наведении.',
    changedFiles: [
      {
        fileName: 'src/components/FactionsView.tsx',
        changeType: 'modified',
        description: 'Добавлены плавные hover-анимации, масштабирование и неоновые тени'
      }
    ],
    highlights: [
      'Плавный подъем карточки при наведении (scale-1.02 & translate-y)',
      'Мягкое неоновое свечение в цветах фракции',
      'Интерактивный отклик герба и баннера'
    ],
    targetTab: 'factions',
    targetActionLabel: 'Посмотреть Фракции'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    type: 'new_art',
    title: '🎨 Новый шедевр в Арт-Галерее!',
    message: 'Художник @pip_artist опубликовал работу «Страж Цитадели Стальных Крыльев». Поддержите автора лайком!',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    isRead: false,
    targetTab: 'gallery',
    targetId: 'art_weekly_1',
    iconEmoji: '🎨',
    badge: 'АРТ',
    actionLabel: 'Смотреть Арт'
  },
  {
    id: 'notif_2',
    type: 'bot_update',
    title: '⚡ Бот обновлен до версии v3.0.0',
    message: 'Добавлена Арт-Лента для художников, колокольчик уведомлений со связными переходами и трекер изменений файлов!',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isRead: false,
    targetTab: 'gallery',
    iconEmoji: '🚀',
    badge: 'ОБНОВЛЕНИЕ',
    actionLabel: 'Журнал изменений файлов'
  },
  {
    id: 'notif_3',
    type: 'auction',
    title: '🔨 Горячий лот на аукционе!',
    message: 'Выставлена 3D-Рамка «Довоенное Золото Рейнджера». Текущая ставка: 1,200 ℰQ. Успейте побороться за лот!',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    isRead: false,
    targetTab: 'market',
    iconEmoji: '🔨',
    badge: 'АУКЦИОН',
    actionLabel: 'Перейти к аукциону'
  },
  {
    id: 'notif_4',
    type: 'event',
    title: '☢️ Новая РП-вылазка объявлена!',
    message: '«Рейд на Водоочистительную станцию Даст Тауна». Призовой фонд: +350 ℰQ каждому участнику.',
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    isRead: false,
    targetTab: 'events',
    iconEmoji: '📅',
    badge: 'ИВЕНТ',
    actionLabel: 'Открыть событие'
  },
  {
    id: 'notif_5',
    type: 'new_vip',
    title: '👑 Новый VIP-сталкер в Пустоши!',
    message: 'Пользователь @MrWhitePio активировал VIP-привилегию «Властелин Пустоши».',
    timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    isRead: true,
    targetTab: 'profile',
    targetId: 'owner_mrwhitepio',
    iconEmoji: '👑',
    badge: 'VIP',
    actionLabel: 'Открыть профиль'
  },
  {
    id: 'notif_6',
    type: 'faction',
    title: '🛡️ Фракция открыла набор бойцов!',
    message: 'Фракция «Стальные Крылья» повысила ежедневную ставку до 15 ℰQ/день. Вступайте в ряды!',
    timestamp: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
    isRead: true,
    targetTab: 'factions',
    iconEmoji: '🛡️',
    badge: 'ФРАКЦИЯ',
    actionLabel: 'К фракциям'
  },
  {
    id: 'notif_7',
    type: 'case',
    title: '📦 Новые поставки в магазин кейсов',
    message: 'Прибыл «Квантовый Кристаллический Контейнер» с шансом выпадения анимированных тем профиля!',
    timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    isRead: true,
    targetTab: 'cases',
    iconEmoji: '📦',
    badge: 'КЕЙСЫ',
    actionLabel: 'В кейсы'
  },
  {
    id: 'notif_8',
    type: 'new_user',
    title: '👋 Новый житель Даст Тауна',
    message: 'К сообществу присоединился сталкер @ShadowRunner. Добро пожаловать на Пустоши!',
    timestamp: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
    isRead: true,
    targetTab: 'characters',
    iconEmoji: '👋',
    badge: 'СООБЩЕСТВО',
    actionLabel: 'К анкетам'
  }
];
