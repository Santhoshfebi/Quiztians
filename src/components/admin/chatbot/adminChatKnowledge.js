// ===========================================================
// QUIZTIANS ADMIN CHATBOT
// SMART KNOWLEDGE BASE — STEP 3
// ===========================================================
//
// V1 goals:
// - No AI API
// - No Supabase queries
// - Predictable prepared answers
// - Natural-language keyword matching
// - Role-aware answers
// - Navigation actions
// - Helpful fallback suggestions
//
// ===========================================================


// ===========================================================
// GENERAL / CONVERSATIONAL RESPONSES
// ===========================================================

const conversationalKnowledge = [
  {
    id: "greeting",

    patterns: [
      "hi",
      "hello",
      "hey",
      "hai",
      "good morning",
      "good afternoon",
      "good evening",
      "hello assistant",
      "hey assistant",
      "hi assistant",
    ],

    answer:
      "Hey! 👋 I'm the QUIZTIANS Admin Assistant. I can help you with questions, quiz configuration, results, activity logs and other admin features.",

    suggestions: [
      "How do I add questions?",
      "How do I start a quiz?",
      "Where can I view results?",
    ],
  },

  {
    id: "thanks",

    patterns: [
      "thanks",
      "thank you",
      "thankyou",
      "thanks buddy",
      "thank you buddy",
      "great thanks",
      "okay thanks",
      "ok thanks",
    ],

    answer:
      "You're welcome! 😄 If you need help with anything else in the QUIZTIANS admin panel, just ask.",

    suggestions: [
      "What can you help me with?",
      "How do I configure the quiz?",
    ],
  },

  {
    id: "help",

    patterns: [
      "help",
      "help me",
      "what can you do",
      "what can you help me with",
      "what do you know",
      "show help",
      "admin help",
      "quiztians help",
    ],

    answer:
      "I can help you navigate the QUIZTIANS admin panel and explain common tasks such as adding questions, previewing the quiz, configuring chapters and duration, viewing results, checking activity logs and managing administrator features.",

    suggestions: [
      "How do I add questions?",
      "How do I configure the quiz?",
      "Where can I view results?",
      "What are Activity Logs?",
    ],
  },
];


// ===========================================================
// MAIN ADMIN KNOWLEDGE
// ===========================================================

