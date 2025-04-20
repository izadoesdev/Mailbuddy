import { EMAIL_CATEGORIES, PRIORITY_LEVELS } from "@/app/(dev)/ai/new/constants";
import { encodeEncryptedData, encryptText } from "@/libs/utils/encryption";
import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

// Define interfaces for clarity
interface Company {
    name: string;
    domain: string;
    category: string;
    businessType: BusinessType;
}

interface PersonalEmail {
    name: string;
    email: string;
    relationship?: "family" | "friend" | "colleague" | "acquaintance";
}

interface EmailTemplate {
    subjects: string[];
    bodies: string[];
}

interface EmailTemplates {
    [key: string]: EmailTemplate;
}

interface EmailData {
    from: string;
    to: string;
    subject: string;
    body: string;
    snippet: string;
    isRead: boolean;
    isStarred: boolean;
    labels: string[];
    category: string;
}

interface EmailWithMetadata {
    email: {
        id: string;
        threadId: string;
        userId: string;
        from: string;
        to: string;
        subject: string;
        body: string;
        snippet: string;
        isRead: boolean;
        isStarred: boolean;
        labels: string[];
        internalDate: string;
        fetchedAt: string;
        createdAt: string;
        updatedAt: string;
    };
}

// Define business types for context-appropriate emails
type BusinessType =
    | "social"
    | "technology"
    | "ecommerce"
    | "finance"
    | "entertainment"
    | "gaming"
    | "productivity"
    | "cloud"
    | "media"
    | "travel";

const companies: Company[] = [
    { name: "Vercel", domain: "vercel.com", category: "Technology", businessType: "cloud" },
    { name: "Neon", domain: "neon.tech", category: "Technology", businessType: "cloud" },
    { name: "Supabase", domain: "supabase.com", category: "Technology", businessType: "cloud" },
    { name: "Prisma", domain: "prisma.io", category: "Technology", businessType: "technology" },
    { name: "Stripe", domain: "stripe.com", category: "Financial", businessType: "finance" },
    { name: "GitHub", domain: "github.com", category: "Technology", businessType: "productivity" },
    { name: "Google", domain: "google.com", category: "Technology", businessType: "technology" },
    { name: "Apple", domain: "apple.com", category: "Technology", businessType: "technology" },
    {
        name: "Microsoft",
        domain: "microsoft.com",
        category: "Technology",
        businessType: "productivity",
    },
    { name: "Amazon", domain: "amazon.com", category: "Shopping", businessType: "ecommerce" },
    { name: "Facebook", domain: "facebook.com", category: "Social", businessType: "social" },
    { name: "Twitter", domain: "twitter.com", category: "Social", businessType: "social" },
    { name: "LinkedIn", domain: "linkedin.com", category: "Social", businessType: "social" },
    { name: "Instagram", domain: "instagram.com", category: "Social", businessType: "social" },
    { name: "TikTok", domain: "tiktok.com", category: "Social", businessType: "social" },
    { name: "Snapchat", domain: "snapchat.com", category: "Social", businessType: "social" },
    { name: "Pinterest", domain: "pinterest.com", category: "Social", businessType: "social" },
    { name: "Reddit", domain: "reddit.com", category: "Social", businessType: "social" },
    { name: "YouTube", domain: "youtube.com", category: "Entertainment", businessType: "media" },
    { name: "Spotify", domain: "spotify.com", category: "Entertainment", businessType: "media" },
    { name: "Netflix", domain: "netflix.com", category: "Entertainment", businessType: "media" },
    { name: "Disney", domain: "disney.com", category: "Entertainment", businessType: "media" },
    { name: "Nintendo", domain: "nintendo.com", category: "Entertainment", businessType: "gaming" },
    { name: "Sony", domain: "sony.com", category: "Entertainment", businessType: "technology" },
    { name: "Airbnb", domain: "airbnb.com", category: "Travel", businessType: "travel" },
    { name: "Expedia", domain: "expedia.com", category: "Travel", businessType: "travel" },
    { name: "Booking", domain: "booking.com", category: "Travel", businessType: "travel" },
    { name: "PayPal", domain: "paypal.com", category: "Financial", businessType: "finance" },
    { name: "Square", domain: "square.com", category: "Financial", businessType: "finance" },
    { name: "Etsy", domain: "etsy.com", category: "Shopping", businessType: "ecommerce" },
    { name: "eBay", domain: "ebay.com", category: "Shopping", businessType: "ecommerce" },
];

const personalEmails: PersonalEmail[] = [
    { name: "John Doe", email: "john.doe@gmail.com", relationship: "colleague" },
    { name: "Jane Smith", email: "jane.smith@gmail.com", relationship: "colleague" },
    { name: "Jim Beam", email: "jim.beam@gmail.com", relationship: "colleague" },
    { name: "John Smith", email: "john.smith@gmail.com", relationship: "colleague" },
    { name: "Jane Doe", email: "jane.doe@gmail.com", relationship: "friend" },
    { name: "Alex Wong", email: "alex.wong@gmail.com", relationship: "friend" },
    { name: "Sarah Chen", email: "sarah.chen@gmail.com", relationship: "friend" },
    { name: "Mom", email: "mom@familyemail.com", relationship: "family" },
    { name: "Dad", email: "dad@familyemail.com", relationship: "family" },
    { name: "Sister", email: "sister@familyemail.com", relationship: "family" },
    { name: "Brother", email: "brother@familyemail.com", relationship: "family" },
    { name: "Uncle Bob", email: "uncle.bob@familyemail.com", relationship: "family" },
    { name: "Aunt Lisa", email: "aunt.lisa@familyemail.com", relationship: "family" },
    { name: "Cousin Mike", email: "cousin.mike@familyemail.com", relationship: "family" },
    { name: "Grandma", email: "grandma@familyemail.com", relationship: "family" },
];

const emailStarts: string[] = [
    "noreply",
    "no-reply",
    "notifications",
    "updates",
    "welcome",
    "support",
    "billing",
    "security",
    "legal",
    "privacy",
    "newsletter",
    "updates",
    "welcome",
    "support",
    "billing",
    "security",
    "legal",
    "privacy",
    "newsletter",
];

