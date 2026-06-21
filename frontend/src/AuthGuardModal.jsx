import React from "react";

/**
 * Полноэкранный блокирующий виджет защиты приватных директорий.
 * Появляется, если анонимный пользователь пытается зайти в центр обучения.
 *
 * @param {Function} onStartGuestMode - Функция для мгновенного запуска сессии гостя
 * @param {Function} onGoToAuth - Функция перехода на экран авторизации/регистрации
 * @param {Function} onCancel - Функция возврата на безопасную главную страницу
 */
export default function AuthGuardModal({
  onStartGuestMode,
  onGoToAuth,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md font-mono animate-fade-in">
      {/* Карточка предупреждения с неоновой алой рамкой тревоги */}
      <div className="w-full max-w-md bg-[#0d1527] border-2 border-rose-500 rounded-2xl p-8 text-center relative shadow-[0_0_50px_rgba(239,68,68,0.15)]">
        {/* Системные хакерские декорации */}
        <div className="absolute top-2 left-3 text-rose-500/30 text-xs">
          [ACCESS_DENIED]
        </div>
        <div className="absolute bottom-2 right-3 text-rose-500/30 text-xs">
          RESTRICTED_AREA
        </div>

        {/* Анимированная иконка замка безопасности */}
        <div className="text-6xl mb-4 animate-pulse">🔒</div>

        <span className="text-xs font-bold text-rose-400 uppercase tracking-widest block mb-1">
          &gt;_ КРИТИЧЕСКИЙ СБОЙ ДОСТУПА
        </span>

        <h1 className="text-2xl font-black text-white my-3 tracking-tight uppercase">
          Вход не выполнен
        </h1>

        <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-6 font-sans">
          Для развертывания виртуальных лабораторных комнат и сохранения
          прогресса требуется инициализация профиля в сети.
        </p>

        {/* Интерактивный лог-бокс */}
        <div className="w-full bg-[#0a0f1d] border border-slate-800 p-4 mb-6 rounded-xl text-left text-xs text-slate-400 space-y-1">
          <p className="text-rose-400 font-bold">
            [-] Симуляция заблокирована.
          </p>
          <p>[!] Анонимные токены не поддерживают компиляцию хэшей.</p>
        </div>

        {/* Вертикальный стек управляющих кнопок */}
        <div className="flex flex-col gap-2.5">
          {/* Кнопка 1: Войти в аккаунт */}
          <button
            onClick={onGoToAuth}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] active:scale-[0.98] cursor-pointer border-0 uppercase tracking-wider"
          >
            🔑 Авторизоваться / Создать профиль
          </button>

          {/* Кнопка 2: Начать как гость */}
          <button
            onClick={onStartGuestMode}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-sm transition-all border border-slate-700 active:scale-[0.98] cursor-pointer uppercase tracking-wider"
          >
            👤 Начать как гость
          </button>

          {/* Кнопка 3: Вернуться на главную */}
          <button
            onClick={onCancel}
            className="w-full mt-1 text-xs text-slate-500 hover:text-rose-400 transition-colors bg-transparent border-0 underline cursor-pointer font-mono"
          >
            [ Вернуться на главную страницу ]
          </button>
        </div>
      </div>
    </div>
  );
}
