import React, { useState, useEffect } from "react";
import { logout, updateProfile } from "./api/userApi";
/**
 * Компонент глобального хедера (шапки) приложения.
 * Отвечает за навигацию, отображение текущего баланса опыта (XP), ранга,
 * а также предоставляет интерфейс управления сессией (выход) и редактирования профиля через модальное окно.
 *
 * @param {Function} navigateTo - Кастомная функция роутинга без перезагрузки страницы
 * @param {Boolean} isAuthenticated - Статус успешной авторизации пользователя в системе
 * @param {Object} user - Текущий авторизованный объект кодера (из сессии)
 * @param {Function} onProfileUpdate - Коллбэк для триггера обновления стейта сессии в App.js при изменении данных
 * @param {Boolean} isGuestMode - Флаг активности гостевой (анонимной) сессии
 */

export default function Header({
  navigateTo,
  isAuthenticated,
  user,
  onProfileUpdate,
  isGuestMode,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Видимость выпадающего меню (Профиль / Выход)
  const [isModalOpen, setIsModalOpen] = useState(false); // Видимость модального окна настроек матрицы
  // Локальные буферные состояния для редактирования данных в форме
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editAvatar, setEditAvatar] = useState("🤖");
  const [modalError, setModalError] = useState("");
  // Синхронизируем локальные поля ввода формы с актуальными данными пользователя при их изменении
  useEffect(() => {
    if (user) {
      setEditUsername(user.username || "");
      setEditPassword(user.password || "");
      setEditAvatar(user.avatar || "🤖");
    }
  }, [user]);
  /**
   * Вспомогательный перехватчик кликов по ссылкам для предотвращения дефолтного
   * поведения браузера и работы нативного SPA-роутера.
   */

  const handleLinkClick = (e, path) => {
    e.preventDefault();
    navigateTo(path);
  };
  /**
   * Метод деавторизации сессии кодера.
   * Делает запрос на удаление сессии на сервер и жестко перезагружает рантайм.
   */
  const handleLogout = () => {
    logout().then(() => window.location.reload());
  };
  /**
   * Обработчик сохранения измененных конфигурационных данных пользователя.
   * Отправляет мутирующий POST-запрос на бэкенд.
   */
  const handleUpdateProfile = (e) => {
    e.preventDefault();
    setModalError(""); // Сброс прошлых ошибок

    updateProfile({
      username: editUsername,
      password: editPassword,
      avatar: editAvatar,
    })
      .then(() => {
        // Успешный исход: закрываем интерфейсы и заставляем App.js обновить стейт сессии
        setIsModalOpen(false);
        setIsMenuOpen(false); // Закрываем выпадающее меню, чтобы оно не висело открытым
        setModalError(""); // Очищаем прошлые ошибки валидации, если они были
        if (onProfileUpdate) onProfileUpdate();
      })

      .catch((err) => setModalError(err.message));
  };

  return (
    <>
      {/* ОСНОВНОЙ КОНТЕЙНЕР ШАПКИ С ИНДЕКСОМ СЛОЯ z-40 */}
      <header className="max-w-full w-full mx-auto flex flex-wrap justify-between items-center gap-3 py-4 px-4 sm:px-8 bg-[#0d1527] border-b border-slate-800 relative z-40">
        {/* ЛЕВАЯ ЧАСТЬ: Логотип и корневые ссылки навигации */}
        <div className="flex flex-wrap items-center gap-6 min-w-0">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigateTo("/");
            }}
            className="text-xl font-black tracking-wider text-emerald-400 no-underline cursor-pointer hover:text-emerald-300 transition-all transform active:scale-95 active:translate-y-[1px] font-mono select-none"
          >
            &gt;_ FAKE_DUOLINGO
          </a>

          {/* Индикатор активной страницы "Учиться" на основе анализа window.location.pathname */}
          <a
            href="/learn"
            onClick={(e) => {
              e.preventDefault();
              navigateTo("/learn");
            }}
            className={`text-sm font-bold no-underline font-mono transition-all transform active:scale-95 active:translate-y-[1px] duration-100 cursor-pointer select-none ${
              window.location.pathname === "/learn"
                ? "text-emerald-400 border-b-2 border-emerald-400 pb-1"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Учиться
          </a>
        </div>
      

        {/* ПРАВАЯ ЧАСТЬ: Динамический рендеринг блоков на основе статуса сессии */}
       {isAuthenticated && user && user.username !== "Guest_Hacker" ? (
          
          /* ВАРИАНТ 1: Пользователь полностью авторизован */
          <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-6 text-xs sm:text-sm w-full sm:w-auto max-w-full">
            {/* === БЛОК УДАРНОГО РЕЖИМА (DUOLINGO STREAK) === */}
            <div 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-sm font-bold transition-all select-none ${
                user?.streak > 0 
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-sm shadow-amber-500/5" 
                  : "bg-slate-900/40 border-slate-800 text-slate-500"
              }`}
              title={user?.streak > 0 ? `Вы в ударном режиме уже ${user.streak} дн.` : "Ударный режим не активен. Пройдите комнату!"}
            >
              {/* Эмодзи прыгает при изменении значения */}
              <span 
                key={user?.streak} 
                className={user?.streak > 0 ? "animate-bounce inline-block" : ""}
              >
                🔥
              </span>
              
              <span>
                {user?.streak || 0} дн.
              </span>
            </div>
            {/* === КОНЕЦ БЛОКА === */}

            <span className="text-emerald-400 font-bold hidden sm:inline">
              Score: {user.xp} XP
            </span>
            <span className="text-slate-400 hidden md:inline">
              Ранг: <strong className="text-slate-200">{user.rank}</strong>
            </span>
            {/* Выпадающий переключатель профиля */}
            <div className="relative">
              <div
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors select-none text-white font-bold"
              >
                <span className="text-lg sm:text-xl">
                  {user.avatar || "🤖"}
                </span>
                <span>{user.username}</span>
                <span className="text-xs text-slate-500 ml-1">▼</span>
              </div>
              {/* Выпадающий дропдаун-список действий */}
              {isMenuOpen && (
                <>
                  {/* Задняя невидимая подложка для закрытия меню по клику в любое пустое место экрана */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 top-12 w-56 bg-[#0d1527] border border-slate-800 rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setIsModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-800 text-slate-200 rounded-lg transition-colors cursor-pointer border-0 bg-transparent font-mono"
                    >
                      ⚙️ Настройки профиля
                    </button>
                    <hr className="border-slate-800 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-rose-950/40 text-rose-400 rounded-lg transition-colors cursor-pointer border-0 bg-transparent font-mono"
                    >
                      ❌ Выйти из терминала
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          
        ) : user && user.username === "Guest_Hacker" ? (
          /* ВАРИАНТ 2: Пользователь находится внутри гостевой сессии */
          <div className="flex items-center gap-4 text-xs sm:text-sm">
            <span className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
              ⚠️ РЕЖИМ ГОСТЯ
            </span>
            <a
              href="/auth"
              onClick={(e) => handleLinkClick(e, "/auth")}
              className="text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors no-underline"
            >
              [ СОЗДАТЬ АККАУНТ ]
            </a>
          </div>
        ) : (
          /* ВАРИАНТ В: Анонимный неавторизованный посетитель */
          <a
            href="/auth"
            onClick={(e) => handleLinkClick(e, "/auth")}
            className="text-sm font-bold text-slate-400 hover:text-white transition-colors no-underline"
          >
            [ ВХОД ]
          </a>
        )}
      </header>

      {/* УНИФИЦИРОВАННОЕ МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ МАТРИЦЫ ПРОФИЛЯ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono">
          <div className="w-full max-w-md bg-[#0d1527] border border-slate-800 rounded-2xl p-6 shadow-2xl text-left">
            <h2 className="text-lg font-bold text-emerald-400 mb-2">
              &gt;_ РЕДАКТИРОВАНИЕ_МАТРИЦЫ
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              [Перезапись конфигурационных данных кодера]
            </p>
            {/* Блок вывода локальных ошибок валидации */}
            {modalError && (
              <div className="bg-rose-950/40 border border-rose-500/30 text-rose-400 p-2.5 rounded-lg text-xs mb-4">
                [-] ОШИБКА: {modalError}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Выбор кибер-аватара (Грид-селектор) */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Выберите Кибер-Аватар:
                </label>
                <div className="flex gap-4 justify-between bg-[#0a0f1d] p-3 border border-slate-800 rounded-lg">
                  {["🤖", "🥷", "👾", "💻"].map((av) => (
                    <button
                      type="button"
                      key={av}
                      onClick={() => setEditAvatar(av)}
                      className={`text-2xl p-2 rounded-lg border transition-all cursor-pointer bg-transparent ${
                        editAvatar === av
                          ? "bg-emerald-500/20 border-emerald-500 scale-110"
                          : "border-transparent hover:bg-slate-800/50"
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>
              {/* Поле изменения логина */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Новое имя кодера:
                </label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono text-sm"
                />
              </div>
              {/* Поле изменения пароля */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Изменить ключ доступа (пароль):
                </label>
                <input
                  type="text"
                  required
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono text-sm"
                />
              </div>
              {/* Управляющие кнопки формы */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm transition-all border-0 cursor-pointer"
                >
                  ОТМЕНА
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] border-0 cursor-pointer"
                >
                  СОХРАНИТЬ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
