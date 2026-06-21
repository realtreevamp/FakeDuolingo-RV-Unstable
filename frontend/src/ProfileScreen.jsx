import React from "react";

export default function ProfileScreen({ user, isGuestMode, navigateTo }) {
  // Названия комнат для красивого вывода логов
  const roomNames = {
    "unit-1": "Основы JavaScript (Базовый синтаксис)",
    "unit-2": "Асинхронный JS & API (Event Loop)",
    "unit-3": "Безопасность Node.js (JWT & Инъекции)",
    "unit-4": "Песочница: Замыкания (Счетчик Counter)"
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 font-mono p-6 flex flex-col items-center animate-fade-in">
      {/* Шапка навигации назад */}
      <div className="w-full max-w-2xl mb-6 text-left">
        <button
          onClick={() => navigateTo("/learn")}
          className="text-slate-400 text-sm font-bold hover:text-white transition-colors cursor-pointer bg-transparent border-0"
        >
          &lt; ВЕРНУТЬСЯ В ХАБ ОБУЧЕНИЯ
        </button>
      </div>

      <div className="w-full max-w-2xl flex flex-col gap-6">
        {/* БЛОК 1: ОСНОВНАЯ КАРТОЧКА КЛИЕНТА */}
        <div className="bg-[#0d1527] border-2 border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-3 text-[10px] text-slate-600 select-none">
            ID_SECURE_TOKEN: #{user?.id || "000"}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Огромная аватарка */}
            <div className="text-6xl bg-slate-900 border border-slate-700 w-24 h-24 rounded-2xl flex items-center justify-center shadow-inner select-none">
              {user?.avatar || "👤"}
            </div>

            {/* Имя и Ранг */}
            <div className="text-center sm:text-left flex-grow">
              <h1 className="text-2xl font-black tracking-wide text-white flex items-center justify-center sm:justify-start gap-2">
                <span>{user?.username || "Guest_Hacker"}</span>
                {isGuestMode && (
                  <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-md font-normal uppercase">
                    Аноним
                  </span>
                )}
              </h1>
              
              <div className="text-sm text-slate-400 mt-1 flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1">
                <div>Ранг в сети: <span className="text-emerald-400 font-bold">{user?.rank || "Junior Dev"}</span></div>
                {user?.lastActiveDate && (
                  <div className="text-slate-500 text-xs">Активность: {user.lastActiveDate}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* БЛОК 2: МАТРИЦА СТАТИСТИКИ (Duolingo-style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Плашка опыта */}
          <div className="bg-[#0d1527] border border-slate-800 rounded-xl p-4 flex flex-col justify-between min-h-[100px]">
            <div className="text-xs text-slate-500 uppercase tracking-wider">Накоплено энергии</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-emerald-400">{user?.xp || 0}</span>
              <span className="text-xs text-slate-400 font-bold">XP</span>
            </div>
          </div>

          {/* Плашка стрика */}
          <div className="bg-[#0d1527] border border-slate-800 rounded-xl p-4 flex flex-col justify-between min-h-[100px]">
            <div className="text-xs text-slate-500 uppercase tracking-wider">Цикл активности</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-amber-500">{user?.streak || 0}</span>
              <span className="text-xs text-slate-400 font-bold">дн. подряд {user?.streak > 0 ? "🔥" : "💤"}</span>
            </div>
          </div>
        </div>

        {/* БЛОК 3: ЛОГ ЭКСПЛУАТАЦИИ МОДУЛЕЙ (История пройденных комнат) */}
        <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-6 shadow-xl text-left">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
            <span>&gt;_</span> Лог выполненных комнат ядра
          </h2>

          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2 scrollbar-none">
            {user?.solvedTasks && user.solvedTasks.length > 0 ? (
              user.solvedTasks.map((taskId) => (
                <div 
                  key={taskId}
                  className="flex items-center justify-between p-3 bg-[#0a0f1d] border border-slate-850 rounded-xl text-xs"
                >
                  <span className="text-slate-300 font-semibold truncate max-w-[80%]">
                    [+] {roomNames[taskId] || `Модуль: ${taskId}`}
                  </span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/20 whitespace-nowrap">
                    SUCCESS
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-600 text-xs italic">
                [-] В архиве безопасности нет записей. Пройдите первый урок!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
