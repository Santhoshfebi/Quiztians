// ===========================================================
// QUIZTIANS ADMIN CHATBOT
// SMART KNOWLEDGE BASE — V2
// ===========================================================
//
// V2 goals:
// - No AI API
// - No Supabase queries
// - Predictable prepared answers
// - Natural-language keyword matching
// - Role-aware answers
// - Navigation actions
// - Helpful fallback suggestions
// - Quiz Analytics knowledge
// - Announcements knowledge
// - Live Event Display knowledge
// - Updated Dashboard knowledge
//
// ===========================================================


// ===========================================================
// CONVERSATIONAL KNOWLEDGE
// ===========================================================

const conversationalKnowledge = [
  // =========================================================
  // GREETING
  // =========================================================

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
      "Hey! 👋 I'm the QUIZTIANS Admin Assistant. I can help you manage questions, quiz configuration, results, analytics, announcements, live events, activity logs and other admin features.",

    suggestions: [
      "How do I configure the quiz?",
      "Where can I view analytics?",
      "What is the Live Display?",
    ],
  },

  // =========================================================
  // THANKS
  // =========================================================

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
      "got it thanks",
    ],

    answer:
      "You're welcome! 😊 If you need anything else in the QUIZTIANS admin panel, just ask.",

    suggestions: [
      "How do I configure the quiz?",
      "Where can I view analytics?",
      "What is the Live Display?",
    ],
  },

  // =========================================================
  // HELP
  // =========================================================

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
      "I can help you navigate the QUIZTIANS admin panel and explain question management, quiz configuration, participant results, Quiz Analytics, announcements, the Live Event Display, Winner Mode, activity logs and administrator features.",

    suggestions: [
      "How do I configure the quiz?",
      "Where can I view analytics?",
      "What is the Live Display?",
      "What are Announcements?",
    ],
  },
];


