import React from "react";

export default function TheorySlide({
  title,
  text,
  codeSnippet,
  onStartPractice,
}) {
  return (
    <div className="w-full max-w-xl mx-auto p-2 font-mono text-slate-300 antialiased leading-relaxed">
      {/* Заголовок темы */}
      <h2 className="text-xl font-bold text-emerald-400 mb-6 border-b border-slate-800 pb-2 flex items-center gap-2">
        <span>&gt;_</span> {title}
      </h2>

      {/* Основной текст теории */}
      <div className="text-sm mb-6 space-y-3 whitespace-pre-line text-slate-300">
        {text}
      </div>

      {/* Блок с примером кода (если он передан в параметрах) */}
      {codeSnippet && (
        <div className="w-full bg-[#0a0f1d] border border-slate-800 p-4 mb-8 rounded-xl shadow-inner">
          <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-800 pb-2 mb-3">
            <span>// КОНФИГУРАЦИОННЫЙ ПРИМЕР</span>
            <span>javascript</span>
          </div>
          <pre className="text-sm font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">
            {codeSnippet}
          </pre>
        </div>
      )}

      {/* Кнопка перехода к практике */}
      <div className="text-center">
        <button
          onClick={onStartPractice}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] text-sm font-sans cursor-pointer border-0"
        >
          [ ИЗУЧЕНО / НАЧАТЬ ТЕСТ ]
        </button>
      </div>
    </div>
  );
}