// Email templates by category for more realistic content
const emailTemplates: EmailTemplates = {
    Work: {
        subjects: [
            "Project update: {{project}}",
            "Meeting scheduled for {{date}}",
            "Quarterly review for {{department}}",
            "Action required: {{task}} deadline approaching",
            "Request for feedback on {{document}}",
            "New assignment: {{project}}",
            "Team announcement: {{announcement}}",
        ],
        bodies: [
            "Hi {{name}},\n\nI wanted to update you on the status of the {{project}} project. We've made significant progress on the {{feature}} and are on track to meet our deadline of {{date}}.\n\nPlease review the attached documents and let me know if you have any questions.\n\nBest regards,\n{{sender}}",

            "Dear {{name}},\n\nThis is a reminder that we have a meeting scheduled for {{date}} at {{time}} to discuss {{topic}}. The meeting will take place in {{location}}.\n\nPlease come prepared with your updates on {{task}}.\n\nKind regards,\n{{sender}}",

            "Hello Team,\n\nI'm reaching out to provide a status update on our current projects:\n\n1. {{project1}}: {{status1}}\n2. {{project2}}: {{status2}}\n3. {{project3}}: {{status3}}\n\nPlease let me know if you have any questions or need additional information.\n\nBest,\n{{sender}}",
        ],
    },
    Marketing: {
        subjects: [
            "{{discount}}% off - Limited Time Offer!",
            "Introducing our new {{product}}",
            "{{event}} - Save the date!",
            "Exclusive offer for {{name}}",
            "Your {{membership}} benefits",
        ],
        bodies: [
            "Dear {{name}},\n\nWe're excited to announce our latest product, the {{product}}! For a limited time, enjoy {{discount}}% off when you use the code {{code}} at checkout.\n\nOur {{product}} features:\n- {{feature1}}\n- {{feature2}}\n- {{feature3}}\n\nOffer ends {{date}}.\n\nShop now: {{link}}\n\nBest regards,\n{{company}} Team",

            "Hello {{name}},\n\nYou're invited to join us for our upcoming {{event}} on {{date}} at {{time}}. This exclusive event will feature {{highlight}} and much more.\n\nRegister now: {{link}}\n\nWe look forward to seeing you there!\n\nThe {{company}} Team",
        ],
    },
    Financial: {
        subjects: [
            "Your {{month}} statement is ready",
            "Important update to your account #{{accountNumber}}",
            "Payment confirmation #{{transactionId}}",
            "Unusual activity detected on your account",
            "Upcoming change to {{service}} terms",
        ],
        bodies: [
            "Dear {{name}},\n\nYour {{month}} statement for account ending in {{accountLast4}} is now available. Summary:\n\n- Opening Balance: {{openingBalance}}\n- Closing Balance: {{closingBalance}}\n- Payment Due: {{paymentDue}}\n- Due Date: {{dueDate}}\n\nTo view your full statement, please log in to your account.\n\nThank you for your business.\n\n{{company}} Financial Services",

            "Hello {{name}},\n\nWe're writing to confirm your recent transaction:\n\nAmount: {{amount}}\nDate: {{date}}\nMerchant: {{merchant}}\nTransaction ID: {{transactionId}}\n\nIf you did not authorize this transaction, please contact our customer service team immediately at {{phone}}.\n\nRegards,\n{{company}} Security Team",
        ],
    },
    Newsletters: {
        subjects: [
            "{{publication}} - {{month}} Newsletter",
            "This week in {{industry}}: Top stories",
            "{{publication}} Insider: {{topic}} special",
            "Your weekly {{topic}} digest",
        ],
        bodies: [
            "Hello {{name}},\n\nWelcome to our {{month}} newsletter! Here are this month's highlights:\n\n{{headline1}}\n{{summary1}}\n\n{{headline2}}\n{{summary2}}\n\n{{headline3}}\n{{summary3}}\n\nClick here to read more: {{link}}\n\nStay informed,\n{{publication}} Team",

            "Dear Subscriber,\n\nHere's your weekly roundup of {{topic}} news:\n\n1. {{headline1}} - {{source1}}\n{{summary1}}\n\n2. {{headline2}} - {{source2}}\n{{summary2}}\n\n3. {{headline3}} - {{source3}}\n{{summary3}}\n\nFor more updates, follow us on social media.\n\nHappy reading,\n{{publication}} Editorial Team",
        ],
    },
    Social: {
        subjects: [
            "{{name}} mentioned you in a comment",
            "{{name}} sent you a connection request",
            "New message from {{name}}",
            "Activity on your post: {{reactions}} reactions",
            "{{name}} and {{count}} others liked your photo",
        ],
        bodies: [
            'Hi {{name}},\n\n{{sender}} mentioned you in a comment: "{{comment}}"\n\nView and reply: {{link}}\n\nCheers,\n{{platform}} Team',

            'Hello {{name}},\n\nYou have a new message from {{sender}}:\n\n"{{message}}"\n\nReply: {{link}}\n\nBest,\n{{platform}} Team',
        ],
    },
    Travel: {
        subjects: [
            "Your itinerary for {{destination}}",
            "Confirmation: {{transportType}} booking #{{bookingId}}",
            "Check-in reminder for your trip to {{destination}}",
            "Your {{hotel}} reservation details",
        ],
        bodies: [
            "Dear {{name}},\n\nThank you for booking with us. Here is your itinerary for your upcoming trip to {{destination}}:\n\nDeparture:\n{{departureDate}} at {{departureTime}}\nFrom: {{origin}}\nTo: {{destination}}\n{{transportType}} #{{transportNumber}}\n\nReturn:\n{{returnDate}} at {{returnTime}}\nFrom: {{destination}}\nTo: {{origin}}\n{{transportType}} #{{returnTransportNumber}}\n\nBooking Reference: {{bookingId}}\n\nSafe travels,\n{{company}} Bookings Team",

            "Hello {{name}},\n\nYour stay at {{hotel}} is confirmed for {{checkInDate}} to {{checkOutDate}}. Reservation details:\n\nReservation #: {{reservationId}}\nRoom Type: {{roomType}}\nGuests: {{guestCount}}\nTotal: {{amount}}\n\nCheck-in: {{checkInTime}}\nCheck-out: {{checkOutTime}}\n\nWe look forward to welcoming you!\n\n{{hotel}} Team",
        ],
    },
};

// Helper functions for generating realistic emails
const generateThreadId = (): string => uuidv4();

const generateEmailId = (): string => uuidv4();

const getRandomCompany = (): Company => companies[Math.floor(Math.random() * companies.length)];

const getRandomPersonalEmail = (): PersonalEmail =>
    personalEmails[Math.floor(Math.random() * personalEmails.length)];

const getRandomEmailStart = (company: Company): string => {
    // Get appropriate email prefixes for this company's business type
    const appropriatePrefixes = businessTypeEmailMap[company.businessType] || emailStarts;
    return faker.helpers.arrayElement(appropriatePrefixes);
};

const getRandomDateInRange = (start: Date, end: Date): Date => {
    return faker.date.between({ from: start, to: end });
};

const getRandomCategory = (): string => {
    return EMAIL_CATEGORIES[Math.floor(Math.random() * EMAIL_CATEGORIES.length)];
};

const getRandomPriority = (): string => {
    const priorities = Object.values(PRIORITY_LEVELS);
    return priorities[Math.floor(Math.random() * priorities.length)];
};

type EmailType = "company" | "personal" | "newsletter" | "family";

