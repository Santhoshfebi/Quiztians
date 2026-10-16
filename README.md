
<img width="1536" height="1024" alt="banner imag" src="https://github.com/user-attachments/assets/8fa72830-1826-434d-8671-112c0f1b7b25" />

🧠 Quiztians

An interactive bilingual (English / Tamil) quiz platform built with React and Supabase.
Participants can join scheduled Bible-themed quizzes, track their scores, and view the leaderboard — while admins manage results securely through a protected admin panel.

🌐 Live Demo

🚀 View Quiztians Live

 https://quiztians.vercel.app/

📸 Preview:

<img width="1901" height="873" alt="welcomepage" src="https://github.com/user-attachments/assets/41f70773-816e-4690-b5dd-26668d64f8ef" />
<img width="1898" height="870" alt="welcomewithtime" src="https://github.com/user-attachments/assets/cfd6747b-89db-44fb-937d-a8701547b7eb" />
<img width="1918" height="872" alt="quizpagewithalert" src="https://github.com/user-attachments/assets/b03db9e1-fa6a-4fc2-9cef-f8ea7a535e98" />
<img width="1900" height="851" alt="Resultpage" src="https://github.com/user-attachments/assets/8525d865-a560-41da-85e8-6843c4adca3b" />
<img width="882" height="647" alt="adminlogin" src="https://github.com/user-attachments/assets/ce6d2550-b111-4f56-8ffc-2b4b9db96326" />
<img width="1918" height="870" alt="adminpannel" src="https://github.com/user-attachments/assets/475c83a5-a291-4b18-a850-bf8ffe216d83" />

✨ Features
🎯 For Participants

Beautiful welcome page with English / Tamil language selection

Countdown timer for upcoming quizzes

Timed quiz (20 minutes / Quiz configuration from admin) with instant feedback

Automatic submission when time expires

Score summary and leaderboard at the end

Option to join a community via WhatsApp

🔐 For Admins

Secure email / password login with role-based access (admin / superadmin only)

View all quiz participants and their scores

Admins can add / delete / edit Questions

Admins can configure Quiz duration and start time

Delete or export participant data (CSV)

Built-in session protection — non-admins are automatically redirected

🧰 Tech Stack

Frontend: React + Vite

Styling: Tailwind CSS + Framer Motion

Backend & Auth: Supabase (PostgreSQL + Auth)

Routing: React Router DOM

Animations: Framer Motion

Deployment: Vercel

💡 Inspiration

Quiztians was built for church quiz programs, youth events, and learning competitions.
It bridges faith and technology — enabling a fun, competitive, and educational experience.

# 🧠 QUIZTIANS V2

> **Learn • Play • Compete**

QUIZTIANS V2 is a modern, mobile-first bilingual quiz platform built with **React** and **Supabase**.

Designed primarily for church quiz programs, youth events, and learning competitions, QUIZTIANS combines learning, competition, realtime functionality, and administration into a responsive full-stack web application.

V2 introduces a completely redesigned participant experience, an expanded administration system, realtime functionality, role-based administration, analytics, activity monitoring, and a built-in admin assistant.

---

## 🌐 Live Application

🚀 **QUIZTIANS V2**

https://quiztians.vercel.app/

---

## ✨ V2 Highlights

- 🎨 Complete Premium Dark redesign
- 📱 Mobile-first responsive participant experience
- 🌐 English / Tamil interface
- ⏱️ Scheduled and timed quizzes
- 🛡️ Duplicate-attempt protection
- 🚦 Dedicated quiz Ready Room
- 🎮 Responsive quiz experience
- 🏆 Redesigned result experience
- 🔍 Answer review
- ⚡ Supabase Realtime integration
- 📊 Expanded Admin Dashboard
- 📈 Results analytics
- 📝 Administrative Activity Logs
- 🔐 Login monitoring
- 👥 Admin / Super Admin management
- 🤖 Built-in Basic Admin Chatbot
- 🧩 Improved reusable component architecture
- 🎬 Smooth Framer Motion animations

---

# 🎯 Participant Experience

## 🏠 Welcome Page

The redesigned Welcome page acts as the main entry point into QUIZTIANS.

Features include:

