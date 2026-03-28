const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

// ROOM STATE
let rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // JOIN ROOM
  socket.on("join_room", ({ roomId, username }) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = {
        code: "print('Hello Hackathon! Piston API is working!')",
        users: [],
      };
    }

    const exists = rooms[roomId].users.find((u) => u.id === socket.id);
    if (!exists) {
      rooms[roomId].users.push({ id: socket.id, username });
    }

    socket.emit("receive_code", rooms[roomId].code);
    io.to(roomId).emit("users_update", rooms[roomId].users);
  });

  // LIVE CODE SYNC
  socket.on(
    "send_code",
    ({ roomId, code }) => {
      if (!rooms[roomId]) return;

      rooms[roomId].code = code;
      socket.to(roomId).emit("receive_code", code);
    }
  );

  // MULTI CURSOR
  socket.on("cursor_move", ({ roomId, username, position }) => {
    socket.to(roomId).emit("receive_cursor", { username, position });
  });

  // RUN CODE (Using the free Piston API)
  socket.on("run_code", async ({ roomId, code, input }) => {
    io.to(roomId).emit("code_output", `> Sending code to Piston API...\n`);

    try {
      // We use the native fetch API to send the code to Piston
      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: "python",
          version: "3.10", // Piston uses Python 3.10
          files: [
            {
              name: "main.py",
              content: code,
            },
          ],
          stdin: input || "", // Pass the standard input here
        }),
      });

      const result = await response.json();
      let outputMessage = "";

      // Handle Piston API specific responses
      if (result.message) {
        outputMessage = `> ❌ API ERROR:\n${result.message}\n`;
      } else if (result.run) {
        outputMessage = `> STDOUT:\n${result.run.stdout}\n`;
        if (result.run.stderr) {
          outputMessage += `> STDERR:\n${result.run.stderr}\n`;
        }
        if (result.run.signal === "SIGKILL") {
          outputMessage += `> 🚨 TIMEOUT ERROR: Execution took too long or crashed.\n`;
        }
      } else {
        outputMessage = `> ❌ UNKNOWN ERROR:\nCould not parse response.\n`;
      }

      outputMessage += `\n> Execution complete 🚀`;
      io.to(roomId).emit("code_output", outputMessage);

    } catch (err) {
      console.error("Piston API error:", err);
      io.to(roomId).emit("code_output", `> ❌ NETWORK ERROR: Could not reach the execution engine.\n`);
    }
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (let roomId in rooms) {
      rooms[roomId].users = rooms[roomId].users.filter((u) => u.id !== socket.id);
      io.to(roomId).emit("users_update", rooms[roomId].users);
    }
  );

  // DISCONNECT
  socket.on("disconnect", () => {
    console.log(
      "User disconnected:",
      socket.id
    );

    Object.keys(rooms).forEach(
      (roomId) => {
        rooms[roomId].users =
          rooms[roomId].users.filter(
            (u) =>
              u.id !== socket.id
          );

        io.to(roomId).emit(
          "users_update",
          rooms[roomId].users
        );
      }
    );
  });
});

// Use the environment port if available (Crucial for Railway!)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🔥 API-Powered Backend running on port ${PORT}`);
});
