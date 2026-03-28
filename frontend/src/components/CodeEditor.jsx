import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Editor from "@monaco-editor/react";
import OutputPanel from "./OutputPanel";

const socket = io("http://localhost:5000");

function CodeEditor() {
  const [code, setCode] = useState("// start coding...");
  const [users, setUsers] = useState([]);
  const [output, setOutput] = useState("");
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);

  const roomId = "room1";

  const username =
    localStorage.getItem("username") ||
    "user_" + Math.floor(Math.random() * 1000);

  useEffect(() => {
    socket.emit("join_room", { roomId, username });

    socket.on("receive_code", (newCode) => {
      setCode(newCode);
    });

    socket.on("users_update", (usersList) => {
      setUsers(usersList);
    });

    socket.on("code_output", (result) => {
      setOutput(result);
    });

    socket.on("receive_cursor", ({ position }) => {
      if (!editorRef.current) return;

      const editor = editorRef.current;

      decorationsRef.current = editor.deltaDecorations(
        decorationsRef.current,
        [
          {
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column + 1,
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
      socket.off("receive_cursor");
    };
  }, []);

  const handleChange = (value) => {
    setCode(value);
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
      <div style={topBar}>
        <span>ITECify — Room: {roomId}</span>

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

      <div style={main}>
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

        <OutputPanel output={output} />
      </div>
    </div>
  );
}

export default CodeEditor;

// STYLES

const container = {
  height: "100vh",
  width: "100vw",
  backgroundColor: "#0a0a0a",
  color: "white",
  display: "flex",
  flexDirection: "column",
};

const topBar = {
  height: "60px",
  borderBottom: "1px solid #222",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 20px",
};

const main = {
  flex: 1,
  display: "flex",
};

const editorWrapper = {
  width: "70%",
  borderRight: "1px solid #222",
};

const userTag = {
  marginRight: "10px",
  fontSize: "12px",
  color: "#00ff88",
};

const runBtn = {
  border: "1px solid #333",
  background: "transparent",
  color: "white",
  padding: "8px 16px",
  cursor: "pointer",
};