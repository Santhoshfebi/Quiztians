import { AnimatePresence, motion } from "framer-motion";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  ArrowRight,
  ArrowUp,
  BarChart3,
  BookOpen,
  Bot,
  FileQuestion,
  HelpCircle,
  History,
  LayoutDashboard,
  MessageCircle,
  Minimize2,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserCog,
  X,
} from "lucide-react";

import {
  fallbackResponse,
  findAdminChatResponse,
} from "./adminChatKnowledge";

// ===========================================================
// CHAT CONFIGURATION
// ===========================================================

const CHAT_STORAGE_VERSION = 1;
const MAX_STORED_MESSAGES = 50;
const RESPONSE_DELAY = 450;

const CHAT_TRIGGER_POSITION_KEY =
  "quiztians-admin-chat-trigger-position-v1";

const CHAT_TRIGGER_EDGE_GAP = 16;
const CHAT_TRIGGER_DRAG_THRESHOLD = 5;

// ===========================================================
// ALLOWED ROUTES
// ===========================================================

const ALLOWED_ADMIN_ROUTES = new Set([
  "/admin",
  "/admin/add-questions",
  "/admin/preview-questions",
  "/admin/preview-quiz",
  "/admin/quiz-config",
  "/admin/view-results",

  // New QUIZTIANS V2 admin features
  "/admin/analytics",
  "/admin/announcements",
  "/admin/live-control",

  "/admin/activity-logs",
]);

const ALLOWED_SUPERADMIN_ROUTES = new Set([
  ...ALLOWED_ADMIN_ROUTES,
  "/admin/login-logs",
  "/admin/admin-users",
]);

// ===========================================================
// PAGE CONTEXT
// ===========================================================

const PAGE_CONTEXT = {
  "/admin": {
    label: "Dashboard",
    icon: LayoutDashboard,
    intro:
      "You're currently on the Dashboard. I can help you navigate QUIZTIANS, monitor the current quiz and find the admin feature you need.",
    suggestions: [
      "How do I configure the quiz?",
      "Where can I view analytics?",
      "What is the Live Display?",
    ],
  },

  "/admin/add-questions": {
    label: "Add Questions",
    icon: Plus,
    intro:
      "You're on Add Questions. I can help you with question management, previewing questions or preparing the quiz.",
    suggestions: [
      "How do I preview questions?",
      "How do I preview the quiz?",
      "How do I configure the quiz?",
    ],
  },

  "/admin/preview-questions": {
    label: "Preview Questions",
    icon: FileQuestion,
    intro:
      "You're viewing Preview Questions. I can help you find where to add questions, preview the quiz or configure it.",
    suggestions: [
      "How do I add questions?",
      "How do I preview the quiz?",
      "How do I select chapters?",
    ],
  },

  "/admin/preview-quiz": {
    label: "Preview Quiz",
    icon: Play,
    intro:
      "You're on Preview Quiz. This is a good place to review the quiz experience before participants take it.",
    suggestions: [
      "How do I start the quiz?",
      "How do I change quiz duration?",
      "How do I select chapters?",
    ],
  },

  "/admin/quiz-config": {
    label: "Quiz Configuration",
    icon: Settings2,
    intro:
      "You're on Quiz Configuration. I can help with quiz timing, duration, active chapters and preparing the quiz.",
    suggestions: [
      "How do I start the quiz?",
      "How do I change quiz duration?",
      "How do I select chapters?",
    ],
  },

  "/admin/view-results": {
    label: "Results",
    icon: BarChart3,
    intro:
      "You're viewing Results. I can help with participant results, filtering and reset actions.",
    suggestions: [
      "How do I reset a participant?",
      "Can I reset all results?",
      "How do I search results?",
    ],
  },

  // =========================================================
  // ANALYTICS
  // =========================================================

  "/admin/analytics": {
    label: "Analytics",
    icon: BarChart3,
    intro:
      "You're viewing Quiz Analytics. I can help you understand quiz performance, chapter-level insights, score distribution, rankings and fastest finishers.",
    suggestions: [
      "What does Analytics show?",
      "How do I analyze a chapter?",
      "Where can I view participant results?",
    ],
  },

  // =========================================================
  // ANNOUNCEMENTS
  // =========================================================

  "/admin/announcements": {
    label: "Announcements",
    icon: MessageCircle,
    intro:
      "You're on Announcements. I can help you understand how announcements are managed and how they are shown to QUIZTIANS participants.",
    suggestions: [
      "What are Announcements?",
      "How do I manage announcements?",
      "Where are announcements shown?",
    ],
  },

  // =========================================================
  // LIVE EVENT CONTROL
  // =========================================================

  "/admin/live-control": {
    label: "Live Control Center",
    icon: Play,
    intro:
      "You're viewing the Live Control Center. I can help you monitor the current quiz event, active chapters and projector-ready live event information.",
    suggestions: [
      "What is the Live Display?",
      "How does chapter rotation work?",
      "How does Winner Mode work?",
    ],
  },

  "/admin/activity-logs": {
    label: "Activity Logs",
    icon: History,
    intro:
      "You're viewing Activity Logs. I can explain what the logs contain and how to search or filter them.",
    suggestions: [
      "What are Activity Logs?",
      "How do I search Activity Logs?",
      "Where can I view results?",
    ],
  },

  "/admin/login-logs": {
    label: "Login Logs",
    icon: ShieldCheck,
    superAdminOnly: true,
    intro:
      "You're viewing Login Logs. I can help explain administrator login activity and related Super Admin features.",
    suggestions: [
      "What are Login Logs?",
      "How do I manage admins?",
      "What is a Super Admin?",
    ],
  },

  "/admin/admin-users": {
    label: "Admin Users",
    icon: UserCog,
    superAdminOnly: true,
    intro:
      "You're on Admin Users. I can help with inviting, enabling, disabling and managing administrator accounts.",
    suggestions: [
      "How do I invite an admin?",
      "How do I disable an admin?",
      "How do I delete an admin?",
    ],
  },
};