interface EmailTypeWeight {
    type: EmailType;
    weight: number;
}

const getRandomEmailType = (): EmailType => {
    const types: EmailTypeWeight[] = [
        { type: "company", weight: 60 },
        { type: "personal", weight: 25 },
        { type: "newsletter", weight: 10 },
        { type: "family", weight: 5 }, // Lower weight for family emails to be realistic
    ];

    const totalWeight = types.reduce((sum, type) => sum + type.weight, 0);
    let random = Math.random() * totalWeight;

    for (const type of types) {
        if (random < type.weight) {
            return type.type;
        }
        random -= type.weight;
    }

    return "company";
};

const generateFormattedDate = (): string => {
    return faker.date.recent().toISOString();
};

const generateEmailBody = (category: string, params: Record<string, string>): string => {
    // Get templates for this category or default to Work category
    const categoryTemplates =
        emailTemplates[category as keyof typeof emailTemplates] || emailTemplates.Work;

    // Select a random body template
    const bodyTemplate = faker.helpers.arrayElement(categoryTemplates.bodies);

    // Replace all placeholders with params
    return bodyTemplate.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        return params[key] || faker.lorem.word();
    });
};

const generateEmailSubject = (category: string, params: Record<string, string>): string => {
    // Get templates for this category or default to Work category
    const categoryTemplates =
        emailTemplates[category as keyof typeof emailTemplates] || emailTemplates.Work;

    // Select a random subject template
    const subjectTemplate = faker.helpers.arrayElement(categoryTemplates.subjects);

    // Replace all placeholders with params
    return subjectTemplate.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        return params[key] || faker.lorem.word();
    });
};

// Map of email prefixes that make sense for different business types
const businessTypeEmailMap: Record<BusinessType, string[]> = {
    social: ["notifications", "updates", "connect", "friend", "community", "social", "invite"],
    technology: ["support", "info", "updates", "noreply", "developer", "api", "tech"],
    ecommerce: [
        "orders",
        "shipping",
        "support",
        "noreply",
        "returns",
        "billing",
        "promotions",
        "sales",
    ],
    finance: [
        "accounts",
        "billing",
        "statements",
        "payments",
        "security",
        "noreply",
        "transactions",
        "support",
    ],
    entertainment: [
        "updates",
        "noreply",
        "subscriptions",
        "content",
        "recommendations",
        "watch",
        "new",
    ],
    gaming: ["updates", "support", "noreply", "games", "play", "account", "rewards"],
    productivity: ["support", "notifications", "updates", "team", "billing", "admin", "noreply"],
    cloud: ["support", "billing", "admin", "platform", "noreply", "status", "alerts", "updates"],
    media: ["subscriptions", "updates", "content", "noreply", "recommendations", "watch", "listen"],
    travel: ["bookings", "reservations", "itinerary", "travel", "support", "noreply", "trips"],
};

// Map categories to more appropriate email templates
const categorizedEmailTemplates: Record<string, string[]> = {
    Social: ["Social", "Personal"],
    Technology: ["Work", "Technology", "Support"],
    Financial: ["Financial", "Work"],
    Shopping: ["Marketing", "Shopping", "Receipts"],
    Entertainment: ["Entertainment", "Marketing", "Updates"],
    Travel: ["Travel", "Updates"],
};

