const fs = require("fs").promises;
const path = require("path");
const { exec } = require("child_process");

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

// room state
let rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // JOIN ROOM
  socket.on("join_room", ({ roomId, username }) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = {
        code: "print('Hello Hackathon!')", // Reverted to Python default
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
  socket.on("send_code", ({ roomId, code }) => {
    if (rooms[roomId]) {
      rooms[roomId].code = code;
      socket.to(roomId).emit("receive_code", code);
    }
  });

  // MULTI CURSOR
  socket.on("cursor_move", ({ roomId, username, position }) => {
    socket.to(roomId).emit("receive_cursor", { username, position });
  });

  // RUN CODE (Strictly Python 3)
  socket.on("run_code", async ({ roomId, code, input }) => {
    io.to(roomId).emit("code_output", `> Running Python 3 in Docker...\n`);

    const uniqueId = `run_${Date.now()}_${socket.id}`;
    const runDir = path.join(process.cwd(), uniqueId);

    try {
      await fs.mkdir(runDir, { recursive: true });

      // Always save as Python
      const codeFile = "main.py";
      const inputFile = "input.txt";

      await fs.writeFile(path.join(runDir, codeFile), code);
      await fs.writeFile(path.join(runDir, inputFile), input || ""); 

      // Hardcoded Python Docker command
      const cmd = `docker run --rm -v "${runDir}:/app" -w /app python:3.11-slim sh -c "python ${codeFile} < ${inputFile}"`;

      exec(cmd, { timeout: 30000 }, async (error, stdout, stderr) => {
        let outputMessage = "";

        if (error) {
          if (error.killed) {
            outputMessage = `> 🚨 TIMEOUT ERROR: Execution exceeded 30 seconds.\n`;
            exec(`FOR /F "tokens=*" %i IN ('docker ps -q -f ancestor=python:3.11-slim') DO docker kill %i`);
          } else {
            outputMessage = `> ❌ RUNTIME ERROR:\n${stderr || error.message}\n`;
          }
        } else {
          outputMessage = `> STDOUT:\n${stdout}\n`;
          if (stderr) outputMessage += `> STDERR/WARNINGS:\n${stderr}\n`;
        }

        outputMessage += `\n> Execution complete 🚀`;

        io.to(roomId).emit("code_output", outputMessage);
        await fs.rm(runDir, { recursive: true, force: true }).catch(console.error);
      });

    } catch (err) {
      console.error("Execution setup error:", err);
      io.to(roomId).emit("code_output", `> ❌ SERVER ERROR: Could not setup execution environment.\n`);
      await fs.rm(runDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (let roomId in rooms) {
      rooms[roomId].users = rooms[roomId].users.filter((u) => u.id !== socket.id);
      io.to(roomId).emit("users_update", rooms[roomId].users);
    }
  });
});

server.listen(5000, () => {
  console.log("🔥 WebSocket + Python Docker server running on port 5000");
});
