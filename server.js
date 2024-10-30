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
  { text: "Contact Us", category: "contact" },
  { text: "Branch Locations", category: "branch" },
];

// Train classifier
classifier.addDocument(
  "program courses degrees study undergraduate master",
  "programs"
);
classifier.addDocument("undergraduate bachelor degree", "undergraduate");
classifier.addDocument("master postgraduate mba", "masters");
classifier.addDocument("mba business administration management", "mba");
classifier.train();

const contact = {
  "Contact Us": `**Contact Educon**
📧 Email: info@educon.com
📞 Phone: +1 (555) 123-4567
⏰ Hours: Monday-Friday, 9:00 AM - 6:00 PM
💬 Live Chat: Available on website
🌐 Website: www.educon.com`,
};

const branch = {
  "Branch Locations": `**Educon Global Locations**

🌟 Our International Presence

🏢 New York (Global Headquarters)
 123 Education Ave, Manhattan
 New York, NY 10001, USA
 📞 +1 (555) 123-4567
 📧 nyc@educon.com

🏢 London (European Hub)
• 45 Learning Street, City of London
• London EC1A 1BB, UK
• 📞 +44 20 7123 4567
• 📧 london@educon.com

🏢 Singapore (Asia Pacific Center)
 78 Knowledge Road, Marina Bay
 Singapore 238859
 📞 +65 6789 0123
 📧 singapore@educon.com

🏢 Dubai (Middle East Office)
 Educational District, Business Bay
 Dubai, UAE
 📞 +971 4 123 4567
 📧 dubai@educon.com

🏢 Sydney (Oceania Branch)
 90 Study Lane, CBD
 Sydney NSW 2000, Australia
 📞 +61 2 9876 5432
 📧 sydney@educon.com

✨ Visit any of our branches for a free consultation!`,
};

const specializationFees = {
  //computer science & IT
  "Software Engineering": `**Software Engineering Fee Structure**
Fee per semester: $12,000
Lab Fee: $1,500
Student Services: $800
Total Annual Cost: $26,600`,

  "Artificial Intelligence": `**AI Program Fee Structure**
Fee per semester: $13,000
Lab Fee: $1,800
Student Services: $800
Total Annual Cost: $29,600`,
  Cybersecurity: `**Cybersecurity Program Fee Structure**
Tuition Fee per semester: $12,500
Lab Fee: $1,600
Student Services: $800
Total Annual Cost: $27,800`,

  "Data Science": `**Data Science Program Fee Structure**
Tuition Fee per semester: $12,800
Lab Fee: $1,700
Student Services: $800
Total Annual Cost: $28,600`,

  "Network Engineering": `**Network Engineering Fee Structure**
Tuition Fee per semester: $11,500
Lab Fee: $1,400
Student Services: $800
Total Annual Cost: $25,400`,

  //Life science
  Biotechnology: `**Biotechnology Fee Structure**
Fee per semester: $13,500
Lab Fee: $2,000
Student Services: $800
Total Annual Cost: $29,800`,

  Microbiology: `**Microbiology Fee Structure**
Fee per semester: $12,800
Lab Fee: $1,900
Student Services: $800
Total Annual Cost: $28,500`,

  Biochemistry: `**Biochemistry Fee Structure**
Fee per semester: $13,200
Lab Fee: $1,800
Student Services: $800
Total Annual Cost: $29,000`,

  Genetics: `**Genetics Fee Structure**
Fee per semester: $13,800
Lab Fee: $2,100
Student Services: $800
Total Annual Cost: $30,700`,

  Neuroscience: `**Neuroscience Fee Structure**
Fee per semester: $14,000
Lab Fee: $2,200
Student Services: $800
Total Annual Cost: $31,000`,

  //MBA
  "Finance MBA": `**Finance MBA Fee Structure**
Tuition per semester: $15,500
Course Materials: $1,200
Student Services: $800
Total Annual Cost: $33,000`,

  "Marketing MBA": `**Marketing MBA Fee Structure**
Tuition per semester: $14,800
Course Materials: $1,100
Student Services: $800
Total Annual Cost: $31,400`,

  "International Business MBA": `**International Business MBA Fee Structure**
Tuition per semester: $16,000
Course Materials: $1,300
Student Services: $800
Total Annual Cost: $34,100`,

  "Software Engineering": `** Software Engineering Fee Structure**
Tuition per semester: $14,500
Lab Fee: $1,800
Student Services: $800
Total Annual Cost: $31,600`,

  "Machine Learning & AI": `**Machine Learning & AI Fee Structure**
Tuition per semester: $15,000
Lab Fee: $2,000
Student Services: $800
Total Annual Cost: $32,800`,

  "Cloud Computing": `**Cloud Computing Fee Structure**
Tuition per semester: $14,000
Lab Fee: $1,700
Student Services: $800
Total Annual Cost: $30,500`,

  "Information Security": `**Information Security Fee Structure**
Tuition per semester: $14,800
Lab Fee: $1,900
Student Services: $800
Total Annual Cost: $32,300`,

  "Data Analytics": `**Data Analytics Fee Structure**
Tuition per semester: $14,200
Lab Fee: $1,800
Student Services: $800
Total Annual Cost: $31,000`,
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

  //life science
  Biotechnology: `**Biotechnology Admission Requirements**
Bachelor's degree with minimum 3.2 GPA
Strong Biology and Chemistry background
Laboratory experience
English proficiency (IELTS 6.5 or equivalent)
Research proposal
2 Letters of Recommendation`,

  Microbiology: `**Microbiology Admission Requirements**
Bachelor's degree with minimum 3.0 GPA
Biology and Chemistry prerequisites
Lab safety certification
English proficiency (IELTS 6.5 or equivalent)
Statement of Purpose
2 Letters of Recommendation`,

  Biochemistry: `**Biochemistry Admission Requirements**
Bachelor's degree with minimum 3.2 GPA
Strong Chemistry and Biology foundation
Research experience preferred
English proficiency (IELTS 6.5 or equivalent)
Personal Statement
2 Letters of Recommendation`,

  Genetics: `**Genetics Admission Requirements**
Bachelor's degree with minimum 3.3 GPA
Biology and Statistics background
Research methodology knowledge
English proficiency (IELTS 7.0 or equivalent)
Research interests statement
2 Letters of Recommendation`,

  Neuroscience: `**Neuroscience Admission Requirements**
Bachelor's degree with minimum 3.3 GPA
Biology and Psychology background
Research experience preferred
English proficiency (IELTS 7.0 or equivalent)
Research proposal
2 Letters of Recommendation`,

  // MBA
  "Finance MBA": `**Finance MBA Admission Requirements**
Bachelor's degree with minimum 3.0 GPA
3+ years work experience
GMAT/GRE scores
Financial sector experience preferred
English proficiency (IELTS 7.0 or equivalent)
Professional recommendations`,

  "Marketing MBA": `**Marketing MBA Admission Requirements**
Bachelor's degree with minimum 3.0 GPA
2+ years work experience
GMAT/GRE scores
Marketing portfolio
English proficiency (IELTS 7.0 or equivalent)
Professional recommendations`,

  "International Business MBA": `**International Business MBA Admission Requirements**
Bachelor's degree with minimum 3.0 GPA
4+ years work experience
GMAT/GRE scores
International exposure
English proficiency (IELTS 7.5 or equivalent)
Professional recommendations`,

  " Software Engineering": `**Software Engineering Admission Requirements**
Bachelor's in Computer Science or related field
Minimum 3.2 GPA
Strong programming background
Software development experience
English proficiency (IELTS 7.0 or equivalent)
2 Letters of Recommendation`,

  "Machine Learning & AI": `**Machine Learning & AI Admission Requirements**
Bachelor's in Computer Science/Mathematics
Minimum 3.3 GPA
Python programming proficiency
Strong mathematics background
English proficiency (IELTS 7.0 or equivalent)
Research proposal`,

  "Cloud Computing": `**Cloud Computing Admission Requirements**
Bachelor's in Computer Science or IT
Minimum 3.0 GPA
Networking fundamentals
Cloud platform experience preferred
English proficiency (IELTS 6.5 or equivalent)
Technical assessment`,

  "Information Security": `**Information Security Admission Requirements**
Bachelor's in Computer Science or related field
Minimum 3.2 GPA
Security fundamentals knowledge
Programming experience
English proficiency (IELTS 7.0 or equivalent)
Security clearance`,

  "Data Analytics": `**Data Analytics Admission Requirements**
Bachelor's in Computer Science/Statistics
Minimum 3.2 GPA
Statistical analysis skills
Programming in R/Python
English proficiency (IELTS 7.0 or equivalent)
Portfolio of projects`,
};