// Helper function to generate realistic content instead of lorem ipsum
const generateRealisticContent = {
    // Generate realistic sentences based on context
    sentence: (context: string): string => {
        const sentencesByContext: Record<string, string[]> = {
            comment: [
                "I really like your perspective on this!",
                "Thanks for sharing this information.",
                "This is exactly what I was looking for.",
                "Have you considered approaching it differently?",
                "Great work on this project!",
                "I'm not sure I agree with this approach.",
                "Let's discuss this further at our next meeting.",
                "You made some excellent points here.",
                "This is very helpful, thank you!",
                "Could you elaborate more on this?",
            ],
            feedback: [
                "Your presentation was clear and well-structured.",
                "The document needs more supporting data to strengthen your argument.",
                "I found your analysis thorough and insightful.",
                "The proposal addresses all our key requirements.",
                "The report would benefit from more visual elements.",
                "Your design perfectly captures our brand identity.",
                "The solution is innovative but might be complex to implement.",
                "The strategy aligns well with our objectives.",
                "Your approach seems cost-effective and practical.",
                "The timeline seems ambitious given the scope of work.",
            ],
            message: [
                "I wanted to follow up on our conversation from last week. Are you available to meet sometime this week?",
                "I've been reviewing the materials you sent and have some questions I'd like to discuss.",
                "Just checking in to see how the project is progressing. Do you need any additional resources?",
                "Thanks for your input at the meeting yesterday. Your insights were very valuable.",
                "I'm sharing some research I found that might be relevant to our current initiative.",
                "Could we schedule a quick call to discuss the next steps for our collaboration?",
                "I've updated the document based on your feedback and would love your thoughts on the changes.",
                "Just wanted to make sure we're aligned on the project objectives before the client meeting.",
                "I've been thinking about your proposal and have some ideas I'd like to share.",
                "Hope you're doing well! I was wondering if you had a chance to review the document I sent last week.",
            ],
            summary: [
                "Key performance indicators show positive growth across all markets this quarter.",
                "Latest update brings security improvements and new features requested by users.",
                "Team successfully delivered the project ahead of schedule and under budget.",
                "New partnership announced with industry leader to expand service offerings.",
                "Product launch exceeded expectations with 50% higher adoption than forecasted.",
                "Customer feedback highlights ease of use as our platform's main advantage.",
                "Strategic restructuring aims to improve operational efficiency by 15%.",
                "Market analysis reveals new opportunities in emerging sectors.",
                "Quarterly results demonstrate strong performance despite market challenges.",
                "Research findings suggest significant potential for expansion in Asian markets.",
            ],
            explanation: [
                "This change will help us streamline our workflow by reducing redundant steps.",
                "The new system integrates directly with our existing tools to minimize disruption.",
                "Our approach prioritizes user privacy while enhancing data accessibility.",
                "The methodology combines traditional techniques with innovative technologies.",
                "This solution addresses both immediate needs and long-term strategic goals.",
                "We've restructured the framework to improve scalability for future growth.",
                "The proposed timeline allows for thorough testing before full implementation.",
                "Our analysis indicates that this approach offers the best balance of cost and quality.",
                "The redesigned interface incorporates feedback from extensive user testing.",
                "This strategy mitigates key risks while maximizing potential opportunities.",
            ],
            announcement: [
                "We're excited to welcome Sarah Johnson who's joining our marketing team next month.",
                "Our company has been recognized as a top employer in the technology sector for the third year running.",
                "We've secured Series B funding of $15M to accelerate our product development and market expansion.",
                "Our annual company retreat will take place in Colorado from September 15-18.",
                "We're rolling out a new flexible work policy effective from next quarter.",
                "Our team has reached the milestone of serving over 1 million customers worldwide.",
                "We're proud to announce our new partnership with Microsoft for cloud solutions.",
                "Our product has been nominated for the Industry Innovation Award 2023.",
                "We've opened a new office in Singapore to better serve our Asia-Pacific clients.",
                "Our CEO will be speaking at the upcoming Tech Leaders Summit in San Francisco.",
            ],
            promotion: [
                "Limited time offer available exclusively for our valued customers.",
                "Early bird pricing ends this Friday - secure your spot today!",
                "Members get priority access to our new premium features.",
                "Join thousands of satisfied customers who've upgraded this month.",
                "Special holiday discount on all premium plans until December 31.",
                "Buy one get one free for new subscribers this week only.",
                "Upgrade now and get three months of additional service at no cost.",
                "Exclusive 30% discount for loyal customers like you.",
                "Flash sale: All premium templates available at half price for 24 hours only.",
                "Refer a friend and both of you will receive a complimentary month of service.",
            ],
        };

        const fallbackSentences = [
            "Thank you for your attention to this matter.",
            "We appreciate your continued support.",
            "Please don't hesitate to reach out with any questions.",
            "Looking forward to your response.",
            "We value your feedback on this initiative.",
            "Thank you for your consideration.",
            "We're committed to providing the best experience possible.",
            "Your satisfaction is our top priority.",
            "We're here to help if you need any assistance.",
            "We look forward to our continued partnership.",
        ];

        const sentences = sentencesByContext[context] || fallbackSentences;
        return faker.helpers.arrayElement(sentences);
    },

    // Generate realistic paragraphs based on context
    paragraph: (context: string): string => {
        const sentences = [];
        // Generate 3-5 contextually related sentences to form a paragraph
        const sentenceCount = faker.number.int({ min: 3, max: 5 });

        for (let i = 0; i < sentenceCount; i++) {
            sentences.push(generateRealisticContent.sentence(context));
        }

        return sentences.join(" ");
    },

    // Generate list of words related to business context
    words: (count: number, context: string): string => {
        const wordsByContext: Record<string, string[]> = {
            technology: [
                "cloud",
                "API",
                "integration",
                "scalability",
                "automation",
                "security",
                "deployment",
                "framework",
                "architecture",
                "infrastructure",
                "platform",
                "interface",
                "database",
                "algorithm",
                "analytics",
                "optimization",
                "encryption",
                "protocol",
                "backend",
                "frontend",
                "workflow",
                "repository",
                "compatibility",
                "authentication",
                "migration",
            ],
            business: [
                "strategy",
                "growth",
                "ROI",
                "metrics",
                "conversion",
                "acquisition",
                "retention",
                "revenue",
                "investment",
                "scaling",
                "operations",
                "marketing",
                "branding",
                "partnership",
                "expansion",
                "compliance",
                "procurement",
                "diversification",
                "sustainability",
                "benchmark",
                "stakeholder",
                "valuation",
                "portfolio",
                "leadership",
                "innovation",
            ],
            project: [
                "milestone",
                "deadline",
                "deliverable",
                "scope",
                "requirement",
                "timeline",
                "resource",
                "constraint",
                "objective",
                "outcome",
                "assessment",
                "iteration",
                "planning",
                "coordination",
                "implementation",
                "testing",
                "validation",
                "documentation",
                "maintenance",
                "collaboration",
                "verification",
                "approval",
                "specification",
                "monitoring",
                "evaluation",
            ],
        };

        const fallbackWords = [
            "product",
            "service",
            "quality",
            "solution",
            "customer",
            "support",
            "experience",
            "development",
            "improvement",
            "update",
            "feature",
            "benefit",
            "efficiency",
            "performance",
            "reliability",
            "innovation",
            "value",
            "opportunity",
            "relationship",
            "communication",
        ];

        const wordPool = wordsByContext[context] || fallbackWords;
        const result = [];

        for (let i = 0; i < count; i++) {
            result.push(faker.helpers.arrayElement(wordPool));
        }

        return result.join(" ");
    },

    // Generate product names
    productName: (): string => {
        const prefixes = [
            "Ultra",
            "Pro",
            "Elite",
            "Smart",
            "Power",
            "Flex",
            "Digital",
            "Hyper",
            "Eco",
            "Turbo",
            "Next",
            "Rapid",
            "Swift",
            "Core",
            "Prime",
        ];
        const objects = [
            "Book",
            "Pad",
            "Hub",
            "Drive",
            "Connect",
            "Suite",
            "Cloud",
            "Box",
            "Link",
            "Pulse",
            "Guard",
            "Flow",
            "Boost",
            "View",
            "Sync",
        ];

        return `${faker.helpers.arrayElement(prefixes)}${faker.helpers.arrayElement(objects)}`;
    },

    // Generate company department names
    department: (): string => {
        return faker.helpers.arrayElement([
            "Sales",
            "Marketing",
            "Engineering",
            "Product",
            "Customer Success",
            "Human Resources",
            "Finance",
            "Operations",
            "Research & Development",
            "IT",
            "Legal",
            "Business Development",
            "Design",
            "Quality Assurance",
            "Analytics",
            "Support",
            "Training",
            "Communications",
        ]);
    },

    // Generate business verbs
    businessVerb: (): string => {
        return faker.helpers.arrayElement([
            "optimize",
            "implement",
            "develop",
            "streamline",
            "launch",
            "analyze",
            "coordinate",
            "facilitate",
            "integrate",
            "leverage",
            "manage",
            "enhance",
            "deploy",
            "accelerate",
            "transform",
            "evaluate",
            "strategize",
            "innovate",
            "consolidate",
            "execute",
        ]);
    },

    // Generate business nouns
    businessNoun: (): string => {
        return faker.helpers.arrayElement([
            "strategy",
            "solution",
            "platform",
            "framework",
            "system",
            "process",
            "application",
            "initiative",
            "interface",
            "architecture",
            "methodology",
            "infrastructure",
            "pipeline",
            "dashboard",
            "protocol",
            "algorithm",
            "ecosystem",
            "repository",
            "model",
            "network",
        ]);
    },

    // Generate business phrases
    businessPhrase: (): string => {
        const adjectives = [
            "scalable",
            "robust",
            "innovative",
            "cutting-edge",
            "efficient",
            "strategic",
            "comprehensive",
            "integrated",
            "optimized",
            "streamlined",
            "agile",
            "responsive",
            "intuitive",
            "seamless",
            "dynamic",
        ];

        return `${faker.helpers.arrayElement(adjectives)} ${generateRealisticContent.businessNoun()}`;
    },

    // Generate a catchphrase
    catchphrase: (): string => {
        const phrases = [
            "Transforming ideas into solutions",
            "Innovation meets excellence",
            "Building tomorrow's technology today",
            "Your success is our mission",
            "Pushing the boundaries of what's possible",
            "Simplifying complexity",
            "Excellence through innovation",
            "Where vision meets execution",
            "Driving digital transformation",
            "Engineered for performance",
            "Connecting people and technology",
            "Solutions that scale with your business",
            "Turning challenges into opportunities",
            "The smart choice for intelligent growth",
            "Powering the future of business",
        ];

        return faker.helpers.arrayElement(phrases);
    },

    // Add family/personal context sentences
    familySentence: (): string => {
        return faker.helpers.arrayElement([
            "Hope you're doing well!",
            "Miss you lots.",
            "Can't wait to see you soon!",
            "Been thinking about you lately.",
            "How are things going with you?",
            "We should catch up soon!",
            "It's been too long since we talked.",
            "Love you lots!",
            "Sending hugs your way.",
            "Hope you're staying healthy and happy.",
            "Let's plan that visit we've been talking about.",
            "The kids have been asking about you.",
            "Remember that time we went to the lake? Good memories!",
            "Still looking forward to your famous cookies next time we visit!",
            "We need to plan our next family get-together.",
        ]);
    },

    // Add friend context sentences
    friendSentence: (): string => {
        return faker.helpers.arrayElement([
            "We need to grab drinks soon!",
            "How's life treating you?",
            "So, what's new with you?",
            "I saw that movie you recommended - you were right, it was great!",
            "When are we doing our next game night?",
            "Remember that restaurant we talked about trying?",
            "Did you see the latest episode yet? No spoilers, but wow!",
            "We should plan that weekend trip we've been talking about.",
            "How's that new job going?",
            "I found this awesome new coffee place you'd love.",
            "Let's catch up properly soon, it's been ages!",
            "Are you going to the concert next month?",
            "Did you ever figure out that issue with your car?",
            "I have some exciting news to share with you!",
            "How was your vacation? Saw the pictures - looks amazing!",
        ]);
    },

    familyEmailSubject: (): string => {
        return faker.helpers.arrayElement([
            "Family dinner next weekend?",
            "Holiday plans",
            "Photos from last weekend",
            "Quick family update",
            "Grandma's birthday planning",
            "Family reunion details",
            "Recipe you asked for",
            "Visit plans for next month",
            "Kids' school updates",
            "Mom's special announcement",
            "Our new house photos",
            "Dad's retirement party",
            "Thanksgiving arrangements",
            "Summer vacation ideas",
            "Family emergency fund",
        ]);
    },

    friendEmailSubject: (): string => {
        return faker.helpers.arrayElement([
            "Plans this weekend?",
            "Check out this link!",
            "That thing we talked about",
            "Tickets available for the show",
            "Dinner at that new place?",
            "Apartment hunting help",
            "Birthday party details",
            "Game night this Friday?",
            "Need your advice on something",
            "Trip planning update",
            "Vacation photos!",
            "Guess who I ran into yesterday",
            "You have to try this new restaurant",
            "Weekend getaway ideas",
            "Concert next month?",
        ]);
    },

    familyEmailBody: (name: string, sender: string): string => {
        const intros = [
            `Hey ${name},\n\n`,
            `Hi ${name},\n\n`,
            `Dear ${name},\n\n`,
            `${name},\n\n`,
            `Hello ${name}!\n\n`,
        ];

        const contents = [
            `${generateRealisticContent.familySentence()} ${generateRealisticContent.familySentence()}\n\nI wanted to let you know that we're planning a family get-together next month. We're thinking the weekend of the 15th would work well. Could you let me know if that works for your schedule?\n\n${generateRealisticContent.familySentence()}\n\n`,

            `${generateRealisticContent.familySentence()}\n\nJust wanted to share that ${faker.person.firstName()} got into ${faker.helpers.arrayElement(["college", "the school play", "the sports team", "the honors program"])}! We're all so proud. I've attached some recent photos too.\n\n${generateRealisticContent.familySentence()}\n\n`,

            `${generateRealisticContent.familySentence()}\n\nDid you see the family photos that ${faker.person.firstName()} posted? They turned out great! I was thinking we should get everyone together for another family portrait soon. Maybe during the holidays?\n\n${generateRealisticContent.familySentence()}\n\n`,

            `${generateRealisticContent.familySentence()}\n\nI found that recipe you were asking about! Here it is:\n\n${faker.helpers.arrayElement(["Grandma's", "Mom's", "Aunt Lisa's"])} Famous ${faker.helpers.arrayElement(["Chocolate Chip Cookies", "Apple Pie", "Lasagna", "Banana Bread", "Potato Salad"])}\n\nIngredients:\n- ${faker.helpers.arrayElement(["2 cups flour", "3 eggs", "1 cup sugar", "2 tbsp olive oil", "1 lb ground beef"])}\n- ${faker.helpers.arrayElement(["1 tsp vanilla", "2 cups milk", "3 cloves garlic", "1 onion, chopped", "Salt and pepper to taste"])}\n- ${faker.helpers.arrayElement(["1/2 cup butter", "2 cups chocolate chips", "1 can tomato sauce", "2 cups cheese", "3 apples, sliced"])}\n\nLet me know if you try it!\n\n`,

            `${generateRealisticContent.familySentence()}\n\nJust a reminder that ${faker.helpers.arrayElement(["Dad's birthday", "the family reunion", "Thanksgiving dinner", "the holiday party", "the baby shower"])} is coming up on ${faker.date.future().toLocaleDateString()}. We're planning to ${faker.helpers.arrayElement(["meet at the house around 4pm", "go to that restaurant we all like", "have a potluck dinner", "make it a surprise event", "keep it small this year"])}.\n\n${generateRealisticContent.familySentence()}\n\n`,
        ];

        const closings = [
            `Love,\n${sender}`,
            `Love you,\n${sender}`,
            `Hugs,\n${sender}`,
            `Talk to you soon,\n${sender}`,
            `Can't wait to see you,\n${sender}`,
            `Miss you,\n${sender}`,
        ];

        return (
            faker.helpers.arrayElement(intros) +
            faker.helpers.arrayElement(contents) +
            faker.helpers.arrayElement(closings)
        );
    },

    friendEmailBody: (name: string, sender: string): string => {
        const intros = [
            `Hey ${name},\n\n`,
            `Hi ${name},\n\n`,
            "Hey there,\n\n",
            `${name}!\n\n`,
            `What's up ${name}?\n\n`,
        ];

        const contents = [
            `${generateRealisticContent.friendSentence()} ${generateRealisticContent.friendSentence()}\n\nA bunch of us are planning to ${faker.helpers.arrayElement(["check out that new restaurant", "go to the concert", "have a game night", "see the new movie", "go hiking"])} this weekend. You in? We're thinking ${faker.helpers.arrayElement(["Friday night", "Saturday afternoon", "Sunday brunch", "Saturday evening"])}.\n\n${generateRealisticContent.friendSentence()}\n\n`,

            `${generateRealisticContent.friendSentence()}\n\nDude, you have to check out this ${faker.helpers.arrayElement(["show", "movie", "restaurant", "app", "game"])} I just discovered. It's called ${faker.company.name()}${faker.helpers.arrayElement([" Place", "", " Café", " Experience", " Studio"])} and it's absolutely ${faker.helpers.arrayElement(["amazing", "mind-blowing", "hilarious", "ridiculous", "epic"])}. Let me know if you want to check it out together!\n\n${generateRealisticContent.friendSentence()}\n\n`,

            `${generateRealisticContent.friendSentence()}\n\nI've been meaning to tell you about this ${faker.helpers.arrayElement(["job opportunity", "apartment", "car", "deal", "event"])} I heard about that might interest you. It's a ${faker.helpers.arrayElement(["great location", "perfect fit for your skills", "good price", "rare opportunity", "limited time offer"])}. Let me know if you want more details!\n\n${generateRealisticContent.friendSentence()}\n\n`,

            `${generateRealisticContent.friendSentence()}\n\nRemember how we were talking about ${faker.helpers.arrayElement(["taking that trip", "starting that project", "trying that new hobby", "checking out that place", "learning that skill"])}? I found some interesting info that might help us get started. I'm thinking we could ${faker.helpers.arrayElement(["meet up to discuss", "start planning", "set a date", "do some research together", "take the first step next week"])}.\n\n${generateRealisticContent.friendSentence()}\n\n`,

            `${generateRealisticContent.friendSentence()}\n\nOk, I have to vent for a second. You won't believe what happened at ${faker.helpers.arrayElement(["work", "the gym", "my apartment", "that party", "the store"])} yesterday. Basically, ${faker.helpers.arrayElement(["someone completely misunderstood", "there was this awkward situation", "I ran into that person we talked about", "everything went wrong", "it was the most embarrassing moment"])}. I'll tell you all about it when I see you!\n\n${generateRealisticContent.friendSentence()}\n\n`,
        ];

        const closings = [
            `Later,\n${sender}`,
            `Cheers,\n${sender}`,
            `See you soon,\n${sender}`,
            `Talk soon,\n${sender}`,
            `Catch you later,\n${sender}`,
            `Best,\n${sender}`,
        ];

        return (
            faker.helpers.arrayElement(intros) +
            faker.helpers.arrayElement(contents) +
            faker.helpers.arrayElement(closings)
        );
    },
};