// ===========================================================
// ADMIN KNOWLEDGE
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
      "dashboard overview",
      "quiz dashboard",
      "quiz overview",
      "go dashboard",
      "open dashboard",
      "what is dashboard",
      "what does dashboard show",
      "what can i see on dashboard",
    ],

    answer:
      "The QUIZTIANS Dashboard is the main administration overview. It brings together System Status, key quiz metrics, Quick Actions, Quiz Status, the latest announcement, chapter and score distribution charts, and Live Activity so you can understand the current state of QUIZTIANS from one place.",

    action: {
      label: "Open Dashboard",
      route: "/admin",
    },

    suggestions: [
      "What is System Status?",
      "What does Quiz Status show?",
      "What is Live Activity?",
    ],
  },

  // =========================================================
  // SYSTEM STATUS
  // =========================================================

  {
    id: "dashboard-system-status",

    category: "Dashboard",

    keywords: [
      "system status",
      "dashboard system status",
      "quiz system status",
      "current system status",
      "system health",
      "quiz health",
      "what is system status",
      "what does system status show",
      "is quiz system active",
      "is system active",
    ],

    answer:
      "System Status gives you a quick high-level view of the current QUIZTIANS quiz environment. It helps you understand the current quiz state without opening each administration page individually.",

    action: {
      label: "Open Dashboard",
      route: "/admin",
    },

    suggestions: [
      "What does Quiz Status show?",
      "What are Dashboard metrics?",
      "What is Live Activity?",
    ],
  },

  // =========================================================
  // DASHBOARD METRICS
  // =========================================================

  {
    id: "dashboard-metrics",

    category: "Dashboard",

    keywords: [
      "dashboard metrics",
      "dashboard stats",
      "dashboard statistics",
      "quiz metrics",
      "quiz statistics dashboard",
      "quiz stats dashboard",
      "dashboard numbers",
      "dashboard cards",
      "metric cards",
      "what are dashboard metrics",
      "what do dashboard metrics show",
    ],

    answer:
      "Dashboard metrics provide quick numerical summaries of important QUIZTIANS data. They are designed to give administrators an immediate snapshot before moving into detailed pages such as Results or Analytics.",

    action: {
      label: "Open Dashboard",
      route: "/admin",
    },

    suggestions: [
      "Where can I view Analytics?",
      "Where can I view participant results?",
      "What does Quiz Status show?",
    ],
  },

  // =========================================================
  // QUICK ACTIONS
  // =========================================================

  {
    id: "dashboard-quick-actions",

    category: "Dashboard",

    keywords: [
      "quick actions",
      "dashboard quick actions",
      "quick action",
      "quick action buttons",
      "quick action pills",
      "floating quick actions",
      "dashboard shortcuts",
      "admin shortcuts",
      "dashboard navigation shortcuts",
      "what are quick actions",
      "what are dashboard quick actions",
    ],

    answer:
      "Quick Actions provide convenient shortcuts from the Dashboard to commonly used QUIZTIANS administration areas. They reduce the number of navigation steps needed during normal quiz management.",

    action: {
      label: "Open Dashboard",
      route: "/admin",
    },

    suggestions: [
      "How do I configure the quiz?",
      "Where can I view Analytics?",
      "What is the Live Display?",
    ],
  },

  // =========================================================
  // QUIZ STATUS WIDGET
  // =========================================================

  {
    id: "dashboard-quiz-status",

    category: "Dashboard",

    keywords: [
      "quiz status",
      "quiz status widget",
      "dashboard quiz status",
      "current quiz status",
      "quiz state",
      "current quiz state",
      "quiz information",
      "quiz status card",
      "what is quiz status",
      "what does quiz status show",
      "what does quiz status widget show",
    ],

    answer:
      "The Quiz Status widget gives you a focused view of the currently configured quiz state from the Dashboard. For detailed timing, duration and active chapter changes, use Quiz Configuration.",

    action: {
      label: "Open Dashboard",
      route: "/admin",
    },

    suggestions: [
      "How do I configure the quiz?",
      "How do I change quiz duration?",
      "How do I select chapters?",
    ],
  },

  // =========================================================
  // LATEST ANNOUNCEMENT WIDGET
  // =========================================================

  {
    id: "dashboard-latest-announcement",

    category: "Dashboard",

    keywords: [
      "latest announcement",
      "latest announcement widget",
      "dashboard announcement",
      "dashboard announcements",
      "announcement widget",
      "recent announcement",
      "newest announcement",
      "current announcement",
      "what is latest announcement",
      "what does announcement widget show",
    ],

    answer:
      "The Latest Announcement widget gives administrators a quick view of the most recent announcement information directly from the Dashboard. Use the dedicated Announcements page when you need to manage announcements.",

    action: {
      label: "Open Announcements",
      route: "/admin/announcements",
    },

    suggestions: [
      "What are Announcements?",
      "How do I manage announcements?",
      "Where are announcements shown?",
    ],
  },

  // =========================================================
  // CHAPTER DISTRIBUTION
  // =========================================================

  {
    id: "dashboard-chapter-distribution",

    category: "Dashboard",

    keywords: [
      "chapter distribution",
      "chapter distribution chart",
      "dashboard chapter distribution",
      "chapter chart",
      "chapter graph",
      "chapter participation",
      "chapter breakdown",
      "results by chapter",
      "participants by chapter",
      "what is chapter distribution",
      "what does chapter distribution show",
    ],

    answer:
      "Chapter Distribution gives you a visual overview of how quiz participation or result data is distributed across chapters. For deeper chapter-level analysis, use the Quiz Analytics page.",

    action: {
      label: "Open Quiz Analytics",
      route: "/admin/analytics",
    },

    suggestions: [
      "How do I analyze a chapter?",
      "What does Analytics show?",
      "What is Score Distribution?",
    ],
  },

  // =========================================================
  // DASHBOARD SCORE DISTRIBUTION
  // =========================================================

  {
    id: "dashboard-score-distribution",

    category: "Dashboard",

    keywords: [
      "dashboard score distribution",
      "dashboard score chart",
      "dashboard score graph",
      "score distribution dashboard",
      "score chart dashboard",
      "score overview",
      "score breakdown",
      "dashboard scores",
    ],

    answer:
      "The Dashboard Score Distribution provides a quick visual summary of participant score patterns. For more detailed performance analysis and filtering, open Quiz Analytics.",

    action: {
      label: "Open Quiz Analytics",
      route: "/admin/analytics",
    },

    suggestions: [
      "What is Score Distribution?",
      "What does Analytics show?",
      "How do I analyze a chapter?",
    ],
  },

  // =========================================================
  // LIVE ACTIVITY
  // =========================================================

  {
    id: "dashboard-live-activity",

    category: "Dashboard",

    keywords: [
      "live activity",
      "dashboard live activity",
      "activity feed",
      "live activity feed",
      "recent activity",
      "recent quiz activity",
      "latest activity",
      "participant activity",
      "live participant activity",
      "what is live activity",
      "what does live activity show",
      "what is activity feed",
    ],

    answer:
      "Live Activity gives administrators a quick view of recent quiz activity from the Dashboard. It is useful for monitoring what is happening during an active event without constantly switching between admin pages.",

    action: {
      label: "Open Dashboard",
      route: "/admin",
    },

    suggestions: [
      "Where can I view results?",
      "What are Activity Logs?",
      "What is the Live Display?",
    ],
  },

  // =========================================================
  // ADD QUESTIONS
  // =========================================================

  {
    id: "add-questions",

    category: "Questions",

    keywords: [
      "add question",
      "add questions",
      "create question",
      "create questions",
      "new question",
      "new questions",
      "question creation",
      "add quiz question",
      "add quiz questions",
      "how do i add a question",
      "how do i add questions",
      "how to add question",
      "how to add questions",
      "where do i add questions",
      "where can i add questions",
    ],

    answer:
      "Use the Add Questions page to create new QUIZTIANS questions. This is the administration area for entering question content, answer choices, the correct answer and the chapter information required by the quiz.",

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
      "question preview",
      "questions preview",
      "view questions",
      "view question",
      "see questions",
      "check questions",
      "review questions",
      "preview saved questions",
      "how do i preview questions",
      "where can i preview questions",
    ],

    answer:
      "Use Preview Questions to review the quiz questions that have been added to QUIZTIANS. It is useful for checking question content before running the quiz.",

    action: {
      label: "Preview Questions",
      route: "/admin/preview-questions",
    },

    suggestions: [
      "How do I add questions?",
      "How do I preview the quiz?",
      "How do I configure the quiz?",
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
      "preview the quiz",
      "test quiz",
      "test the quiz",
      "check quiz",
      "check the quiz",
      "see quiz",
      "view quiz preview",
      "how do i preview quiz",
      "how do i preview the quiz",
      "where can i preview quiz",
    ],

    answer:
      "Use Preview Quiz to review the quiz experience before participants take part. This helps you check how the configured quiz and its questions will appear before the event.",

    action: {
      label: "Preview Quiz",
      route: "/admin/preview-quiz",
    },

    suggestions: [
      "How do I add questions?",
      "How do I configure the quiz?",
      "How do I select chapters?",
    ],
  },

  // =========================================================
  // QUIZ CONFIGURATION
  // =========================================================

  {
    id: "quiz-configuration",

    category: "Quiz Configuration",

    keywords: [
      "quiz configuration",
      "quiz config",
      "configure quiz",
      "configure the quiz",
      "quiz settings",
      "quiz setup",
      "setup quiz",
      "set up quiz",
      "change quiz settings",
      "edit quiz configuration",
      "how do i configure the quiz",
      "how to configure quiz",
      "where is quiz configuration",
      "where are quiz settings",
    ],

    answer:
      "Quiz Configuration is where you manage the main settings for the current QUIZTIANS quiz, including its schedule, duration and active chapters.",

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
      "quiz duration",
      "duration",
      "change duration",
      "change quiz duration",
      "set duration",
      "set quiz duration",
      "quiz time",
      "quiz timer",
      "time limit",
      "quiz time limit",
      "how do i change quiz duration",
      "how do i set quiz duration",
      "where can i change duration",
    ],

    answer:
      "Quiz duration is managed from Quiz Configuration. Open the configuration page and update the duration for the current quiz before participants begin.",

    action: {
      label: "Open Quiz Configuration",
      route: "/admin/quiz-config",
    },

    suggestions: [
      "How do I configure the quiz?",
      "How do I select chapters?",
      "How do I preview the quiz?",
    ],
  },

  // =========================================================
  // ACTIVE CHAPTERS
  // =========================================================

  {
    id: "active-chapters",

    category: "Quiz Configuration",

    keywords: [
      "active chapters",
      "active chapter",
      "select chapters",
      "select chapter",
      "choose chapters",
      "choose chapter",
      "quiz chapters",
      "quiz chapter",
      "chapter selection",
      "change active chapters",
      "set active chapters",
      "how do i select chapters",
      "how do i choose chapters",
      "where can i select chapters",
    ],

    answer:
      "Active chapters determine which chapters are enabled for the current quiz. You can manage the chapter selection from Quiz Configuration.",

    action: {
      label: "Open Quiz Configuration",
      route: "/admin/quiz-config",
    },

    suggestions: [
      "How do I configure the quiz?",
      "How do I change quiz duration?",
      "How does chapter rotation work?",
    ],
  },

    // =========================================================
  // RESULTS
  // =========================================================

  {
    id: "results",

    category: "Results",

    keywords: [
      "results",
      "quiz results",
      "participant results",
      "view results",
      "view quiz results",
      "view participant results",
      "see results",
      "check results",
      "open results",
      "where are results",
      "where can i view results",
      "where can i view participant results",
      "how do i view results",
    ],

    answer:
      "The Results page lets you inspect participant quiz records. Use it when you need to view, search, filter or manage individual participant results.",

    action: {
      label: "Open Results",
      route: "/admin/view-results",
    },

    suggestions: [
      "How do I search results?",
      "How do I reset a participant?",
      "What is the difference between Results and Analytics?",
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
      "reset player",
      "reset participant result",
      "reset participant results",
      "allow participant again",
      "allow participant to retry",
      "participant retry",
      "retry quiz participant",
      "how do i reset a participant",
      "how to reset participant",
      "how can participant retry",
    ],

    answer:
      "Participant reset actions are handled from the Results page. Locate the participant carefully and use the available reset action for that specific record. Review the selected participant before confirming the action.",

    action: {
      label: "Open Results",
      route: "/admin/view-results",
    },

    suggestions: [
      "How do I search results?",
      "How do I reset all results?",
      "Where can I view analytics?",
    ],
  },

  // =========================================================
  // RESET ALL RESULTS
  // =========================================================

  {
    id: "reset-all-results",

    category: "Results",

    keywords: [
      "reset all results",
      "reset results",
      "clear all results",
      "clear results",
      "delete all results",
      "remove all results",
      "reset every result",
      "reset participants",
      "clear participant results",
      "how do i reset all results",
      "how to reset all results",
      "how do i clear results",
    ],

    answer:
      "Reset All Results is a destructive Results action that affects participant result data. Use it only when you intentionally want to clear the relevant results, and carefully review the confirmation before proceeding.",

    action: {
      label: "Open Results",
      route: "/admin/view-results",
    },

    suggestions: [
      "How do I reset a participant?",
      "How do I search results?",
      "Where can I view analytics?",
    ],
  },

  // =========================================================
  // RESULT FILTERING
  // =========================================================

  {
    id: "result-filtering",

    category: "Results",

    keywords: [
      "search results",
      "search result",
      "filter results",
      "filter result",
      "result filtering",
      "results filtering",
      "find participant result",
      "find participant",
      "search participant",
      "search participant results",
      "filter participant results",
      "how do i search results",
      "how do i filter results",
      "how do i find a participant",
    ],

    answer:
      "Use the search and filtering controls on the Results page to narrow participant records and locate the result you need.",

    action: {
      label: "Open Results",
      route: "/admin/view-results",
    },

    suggestions: [
      "How do I reset a participant?",
      "What is the difference between Results and Analytics?",
      "Where can I view analytics?",
    ],
  },

  // =========================================================
  // QUIZ ANALYTICS
  // =========================================================

  {
    id: "quiz-analytics",

    category: "Analytics",

    keywords: [
      "analytics",
      "quiz analytics",
      "analytics page",
      "quiz performance",
      "performance analytics",
      "performance insights",
      "quiz insights",
      "quiz statistics",
      "quiz stats",
      "performance statistics",
      "view analytics",
      "open analytics",
      "where is analytics",
      "where can i view analytics",
      "what does analytics show",
      "what is analytics",
      "what are analytics",
    ],

    answer:
      "Quiz Analytics gives you a performance overview of QUIZTIANS results. It helps you understand participation, scores, chapter performance, rankings and finishing speed from one admin page.",

    action: {
      label: "Open Quiz Analytics",
      route: "/admin/analytics",
    },

    suggestions: [
      "How do I analyze a chapter?",
      "What is Score Distribution?",
      "What are Fastest Finishers?",
    ],
  },

  // =========================================================
  // CHAPTER ANALYTICS
  // =========================================================

  {
    id: "chapter-analytics",

    category: "Analytics",

    keywords: [
      "chapter analytics",
      "chapter performance",
      "chapter statistics",
      "chapter stats",
      "analyze chapter",
      "analyse chapter",
      "analyze a chapter",
      "analyse a chapter",
      "filter analytics by chapter",
      "filter by chapter",
      "chapter filter",
      "analytics chapter filter",
      "performance by chapter",
      "compare chapter performance",
      "chapter performance summary",
    ],

    answer:
      "Use the chapter filter on Quiz Analytics to focus the dashboard on a specific chapter. This lets you inspect that chapter's participation and performance without mixing its results with other chapters.",

    action: {
      label: "Open Quiz Analytics",
      route: "/admin/analytics",
    },

    suggestions: [
      "What does Analytics show?",
      "What is Score Distribution?",
      "Where can I view participant results?",
    ],
  },

  // =========================================================
  // SCORE DISTRIBUTION
  // =========================================================

  {
    id: "score-distribution",

    category: "Analytics",

    keywords: [
      "score distribution",
      "scores distribution",
      "score chart",
      "score graph",
      "distribution chart",
      "distribution graph",
      "how are scores distributed",
      "participant score distribution",
      "quiz score distribution",
      "score analytics",
      "score performance",
      "what is score distribution",
    ],

    answer:
      "Score Distribution shows how participant scores are spread across the selected analytics data. It gives you a quick visual picture of overall quiz performance instead of inspecting every result individually.",

    action: {
      label: "Open Quiz Analytics",
      route: "/admin/analytics",
    },

    suggestions: [
      "How do I analyze a chapter?",
      "What are Fastest Finishers?",
      "Where can I view participant results?",
    ],
  },

  // =========================================================
  // FASTEST FINISHERS
  // =========================================================

  {
    id: "fastest-finishers",

    category: "Analytics",

    keywords: [
      "fastest finishers",
      "fastest finisher",
      "fastest participants",
      "fastest participant",
      "fastest players",
      "fastest player",
      "fastest quiz",
      "fastest completion",
      "fastest completion time",
      "quickest finisher",
      "quickest participant",
      "completion time ranking",
      "time ranking",
      "speed ranking",
      "who finished fastest",
      "who is fastest",
      "what are fastest finishers",
    ],

    answer:
      "Fastest Finishers highlights participants with the quickest valid completion times in the selected analytics data. Entries with a 0-second completion time are excluded so they do not distort the ranking.",

    action: {
      label: "Open Quiz Analytics",
      route: "/admin/analytics",
    },

    suggestions: [
      "What does Analytics show?",
      "What is Score Distribution?",
      "Where can I view participant results?",
    ],
  },

  // =========================================================
  // ANALYTICS RANKINGS
  // =========================================================

  {
    id: "analytics-rankings",

    category: "Analytics",

    keywords: [
      "analytics ranking",
      "analytics rankings",
      "performance ranking",
      "performance rankings",
      "participant ranking",
      "participant rankings",
      "top performers",
      "best performers",
      "top participants",
      "ranking analytics",
      "analytics leaderboard",
      "analytics top performers",
    ],

    answer:
      "The ranking areas in Quiz Analytics help identify the strongest performers from the selected results. They are intended for performance analysis, while the regular Results page remains the place to inspect individual participant records.",

    action: {
      label: "Open Quiz Analytics",
      route: "/admin/analytics",
    },

    suggestions: [
      "How do I analyze a chapter?",
      "What are Fastest Finishers?",
      "Where can I view participant results?",
    ],
  },

  // =========================================================
  // CHAPTER PERFORMANCE SUMMARY
  // =========================================================

  {
    id: "chapter-performance-summary",

    category: "Analytics",

    keywords: [
      "chapter performance summary",
      "chapter summary",
      "performance summary",
      "chapter analytics summary",
      "all chapter performance",
      "all chapters performance",
      "chapter performance table",
      "chapter analytics table",
      "chapter summary table",
      "chapter summary pagination",
    ],

    answer:
      "Chapter Performance Summary gives you a chapter-by-chapter view of quiz performance. The summary is paginated so larger sets of chapters can be reviewed without overcrowding the analytics page.",

    action: {
      label: "Open Quiz Analytics",
      route: "/admin/analytics",
    },

    suggestions: [
      "How do I analyze a chapter?",
      "What is Score Distribution?",
      "What are Fastest Finishers?",
    ],
  },

  // =========================================================
  // RESULTS VS ANALYTICS
  // =========================================================

  {
    id: "results-vs-analytics",

    category: "Analytics",

    keywords: [
      "results vs analytics",
      "analytics vs results",
      "difference between results and analytics",
      "difference between analytics and results",
      "what is the difference between results and analytics",
      "results or analytics",
      "should i use results or analytics",
      "where can i view participant results",
      "individual participant results",
      "participant records",
    ],

    answer:
      "Use Results when you need to inspect, search or manage individual participant records. Use Quiz Analytics when you want the bigger performance picture such as score distribution, chapter-level insights, rankings and fastest finishers.",

    action: {
      label: "Open Results",
      route: "/admin/view-results",
    },

    suggestions: [
      "What does Analytics show?",
      "How do I search results?",
      "How do I analyze a chapter?",
    ],
  },

    // =========================================================
  // ANNOUNCEMENTS
  // =========================================================

  {
    id: "announcements",

    category: "Announcements",

    keywords: [
      "announcement",
      "announcements",
      "quiz announcement",
      "quiz announcements",
      "admin announcement",
      "admin announcements",
      "what are announcements",
      "what is an announcement",
      "announcement feature",
      "announcement system",
      "view announcements",
      "open announcements",
      "where are announcements",
      "where can i manage announcements",
    ],

    answer:
      "Announcements let administrators communicate important QUIZTIANS updates to participants. You can manage announcements from the Announcements page in the admin panel.",

    action: {
      label: "Open Announcements",
      route: "/admin/announcements",
    },

    suggestions: [
      "How do I manage announcements?",
      "Where are announcements shown?",
      "How do I create an announcement?",
    ],
  },

  // =========================================================
  // MANAGE ANNOUNCEMENTS
  // =========================================================

  {
    id: "manage-announcements",

    category: "Announcements",

    keywords: [
      "manage announcements",
      "manage announcement",
      "announcement management",
      "manage quiz announcements",
      "edit announcements",
      "manage news",
      "announcement controls",
      "how do i manage announcements",
      "how to manage announcements",
    ],

    answer:
      "Open the Announcements page to manage QUIZTIANS announcements. This is the central admin area for creating and maintaining announcements shown through the participant experience.",

    action: {
      label: "Manage Announcements",
      route: "/admin/announcements",
    },

    suggestions: [
      "How do I create an announcement?",
      "Where are announcements shown?",
      "What are Announcements?",
    ],
  },

  // =========================================================
  // CREATE ANNOUNCEMENT
  // =========================================================

  {
    id: "create-announcement",

    category: "Announcements",

    keywords: [
      "create announcement",
      "create an announcement",
      "add announcement",
      "add an announcement",
      "new announcement",
      "new announcements",
      "publish announcement",
      "make announcement",
      "make an announcement",
      "how do i create an announcement",
      "how to create announcement",
      "how do i add an announcement",
    ],

    answer:
      "To create an announcement, open the Announcements page and use the available announcement creation controls. Enter the announcement information, review it carefully and save it so it can be used by the QUIZTIANS announcement system.",

    action: {
      label: "Create Announcement",
      route: "/admin/announcements",
    },

    suggestions: [
      "Where are announcements shown?",
      "How do I manage announcements?",
      "What are Announcements?",
    ],
  },

  // =========================================================
  // WHERE ANNOUNCEMENTS ARE SHOWN
  // =========================================================

  {
    id: "announcement-display",

    category: "Announcements",

    keywords: [
      "where are announcements shown",
      "where is announcement shown",
      "where do announcements appear",
      "where does announcement appear",
      "announcement popup",
      "announcement pop up",
      "announcement display",
      "announcement location",
      "participant announcement",
      "participant announcements",
      "user announcement",
      "welcome announcement",
      "welcome announcements",
      "announcement on welcome page",
      "announcements on welcome page",
    ],

    answer:
      "QUIZTIANS announcements are used in the participant-facing experience, including the Welcome page announcement popup. This lets important updates be presented to participants before they continue into the quiz experience.",

    action: {
      label: "Manage Announcements",
      route: "/admin/announcements",
    },

    suggestions: [
      "How do I create an announcement?",
      "How do I manage announcements?",
      "What are Announcements?",
    ],
  },

  // =========================================================
  // EDIT ANNOUNCEMENT
  // =========================================================

  {
    id: "edit-announcement",

    category: "Announcements",

    keywords: [
      "edit announcement",
      "edit an announcement",
      "update announcement",
      "update an announcement",
      "change announcement",
      "change an announcement",
      "modify announcement",
      "modify an announcement",
      "how do i edit an announcement",
      "how to edit announcement",
    ],

    answer:
      "Announcement maintenance is handled from the Announcements page. Open the announcement you want to manage and use the available controls to update its information.",

    action: {
      label: "Manage Announcements",
      route: "/admin/announcements",
    },

    suggestions: [
      "How do I create an announcement?",
      "Where are announcements shown?",
      "What are Announcements?",
    ],
  },

  // =========================================================
  // DELETE ANNOUNCEMENT
  // =========================================================

  {
    id: "delete-announcement",

    category: "Announcements",

    keywords: [
      "delete announcement",
      "delete an announcement",
      "remove announcement",
      "remove an announcement",
      "delete announcements",
      "remove announcements",
      "how do i delete an announcement",
      "how to delete announcement",
    ],

    answer:
      "Announcement removal is handled from the Announcements page. Review the selected announcement carefully before confirming a destructive delete action.",

    action: {
      label: "Manage Announcements",
      route: "/admin/announcements",
    },

    suggestions: [
      "How do I manage announcements?",
      "How do I create an announcement?",
      "Where are announcements shown?",
    ],
  },

  // =========================================================
  // LIVE EVENT DISPLAY
  // =========================================================

  {
    id: "live-display",

    category: "Live Event",

    keywords: [
      "live display",
      "live event display",
      "projector display",
      "projector mode",
      "projector screen",
      "live projector",
      "live leaderboard",
      "event display",
      "live event",
      "what is live display",
      "what is the live display",
      "what is live event display",
      "how does live display work",
      "how does the live display work",
      "how does projector work",
    ],

    answer:
      "The QUIZTIANS Live Event Display is a dedicated projector and TV experience for running quiz events. It shows the live leaderboard, supports automatic chapter rotation, fullscreen viewing and a separate Winner Mode for revealing the final Top 3.",

    action: {
      label: "Open Live Control Center",
      route: "/admin/live-control",
    },

    suggestions: [
      "How does chapter rotation work?",
      "Why are the Top 3 hidden?",
      "How does Winner Mode work?",
    ],
  },

  // =========================================================
  // LIVE CONTROL CENTER
  // =========================================================

  {
    id: "live-control-center",

    category: "Live Event",

    keywords: [
      "live control",
      "live control center",
      "live event control",
      "live event control center",
      "projector control",
      "projector controls",
      "monitor live event",
      "monitor projector",
      "monitor quiz event",
      "live monitoring",
      "event monitoring",
      "what is live control",
      "what is live control center",
      "what does live control show",
      "what does live control center show",
    ],

    answer:
      "The Live Control Center is the admin monitoring page for the current QUIZTIANS event. It helps you monitor quiz status, active chapters, participant results, question availability and winner readiness, and provides access to the projector Live Display.",

    action: {
      label: "Open Live Control Center",
      route: "/admin/live-control",
    },

    suggestions: [
      "What is the Live Display?",
      "How does Winner Mode work?",
      "What is winner readiness?",
    ],
  },

  // =========================================================
  // PROJECTOR CONTROLS
  // =========================================================

  {
    id: "projector-controls",

    category: "Live Event",

    keywords: [
      "projector controls",
      "projector control",
      "live display controls",
      "live controls",
      "control projector",
      "control live display",
      "projector shortcuts",
      "live display shortcuts",
      "keyboard shortcuts",
      "keyboard controls",
      "live keyboard controls",
      "projector keyboard controls",
      "what are projector controls",
      "how do i control live display",
      "how do i control projector",
    ],

    answer:
      "The Live Display has local host controls designed for the event operator. You can change chapters, pause or resume automatic chapter rotation, enter fullscreen and start Winner Mode when the quiz has ended and winners are available.",

    action: {
      label: "Open Live Control Center",
      route: "/admin/live-control",
    },

    suggestions: [
      "What are the Live Display keyboard shortcuts?",
      "How does chapter rotation work?",
      "How does Winner Mode work?",
    ],
  },

  // =========================================================
  // LIVE DISPLAY KEYBOARD SHORTCUTS
  // =========================================================

  {
    id: "live-keyboard-shortcuts",

    category: "Live Event",

    keywords: [
      "live display keyboard shortcuts",
      "live display keyboard controls",
      "projector keyboard shortcuts",
      "projector keyboard controls",
      "live keyboard shortcuts",
      "keyboard shortcuts live display",
      "keyboard controls live display",
      "fullscreen shortcut",
      "chapter shortcut",
      "winner shortcut",
      "pause rotation shortcut",
      "what are the live display keyboard shortcuts",
      "what are the projector shortcuts",
      "show projector shortcuts",
      "show live shortcuts",
    ],

    answer:
      "The Live Display keyboard shortcuts are:\n\nF — toggle fullscreen\nLeft Arrow — previous chapter\nRight Arrow — next chapter\nP — pause or resume chapter rotation\nW — enter Winner Mode when it is available\nSpace or Enter — advance the winner reveal while Winner Mode is active.",

    action: {
      label: "Open Live Control Center",
      route: "/admin/live-control",
    },

    suggestions: [
      "How does chapter rotation work?",
      "How does Winner Mode work?",
      "Why are the Top 3 hidden?",
    ],
  },

  // =========================================================
  // CHAPTER ROTATION
  // =========================================================

  {
    id: "chapter-rotation",

    category: "Live Event",

    keywords: [
      "chapter rotation",
      "chapter rotate",
      "rotate chapters",
      "automatic chapter rotation",
      "auto chapter rotation",
      "auto rotate chapters",
      "projector chapter rotation",
      "live chapter rotation",
      "switch chapters",
      "change chapters live",
      "next chapter projector",
      "previous chapter projector",
      "how does chapter rotation work",
      "how do chapters rotate",
      "how often do chapters rotate",
    ],

    answer:
      "When multiple active chapters are available, the Live Display automatically rotates between them every 15 seconds. The host can also move to the previous or next chapter manually and pause or resume automatic rotation.",

    action: {
      label: "Open Live Control Center",
      route: "/admin/live-control",
    },

    suggestions: [
      "What are the Live Display keyboard shortcuts?",
      "Can I pause chapter rotation?",
      "Why are the Top 3 hidden?",
    ],
  },

  // =========================================================
  // PAUSE CHAPTER ROTATION
  // =========================================================

  {
    id: "pause-chapter-rotation",

    category: "Live Event",

    keywords: [
      "pause chapter rotation",
      "pause rotation",
      "stop chapter rotation",
      "stop rotation",
      "resume chapter rotation",
      "resume rotation",
      "freeze chapter",
      "keep current chapter",
      "pause projector rotation",
      "can i pause chapter rotation",
      "how do i pause rotation",
      "how do i resume rotation",
    ],

    answer:
      "Yes. The event host can pause automatic chapter rotation on the Live Display and resume it when needed. The P keyboard shortcut can also be used to pause or resume rotation.",

    action: {
      label: "Open Live Control Center",
      route: "/admin/live-control",
    },

    suggestions: [
      "How does chapter rotation work?",
      "What are the Live Display keyboard shortcuts?",
      "How does Winner Mode work?",
    ],
  },

  // =========================================================
  // FULLSCREEN
  // =========================================================

  {
    id: "live-fullscreen",

    category: "Live Event",

    keywords: [
      "fullscreen",
      "full screen",
      "projector fullscreen",
      "projector full screen",
      "live fullscreen",
      "live display fullscreen",
      "fullscreen live display",
      "make projector fullscreen",
      "make live display fullscreen",
      "how do i enter fullscreen",
      "how do i make it fullscreen",
    ],

    answer:
      "The Live Display supports fullscreen viewing for TVs and projectors. Use the fullscreen control on the display or press F on the keyboard to toggle fullscreen mode.",

    action: {
      label: "Open Live Control Center",
      route: "/admin/live-control",
    },

    suggestions: [
      "What are the Live Display keyboard shortcuts?",
      "How does chapter rotation work?",
      "How does Winner Mode work?",
    ],
  },

  // =========================================================
  // LIVE LEADERBOARD
  // =========================================================

  {
    id: "live-leaderboard",

    category: "Live Event",

    keywords: [
      "live leaderboard",
      "projector leaderboard",
      "live ranking",
      "live rankings",
      "projector ranking",
      "projector rankings",
      "live scores",
      "live results",
      "live leaderboard ranking",
      "how does live leaderboard work",
      "how are live rankings calculated",
      "how are players ranked live",
    ],

    answer:
      "The Live Display ranks participants using quiz performance and completion data. Higher scores rank first; when scores are equal, faster completion time is preferred, followed by the earlier result when another tie remains.",

    action: {
      label: "Open Live Control Center",
      route: "/admin/live-control",
    },

    suggestions: [
      "Why are the Top 3 hidden?",
      "How does Winner Mode work?",
      "How does chapter rotation work?",
    ],
  },

  // =========================================================
  // TOP 3 HIDDEN DURING LIVE EVENT
  // =========================================================

  {
    id: "hidden-top-three",

    category: "Live Event",

    keywords: [
      "top 3 hidden",
      "top three hidden",
      "hidden top 3",
      "hidden top three",
      "hide winners",
      "hidden winners",
      "why are winners hidden",
      "why is top 3 hidden",
      "why are top 3 hidden",
      "why is top three hidden",
      "why are top three hidden",
      "why cant i see top 3",
      "why can't i see top 3",
      "where are top 3",
      "where are the winners",
      "leaderboard starts at 4",
      "leaderboard starts from 4",
    ],

    answer:
      "During the normal Live Display, the Top 3 participants are intentionally hidden to preserve suspense for the final winner reveal. The public live board therefore starts from rank #4 instead of revealing the winners early.",

    action: {
      label: "Open Live Control Center",
      route: "/admin/live-control",
    },

    suggestions: [
      "How does Winner Mode work?",
      "When can I reveal the winners?",
      "How does the live leaderboard work?",
    ],
  },

  // =========================================================
  // WINNER MODE
  // =========================================================

  {
    id: "winner-mode",

    category: "Live Event",

    keywords: [
      "winner mode",
      "winners mode",
      "winner reveal",
      "winners reveal",
      "reveal winners",
      "reveal winner",
      "final results",
      "final result",
      "final winners",
      "winner screen",
      "winners screen",
      "podium",
      "top 3 reveal",
      "top three reveal",
      "how does winner mode work",
      "what is winner mode",
      "what is winner reveal",
      "how do i reveal winners",
    ],

    answer:
      "Winner Mode is the final reveal experience for the Top 3 participants. It becomes available after the quiz has ended and winner data is available. The host can then reveal the winners progressively instead of showing all three immediately.",

    action: {
      label: "Open Live Control Center",
      route: "/admin/live-control",
    },

    suggestions: [
      "When can I reveal the winners?",
      "How do I advance the winner reveal?",
      "Why are the Top 3 hidden?",
    ],
  },

  // =========================================================
  // WINNER MODE AVAILABILITY
  // =========================================================

  {
    id: "winner-mode-availability",

    category: "Live Event",

    keywords: [
      "when can i reveal winners",
      "when can i reveal the winners",
      "when is winner mode available",
      "winner mode available",
      "winner mode unavailable",
      "winner mode disabled",
      "cannot start winner mode",
      "cant start winner mode",
      "can't start winner mode",
      "cannot reveal winners",
      "cant reveal winners",
      "can't reveal winners",
      "winner readiness",
      "what is winner readiness",
      "winners ready",
      "are winners ready",
    ],

    answer:
      "Winner Mode is available when the quiz has ended and valid winner data exists. The Live Control Center helps the event host monitor whether the event is ready for the final winner reveal.",

    action: {
      label: "Open Live Control Center",
      route: "/admin/live-control",
    },

    suggestions: [
      "How does Winner Mode work?",
      "How do I advance the winner reveal?",
      "Why are the Top 3 hidden?",
    ],
  },

  // =========================================================
  // ADVANCE WINNER REVEAL
  // =========================================================

  {
    id: "advance-winner-reveal",

    category: "Live Event",

    keywords: [
      "advance winner reveal",
      "next winner",
      "reveal next winner",
      "continue winner reveal",
      "winner reveal controls",
      "winner mode controls",
      "winner keyboard controls",
      "how do i advance winner reveal",
      "how do i reveal next winner",
      "how do i continue winner mode",
      "space winner mode",
      "enter winner mode control",
    ],

    answer:
      "While Winner Mode is active, use Space or Enter to advance through the winner reveal. Normal Live Display shortcuts are locked during the reveal so the host can focus on presenting the winners without accidentally changing the regular display.",

    action: {
      label: "Open Live Control Center",
      route: "/admin/live-control",
    },

    suggestions: [
      "How does Winner Mode work?",
      "When can I reveal the winners?",
      "What are the Live Display keyboard shortcuts?",
    ],
  },

    // =========================================================
  // ACTIVITY LOGS
  // =========================================================

  {
    id: "activity-logs",

    category: "Activity Logs",

    keywords: [
      "activity logs",
      "activity log",
      "admin activity logs",
      "admin activity log",
      "audit logs",
      "audit log",
      "admin history",
      "admin actions",
      "administrator actions",
      "view activity logs",
      "open activity logs",
      "where are activity logs",
      "what are activity logs",
      "what is activity log",
    ],

    answer:
      "Activity Logs help you review recorded administrator activity in QUIZTIANS. Use them when you need to inspect administrative actions and recent admin history.",

    action: {
      label: "Open Activity Logs",
      route: "/admin/activity-logs",
    },

    suggestions: [
      "How do I search Activity Logs?",
      "What are Login Logs?",
      "What is Live Activity?",
    ],
  },

  // =========================================================
  // SEARCH ACTIVITY LOGS
  // =========================================================

  {
    id: "search-activity-logs",

    category: "Activity Logs",

    keywords: [
      "search activity logs",
      "search activity log",
      "filter activity logs",
      "filter activity log",
      "find activity log",
      "find admin activity",
      "search admin activity",
      "filter admin activity",
      "activity log search",
      "activity log filter",
      "how do i search activity logs",
      "how do i filter activity logs",
    ],

    answer:
      "Open Activity Logs and use the available search or filtering controls to narrow the recorded administrator activity you want to inspect.",

    action: {
      label: "Open Activity Logs",
      route: "/admin/activity-logs",
    },

    suggestions: [
      "What are Activity Logs?",
      "What are Login Logs?",
      "What is Live Activity?",
    ],
  },

  // =========================================================
  // LOGIN LOGS
  // SUPERADMIN ONLY
  // =========================================================

  {
    id: "login-logs",

    category: "Security",

    roles: ["superadmin"],

    keywords: [
      "login logs",
      "login log",
      "admin login logs",
      "admin login history",
      "login history",
      "administrator login history",
      "administrator logins",
      "admin logins",
      "view login logs",
      "open login logs",
      "where are login logs",
      "what are login logs",
      "what is login log",
    ],

    answer:
      "Login Logs let Super Admins review administrator login activity. This feature is restricted to Super Admin accounts.",

    action: {
      label: "Open Login Logs",
      route: "/admin/login-logs",
    },

    suggestions: [
      "What are Activity Logs?",
      "How do I manage administrators?",
      "What is a Super Admin?",
    ],
  },

  // =========================================================
  // ADMIN USERS
  // SUPERADMIN ONLY
  // =========================================================

  {
    id: "admin-users",

    category: "Administrators",

    roles: ["superadmin"],

    keywords: [
      "admin users",
      "administrator users",
      "manage admins",
      "manage admin",
      "manage administrators",
      "administrator management",
      "admin management",
      "admins",
      "administrators",
      "view admins",
      "view administrators",
      "open admin users",
      "where can i manage admins",
      "how do i manage administrators",
    ],

    answer:
      "Admin Users is the Super Admin area for managing QUIZTIANS administrator accounts. From there, authorized Super Admins can handle administrator-related management actions.",

    action: {
      label: "Manage Administrators",
      route: "/admin/admin-users",
    },

    suggestions: [
      "How do I invite an admin?",
      "How do I disable an admin?",
      "What is the difference between Admin and Super Admin?",
    ],
  },

  // =========================================================
  // INVITE ADMIN
  // SUPERADMIN ONLY
  // =========================================================

  {
    id: "invite-admin",

    category: "Administrators",

    roles: ["superadmin"],

    keywords: [
      "invite admin",
      "invite an admin",
      "invite administrator",
      "invite an administrator",
      "add admin",
      "add administrator",
      "create admin",
      "create administrator",
      "new admin",
      "new administrator",
      "admin invitation",
      "administrator invitation",
      "how do i invite an admin",
      "how do i add an admin",
    ],

    answer:
      "Administrator invitations are managed from Admin Users. This is a Super Admin feature, so only authorized Super Admin accounts can access the administrator management workflow.",

    action: {
      label: "Manage Administrators",
      route: "/admin/admin-users",
    },

    suggestions: [
      "How do I disable an admin?",
      "How do I enable an admin?",
      "What is the difference between Admin and Super Admin?",
    ],
  },

  // =========================================================
  // DISABLE ADMIN
  // SUPERADMIN ONLY
  // =========================================================

  {
    id: "disable-admin",

    category: "Administrators",

    roles: ["superadmin"],

    keywords: [
      "disable admin",
      "disable an admin",
      "disable administrator",
      "disable an administrator",
      "deactivate admin",
      "deactivate administrator",
      "suspend admin",
      "suspend administrator",
      "turn off admin",
      "how do i disable an admin",
      "how do i deactivate an admin",
    ],

    answer:
      "Admin account status is managed from Admin Users. Super Admins can use the available administrator controls to disable an account when required.",

    action: {
      label: "Manage Administrators",
      route: "/admin/admin-users",
    },

    suggestions: [
      "How do I enable an admin?",
      "How do I delete an admin?",
      "What is the difference between Admin and Super Admin?",
    ],
  },

  // =========================================================
  // ENABLE ADMIN
  // SUPERADMIN ONLY
  // =========================================================

  {
    id: "enable-admin",

    category: "Administrators",

    roles: ["superadmin"],

    keywords: [
      "enable admin",
      "enable an admin",
      "enable administrator",
      "enable an administrator",
      "activate admin",
      "activate administrator",
      "reactivate admin",
      "reactivate administrator",
      "turn on admin",
      "how do i enable an admin",
      "how do i reactivate an admin",
    ],

    answer:
      "Admin account status is managed from Admin Users. Super Admins can use the available administrator controls to enable an account when appropriate.",

    action: {
      label: "Manage Administrators",
      route: "/admin/admin-users",
    },

    suggestions: [
      "How do I disable an admin?",
      "How do I delete an admin?",
      "What is the difference between Admin and Super Admin?",
    ],
  },

  // =========================================================
  // DELETE ADMIN
  // SUPERADMIN ONLY
  // =========================================================

  {
    id: "delete-admin",

    category: "Administrators",

    roles: ["superadmin"],

    keywords: [
      "delete admin",
      "delete an admin",
      "delete administrator",
      "delete an administrator",
      "remove admin",
      "remove an admin",
      "remove administrator",
      "remove an administrator",
      "how do i delete an admin",
      "how do i remove an admin",
    ],

    answer:
      "Administrator deletion is a destructive Super Admin action handled from Admin Users. Carefully verify the selected administrator before confirming a permanent removal action.",

    action: {
      label: "Manage Administrators",
      route: "/admin/admin-users",
    },

    suggestions: [
      "How do I disable an admin?",
      "How do I enable an admin?",
      "What is the difference between Admin and Super Admin?",
    ],
  },

  // =========================================================
  // ADMIN ROLES
  // =========================================================

  {
    id: "admin-roles",

    category: "Administrators",

    keywords: [
      "admin roles",
      "administrator roles",
      "roles",
      "admin role",
      "superadmin role",
      "super admin role",
      "admin vs superadmin",
      "admin vs super admin",
      "superadmin vs admin",
      "super admin vs admin",
      "difference between admin and superadmin",
      "difference between admin and super admin",
      "what is admin",
      "what is superadmin",
      "what is super admin",
      "what is the difference between admin and super admin",
    ],

    answer:
      "QUIZTIANS uses role-based administration. Admin accounts handle normal quiz administration, while Super Admin accounts have access to additional administrator-management and security-related features.",

    suggestions: [
      "What are Activity Logs?",
      "What are Login Logs?",
      "How do I manage administrators?",
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
      "admin logout",
      "admin sign out",
      "leave admin",
      "exit admin",
      "how do i logout",
      "how do i log out",
      "how do i sign out",
    ],

    answer:
      "Use the Logout option in the admin interface when you want to end your current QUIZTIANS administrator session.",

    suggestions: [
      "What can you help me with?",
      "What is the Dashboard?",
      "What are Activity Logs?",
    ],
  },
];


