import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

function DashboardPage() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      navigate("/auth");
      return;
    }

    setLoading(false);
  };

  const createNewRoom = () => {
    const newRoom = crypto.randomUUID().slice(0, 8);
    navigate(`/editor?room=${newRoom}`);
  };

  const joinRoom = () => {
    if (!roomId.trim()) return;
    navigate(`/editor?room=${roomId}`);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div style={container}>
        <p style={subtitle}>Loading workspace...</p>
      </div>
    );
  }

  return (
    <div style={container}>
      <div style={topBar}>
        <span style={back} onClick={logout}>
          Logout
        </span>
      </div>

      <div style={content}>
        <h1 style={title}>Dashboard</h1>

        <p style={subtitle}>
          Create a new room or join an existing one
        </p>

        <button style={mainBtn} onClick={createNewRoom}>
          + New Room
        </button>

        <div style={divider}>or</div>

        <input
          type="text"
          placeholder="Enter Room ID"
          style={input}
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />

        <button style={secondaryBtn} onClick={joinRoom}>
          Join Room →
        </button>
      </div>
    </div>
  );
}

export default DashboardPage;

const container = {
  minHeight: "100vh",
  width: "100vw",
  backgroundColor: "#0a0a0a",
  color: "white",
  fontFamily: "'IBM Plex Mono', monospace",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "relative"
};

const topBar = {
  position: "absolute",
  top: "30px",
  left: "40px"
};

const back = {
  color: "#777",
  cursor: "pointer",
  fontSize: "14px"
};

const content = {
  width: "360px",
  display: "flex",
  flexDirection: "column",
  gap: "16px"
};

const title = {
  fontSize: "28px",
  marginBottom: "10px"
};

const subtitle = {
  color: "#777",
  fontSize: "14px",
  marginBottom: "20px"
};

const mainBtn = {
  padding: "14px",
  border: "1px solid #333",
  background: "transparent",
  color: "white",
  cursor: "pointer",
  fontSize: "15px"
};

const divider = {
  textAlign: "center",
  color: "#666",
  margin: "10px 0"
};

const input = {
  padding: "12px",
  background: "transparent",
  border: "1px solid #333",
  color: "white",
  outline: "none"
};

const secondaryBtn = {
  padding: "14px",
  border: "1px solid #333",
  background: "transparent",
  color: "white",
  cursor: "pointer"
};