// Define standard Gmail label types
interface EmailLabels {
    IMPORTANT: boolean;
    CATEGORY_PERSONAL?: boolean;
    CATEGORY_SOCIAL?: boolean;
    CATEGORY_PROMOTIONS?: boolean;
    CATEGORY_UPDATES?: boolean;
    CATEGORY_FORUMS?: boolean;
    INBOX: boolean;
    SENT?: boolean;
    UNREAD?: boolean;
    STARRED?: boolean;
    TRASH?: boolean;
    SPAM?: boolean;
}

// Function to convert category to Gmail-style labels
const getCategoryLabels = (category: string, isRead: boolean, isStarred: boolean): string[] => {
    // Create base labels array
    const labels: string[] = ["INBOX"];

    // Add IMPORTANT label with 70% probability for most emails
    if (Math.random() > 0.3) {
        labels.push("IMPORTANT");
    }

    // Add appropriate category label based on email category
    switch (category) {
        case "Personal":
            labels.push("CATEGORY_PERSONAL");
            break;
        case "Social":
            labels.push("CATEGORY_SOCIAL");
            break;
        case "Marketing":
        case "Promotions":
            labels.push("CATEGORY_PROMOTIONS");
            break;
        case "Updates":
        case "Newsletters":
        case "Alerts":
            labels.push("CATEGORY_UPDATES");
            break;
        case "Forums":
            labels.push("CATEGORY_FORUMS");
            break;
        default:
            // For work and other categories, use PERSONAL by default
            labels.push("CATEGORY_PERSONAL");
    }

    // Add UNREAD label if email is not read
    if (!isRead) {
        labels.push("UNREAD");
    }

    // Add STARRED label if email is starred
    if (isStarred) {
        labels.push("STARRED");
    }

    return labels;
};

