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
  { text: "Contact us", category: "contact" },
  { text: "Branch locations", category: "branch" },
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
classifier.addDocument("contact us phone email", "contact");
classifier.addDocument(
  "branch office location address nearest center",
  "branch"
);
classifier.train();

const responses = {
  greeting:
    "Welcome to Educon! I'm here to guide you through your educational journey. How can I assist you today?",
  programs: `**Educational Programs**

Choose your preferred option:
• Undergraduate Degrees
• Master's Programs
• PhD Programs
• Professional Certifications`,
  contact: `**Contact Educon**
    
Choose how to reach us:
• Email: info@educon.com
• Phone: +120202002020202
• WhatsApp: +1-234-567-8901`,
  branch: `**Our Branch Network**

Select your region:
**North Region**
• Delhi NCR
• Chandigarh
• Lucknow

**South Region**
• Bangalore
• Chennai
• Hyderabad

**International Offices**
• Dubai
• Singapore
• London`,
  default:
    "I'm here to help! Could you please be more specific about what you'd like to know?",
};

const topicResponses = {
  branch: {
    north:
      "**North Region Details**\n• Delhi NCR: 123 Main Street, Delhi\n• Chandigarh: SCO 456, Sector 17\n• Lucknow: 789 Gomti Nagar\n\nOffice Hours: Mon-Sat 9AM-6PM",
    south:
      "**South Region Details**\n• Bangalore: 321 MG Road\n• Chennai: 654 Anna Nagar\n• Hyderabad: 987 Jubilee Hills\n\nOffice Hours: Mon-Sat 9AM-6PM",
    international:
      "**International Offices**\n• Dubai: Business Bay Tower\n• Singapore: 111 Orchard Road\n• London: 222 Oxford Street\n\nPlease check local time zones for office hours",
  },
  contact: {
    email:
      "**Email Contact**\nYou can email us at info@educon.com. We typically respond within 24 hours.",
    phone:
      "**Phone Support**\nCall us at +1-234-567-8900. Our phone lines are open Monday-Friday, 9AM-6PM.",
    whatsapp:
      "**WhatsApp Support**\nMessage us on WhatsApp: +1-234-567-8901 for 24/7 support.",
  },
  programs: {
    undergraduate:
      "**Undergraduate Programs**\n3-4 year programs in Business, Engineering, Arts & Sciences.",
    masters:
      "**Master's Programs**\n1-2 year advanced degrees including MBA, MSc, MA.",
    phd: "**PhD Programs**\nResearch-focused doctoral programs with funding opportunities.",
    professional:
      "**Professional Certifications**\nShort-term specialized courses in various fields.",
  },
};

function getBotReply(message, userId) {
  const context = conversationContext.get(userId) || {
    messageCount: 0,
    lastTopic: null,
    sentiment: 0,
  };

  if (
    /^[1-4]$/.test(message) &&
    context.lastTopic &&
    topicResponses[context.lastTopic]
  ) {
    return (
      topicResponses[context.lastTopic][message] || responses[context.lastTopic]
    );
  }

  const classification = classifier.classify(message.toLowerCase());
  context.lastTopic = classification;
  conversationContext.set(userId, context);

  return responses[classification] || responses.default;
}

// Express and Socket.IO setup remains the same
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