// ===========================================================
// DEFAULT CONTEXT
// ===========================================================

const DEFAULT_CONTEXT = {
  label: "Admin Console",
  icon: HelpCircle,
  intro:
    "I can help you navigate the QUIZTIANS admin console and explain common administration tasks.",
  suggestions: [
    "What can you help me with?",
    "Where can I view analytics?",
    "What is the Live Display?",
  ],
};

// ===========================================================
// COMMAND RESPONSES
// ===========================================================

const COMMAND_HELP = {
  answer:
    "I can help with questions, quiz configuration, results, analytics, announcements, live events, activity logs and administrator features.\n\nYou can also type /clear to reset this conversation.",
  suggestions: [
    "How do I configure the quiz?",
    "Where can I view analytics?",
    "What is the Live Display?",
  ],
};

// ===========================================================
// HELPERS
// ===========================================================

function createMessageId(prefix = "message") {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function createWelcomeMessage(context) {
  return {
    id: createMessageId("welcome"),
    sender: "bot",
    text: `Hey! 👋 I'm your QUIZTIANS Admin Assistant.\n\n${context.intro}`,
  };
}

function resolvePageContext(pathname, isSuperAdmin) {
  const context =
    PAGE_CONTEXT[pathname] || DEFAULT_CONTEXT;

  if (
    context.superAdminOnly &&
    !isSuperAdmin
  ) {
    return DEFAULT_CONTEXT;
  }

  return context;
}

function getStorageKey(role) {
  return `quiztians-admin-chat-v${CHAT_STORAGE_VERSION}:${role}`;
}

function getAllowedRoutes(role) {
  return role === "superadmin"
    ? ALLOWED_SUPERADMIN_ROUTES
    : ALLOWED_ADMIN_ROUTES;
}

function sanitizeAction(action, role) {
  if (
    !action ||
    typeof action !== "object" ||
    typeof action.route !== "string" ||
    typeof action.label !== "string"
  ) {
    return null;
  }

  const allowedRoutes =
    getAllowedRoutes(role);

  if (!allowedRoutes.has(action.route)) {
    return null;
  }

  return {
    label: action.label.slice(0, 120),
    route: action.route,
  };
}

function sanitizeSuggestions(suggestions) {
  if (!Array.isArray(suggestions)) {
    return [];
  }

  return suggestions
    .filter(
      (suggestion) =>
        typeof suggestion === "string"
    )
    .map((suggestion) =>
      suggestion.trim().slice(0, 200)
    )
    .filter(Boolean)
    .slice(0, 3);
}

function sanitizeStoredMessage(item, role) {
  if (
    !item ||
    typeof item !== "object" ||
    !["bot", "user"].includes(item.sender) ||
    typeof item.text !== "string"
  ) {
    return null;
  }

  const text = item.text
    .trim()
    .slice(0, 4000);

  if (!text) {
    return null;
  }

  return {
    id:
      typeof item.id === "string"
        ? item.id
        : createMessageId(item.sender),

    sender: item.sender,

    text,

    contextual:
      item.contextual === true,

    action:
      item.sender === "bot"
        ? sanitizeAction(
          item.action,
          role
        )
        : null,

    suggestions:
      item.sender === "bot"
        ? sanitizeSuggestions(
          item.suggestions
        )
        : [],
  };
}

function readStoredMessages(role) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw =
      window.sessionStorage.getItem(
        getStorageKey(role)
      );

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      window.sessionStorage.removeItem(
        getStorageKey(role)
      );

      return null;
    }

    const sanitized = parsed
      .map((item) =>
        sanitizeStoredMessage(
          item,
          role
        )
      )
      .filter(Boolean)
      .slice(-MAX_STORED_MESSAGES);

    if (sanitized.length === 0) {
      window.sessionStorage.removeItem(
        getStorageKey(role)
      );

      return null;
    }

    return sanitized;
  } catch (error) {
    console.warn(
      "Unable to restore QUIZTIANS admin chat.",
      error
    );

    try {
      window.sessionStorage.removeItem(
        getStorageKey(role)
      );
    } catch {
      // Ignore storage cleanup failure.
    }

    return null;
  }
}

function saveStoredMessages(role, messages) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const sanitized = messages
      .map((item) =>
        sanitizeStoredMessage(
          item,
          role
        )
      )
      .filter(Boolean)
      .slice(-MAX_STORED_MESSAGES);

    window.sessionStorage.setItem(
      getStorageKey(role),
      JSON.stringify(sanitized)
    );
  } catch (error) {
    console.warn(
      "Unable to save QUIZTIANS admin chat.",
      error
    );
  }
}

function removeStoredMessages(role) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(
      getStorageKey(role)
    );
  } catch (error) {
    console.warn(
      "Unable to clear QUIZTIANS admin chat.",
      error
    );
  }
}

function getFocusableElements(container) {
  if (!container) {
    return [];
  }

  return Array.from(
    container.querySelectorAll(
      [
        "button:not([disabled])",
        "textarea:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "a[href]",
        '[tabindex]:not([tabindex="-1"])',
      ].join(",")
    )
  ).filter(
    (element) =>
      !element.hasAttribute(
        "aria-hidden"
      ) &&
      element.getClientRects().length > 0
  );
}

