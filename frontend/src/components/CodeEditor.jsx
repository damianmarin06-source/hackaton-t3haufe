import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Editor from "@monaco-editor/react";
import OutputPanel from "./OutputPanel";

// Make sure your backend is actually running on port 5000!
const socket = io(" https://9f1f-89-238-252-115.ngrok-free.app");

function CodeEditor() {
// Default to a valid C++ program so it compiles on the first click!
  const [code, setCode] = useState("#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Hello Hackathon!\" << endl;\n    return 0;\n}");
  const [users, setUsers] = useState([]);
  const [output, setOutput] = useState("");
  
  const [language, setLanguage] = useState("cpp"); 
  const [userInput, setUserInput] = useState(""); // <--- Fixed! Now it's empty    

  const editorRef = useRef(null);
  const decorationsRef = useRef([]);

  const roomId = "room1"; // Hardcoded for now, you can make this dynamic later!

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

  // THE UPDATED API CONTRACT
const handleRun = () => {
    setOutput("Sending to Docker Engine...");
    socket.emit("run_code", {
      roomId,
      code,
      input: userInput, 
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

        <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
          
          {/* LANGUAGE SELECTOR */}
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            style={selectStyle}
          >
            <option value="python3">Python 3</option>
            <option value="cpp">C++ (GCC 13)</option>
            <option value="java">Java (OpenJDK 21)</option>
          </select>

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
      </div>

      <div style={main}>
        <div style={editorWrapper}>
          <Editor
            height="100%"
            // Monaco uses slightly different language names than our backend tags
            language={language === "cpp" ? "cpp" : language === "java" ? "java" : "python"}
            value={code}
            onChange={handleChange}
            onMount={handleEditorMount}
            theme="vs-dark"
          />
        </div>

        <div style={sidebar}>
          {/* USER INPUT BOX (stdin) */}
          <div style={inputSection}>
            <label style={labelStyle}>Standard Input (stdin):</label>
            <textarea
              style={inputArea}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="If your code requires input (like std::cin or input()), type it here before running..."
            />
          </div>
          
          {/* We wrap OutputPanel in a flex container so it shares the sidebar nicely */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <OutputPanel output={output} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeEditor;

// ==========================================
// STYLES
// ==========================================

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
  background: "#007bff", // Gave it a slight pop of color so it looks like an action button
  color: "white",
  padding: "8px 16px",
  cursor: "pointer",
  borderRadius: "4px",
  fontWeight: "bold",
};

const selectStyle = {
  background: "#222",
  color: "white",
  border: "1px solid #444",
  padding: "8px",
  borderRadius: "4px",
  cursor: "pointer",
};

const sidebar = {
  width: "30%",
  display: "flex",
  flexDirection: "column",
};

const inputSection = {
  height: "30%",
  borderBottom: "1px solid #222",
  padding: "15px",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "#111", // Slight contrast from the editor
};

const labelStyle = {
  fontSize: "13px",
  color: "#aaa",
  marginBottom: "8px",
  fontWeight: "bold",
};

const inputArea = {
  flex: 1,
  backgroundColor: "#1e1e1e",
  color: "#e0e0e0",
  border: "1px solid #333",
  padding: "10px",
  fontFamily: "monospace",
  fontSize: "14px",
  resize: "none",
  borderRadius: "4px",
  outline: "none",
};