// ===========================================================
// RESTRICTED SUPERADMIN TOPICS
// ===========================================================
//
// These phrases help us identify questions about Super Admin
// functionality before returning normal Admin knowledge.
//
// ===========================================================

const restrictedSuperadminTopics = [
  "login logs",
  "login log",
  "admin login logs",
  "admin login history",
  "login history",

  "admin users",
  "manage admins",
  "manage admin",
  "manage administrators",
  "administrator management",
  "admin management",

  "invite admin",
  "invite an admin",
  "invite administrator",
  "add admin",
  "add administrator",

  "disable admin",
  "disable administrator",
  "deactivate admin",
  "deactivate administrator",

  "enable admin",
  "enable administrator",
  "activate admin",
  "activate administrator",

  "delete admin",
  "delete administrator",
  "remove admin",
  "remove administrator",
];


// ===========================================================
// FALLBACK RESPONSE
// ===========================================================

export const fallbackResponse = {
  answer:
    "I couldn't find an exact answer for that yet. I can help with QUIZTIANS questions, quiz configuration, results, analytics, announcements, live events, activity logs and administrator features.",

  suggestions: [
    "How do I configure the quiz?",
    "Where can I view analytics?",
    "What is the Live Display?",
    "What are Announcements?",
  ],
};


// ===========================================================
// HELPERS
// ===========================================================

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function tokenize(value = "") {
  return normalizeText(value)
    .split(" ")
    .filter(Boolean);
}


