import React, { useEffect, useState } from 'react';

const initialRoomsData = [
  {
    id: "unit-1",
    title: "Основы JavaScript",
    description: "Изучите базовый синтаксис, стрелочные функции и работу со стейтом.",
    difficulty: "Easy",
    difficultyColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    xpReward: 250,
    tasksCount: 3,
    xpRequired: 0,      // Доступно сразу
    status: "Available"
  },
  {
    id: "unit-2",
    title: "Асинхронный JS & API",
    description: "Разбор Promises, async/await и методов обработки fetch-запросов.",
    difficulty: "Medium",
    difficultyColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    xpReward: 250,
    tasksCount: 5,
    xpRequired: 250,    // Разблокируется при 250 XP
    status: "Locked"
  },
  {
    id: "unit-3",
    title: "Безопасность Node.js",
    description: "Поиск уязвимостей в Express-серверах, SQL-инъекции и защита JWT-токенов.",
    difficulty: "Hard",
    difficultyColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    xpReward: 500,
    tasksCount: 8,
    xpRequired: 500,    // Разблокируется при 500 XP
    status: "Locked"
  }
];

const availableAvatars = ["🤖", "🥷", "👾", "💻"];

export default function Dashboard({ onStartLesson }) {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState(initialRoomsData);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Поля формы редактирования профиля
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editAvatar, setEditAvatar] = useState('🤖');
  const [modalError, setModalError] = useState('');

  const fetchProfile = () => {
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setEditUsername(data.username);
        setEditPassword(data.password);
        setEditAvatar(data.avatar || '🤖');
      })
      .catch(err => console.error("Ошибка загрузки профиля:", err));
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // 🔓 Умная динамическая разблокировка комнат на основе XP
  useEffect(() => {
    if (!user) return;

    setRooms(prevRooms => 
      prevRooms.map(room => {
        if (user.xp >= room.xpRequired) {
          return { ...room, status: "Available" };
        }
        return room;
      })
    );
  }, [user]);
  const handleUpdateProfile = (e) => {
    e.preventDefault();
    setModalError('');

    fetch('/api/user/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: editUsername, password: editPassword, avatar: editAvatar })
    })
    .then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка обновления');
      return data;
    })
    .then((updatedUser) => {
      setUser(updatedUser);
      setIsModalOpen(false);
    })
    .catch(err => setModalError(err.message));
  };

  const handleLogout = () => {
    fetch('/api/logout', { method: 'POST' })
      .then(() => window.location.reload());
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 font-sans antialiased relative">
      <nav className="border-b border-slate-800 bg-[#0d1527] px-6 py-4 relative z-40">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-wider text-emerald-400 font-mono">
              &gt;_ FAKE_DUOLINGO
            </span>
          </div>

          <div className="flex items-center gap-6 font-mono text-sm relative">
            {user ? (
              <>
                <span className="text-emerald-400 font-bold">Score: {user.xp} XP</span>
                <span className="text-slate-400">Ранг: <strong className="text-slate-200">{user.rank}</strong></span>
                
                <div 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 cursor-pointer bg-slate-800/40 hover:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors select-none"
                >
                  <span className="text-xl">{user.avatar || '🤖'}</span>
                  <span className="text-white font-bold">{user.username}</span>
                  <span className="text-xs text-slate-500">▼</span>
                </div>

                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                    <div className="absolute right-0 top-12 w-56 bg-[#0d1527] border border-slate-800 rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1">
                      <button 
                        onClick={() => { setIsModalOpen(true); setIsMenuOpen(false); }}
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
              </>
            ) : (
              <span className="text-slate-500">Загрузка сессии...</span>
            )}
          </div>
        </div>
      </nav>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono">
          <div className="w-full max-w-md bg-[#0d1527] border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2 text-emerald-400">&gt;_ РЕДАКТИРОВАНИЕ_МАТРИЦЫ</h2>
            <p className="text-xs text-slate-400 mb-4">[Перезапись конфигурационных данных кодера]</p>

            {modalError && (
              <div className="bg-rose-950/40 border border-rose-500/30 text-rose-400 p-2.5 rounded-lg text-xs mb-4">
                [-] ОШИБКА: {modalError}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Выберите Кибер-Аватар:</label>
                <div className="flex gap-4 justify-between bg-[#0a0f1d] p-3 border border-slate-800 rounded-lg">
                  {availableAvatars.map((av) => (
                    <button
                      type="button"
                      key={av}
                      onClick={() => setEditAvatar(av)}
                      className={`text-2xl p-2 rounded-lg border transition-all cursor-pointer bg-transparent ${
                        editAvatar === av 
                          ? 'bg-emerald-500/20 border-emerald-500 scale-110' 
                          : 'border-transparent hover:bg-slate-800/50'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Новое имя кодера:</label>
                <input 
                  type="text" 
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Изменить ключ доступа (пароль):</label>
                <input 
                  type="text" 
                  required
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-[#0a0f1d] border border-slate-800 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm transition-all cursor-pointer border-0"
                >
                  ОТМЕНА
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer border-0"
                >
                  СОХРАНИТЬ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">Обучающие лаборатории</h1>
          <p className="text-slate-400 text-lg">Выбирайте практическую комнату и прокачивайте свои навыки программирования.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const isLocked = room.status === "Locked";
            return (
              <div key={room.id} className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#0d1527] p-6 hover:border-slate-700 transition-all duration-200 shadow-xl">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${room.difficultyColor}`}>
                      {room.difficulty}
                    </span>
                    <span className="text-xs font-mono text-slate-500">+{room.xpReward} XP</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 font-mono">{room.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-6">{room.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-mono text-slate-500">Заданий: {room.tasksCount}</span>
                  {isLocked ? (
                    <button disabled className="px-4 py-2 bg-slate-800 text-slate-400 rounded-lg text-sm font-mono cursor-not-allowed border-0 opacity-60">
                      🔒 Требуется {room.xpRequired} XP
                    </button>
                  ) : (
                    <button onClick={() => onStartLesson(room.id)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold font-mono rounded-lg text-sm transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] active:scale-95 cursor-pointer border-0">
                      Deploy Room &gt;
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