// ===========================================================
// MOVABLE TRIGGER HELPERS
// ===========================================================

function readTriggerPosition() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw =
      window.sessionStorage.getItem(
        CHAT_TRIGGER_POSITION_KEY
      );

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (
      typeof parsed?.x !== "number" ||
      typeof parsed?.y !== "number" ||
      !Number.isFinite(parsed.x) ||
      !Number.isFinite(parsed.y)
    ) {
      return null;
    }

    return {
      x: parsed.x,
      y: parsed.y,
    };
  } catch {
    return null;
  }
}

function saveTriggerPosition(position) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      CHAT_TRIGGER_POSITION_KEY,
      JSON.stringify(position)
    );
  } catch {
    // Ignore storage failure.
  }
}

function clampTriggerPosition(
  position,
  element
) {
  if (
    typeof window === "undefined" ||
    !element
  ) {
    return position;
  }

  const width =
    element.offsetWidth || 54;

  const height =
    element.offsetHeight || 54;

  const minX =
    CHAT_TRIGGER_EDGE_GAP;

  const minY =
    CHAT_TRIGGER_EDGE_GAP;

  const maxX = Math.max(
    minX,
    window.innerWidth -
    width -
    CHAT_TRIGGER_EDGE_GAP
  );

  const maxY = Math.max(
    minY,
    window.innerHeight -
    height -
    CHAT_TRIGGER_EDGE_GAP
  );

  return {
    x: Math.min(
      Math.max(position.x, minX),
      maxX
    ),

    y: Math.min(
      Math.max(position.y, minY),
      maxY
    ),
  };
}

// ===========================================================
// ADMIN CHATBOT
// ===========================================================

