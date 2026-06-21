import React from "react";

/**
 * Компонент полноэкранного уведомления о достижении нового уровня/ранга.
 *
 * @param {String} rankName - Название полученного ранга
 * @param {Number} xp - Текущее количество опыта кодера
 * @param {Function} onClose - Функция закрытия модального окна
 */
export default function AchievementModal({ rankName, xp, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm font-mono animate-fade-in">
      {/* Контейнер карточки с двойной неоновой изумрудной рамкой */}
      <div className="w-full max-w-lg bg-[#0d1527] border-2 border-emerald-500 rounded-2xl p-8 text-center relative shadow-[0_0_50px_rgba(16,185,129,0.2)]">
        {/* Декоративные угловые хакерские элементы */}
        <div className="absolute top-2 left-3 text-emerald-500/30 text-xs">
          [SYSTEM_UPGRADE]
        </div>
        <div className="absolute bottom-2 right-3 text-emerald-500/30 text-xs">
          STATUS_OK
        </div>

        {/* Большая анимированная иконка награды */}
        <div className="text-7xl mb-4 animate-bounce duration-1000">🏆</div>

        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1">
          &gt;_ ДОСТИГНУТ НОВЫЙ РАНГ ПРОФЕССИОНАЛИЗМА
        </span>

        {/* Динамическое имя ранга */}
        <h1 className="text-3xl md:text-4xl font-black text-white my-3 tracking-tight uppercase drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">
          {rankName}
        </h1>

        {/* Информационные логи терминала */}
        <div className="w-full bg-[#0a0f1d] border border-slate-800 p-4 my-5 rounded-xl text-left text-xs text-slate-300 space-y-1">
          <p className="text-emerald-400 font-bold">
            [+] Синхронизация с ядром... УСПЕШНО.
          </p>
          <p>
            [+] Текущий баланс сигнатур:{" "}
            <span className="text-white font-bold">{xp} XP</span>
          </p>
          <p>[+] Доступ к приватным директориям симулятора расширен.</p>
          <p className="text-slate-500">
            [!] Рекомендуется продолжить развертывание лабораторных комнат.
          </p>
        </div>

        {/* Кнопка подтверждения */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] active:scale-[0.98] cursor-pointer border-0 uppercase tracking-wider"
        >
          Продолжить
        </button>
      </div>
    </div>
  );
}