- Premium Dark interface
- English / Tamil UI
- Live quiz status
- Upcoming quiz countdown
- Active chapter information
- Quiz availability status
- Responsive registration experience
- Mobile-first layout
- Smooth animations and transitions
- QUIZTIANS anniversary experience

---

## 📝 Quiz Registration

Participants can register for an available quiz by providing:

- Name
- Phone number
- Place
- Preferred quiz language
- Quiz chapter

Participant information is validated before continuing to the quiz.

---

## 🛡️ Duplicate Attempt Protection

Before allowing a participant to continue, QUIZTIANS checks whether the participant has already completed the selected chapter.

```text
Participant enters details
          ↓
Check previous attempt
          ↓
     Attempt exists?
       ↙        ↘
     YES         NO
      ↓           ↓
Result Ticket   Ready Room
```

If an attempt already exists, the participant is redirected to the **Already Attempted / Result Ticket** experience instead of starting another attempt.

---

# 🚦 Ready Room

Before entering the quiz, participants are taken to a dedicated Ready Room.

The Ready Room provides:

- Participant information
- Quiz information
- Quiz rules
- Preparation instructions
- Rotating quiz tips
- Pre-quiz countdown
- Responsive mobile interface

This provides a clear transition between registration and the actual quiz.

---

# 🎮 Quiz Experience

The quiz system provides:

- Chapter-based quizzes
- Configurable quiz duration
- English / Tamil support
- Timed quiz sessions
- Question navigation
- Participant progress
- Automatic submission when time expires
- Responsive mobile-first interface

Quiz configuration can be controlled from the administration system.

---

# 🏆 Result Experience

After completing a quiz, participants are shown their result.

The result experience provides information such as:

- Participant score
- Total questions
- Quiz performance
- Chapter information
- Result summary

Participants who previously completed the quiz are presented with a dedicated **Result Ticket / Already Attempted** experience.

---

# 🔍 Review Answers

Participants can review their completed quiz through the Review Answers experience.

This allows participants to understand:

- Questions
- Their selected answers
- Correct answers
- Individual question results
- Overall quiz performance

---

# 🛡️ Administration System

QUIZTIANS V2 includes a complete responsive administration environment.

The administration system uses two primary roles:

### 👤 Admin

Handles normal quiz administration and management.

### 👑 Super Admin

Provides additional administrative capabilities and higher-level system management.

---

# 📊 Admin Dashboard

The Admin Dashboard provides a centralized overview of the QUIZTIANS platform.

It includes:

- Quiz statistics
- Participant statistics
- Quiz status
- Recent activity
- Live activity
- Administrative navigation
- Responsive dashboard cards
- Role-aware interface

The dashboard provides administrators with a quick understanding of current quiz activity.

---

# ❓ Question Management

Administrators can manage quiz questions directly through the admin system.

Features include:

- Add questions
- Edit questions
- Delete questions
- Preview questions
- Chapter-based question management
- Quiz preview

This allows quiz content to be maintained without modifying application source code.

---

# ⚙️ Quiz Configuration

Administrators can configure quiz behaviour through the administration interface.

Configuration options include:

- Quiz start time
- Quiz duration
- Active chapters
- Quiz availability

Selected configuration changes can be reflected in connected clients through Supabase Realtime.

---

# 📈 Results & Analytics

QUIZTIANS V2 includes an expanded Results system.

Administrators can:

- View participant results
- Search participants
- Filter results
- View score statistics
- View analytics charts
- Navigate paginated results
- Reset participant results
- Reset quiz results

The interface provides:

- Responsive desktop tables
- Mobile result cards
- Statistics
- Charts
- Filters
- Pagination

---

# 📝 Activity Logs

QUIZTIANS records administrative activity for monitoring and review.

The Activity Logs interface provides:

- Administrator activity history
- Module information
- Action information
- Search
- Module filtering
- Action filtering
- Pagination
- Timeline view
- Responsive desktop/mobile layouts

This provides greater visibility into administrative actions performed inside the platform.

---

# 🔐 Login Logs

Super Administrators can review administrator login activity.

The Login Logs interface includes:

- Login history
- Administrator email
- Administrator role
- Login status
- Device information
- Browser information
- Search
- Role filtering
- Status filtering
- Device filtering
- Browser filtering
- Pagination
- Login statistics

