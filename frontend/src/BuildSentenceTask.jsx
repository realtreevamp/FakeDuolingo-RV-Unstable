import React, { useState, useEffect } from "react";

export default function BuildSentenceTask({
  task,
  onAnswerChange,
  isAnswerChecked,
}) {
  const [selectedWords, setSelectedWords] = useState([]);

  useEffect(() => {
    setSelectedWords([]);
  }, [task.id]);

  const handleWordSelect = (word, index) => {
    if (isAnswerChecked) return;
    const newSelected = [...selectedWords, { word, originalIndex: index }];
    setSelectedWords(newSelected);
    onAnswerChange(newSelected.map((item) => item.word));
  };

  const handleWordRemove = (wordObj) => {
    if (isAnswerChecked) return;
    const newSelected = selectedWords.filter(
      (item) => item.originalIndex !== wordObj.originalIndex,
    );
    setSelectedWords(newSelected);
    onAnswerChange(newSelected.map((item) => item.word));
  };

  return (
    <div className="flex flex-col items-center max-w-xl mx-auto p-4 w-full">
      {/* Текст вопроса - белый и крупный */}
      <h2 className="text-xl md:text-2xl font-bold text-white mb-8 text-center">
        {task.question}
      </h2>

      {/* Поле ответа (Контейнер сборки кода) */}
      <div className="w-full min-h-[64px] border-b-2 border-slate-700 flex flex-wrap gap-2 items-center px-3 py-3 mb-10 bg-[#0a0f1d] rounded-t-xl">
        {selectedWords.map((item) => (
          <button
            key={item.originalIndex}
            onClick={() => handleWordRemove(item)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg shadow-md text-emerald-400 font-mono text-base hover:bg-slate-700 hover:text-emerald-300 active:scale-95 transition-all cursor-pointer"
          >
            {item.word}
          </button>
        ))}
      </div>

      {/* Банк слов */}
      <div className="flex flex-wrap gap-3 justify-center">
        {task.wordsPool.map((word, index) => {
          const isUsed = selectedWords.some(
            (item) => item.originalIndex === index,
          );
          return (
            <button
              key={index}
              disabled={isUsed || isAnswerChecked}
              onClick={() => handleWordSelect(word, index)}
              className={`px-4 py-2 text-base font-mono border rounded-xl transition-all ${
                isUsed
                  ? "bg-slate-900/30 text-slate-700 border-slate-900/50 cursor-default select-none opacity-20"
                  : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:border-slate-600 active:translate-y-[1px] shadow-md cursor-pointer"
              }`}
            >
              {word}
            </button>
          );
        })}
      </div>
    </div>
  );
}
