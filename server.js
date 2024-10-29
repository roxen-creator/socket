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

const specializationFees = {
  "Software Engineering": `**Software Engineering Fee Structure**

 Fee per semester: $12,000
 Lab Fee: $1,500
 Student Services: $800
 Total Annual Cost: $26,600`,

  "Artificial Intelligence": `**AI Program Fee Structure**

  Fee per semester: $13,000
 Lab Fee: $1,800
 Student Services: $800
 Total Annual Cost: $29,600
`,

  Cybersecurity : `**Cybersecurity Program Fee Structure**

 Tuition Fee per semester: $12,500
 Lab Fee: $1,600
 Student Services: $800
 Total Annual Cost: $27,800
`,

  "Data Science": `**Data Science Program Fee Structure**

 Tuition Fee per semester: $12,800
 Lab Fee: $1,700
 Student Services: $800
 Total Annual Cost: $28,600
`,

  "Network Engineering": `**Network Engineering Fee Structure**

 Tuition Fee per semester: $11,500
 Lab Fee: $1,400
 Student Services: $800
Total Annual Cost: $25,400
`,





};

const specializationAdmissions = {
  "Software Engineering": `**Software Engineering Admission Requirements**

High School Diploma with minimum 3.0 GPA
 Mathematics and Physics prerequisites
 Programming knowledge in any language
 English proficiency (IELTS 6.5 or equivalent)
 Statement of Purpose
 2 Letters of Recommendation`,

  "Artificial Intelligence": `**AI Program Admission Requirements**

 Bachelor's degree with minimum 3.2 GPA
 Strong Mathematics and Statistics background
 Python programming proficiency
 English proficiency (IELTS 7.0 or equivalent)
 Research proposal
 2 Letters of Recommendation`,

  Cybersecurity: `**Cybersecurity Program Admission Requirements**

Bachelor's degree with minimum 3.0 GPA
 Computer Science or related field background
 Basic networking knowledge
 English proficiency (IELTS 6.5 or equivalent)
 Security clearance
 2 Letters of Recommendation`,

  "Data Science": `**Data Science Program Admission Requirements**

 Bachelor's degree with minimum 3.2 GPA
 Strong Statistics and Mathematics background
 Programming experience in Python/R
 English proficiency (IELTS 7.0 or equivalent)
 Portfolio of projects
 2 Letters of Recommendation`,

  "Network Engineering": `**Network Engineering Admission Requirements**

 Bachelor's degree with minimum 3.0 GPA
 Networking fundamentals knowledge
 CCNA certification (preferred)
 English proficiency (IELTS 6.5 or equivalent)
 Technical assessment
 2 Letters of Recommendation`,




 
};

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

  "Software Engineering": `**Software Engineering Options**

Please select:
• Fee Structure
• Admission Requirements`,

  "Artificial Intelligence": `**Artificial Intelligence Options**

Please select:
• Fee Structure
• Admission Requirements`,

  Cybersecurity: `**Cybersecurity Options**

Please select:
• Fee Structure
• Admission Requirements`,

  "Data Science": `**Data Science Options**

Please select:
• Fee Structure
• Admission Requirements`,

  "Network Engineering": `**Network Engineering Options**

Please select:
• Fee Structure
• Admission Requirements`,

  "Fee Structure": (specialization) =>
    specializationFees[specialization] || "Fee information not available",
  "Admission Requirements": (specialization) =>
    specializationAdmissions[specialization] ||
    "Admission requirements not available",
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
    currentSpecialization: null,
  };
  if (message === "Fee Structure" || message === "Admission Requirements") {
    const response =
      message === "Fee Structure"
        ? specializationFees[context.currentSpecialization]
        : specializationAdmissions[context.currentSpecialization];
    return response || "Please select a specialization first";
  }
  if (Object.keys(specializationFees).includes(message)) {
    context.currentSpecialization = message;
    conversationContext.set(userId, context);
  }

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