---

# 👥 Admin User Management

Super Administrators can manage administrative accounts.

Supported functionality includes:

- Invite administrators
- Assign Admin role
- Assign Super Admin role
- Activate administrator accounts
- Disable administrator accounts
- Delete administrator accounts
- View invitation status
- Search administrators
- Filter administrator accounts
- Pagination

The interface also includes protections around administrative account management.

---

# 🤖 Basic Admin Chatbot

QUIZTIANS V2 includes a built-in administrative assistant available throughout the admin interface.

The chatbot provides:

- Predefined administrative assistance
- Quick questions
- Context-aware responses
- Navigation shortcuts
- `/help` command
- `/clear` command
- Role-aware navigation
- Session-based conversation history
- Keyboard accessibility
- Responsive mobile experience
- Movable floating launcher

The current chatbot intentionally operates without an external AI API.

Its architecture follows:

```text
Admin Question
      ↓
Intent / Keyword Matcher
      ↓
Admin Knowledge Base
      ↓
Prepared Response
```

This provides predictable assistance without exposing external API credentials.

---

# ⚡ Realtime Functionality

QUIZTIANS uses **Supabase Realtime** for selected live application updates.

For example:

```text
Administrator updates configuration
              ↓
       PostgreSQL changes
              ↓
       Supabase Realtime
              ↓
        React receives event
              ↓
          UI updates
```

This allows parts of the application to react to backend changes without requiring a full browser refresh.

---

# 🔐 Authentication & Authorization

QUIZTIANS uses Supabase authentication for the administration system.

The application distinguishes between:

### Authentication

Determines **who the administrator is**.

### Authorization

Determines **what the authenticated administrator is allowed to access or perform**.

Administrative functionality is separated between:

```text
Admin
  │
  ├── Dashboard
  ├── Questions
  ├── Quiz Configuration
  ├── Results
  └── Activity Logs


Super Admin
  │
  ├── Admin capabilities
  ├── Login Logs
  └── Admin User Management
```

---

# 🏗️ Application Architecture

QUIZTIANS follows a modern full-stack architecture.

```text
             PARTICIPANT / ADMIN
                     │
                     ▼
              React Frontend
                     │
          ┌──────────┼──────────┐
          │          │          │
          ▼          ▼          ▼
     React Router  Tailwind  Framer Motion
                     │
                     ▼
              Supabase JS SDK
                     │
                     ▼
                 SUPABASE
          ┌──────────┼───────────┐
          │          │           │
          ▼          ▼           ▼
    PostgreSQL     Auth       Realtime
          │
          │
          └──────────────┐
                         ▼
                  Edge Functions
```

---

# 🔄 Application Flow

The primary participant flow is:

```text
Welcome / Home
      │
      ▼
   Join Quiz
      │
      ▼
  Ready Room
      │
      ▼
     Quiz
      │
      ▼
    Result
      │
      ▼
Review Answers
```

For participants who already completed a quiz:

```text
Welcome
   │
   ▼
Attempt Check
   │
   ▼
Already Attempted
   │
   ▼
Result Ticket
```

---

# 🧰 Technology Stack

## ⚛️ Frontend

### React

Used to build the component-based user interface and manage interactive application state.

### Vite

Used as the frontend development and build tool.

### JavaScript / JSX

Used for application logic, component behaviour, validation, data handling, and UI rendering.

---

## 🎨 Styling

### Tailwind CSS

Used to build the responsive interface using utility-first CSS.

QUIZTIANS follows a mobile-first responsive design approach.

---

## 🎬 Animation

### Framer Motion

Used for:

- Modal animations
- Component transitions
- Page entrances
- Interactive feedback
- Celebration experiences
- Admin UI animations

### DotLottie / Lottie

Used for lightweight animated assets and loading experiences.

---

## 🧭 Routing

### React Router DOM

Used for client-side application navigation and route-based experiences.

---

## 🎯 Icons

### Lucide React

Used throughout the application for consistent interface icons.

---

## 🗄️ Backend

### Supabase

Supabase provides the primary backend infrastructure for QUIZTIANS.

---

## 🐘 Database

