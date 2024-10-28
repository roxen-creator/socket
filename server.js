const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

// Updated CORS configuration
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

const server = http.createServer(app);

// Updated Socket.IO configuration
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    },
    allowEIO3: true,
    transports: ['websocket', 'polling']
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
    console.log("a user connected");

    socket.on("chat message", (msg) => {
        console.log("User message: " + msg);
        let botReply = getBotReply(msg);
        io.emit("chat message", `Bot: ${botReply}`);
    });

    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
});

function getBotReply(message) {
    message = message.toLowerCase();
    if (message.includes("hello") || message.includes("hi")) {
        return "Hello! How can I help you today?";
    } else if (message.includes("how are you")) {
        return "I'm a bot, so I don't have feelings, but thank you for asking!";
    } else if (message.includes("help")) {
        return "I'm here to help! You can ask me about our services, hours, or location.";
    } else if (message.includes("bye")) {
        return "Goodbye! Have a great day!";
    } else {
        return "I'm not sure how to respond to that. Can you try asking something else?";
    }
}

server.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