export const adminChatKnowledge = [
  // =========================================================
  // DASHBOARD
  // =========================================================

  {
    id: "dashboard",

    category: "Dashboard",

    keywords: [
      "dashboard",
      "admin dashboard",
      "home",
      "admin home",
      "main page",
      "overview",
      "admin overview",
      "go dashboard",
      "open dashboard",
    ],

    answer:
      "The Dashboard is the main overview of your QUIZTIANS admin area. Use it as the starting point for monitoring the quiz and accessing the main administration sections.",

    action: {
      label: "Open Dashboard",
      route: "/admin",
    },

    suggestions: [
      "Where can I view results?",
      "How do I configure the quiz?",
    ],
  },


  // =========================================================
  // ADD QUESTIONS
  // =========================================================

  {
    id: "add-question",

    category: "Questions",

    keywords: [
      "add question",
      "add questions",
      "create question",
      "create questions",
      "new question",
      "new questions",
      "insert question",
      "make question",
      "make questions",
      "question create",
      "question add",
      "add quiz question",
      "create quiz question",
      "how to add question",
      "how do i add question",
      "how can i add question",
      "where add question",
    ],

    answer:
      "To create a quiz question, open Add Questions from the admin navigation. That is the section used for adding new questions to QUIZTIANS.",

    action: {
      label: "Open Add Questions",
      route: "/admin/add-questions",
    },

    suggestions: [
      "How do I preview questions?",
      "How do I preview the quiz?",
      "How do I configure the quiz?",
    ],
  },


  // =========================================================
  // PREVIEW QUESTIONS
  // =========================================================

  {
    id: "preview-questions",

    category: "Questions",

    keywords: [
      "preview question",
      "preview questions",
      "view question",
      "view questions",
      "see question",
      "see questions",
      "show questions",
      "question list",
      "questions list",
      "check questions",
      "review questions",
      "existing questions",
      "all questions",
      "where are questions",
      "where can i see questions",
    ],

    answer:
      "Open Preview Questions to review the quiz questions available in the admin system before running the quiz.",

    action: {
      label: "Preview Questions",
      route: "/admin/preview-questions",
    },

    suggestions: [
      "How do I add questions?",
      "How do I preview the quiz?",
    ],
  },


  // =========================================================
  // PREVIEW QUIZ
  // =========================================================

  {
    id: "preview-quiz",

    category: "Quiz",

    keywords: [
      "preview quiz",
      "quiz preview",
      "test quiz",
      "check quiz",
      "view quiz",
      "see quiz",
      "show quiz",
      "try quiz",
      "test the quiz",
      "preview the quiz",
      "how quiz looks",
      "how does quiz look",
      "check quiz before start",
    ],

    answer:
      "Use Preview Quiz to review how the quiz experience looks before participants take it.",

    action: {
      label: "Preview Quiz",
      route: "/admin/preview-quiz",
    },

    suggestions: [
      "How do I configure the quiz?",
      "How do I add questions?",
    ],
  },


  // =========================================================
  // QUIZ CONFIGURATION — GENERAL
  // =========================================================

  {
    id: "quiz-configuration",

    category: "Quiz Configuration",

    keywords: [
      "quiz config",
      "quiz configuration",
      "configure quiz",
      "quiz settings",
      "quiz setting",
      "settings quiz",
      "setup quiz",
      "set up quiz",
      "change quiz settings",
      "manage quiz",
      "quiz setup",
      "configure the quiz",
      "where is quiz configuration",
    ],

    answer:
      "Quiz Configuration is where you manage the active quiz setup, including the quiz timing, duration and active chapters.",

    action: {
      label: "Open Quiz Configuration",
      route: "/admin/quiz-config",
    },

    suggestions: [
      "How do I change quiz duration?",
      "How do I select chapters?",
      "How do I start the quiz?",
    ],
  },


  // =========================================================
  // QUIZ START / ACTIVATION
  // =========================================================

  {
    id: "start-quiz",

    category: "Quiz Configuration",

    keywords: [
      "start quiz",
      "start the quiz",
      "activate quiz",
      "activate the quiz",
      "make quiz live",
      "quiz live",
      "go live",
      "open quiz",
      "enable quiz",
      "launch quiz",
      "begin quiz",
      "schedule quiz",
      "quiz start time",
      "start time",
      "how do i start quiz",
      "how can i start quiz",
      "how to start quiz",
    ],

    answer:
      "Open Quiz Configuration to manage when the quiz becomes available. Review the configured start time and other quiz settings before making the quiz available to participants.",

    action: {
      label: "Open Quiz Configuration",
      route: "/admin/quiz-config",
    },

    suggestions: [
      "How do I change quiz duration?",
      "How do I select chapters?",
      "How do I preview the quiz?",
    ],
  },


  // =========================================================
  // QUIZ DURATION
  // =========================================================

  {
    id: "quiz-duration",

    category: "Quiz Configuration",

    keywords: [
      "duration",
      "quiz duration",
      "change duration",
      "change quiz duration",
      "quiz time",
      "change quiz time",
      "time limit",
      "quiz time limit",
      "timer",
      "change timer",
      "set duration",
      "set quiz duration",
      "minutes",
      "quiz minutes",
      "how long quiz",
      "how long is quiz",
    ],

    answer:
      "Quiz duration is managed from Quiz Configuration. Open that page to review or update the configured quiz duration.",

    action: {
      label: "Open Quiz Configuration",
      route: "/admin/quiz-config",
    },

    suggestions: [
      "How do I start the quiz?",
      "How do I select chapters?",
    ],
  },


  // =========================================================
  // ACTIVE CHAPTERS
  // =========================================================

  {
    id: "active-chapters",

    category: "Quiz Configuration",

    keywords: [
      "chapter",
      "chapters",
      "active chapter",
      "active chapters",
      "select chapter",
      "select chapters",
      "change chapter",
      "change chapters",
      "quiz chapter",
      "quiz chapters",
      "choose chapter",
      "choose chapters",
      "enable chapter",
      "chapter selection",
    ],

    answer:
      "Active chapters are managed from Quiz Configuration. Use that page to control which chapters are available for the quiz.",

    action: {
      label: "Open Quiz Configuration",
      route: "/admin/quiz-config",
    },

    suggestions: [
      "How do I change quiz duration?",
      "How do I start the quiz?",
      "How do I add questions?",
    ],
  },


  // =========================================================
  // RESULTS — GENERAL
  // =========================================================

  {
    id: "results",

    category: "Results",

    keywords: [
      "result",
      "results",
      "view result",
      "view results",
      "quiz result",
      "quiz results",
      "participant result",
      "participant results",
      "participant score",
      "participant scores",
      "scores",
      "score list",
      "see results",
      "show results",
      "where results",
      "where are results",
      "where can i view results",
      "where can i see results",
    ],

    answer:
      "Open Results to review participant quiz attempts, scores and other recorded result information.",

    action: {
      label: "Open Results",
      route: "/admin/view-results",
    },

    suggestions: [
      "How do I reset a participant?",
      "Can I reset all results?",
      "What are Activity Logs?",
    ],
  },


  // =========================================================
  // RESET PARTICIPANT
  // =========================================================

  {
    id: "reset-participant",

    category: "Results",

    keywords: [
      "reset participant",
      "reset a participant",
      "reset user",
      "reset attempt",
      "reset participant attempt",
      "delete participant result",
      "remove participant result",
      "allow participant retry",
      "allow retry",
      "retry quiz",
      "participant retry",
      "retake quiz",
      "participant retake",
    ],

    answer:
      "Participant reset controls are available from Results. Open the participant's result and use the available reset action carefully, because resetting an attempt changes that participant's recorded quiz state.",

    action: {
      label: "Open Results",
      route: "/admin/view-results",
    },

    suggestions: [
      "Where can I view results?",
      "Can I reset all results?",
    ],
  },


  // =========================================================
  // RESET ALL RESULTS
  // =========================================================

  {
    id: "reset-all-results",

    category: "Results",

    keywords: [
      "reset all",
      "reset all results",
      "clear results",
      "clear all results",
      "delete all results",
      "remove all results",
      "reset results",
      "clear participant results",
      "wipe results",
    ],

    answer:
      "The Results page contains the available result reset controls. A full reset affects multiple participant records, so always review the confirmation carefully before proceeding.",

    action: {
      label: "Open Results",
      route: "/admin/view-results",
    },

    suggestions: [
      "How do I reset a participant?",
      "Where can I view results?",
    ],
  },


  // =========================================================
  // RESULT FILTERING
  // =========================================================

  {
    id: "filter-results",

    category: "Results",

    keywords: [
      "filter results",
      "search results",
      "find participant",
      "search participant",
      "find result",
      "search result",
      "result filters",
      "results filter",
      "filter participant",
    ],

    answer:
      "Use the filtering and search controls on the Results page to narrow the displayed participant results.",

    action: {
      label: "Open Results",
      route: "/admin/view-results",
    },

    suggestions: [
      "How do I reset a participant?",
      "Where can I view results?",
    ],
  },


  // =========================================================
  // ACTIVITY LOGS
  // =========================================================

  {
    id: "activity-logs",

    category: "Activity",

    keywords: [
      "activity",
      "activity log",
      "activity logs",
      "admin activity",
      "admin activities",
      "action history",
      "admin history",
      "system activity",
      "what are activity logs",
      "what does activity log show",
      "what does activity logs show",
      "recent activity",
      "changes history",
    ],

    answer:
      "Activity Logs helps you review recorded administrative activity in QUIZTIANS. You can use it to inspect actions and understand what has happened in the admin system.",

    action: {
      label: "Open Activity Logs",
      route: "/admin/activity-logs",
    },

    suggestions: [
      "How do I search Activity Logs?",
      "Where can I view results?",
    ],
  },


  // =========================================================
  // SEARCH ACTIVITY LOGS
  // =========================================================

  {
    id: "search-activity-logs",

    category: "Activity",

    keywords: [
      "search activity",
      "search activity logs",
      "filter activity",
      "filter activity logs",
      "find activity",
      "activity filter",
      "activity search",
      "search logs",
      "filter logs",
    ],

    answer:
      "Open Activity Logs and use its search and filtering controls to narrow the recorded administrative activity.",

    action: {
      label: "Open Activity Logs",
      route: "/admin/activity-logs",
    },

    suggestions: [
      "What are Activity Logs?",
      "Where can I view results?",
    ],
  },


  // =========================================================
  // LOGIN LOGS — SUPER ADMIN ONLY
  // =========================================================

  {
    id: "login-logs",

    category: "Super Admin",

    roles: ["superadmin"],

    keywords: [
      "login log",
      "login logs",
      "login history",
      "admin login",
      "admin logins",
      "admin login history",
      "who logged in",
      "login activity",
      "administrator login",
      "administrator logins",
      "view logins",
      "check logins",
    ],

    answer:
      "Login Logs lets Super Administrators review administrator login activity and related login information.",

    action: {
      label: "Open Login Logs",
      route: "/admin/login-logs",
    },

    suggestions: [
      "How do I manage admins?",
      "What is a Super Admin?",
    ],
  },


  // =========================================================
  // ADMIN USERS — SUPER ADMIN ONLY
  // =========================================================

  {
    id: "admin-users",

    category: "Super Admin",

    roles: ["superadmin"],

    keywords: [
      "admin users",
      "administrator users",
      "manage admins",
      "manage administrators",
      "admins",
      "administrators",
      "admin management",
      "user management",
      "manage admin accounts",
    ],

    answer:
      "Admin Users is the Super Administrator area for managing QUIZTIANS administrator accounts.",

    action: {
      label: "Open Admin Users",
      route: "/admin/admin-users",
    },

    suggestions: [
      "How do I invite an admin?",
      "How do I disable an admin?",
      "How do I delete an admin?",
    ],
  },


  // =========================================================
  // INVITE ADMIN — SUPER ADMIN ONLY
  // =========================================================

  {
    id: "invite-admin",

    category: "Super Admin",

    roles: ["superadmin"],

    keywords: [
      "invite admin",
      "invite administrator",
      "add admin",
      "add administrator",
      "create admin",
      "create administrator",
      "new admin",
      "new administrator",
      "send admin invite",
      "admin invite",
      "invite another admin",
    ],

    answer:
      "Open Admin Users to invite another administrator. Use the invite form there to provide the required account information and administrator role.",

    action: {
      label: "Open Admin Users",
      route: "/admin/admin-users",
    },

    suggestions: [
      "How do I disable an admin?",
      "How do I delete an admin?",
      "What is the difference between Admin and Super Admin?",
    ],
  },


  // =========================================================
  // DISABLE ADMIN — SUPER ADMIN ONLY
  // =========================================================

  {
    id: "disable-admin",

    category: "Super Admin",

    roles: ["superadmin"],

    keywords: [
      "disable admin",
      "disable administrator",
      "deactivate admin",
      "deactivate administrator",
      "block admin",
      "disable admin account",
      "turn off admin",
      "suspend admin",
    ],

    answer:
      "Administrator account status is managed from Admin Users. Open that page to review an administrator and use the available account status controls.",

    action: {
      label: "Open Admin Users",
      route: "/admin/admin-users",
    },

    suggestions: [
      "How do I enable an admin?",
      "How do I delete an admin?",
      "How do I invite an admin?",
    ],
  },


  // =========================================================
  // ENABLE ADMIN — SUPER ADMIN ONLY
  // =========================================================

  {
    id: "enable-admin",

    category: "Super Admin",

    roles: ["superadmin"],

    keywords: [
      "enable admin",
      "enable administrator",
      "activate admin",
      "activate administrator",
      "reactivate admin",
      "enable admin account",
      "turn on admin",
    ],

    answer:
      "Open Admin Users to review administrator account status and use the available controls to activate an eligible administrator account.",

    action: {
      label: "Open Admin Users",
      route: "/admin/admin-users",
    },

    suggestions: [
      "How do I disable an admin?",
      "How do I invite an admin?",
    ],
  },


  // =========================================================
  // DELETE ADMIN — SUPER ADMIN ONLY
  // =========================================================

  {
    id: "delete-admin",

    category: "Super Admin",

    roles: ["superadmin"],

    keywords: [
      "delete admin",
      "delete administrator",
      "remove admin",
      "remove administrator",
      "delete admin account",
      "remove admin account",
    ],

    answer:
      "Administrator deletion is handled from Admin Users. Review the selected administrator carefully before confirming a delete action because account deletion is a sensitive administrative operation.",

    action: {
      label: "Open Admin Users",
      route: "/admin/admin-users",
    },

    suggestions: [
      "How do I disable an admin?",
      "How do I invite an admin?",
    ],
  },


  // =========================================================
  // ADMIN VS SUPER ADMIN
  // =========================================================

  {
    id: "roles",

    category: "Roles",

    keywords: [
      "admin role",
      "super admin",
      "superadmin",
      "administrator role",
      "roles",
      "role difference",
      "admin vs super admin",
      "admin vs superadmin",
      "difference between admin and super admin",
      "difference between administrator and super administrator",
      "what is admin",
      "what is super admin",
      "what can super admin do",
    ],

    answer:
      "QUIZTIANS has Admin and Super Administrator roles. Both can work with the main quiz administration areas, while Super Administrators also have access to privileged areas such as Login Logs and Admin Users.",

    suggestions: [
      "What are Login Logs?",
      "How do I manage admins?",
    ],
  },


  // =========================================================
  // LOGOUT
  // =========================================================

  {
    id: "logout",

    category: "Account",

    keywords: [
      "logout",
      "log out",
      "sign out",
      "signout",
      "exit admin",
      "leave admin",
      "how do i logout",
      "how to logout",
    ],

    answer:
      "Use the Sign Out control in the admin navigation to securely end your current admin session.",

    suggestions: [
      "What can you help me with?",
    ],
  },
];


