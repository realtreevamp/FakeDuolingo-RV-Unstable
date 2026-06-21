import React, { useState, useEffect } from "react"; // <-- Добавили useState и useEffect
import Header from "./Header";

const SECTION_CARDS = [
  { id: "js", label: "JavaScript", description: "Основы, асинхронность и функции.", icon: "⚡" },
  { id: "ts", label: "TypeScript", description: "Типы, интерфейсы и безопасность кода.", icon: "🔷" },
  { id: "python", label: "Python", description: "Базовый синтаксис, списки и кортежи.", icon: "🐍" },
  { id: "algo", label: "Алгоритмы", description: "Поиск, циклы и оценка сложности.", icon: "⚙️" },
  { id: "db", label: "Базы данных", description: "SQL-запросы и фильтрация данных.", icon: "🗄️" },
  { id: "arch", label: "Архитектура", description: "MVC, REST и структура приложений.", icon: "🏛️" },
  { id: "security", label: "Безопасность", description: "XSS, SQL-инъекции и защита ввода.", icon: "🛡️" },
];

/**
 * Компонент HomeScreen является главной страницей (лендингом) приложения.
 * Он всегда доступен публично без ограничений авторизации.
 *
 * @param {Function} navigateTo - Функция для SPA-навигации (изменение стейта пути в App.js)
 * @param {Boolean} isAuthenticated - Статус авторизации текущего пользователя
 * @param {Object} user - Данные текущего кодера (если он вошел в систему)
 * @param {Boolean} isGuestMode - Флаг, указывающий, активен ли сейчас гостевой режим
 * @param {Function} onStartGuestMode - Триггер для активации гостевого режима и редиректа (передается из App.js)
 */