// ===========================================================
// STOP WORDS
// ===========================================================
//
// These common words are ignored when calculating the more
// meaningful token overlap between a user question and a
// knowledge-base keyword.
//
// ===========================================================

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "i",
  "me",
  "my",
  "you",
  "your",
  "we",
  "our",
  "is",
  "are",
  "am",
  "was",
  "were",
  "be",
  "been",
  "being",
  "do",
  "does",
  "did",
  "can",
  "could",
  "should",
  "would",
  "will",
  "how",
  "what",
  "where",
  "when",
  "why",
  "who",
  "which",
  "to",
  "for",
  "from",
  "of",
  "on",
  "in",
  "at",
  "with",
  "and",
  "or",
  "this",
  "that",
  "it",
  "as",
  "please",
]);


function importantTokens(value = "") {
  return tokenize(value)
    .filter(
      (token) =>
        token.length > 1 &&
        !STOP_WORDS.has(token)
    );
}


// ===========================================================
// ROLE HELPERS
// ===========================================================

function normalizeRole(role = "admin") {
  const normalized =
    normalizeText(role)
      .replace(/\s+/g, "");

  if (
    normalized === "superadmin" ||
    normalized === "superadministrator"
  ) {
    return "superadmin";
  }

  return "admin";
}


function isKnowledgeAllowedForRole(
  item,
  role
) {
  if (
    !Array.isArray(item?.roles) ||
    item.roles.length === 0
  ) {
    return true;
  }

  const normalizedRole =
    normalizeRole(role);

  return item.roles.some(
    (allowedRole) =>
      normalizeRole(allowedRole) ===
      normalizedRole
  );
}