// ===========================================================
// ROLE-RESTRICTED TOPIC DETECTION
// ===========================================================
//
// This allows a normal Admin to receive a useful explanation
// instead of a generic fallback when asking about a feature
// reserved for Super Administrators.
//
// This is UX only — NOT authorization.
// ===========================================================

const superAdminRestrictedTopics = [
  {
    keywords: [
      "login logs",
      "login log",
      "login history",
      "admin login history",
      "who logged in",
    ],

    answer:
      "Login Logs is a Super Administrator feature. Your current Admin role does not include access to that area.",
  },

  {
    keywords: [
      "admin users",
      "manage admins",
      "invite admin",
      "add admin",
      "create admin",
      "disable admin",
      "enable admin",
      "delete admin",
      "remove admin",
    ],

    answer:
      "Admin account management is reserved for Super Administrators. Your current Admin role does not include access to Admin Users.",
  },
];


// ===========================================================
// FALLBACK RESPONSE
// ===========================================================

export const fallbackResponse = {
  answer:
    "I couldn't find an exact answer for that yet. I can currently help with QUIZTIANS questions, quiz configuration, results, activity logs and administrator features.",

  suggestions: [
    "How do I add questions?",
    "How do I configure the quiz?",
    "Where can I view results?",
    "What are Activity Logs?",
  ],
};


