import React, { useState, useRef } from "react";

/**
 * Глобальный статический массив доступных лабораторных комнат.
 * В продакшене этот список должен запрашиваться с бэкенда (например, через useEffect).
 */
// Найти в самом верху LearnPage.js и заменить:
const JS_TASKS = [
  {
    id: "unit-1",
    index: "1",
    title: "Основы JavaScript",
    description: "Базовый синтаксис, стрелочные функции и стейт.",
    difficulty: "Легкий",
    difficultyColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    xpReward: 250,
  },
  {
    id: "unit-2",
    index: "2",
    title: "Асинхронный JS & API",
    description: "Promises, async/await и fetch-запросы.",
    difficulty: "Срений",
    difficultyColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    xpReward: 250,
  },
  {
    id: "unit-3",
    index: "3",
    title: "Безопасность Node.js",
    description: "Уязвимости, SQL-инъекции и защита JWT.",
    difficulty: "Жесткий",
    difficultyColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    xpReward: 500,
  },
  // ПОЛНОЦЕННЫЙ ЧЕТВЕРТЫЙ УРОК
  {
    id: "unit-4",
    index: "4",
    title: "Счётчик",
    description:
      "Напишите работающий счетчик внутри лексического окружения функции.",
    difficulty: "Легкий",
    difficultyColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    xpReward: 300,
  },
];

const TS_TASKS = [
  {
    id: "unit-ts",
    index: "5",
    title: "TypeScript: Типы и интерфейсы",
    description: "Погрузитесь в типизацию и интерфейсы, которые делают код предсказуемым.",
    difficulty: "Средний",
    difficultyColor: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    xpReward: 300,
  },
];

const PYTHON_TASKS = [
  {
    id: "unit-python",
    index: "6",
    title: "Python: синтаксис и коллекции",
    description: "Изучите print(), списки и кортежи в одном из самых популярных языков.",
    difficulty: "Средний",
    difficultyColor: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    xpReward: 300,
  },
];

const ALGO_TASKS = [
  {
    id: "unit-algo",
    index: "7",
    title: "Алгоритмы: сложность и структуры",
    description: "Разберитесь с базовыми алгоритмами и оценкой их эффективности.",
    difficulty: "Жесткий",
    difficultyColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    xpReward: 350,
  },
];

const DB_TASKS = [
  {
    id: "unit-db",
    index: "8",
    title: "Базы данных: SQL-запросы",
    description: "Соберите точный SQL-запрос и поймите, как фильтровать данные.",
    difficulty: "Средний",
    difficultyColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    xpReward: 300,
  },
];

const ARCH_TASKS = [
  {
    id: "unit-arch",
    index: "9",
    title: "Архитектура: паттерны и REST",
    description: "Познакомьтесь с MVC и REST API в разработке приложений.",
    difficulty: "Средний",
    difficultyColor: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
    xpReward: 300,
  },
];

const SECURITY_TASKS = [
  {
    id: "unit-security",
    index: "10",
    title: "Безопасность: XSS и SQL-инъекции",
    description: "Научитесь защищать ввод пользователя и предотвращать атаки.",
    difficulty: "Жесткий",
    difficultyColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    xpReward: 400,
  },
];

/**
 * Список категорий для верхней навигационной панели (LeetCode-style).
 */
const CATEGORIES = [
  { id: "all", label: "Все темы", icon: "📁" },
  { id: "js", label: "JavaScript", icon: "⚡" },
  { id: "ts", label: "TypeScript", icon: "🔷" },
  { id: "python", label: "Python", icon: "🐍" },
  { id: "algo", label: "Алгоритмы", icon: "⚙️" },
  { id: "db", label: "База данных", icon: "🗄️" },
  { id: "arch", label: "Архитектура", icon: "🏛️" },
  { id: "security", label: "Безопасность", icon: "🛡️" },
];

/**
 * Компонент LearnPage является основным центром обучения платформы.
 * Отображает список доступных модулей с фильтрацией по темам и поисковой строкой.
 *
 * @param {Function} onStartLesson - Триггер запуска лабораторной работы (передает roomId в App.js)
 * @param {Object} user - Данные текущей сессии кодера (для проверки XP-лимитов и решенных задач)
 */
