import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { supabase } from './supabaseClient'; // Importăm Supabase
import Editor from "@monaco-editor/react";

const socket = io("http://localhost:5000");

export default function CollaborativeEditor({ documentId }) {
  const [code, setCode] = useState("// Se încarcă din baza de date...");
  const [users, setUsers] = useState([]);
  const [outputText, setOutputText] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [status, setStatus] = useState("Se încarcă...");
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [rightPanelWidth, setRightPanelWidth] = useState(30); 
  const [isResizing, setIsResizing] = useState(false);

  const [history, setHistory] = useState(["// start coding..."]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const editorRef = useRef(null);
  const remoteCursorsRef = useRef({}); 

  const username = localStorage.getItem("username") || "user_" + Math.floor(Math.random() * 1000);

  // --- LOGICĂ SUPABASE (Încărcare inițială) ---
  useEffect(() => {
    async function loadInitialCode() {
      const { data, error } = await supabase
        .from('documents')
        .select('content')
        .eq('id', documentId)
        .single();

      if (error) {
        setStatus("Eroare la încărcare document.");
      } else if (data) {
        setCode(data.content || "// Începe să scrii...");
        setStatus("Sincronizat cu DB 🟢");
      }
    }
    loadInitialCode();
  }, [documentId]);

  // --- LOGICĂ SUPABASE (Auto-Salvare la fiecare 10s) ---
  useEffect(() => {
    const autoSave = setInterval(async () => {
      setStatus("Se salvează...");
      const { error } = await supabase
        .from('documents')
        .update({ content: code })
        .eq('id', documentId);

      if (!error) setStatus("Sincronizat cu DB 🟢");
      else setStatus("Eroare la salvare! 🔴");
    }, 10000);

    return () => clearInterval(autoSave);
  }, [code, documentId]);

  // --- LOGICĂ REDIMENSIONARE ---
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

  // --- LOGICĂ SOCKETS (Live Sync & Cursors) ---
  useEffect(() => {
    socket.emit("join_room", { roomId: documentId, username });

    socket.on("receive_code", (newCode) => {
      setCode(newCode);
      setHistory((prev) => [...prev, newCode]);
      setHistoryIndex((prev) => prev + 1);
    });

    socket.on("users_update", (usersList) => setUsers(usersList));
    socket.on("code_output", (result) => { setOutputText(result); setIsExecuting(false); });
    socket.on("ai_suggestion", (text) => setAiSuggestion(text));

    socket.on("receive_cursor", ({ username: remoteUser, position }) => {
      if (!editorRef.current || remoteUser === username || !window.monaco) return;
      const editor = editorRef.current;
      const cleanUsername = remoteUser.replace(/\s+/g, '');
      const userColor = `hsl(${(remoteUser.length * 50) % 360}, 70%, 50%)`;

      if (!document.getElementById(`style-${cleanUsername}`)) {
        const style = document.createElement('style');
        style.id = `style-${cleanUsername}`;
        style.innerHTML = `
          @keyframes labelFade { 0% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
          .cursor-${cleanUsername} { border-left: 2px solid ${userColor}; }
          .label-${cleanUsername}::before {
            content: '${remoteUser}'; position: absolute; top: -18px; left: -2px;
            background: ${userColor}; color: white; font-size: 10px; padding: 1px 4px;
            border-radius: 2px; z-index: 100; animation: labelFade 3s forwards;
          }
        `;
        document.head.appendChild(style);
      }

      remoteCursorsRef.current[remoteUser] = editor.deltaDecorations(
        remoteCursorsRef.current[remoteUser] || [],
        [{
          range: new window.monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
          options: { className: `cursor-${cleanUsername}`, beforeContentClassName: `label-${cleanUsername}`, stickiness: 1 }
        }]
      );
    });

    return () => { socket.off("receive_code"); socket.off("users_update"); socket.off("receive_cursor"); };
  }, [documentId, username]);

  // --- AI AUTO-REQUEST ---
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (code.length > 10) socket.emit("ai_request", { roomId: documentId, code });
    }, 400);
    return () => clearTimeout(timeout);
  }, [code, documentId]);

  const handleChange = (value = "") => {
    setCode(value);
    setHistory((prev) => [...prev, value]);
    setHistoryIndex(history.length);
    socket.emit("send_code", { roomId: documentId, code: value });
  };

  const handleRun = () => {
    setIsExecuting(true); setOutputText(""); setIsTerminalOpen(true);
    socket.emit("run_code", { roomId: documentId, code });
  };

  return (
    <div style={container}>
      <div style={topBar}>
        <span style={logo}>ITECify — Room: {documentId.slice(0,8)}...</span>
        <div>
          {users.map((u) => <span key={u.id} style={userTag}>● {u.username}</span>)}
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#666' }}>{status}</span>
            <button style={runBtn} onClick={handleRun} disabled={isExecuting}>
                {isExecuting ? "Running..." : "Run ▶"}
            </button>
        </div>
      </div>

      <div style={main}>
        <div style={{ ...editorWrapper, width: `${100 - rightPanelWidth}%` }}>
          <Editor 
            height="100%" defaultLanguage="javascript" value={code}
            onChange={handleChange} 
            onMount={(ed) => {
              editorRef.current = ed;
              ed.onDidChangeCursorPosition((e) => {
                socket.emit("cursor_move", { roomId: documentId, username, position: e.position });
              });
            }} 
            theme="vs-dark"
          />
        </div>

        <div style={resizer} onMouseDown={startResizing}></div>

        <div style={{ ...rightPanel, width: `${rightPanelWidth}%` }}>
          <div style={rightTopContent}>
            <p style={simpleOutputText}>{outputText || "Output is waiting..."}</p>
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
                  <pre style={terminalText}>{outputText ? `> ${outputText}` : "> Ready..."}</pre>
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

// --- STYLES (MATCHING YOUR GRAY THEME) ---
const container = { height: "100%", width: "100%", backgroundColor: "#0a0a0a", display: "flex", flexDirection: "column" };
const topBar = { height: "60px", borderBottom: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" };
const logo = { color: "#888", fontSize: "13px", letterSpacing: "2px" };
const userTag = { marginRight: "10px", fontSize: "11px", color: "#a0a0a0", padding: "4px 8px", border: "1px solid #222", borderRadius: "4px" };
const runBtn = { border: "1px solid #333", background: "transparent", color: "white", padding: "8px 16px", cursor: "pointer" };
const main = { flex: 1, display: "flex", flexDirection: "row", overflow: "hidden" };
const editorWrapper = { height: "100%" };
const resizer = { width: "4px", cursor: "col-resize", backgroundColor: "#1a1a1a" };
const rightPanel = { display: "flex", flexDirection: "column", backgroundColor: "#050505", borderLeft: "1px solid #222" };
const rightTopContent = { flex: 1, padding: "20px", overflowY: "auto" };
const simpleOutputText = { color: "#c9c9c9", fontSize: "13px" };
const aiBlock = { border: "1px solid #222", padding: "15px", borderRadius: "6px", marginTop: "20px", backgroundColor: "#0a0a0a" };
const aiTitle = { color: "#777", fontSize: "11px", marginBottom: "8px" };
const aiCode = { color: "#c9c9c9", fontSize: "12px", whiteSpace: "pre-wrap" };
const aiButtons = { display: "flex", gap: "8px", marginTop: "12px" };
const actionBtn = { padding: "6px 12px", border: "1px solid #333", background: "transparent", color: "white", cursor: "pointer", fontSize: "11px" };
const rightBottomContent = { borderTop: "1px solid #222", padding: "12px", backgroundColor: "#0a0a0a" };
const openTerminalBtn = { width: "100%", padding: "10px", backgroundColor: "#1e1e1e", color: "#a0a0a0", border: "1px solid #333", borderRadius: "4px", cursor: "pointer", fontSize: "12px" };
const terminalWrapper = { backgroundColor: "#1e1e1e", border: "1px solid #333", borderRadius: "4px", display: "flex", flexDirection: "column", height: "200px" };
const terminalHeader = { backgroundColor: "#2d2d2d", color: "#888", fontSize: "11px", padding: "6px 12px", display: "flex", justifyContent: "space-between" };
const closeBtn = { background: "transparent", border: "none", color: "#888", cursor: "pointer" };
const terminalBody = { padding: "10px", flex: 1, overflowY: "auto", backgroundColor: "#050505" };
const terminalText = { color: "#a0a0a0", margin: 0, fontSize: "12px", whiteSpace: "pre-wrap" };