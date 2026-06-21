const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");

app.use(helmet());

// ограничение запросов: 20 попыток за 15 минут на /api/login и /api/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 20,
  message: { error: "Слишком много попыток. Подождите 15 минут." }
});
app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);

// постгря
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://fakelingo:fakelingo_secret_2024@postgres:5432/fakelingo",
});

// ===== создание таблицы =====
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rank VARCHAR(100) DEFAULT 'Junior Dev',
    xp INTEGER DEFAULT 0,
    solved_tasks JSONB DEFAULT '[]',
    streak INTEGER DEFAULT 0,
    last_active_date DATE DEFAULT NULL,
    avatar VARCHAR(10) DEFAULT '🤖'
  );
`).then(() => console.log("[DB] Таблица users готова"))
  .catch(err => console.error("[DB] Ошибка:", err));

// ===== Уроки (статичные, без изменений) =====
const lessonsData = {
  "unit-1": {
    id: "unit-1",
    title: "Основы JavaScript",
    tasks: [
      {
        id: "task-1",
        type: "BUILD_SENTENCE",
        theory: {
          title: "Вывод данных в консоль",
          text: "В JavaScript для отладки программ и вывода информации используется специальная встроенная команда console.log(). Любой текст внутри неё оборачивается в кавычки.",
          codeSnippet: 'console.log("Привет, мир!");',
        },
        question: "Выведите в консоль приветствие 'Hello, World!':",
        wordsPool: ["console", "log", ".", "print", "(", ")", '"Hello, World!"', ";", "system"],
        correctSequence: ["console", ".", "log", "(", '"Hello, World!"', ")", ";"],
        explanation: 'Критическая ошибка компиляции...\n\nКорректный синтаксис: console.log("Hello, World!");',
      },
      {
        id: "task-2",
        type: "BUILD_SENTENCE",
        theory: {
          title: "Примитивные типы данных",
          text: "В JS есть несколько типов данных. Они делятся на примитивные и не примитивные.",
          codeSnippet: "const result = 'Петя' + 25;",
        },
        question: "Сложите строку 'Петя' и число 25, чтобы получить конкатенацию строк:",
        wordsPool: ["'Петя'", "25", "+", "concat", "add", ";", "str", "num"],
        correctSequence: ["'Петя'", "+", "25", ";"],
        explanation: "Ошибка несоответствия типов (Type Mismatch)...",
      },
      {
        id: "task-3",
        type: "BUILD_SENTENCE",
        theory: {
          title: "Конструкция условий (if)",
          text: "Условия — это конструкции, позволяющие выполнять участки кода только в том случае, если условие выполняется.",
          codeSnippet: "if (x > 10 && x < 20) {}",
        },
        question: "Напишите условие if, которое сработает, если x больше 10 И меньше 20:",
        wordsPool: ["if", "(", "x", ">", "10", "&&", "<", "20", "x", ")", "{", "}", "||"],
        correctSequence: ["if", "(", "x", ">", "10", "&&", "x", "<", "20", ")", "{", "}"],
        explanation: "Сбой логического оператора (Logical Operator Exception)...",
      },
    ],
  },
  "unit-2": {
    id: "unit-2",
    title: "Асинхронный JS & API",
    tasks: [
      {
        id: "u2-task-1",
        type: "SELECT_ONE",
        theory: {
          title: "Синхронный vs Асинхронный код",
          text: "JavaScript по своей природе однопоточный. Однако асинхронные операции позволяют выполнять тяжелые задачи в фоне, не блокируя основной поток.",
          codeSnippet: "setTimeout(() => console.log('Асинхронно'), 0);\nconsole.log('Синхронно');",
        },
        question: "What will be printed to the console first?",
        options: [
          { id: "ans1", text: "Синхронно" },
          { id: "ans2", text: "Асинхронно" },
          { id: "ans3", text: "They will be printed simultaneously" },
        ],
        correctOptionId: "ans1",
      },
      {
        id: "u2-task-2",
        type: "SELECT_ONE",
        theory: {
          title: "Call Stack и Task Queue",
          text: "Асинхронные задачи регистрируются в Web API, затем отправляются в Task Queue. Event Loop берёт их оттуда только когда Call Stack пуст.",
          codeSnippet: "// Event Loop начинает обработку очереди только после очистки стека",
        },
        question: "Когда Event Loop перемещает задачи из Task Queue в Call Stack?",
        options: [
          { id: "q1", text: "Когда истекает таймер, независимо от остального кода" },
          { id: "q2", text: "Когда Call Stack полностью очищен от синхронного кода" },
          { id: "q3", text: "Каждые 10 миллисекунд в случайном порядке" },
        ],
        correctOptionId: "q2",
      },
      {
        id: "u2-task-3",
        type: "BUILD_SENTENCE",
        theory: {
          title: "Использование функции setTimeout",
          text: "Функция setTimeout принимает колбэк-функцию и время задержки в миллисекундах.",
          codeSnippet: "setTimeout(() => { /* код */ }, 1000);",
        },
        question: "Write a setTimeout function call that will execute an empty arrow function after 1000ms:",
        wordsPool: ["setTimeout", "(", ")", "=>", "{", "}", ",", "1000", ";", "interval", "clear"],
        correctSequence: ["setTimeout", "(", "(", ")", "=>", "{", "}", ",", "1000", ")", ";"],
      },
      {
        id: "u2-task-4",
        type: "SELECT_ONE",
        theory: {
          title: "Прогнозирование Event Loop",
          text: "Проанализируйте порядок вывода: console.log('A'); setTimeout(() => console.log('B'), 0); console.log('C');",
          codeSnippet: "// Сначала A и C, потом B",
        },
        question: "В каком порядке выведутся буквы?",
        options: [
          { id: "seq1", text: "A -> B -> C" },
          { id: "seq2", text: "A -> C -> B" },
          { id: "seq3", text: "B -> A -> C" },
        ],
        correctOptionId: "seq2",
      },
      {
        id: "u2-task-5",
        type: "BUILD_SENTENCE",
        theory: {
          title: "Создание асинхронной задержки (delay)",
          text: "setTimeout оборачивают в Promise для использования с async/await.",
          codeSnippet: "const delay = ms => new Promise(res => setTimeout(res, ms));",
        },
        question: "Assemble the returned promise inside the delay arrow function:",
        wordsPool: ["new", "Promise", "(", "res", "=>", "setTimeout", "reset", ")", ";", "function"],
        correctSequence: ["new", "Promise", "(", "res", "=>", "setTimeout", ")", ";"],
      },
    ],
  },
  "unit-4": {
    id: "unit-4",
    title: "Песочница: Замыкания",
    tasks: [
      {
        id: "task-closure-sandbox",
        type: "CODE_SANDBOX",
        theory: {
          title: "Замыкания в JavaScript (Counter)",
          text: "Замыкание — способность функции запоминать лексическое окружение, в котором она была создана.",
          codeSnippet: "function createCounter() {\n  let count = 0;\n  return function() { count++; return count; };\n}",
        },
        question: "Допишите тело функции createCounter так, чтобы каждый вызов увеличивал count на 1:",
        starterCode: "function createCounter() {\n  let count = 0;\n  // Напишите ваш код ниже этой строки\n  \n}",
        requiredNodes: [
          { type: "ReturnStatement", argumentType: "FunctionExpression" },
          { type: "UpdateExpression", operator: "++", argumentName: "count" },
          { type: "ReturnStatement", argumentType: "Identifier", argumentName: "count" },
        ],
        explanation: "Ошибка компиляции или логики замыкания.",
      },
    ],
  },
  "unit-ts": {
    id: "unit-ts",
    title: "TypeScript: Типы и интерфейсы",
    tasks: [
      {
        id: "ts-task-1",
        type: "BUILD_SENTENCE",
        theory: {
          title: "Аннотация типов",
          text: "TypeScript добавляет типизацию поверх JavaScript.",
          codeSnippet: "let age: number = 25;",
        },
        question: "Соберите объявление переменной userName типа string со значением 'Neo':",
        wordsPool: ["let", "userName", ":", "string", "=", "'Neo'", ";", "const", "number"],
        correctSequence: ["let", "userName", ":", "string", "=", "'Neo'", ";"],
        explanation: "В TypeScript тип указывается через ':' после имени переменной.",
      },
      {
        id: "ts-task-2",
        type: "SELECT_ONE",
        theory: {
          title: "Интерфейсы TypeScript",
          text: "Интерфейсы описывают структуру объектов.",
          codeSnippet: "interface User { name: string; age: number; }",
        },
        question: "Какой вариант описывает объект с полем count типа number?",
        options: [
          { id: "opt1", text: "interface Counter { count: string; }" },
          { id: "opt2", text: "interface Counter { count: number; }" },
          { id: "opt3", text: "interface Counter { count: bool; }" },
        ],
        correctOptionId: "opt2",
      },
    ],
  },
  "unit-python": {
    id: "unit-python",
    title: "Python: синтаксис и коллекции",
    tasks: [
      {
        id: "py-task-1",
        type: "BUILD_SENTENCE",
        theory: {
          title: "Вывод в консоль",
          text: "В Python для вывода текста используется функция print().",
          codeSnippet: "print('Hello, World!')",
        },
        question: "Соберите команду, которая выведет 'Hello, Python!':",
        wordsPool: ["print", "(", "'Hello, Python!'", ")", ";", "console.log", "'Hello'", "print()"],
        correctSequence: ["print", "(", "'Hello, Python!'", ")"],
        explanation: "В Python строка печатается через print('текст').",
      },
      {
        id: "py-task-2",
        type: "SELECT_ONE",
        theory: {
          title: "Списки и кортежи",
          text: "Список list изменяем, а кортеж tuple — нет.",
          codeSnippet: "names = ['Neo', 'Trinity', 'Morpheus']",
        },
        question: "Какой вариант описывает кортеж?",
        options: [
          { id: "py1", text: "['Neo', 'Trinity']" },
          { id: "py2", text: "('Neo', 'Trinity')" },
          { id: "py3", text: "{ 'Neo', 'Trinity' }" },
        ],
        correctOptionId: "py2",
      },
    ],
  },
  "unit-algo": {
    id: "unit-algo",
    title: "Алгоритмы: сложность и базовые структуры",
    tasks: [
      {
        id: "algo-task-1",
        type: "SELECT_ONE",
        theory: {
          title: "Бинарный поиск",
          text: "Бинарный поиск работает на отсортированном массиве, деля зону поиска пополам.",
          codeSnippet: "if (array[mid] === target) { return mid; }",
        },
        question: "Какая временная сложность у бинарного поиска?",
        options: [
          { id: "a1", text: "O(n)" },
          { id: "a2", text: "O(log n)" },
          { id: "a3", text: "O(n^2)" },
        ],
        correctOptionId: "a2",
      },
      {
        id: "algo-task-2",
        type: "BUILD_SENTENCE",
        theory: {
          title: "Цикл for",
          text: "Цикл for позволяет пройтись по диапазону чисел.",
          codeSnippet: "for (let i = 0; i < 5; i++) { console.log(i); }",
        },
        question: "Соберите цикл, который выполняется 5 раз:",
        wordsPool: ["for", "(", "let", "i", "=", "0", ";", "i", "<", "5", ";", "i++", ")", "{", "}", "console.log(i);"],
        correctSequence: ["for", "(", "let", "i", "=", "0", ";", "i", "<", "5", ";", "i++", ")", "{", "console.log(i);", "}"],
        explanation: "Цикл должен содержать три части разделенные ';'.",
      },
    ],
  },
  "unit-db": {
    id: "unit-db",
    title: "Базы данных: SQL и запросы",
    tasks: [
      {
        id: "db-task-1",
        type: "SELECT_ONE",
        theory: {
          title: "Основы SQL",
          text: "SQL используется для работы с реляционными базами данных.",
          codeSnippet: "SELECT * FROM users WHERE id = 1;",
        },
        question: "Какой запрос вернет все поля из таблицы users для пользователя с id 1?",
        options: [
          { id: "d1", text: "SELECT users FROM * WHERE id = 1;" },
          { id: "d2", text: "SELECT * FROM users WHERE id = 1;" },
          { id: "d3", text: "GET * FROM users WHERE id = 1;" },
        ],
        correctOptionId: "d2",
      },
      {
        id: "db-task-2",
        type: "BUILD_SENTENCE",
        theory: {
          title: "Фильтрация данных",
          text: "Для фильтрации в SQL используется WHERE.",
          codeSnippet: "SELECT name FROM users WHERE active = 1;",
        },
        question: "Соберите SQL-запрос, который выберет имя пользователя из таблицы users, если active равно 1:",
        wordsPool: ["SELECT", "name", "FROM", "users", "WHERE", "active", "=", "1", ";", "ALL", "*"],
        correctSequence: ["SELECT", "name", "FROM", "users", "WHERE", "active", "=", "1", ";"],
        explanation: "Запрос использует WHERE для фильтрации.",
      },
    ],
  },
  "unit-arch": {
    id: "unit-arch",
    title: "Архитектура: шаблоны и сервисы",
    tasks: [
      {
        id: "arch-task-1",
        type: "SELECT_ONE",
        theory: {
          title: "Паттерн MVC",
          text: "MVC разделяет приложение на модель, вид и контроллер.",
          codeSnippet: "Model -> View -> Controller",
        },
        question: "За что отвечает Controller в MVC?",
        options: [
          { id: "p1", text: "За хранение данных" },
          { id: "p2", text: "За отображение интерфейса" },
          { id: "p3", text: "За обработку пользовательского ввода и логику" },
        ],
        correctOptionId: "p3",
      },
      {
        id: "arch-task-2",
        type: "BUILD_SENTENCE",
        theory: {
          title: "REST API",
          text: "REST строится вокруг ресурсов: GET, POST, PUT, DELETE.",
          codeSnippet: "GET /api/users",
        },
        question: "Соберите REST-запрос для получения списка пользователей:",
        wordsPool: ["GET", "/api/users", "POST", "/api/user", "DELETE", "/users"],
        correctSequence: ["GET", "/api/users"],
        explanation: "GET /api/users запрашивает список пользователей.",
      },
    ],
  },
  "unit-security": {
    id: "unit-security",
    title: "Безопасность: XSS и SQL-инъекции",
    tasks: [
      {
        id: "sec-task-1",
        type: "SELECT_ONE",
        theory: {
          title: "SQL-инъекция",
          text: "SQL-инъекция возникает, когда пользовательский ввод вставляется напрямую в SQL-запрос.",
          codeSnippet: "SELECT * FROM users WHERE name = '" + "{userInput}" + "'",
        },
        question: "Что помогает защититься от SQL-инъекции?",
        options: [
          { id: "s1", text: "Использование параметризованных запросов" },
          { id: "s2", text: "Добавление комментариев в SQL" },
          { id: "s3", text: "Сохранение паролей в текстовом виде" },
        ],
        correctOptionId: "s1",
      },
      {
        id: "sec-task-2",
        type: "BUILD_SENTENCE",
        theory: {
          title: "Очистка пользовательского ввода",
          text: "Для защиты от XSS нужно экранировать пользовательский ввод.",
          codeSnippet: "const safeValue = sanitize(userInput);",
        },
        question: "Соберите строку, которая сохраняет очищенное значение из userInput:",
        wordsPool: ["const", "safeValue", "=", "sanitize", "(", "userInput", ")", ";", "let", "escape"],
        correctSequence: ["const", "safeValue", "=", "sanitize", "(", "userInput", ")", ";"],
        explanation: "Очищенный ввод сохраняется через sanitize(userInput).",
      },
    ],
  },
};

let currentSessionUser = null;

app.get("/api/user", async (req, res) => {
  if (!currentSessionUser) {
    return res.status(401).json({ error: "Не авторизован" });
  }
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [currentSessionUser.id]);
    if (result.rows.length === 0) {
      currentSessionUser = null;
      return res.status(401).json({ error: "Пользователь не найден" });
    }
    const u = result.rows[0];
    res.json({
      id: u.id, username: u.username, password: u.password, rank: u.rank,
      xp: u.xp, solvedTasks: u.solved_tasks || [], streak: u.streak || 0,
      lastActiveDate: u.last_active_date, avatar: u.avatar || "🤖"
    });
  } catch (err) {
    console.error("[DB]", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Заполните все поля" });
  }
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: "Имя от 3 до 20 символов" });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: "Пароль минимум 4 символа" });
  }
  try {
    const existing = await pool.query(
      "SELECT id FROM users WHERE LOWER(username) = LOWER($1)", [username]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Пользователь с таким именем уже существует" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, password, rank, xp, solved_tasks, streak, last_active_date, avatar)
       VALUES ($1, $2, 'Junior Dev', 0, '[]', 0, NULL, '🤖') RETURNING *`,
      [username.trim(), hashedPassword]
    );
    const u = result.rows[0];
    currentSessionUser = { id: u.id, username: u.username };
    console.log(`[DB] Регистрация: ${u.username}`);
    res.json({
      id: u.id, username: u.username, rank: u.rank, xp: u.xp,
      solvedTasks: [], streak: 0, lastActiveDate: null, avatar: "🤖"
    });
  } catch (err) {
    console.error("[DB]", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE username = $1 AND password = $2", [username, password]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Неверное имя пользователя или пароль" });
    }
    const u = result.rows[0];
    currentSessionUser = { id: u.id, username: u.username, password: u.password };
    console.log(`[DB] Вход: ${u.username}`);
    res.json({
      id: u.id, username: u.username, password: u.password, rank: u.rank,
      xp: u.xp, solvedTasks: u.solved_tasks || [], streak: u.streak || 0,
      lastActiveDate: u.last_active_date, avatar: u.avatar || "🤖"
    });
  } catch (err) {
    console.error("[DB]", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

app.post("/api/logout", (req, res) => {
  currentSessionUser = null;
  res.json({ success: true });
});

app.get("/api/lessons/:id", (req, res) => {
  const lesson = lessonsData[req.params.id];
  if (!lesson) return res.status(404).json({ error: "Урок не найден" });
  res.json(lesson);
});

app.post("/api/user/complete-lesson", async (req, res) => {
  const { roomId, xpToAdd } = req.body;
  if (!currentSessionUser) {
    return res.status(401).json({ error: "Не авторизован" });
  }
  try {
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [currentSessionUser.id]);
    if (userResult.rows.length === 0) {
      currentSessionUser = null;
      return res.status(404).json({ error: "Пользователь не найден" });
    }
    const u = userResult.rows[0];
    let solvedTasks = u.solved_tasks || [];
    if (roomId && !solvedTasks.includes(roomId)) {
      solvedTasks = [...solvedTasks, roomId];
    }
    const newXp = (u.xp || 0) + (xpToAdd || 250);
    let newRank = "Junior Dev";
    if (newXp >= 500) newRank = "Elite Hacker";
    else if (newXp >= 250) newRank = "Senior Engineer";

    const todayStr = new Date().toISOString().split("T")[0];
    let newStreak = u.streak || 0;
    let newLastActive = u.last_active_date;
    if (!u.last_active_date) {
      newStreak = 1;
      newLastActive = todayStr;
    } else {
      const diffDays = Math.round((new Date(todayStr) - new Date(u.last_active_date)) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) { newStreak = (u.streak || 0) + 1; newLastActive = todayStr; }
      else if (diffDays > 1) { newStreak = 1; newLastActive = todayStr; }
    }

    await pool.query(
      `UPDATE users SET solved_tasks = $1, xp = $2, rank = $3, streak = $4, last_active_date = $5 WHERE id = $6`,
      [JSON.stringify(solvedTasks), newXp, newRank, newStreak, newLastActive, currentSessionUser.id]
    );
    console.log(`[DB] Прогресс: ${u.username} XP=${newXp} Стрик=${newStreak}`);
    const updated = await pool.query("SELECT * FROM users WHERE id = $1", [currentSessionUser.id]);
    const u2 = updated.rows[0];
    res.json({
      id: u2.id, username: u2.username, password: u2.password, rank: u2.rank,
      xp: u2.xp, solvedTasks: u2.solved_tasks || [], streak: u2.streak || 0,
      lastActiveDate: u2.last_active_date, avatar: u2.avatar || "🤖"
    });
  } catch (err) {
    console.error("[DB]", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

//   ОБНОВЛЕНИЕ ПРОФИЛЯ
app.post("/api/user/update", async (req, res) => {
  const { username, password, avatar } = req.body;
  if (!currentSessionUser) {
    return res.status(401).json({ error: "Не авторизован" });
  }
  try {
    const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [currentSessionUser.id]);
    if (userResult.rows.length === 0) {
      currentSessionUser = null;
      return res.status(404).json({ error: "Пользователь не найден" });
    }
    const u = userResult.rows[0];
    let newUsername = u.username, newPassword = u.password, newAvatar = u.avatar || "🤖";
    if (username && username.toLowerCase() !== u.username.toLowerCase()) {
      const nameCheck = await pool.query(
        "SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id != $2", [username, currentSessionUser.id]
      );
      if (nameCheck.rows.length > 0) {
        return res.status(400).json({ error: "Это имя уже занято" });
      }
      newUsername = username;
    }
        if (password) {
      if (password.length < 4) {
        return res.status(400).json({ error: "Пароль минимум 4 символа" });
      }
      newPassword = await bcrypt.hash(password, 10);
    }
    if (avatar) newAvatar = avatar;

    await pool.query(
      "UPDATE users SET username = $1, password = $2, avatar = $3 WHERE id = $4",
      [newUsername, newPassword, newAvatar, currentSessionUser.id]
    );
    console.log(`[DB] Профиль обновлён: ${newUsername}`);
    const updated = await pool.query("SELECT * FROM users WHERE id = $1", [currentSessionUser.id]);
    const u2 = updated.rows[0];
    res.json({
      id: u2.id, username: u2.username, password: u2.password, rank: u2.rank,
      xp: u2.xp, solvedTasks: u2.solved_tasks || [], streak: u2.streak || 0,
      lastActiveDate: u2.last_active_date, avatar: u2.avatar || "🤖"
    });
  } catch (err) {
    console.error("[DB]", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Бэкенд с PostgreSQL запущен на http://localhost:${PORT}`);
});

// ===== Пphphpphphp =====
const ArkadyWisdom = {
  quotes: [
    { text: "Rise and shine, Mr. Freeman. Rise and shine.", author: "G-Man (Half-Life 2)" },
    { text: "Time to choose, Dr. Freeman. But choose wisely.", author: "G-Man (Half-Life 2)" },
    { text: "We are the nobodies, wanna be somebodies.", author: "Marilyn Manson" },
    { text: "Pick up that can. Now pick up that can and follow me.", author: "Civil Protection (HL2)" },
    { text: "The server is not down. It's just... rebooting its consciousness.", author: "Аркадий, 2026" },
    { text: "Проблема не в Docker. Проблема между креслом и клавиатурой.", author: "Админская мудрость" },
    { text: "Гавайская рубашка — не просто одежда, это state of mind.", author: "Аркадий, 13 лет стажа" },
    { text: "It's not a bug, it's an undocumented feature.", author: "Каждый разработчик" },
    { text: "Если заработало — не трогай. Если не заработало — перезагрузи.", author: "Закон админа" },
    { text: "Я не волшебник, я просто знаю, где лежат логи.", author: "Аркадий" },
  ],

  getRandom() {
    const idx = Math.floor(Math.random() * this.quotes.length);
    return this.quotes[idx];
  },

  getByAuthor(author) {
    return this.quotes.filter(q => q.author.toLowerCase().includes(author.toLowerCase()));
  },

  getAll() {
    return this.quotes;
  }
};

app.get("/api/break-time", (req, res) => {
  const { author } = req.query;

  if (author) {
    const found = ArkadyWisdom.getByAuthor(author);
    if (found.length === 0) {
      return res.json({
        message: "Нет цитат от такого автора. Но ты попробуй перезагрузить — вдруг появится.",
        quote: ArkadyWisdom.getRandom()
      });
    }
    return res.json({ quotes: found, count: found.length });
  }

  res.json({ quote: ArkadyWisdom.getRandom() });
});