// ===========================================================
// CONVERSATIONAL MATCHING
// ===========================================================

function findConversationalMatch(message) {
  const normalizedMessage =
    normalizeText(message);

  if (!normalizedMessage) {
    return null;
  }

  for (
    const item of conversationalKnowledge
  ) {
    const patterns =
      Array.isArray(item.patterns)
        ? item.patterns
        : [];

    for (const pattern of patterns) {
      const normalizedPattern =
        normalizeText(pattern);

      if (
        normalizedMessage ===
        normalizedPattern
      ) {
        return item;
      }
    }
  }

  return null;
}


// ===========================================================
// RESTRICTED TOPIC CHECK
// ===========================================================

function isRestrictedSuperadminTopic(
  message
) {
  const normalizedMessage =
    normalizeText(message);

  if (!normalizedMessage) {
    return false;
  }

  return restrictedSuperadminTopics.some(
    (topic) => {
      const normalizedTopic =
        normalizeText(topic);

      return (
        normalizedMessage ===
          normalizedTopic ||
        normalizedMessage.includes(
          normalizedTopic
        )
      );
    }
  );
}


// ===========================================================
// KEYWORD SCORING
// ===========================================================

function scoreKeyword(message, keyword) {
  const normalizedMessage =
    normalizeText(message);

  const normalizedKeyword =
    normalizeText(keyword);

  if (
    !normalizedMessage ||
    !normalizedKeyword
  ) {
    return 0;
  }

  // ---------------------------------------------------------
  // 1. Exact match
  // ---------------------------------------------------------

  if (
    normalizedMessage ===
    normalizedKeyword
  ) {
    return 100;
  }

  // ---------------------------------------------------------
  // 2. Full keyword phrase appears in the question
  // ---------------------------------------------------------

  if (
    normalizedMessage.includes(
      normalizedKeyword
    )
  ) {
    return 80;
  }

  // ---------------------------------------------------------
  // 3. User's complete phrase appears inside keyword
  // ---------------------------------------------------------

  if (
    normalizedKeyword.includes(
      normalizedMessage
    )
  ) {
    return 60;
  }

  // ---------------------------------------------------------
  // 4. Meaningful token matching
  // ---------------------------------------------------------

  const messageTokens =
    importantTokens(
      normalizedMessage
    );

  const keywordTokens =
    importantTokens(
      normalizedKeyword
    );

  if (
    messageTokens.length === 0 ||
    keywordTokens.length === 0
  ) {
    return 0;
  }

  const messageTokenSet =
    new Set(messageTokens);

  const matchingTokens =
    keywordTokens.filter((token) =>
      messageTokenSet.has(token)
    );

  // ---------------------------------------------------------
  // IMPORTANT:
  // One generic matching word is not enough.
  //
  // Example:
  // "Can you order pizza for the participants?"
  //
  // must NOT match:
  // "participant results"
  // ---------------------------------------------------------

  if (matchingTokens.length < 2) {
    return 0;
  }

  const overlapRatio =
    matchingTokens.length /
    keywordTokens.length;

  const messageCoverage =
    matchingTokens.length /
    messageTokens.length;

  let score =
    overlapRatio * 35 +
    messageCoverage * 20;

  // Stronger multi-word intent match
  if (matchingTokens.length >= 2) {
    score += 12;
  }

  if (matchingTokens.length >= 3) {
    score += 10;
  }

  // Complete meaningful keyword-token match
  if (
    matchingTokens.length ===
    keywordTokens.length
  ) {
    score += 10;
  }

  return score;
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

  for (
    const item of adminChatKnowledge
  ) {
    if (
      !isKnowledgeAllowedForRole(
        item,
        role
      )
    ) {
      continue;
    }

    const keywords =
      Array.isArray(item.keywords)
        ? item.keywords
        : [];

    let itemBestScore = 0;

    for (const keyword of keywords) {
      const keywordScore =
        scoreKeyword(
          message,
          keyword
        );

      if (
        keywordScore >
        itemBestScore
      ) {
        itemBestScore =
          keywordScore;
      }
    }

    if (
      itemBestScore >
      bestScore
    ) {
      bestScore =
        itemBestScore;

      bestMatch = item;
    }
  }

  // Prevent weak token overlaps from
  // producing unrelated chatbot answers.
  const MINIMUM_CONFIDENCE = 28;scoreKeyword()

  if (
    !bestMatch ||
    bestScore <
      MINIMUM_CONFIDENCE
  ) {
    return null;
  }

  return bestMatch;
}


