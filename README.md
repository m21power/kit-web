# Kit Playground Web

Kit Playground is a VS Code-inspired web application for exploring version control concepts using a custom "Kit" system. It features a file explorer, code editor, terminal with Kit commands, rating system, and feedback submission.

## Features

- **VS Code-like UI**: File explorer, code editor, and integrated terminal.
- **Custom Version Control**: Use Kit commands (`kit init`, `kit add`, `kit commit`, etc.) in the terminal.
- **Branching & History**: Create branches, view commit logs, and switch branches.
- **Firebase Integration**: Store ratings and feedback.
- **User Workspaces**: Each user gets a unique workspace.
- **Rating & Feedback**: Rate your experience and send feedback directly from the app.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, PostCSS
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Backend API**: Custom Kit API (configurable via environment variables)
- **Database**: Firebase Firestore

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

```bash
npm install
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```bash
npm run build
```

### Linting

```bash
npm run lint
```

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

Create a `.env` file in the root directory and set the following (for Firebase and Kit API):

```
VITE_API_URL=<your-kit-api-url>
VITE_API_KEY=<firebase-api-key>
VITE_AUTH_DOMAIN=<firebase-auth-domain>
VITE_PROJECT_ID=<firebase-project-id>
VITE_STORAGE_BUCKET=<firebase-storage-bucket>
VITE_MESSAGING_SENDER_ID=<firebase-messaging-sender-id>
VITE_APP_ID=<firebase-app-id>
VITE_BOT_TOKEN=<telegram-bot-token>
VITE_CHAT_ID=<telegram-chat-id>
```

## Project Structure

```
src/
  components/        # UI components (Editor, Explorer, Terminal, etc.)
  hooks/             # Custom React hooks
  services/          # API and Firebase services
  types/             # TypeScript types
  App.tsx            # Main app component
  main.tsx           # Entry point
  index.css          # Tailwind styles
public/
  index.html         # HTML entry point
```

## Kit Terminal Commands

- `clear` - Clear terminal
- `pwd` - Show current directory
- `ls` - List files
- `kit init` - Initialize Kit repository
- `kit add <file>` - Add file to staging
- `kit commit -m "message"` - Commit changes
- `kit status` - Show repository status
- `kit log` - Show commit history
- `kit branch` - List/create branches
- `kit checkout <branch>` - Switch branch

## Feedback & Rating

- Rate your workspace experience (1-5 stars).
- Submit feedback and suggestions via the feedback button.

## License

MIT