export default function HomeScreen({
  navigateTo,
  isAuthenticated,
  user,
  isGuestMode,
  onStartGuestMode,
  onStartLesson,
}) {
  /**
   * Универсальный перехватчик событий клика по ссылкам.
   * Блокирует дефолтную перезагрузку страницы браузером и вызывает
   * встроенный механизм смены экранов на клиенте.
   */
  const handleLinkClick = (e, path) => {
    e.preventDefault();
    navigateTo(path);
  };
  // Список доступных комнат для случайного выбора
  const CHALLENGES_POOL = [
    {
      id: "unit-1",
      title: "Основы JavaScript",
      description:
        "Быстрый цикл отладки: console.log, конкатенация типов данных и условные операторы ветвления.",
      reward: 500, // Повышенная награда за ежедневный челлендж
    },
    {
      id: "unit-2",
      title: "Асинхронный JS & API",
      description:
        "Погрузитесь в работу Event Loop, Task Queue и разберитесь, как Promises перехватывают управление потоком.",
      reward: 500,
    },
  ];

  // Стейт для хранения случайно выбранной на сегодня задачи
  const [dailyChallenge, setDailyChallenge] = useState(CHALLENGES_POOL[0]);

  // Выбираем случайную задачу ОДИН раз при загрузке главной страницы
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * CHALLENGES_POOL.length);
    setDailyChallenge(CHALLENGES_POOL[randomIndex]);
  }, []);

  // Проверка: является ли пользователь полноценно авторизованным (не аноним и не гость)
  const isRealUser =
    isAuthenticated && user && user.username !== "Guest_Hacker";

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 font-mono flex flex-col">
      {/* 
        Унифицированный хедер системы.
        Передаем сквозные пропсы для отображения статуса сессии в шапке.
        Свойство onProfileUpdate здесь намеренно не передается, так как 
        на главной странице нет интерфейсов для мгновенного обновления профиля.
      */}
      <Header
        navigateTo={navigateTo}
        isAuthenticated={isAuthenticated}
        user={user}
        isGuestMode={isGuestMode}
      />

      {/* Центральный презентационный блок (Hero Section) */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 text-center max-w-4xl w-full mx-auto gap-6 animate-fade-in">
        {/* Главный заголовок с акцентом на ключевом слове */}
        <h1 className="text-4xl md:text-6xl font-black text-white leading-tight max-w-3xl mx-auto tracking-tight">
          Изучай программирование <br className="hidden md:inline" />
          через <span className="text-emerald-400">геймификацию</span>
        </h1>

        {/* Краткое техническое описание сути платформы */}
        <p className="text-slate-400 max-w-xl text-sm md:text-base leading-relaxed">
          Собирайте цепочки кода, проходите интерактивные комнаты, дебажьте
          ошибки в реальном времени и прокачивайте свой кодерский ранг.
        </p>
        {/* ДИНАМИЧЕСКИЙ БАННЕР: ЗАДАЧА ДНЯ */}
        {/* ДИНАМИЧЕСКИЙ БАННЕР: ЗАДАЧА ДНЯ */}
        <div className="w-full max-w-xl bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 text-left my-2 relative overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.02)]">
          {/* Пульсирующий индикатор активности */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold text-amber-400 uppercase tracking-widest animate-pulse">
            <span className="w-1 h-1 rounded-full bg-amber-400"></span>
            Daily Challenge
          </div>

          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block mb-1">
            ⚡ Особое задание дня (Только для резидентов сети)
          </span>

          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>{dailyChallenge.title}</span>
            <span className="text-xs font-normal text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">
              +{dailyChallenge.reward} XP
            </span>
          </h3>

          <p className="text-xs text-slate-400 mt-1 font-sans leading-relaxed">
            {dailyChallenge.description}
          </p>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Подсказка для неавторизованных кодеров */}
            {!isRealUser && (
              <span className="text-[11px] text-rose-400 font-bold bg-rose-950/20 border border-rose-500/20 px-2.5 py-1 rounded">
                [-] ДОСТУП ОГРАНИЧЕН: Требуется авторизация
              </span>
            )}

            <div className="sm:ml-auto">
              {isRealUser ? (
                /* Кнопка доступна только авторизованным */
                <button
                  onClick={() =>
                    onStartLesson && onStartLesson(dailyChallenge.id)
                  }
                  className="w-full sm:w-auto px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-95 cursor-pointer border-0 font-mono"
                >
                  ИНИЦИИРОВАТЬ ДЕПЛОЙ &gt;_
                </button>
              ) : (
                /* Заблокированная кнопка, ведущая на страницу входа */
                <button
                  onClick={(e) => handleLinkClick(e, "/auth")}
                  className="w-full sm:w-auto px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold rounded-lg text-xs transition-all cursor-pointer border border-slate-700 font-mono"
                >
                  АВТОРИЗОВАТЬСЯ 🔑
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 
          БЛОК УПРАВЛЕНИЯ ДОСТУПОМ (Главные CTA-кнопки).
          Логическое ветвление:
          - Если юзер уже авторизован ИЛИ находится в режиме гостя -> показываем прямую ссылку на трекер обучения (/learn).
          - Если юзер анонимен -> выводим кнопку мгновенной инициализации гостевой сессии.
        */}
        <div className="mt-10 w-full max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-400 uppercase text-[11px] tracking-[0.3em] mb-2">
                Перейдите в нужный раздел
              </p>
              <h2 className="text-2xl font-bold text-white">
                Все темы обучения
              </h2>
            </div>
            <button
              onClick={(e) => handleLinkClick(e, "/learn")}
              className="text-xs uppercase font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Смотреть все &gt;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {SECTION_CARDS.map((section) => (
              <button
                key={section.id}
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("/learn");
                }}
                className="group text-left p-5 rounded-3xl border border-slate-800 bg-[#0b1222]/80 hover:bg-[#0f1730] transition-colors shadow-[0_0_30px_rgba(15,23,42,0.25)]"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl">{section.icon}</span>
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    {section.id.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {section.label}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {section.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          {isAuthenticated || isGuestMode ? (
            /* Вариант 1: Сессия активна (Пользователь или Гость) */
            <a
              href="/learn"
              onClick={(e) => handleLinkClick(e, "/learn")}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] no-underline inline-block font-sans"
            >
              ПРИСТУПИТЬ К ОБУЧЕНИЮ &gt;
            </a>
          ) : (
            /* Вариант 2: Полностью анонимный визит */
            <button
              onClick={() => onStartGuestMode()}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] border-0 cursor-pointer font-sans"
            >
              НАЧАТЬ КАК ГОСТЬ &gt;
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