export default function AdminChatBot({
  theme,
  isSuperAdmin = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const accent =
    theme?.accent || "#8B5CF6";

  const role = isSuperAdmin
    ? "superadmin"
    : "admin";

  // =========================================================
  // PAGE CONTEXT
  // =========================================================

  const pageContext = useMemo(
    () =>
      resolvePageContext(
        location.pathname,
        isSuperAdmin
      ),
    [
      location.pathname,
      isSuperAdmin,
    ]
  );

  const ContextIcon =
    pageContext.icon || HelpCircle;

  // =========================================================
  // STATE
  // =========================================================

  const [isOpen, setIsOpen] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messages, setMessages] =
    useState(() => {
      const stored =
        readStoredMessages(role);

      if (stored) {
        return stored;
      }

      const context =
        resolvePageContext(
          location.pathname,
          isSuperAdmin
        );

      return [
        createWelcomeMessage(
          context
        ),
      ];
    });

  const [isTyping, setIsTyping] =
    useState(false);

  const [
    triggerPosition,
    setTriggerPosition,
  ] = useState(null);

  // =========================================================
  // REFS
  // =========================================================

  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const responseTimerRef =
    useRef(null);

  const previousPathRef =
    useRef(location.pathname);

  const previousRoleRef =
    useRef(role);

  const isOpenRef =
    useRef(isOpen);

  const isTypingRef =
    useRef(isTyping);

  // Movable trigger
  const triggerWrapperRef =
    useRef(null);

  const triggerPositionRef =
    useRef(null);

  const triggerDragRef = useRef({
    active: false,
    dragged: false,
    pointerId: null,

    startPointerX: 0,
    startPointerY: 0,

    startX: 0,
    startY: 0,
  });

  // =========================================================
  // KEEP REFS CURRENT
  // =========================================================

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    isTypingRef.current =
      isTyping;
  }, [isTyping]);

  // =========================================================
  // ROLE CHANGE
  // Keep Admin / Super Admin conversations isolated.
  // =========================================================

  useEffect(() => {
    if (
      previousRoleRef.current ===
      role
    ) {
      return;
    }

    previousRoleRef.current =
      role;

    if (
      responseTimerRef.current
    ) {
      window.clearTimeout(
        responseTimerRef.current
      );

      responseTimerRef.current =
        null;
    }

    setIsTyping(false);
    isTypingRef.current = false;
    setMessage("");

    const stored =
      readStoredMessages(role);

    if (stored) {
      setMessages(stored);
      return;
    }

    setMessages([
      createWelcomeMessage(
        pageContext
      ),
    ]);
  }, [role, pageContext]);

  // =========================================================
  // SAVE CHAT
  // =========================================================

  useEffect(() => {
    saveStoredMessages(
      role,
      messages
    );
  }, [role, messages]);

  // =========================================================
  // OPEN CHAT
  // =========================================================

  const openChat = () => {
    setIsOpen(true);
  };

  // =========================================================
  // CLOSE CHAT
  // =========================================================

  const closeChat = () => {
    setIsOpen(false);
  };

  // =========================================================
  // DESKTOP FOCUS
  // =========================================================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusTimer =
      window.setTimeout(() => {
        const isDesktop =
          window.matchMedia(
            "(min-width: 1024px)"
          ).matches;

        if (isDesktop) {
          inputRef.current?.focus();
        }
      }, 300);

    return () => {
      window.clearTimeout(
        focusTimer
      );
    };
  }, [isOpen]);

  // =========================================================
  // RESTORE FOCUS AFTER CLOSE
  // =========================================================

  useEffect(() => {
    if (isOpen) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        triggerRef.current?.focus({
          preventScroll: true,
        });
      }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isOpen]);

  // =========================================================
  // ESCAPE + FOCUS TRAP
  // =========================================================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (
      event
    ) => {
      if (
        event.key === "Escape"
      ) {
        event.preventDefault();
        closeChat();
        return;
      }

      if (
        event.key !== "Tab"
      ) {
        return;
      }

      const focusable =
        getFocusableElements(
          dialogRef.current
        );

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first =
        focusable[0];

      const last =
        focusable[
        focusable.length - 1
        ];

      const active =
        document.activeElement;

      if (event.shiftKey) {
        if (
          active === first ||
          !dialogRef.current?.contains(
            active
          )
        ) {
          event.preventDefault();
          last.focus();
        }

        return;
      }

      if (
        active === last ||
        !dialogRef.current?.contains(
          active
        )
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isOpen]);

  // =========================================================
  // TIMER CLEANUP
  // =========================================================

  useEffect(() => {
    return () => {
      if (
        responseTimerRef.current
      ) {
        window.clearTimeout(
          responseTimerRef.current
        );

        responseTimerRef.current =
          null;
      }
    };
  }, []);

  // =========================================================
  // PAGE CHANGE
  // =========================================================

  useEffect(() => {
    const previousPath =
      previousPathRef.current;

    if (
      previousPath ===
      location.pathname
    ) {
      return;
    }

    previousPathRef.current =
      location.pathname;

    if (!isOpenRef.current) {
      return;
    }

    const context =
      resolvePageContext(
        location.pathname,
        isSuperAdmin
      );

    if (
      PAGE_CONTEXT[
        location.pathname
      ]?.superAdminOnly &&
      !isSuperAdmin
    ) {
      return;
    }

    const contextMessage = {
      id: createMessageId(
        "context"
      ),
      sender: "bot",
      text: `You're now on ${context.label}. ${context.intro}`,
      contextual: true,
      suggestions:
        context.suggestions || [],
    };

    setMessages((current) => [
      ...current,
      contextMessage,
    ]);
  }, [
    location.pathname,
    isSuperAdmin,
  ]);

  // =========================================================
  // AUTO SCROLL
  // =========================================================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
        block: "end",
      }
    );
  }, [
    messages,
    isTyping,
    isOpen,
  ]);

  // =========================================================
  // CLEAR CHAT
  // =========================================================

  const handleClearChat = () => {
    if (
      responseTimerRef.current
    ) {
      window.clearTimeout(
        responseTimerRef.current
      );

      responseTimerRef.current =
        null;
    }

    setIsTyping(false);
    isTypingRef.current = false;

    setMessage("");

    removeStoredMessages(role);

    setMessages([
      createWelcomeMessage(
        pageContext
      ),
    ]);

    window.setTimeout(() => {
      const isDesktop =
        window.matchMedia(
          "(min-width: 1024px)"
        ).matches;

      if (isDesktop) {
        inputRef.current?.focus();
      }
    }, 50);
  };

  // =========================================================
  // CONTEXTUAL COMMANDS
  // =========================================================

  const getContextualResponse = (
    cleanMessage
  ) => {
    const normalized =
      cleanMessage
        .toLowerCase()
        .replace(/[?.!,]/g, "")
        .trim();

    const currentPageCommands = [
      "where am i",
      "what page am i on",
      "current page",
      "which page am i on",
    ];

    if (
      currentPageCommands.includes(
        normalized
      )
    ) {
      return {
        answer: `You're currently on ${pageContext.label}.\n\n${pageContext.intro}`,
        suggestions:
          pageContext.suggestions,
      };
    }

    const pageHelpCommands = [
      "help on this page",
      "help with this page",
      "what can i do here",
      "what can i do on this page",
    ];

    if (
      pageHelpCommands.includes(
        normalized
      )
    ) {
      return {
        answer: pageContext.intro,
        suggestions:
          pageContext.suggestions,
      };
    }

    return null;
  };

  // =========================================================
  // ADD BOT RESPONSE
  // =========================================================

  const addBotResponse = (
    response
  ) => {
    const safeAction =
      sanitizeAction(
        response?.action,
        role
      );

    const botMessage = {
      id: createMessageId("bot"),

      sender: "bot",

      text:
        response?.answer ||
        fallbackResponse.answer,

      action: safeAction,

      suggestions:
        sanitizeSuggestions(
          response?.suggestions
        ),
    };

    setMessages((current) => [
      ...current,
      botMessage,
    ]);
  };

  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const sendMessage = (text) => {
    const cleanMessage =
      text.trim();

    if (
      !cleanMessage ||
      isTypingRef.current ||
      responseTimerRef.current
    ) {
      return;
    }

    const normalizedCommand =
      cleanMessage.toLowerCase();

    // =======================================================
    // /CLEAR
    // =======================================================

    if (
      normalizedCommand ===
      "/clear"
    ) {
      handleClearChat();
      return;
    }

    // =======================================================
    // USER MESSAGE
    // =======================================================

    const userMessage = {
      id: createMessageId("user"),
      sender: "user",
      text: cleanMessage.slice(
        0,
        4000
      ),
    };

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setMessage("");

    isTypingRef.current = true;
    setIsTyping(true);

    // =======================================================
    // RESPONSE
    // =======================================================

    let response;

    if (
      normalizedCommand ===
      "/help"
    ) {
      response = COMMAND_HELP;
    } else {
      response =
        getContextualResponse(
          cleanMessage
        ) ||
        findAdminChatResponse(
          cleanMessage,
          role
        );
    }

    // =======================================================
    // RESPONSE DELAY
    // =======================================================

    responseTimerRef.current =
      window.setTimeout(() => {
        addBotResponse(response);

        isTypingRef.current = false;
        setIsTyping(false);

        responseTimerRef.current =
          null;
      }, RESPONSE_DELAY);
  };

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    sendMessage(message);
  };

  // =========================================================
  // SAFE NAVIGATION ACTION
  // =========================================================

  const handleAction = (
    route
  ) => {
    if (
      typeof route !== "string"
    ) {
      return;
    }

    const allowedRoutes =
      getAllowedRoutes(role);

    if (
      !allowedRoutes.has(route)
    ) {
      return;
    }

    navigate(route);
  };

  // =========================================================
  // LATEST BOT MESSAGE FOR SCREEN READERS
  // =========================================================

  const latestBotAnnouncement =
    useMemo(() => {
      for (
        let index =
          messages.length - 1;
        index >= 0;
        index -= 1
      ) {
        if (
          messages[index]
            ?.sender === "bot"
        ) {
          return messages[index]
            .text;
        }
      }

      return "";
    }, [messages]);

  // =========================================================
  // RESTORE MOVABLE TRIGGER POSITION
  // =========================================================

  useEffect(() => {
    if (isOpen) {
      return;
    }

    const frame =
      window.requestAnimationFrame(
        () => {
          const element =
            triggerWrapperRef.current;

          if (!element) {
            return;
          }

          const stored =
            readTriggerPosition();

          if (stored) {
            const position =
              clampTriggerPosition(
                stored,
                element
              );

            triggerPositionRef.current =
              position;

            setTriggerPosition(
              position
            );

            return;
          }

          // No stored position.
          // Keep original CSS bottom-right position.
          triggerPositionRef.current =
            null;

          setTriggerPosition(null);
        }
      );

    return () => {
      window.cancelAnimationFrame(
        frame
      );
    };
  }, [isOpen]);

  // =========================================================
  // KEEP TRIGGER INSIDE VIEWPORT
  // =========================================================

  useEffect(() => {
    const handleResize = () => {
      const element =
        triggerWrapperRef.current;

      const current =
        triggerPositionRef.current;

      if (!element || !current) {
        return;
      }

      const next =
        clampTriggerPosition(
          current,
          element
        );

      triggerPositionRef.current =
        next;

      setTriggerPosition(next);

      saveTriggerPosition(next);
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);

  // =========================================================
  // MOVABLE TRIGGER — POINTER DOWN
  // =========================================================

  const handleTriggerPointerDown = (
    event
  ) => {
    // Only primary/left mouse button.
    if (
      event.pointerType === "mouse" &&
      event.button !== 0
    ) {
      return;
    }

    const element =
      triggerWrapperRef.current;

    if (!element) {
      return;
    }

    const rect =
      element.getBoundingClientRect();

    triggerDragRef.current = {
      active: true,
      dragged: false,

      pointerId:
        event.pointerId,

      startPointerX:
        event.clientX,

      startPointerY:
        event.clientY,

      startX:
        rect.left,

      startY:
        rect.top,
    };

    element.setPointerCapture?.(
      event.pointerId
    );
  };

  // =========================================================
  // MOVABLE TRIGGER — POINTER MOVE
  // =========================================================

  const handleTriggerPointerMove = (
    event
  ) => {
    const drag =
      triggerDragRef.current;

    if (
      !drag.active ||
      drag.pointerId !==
      event.pointerId
    ) {
      return;
    }

    const deltaX =
      event.clientX -
      drag.startPointerX;

    const deltaY =
      event.clientY -
      drag.startPointerY;

    const distance =
      Math.hypot(
        deltaX,
        deltaY
      );

    if (
      !drag.dragged &&
      distance <
      CHAT_TRIGGER_DRAG_THRESHOLD
    ) {
      return;
    }

    drag.dragged = true;

    event.preventDefault();

    const element =
      triggerWrapperRef.current;

    if (!element) {
      return;
    }

    const next =
      clampTriggerPosition(
        {
          x:
            drag.startX +
            deltaX,

          y:
            drag.startY +
            deltaY,
        },
        element
      );

    triggerPositionRef.current =
      next;

    setTriggerPosition(next);
  };

  // =========================================================
  // MOVABLE TRIGGER — POINTER UP
  // =========================================================

  const handleTriggerPointerUp = (
    event
  ) => {
    const drag =
      triggerDragRef.current;

    if (
      !drag.active ||
      drag.pointerId !==
      event.pointerId
    ) {
      return;
    }

    const wasDragged =
      drag.dragged;

    const element =
      triggerWrapperRef.current;

    if (
      element?.hasPointerCapture?.(
        event.pointerId
      )
    ) {
      element.releasePointerCapture(
        event.pointerId
      );
    }

    // Save only after a real drag.
    if (
      wasDragged &&
      triggerPositionRef.current
    ) {
      saveTriggerPosition(
        triggerPositionRef.current
      );
    }

    drag.active = false;
    drag.pointerId = null;

    // IMPORTANT:
    // A normal click/tap opens the chatbot.
    if (!wasDragged) {
      openChat();
    }
  };

  // =========================================================
  // MOVABLE TRIGGER — POINTER CANCEL
  // =========================================================

  const handleTriggerPointerCancel = (
    event
  ) => {
    const drag =
      triggerDragRef.current;

    if (
      drag.pointerId !==
      event.pointerId
    ) {
      return;
    }

    drag.active = false;
    drag.dragged = false;
    drag.pointerId = null;
  };

  // =========================================================
  // KEYBOARD CLICK
  // =========================================================

  const handleTriggerClick = (
    event
  ) => {
    // Mouse/touch activation is already handled
    // by pointer-up above.
    //
    // Keyboard-generated click events have detail === 0.
    if (event.detail !== 0) {
      return;
    }

    openChat();
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <>
      {/* Screen reader announcement */}

      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {latestBotAnnouncement}
      </div>

      {/* =====================================================
          MOVABLE FLOATING BUTTON
          ORIGINAL UI PRESERVED
      ===================================================== */}

      <div
        ref={triggerWrapperRef}
        onPointerDown={
          handleTriggerPointerDown
        }
        onPointerMove={
          handleTriggerPointerMove
        }
        onPointerUp={
          handleTriggerPointerUp
        }
        onPointerCancel={
          handleTriggerPointerCancel
        }
        style={
          triggerPosition
            ? {
              left:
                triggerPosition.x,
              top:
                triggerPosition.y,
            }
            : undefined
        }
        className={`fixed z-[80] touch-none ${triggerPosition
          ? ""
          : "bottom-[92px] right-4 lg:bottom-6 lg:right-6"
          }`}
      >
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              ref={triggerRef}
              type="button"
              onClick={
                handleTriggerClick
              }
              initial={{
                opacity: 0,
                scale: 0.8,
                y: 12,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.85,
                y: 8,
              }}
              whileHover={{
                y: -2,
              }}
              whileTap={{
                scale: 0.96,
              }}
              aria-label="Open QUIZTIANS Assistant"
              aria-haspopup="dialog"
              aria-expanded={isOpen}
              className="group relative flex h-[54px] items-center gap-2.5 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141418] px-3.5 text-white shadow-[0_18px_55px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:h-[58px] sm:px-4"
            >
              <div
                className="pointer-events-none absolute -left-5 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full blur-2xl"
                style={{
                  backgroundColor:
                    `${accent}22`,
                }}
              />

              <div
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
                style={{
                  backgroundColor:
                    `${accent}12`,
                  borderColor:
                    `${accent}25`,
                  color: accent,
                }}
              >
                <MessageCircle
                  size={17}
                />

                <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-[#141418]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
              </div>

              <div className="relative hidden text-left sm:block">
                <p className="text-[11px] font-black leading-none text-zinc-200">
                  Need help?
                </p>

                <p className="mt-1 text-[9px] font-semibold text-zinc-600">
                  Ask QUIZTIANS
                </p>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* =====================================================
          CHAT PANEL
      ===================================================== */}

      <AnimatePresence>
        {isOpen && (
          <>
            {/* MOBILE BACKDROP */}

            <motion.button
              type="button"
              tabIndex={-1}
              aria-label="Close assistant"
              onClick={closeChat}
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="fixed inset-0 z-[88] cursor-default bg-black/65 backdrop-blur-sm lg:hidden"
            />

            {/* PANEL WRAPPER */}

            <div className="pointer-events-none fixed inset-0 z-[90] flex items-end justify-center lg:items-end lg:justify-end lg:p-6">
              <motion.section
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-chatbot-title"
                aria-describedby="admin-chatbot-description"
                initial={{
                  opacity: 0,
                  y: 50,
                  scale: 0.98,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: 35,
                  scale: 0.98,
                }}
                transition={{
                  duration: 0.28,
                  ease: [
                    0.22,
                    1,
                    0.36,
                    1,
                  ],
                }}
                className="
                  pointer-events-auto
                  relative
                  flex
                  h-[min(720px,92dvh)]
                  w-full
                  flex-col
                  overflow-hidden
                  rounded-t-[28px]
                  border
                  border-white/[0.08]
                  bg-[#101014]
                  shadow-[0_-24px_80px_rgba(0,0,0,0.6)]
                  sm:w-[430px]
                  lg:h-[620px]
                  lg:w-[390px]
                  lg:rounded-[26px]
                  lg:shadow-[0_30px_100px_rgba(0,0,0,0.65)]
                "
              >
                {/* TOP ACCENT */}

                <div
                  className="absolute inset-x-0 top-0 h-px"
                  style={{
                    background: `linear-gradient(to right, transparent, ${accent}90, transparent)`,
                  }}
                />

                {/* GLOW */}

                <div
                  className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full blur-[80px]"
                  style={{
                    backgroundColor:
                      `${accent}10`,
                  }}
                />

                {/* MOBILE HANDLE */}

                <div className="relative flex shrink-0 justify-center pt-3 lg:hidden">
                  <div className="h-1 w-10 rounded-full bg-white/10" />
                </div>

                {/* =================================================
                    HEADER
                ================================================= */}

                <header className="relative shrink-0 border-b border-white/[0.055] px-4 pb-4 pt-3 lg:px-5 lg:py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                        style={{
                          backgroundColor:
                            `${accent}10`,
                          borderColor:
                            `${accent}20`,
                          color: accent,
                        }}
                      >
                        <Bot
                          size={18}
                        />

                        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-[#101014] bg-emerald-400" />
                      </div>

                      <div className="min-w-0">
                        <h2
                          id="admin-chatbot-title"
                          className="truncate text-[13px] font-black text-zinc-100"
                        >
                          QUIZTIANS Assistant
                        </h2>

                        <p
                          id="admin-chatbot-description"
                          className="mt-1 flex items-center gap-1.5 text-[9px] font-semibold text-zinc-600"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                          Contextual Admin Help
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      {/* CLEAR */}

                      <button
                        type="button"
                        onClick={
                          handleClearChat
                        }
                        title="Clear chat"
                        aria-label="Clear chat"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/[0.05] hover:text-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                      >
                        <RotateCcw
                          size={13}
                        />
                      </button>

                      {/* MINIMIZE */}

                      <button
                        type="button"
                        onClick={closeChat}
                        aria-label="Minimize assistant"
                        className="hidden h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/[0.05] hover:text-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 lg:flex"
                      >
                        <Minimize2
                          size={14}
                        />
                      </button>

                      {/* CLOSE */}

                      <button
                        type="button"
                        onClick={closeChat}
                        aria-label="Close assistant"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-white/[0.05] hover:text-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>

                  {/* =============================================
                      CURRENT PAGE
                  ============================================= */}

                  <div
                    className="mt-3 flex items-center gap-2 rounded-xl border px-3 py-2"
                    style={{
                      borderColor:
                        `${accent}15`,
                      backgroundColor:
                        `${accent}07`,
                    }}
                  >
                    <ContextIcon
                      size={12}
                      style={{
                        color: accent,
                      }}
                    />

                    <span className="text-[8px] font-black uppercase tracking-[0.12em] text-zinc-600">
                      Current page
                    </span>

                    <span
                      className="ml-auto truncate text-[9px] font-bold"
                      style={{
                        color: accent,
                      }}
                    >
                      {pageContext.label}
                    </span>
                  </div>
                </header>

                {/* =================================================
                    MESSAGES
                ================================================= */}

                <div className="admin-hidden-scrollbar relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  <div className="px-4 py-5 lg:px-5">
                    <div className="space-y-4">
                      {messages.map(
                        (item) => {
                          const isUser =
                            item.sender ===
                            "user";

                          return (
                            <motion.div
                              key={item.id}
                              initial={{
                                opacity: 0,
                                y: 8,
                              }}
                              animate={{
                                opacity: 1,
                                y: 0,
                              }}
                              className={`flex items-start gap-2.5 ${isUser
                                ? "justify-end"
                                : "justify-start"
                                }`}
                            >
                              {/* BOT ICON */}

                              {!isUser && (
                                <div
                                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                                  style={{
                                    backgroundColor:
                                      `${accent}0D`,
                                    borderColor:
                                      `${accent}18`,
                                    color:
                                      accent,
                                  }}
                                >
                                  <Sparkles
                                    size={
                                      12
                                    }
                                  />
                                </div>
                              )}

                              {/* MESSAGE */}

                              <div className="max-w-[82%]">
                                <div
                                  className={
                                    isUser
                                      ? "rounded-2xl rounded-tr-md px-4 py-3"
                                      : "rounded-2xl rounded-tl-md border border-white/[0.06] bg-[#16161B] px-4 py-3"
                                  }
                                  style={
                                    isUser
                                      ? {
                                        backgroundColor:
                                          `${accent}18`,
                                        border: `1px solid ${accent}22`,
                                      }
                                      : undefined
                                  }
                                >
                                  <p className="whitespace-pre-wrap text-[11px] font-medium leading-5 text-zinc-300">
                                    {
                                      item.text
                                    }
                                  </p>

                                  {/* ACTION */}

                                  {!isUser &&
                                    item.action && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleAction(
                                            item
                                              .action
                                              .route
                                          )
                                        }
                                        className="mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-[9px] font-black transition hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                                        style={{
                                          borderColor:
                                            `${accent}20`,
                                          backgroundColor:
                                            `${accent}08`,
                                          color:
                                            accent,
                                        }}
                                      >
                                        {
                                          item
                                            .action
                                            .label
                                        }

                                        <ArrowRight
                                          size={
                                            11
                                          }
                                        />
                                      </button>
                                    )}

                                  {/* FOLLOW-UP SUGGESTIONS */}

                                  {!isUser &&
                                    item
                                      .suggestions
                                      ?.length >
                                    0 && (
                                      <div className="mt-3 space-y-1.5 border-t border-white/[0.05] pt-3">
                                        {item.suggestions
                                          .slice(
                                            0,
                                            3
                                          )
                                          .map(
                                            (
                                              suggestion
                                            ) => (
                                              <button
                                                key={
                                                  suggestion
                                                }
                                                type="button"
                                                disabled={
                                                  isTyping
                                                }
                                                onClick={() =>
                                                  sendMessage(
                                                    suggestion
                                                  )
                                                }
                                                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[9px] font-semibold text-zinc-600 transition hover:bg-white/[0.035] hover:text-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                                              >
                                                <ArrowRight
                                                  size={
                                                    9
                                                  }
                                                  style={{
                                                    color:
                                                      accent,
                                                  }}
                                                />

                                                {
                                                  suggestion
                                                }
                                              </button>
                                            )
                                          )}
                                      </div>
                                    )}
                                </div>

                                <p className="mt-1.5 px-1 text-[8px] font-medium text-zinc-800">
                                  {isUser
                                    ? "You"
                                    : item.contextual
                                      ? "Page context"
                                      : "QUIZTIANS"}
                                </p>
                              </div>
                            </motion.div>
                          );
                        }
                      )}

                      {/* =========================================
                          TYPING
                      ========================================= */}

                      <AnimatePresence>
                        {isTyping && (
                          <motion.div
                            initial={{
                              opacity: 0,
                              y: 6,
                            }}
                            animate={{
                              opacity: 1,
                              y: 0,
                            }}
                            exit={{
                              opacity: 0,
                            }}
                            className="flex items-start gap-2.5"
                          >
                            <div
                              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                              style={{
                                backgroundColor:
                                  `${accent}0D`,
                                borderColor:
                                  `${accent}18`,
                                color:
                                  accent,
                              }}
                            >
                              <Sparkles
                                size={12}
                              />
                            </div>

                            <div className="rounded-2xl rounded-tl-md border border-white/[0.06] bg-[#16161B] px-4 py-3.5">
                              <div className="flex items-center gap-1">
                                {[
                                  0,
                                  1,
                                  2,
                                ].map(
                                  (
                                    index
                                  ) => (
                                    <motion.span
                                      key={
                                        index
                                      }
                                      animate={{
                                        opacity:
                                          [
                                            0.25,
                                            1,
                                            0.25,
                                          ],
                                        y: [
                                          0,
                                          -2,
                                          0,
                                        ],
                                      }}
                                      transition={{
                                        duration:
                                          0.9,
                                        repeat:
                                          Infinity,
                                        delay:
                                          index *
                                          0.14,
                                      }}
                                      className="h-1.5 w-1.5 rounded-full bg-zinc-500"
                                    />
                                  )
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div
                        ref={
                          messagesEndRef
                        }
                      />
                    </div>

                    {/* =============================================
                        PAGE-AWARE QUICK QUESTIONS
                    ============================================= */}

                    {messages.length ===
                      1 &&
                      !isTyping && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            y: 10,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          className="mt-6"
                        >
                          <div className="mb-2.5 flex items-center gap-2">
                            <ContextIcon
                              size={10}
                              style={{
                                color:
                                  accent,
                              }}
                            />

                            <p className="text-[8px] font-black uppercase tracking-[0.14em] text-zinc-700">
                              Suggested for{" "}
                              {
                                pageContext.label
                              }
                            </p>
                          </div>

                          <div className="grid gap-2">
                            {pageContext.suggestions.map(
                              (
                                suggestion
                              ) => (
                                <button
                                  key={
                                    suggestion
                                  }
                                  type="button"
                                  disabled={
                                    isTyping
                                  }
                                  onClick={() =>
                                    sendMessage(
                                      suggestion
                                    )
                                  }
                                  className="group flex min-h-[44px] w-full items-center gap-3 rounded-xl border border-white/[0.055] bg-white/[0.018] px-3 text-left transition hover:border-white/[0.1] hover:bg-white/[0.035] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <div
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                                    style={{
                                      backgroundColor:
                                        `${accent}0B`,
                                      color:
                                        accent,
                                    }}
                                  >
                                    <BookOpen
                                      size={
                                        12
                                      }
                                    />
                                  </div>

                                  <span className="min-w-0 flex-1 text-[10px] font-bold text-zinc-500 transition group-hover:text-zinc-300">
                                    {
                                      suggestion
                                    }
                                  </span>

                                  <ArrowRight
                                    size={
                                      11
                                    }
                                    className="text-zinc-800 transition group-hover:translate-x-0.5 group-hover:text-zinc-500"
                                  />
                                </button>
                              )
                            )}
                          </div>
                        </motion.div>
                      )}
                  </div>
                </div>

                {/* =================================================
                    INPUT
                ================================================= */}

                <footer className="relative shrink-0 border-t border-white/[0.055] bg-[#101014]/95 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl lg:px-5 lg:pb-4">
                  <form
                    onSubmit={
                      handleSubmit
                    }
                    className="flex items-end gap-2"
                  >
                    <textarea
                      ref={inputRef}
                      value={message}
                      maxLength={4000}
                      onChange={(
                        event
                      ) =>
                        setMessage(
                          event.target
                            .value
                        )
                      }
                      onKeyDown={(
                        event
                      ) => {
                        if (
                          event.key ===
                          "Enter" &&
                          !event.shiftKey
                        ) {
                          event.preventDefault();

                          sendMessage(
                            message
                          );
                        }
                      }}
                      rows={1}
                      disabled={
                        isTyping
                      }
                      placeholder={
                        isTyping
                          ? "Assistant is replying..."
                          : `Ask about ${pageContext.label}...`
                      }
                      aria-label="Message QUIZTIANS Assistant"
                      className="
                        min-h-[48px]
                        max-h-28
                        min-w-0
                        flex-1
                        resize-none
                        rounded-2xl
                        border
                        border-white/[0.07]
                        bg-[#16161B]
                        px-4
                        py-[14px]
                        text-[11px]
                        font-medium
                        leading-5
                        text-zinc-300
                        outline-none
                        transition
                        placeholder:text-zinc-700
                        focus:border-white/[0.12]
                        focus:ring-4
                        focus:ring-white/[0.02]
                        disabled:cursor-wait
                        disabled:opacity-60
                      "
                    />

                    <motion.button
                      type="submit"
                      whileTap={{
                        scale: 0.94,
                      }}
                      disabled={
                        !message.trim() ||
                        isTyping
                      }
                      aria-label="Send message"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:bg-[#19191E] disabled:text-zinc-700 disabled:shadow-none"
                      style={
                        message.trim() &&
                          !isTyping
                          ? {
                            background: `linear-gradient(135deg, ${accent}, ${accent}CC)`,
                          }
                          : undefined
                      }
                    >
                      <ArrowUp
                        size={16}
                      />
                    </motion.button>
                  </form>

                  <div className="mt-2 flex items-center justify-center gap-1.5">
                    <ContextIcon
                      size={8}
                      className="text-zinc-800"
                    />

                    <p className="text-center text-[8px] font-medium text-zinc-800">
                      Helping with{" "}
                      {
                        pageContext.label
                      }
                    </p>
                  </div>
                </footer>
              </motion.section>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}