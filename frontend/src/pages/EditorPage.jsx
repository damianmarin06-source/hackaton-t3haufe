import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useSearchParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";

const socket = io(" https://9f1f-89-238-252-115.ngrok-free.app");
extraHeaders: {
    "ngrok-skip-browser-warning": "true"
  }
function EditorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const roomId = searchParams.get("room");

  const [code, setCode] = useState("// start coding...");
  const [users, setUsers] = useState([]);
  const [outputText, setOutputText] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");

  const [history, setHistory] = useState(["// start coding..."]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const editorRef = useRef(null);
  const decorationsRef = useRef([]);

  const username =
    localStorage.getItem("username") ||
    "user_" + Math.floor(Math.random() * 1000);

  useEffect(() => {
    if (!roomId) {
      navigate("/dashboard");
      return;
    }

    localStorage.setItem("username", username);

    socket.emit("join_room", {
      roomId,
      username,
    });

    socket.on("receive_code", (newCode) => {
      setCode(newCode);

      setHistory((prev) => {
        if (prev[prev.length - 1] === newCode) {
          return prev;
        }
        return [...prev, newCode];
      });

      setHistoryIndex((prev) => prev + 1);
    });

    socket.on("users_update", (usersList) => {
      setUsers(usersList);
    });

    socket.on("code_output", (result) => {
      setOutputText(result);
    });

    socket.on("ai_suggestion", (text) => {
      setAiSuggestion(text);
    });

    socket.on("receive_cursor", ({ position }) => {
      if (!editorRef.current) return;

      decorationsRef.current =
        editorRef.current.deltaDecorations(
          decorationsRef.current,
          [
            {
              range: {
                startLineNumber:
                  position.lineNumber,
                startColumn: position.column,
                endLineNumber:
                  position.lineNumber,
                endColumn:
                  position.column + 1,
              },
              options: {
                className: "remote-cursor",
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
  }, [roomId, navigate]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentCode = code.trim();

      if (!currentCode || currentCode.length < 10) {
        setAiSuggestion("");
        return;
      }

      socket.emit("ai_request", {
        roomId,
        code: currentCode,
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [code, roomId]);

  const handleChange = (value = "") => {
    setCode(value);

    setHistory((prev) => {
      if (prev[prev.length - 1] === value) {
        return prev;
      }
      return [...prev, value];
    });

    setHistoryIndex((prev) => prev + 1);

    socket.emit("send_code", {
      roomId,
      code: value,
    });
  };

  const handleRun = () => {
    socket.emit("run_code", {
      roomId,
      code,
    });

    socket.emit("ai_request", {
      roomId,
      code,
    });
  };

  const handleAccept = () => {
    if (!aiSuggestion) return;

    const updatedCode = `${code}\n\n${aiSuggestion}`;

    setCode(updatedCode);

    setHistory((prev) => [
      ...prev,
      updatedCode,
    ]);

    setHistoryIndex((prev) => prev + 1);

    socket.emit("send_code", {
      roomId,
      code: updatedCode,
    });

    setAiSuggestion("");
  };

  const handleReject = () => {
    setAiSuggestion("");
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;

    editor.onDidChangeCursorPosition((e) => {
      socket.emit("cursor_move", {
        roomId,
        username,
        position: e.position,
      });
    });
  };

  return (
    <div style={container}>
      {/* TOP BAR */}
      <div style={topBar}>
        <span style={logo}>
          ITECify — {roomId}
        </span>

        <div>
          {users.map((u) => (
            <span key={u.id} style={userTag}>
              ● {u.username}
            </span>
          ))}
        </div>

        <button style={runBtn} onClick={handleRun}>
          Run ▶
        </button>
      </div>

      {/* TIMELINE */}
      <div style={timelineWrapper}>
        <span style={timelineLabel}>Replay</span>

        <input
          type="range"
          min="0"
          max={Math.max(history.length - 1, 0)}
          value={historyIndex}
          onChange={(e) => {
            const index = Number(e.target.value);
            setHistoryIndex(index);
            setCode(history[index]);
          }}
          style={slider}
          className="replay-slider"
        />
      </div>

      {/* MAIN */}
      <div style={main}>
        {/* EDITOR */}
        <div style={editorWrapper}>
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={code}
            onChange={handleChange}
            onMount={handleEditorMount}
            theme="vs-dark"
          />
        </div>

        {/* OUTPUT */}
        <div style={output}>
          <p style={{ color: "#b3b3b3" }}>
            {outputText ||
              "Session output stream is waiting..."}
          </p>

          {aiSuggestion && (
            <div style={aiBlock}>
              <p style={aiTitle}>
                AI Suggestion
              </p>

              <pre style={aiCode}>
                {aiSuggestion}
              </pre>

              <div style={aiButtons}>
                <button
                  style={actionBtn}
                  onClick={handleAccept}
                >
                  Accept
                </button>

                <button
                  style={actionBtn}
                  onClick={handleReject}
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EditorPage;

// STYLES — EXACT CA ÎNAINTE
const container = {
  height: "100vh",
  width: "100vw",
  backgroundColor: "#0a0a0a",
  color: "white",
  fontFamily: "'IBM Plex Mono', monospace",
  display: "flex",
  flexDirection: "column",
};

const topBar = {
  height: "60px",
  borderBottom: "1px solid #222",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 24px",
};

const timelineWrapper = {
  height: "48px",
  borderBottom: "1px solid #222",
  display: "flex",
  alignItems: "center",
  gap: "16px",
  padding: "0 24px",
  backgroundColor: "#0a0a0a",
};

const timelineLabel = {
  fontSize: "12px",
  color: "#b3b3b3",
  letterSpacing: "1px",
  minWidth: "60px",
};

const slider = {
  width: "280px",
  height: "2px",
  appearance: "none",
  background: "#ffffff",
  outline: "none",
  borderRadius: "999px",
  cursor: "pointer",
};

const logo = {
  color: "#888",
  fontSize: "13px",
  letterSpacing: "2px",
};

const userTag = {
  marginRight: "10px",
  fontSize: "12px",
  color: "#777",
  padding: "6px 10px",
  border: "1px solid #222",
  borderRadius: "4px",
};

const runBtn = {
  border: "1px solid #333",
  background: "transparent",
  color: "white",
  padding: "10px 18px",
  cursor: "pointer",
};

const main = {
  flex: 1,
  display: "flex",
};

const editorWrapper = {
  width: "70%",
  borderRight: "1px solid #222",
};

const output = {
  width: "30%",
  padding: "24px",
  backgroundColor: "#050505",
};

const aiBlock = {
  marginTop: "30px",
  border: "1px solid #222",
  padding: "18px",
  borderRadius: "6px",
};

const aiTitle = {
  color: "#777",
  fontSize: "13px",
  marginBottom: "12px",
};

const aiCode = {
  color: "#c9c9c9",
  fontSize: "13px",
  whiteSpace: "pre-wrap",
  lineHeight: "1.6",
};

const aiButtons = {
  display: "flex",
  gap: "10px",
  marginTop: "15px",
};

const actionBtn = {
  padding: "8px 14px",
  border: "1px solid #333",
  background: "transparent",
  color: "white",
  cursor: "pointer",
};
