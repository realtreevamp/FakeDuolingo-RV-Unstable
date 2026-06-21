import React, { useState } from "react";
import { login, register } from "./api/userApi";

export default function AuthScreen({ onAuthSuccess, onClose }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // === НОВОЕ СОСТОЯНИЕ ДЛЯ ПОВТОРНОГО ПАРОЛЯ ===
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(""); 

    // === ПРОВЕРКА СОВПАДЕНИЯ ПАРОЛЕЙ (ТОЛЬКО ДЛЯ РЕГИСТРАЦИИ) ===
    if (isRegisterMode && password !== confirmPassword) {
      setError("Пароли не совпадают. Проверьте синтаксис ключей безопасности.");
      return; // Блокируем отправку fetch-запроса на бэкенд
    }

    const authRequest = isRegisterMode ? register : login;

    authRequest({ username, password })
      .then((userData) => {
        onAuthSuccess(userData);
      })
      .catch((err) => {
        setError(err.message);
      });
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col justify-center items-center p-4 font-mono">
      <div className="w-full max-w-md bg-[#0d1527] border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer bg-transparent border-0 text-lg font-bold p-1 select-none z-50"
          title="Закрыть терминал"
        >
          ✕
        </button>

        <div className="text-center mb-8">
          <span className="text-2xl font-black tracking-wider text-emerald-400">
            &gt;_ FAKE_DUOLINGO
          </span>
          <p className="text-slate-400 text-sm mt-2">
            {isRegisterMode
              ? "[Регистрация нового терминала]"
              : "[Вход в систему обучения]"}
          </p>
        </div>

        {error && (
          <div className="bg-rose-950/40 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-xs mb-4 whitespace-pre-line">
            [-] ОШИБКА: {error}
          </div>
        )}

        {/* ФОРМА ВВОДА ДАННЫХ */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Поле ввода имени кодера */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Имя пользователя / Кодер:
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono text-sm transition-colors"
              placeholder="root"
            />
          </div>

          {/* Поле ввода основного пароля */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Секретный Ключ / Пароль:
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono text-sm transition-colors"
              placeholder="••••••••"
            />
          </div>

          {/* === НОВОЕ ПОЛЕ: ПОВТОР ПАРОЛЯ (РЕНДЕРИТСЯ ДИНАМИЧЕСКИ) === */}
          {isRegisterMode && (
            <div className="animate-fade-in">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Повторите секретный ключ:
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono text-sm transition-colors"
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] text-sm cursor-pointer border-0"
          >
            {isRegisterMode
              ? "ИНИЦИАЛИЗИРОВАТЬ ПРОФИЛЬ"
              : "ПОДКЛЮЧИТЬСЯ К БАЗЕ"}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setError(""); 
              setConfirmPassword(""); // Сбрасываем поле при переключении
            }}
            className="text-xs text-slate-500 hover:text-emerald-400 transition-colors underline cursor-pointer bg-transparent border-0"
          >
            {isRegisterMode
              ? "Уже есть профиль? Авторизоваться"
              : "Нет профиля? Создать новый"}
          </button>
        </div>
      </div>
    </div>
  );
}
