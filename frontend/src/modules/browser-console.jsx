import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/*
Instruction:
1. Copy this file to src/modules/browser-console.jsx.
2. Wrap the app with <BrowserConsoleProvider>.
3. Render <BrowserConsoleWindow /> once near the root.
4. Use <ConsoleErrorBoundary> to capture React render crashes.
*/

const CONSOLE_EVENT = "browser-console:entry";
const DEFAULT_METHODS = ["debug", "log", "info", "warn", "error"];
const ERROR_LEVELS = new Set(["error", "warn"]);
const EMPTY_CAPTURE_OPTIONS = {};

let captureRuntime = null;
let entryCounter = 0;

const BrowserConsoleContext = createContext({
  entries: [],
  addEntry: () => undefined,
  clear: () => undefined,
  exportText: () => "",
});

function canUseWindow() {
  return typeof window !== "undefined";
}

function nowIso() {
  return new Date().toISOString();
}

function createEntryId() {
  entryCounter += 1;
  return `${Date.now()}-${entryCounter}`;
}

function truncate(value, maxLength) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}... [trimmed]`;
}

function stringifyObject(value) {
  const seen = new WeakSet();

  return JSON.stringify(
    value,
    (_key, item) => {
      if (typeof item === "bigint") return `${item.toString()}n`;
      if (typeof item === "function") return `[Function ${item.name || "anonymous"}]`;
      if (typeof item === "symbol") return String(item);
      if (item instanceof Error) {
        return {
          name: item.name,
          message: item.message,
          stack: item.stack,
        };
      }
      if (item && typeof item === "object") {
        if (seen.has(item)) return "[Circular]";
        seen.add(item);
      }
      return item;
    },
    2
  );
}

function formatValue(value, maxLength) {
  if (value instanceof Error) {
    return truncate(`${value.name}: ${value.message}\n${value.stack || ""}`, maxLength);
  }

  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string") return truncate(value, maxLength);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "bigint") return `${value.toString()}n`;
  if (typeof value === "symbol") return String(value);
  if (typeof value === "function") return `[Function ${value.name || "anonymous"}]`;

  if (value && value.nodeType && value.nodeName) {
    return `<${String(value.nodeName).toLowerCase()}>`;
  }

  try {
    return truncate(stringifyObject(value), maxLength);
  } catch {
    return truncate(String(value), maxLength);
  }
}

function formatArgs(args, maxLength) {
  return args.map((item) => formatValue(item, maxLength));
}

function getErrorStack(value) {
  if (value instanceof Error) return value.stack;
  return undefined;
}

function getFetchUrl(input) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  if (input && typeof input.url === "string") return input.url;
  return "unknown";
}

function createBaseEntry(level, type, message, details = {}) {
  return {
    id: createEntryId(),
    level,
    type,
    message,
    timestamp: nowIso(),
    page: canUseWindow() ? window.location.href : undefined,
    ...details,
  };
}

function emitEntry(entry) {
  if (!canUseWindow()) return;
  window.dispatchEvent(new CustomEvent(CONSOLE_EVENT, { detail: entry }));
}

export function installBrowserConsoleCapture(options = {}) {
  if (!canUseWindow()) return () => undefined;

  if (captureRuntime) {
    captureRuntime.refs += 1;
    return () => {
      captureRuntime.refs -= 1;
      if (captureRuntime.refs <= 0) {
        captureRuntime.cleanup();
        captureRuntime = null;
      }
    };
  }

  const {
    captureConsole = true,
    captureErrors = true,
    captureRejections = true,
    captureFetch = false,
    captureSuccessfulFetch = false,
    forwardToNativeConsole = true,
    methods = DEFAULT_METHODS,
    maxStringLength = 4000,
  } = options;

  const cleanups = [];
  const originalConsole = {};

  if (!window.console) window.console = {};

  if (captureConsole) {
    methods.forEach((method) => {
      const original = typeof console[method] === "function" ? console[method].bind(console) : null;
      originalConsole[method] = console[method];

      console[method] = (...args) => {
        const formattedArgs = formatArgs(args, maxStringLength);
        emitEntry(
          createBaseEntry(method, "console", formattedArgs.join(" "), {
            args: formattedArgs,
            stack: args.map(getErrorStack).find(Boolean),
          })
        );

        if (forwardToNativeConsole && original) original(...args);
      };
    });

    cleanups.push(() => {
      methods.forEach((method) => {
        console[method] = originalConsole[method];
      });
    });
  }

  if (captureErrors) {
    const handleError = (event) => {
      const error = event.error;
      const message = error?.message || event.message || "Unknown runtime error";

      emitEntry(
        createBaseEntry("error", "runtime", message, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: error?.stack,
        })
      );
    };

    window.addEventListener("error", handleError);
    cleanups.push(() => window.removeEventListener("error", handleError));
  }

  if (captureRejections) {
    const handleRejection = (event) => {
      const reason = event.reason;
      const message =
        reason instanceof Error ? reason.message : formatValue(reason, maxStringLength);

      emitEntry(
        createBaseEntry("error", "promise", message || "Unhandled promise rejection", {
          stack: getErrorStack(reason),
          args: [formatValue(reason, maxStringLength)],
        })
      );
    };

    window.addEventListener("unhandledrejection", handleRejection);
    cleanups.push(() => window.removeEventListener("unhandledrejection", handleRejection));
  }

  if (captureFetch && typeof window.fetch === "function") {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const startedAt = performance.now();
      const url = getFetchUrl(args[0]);

      try {
        const response = await originalFetch(...args);
        const duration = Math.round(performance.now() - startedAt);

        if (!response.ok || captureSuccessfulFetch) {
          emitEntry(
            createBaseEntry(response.ok ? "info" : "error", "network", `${response.status} ${url}`, {
              status: response.status,
              statusText: response.statusText,
              duration,
              requestUrl: url,
            })
          );
        }

        return response;
      } catch (error) {
        const duration = Math.round(performance.now() - startedAt);
        emitEntry(
          createBaseEntry("error", "network", `${url}: ${error.message}`, {
            duration,
            requestUrl: url,
            stack: error.stack,
          })
        );
        throw error;
      }
    };

    cleanups.push(() => {
      window.fetch = originalFetch;
    });
  }

  captureRuntime = {
    refs: 1,
    cleanup() {
      cleanups.forEach((cleanup) => cleanup());
    },
  };

  return () => {
    if (!captureRuntime) return;
    captureRuntime.refs -= 1;
    if (captureRuntime.refs <= 0) {
      captureRuntime.cleanup();
      captureRuntime = null;
    }
  };
}

function readStoredEntries(storageKey) {
  if (!storageKey || !canUseWindow()) return [];

  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function writeStoredEntries(storageKey, entries) {
  if (!storageKey || !canUseWindow()) return;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(entries));
  } catch {
    // Ignore storage quota and private mode failures.
  }
}

export function BrowserConsoleProvider({
  children,
  maxEntries = 300,
  persist = false,
  storageKey = "browser-console:entries",
  install = true,
  captureOptions = EMPTY_CAPTURE_OPTIONS,
  initialEntries = [],
}) {
  const resolvedStorageKey = persist ? storageKey : "";
  const [entries, setEntries] = useState(() => [
    ...readStoredEntries(resolvedStorageKey),
    ...initialEntries,
  ]);

  const addEntry = useCallback(
    (entry) => {
      const normalized = {
        id: entry.id || createEntryId(),
        level: entry.level || "log",
        type: entry.type || "manual",
        message: String(entry.message || ""),
        timestamp: entry.timestamp || nowIso(),
        ...entry,
      };

      setEntries((current) => {
        const next = [...current, normalized];
        return next.length > maxEntries ? next.slice(next.length - maxEntries) : next;
      });

      return normalized;
    },
    [maxEntries]
  );

  const clear = useCallback(() => setEntries([]), []);

  const exportText = useCallback(
    () =>
      entries
        .map((entry) => {
          const header = `[${entry.timestamp}] ${entry.level.toUpperCase()} ${entry.type}`;
          const stack = entry.stack ? `\n${entry.stack}` : "";
          return `${header}: ${entry.message}${stack}`;
        })
        .join("\n\n"),
    [entries]
  );

  useEffect(() => {
    if (!install) return undefined;
    return installBrowserConsoleCapture(captureOptions);
  }, [captureOptions, install]);

  useEffect(() => {
    if (!canUseWindow()) return undefined;
    const handleEntry = (event) => addEntry(event.detail);
    window.addEventListener(CONSOLE_EVENT, handleEntry);
    return () => window.removeEventListener(CONSOLE_EVENT, handleEntry);
  }, [addEntry]);

  useEffect(() => {
    writeStoredEntries(resolvedStorageKey, entries);
  }, [entries, resolvedStorageKey]);

  const value = useMemo(
    () => ({
      entries,
      addEntry,
      clear,
      exportText,
    }),
    [addEntry, clear, entries, exportText]
  );

  return (
    <BrowserConsoleContext.Provider value={value}>{children}</BrowserConsoleContext.Provider>
  );
}

export function useBrowserConsole() {
  return useContext(BrowserConsoleContext);
}

function matchesFilter(entry, level, query) {
  const levelMatch = level === "all" || entry.level === level;
  if (!levelMatch) return false;

  if (!query) return true;

  const lowerQuery = query.toLowerCase();
  return `${entry.level} ${entry.type} ${entry.message} ${entry.stack || ""}`
    .toLowerCase()
    .includes(lowerQuery);
}

function downloadText(filename, text) {
  if (!canUseWindow()) return;

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function getLevelStyle(level) {
  if (level === "error") return { color: "#ffb4ab", borderColor: "#8c1d18" };
  if (level === "warn") return { color: "#ffd166", borderColor: "#765a00" };
  if (level === "info") return { color: "#9ecbff", borderColor: "#245a91" };
  if (level === "debug") return { color: "#c8b6ff", borderColor: "#5c4f91" };
  return { color: "#d8dee9", borderColor: "#465163" };
}

export function BrowserConsoleWindow({
  defaultOpen = false,
  title = "Browser console",
  position = "bottom-right",
  height = 420,
  width = 720,
  hotkey = "F9",
  showLauncher = true,
  launcherLabel = "Console",
}) {
  const { entries, clear, exportText } = useBrowserConsole();
  const [open, setOpen] = useState(defaultOpen);
  const [level, setLevel] = useState("all");
  const [query, setQuery] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef(null);

  const filteredEntries = useMemo(
    () => entries.filter((entry) => matchesFilter(entry, level, query)),
    [entries, level, query]
  );

  const errorCount = useMemo(
    () => entries.filter((entry) => ERROR_LEVELS.has(entry.level)).length,
    [entries]
  );

  useEffect(() => {
    if (!hotkey || !canUseWindow()) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === hotkey) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hotkey]);

  useEffect(() => {
    if (!open || !autoScroll || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [autoScroll, filteredEntries, open]);

  const positionStyle = getPositionStyle(position);

  if (!open) {
    if (!showLauncher) return null;

    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ ...launcherStyle, ...positionStyle }}
        title={hotkey ? `Open console (${hotkey})` : "Open console"}
      >
        {launcherLabel}
        {errorCount > 0 && <span style={badgeStyle}>{errorCount}</span>}
      </button>
    );
  }

  return (
    <section
      style={{
        ...panelStyle,
        ...positionStyle,
        width: `min(${width}px, calc(100vw - 24px))`,
        height: `min(${height}px, calc(100vh - 24px))`,
      }}
      aria-label={title}
    >
      <header style={headerStyle}>
        <strong style={titleStyle}>{title}</strong>
        <span style={countStyle}>
          {filteredEntries.length}/{entries.length}
        </span>
        <button type="button" onClick={() => setOpen(false)} style={iconButtonStyle}>
          x
        </button>
      </header>

      <div style={toolbarStyle}>
        <select value={level} onChange={(event) => setLevel(event.target.value)} style={selectStyle}>
          <option value="all">All</option>
          <option value="error">Errors</option>
          <option value="warn">Warnings</option>
          <option value="log">Logs</option>
          <option value="info">Info</option>
          <option value="debug">Debug</option>
        </select>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
          style={inputStyle}
        />

        <label style={checkboxStyle}>
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(event) => setAutoScroll(event.target.checked)}
          />
          Auto
        </label>

        <button
          type="button"
          style={toolButtonStyle}
          onClick={() => navigator.clipboard?.writeText(exportText())}
        >
          Copy
        </button>

        <button
          type="button"
          style={toolButtonStyle}
          onClick={() => downloadText("browser-console.log", exportText())}
        >
          Save
        </button>

        <button type="button" style={toolButtonStyle} onClick={clear}>
          Clear
        </button>
      </div>

      <div ref={scrollRef} style={logListStyle}>
        {filteredEntries.length === 0 ? (
          <div style={emptyStyle}>No console entries yet.</div>
        ) : (
          filteredEntries.map((entry) => (
            <ConsoleEntryRow key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </section>
  );
}

function ConsoleEntryRow({ entry }) {
  const [expanded, setExpanded] = useState(entry.level === "error");
  const levelStyle = getLevelStyle(entry.level);

  return (
    <article style={{ ...entryStyle, borderLeftColor: levelStyle.borderColor }}>
      <button type="button" onClick={() => setExpanded((current) => !current)} style={rowButtonStyle}>
        <span style={{ ...levelLabelStyle, color: levelStyle.color }}>{entry.level}</span>
        <span style={typeStyle}>{entry.type}</span>
        <span style={timeStyle}>{new Date(entry.timestamp).toLocaleTimeString()}</span>
      </button>

      <pre style={messageStyle}>{entry.message}</pre>

      {expanded && (
        <div style={detailsStyle}>
          {entry.filename && <div>File: {entry.filename}:{entry.lineno}:{entry.colno}</div>}
          {entry.status && <div>Status: {entry.status} {entry.statusText}</div>}
          {entry.duration !== undefined && <div>Duration: {entry.duration}ms</div>}
          {entry.requestUrl && <div>Request: {entry.requestUrl}</div>}
          {entry.page && <div>Page: {entry.page}</div>}
          {entry.stack && <pre style={stackStyle}>{entry.stack}</pre>}
        </div>
      )}
    </article>
  );
}

export function BrowserConsoleLauncher(props) {
  return <BrowserConsoleWindow {...props} />;
}

export function BrowserConsoleOverlay({
  children,
  providerProps = {},
  windowProps = {},
}) {
  return (
    <BrowserConsoleProvider {...providerProps}>
      {children}
      <BrowserConsoleWindow {...windowProps} />
    </BrowserConsoleProvider>
  );
}

function DefaultErrorFallback({ error, reset }) {
  return (
    <div role="alert" style={fallbackStyle}>
      <strong>Application error</strong>
      <div style={{ marginTop: 8 }}>{error?.message || "Unknown error"}</div>
      <button type="button" onClick={reset} style={fallbackButtonStyle}>
        Try again
      </button>
    </div>
  );
}

export class ConsoleErrorBoundary extends React.Component {
  static contextType = BrowserConsoleContext;

  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.context.addEntry({
      level: "error",
      type: "react",
      message: error.message,
      stack: `${error.stack || ""}\n${info.componentStack || ""}`.trim(),
    });
  }

  reset() {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (typeof this.props.fallback === "function") {
      return this.props.fallback({ error: this.state.error, reset: this.reset });
    }

    if (this.props.fallback) return this.props.fallback;

    return <DefaultErrorFallback error={this.state.error} reset={this.reset} />;
  }
}

function getPositionStyle(position) {
  const vertical = position.includes("top") ? { top: 12 } : { bottom: 12 };
  const horizontal = position.includes("left") ? { left: 12 } : { right: 12 };
  return { ...vertical, ...horizontal };
}

const launcherStyle = {
  position: "fixed",
  zIndex: 2147483000,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  minHeight: 38,
  padding: "0 12px",
  border: "1px solid #394150",
  borderRadius: 8,
  background: "#111827",
  color: "#f9fafb",
  font: "700 13px system-ui, sans-serif",
  cursor: "pointer",
  boxShadow: "0 12px 30px rgba(0, 0, 0, 0.28)",
};

const badgeStyle = {
  minWidth: 20,
  height: 20,
  padding: "0 5px",
  borderRadius: 10,
  background: "#dc2626",
  color: "#ffffff",
  fontSize: 12,
  lineHeight: "20px",
};

const panelStyle = {
  position: "fixed",
  zIndex: 2147483000,
  display: "grid",
  gridTemplateRows: "42px 42px 1fr",
  overflow: "hidden",
  border: "1px solid #303846",
  borderRadius: 8,
  background: "#0b1020",
  color: "#d8dee9",
  font: "13px system-ui, sans-serif",
  boxShadow: "0 18px 50px rgba(0, 0, 0, 0.38)",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "0 10px",
  borderBottom: "1px solid #202838",
  background: "#111827",
};

const titleStyle = {
  flex: 1,
  color: "#ffffff",
};

const countStyle = {
  color: "#9ca3af",
  fontSize: 12,
};

const iconButtonStyle = {
  width: 28,
  height: 28,
  border: "1px solid #384152",
  borderRadius: 6,
  background: "#1f2937",
  color: "#ffffff",
  cursor: "pointer",
};

const toolbarStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 10px",
  borderBottom: "1px solid #202838",
  background: "#101827",
};

const selectStyle = {
  height: 28,
  minWidth: 96,
  border: "1px solid #384152",
  borderRadius: 6,
  background: "#0b1020",
  color: "#f9fafb",
};

const inputStyle = {
  flex: 1,
  minWidth: 80,
  height: 28,
  boxSizing: "border-box",
  border: "1px solid #384152",
  borderRadius: 6,
  padding: "0 8px",
  background: "#0b1020",
  color: "#f9fafb",
};

const checkboxStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  color: "#cbd5e1",
  whiteSpace: "nowrap",
};

const toolButtonStyle = {
  height: 28,
  padding: "0 8px",
  border: "1px solid #384152",
  borderRadius: 6,
  background: "#1f2937",
  color: "#f9fafb",
  cursor: "pointer",
};

const logListStyle = {
  minHeight: 0,
  overflow: "auto",
  padding: 8,
};

const emptyStyle = {
  padding: 14,
  color: "#9ca3af",
};

const entryStyle = {
  display: "grid",
  gap: 5,
  marginBottom: 8,
  padding: "8px 10px",
  borderLeft: "3px solid #465163",
  borderRadius: 7,
  background: "#111827",
};

const rowButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: 0,
  border: 0,
  background: "transparent",
  color: "inherit",
  textAlign: "left",
  cursor: "pointer",
};

const levelLabelStyle = {
  width: 44,
  fontWeight: 800,
  textTransform: "uppercase",
};

const typeStyle = {
  minWidth: 64,
  color: "#9ca3af",
};

const timeStyle = {
  marginLeft: "auto",
  color: "#9ca3af",
  fontVariantNumeric: "tabular-nums",
};

const messageStyle = {
  margin: 0,
  maxHeight: 160,
  overflow: "auto",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  color: "#eef2ff",
  font: "12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};

const detailsStyle = {
  display: "grid",
  gap: 4,
  color: "#b6c2d3",
  font: "12px/1.4 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};

const stackStyle = {
  margin: 0,
  maxHeight: 180,
  overflow: "auto",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  color: "#ffdad6",
};

const fallbackStyle = {
  padding: 16,
  border: "1px solid #f2c2c2",
  borderRadius: 8,
  background: "#fff6f6",
  color: "#5b1f1f",
  fontFamily: "system-ui, sans-serif",
};

const fallbackButtonStyle = {
  marginTop: 12,
  minHeight: 34,
  padding: "0 10px",
  border: "1px solid #f2c2c2",
  borderRadius: 6,
  background: "#ffffff",
  cursor: "pointer",
};
