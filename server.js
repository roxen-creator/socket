const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const natural = require("natural");
const Sentiment = require("sentiment");

const app = express();
const sentiment = new Sentiment();
const classifier = new natural.BayesClassifier();

const querySuggestions = [
  { text: "Study programs", category: "programs" },
  { text: "Admission requirements", category: "admissions" },
  { text: "Scholarship options", category: "fees" },
  { text: "Study destinations", category: "destinations" },
  { text: "Language requirements", category: "language" },
  { text: "Visa process", category: "visa" },
];

// Train classifier
classifier.addDocument(
  "programs courses degrees study undergraduate master phd",
  "programs"
);
classifier.addDocument("undergraduate bachelor degree", "undergraduate");
classifier.addDocument("master postgraduate mba", "masters");
classifier.addDocument("phd doctorate research", "phd");
classifier.addDocument(
  "admission requirements application process how to apply",
  "admissions"
);
classifier.addDocument("fees tuition cost scholarship financial aid", "fees");
classifier.addDocument("hello hi hey greetings", "greeting");
classifier.addDocument(
  "countries abroad study destinations locations",
  "destinations"
);
classifier.addDocument(
  "ielts toefl pte english test language requirements",
  "language"
);
classifier.addDocument("visa student visa process requirements", "visa");
classifier.addDocument(
  "university college institution school ranking",
  "universities"
);
classifier.train();

const programResponses = {
  "Undergraduate Degrees": `**Undergraduate Programs**

Choose your field of interest:
• Business & Management
• Computer Science & IT
• Engineering
• Arts & Humanities
• Life Sciences`,

  "Master's Programs": `**Master's Programs**

Select your specialization:
• MBA
• MSc Computer Science
• MA International Relations
• MEng Engineering
• MSc Data Science`,

  "PhD Programs": `**Doctoral Programs**

Explore research areas:
• STEM Fields
• Social Sciences
• Business Research
• Engineering Innovation
• Arts & Humanities`,

  "Professional Certifications": `**Professional Certifications**

Choose certification type:
• Project Management
• Digital Marketing
• Data Analytics
• Cloud Computing
• Business Administration`,

  "Business & Management": `**Business & Management Programs**

Available courses:
• BBA in International Business
• BSc in Finance
• BA in Marketing
• BSc in Economics
• BBA in Entrepreneurship`,

  "Computer Science & IT": `**Computer Science Programs**

Specializations available:
• Software Engineering
• Artificial Intelligence
• Cybersecurity
• Data Science
• Network Engineering`,
};

const responses = {
  greeting:
    "Welcome to Educon! I'm here to guide you through your educational journey. How can I assist you today?",
  programs: `**Educational Programs**

Choose your preferred option:
• Undergraduate Degrees
• Master's Programs
• PhD Programs
• Professional Certifications`,
  default:
    "I'm here to help! Could you please be more specific about what you'd like to know?",
};

function getBotReply(message, userId) {
  const context = conversationContext.get(userId) || {
    messageCount: 0,
    lastTopic: null,
    sentiment: 0,
  };

  // Check for program-specific responses
  if (programResponses[message]) {
    return programResponses[message];
  }

  const classification = classifier.classify(message.toLowerCase());
  context.lastTopic = classification;
  conversationContext.set(userId, context);

  return responses[classification] || responses.default;
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
  allowEIO3: true,
  transports: ["websocket", "polling"],
});

const conversationContext = new Map();

io.on("connection", (socket) => {
  console.log("✨ New user connected:", socket.id);
  socket.emit("query_suggestions", querySuggestions);

  socket.on("reset_chat", () => {
    console.log("🔄 Chat reset requested by:", socket.id);
    conversationContext.delete(socket.id);
    socket.emit("query_suggestions", querySuggestions);
  });

  socket.on("chat message", (msg) => {
    console.log("📩 Received message:", msg);
    console.log("🤖 Generating reply...");

    io.emit("typing", true);

    setTimeout(() => {
      const botReply = getBotReply(msg, socket.id);
      console.log("✉️ Sending reply:", botReply);
      io.emit("chat message", `Bot: ${botReply}`);
      io.emit("typing", false);
    }, 1500);
  });

  socket.on("disconnect", () => {
    console.log("👋 User disconnected:", socket.id);
    conversationContext.delete(socket.id);
  });
});

server.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});
