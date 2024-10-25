const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
    console.log("a user connected");

    // Listen for incoming messages from the client
    socket.on("chat message", (msg) => {
        console.log("User message: " + msg);

        // Generate a bot response based on the message
        let botReply = getBotReply(msg);

        // Send bot reply to the client
        io.emit("chat message", `Bot: ${botReply}`);
    });

    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
});

// Basic function to generate a bot response
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
