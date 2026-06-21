import React from "react";

export default function SelectOneTask({
  task,
  selectedAnswer,
  onAnswerChange,
  isAnswerChecked,
}) {
  return (
    <div className="flex flex-col items-center max-w-xl mx-auto p-4 w-full">
      {/* Текст вопроса - белый */}
      <h2 className="text-xl md:text-2xl font-bold text-white mb-8 text-center">
        {task.question}
      </h2>

      <div className="grid grid-cols-1 gap-4 w-full">
        {task.options.map((option) => {
          const isSelected = selectedAnswer === option.id;

          return (
            <button
              key={option.id}
              disabled={isAnswerChecked}
              onClick={() => onAnswerChange(option.id)}
              className={`w-full text-left p-4 text-base md:text-lg font-mono border border-slate-800 rounded-xl transition-all ${
                isSelected
                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                  : "bg-[#0a0f1d] border-slate-800 text-slate-200 hover:bg-slate-800/50 hover:text-white cursor-pointer"
              }`}
            >
              <span className="inline-block bg-slate-800 text-slate-400 rounded px-2 py-0.5 mr-3 text-xs font-sans">
                Code
              </span>
              {option.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
