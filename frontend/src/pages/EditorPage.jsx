import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import Editor from "@monaco-editor/react";

const socket = io("http://localhost:5000");

function EditorPage() {
  const [code, setCode] = useState("// start coding...");
  const [users, setUsers] = useState([]);
  const [outputText, setOutputText] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  
  // Panou resizable
  const [rightPanelWidth, setRightPanelWidth] = useState(30); 
  const [isResizing, setIsResizing] = useState(false);

  const [history, setHistory] = useState(["// start coding..."]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const editorRef = useRef(null);
  const remoteCursorsRef = useRef({}); 

  const roomId = "room1";
  const username = localStorage.getItem("username") || "user_" + Math.floor(Math.random() * 1000);

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  const resize = useCallback((e) => {
    if (isResizing) {
      const newWidth = ((window.innerWidth - e.clientX) / window.innerWidth) * 100;
      if (newWidth > 15 && newWidth < 60) setRightPanelWidth(newWidth);
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  useEffect(() => {
    socket.emit("join_room", { roomId, username });

    socket.on("receive_code", (newCode) => {
      setCode(newCode);
      setHistory((prev) => [...prev, newCode]);
      setHistoryIndex((prev) => prev + 1);
    });

    socket.on("users_update", (usersList) => setUsers(usersList));

    socket.on("code_output", (result) => {
      setOutputText(result);
      setIsExecuting(false); 
    });

    socket.on("ai_suggestion", (text) => setAiSuggestion(text));

    // REZOLVARE: Etichetele dispar singure după 3 secunde ca să nu blocheze codul
    socket.on("receive_cursor", ({ username: remoteUser, position }) => {
      if (!editorRef.current || remoteUser === username || !window.monaco) return;

      const editor = editorRef.current;
      const cleanUsername = remoteUser.replace(/\s+/g, '');
      const userColor = `hsl(${(remoteUser.length * 50) % 360}, 70%, 50%)`;

      if (!document.getElementById(`style-${cleanUsername}`)) {
        const style = document.createElement('style');
        style.id = `style-${cleanUsername}`;
        style.innerHTML = `
          @keyframes cursorLabelFade {
            0% { opacity: 1; transform: translateY(0); }
            70% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-5px); }
          }
          .remote-cursor-${cleanUsername} {
            border-left: 2px solid ${userColor};
          }
          .remote-label-${cleanUsername}::before {
            content: '${remoteUser}';
            position: absolute;
            top: -18px;
            left: -2px;
            background: ${userColor};
            color: white;
            font-size: 9px;
            padding: 0px 5px;
            border-radius: 2px;
            white-space: nowrap;
            z-index: 100;
            font-weight: bold;
            pointer-events: none;
            opacity: 0;
            animation: cursorLabelFade 3s ease-out;
          }
        `;
        document.head.appendChild(style);
      }

      remoteCursorsRef.current[remoteUser] = editor.deltaDecorations(
        remoteCursorsRef.current[remoteUser] || [],
        [
          {
            range: new window.monaco.Range(
              position.lineNumber, position.column,
              position.lineNumber, position.column
            ),
            options: {
              className: `remote-cursor-${cleanUsername}`,
              beforeContentClassName: `remote-label-${cleanUsername}`,
              stickiness: 1
            },
          },
        ]
      );
    });

    return () => {
      socket.off("receive_code");
      socket.off("users_update");
      socket.off("code_output");
      socket.off("ai_suggestion");
      socket.off("receive_cursor");
    };
  }, [roomId, username]);

  const handleChange = (value = "") => {
    setCode(value);
    setHistory((prev) => [...prev, value]);
    setHistoryIndex(history.length);
    socket.emit("send_code", { roomId, code: value });
  };

  const handleRun = () => {
    setIsExecuting(true); setOutputText(""); setIsTerminalOpen(true);
    socket.emit("run_code", { roomId, code });
  };

  return (
    <div style={container}>
      <div style={topBar}>
        <span style={logo}>ITECify — Room: {roomId}</span>
        <div>
          {users.map((u) => (
            <span key={u.id} style={userTag}>● {u.username}</span>
          ))}
        </div>
        <button style={runBtn} onClick={handleRun} disabled={isExecuting}>
          {isExecuting ? "Running..." : "Run ▶"}
        </button>
      </div>

      <div style={timelineWrapper}>
        <span style={timelineLabel}>Replay</span>
        <input type="range" min="0" max={history.length - 1} value={historyIndex}
          onChange={(e) => {
            const index = Number(e.target.value);
            setHistoryIndex(index);
            setCode(history[index]);
          }}
          style={slider} className="replay-slider"
        />
      </div>

      <div style={main}>
        <div style={{ ...editorWrapper, width: `${100 - rightPanelWidth}%` }}>
          <Editor 
            height="100%" 
            defaultLanguage="javascript" 
            value={code}
            onChange={handleChange} 
            onMount={(ed) => {
              editorRef.current = ed;
              ed.onDidChangeCursorPosition((e) => {
                socket.emit("cursor_move", { roomId, username, position: e.position });
              });
            }} 
            theme="vs-dark"
          />
        </div>

        <div style={resizer} onMouseDown={startResizing}></div>

        <div style={{ ...rightPanel, width: `${rightPanelWidth}%` }}>
          <div style={rightTopContent}>
            <p style={simpleOutputText}>{outputText || "Session output stream is waiting..."}</p>
            {aiSuggestion && (
              <div style={aiBlock}>
                <p style={aiTitle}>AI Suggestion</p>
                <pre style={aiCode}>{aiSuggestion}</pre>
                <div style={aiButtons}>
                  <button style={actionBtn} onClick={() => {
                    const updated = `${code}\n\n${aiSuggestion}`;
                    handleChange(updated);
                    setAiSuggestion("");
                  }}>Accept</button>
                  <button style={actionBtn} onClick={() => setAiSuggestion("")}>Reject</button>
                </div>
              </div>
            )}
          </div>

          <div style={rightBottomContent}>
            {isTerminalOpen ? (
              <div style={terminalWrapper}>
                <div style={terminalHeader}>
                  <span>Terminal</span>
                  <button style={closeBtn} onClick={() => setIsTerminalOpen(false)}>✖</button>
                </div>
                <div style={terminalBody}>
                  {isExecuting ? (
                    <span style={{ color: "#a0a0a0" }}>{">"} Executing... </span>
                  ) : (
                    <pre style={terminalText}>{outputText ? `> ${outputText}` : "> Ready..."}</pre>
                  )}
                </div>
              </div>
            ) : (
              <button style={openTerminalBtn} onClick={() => setIsTerminalOpen(true)}>Open Terminal</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditorPage;

// --- STYLES (NU S-AU SCHIMBAT) ---
const container = { height: "100vh", width: "100vw", backgroundColor: "#0a0a0a", color: "white", fontFamily: "'IBM Plex Mono', monospace", display: "flex", flexDirection: "column" };
const topBar = { height: "60px", borderBottom: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" };
const timelineWrapper = { height: "48px", borderBottom: "1px solid #222", display: "flex", alignItems: "center", gap: "16px", padding: "0 24px", backgroundColor: "#0a0a0a" };
const timelineLabel = { fontSize: "12px", color: "#b3b3b3", letterSpacing: "1px", minWidth: "60px" };
const slider = { width: "280px", height: "2px", appearance: "none", background: "#ffffff", outline: "none", borderRadius: "999px", cursor: "pointer" };
const logo = { color: "#888", fontSize: "13px", letterSpacing: "2px" };
const userTag = { marginRight: "10px", fontSize: "12px", color: "#a0a0a0", padding: "6px 10px", border: "1px solid #222", borderRadius: "4px" };
const runBtn = { border: "1px solid #333", background: "transparent", color: "white", padding: "10px 18px", cursor: "pointer" };
const main = { flex: 1, display: "flex", flexDirection: "row", overflow: "hidden" };
const editorWrapper = { height: "100%" };
const resizer = { width: "4px", cursor: "col-resize", backgroundColor: "#1a1a1a", transition: "background-color 0.2s" };
const rightPanel = { display: "flex", flexDirection: "column", backgroundColor: "#050505", borderLeft: "1px solid #222" };
const rightTopContent = { flex: 1, padding: "24px", overflowY: "auto" };
const simpleOutputText = { color: "#c9c9c9", fontSize: "14px", margin: 0 };
const aiBlock = { border: "1px solid #222", padding: "18px", borderRadius: "6px", marginTop: "30px", backgroundColor: "#0a0a0a" };
const aiTitle = { color: "#777", fontSize: "13px", marginBottom: "12px" };
const aiCode = { color: "#c9c9c9", fontSize: "13px", whiteSpace: "pre-wrap", lineHeight: "1.6" };
const aiButtons = { display: "flex", gap: "10px", marginTop: "15px" };
const actionBtn = { padding: "8px 14px", border: "1px solid #333", background: "transparent", color: "white", cursor: "pointer" };
const rightBottomContent = { borderTop: "1px solid #222", padding: "16px", backgroundColor: "#0a0a0a" };
const openTerminalBtn = { width: "100%", padding: "12px", backgroundColor: "#1e1e1e", color: "#a0a0a0", border: "1px solid #333", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" };
const terminalWrapper = { backgroundColor: "#1e1e1e", border: "1px solid #333", borderRadius: "6px", display: "flex", flexDirection: "column", height: "220px", overflow: "hidden" };
const terminalHeader = { backgroundColor: "#2d2d2d", color: "#888", fontSize: "12px", padding: "8px 12px", borderBottom: "1px solid #333", display: "flex", justifyContent: "space-between" };
const closeBtn = { background: "transparent", border: "none", color: "#888", cursor: "pointer" };
const terminalBody = { padding: "12px", flex: 1, overflowY: "auto", fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px", backgroundColor: "#050505" };
const terminalText = { color: "#a0a0a0", margin: 0, whiteSpace: "pre-wrap" };