// ===========================================================
// NORMALIZE TEXT
// ===========================================================

function normalizeText(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


// ===========================================================
// TOKENIZE
// ===========================================================

function tokenize(value = "") {
  return normalizeText(value)
    .split(" ")
    .filter(Boolean);
}


// ===========================================================
// STOP WORDS
// ===========================================================
//
// Common words should not heavily influence matching.
//
// Example:
//
// "How do I add a question?"
//
// Important words:
// add + question
//
// ===========================================================

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "can",
  "could",
  "do",
  "does",
  "for",
  "from",
  "how",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "please",
  "show",
  "tell",
  "the",
  "to",
  "what",
  "where",
  "which",
  "with",
  "you",
]);


// ===========================================================
// IMPORTANT TOKENS
// ===========================================================

function importantTokens(value = "") {
  return tokenize(value).filter(
    (token) => !STOP_WORDS.has(token)
  );
}


// ===========================================================
// CONVERSATIONAL MATCH
// ===========================================================

function findConversationalResponse(message) {
  const normalizedMessage = normalizeText(message);

  if (!normalizedMessage) {
    return null;
  }

  for (const item of conversationalKnowledge) {
    for (const pattern of item.patterns) {
      const normalizedPattern = normalizeText(pattern);

      if (normalizedMessage === normalizedPattern) {
        return {
          answer: item.answer,
          suggestions: item.suggestions || [],
          action: null,
        };
      }
    }
  }

  return null;
}