export default function LearnPage({ onStartLesson, user }) {
  // Текущая активная категория фильтра (по умолчанию "js")
  const [activeCategory, setActiveCategory] = useState("js");
  // Строка текстового поиска по названиям задач
  const [searchQuery, setSearchQuery] = useState("");

  // Реф для прямого управления DOM-контейнером горизонтальной ленты категорий
  const tabsRef = useRef(null);

  /**
   * Метод плавной прокрутки ленты категорий при клике на стрелочки-навигаторы.
   * @param {String} direction - Направление смещения ('left' или 'right')
   */
  const scrollTabs = (direction) => {
    if (tabsRef.current) {
      const scrollAmount = 200; // Шаг смещения в пикселях
      tabsRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth", // Плавный нативный скролл
      });
    }
  };

  // Флаг гостевой сессии. Гости определяются по захардкоженному юзернейму из App.js
  const isGuest = !user || user.username === "Guest_Hacker";

  /**
   * Проверка: выполнил ли текущий пользователь конкретную лабораторную комнату.
   * Для гостей всегда возвращает false, блокируя сохранение прогресса.
   */
  const isTaskSolved = (taskId) => {
    if (isGuest) return false;
    return user?.solvedTasks?.includes(taskId) || false;
  };

  /* =========================================================================
     ЛОГИКА ФИЛЬТРАЦИИ И ПОДСЧЕТА ПРОГРЕССА (Связана исключительно с категориями)
     ========================================================================= */

  const ALL_TASKS = [
    ...JS_TASKS,
    ...TS_TASKS,
    ...PYTHON_TASKS,
    ...ALGO_TASKS,
    ...DB_TASKS,
    ...ARCH_TASKS,
    ...SECURITY_TASKS,
  ];

  const TASKS_BY_CATEGORY = {
    all: ALL_TASKS,
    js: JS_TASKS,
    ts: TS_TASKS,
    python: PYTHON_TASKS,
    algo: ALGO_TASKS,
    db: DB_TASKS,
    arch: ARCH_TASKS,
    security: SECURITY_TASKS,
  };

  // 1. Выделяем пул задач, жестко принадлежащих выбранной категории (без учета инпута поиска)
  const currentCategoryTasks = TASKS_BY_CATEGORY[activeCategory] || [];

  // 2. Считаем количество решенных задач исключительно внутри ЭТОЙ выбранной категории
  const solvedCount = isGuest
    ? 0
    : currentCategoryTasks.filter((task) => isTaskSolved(task.id)).length;

  // 3. Финальный отфильтрованный массив задач для вывода на экран (применяем поисковый запрос)
  const displayedTasks = currentCategoryTasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 font-mono text-left animate-fade-in">
      {/* 1. ВЕРХНЯЯ ПАНЕЛЬ КАТЕГОРИЙ (Скроллбар скрыт через CSS, стрелочки проявляются по hover:group/nav) */}
      <div className="relative group/nav mb-6 border-b border-slate-800 pb-4">
        {/* Навигационная стрелка СЛЕВА */}
        <button
          onClick={() => scrollTabs("left")}
          className="absolute left-0 top-0 bottom-4 w-10 bg-gradient-to-r from-[#0a0f1d] via-[#0a0f1d]/80 to-transparent flex items-center justify-start text-slate-400 hover:text-white opacity-0 group-hover/nav:opacity-100 transition-opacity duration-200 z-10 cursor-pointer border-0 font-bold select-none text-base"
        >
          ❬
        </button>

        {/* Горизонтальный flex-контейнер с запретом переноса строк (flex-nowrap) */}
        <div
          ref={tabsRef}
          className="flex flex-nowrap gap-2 overflow-x-auto scroll-smooth scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] px-4"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                activeCategory === cat.id
                  ? "bg-slate-100 text-slate-950 border-white shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  : "bg-[#0d1527] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Навигационная стрелка СПРАВА */}
        <button
          onClick={() => scrollTabs("right")}
          className="absolute right-0 top-0 bottom-4 w-10 bg-gradient-to-l from-[#0a0f1d] via-[#0a0f1d]/80 to-transparent flex items-center justify-end text-slate-400 hover:text-white opacity-0 group-hover/nav:opacity-100 transition-opacity duration-200 z-10 cursor-pointer border-0 font-bold select-none text-base"
        >
          ❭
        </button>
      </div>

      {/* 2. ПАНЕЛЬ ПОИСКА И ДИНАМИЧЕСКИЙ СЧЕТЧИК КАТЕГОРИИ */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        {/* Инпут текстовой фильтрации */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Поиск вопросов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d1527] border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm transition-colors"
          />
        </div>

        {/* Виджет прогресса решенных задач (Зависит от выбранной вкладки темы) */}
        <div className="text-sm text-slate-400 font-bold whitespace-nowrap flex items-center gap-2 bg-[#0d1527] px-4 py-2 rounded-xl border border-slate-800">
          <span
            className={`w-2 h-2 rounded-full ${solvedCount > 0 ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`}
          ></span>
          <span>
            {solvedCount} / {currentCategoryTasks.length} Решено
          </span>
        </div>
      </div>

      {/* 3. СПИСОК РЕНДЕРИНГА ЗАДАЧ */}
      <div className="flex flex-col gap-2">
        {displayedTasks.length > 0 ? (
          displayedTasks.map((task) => {
            /* 
              Геймифицированная проверка блокировки роута.
              Уроки открываются по накопленному XP.
              Гости (isGuest = true) имеют 9999 XP, поэтому они сразу видят все задачи.
            */
            const requiredXp =
              task.id === "unit-2"
                ? 250
                : task.id === "unit-3"
                  ? 500
                  : task.id === "unit-4"
                    ? 100
                    : task.id === "unit-ts"
                      ? 250
                      : task.id === "unit-python"
                        ? 300
                        : task.id === "unit-algo"
                          ? 400
                          : task.id === "unit-db"
                            ? 300
                            : task.id === "unit-arch"
                              ? 200
                              : task.id === "unit-security"
                                ? 500
                                : 0;
            const isLocked = !isGuest && user && user.xp < requiredXp;

            const isSolved = isTaskSolved(task.id);

            return (
              <div
                key={task.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d1527] border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all duration-150"
              >
                {/* Левая часть карточки: Чекбокс решения, Порядковый номер, Заголовок, XP-награда */}
                <div className="flex items-start gap-3 flex-grow min-w-0">
                  {/* Иконка статуса прохождения */}
                  <div className="pt-1 min-w-[20px] flex justify-center">
                    {isSolved ? (
                      <span
                        className="text-emerald-400 font-bold text-sm"
                        title="Решено"
                      >
                        ✓
                      </span>
                    ) : (
                      <span
                        className="text-slate-700 text-xs"
                        title="Не решено"
                      >
                        •
                      </span>
                    )}
                  </div>

                  <span className="text-slate-600 font-bold pt-0.5">
                    {task.index}.
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-400 transition-colors flex flex-wrap items-center gap-x-3 gap-y-1 break-words">
                      <span>{task.title}</span>
                      {/* Лейбл награды опыта */}
                      <span className="text-xs font-normal text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded border border-slate-800">
                        +{task.xpReward} XP
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1 font-sans">
                      {task.description}
                    </p>
                  </div>
                </div>

                {/* Правая часть карточки: Тег сложности и Кнопка запуска терминала */}
                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800/60">
                  {/* Бейдж сложности */}
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded border min-w-[75px] text-center ${task.difficultyColor}`}
                  >
                    {task.difficulty}
                  </span>

                  {/* Кнопка запуска / блокировки комнаты */}
                  {isLocked ? (
                    <button
                      disabled
                      className="px-4 py-1.5 bg-slate-800 text-slate-500 rounded-lg text-xs font-bold cursor-not-allowed border-0 opacity-50 whitespace-nowrap"
                    >
                      🔒 Locked
                    </button>
                  ) : (
                    <button
                      onClick={() => onStartLesson && onStartLesson(task.id)}
                      className={`px-4 py-1.5 font-bold rounded-lg text-xs transition-all active:scale-95 cursor-pointer border-0 whitespace-nowrap ${
                        isSolved
                          ? "bg-slate-800 text-emerald-400 hover:bg-slate-700 border border-slate-700"
                          : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                      }`}
                    >
                      {isSolved ? "Review ⚡" : "Deploy ⚡"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          /* Контент-заглушка для пустых вкладок (Python, Архитектура и т.д.) */
          <div className="text-center py-12 bg-[#0d1527] border border-slate-800 rounded-xl text-slate-500 text-sm">
            [-] Модули в данной структуре еще не развернуты.
          </div>
        )}
      </div>
    </div>
  );
}