const undergraduatePrograms = {
  "Undergraduate Degrees": `**Undergraduate Programs**
Choose your field of interest:
• Computer Science & IT
• Life Sciences`,
};
const mastersPrograms = {
  "Master's Programs": `**Master's Programs**
Select your specialization:
• MBA
• MSc Computer Science`,
};

const mbaPrograms = {
  MBA: `**MBA Programs**
Specializations available:
• Finance MBA
• Marketing MBA
• International Business MBA`,

  "Finance MBA": `**Finance MBA Options**
Please select:
• Fee Structure
• Admission Requirements`,

  "Marketing MBA": `**Marketing MBA Options**
Please select:
• Fee Structure
• Admission Requirements`,

  "International Business MBA": `**International Business MBA Options**
Please select:
• Fee Structure
• Admission Requirements`,
};

const mscComputerSciencePrograms = {
  "MSc Computer Science": `**MSc Computer Science Programs**
Specializations available:
•  Software Engineering
• Machine Learning & AI
• Cloud Computing
• Information Security
• Data Analytics`,

  " Software Engineering": `** Software Engineering Options**
Please select:
• Fee Structure
• Admission Requirements`,

  "Machine Learning & AI": `**Machine Learning & AI Options**
Please select:
• Fee Structure
• Admission Requirements`,

  "Cloud Computing": `**Cloud Computing Options**
Please select:
• Fee Structure
• Admission Requirements`,

  "Information Security": `**Information Security Options**
Please select:
• Fee Structure
• Admission Requirements`,

  "Data Analytics": `**Data Analytics Options**
Please select:
• Fee Structure
• Admission Requirements`,
};

const computerSciencePrograms = {
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
};
const lifeSciencePrograms = {
  "Life Sciences": `**Life Sciences Programs**
Specializations available:
• Biotechnology
• Microbiology
• Biochemistry
• Genetics
• Neuroscience`,

  Biotechnology: `**Biotechnology Options**
Please select:
• Fee Structure
• Admission Requirements`,

  Microbiology: `**Microbiology Options**
Please select:
• Fee Structure
• Admission Requirements`,

  Biochemistry: `**Biochemistry Options**
Please select:
• Fee Structure
• Admission Requirements`,

  Genetics: `**Genetics Options**
Please select:
• Fee Structure
• Admission Requirements`,

  Neuroscience: `**Neuroscience Options**
Please select:
• Fee Structure
• Admission Requirements`,
};

const programResponses = {
  ...undergraduatePrograms,
  ...mastersPrograms,
  ...mbaPrograms,
  ...computerSciencePrograms,
  ...lifeSciencePrograms,
  ...mscComputerSciencePrograms,
  ...contact,
  ...branch,
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
• Master's Programs`,
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