// ===========================================================
// RESTRICTED TOPIC MATCH
// ===========================================================

function findRestrictedResponse(message, role) {
  if (role === "superadmin") {
    return null;
  }

  const normalizedMessage = normalizeText(message);

  for (const topic of superAdminRestrictedTopics) {
    const matched = topic.keywords.some((keyword) =>
      normalizedMessage.includes(
        normalizeText(keyword)
      )
    );

    if (matched) {
      return {
        answer: topic.answer,

        suggestions: [
          "What can you help me with?",
          "How do I configure the quiz?",
          "Where can I view results?",
        ],

        action: null,
      };
    }
  }

  return null;
}


// ===========================================================
// SCORE KEYWORD
// ===========================================================
//
// Matching priority:
//
// 1. Exact phrase
// 2. Message contains keyword phrase
// 3. Keyword contains message
// 4. Important token overlap
//
// ===========================================================

function scoreKeyword(message, keyword) {
  const normalizedMessage = normalizeText(message);
  const normalizedKeyword = normalizeText(keyword);

  if (
    !normalizedMessage ||
    !normalizedKeyword
  ) {
    return 0;
  }

  // =========================================================
  // EXACT MATCH
  // =========================================================

  if (normalizedMessage === normalizedKeyword) {
    return 100;
  }

  // =========================================================
  // FULL KEYWORD PHRASE APPEARS IN MESSAGE
  // =========================================================

  if (
    normalizedMessage.includes(normalizedKeyword)
  ) {
    const wordCount =
      normalizedKeyword.split(" ").length;

    return 70 + Math.min(wordCount * 4, 20);
  }

  // =========================================================
  // MESSAGE APPEARS INSIDE KEYWORD
  // =========================================================

  if (
    normalizedMessage.length >= 4 &&
    normalizedKeyword.includes(normalizedMessage)
  ) {
    return 55;
  }

  // =========================================================
  // TOKEN OVERLAP
  // =========================================================

  const messageTokens =
    importantTokens(normalizedMessage);

  const keywordTokens =
    importantTokens(normalizedKeyword);

  if (
    !messageTokens.length ||
    !keywordTokens.length
  ) {
    return 0;
  }

  const keywordTokenSet = new Set(
    keywordTokens
  );

  let overlap = 0;

  for (const token of messageTokens) {
    if (keywordTokenSet.has(token)) {
      overlap += 1;
    }
  }

  if (overlap === 0) {
    return 0;
  }

  const coverage =
    overlap / keywordTokens.length;

  const messageCoverage =
    overlap / messageTokens.length;

  // Require reasonable relevance.
  if (
    coverage < 0.5 &&
    messageCoverage < 0.5
  ) {
    return 0;
  }

  return (
    overlap * 10 +
    coverage * 15 +
    messageCoverage * 10
  );
}


