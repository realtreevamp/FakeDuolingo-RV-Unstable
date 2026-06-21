import React, { useState, useEffect } from "react";

/**
 * Компонент для интерактивного ввода кода вручную.
 */
export default function CodeSandboxTask({
  task,
  onAnswerChange,
  isAnswerChecked,
}) {
  const [code, setCode] = useState(task.starterCode || "");

  // Передаем изменения наверх в родительский стейт App.js
  useEffect(() => {
    onAnswerChange(code);
  }, [code, onAnswerChange]);

  return (
    <div className="w-full text-left font-mono animate-fade-in">
      {/* Шапка интерактивной консоли ввода */}
      <div className="bg-[#0a0f1d] border border-slate-800 rounded-t-xl px-4 py-2 flex items-center justify-between text-xs text-slate-500 border-b-0 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="ml-2 text-slate-400 font-bold">
            sandbox_compiler.js
          </span>
        </div>
        <span>UTF-8</span>
      </div>

      {/* Текстовое поле для ввода кода */}
      <textarea
        value={code}
        disabled={isAnswerChecked}
        onChange={(e) => setCode(e.target.value)}
        rows={8}
        className={`w-full bg-[#0a0f1d] border border-slate-800 rounded-b-xl p-4 text-sm text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 transition-colors resize-none leading-relaxed ${
          isAnswerChecked ? "opacity-70 cursor-not-allowed" : ""
        }`}
        placeholder="// Наберите ваш код здесь..."
        spellCheck="false"
      />

      <p className="text-xs text-slate-500 mt-3 italic leading-relaxed font-sans">
        * Внимание: система скомпилирует синтаксическое дерево вашего ответа и
        сверит наличие обязательных инструкций инкремента и замыкания.
      </p>
    </div>
  );
}