// Function to encrypt email content
const encryptEmailContent = (email: any) => {
    // Encrypt subject
    const {
        encryptedData: encryptedSubjectData,
        iv: subjectIv,
        authTag: subjectAuthTag,
    } = encryptText(email.subject);
    const encryptedSubject = encodeEncryptedData(encryptedSubjectData, subjectIv, subjectAuthTag);

    // Encrypt body
    const {
        encryptedData: encryptedBodyData,
        iv: bodyIv,
        authTag: bodyAuthTag,
    } = encryptText(email.body);
    const encryptedBody = encodeEncryptedData(encryptedBodyData, bodyIv, bodyAuthTag);

    // Encrypt snippet
    const {
        encryptedData: encryptedSnippetData,
        iv: snippetIv,
        authTag: snippetAuthTag,
    } = encryptText(email.snippet);
    const encryptedSnippet = encodeEncryptedData(encryptedSnippetData, snippetIv, snippetAuthTag);

    return {
        ...email,
        subject: encryptedSubject,
        body: encryptedBody,
        snippet: encryptedSnippet,
    };
};

const generateCompanyEmail = (category: string, userName = "User") => {
    const company = getRandomCompany();

    // Use category appropriate for this company if available
    const appropriateCategories = categorizedEmailTemplates[company.category] || [category];
    const effectiveCategory = faker.helpers.arrayElement(appropriateCategories);

    // Get appropriate email prefix for this company type
    const emailStart = getRandomEmailStart(company);
    const from = `${emailStart}@${company.domain}`;
    const to = "user@example.com"; // The email of the user who will receive all these emails

    const params: Record<string, string> = {
        name: userName, // Use the actual user's name
        sender: faker.person.fullName(),
        company: company.name,
        date: faker.date.future().toLocaleDateString(),
        time: `${faker.number.int({ min: 1, max: 12 })}:${faker.number.int({ min: 0, max: 59 }).toString().padStart(2, "0")} ${faker.helpers.arrayElement(["AM", "PM"])}`,
        project: generateRealisticContent.businessNoun(),
        feature: generateRealisticContent.businessPhrase(),
        task: generateRealisticContent.businessVerb(),
        document: `${faker.company.buzzAdjective()} Report`,
        department: generateRealisticContent.department(),
        announcement: generateRealisticContent.paragraph("announcement"),
        topic: generateRealisticContent.businessPhrase(),
        location: faker.location.city(),
        product: generateRealisticContent.productName(),
        discount: faker.number.int({ min: 5, max: 50 }).toString(),
        code: faker.string.alphanumeric(8).toUpperCase(),
        link: `https://${company.domain}/${faker.word.sample()}`,
        event: `${company.name} ${generateRealisticContent.businessNoun()} Summit`,
        highlight: generateRealisticContent.catchphrase(),
        month: faker.date.month(),
        accountNumber: faker.finance.accountNumber(),
        accountLast4: faker.finance.accountNumber(4),
        transactionId: faker.string.alphanumeric(10).toUpperCase(),
        openingBalance: faker.finance.amount({ min: 100, max: 5000 }),
        closingBalance: faker.finance.amount({ min: 100, max: 5000 }),
        paymentDue: faker.finance.amount({ min: 10, max: 500 }),
        dueDate: faker.date.future().toLocaleDateString(),
        amount: faker.finance.amount({ min: 10, max: 1000 }),
        merchant: faker.company.name(),
        phone: faker.phone.number(),
        publication: `${company.name} ${faker.helpers.arrayElement(["Insider", "Journal", "Digest", "Weekly", "Update"])}`,
        industry: generateRealisticContent.businessNoun(),
        headline1: generateRealisticContent.catchphrase(),
        summary1: generateRealisticContent.paragraph("summary"),
        headline2: generateRealisticContent.catchphrase(),
        summary2: generateRealisticContent.paragraph("summary"),
        headline3: generateRealisticContent.catchphrase(),
        summary3: generateRealisticContent.paragraph("summary"),
        source1: faker.company.name(),
        source2: faker.company.name(),
        source3: faker.company.name(),
        platform: faker.company.name(),
        reactions: faker.number.int({ min: 1, max: 100 }).toString(),
        count: faker.number.int({ min: 1, max: 10 }).toString(),
        comment: generateRealisticContent.sentence("comment"),
        message: generateRealisticContent.paragraph("message"),
        destination: faker.location.city(),
        origin: faker.location.city(),
        transportType: faker.helpers.arrayElement(["Flight", "Train", "Bus"]),
        transportNumber: `${faker.string.alpha(2).toUpperCase()}${faker.number.int({ min: 100, max: 9999 })}`,
        returnTransportNumber: `${faker.string.alpha(2).toUpperCase()}${faker.number.int({ min: 100, max: 9999 })}`,
        bookingId: faker.string.alphanumeric(6).toUpperCase(),
        departureDate: faker.date.future().toLocaleDateString(),
        departureTime: `${faker.number.int({ min: 1, max: 12 })}:${faker.number.int({ min: 0, max: 59 }).toString().padStart(2, "0")} ${faker.helpers.arrayElement(["AM", "PM"])}`,
        returnDate: faker.date.future().toLocaleDateString(),
        returnTime: `${faker.number.int({ min: 1, max: 12 })}:${faker.number.int({ min: 0, max: 59 }).toString().padStart(2, "0")} ${faker.helpers.arrayElement(["AM", "PM"])}`,
        hotel: `${faker.company.name()} Hotel`,
        checkInDate: faker.date.future().toLocaleDateString(),
        checkOutDate: faker.date.future().toLocaleDateString(),
        reservationId: faker.string.alphanumeric(8).toUpperCase(),
        roomType: faker.helpers.arrayElement(["Standard", "Deluxe", "Suite"]),
        guestCount: faker.number.int({ min: 1, max: 4 }).toString(),
        checkInTime: "3:00 PM",
        checkOutTime: "11:00 AM",
        project1: generateRealisticContent.businessPhrase(),
        status1: faker.helpers.arrayElement(["On track", "Delayed", "Completed"]),
        project2: generateRealisticContent.businessPhrase(),
        status2: faker.helpers.arrayElement(["On track", "Delayed", "Completed"]),
        project3: generateRealisticContent.businessPhrase(),
        status3: faker.helpers.arrayElement(["On track", "Delayed", "Completed"]),
        feature1: generateRealisticContent.businessPhrase(),
        feature2: generateRealisticContent.businessPhrase(),
        feature3: generateRealisticContent.businessPhrase(),
        service: faker.helpers.arrayElement([
            "Premium Plan",
            "Basic Subscription",
            "Pro Account",
            "Enterprise Service",
            "VIP Membership",
        ]),
        membership: faker.helpers.arrayElement(["Gold", "Premium", "Elite", "VIP", "Platinum"]),
    };

    const subject = generateEmailSubject(effectiveCategory, params);
    const body = generateEmailBody(effectiveCategory, params);
    const snippet = body.substring(0, 100) + (body.length > 100 ? "..." : "");

    const isRead = Math.random() > 0.7;
    const isStarred = Math.random() > 0.9;

    return {
        from: `${company.name} <${from}>`,
        to,
        subject,
        body,
        snippet,
        isRead,
        isStarred,
        labels: getCategoryLabels(effectiveCategory, isRead, isStarred),
        category: effectiveCategory,
    };
};

