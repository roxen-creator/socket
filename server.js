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
    { text: "Study programs", category: "programs" },
    { text: "Admission requirements", category: "admissions" },
    { text: "Scholarship options", category: "fees" },
    { text: "Study destinations", category: "destinations" },
    { text: "Language requirements", category: "language" },
    { text: "Visa process", category: "visa" }
];

// Train classifier
classifier.addDocument('programs courses degrees study undergraduate master phd', 'programs');
classifier.addDocument('undergraduate bachelor degree', 'undergraduate');
classifier.addDocument('master postgraduate mba', 'masters');
classifier.addDocument('phd doctorate research', 'phd');
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
        `Let's explore our educational programs:

Select your preferred option:
[1] Undergraduate Degrees
[2] Master's Programs
[3] PhD Programs
[4] Professional Certifications

Click on any option or type your choice.`,

        `Discover our popular programs:

Available options:
[1] Business & Management
[2] Engineering
[3] Computer Science
[4] Medical Sciences

Select an option to learn more.`,

        `Browse programs by field:

Choose your interest:
[1] Arts & Humanities
[2] Science & Technology
[3] Business & Economics
[4] Healthcare

Click to explore each field.`
    ],
    undergraduate: [
`Undergraduate Programs Overview:

Choose your area of interest:
[1] Program Structure
• 3-4 years duration
• Flexible major/minor options
• Internship opportunities

[2] Popular Fields
• Business Administration
• Computer Science
• Engineering
• Life Sciences

[3] Entry Requirements
• High school diploma
• Language proficiency
• Statement of purpose

Select a number to learn more.`
    ],
    masters: [
        `Master's Programs Information:

Select an option to explore:
[1] Program Types
• MBA
• MSc in Engineering
• MA in Arts
• MS in Technology

[2] Duration & Format
• 1-2 years full-time
• Part-time options
• Online/Hybrid modes

[3] Requirements
• Bachelor's degree
• Work experience (for some programs)
• Research proposal (if applicable)

Choose a number for details.`
    ],
    phd: [
        `PhD Programs Guide:

Choose an aspect to explore:
[1] Research Areas
• STEM Fields
• Social Sciences
• Arts & Humanities
• Interdisciplinary Studies

[2] Program Components
• Coursework
• Research
• Teaching
• Dissertation

[3] Support Services
• Supervision
• Funding
• Publication
• Career Development

Select a number for more information.`
    ],
    admissions: [
        "The admission process typically includes:\n1. Academic Requirements\n2. Language Proficiency\n3. Statement of Purpose\n4. Letters of Recommendation\n\nSelect a requirement to learn more.",
        "For admissions, you'll need:\n• Academic Transcripts\n• Language Test Scores\n• CV/Resume\n• Application Essays\n\nClick on any requirement for details.",
        "Let me guide you through the application steps:\n1. University Selection\n2. Document Preparation\n3. Application Submission\n4. Visa Process\n\nChoose a step to begin."
    ],
    fees: [
        "Our services include:\n1. Application Fee Guidance\n2. Scholarship Search\n3. Financial Planning\n4. Living Cost Estimation\n\nSelect an option to discuss.",
        "We can help you with:\n• Tuition Fee Information\n• Scholarship Applications\n• Financial Aid Options\n• Budget Planning\n\nClick on your area of interest.",
        "Let's discuss your financial options:\n- University Scholarships\n- Government Grants\n- Student Loans\n- Work-Study Programs\n\nChoose an option to explore."
    ],
    destinations: [
        "Popular study destinations include:\n1. USA 🇺🇸\n2. UK 🇬🇧\n3. Canada 🇨🇦\n4. Australia 🇦🇺\n5. New Zealand 🇳🇿\n\nSelect a country to explore.",
        "We support applications to:\n• North America\n• Europe\n• Asia\n• Oceania\n\nClick on a region to learn more.",
        "Each destination offers unique benefits:\n- USA: Diverse programs\n- UK: Rich history\n- Canada: Work opportunities\n- Australia: Quality life\n\nChoose a destination to explore."
    ],
    language: [
        "We provide guidance for:\n1. IELTS Preparation\n2. TOEFL Training\n3. PTE Academic\n4. Duolingo English Test\n\nSelect a test for details.",
        "Language requirements vary by country:\n• USA: TOEFL preferred\n• UK: IELTS common\n• Australia: Multiple options\n\nClick for specific requirements.",
        "Our language support includes:\n- Test Preparation\n- Practice Materials\n- Mock Tests\n- Score Improvement Tips\n\nChoose an area for guidance."
    ],
    visa: [
        "The student visa process includes:\n1. Offer Letter\n2. Financial Documents\n3. Visa Application\n4. Interview Preparation\n\nSelect a step for guidance.",
        "We guide you through:\n• Document Preparation\n• Application Filing\n• Interview Training\n• Visa Requirements\n\nClick for detailed information.",
        "Our visa support covers:\n- Application Timeline\n- Document Checklist\n- Interview Tips\n- Post-Visa Steps\n\nChoose an aspect to discuss."
    ],
    universities: [
        "We partner with top universities worldwide. Select an aspect:\n1. Rankings\n2. Specializations\n3. Campus Life\n4. Career Outcomes",
        "Our university selection considers:\n• Academic Excellence\n• Research Opportunities\n• Graduate Employability\n• Student Experience\n\nClick to explore.",
        "Let's find your ideal university based on:\n- Program Strength\n- Location\n- Budget\n- Career Goals\n\nSelect your priority."
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


//socket status ==> console.log

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
