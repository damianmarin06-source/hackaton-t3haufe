import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../lib/supabase";

function Auth() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async () => {
    setError("");

    let result;

    if (isSignup) {
      result = await supabase.auth.signUp({
        email,
        password,
      });
    } else {
      result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
    }

    if (result.error) {
      setError(result.error.message);
      return;
    }

    navigate("/dashboard");
  };

  return (
    <div style={container}>
      <div style={topBar}>
        <span style={back} onClick={() => navigate("/")}>
          ← Back
        </span>
      </div>

      <div style={form}>
        <h2 style={title}>ITECify</h2>

        <p style={subtitle}>
          {isSignup
            ? "Create your workspace account"
            : "Sign in to your workspace"}
        </p>

        <input
          type="email"
          placeholder="Email"
          style={input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          style={input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p style={errorText}>{error}</p>}

        <button style={btn} onClick={handleAuth}>
          {isSignup ? "Create Account →" : "Sign In →"}
        </button>

        <p style={switchText}>
          {isSignup
            ? "Already have an account?"
            : "Don't have an account?"}

          <span
            style={switchBtn}
            onClick={() => setIsSignup(!isSignup)}
          >
            {isSignup ? " Sign In" : " Create one"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Auth;

const container = {
  height: "100vh",
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

const form = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  width: "320px"
};

const title = {
  fontSize: "24px",
  marginBottom: "10px"
};

const subtitle = {
  color: "#777",
  marginBottom: "20px",
  fontSize: "14px"
};

const input = {
  padding: "12px",
  background: "transparent",
  border: "1px solid #333",
  color: "white",
  outline: "none"
};

const btn = {
  marginTop: "10px",
  padding: "14px",
  border: "1px solid #333",
  background: "transparent",
  color: "white",
  cursor: "pointer",
  letterSpacing: "1px"
};

const switchText = {
  color: "#777",
  fontSize: "13px",
  textAlign: "center"
};

const switchBtn = {
  color: "white",
  cursor: "pointer"
};

const errorText = {
  color: "#ff6b6b",
  fontSize: "12px"
};