const generatePersonalEmail = (category: string, userName = "User") => {
    let availableEmails = personalEmails;
    const relationship = Math.random() > 0.5 ? "colleague" : "friend";
    availableEmails = personalEmails.filter((p) => p.relationship === relationship);

    const person = faker.helpers.arrayElement(availableEmails);
    const to = "user@example.com";

    const params: Record<string, string> = {
        name: userName,
        sender: person.name,
        date: faker.date.recent().toLocaleDateString(),
        time: `${faker.number.int({ min: 1, max: 12 })}:${faker.number.int({ min: 0, max: 59 }).toString().padStart(2, "0")} ${faker.helpers.arrayElement(["AM", "PM"])}`,
        topic: generateRealisticContent.words(3, "business"),
        location: faker.helpers.arrayElement(["Zoom", "Google Meet", faker.location.city()]),
        event: faker.word.sample(),
    };

    const effectiveCategory =
        person.relationship === "colleague"
            ? faker.helpers.arrayElement(["Work", "Social", "Personal"])
            : faker.helpers.arrayElement(["Social", "Personal"]);

    const subject =
        person.relationship === "colleague"
            ? faker.helpers.arrayElement([
                  "Let's catch up",
                  "Meeting follow-up",
                  `About our ${generateRealisticContent.words(1, "project")} discussion`,
                  `Question about ${generateRealisticContent.words(3, "business")}`,
                  `Thoughts on ${generateRealisticContent.words(2, "technology")}?`,
              ])
            : generateRealisticContent.friendEmailSubject();

    let body: string;
    if (person.relationship === "colleague") {
        body = faker.helpers.arrayElement([
            `Hey ${userName},\n\nHow have you been? ${generateRealisticContent.paragraph("message")}\n\nLet me know if you're free to catch up sometime this week.\n\nCheers,\n${person.name}`,
            `Hi ${userName},\n\n${generateRealisticContent.paragraph("message")}\n\nThought you might find this interesting. Let me know what you think.\n\nBest,\n${person.name}`,
            `Hello ${userName},\n\nJust wanted to follow up on our conversation about ${generateRealisticContent.words(3, "project")}. ${generateRealisticContent.paragraph("feedback")}\n\nTalk to you soon,\n${person.name}`,
        ]);
    } else {
        body = generateRealisticContent.friendEmailBody(userName, person.name);
    }

    const snippet = body.substring(0, 100) + (body.length > 100 ? "..." : "");

    const isRead = Math.random() > 0.5;
    const isStarred = Math.random() > 0.8;

    return {
        from: `${person.name} <${person.email}>`,
        to,
        subject,
        body,
        snippet,
        isRead,
        isStarred,
        labels: getCategoryLabels(effectiveCategory, isRead, isStarred),
        category: effectiveCategory,
    };
};