// ===========================================================
// SCORE KNOWLEDGE ITEM
// ===========================================================

function scoreKnowledgeItem(message, item) {
  let bestKeywordScore = 0;

  for (const keyword of item.keywords || []) {
    const score = scoreKeyword(
      message,
      keyword
    );

    if (score > bestKeywordScore) {
      bestKeywordScore = score;
    }
  }

  return bestKeywordScore;
}


// ===========================================================
// FIND BEST KNOWLEDGE MATCH
// ===========================================================

function findBestKnowledgeMatch(
  message,
  role
) {
  let bestMatch = null;
  let bestScore = 0;

  for (const item of adminChatKnowledge) {
    // =======================================================
    // ROLE FILTER
    // =======================================================

    if (
      item.roles &&
      !item.roles.includes(role)
    ) {
      continue;
    }

    const score = scoreKnowledgeItem(
      message,
      item
    );

    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  // =========================================================
  // MINIMUM CONFIDENCE
  // =========================================================

  if (!bestMatch || bestScore < 18) {
    return null;
  }

  return bestMatch;
}


// ===========================================================
// FIND ADMIN CHAT RESPONSE
// ===========================================================

export function findAdminChatResponse(
  message,
  role = "admin"
) {
  const normalizedMessage =
    normalizeText(message);

  // =========================================================
  // EMPTY MESSAGE
  // =========================================================

  if (!normalizedMessage) {
    return fallbackResponse;
  }

  // =========================================================
  // CONVERSATIONAL RESPONSES
  // =========================================================

  const conversationalResponse =
    findConversationalResponse(message);

  if (conversationalResponse) {
    return conversationalResponse;
  }

  // =========================================================
  // ROLE-RESTRICTED FEATURES
  // =========================================================

  const restrictedResponse =
    findRestrictedResponse(
      message,
      role
    );

  if (restrictedResponse) {
    return restrictedResponse;
  }

  // =========================================================
  // KNOWLEDGE MATCH
  // =========================================================

  const bestMatch =
    findBestKnowledgeMatch(
      message,
      role
    );

  if (!bestMatch) {
    return fallbackResponse;
  }

  // =========================================================
  // RESPONSE
  // =========================================================

  return {
    answer: bestMatch.answer,

    action:
      bestMatch.action || null,

    suggestions:
      bestMatch.suggestions || [],
  };
}


// ===========================================================
// OPTIONAL CATEGORY HELPERS
// ===========================================================

export function getAdminChatCategories(
  role = "admin"
) {
  const categories = new Set();

  adminChatKnowledge.forEach((item) => {
    if (
      item.roles &&
      !item.roles.includes(role)
    ) {
      return;
    }

    if (item.category) {
      categories.add(item.category);
    }
  });

  return Array.from(categories);
}


// ===========================================================
// GET KNOWLEDGE BY CATEGORY
// ===========================================================

export function getAdminKnowledgeByCategory(
  category,
  role = "admin"
) {
  return adminChatKnowledge.filter(
    (item) => {
      if (
        item.roles &&
        !item.roles.includes(role)
      ) {
        return false;
      }

      return (
        item.category === category
      );
    }
  );
}