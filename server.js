const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const natural = require('natural');
const Sentiment = require('sentiment');

const app = express();
const sentiment = new Sentiment();
const classifier = new natural.BayesClassifier();

const querySuggestions = [
    { text: "Tell me about study programs", category: "programs" },
    { text: "Admission requirements", category: "admissions" },
    { text: "Scholarship options", category: "fees" },
    { text: "Study destinations", category: "destinations" },
    { text: "Language requirements", category: "language" },
    { text: "Visa process", category: "visa" }
];

// Train classifier with education-specific patterns
classifier.addDocument('programs courses degrees study', 'programs');
classifier.addDocument('admission requirements application process how to apply', 'admissions');
classifier.addDocument('fees tuition cost scholarship financial aid', 'fees');
classifier.addDocument('hello hi hey greetings', 'greeting');
classifier.addDocument('countries abroad study destinations locations', 'destinations');
classifier.addDocument('ielts toefl pte english test language requirements', 'language');
classifier.addDocument('visa student visa process requirements', 'visa');
classifier.addDocument('university college institution school ranking', 'universities');
classifier.train();

const responses = {
    greeting: [
        "Welcome to EduConsult! I'm here to guide you through your educational journey. How can I assist you today?",
        "Hello! Ready to explore your study abroad options? What would you like to know?",
        "Hi there! Let's find the perfect educational path for you. What interests you?"
    ],
    programs: [
        "We offer guidance for various programs:\n1. Undergraduate Degrees\n2. Master's Programs\n3. PhD Programs\n4. Professional Certifications\n\nWhich level interests you?",
        "Our most popular study programs include:\n• Business & Management\n• Engineering\n• Computer Science\n• Medical Sciences\n\nWould you like details about any of these?",
        "We can help you find programs in:\n- Arts & Humanities\n- Science & Technology\n- Business & Economics\n- Healthcare\n\nWhich field would you like to explore?"
    ],
    admissions: [
        "The admission process typically includes:\n1. Academic Requirements\n2. Language Proficiency\n3. Statement of Purpose\n4. Letters of Recommendation\n\nWould you like details about any specific requirement?",
        "For admissions, you'll need:\n• Academic Transcripts\n• Language Test Scores\n• CV/Resume\n• Application Essays\n\nShall we discuss these requirements?",
        "Let me guide you through the application steps:\n1. University Selection\n2. Document Preparation\n3. Application Submission\n4. Visa Process\n\nWhere would you like to start?"
    ],
    fees: [
        "Our services include:\n1. Application Fee Guidance\n2. Scholarship Search\n3. Financial Planning\n4. Living Cost Estimation\n\nWhat aspect would you like to discuss?",
        "We can help you with:\n• Tuition Fee Information\n• Scholarship Applications\n• Financial Aid Options\n• Budget Planning\n\nWhat's your primary concern?",
        "Let's discuss your financial options:\n- University Scholarships\n- Government Grants\n- Student Loans\n- Work-Study Programs\n\nWhich interests you?"
    ],
    destinations: [
        "Popular study destinations include:\n1. USA 🇺🇸\n2. UK 🇬🇧\n3. Canada 🇨🇦\n4. Australia 🇦🇺\n5. New Zealand 🇳🇿\n\nWhich country interests you?",
        "We support applications to:\n• North America\n• Europe\n• Asia\n• Oceania\n\nWhere would you like to study?",
        "Each destination offers unique benefits:\n- USA: Diverse programs\n- UK: Rich history\n- Canada: Work opportunities\n- Australia: Quality life\n\nLet's explore your options!"
    ],
    language: [
        "We provide guidance for:\n1. IELTS Preparation\n2. TOEFL Training\n3. PTE Academic\n4. Duolingo English Test\n\nWhich test interests you?",
        "Language requirements vary by country:\n• USA: TOEFL preferred\n• UK: IELTS common\n• Australia: Multiple options\n\nNeed specific score requirements?",
        "Our language support includes:\n- Test Preparation\n- Practice Materials\n- Mock Tests\n- Score Improvement Tips\n\nHow can we help?"
    ],
    visa: [
        "The student visa process includes:\n1. Offer Letter\n2. Financial Documents\n3. Visa Application\n4. Interview Preparation\n\nNeed details about any step?",
        "We guide you through:\n• Document Preparation\n• Application Filing\n• Interview Training\n• Visa Requirements\n\nWhat would you like to know?",
        "Our visa support covers:\n- Application Timeline\n- Document Checklist\n- Interview Tips\n- Post-Visa Steps\n\nLet's discuss your needs!"
    ],
    universities: [
        "We partner with top universities worldwide. Would you like to know about:\n1. Rankings\n2. Specializations\n3. Campus Life\n4. Career Outcomes",
        "Our university selection considers:\n• Academic Excellence\n• Research Opportunities\n• Graduate Employability\n• Student Experience\n\nWhat matters most to you?",
        "Let's find your ideal university based on:\n- Program Strength\n- Location\n- Budget\n- Career Goals\n\nWhat are your priorities?"
    ],
    default: [
        "I'd be happy to help you with that. Could you please provide more details about what you're looking for?",
        "Let me assist you better. Could you be more specific about your requirements?",
        "I'm here to help! Could you elaborate on what you'd like to know?"
    ]
};

app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

const server = http.createServer(app);
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

const conversationContext = new Map();

function getRandomResponse(category) {
    const categoryResponses = responses[category] || responses.default;
    return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
}

function getBotReply(message, userId) {
    const context = conversationContext.get(userId) || {
        messageCount: 0,
        lastTopic: null,
        sentiment: 0
    };

    const sentimentScore = sentiment.analyze(message).score;
    const classification = classifier.classify(message.toLowerCase());

    context.messageCount++;
    context.lastTopic = classification;
    context.sentiment = sentimentScore;

    conversationContext.set(userId, context);

    return getRandomResponse(classification);
}

io.on("connection", (socket) => {
    console.log("✨ New user connected:", socket.id);

    socket.emit("query_suggestions", querySuggestions);

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