const generateNewsletterEmail = (category: string, userName = "User") => {
    const company = getRandomCompany();
    const from = `newsletter@${company.domain}`;
    const to = "user@example.com";

    const newsletterName = `${company.name} ${faker.helpers.arrayElement(["Newsletter", "Digest", "Updates", "Insider", "Weekly"])}`;

    const params: Record<string, string> = {
        name: userName,
        sender: newsletterName,
        company: company.name,
        publication: newsletterName,
        month: faker.date.month(),
        topic: faker.helpers.arrayElement(["Technology", "Business", "Arts", "Science", "Health"]),
        headline1: generateRealisticContent.catchphrase(),
        summary1: generateRealisticContent.paragraph("summary"),
        headline2: generateRealisticContent.catchphrase(),
        summary2: generateRealisticContent.paragraph("summary"),
        headline3: generateRealisticContent.catchphrase(),
        summary3: generateRealisticContent.paragraph("summary"),
        source1: faker.company.name(),
        source2: faker.company.name(),
        source3: faker.company.name(),
    };

    const subject = generateEmailSubject("Newsletters", params);
    const body = generateEmailBody("Newsletters", params);
    const snippet = body.substring(0, 100) + (body.length > 100 ? "..." : "");

    const isRead = Math.random() > 0.3;
    const isStarred = Math.random() > 0.95;

    return {
        from: `${newsletterName} <${from}>`,
        to,
        subject,
        body,
        snippet,
        isRead,
        isStarred,
        labels: getCategoryLabels("Newsletters", isRead, isStarred),
        category: "Newsletters",
    };
};

// Add a new function to generate family emails
const generateFamilyEmail = (userName = "User") => {
    const familyMembers = personalEmails.filter((p) => p.relationship === "family");
    const person = faker.helpers.arrayElement(familyMembers);
    const to = "user@example.com";

    const subject = generateRealisticContent.familyEmailSubject();
    const body = generateRealisticContent.familyEmailBody(userName, person.name);
    const snippet = body.substring(0, 100) + (body.length > 100 ? "..." : "");

    const isRead = Math.random() > 0.3;
    const isStarred = Math.random() > 0.7;

    return {
        from: `${person.name} <${person.email}>`,
        to,
        subject,
        body,
        snippet,
        isRead,
        isStarred,
        labels: getCategoryLabels("Personal", isRead, isStarred),
        category: "Personal",
    };
};

// Main function to generate emails
const generateEmails = async (
    count: number,
    userId: string,
): Promise<{ emails: EmailWithMetadata[]; threadsMap: Record<string, string[]> }> => {
    const emails: EmailWithMetadata[] = [];
    const threadsMap: Record<string, string[]> = {};
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    // Fetch the user's information from the database
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            name: true,
            email: true,
        },
    });

    if (!user) {
        throw new Error(`User with ID ${userId} not found`);
    }

    const userName = user.name || "User";
    const userEmail = user.email;
    console.log(`Generating emails for ${userName} (${userEmail})`);

    for (let i = 0; i < count; i++) {
        const category = getRandomCategory();
        const threadId = generateThreadId();
        const messageId = generateEmailId();
        threadsMap[threadId] = threadsMap[threadId] || [];
        threadsMap[threadId].push(messageId);

        const emailType = getRandomEmailType();
        let emailData: EmailData;

        if (emailType === "company") {
            emailData = generateCompanyEmail(category, userName);
        } else if (emailType === "personal") {
            emailData = generatePersonalEmail(category, userName);
        } else if (emailType === "family") {
            emailData = generateFamilyEmail(userName);
        } else {
            emailData = generateNewsletterEmail(category, userName);
        }

        // Replace placeholder recipient email with actual user email
        emailData.to = userEmail;

        // Store internalDate as milliseconds since epoch (as a string)
        const dateInRange = getRandomDateInRange(oneYearAgo, now);
        const internalDate = dateInRange.getTime().toString();

        const email = {
            id: messageId,
            threadId,
            userId,
            ...emailData,
            internalDate,
            fetchedAt: now.toISOString(),
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
        };

        // Encrypt the email content before storage
        const encryptedEmail = encryptEmailContent(email);

        emails.push({ email: encryptedEmail });
    }

    return { emails, threadsMap };
};

// Function to seed the database
export async function seedEmails(userId: string, count = 100) {
    try {
        console.log(`Generating ${count} emails for user ${userId}...`);
        const { emails, threadsMap } = await generateEmails(count, userId);

        // First, create all the messages
        console.log(`Creating ${emails.length} messages...`);
        for (const { email } of emails) {
            await prisma.message.create({
                data: {
                    id: email.id,
                    threadId: email.threadId,
                    userId: email.userId,
                },
            });
        }

        // Then create all emails
        console.log(`Creating ${emails.length} emails...`);
        for (const { email } of emails) {
            await prisma.email.create({
                data: {
                    id: email.id,
                    threadId: email.threadId,
                    userId: email.userId,
                    subject: email.subject,
                    from: email.from,
                    to: email.to,
                    snippet: email.snippet,
                    body: email.body,
                    isRead: email.isRead,
                    isStarred: email.isStarred,
                    labels: email.labels,
                    internalDate: email.internalDate,
                },
            });
        }

        console.log(`Successfully seeded ${count} emails for user ${userId}`);
        return { count, threadsMap };
    } catch (error) {
        console.error("Error seeding emails:", error);
        throw error;
    }
}

// Example usage
// Run with:
// bun run tests/seed.ts USER_ID COUNT
if (require.main === module) {
    const userId = process.argv[2] || "default-user-id";
    const count = Number.parseInt(process.argv[3] || "100", 10);

    //   console.log(userId, count)
    //   const emails = generateEmails(count, userId)
    //   console.log(emails.emails)

    seedEmails(userId, count)
        .then((result) => {
            console.log(`Seeded ${result.count} emails successfully`);
            console.log(`Created ${Object.keys(result.threadsMap).length} threads`);
        })
        .catch(console.error)
        .finally(() => prisma.$disconnect());
}