### PostgreSQL

Application data is stored using PostgreSQL through Supabase.

The database stores information such as:

- Quiz configuration
- Questions
- Participant results
- Administrative information
- Activity records
- Login-related information

---

## 🔐 Authentication

### Supabase Auth

Used for authenticated administrator access.

---

## ⚡ Realtime

### Supabase Realtime

Used to subscribe to selected PostgreSQL changes and update connected React clients.

---

## ⚙️ Server-Side Operations

### Supabase Edge Functions

Used for selected privileged backend operations that should not be handled directly by browser-side code.

---

## 🚀 Deployment

### Vercel

QUIZTIANS is deployed as a web application using Vercel.

---

# 📱 Mobile-First Responsive Design

QUIZTIANS V2 was designed with mobile participants as a primary focus.

The participant interface is optimized for small smartphone displays and progressively enhanced for larger screens.

The administration system adapts across:

```text
Mobile
   ↓
Tablet
   ↓
Laptop
   ↓
Desktop
```

Tailwind CSS responsive breakpoints are used throughout the application to provide layouts appropriate for each screen size.

---

# 🎨 Design System

QUIZTIANS V2 uses a consistent **Premium Dark** visual system.

The design focuses on:

- Dark surfaces
- High readability
- Subtle borders
- Controlled gradients
- Violet / indigo accents
- Role-aware admin accents
- Restrained animations
- Responsive typography
- Consistent spacing
- Reusable cards and layouts

The goal is to provide a modern interface without distracting from the quiz experience.

---

# 🧩 Component-Based Architecture

QUIZTIANS uses reusable React components to reduce duplication and improve maintainability.

The administration system uses a shared layout architecture:

```text
AdminLayout
    │
    ├── Dashboard
    ├── Questions
    ├── Quiz Configuration
    ├── Results
    ├── Activity Logs
    ├── Login Logs
    └── Admin Users
```

Larger features are further divided into smaller components.

For example:

```text
Results
  │
  ├── Results Hero
  ├── Results Stats
  ├── Results Charts
  ├── Results Filters
  ├── Results Table
  ├── Loading State
  └── Reset Dialogs
```

This architecture improves:

- Maintainability
- Reusability
- Separation of concerns
- UI consistency
- Future scalability

---

# 📸 VERSION 2 Preview

> Add the latest QUIZTIANS V2 screenshots below.

## 🏠 Welcome Page

<!-- Add V2 Welcome Page screenshot -->

---

## 🚦 Ready Room

<!-- Add V2 Ready Room screenshot -->

---

## 🎮 Quiz

<!-- Add V2 Quiz screenshot -->

---

## 🏆 Results

<!-- Add V2 Result screenshot -->

---

## 📊 Admin Dashboard

<!-- Add V2 Admin Dashboard screenshot -->

---

## 📈 Results Analytics

<!-- Add V2 Results Analytics screenshot -->

---

## 📝 Activity Logs

<!-- Add V2 Activity Logs screenshot -->

---

## 👥 Admin Management

<!-- Add V2 Admin Users screenshot -->

---

## 🤖 Admin Chatbot

<!-- Add V2 Admin Chatbot screenshot -->

---

# 💡 Project Purpose

QUIZTIANS was created for:

- Church quiz programs
- Youth events
- Bible quizzes
- Learning competitions
- Community-based quiz events

The project combines technology, learning, competition, and community into a single accessible platform.

---

# 🚀 V2 Goals

The primary goals of QUIZTIANS V2 were to:

1. Improve the participant experience
2. Build a consistent responsive design system
3. Expand administrative capabilities
4. Improve realtime functionality
5. Improve maintainability through reusable components
6. Provide better result analytics and monitoring
7. Support multiple administrative roles
8. Improve mobile usability
9. Create a stronger foundation for future QUIZTIANS development

---

# 🔮 Future Development

QUIZTIANS V2 provides a foundation that can be extended with features such as:

- Additional analytics
- Advanced reporting
- Improved participant management
- Additional administrative tools
- Expanded notification capabilities
- AI-assisted administrative functionality

---

# 💜 QUIZTIANS

**Learn • Play • Compete**

Built with 💜 for the QUIZTIANS community.