// ===========================================================
// RESPONSE BUILDER
// ===========================================================

function buildResponse(item) {
  if (!item) {
    return fallbackResponse;
  }

  return {
    answer:
      typeof item.answer === "string"
        ? item.answer
        : fallbackResponse.answer,

    action:
      item.action &&
      typeof item.action === "object"
        ? {
            label:
              String(
                item.action.label || ""
              ),
            route:
              String(
                item.action.route || ""
              ),
          }
        : null,

    suggestions:
      Array.isArray(
        item.suggestions
      )
        ? item.suggestions
        : [],
  };
}


// ===========================================================
// MAIN CHATBOT MATCHER
// ===========================================================

export function findAdminChatResponse(
  message,
  options = {}
) {
  const normalizedMessage =
    normalizeText(message);

  if (!normalizedMessage) {
    return fallbackResponse;
  }

  const role =
    normalizeRole(
      options?.role || "admin"
    );

  // ---------------------------------------------------------
  // 1. Conversational responses
  // ---------------------------------------------------------

  const conversationalMatch =
    findConversationalMatch(
      normalizedMessage
    );

  if (conversationalMatch) {
    return buildResponse(
      conversationalMatch
    );
  }

  // ---------------------------------------------------------
  // 2. Protect Super Admin-only topics
  // ---------------------------------------------------------

  if (
    role !== "superadmin" &&
    isRestrictedSuperadminTopic(
      normalizedMessage
    )
  ) {
    return {
      answer:
        "That feature is available only to QUIZTIANS Super Admin accounts. Standard Admin accounts do not have access to administrator-management or Super Admin security features.",

      action: null,

      suggestions: [
        "What is the difference between Admin and Super Admin?",
        "What are Activity Logs?",
        "How do I configure the quiz?",
      ],
    };
  }

  // ---------------------------------------------------------
  // 3. Search prepared knowledge
  // ---------------------------------------------------------

  const bestMatch =
    findBestKnowledgeMatch(
      normalizedMessage,
      role
    );

  if (!bestMatch) {
    return fallbackResponse;
  }

  return buildResponse(bestMatch);
}


// ===========================================================
// CATEGORY HELPERS
// ===========================================================

export function getAdminChatCategories(
  role = "admin"
) {
  const normalizedRole =
    normalizeRole(role);

  return [
    ...new Set(
      adminChatKnowledge
        .filter((item) =>
          isKnowledgeAllowedForRole(
            item,
            normalizedRole
          )
        )
        .map(
          (item) =>
            item.category
        )
        .filter(Boolean)
    ),
  ];
}


export function getAdminChatKnowledgeByCategory(
  category,
  role = "admin"
) {
  const normalizedCategory =
    normalizeText(category);

  const normalizedRole =
    normalizeRole(role);

  return adminChatKnowledge.filter(
    (item) =>
      normalizeText(
        item.category
      ) ===
        normalizedCategory &&
      isKnowledgeAllowedForRole(
        item,
        normalizedRole
      )
  );
}
