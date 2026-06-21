import React, { useEffect, useState } from "react";
import HomeScreen from "./HomeScreen";
import AuthScreen from "./AuthScreen";
import BuildSentenceTask from "./BuildSentenceTask";
import SelectOneTask from "./SelectOneTask";
import TheorySlide from "./TheorySlide";
import LearnPage from "./LearnPage";
import Header from "./Header";
import AchievementModal from "./AchievementModal";
import CodeSandboxTask from "./CodeSandboxTask";
import * as acorn from "acorn";
import AuthGuardModal from "./AuthGuardModal";
import ProfileScreen from "./ProfileScreen";
import { useSession } from "./hooks/useSession";
import { getLesson, completeLesson } from "./api/userApi";

export default function App() {
  // === 1. СОСТОЯНИЯ АВТОРИЗАЦИИ И НАВИГАЦИИ ===
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // === 2. СОСТОЯНИЯ ИГРОВОГО СЕССИОННОГО УРОКА ===
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [showTheory, setShowTheory] = useState(true);
  
  // === 3. СОСТОЯНИЯ ПРОВЕРКИ ОТВЕТОВ ===
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(null);
  const [isLessonFinished, setIsLessonFinished] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementData, setAchievementData] = useState({ rank: "", xp: 0 });

  // === 4. СИСТЕМА ЖИЗНЕЙ (DUOLINGO-STYLE) ===
  const [hearts, setHearts] = useState(5);
  const [isGameOver, setIsGameOver] = useState(false);
  const [debugExplanation, setDebugExplanation] = useState("");

  const {
    activeUser,
    isAuthenticated,
    isGuestMode,
    setIsGuestMode,
    refreshUserData,
    handleAuthSuccess,
  } = useSession();

  const handleRefreshUserData = () => {
    if (!isAuthenticated || isGuestMode) return;

    refreshUserData().then((data) => {
      if (data && activeUser && activeUser.rank && data.rank !== activeUser.rank) {
        setAchievementData({ rank: data.rank, xp: data.xp });
        setShowAchievement(true);
      }
    });
  };

  // === НАВИГАЦИЯ БЕЗ СТОРОННИХ БИБЛИОТЕК ===
  const navigateTo = (path) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
  };

  // Обработка кнопок назад/вперед в браузере
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Загрузка урока по выбранной комнате и инициализация жизней
  useEffect(() => {
    if (!selectedRoomId) return;

    getLesson(selectedRoomId)
      .then((data) => {
        setLesson(data);
        setCurrentTaskIndex(0);
        setShowTheory(true);
        setIsLessonFinished(false);
        setIsAnswerChecked(false);
        setCurrentAnswer(null);
        setShowErrorModal(false);
        // Восстанавливаем резервные потоки жизней для новой сессии
        setHearts(5);
        setIsGameOver(false);
      })
      .catch((err) => console.error("Ошибка загрузки урока:", err));
  }, [selectedRoomId]);

  const handleStartLesson = (roomId) => {
    setSelectedRoomId(roomId);
    navigateTo("/lesson");
  };

    // Завершение урока и отправка прогресса на сервер
  const handleGoToLearn = () => {
    if (isGuestMode) {
      navigateTo("/learn");
      setSelectedRoomId(null);
      setLesson(null);
      return;
    }

    completeLesson({
      roomId: selectedRoomId,
      xpToAdd: 250,
    })
      .then(() => {
        handleRefreshUserData();
        navigateTo("/learn");
        setSelectedRoomId(null);
        setLesson(null);
      })
      .catch((err) => {
        console.error("Ошибка при сохранении прогресса:", err);
        navigateTo("/learn");
        setSelectedRoomId(null);
        setLesson(null);
      });
  };

  // Мягкий сброс параметров текущего вопроса (закрытие дебаггера)
  const handleRestartLesson = () => {
    setShowErrorModal(false);
    setIsAnswerChecked(false);
    setIsCorrect(null);
  };

  // Логика валидации ответов и декремента жизней
  const handleCheckAnswer = () => {
    setDebugExplanation("");
    const currentTask = lesson.tasks[currentTaskIndex];
    let checkPassed = false;

    if (currentTask.type === "BUILD_SENTENCE") {
      checkPassed =
        JSON.stringify(currentAnswer) ===
        JSON.stringify(currentTask.correctSequence);
    } else if (currentTask.type === "SELECT_ONE") {
      checkPassed = currentAnswer === currentTask.correctOptionId;
    } else if (currentTask.type === "CODE_SANDBOX") {
      try {
        const ast = acorn.parse(currentAnswer || "", {
          ecmaVersion: 2022,
          sourceType: "script",
        });

        const nodes = [];
        const traverse = (node) => {
          if (!node) return;
          nodes.push(node);
          for (const key in node) {
            if (node[key] && typeof node[key] === "object") {
              if (Array.isArray(node[key])) {
                node[key].forEach(traverse);
              } else {
                traverse(node[key]);
              }
            }
          }
        };
        traverse(ast);

        checkPassed = currentTask.requiredNodes.every((rule) => {
          return nodes.some((node) => {
            if (node.type !== rule.type) return false;
            if (rule.argumentType && node.argument?.type !== rule.argumentType)
              return false;
            if (rule.operator && node.operator !== rule.operator) return false;
            if (rule.argumentName && node.argument?.name !== rule.argumentName)
              return false;
            return true;
          });
        });
      } catch (parseError) {
        console.warn("Синтаксическая ошибка AST:", parseError.message);
        setDebugExplanation(`[!] КРИТИЧЕСКИЙ СБОЙ ПАРСЕРА:\n${parseError.message}\n\nПожалуйста, исправьте синтаксис перед повторным деплоем.`);
        checkPassed = false;
      }
    }

    setIsCorrect(checkPassed);
    setIsAnswerChecked(true);

    // Система жизней: наказываем за баги в коде
    if (!checkPassed) {
      setHearts((prevHearts) => {
        const newHearts = prevHearts - 1;
        if (newHearts <= 0) {
          setTimeout(() => {
            setIsGameOver(true);
          }, 1000);
        } else {
          setTimeout(() => {
            setShowErrorModal(true);
          }, 1200);
        }
        return newHearts;
      });
    }
  };

  // Переход к следующей задаче
  const handleNext = () => {
    setIsAnswerChecked(false);
    setIsCorrect(null);
    setCurrentAnswer(null);

    if (currentTaskIndex + 1 < lesson.tasks.length) {
      setCurrentTaskIndex((prev) => prev + 1);
      setShowTheory(true);
    } else {
      setIsLessonFinished(true);
    }
  };

    // Проверка приватных путей (Защита роутинга)
  const isPrivatePath = currentPath === "/learn" || currentPath === "/lesson";
  if (isPrivatePath && !isAuthenticated && !isGuestMode) {
    return (
      <AuthGuardModal
        onStartGuestMode={() => {
          setIsGuestMode(true);
          navigateTo("/learn");
        }}
        onGoToAuth={() => navigateTo("/auth")}
        onCancel={() => navigateTo("/")}
      />
    );
  }

   // 1. Главная страница (Лендинг)
  if (currentPath === "/") {
    return (
      <HomeScreen
        navigateTo={navigateTo}
        isAuthenticated={isAuthenticated}
        user={activeUser}
        isGuestMode={isGuestMode}
        onStartGuestMode={() => {
          setIsGuestMode(true);
          navigateTo("/learn");
        }}
        onStartLesson={handleStartLesson}
      />
    );
  }

  // 2. Страница авторизации / регистрации
  else if (currentPath === "/auth") {
    return (
      <AuthScreen
        onAuthSuccess={(userData) => {
          handleAuthSuccess(userData);
          navigateTo("/learn");
        }}
        onClose={() => navigateTo("/")}
      />
    );
  }

  // 3. Страница Центра Обучения (Learn)
  else if (currentPath === "/learn") {
    return (
      <div className="min-h-screen bg-[#0a0f1d] text-slate-100 font-mono flex flex-col">
        <Header
          navigateTo={navigateTo}
          isAuthenticated={isAuthenticated || isGuestMode}
          user={activeUser}
          onProfileUpdate={handleRefreshUserData}
          isGuestMode={isGuestMode && !isAuthenticated}
        />

        <main className="flex-grow flex flex-col items-center justify-start p-6 text-center animate-fade-in">
          <LearnPage onStartLesson={handleStartLesson} user={activeUser} />

          {showAchievement && (
            <AchievementModal
              rankName={achievementData.rank}
              xp={achievementData.xp}
              onClose={() => setShowAchievement(false)}
            />
          )}
        </main>
      </div>
    );
  }

  // 3.5. Страница Личного Кабинета (Профиль)
  else if (currentPath === "/profile") {
    return (
      <ProfileScreen
        user={activeUser}
        isGuestMode={isGuestMode && !isAuthenticated}
        navigateTo={navigateTo}
      />
    );
  }

  // 4. Экран страницы интерактивного урока
  else if (currentPath === "/lesson") {
    if (!lesson) {
      return (
        <div className="min-h-screen bg-[#0a0f1d] flex items-center justify-center text-xl font-bold font-mono text-emerald-400">
          [+] Подключение к терминалу лаборатории...
        </div>
      );
    }

    // Экран успешного прохождения модуля
    if (isLessonFinished) {
      return (
        <div className="min-h-screen bg-[#0a0f1d] flex flex-col items-center justify-center text-white p-4 font-mono">
          <div className="text-6xl mb-4 text-emerald-400">🏁</div>
          <h1 className="text-3xl font-bold mb-2 text-white">Комната Пройдена!</h1>
          <p className="text-slate-400 mb-6 text-center max-w-md">
            Вы успешно эксплуатировали все задачи модуля: {lesson.title}
          </p>
          <button
            onClick={handleGoToLearn}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer border-0 font-sans"
          >
            Продолжить &gt;
          </button>
        </div>
      );
    }

    // Экран Сбоя Системы (Game Over по жизням)
    if (isGameOver) {
      return (
        <div className="min-h-screen bg-[#0a0f1d] flex flex-col items-center justify-center text-white p-4 font-mono animate-fade-in">
          <div className="text-6xl mb-6 text-rose-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">💔</div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-rose-500 uppercase tracking-tight">
            [!] КРИТИЧЕСКИЙ СБОЙ ЯДРА
          </h1>
          <p className="text-slate-400 mb-8 text-center max-w-md text-sm leading-relaxed">
            Все резервные коды жизней (HP) были уничтожены некорректными инструкциями. Подключение к терминалу разорвано.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs justify-center">
            <button
              onClick={() => {
                // Полный сброс параметров и регенерация здоровья внутри урока
                setIsAnswerChecked(false);
                setIsCorrect(null);
                setCurrentAnswer(null);
                setHearts(5);
                setIsGameOver(false);
              }}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-slate-700 cursor-pointer text-xs uppercase"
            >
              Повторить попытку ⚡
            </button>

            <button
              onClick={() => {
                navigateTo("/learn");
                setLesson(null);
              }}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer border-0 text-xs uppercase"
            >
              Выйти в хаб
            </button>
          </div>
        </div>
      );
    }

    const currentTask = lesson.tasks[currentTaskIndex];

    if (!currentTask) {
      return (
        <div className="min-h-screen bg-[#0a0f1d] flex flex-col justify-center items-center p-4">
          <header className="max-w-4xl w-full mx-auto px-4 pt-6 flex items-center mb-8">
            <button
              onClick={() => {
                navigateTo("/learn");
                setLesson(null);
              }}
              className="text-slate-400 text-sm font-bold hover:text-white transition-colors cursor-pointer bg-transparent border-0 font-mono"
            >
              &lt; ВЫЙТИ В ЦЕНТР ОБУЧЕНИЯ
            </button>
          </header>
          <main className="flex-grow flex items-center justify-center py-10 px-4">
            <div className="text-rose-500 font-bold font-mono text-center">
              [-] КРИТИЧЕСКИЙ СБОЙ: Задача не найдена в конфигурационной матрице модуля.
            </div>
          </main>
        </div>
      );
    }

        const isAnswerEmpty =
      !currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0);
    const progressPercent =
      ((currentTaskIndex + (showTheory ? 0 : 0.5)) / lesson.tasks.length) * 100;

    return (
      <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col justify-between font-mono relative">
        {/* Хедер комнаты с индикатором жизней */}
        <header className="max-w-4xl w-full mx-auto px-4 pt-6 flex items-center gap-4 select-none">
          <button
            onClick={() => {
              navigateTo("/learn");
              setLesson(null);
            }}
            className="text-slate-400 text-sm font-bold hover:text-white transition-colors cursor-pointer bg-transparent border-0 font-mono"
          >
            &lt; ВЫЙТИ
          </button>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
            <div
              className="bg-emerald-400 h-full transition-all duration-300 shadow-[0_0_10px_#34d399]"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <span className="text-xs font-bold text-white whitespace-nowrap">
            [ {currentTaskIndex + 1} / {lesson.tasks.length} ]
          </span>

          {/* Индикатор оставшихся жизней */}
          <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800 px-3 py-1 rounded-xl ml-2">
            <span className="text-rose-500 text-base animate-pulse">❤️</span>
            <span className={`text-sm font-bold font-mono ${hearts <= 1 ? "text-rose-500 animate-bounce" : "text-slate-200"}`}>
              {hearts}
            </span>
          </div>
        </header>

        {/* Главный контейнер контента тасок */}
        <main className="flex-grow flex items-center justify-center py-10 px-4">
          <div className="w-full max-w-2xl bg-[#0d1527] border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl">
            {showTheory ? (
              <TheorySlide
                title={currentTask.theory.title}
                text={currentTask.theory.text}
                codeSnippet={currentTask.theory.codeSnippet}
                onStartPractice={() => setShowTheory(false)}
              />
            ) : (
              <>
                {currentTask.type === "BUILD_SENTENCE" && (
                  <BuildSentenceTask
                    task={currentTask}
                    onAnswerChange={setCurrentAnswer}
                    isAnswerChecked={isAnswerChecked}
                    key={currentTask.id}
                  />
                )}
                {currentTask.type === "SELECT_ONE" && (
                  <SelectOneTask
                    task={currentTask}
                    selectedAnswer={currentAnswer}
                    onAnswerChange={setCurrentAnswer}
                    isAnswerChecked={isAnswerChecked}
                    key={currentTask.id}
                  />
                )}
                {currentTask.type === "CODE_SANDBOX" && (
                  <CodeSandboxTask
                    task={currentTask}
                    onAnswerChange={setCurrentAnswer}
                    isAnswerChecked={isAnswerChecked}
                    key={currentTask.id}
                  />
                )}
              </>
            )}
          </div>
        </main>

        {/* Интерактивный Футер */}
        <footer
          className={`border-t py-6 px-4 transition-all duration-200 ${
            showTheory
              ? "bg-[#0d1527] border-slate-800 opacity-30 pointer-events-none select-none"
              : isAnswerChecked
                ? isCorrect
                  ? "bg-emerald-950/40 border-emerald-500/30"
                  : "bg-rose-950/40 border-rose-500/30"
                : "bg-[#0d1527] border-slate-800"
          }`}
        >
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              {isAnswerChecked && !showTheory && (
                <h3 className={`text-base font-bold ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
                  {isCorrect
                    ? "[+] СИСТЕМА: Ответ принят. Код валиден."
                    : "[-] ОШИБКА: Синтаксический сбой в цепочке."}
                </h3>
              )}
            </div>
            {!isAnswerChecked ? (
              <button
                onClick={handleCheckAnswer}
                disabled={isAnswerEmpty || showTheory}
                className={`w-full sm:w-auto px-12 py-3 font-bold text-sm rounded-xl border transition-all ${
                  !isAnswerEmpty && !showTheory
                    ? "bg-emerald-500 text-slate-950 border-emerald-600 hover:bg-emerald-400 active:translate-y-[1px] cursor-pointer"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700"
                }`}
              >
                ПРОГРАММИРОВАТЬ
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={isCorrect === false}
                className={`w-full sm:w-auto px-12 py-3 font-bold text-sm rounded-xl transition-all ${
                  isCorrect === false
                    ? "bg-slate-850 text-slate-600 opacity-50 cursor-not-allowed border border-slate-700"
                    : "bg-slate-100 text-slate-950 hover:bg-white active:translate-y-[1px] cursor-pointer"
                }`}
              >
                {isCorrect === false ? "КОД СЛОМАН ✕" : "СЛЕДУЮЩИЙ ХЕШ >"}
              </button>
            )}
          </div>
        </footer>

        {/* Модальное окно дебаггера ошибок */}
        {showErrorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 font-mono">
            <div className="w-full max-w-xl bg-[#0d1527] border-2 border-rose-500 rounded-2xl p-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <h2 className="text-lg font-bold text-rose-500 mb-2">&gt;_ СБОЙ_КОМПИЛЯЦИИ_КОДА</h2>
              <p className="text-xs text-slate-400 mb-4">[Логи дебаггера ядра системы обучения]</p>
              <div className="w-full bg-[#0a0f1d] border border-slate-800 p-4 mb-6 rounded-xl overflow-y-auto max-h-64 text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                {debugExplanation || currentTask.explanation || "Ошибка синтаксиса. Код вернул статус 500."}
              </div>
              <button
                onClick={handleRestartLesson}
                className="w-full py-3 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] cursor-pointer border-0"
              >
                [ ИСПРАВИТЬ ОШИБКУ В ТЕРМИНАЛЕ ]
              </button>
            </div>
          </div>
        )}

        {showAchievement && (
          <AchievementModal
            rankName={achievementData.rank}
            xp={achievementData.xp}
            onClose={() => setShowAchievement(false)}
          />
        )}
      </div>
    );
  }

  return <></>;
}


