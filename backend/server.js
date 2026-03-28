require("dotenv").config();

const fs = require("fs").promises;
const path = require("path");
const { exec } = require("child_process");

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
        code: "print('Hello Hackathon!')",
        users: [],
      };
    }

    const exists = rooms[roomId].users.find(
      (u) => u.id === socket.id
    );

    if (!exists) {
      rooms[roomId].users.push({
        id: socket.id,
        username,
      });
    }

    socket.emit(
      "receive_code",
      rooms[roomId].code
    );

    io.to(roomId).emit(
      "users_update",
      rooms[roomId].users
    );
  });

  // LIVE CODE SYNC
  socket.on(
    "send_code",
    ({ roomId, code }) => {
      if (!rooms[roomId]) return;

      rooms[roomId].code = code;

      socket.to(roomId).emit(
        "receive_code",
        code
      );
    }
  );

  // MULTI CURSOR
  socket.on(
    "cursor_move",
    ({ roomId, username, position }) => {
      socket.to(roomId).emit(
        "receive_cursor",
        {
          username,
          position,
        }
      );
    }
  );

  // AI REQUEST
  socket.on(
    "ai_request",
    async ({ roomId, code }) => {
      console.log(
        "AI REQUEST:",
        roomId
      );

      try {
        const completion =
          await openai.chat.completions.create(
            {
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "system",
                  content:
                    "You are an AI pair-programming assistant inside a collaborative IDE. Return ONLY raw code suggestions. No markdown, no backticks, no explanations.",
                },
                {
                  role: "user",
                  content: code,
                },
              ],
            }
          );

        const suggestion =
          completion.choices[0].message
            .content;

        io.to(roomId).emit(
          "ai_suggestion",
          suggestion
        );
      } catch (error) {
        console.error(
          "AI ERROR:",
          error
        );
      }
    }
  );

  // RUN CODE IN DOCKER
  socket.on(
    "run_code",
    async ({
      roomId,
      code,
      input,
    }) => {
      io.to(roomId).emit(
        "code_output",
        "> Running Python 3 in Docker...\n"
      );

      const uniqueId = `run_${Date.now()}_${socket.id}`;
      const runDir = path.join(
        process.cwd(),
        uniqueId
      );

      try {
        await fs.mkdir(runDir, {
          recursive: true,
        });

        const codeFile = "main.py";
        const inputFile = "input.txt";

        await fs.writeFile(
          path.join(runDir, codeFile),
          code
        );

        await fs.writeFile(
          path.join(runDir, inputFile),
          input || ""
        );

        const cmd = `docker run --rm -v "${runDir}:/app" -w /app python:3.11-slim sh -c "python ${codeFile} < ${inputFile}"`;

        exec(
          cmd,
          { timeout: 30000 },
          async (
            error,
            stdout,
            stderr
          ) => {
            let outputMessage = "";

            if (error) {
              if (error.killed) {
                outputMessage =
                  "> 🚨 TIMEOUT ERROR: Execution exceeded 30 seconds.\n";

                exec(
                  `docker ps -q --filter ancestor=python:3.11-slim | xargs -r docker kill`
                );
              } else {
                outputMessage = `> ❌ RUNTIME ERROR:\n${
                  stderr ||
                  error.message
                }\n`;
              }
            } else {
              outputMessage = `> STDOUT:\n${stdout}\n`;

              if (stderr) {
                outputMessage += `> STDERR:\n${stderr}\n`;
              }
            }

            outputMessage +=
              "\n> Execution complete 🚀";

            io.to(roomId).emit(
              "code_output",
              outputMessage
            );

            await fs
              .rm(runDir, {
                recursive: true,
                force: true,
              })
              .catch(console.error);
          }
        );
      } catch (err) {
        console.error(
          "DOCKER ERROR:",
          err
        );

        io.to(roomId).emit(
          "code_output",
          "> ❌ SERVER ERROR: Could not create execution sandbox.\n"
        );

        await fs
          .rm(runDir, {
            recursive: true,
            force: true,
          })
          .catch(() => {});
      }
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

server.listen(5000, () => {
  console.log(
    "🔥 WebSocket + AI + Docker Sandbox server running on port 5000"
  );
});