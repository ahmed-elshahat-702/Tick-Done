# TickDone

TickDone is a modern, full-stack task management application built with Next.js, TypeScript, MongoDB, and Tailwind CSS. It provides a clean, responsive dashboard for managing tasks, tracking productivity, and customizing user profiles. The app supports authentication via credentials, Google, and GitHub.

## Features

- **User Authentication**: Sign up and sign in with email/password, Google, or GitHub.
- **Task Management**: Create, update, delete, and view tasks with priorities, statuses, due dates, and tags.
- **Task Categories**: Organize tasks under custom categories with support for nested (parent/child) relationships.
- **Productivity Dashboard**: Visualize task completion rates and productivity stats.
- **Calendar View**: See tasks in a calendar format for better planning.
- **Profile Management**: Edit profile info, upload/crop profile images, and change passwords.
- **Responsive UI**: Optimized for desktop and mobile devices.
- **Dark Mode**: Toggle between light and dark themes.
- **Secure File Uploads**: Profile images are uploaded and managed securely.
- **Account Deletion**: Users can delete their account and associated data.

## Tech Stack

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, MongoDB (Mongoose)
- **Authentication**: NextAuth.js (Credentials, Google, GitHub)
- **File Uploads**: UploadThing
- **State Management**: Zustand
- **UI Components**: Radix UI, Lucide Icons, Custom Components

## Project Structure

- `src/app/` – Next.js app directory (routing, pages, API endpoints)
- `src/components/` – Reusable UI and layout components
- `src/models/` – Mongoose models for MongoDB (includes `Task`, `User`, `TaskCategory`)
- `src/types/` – TypeScript types and interfaces (includes `task.ts`, `category.ts`, `user.ts`)
- `src/actions/` – Server actions for tasks, users, and task categories
- `src/lib/` – Utilities, database connection, Zustand stores (including `useAppStore`)
- `src/validation/` – Zod schemas for validation (task, user, category)
- `public/` – Static assets (images, icons)

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or cloud)

### Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/yourusername/tickdone.git
   cd tickdone
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Configure environment variables:**

   Create a `.env.local` file in the root directory and add:

   ```
   MONGODB_URI=your_mongodb_connection_string
   AUTH_SECRET=your_nextauth_secret
   AUTH_GOOGLE_ID=your_google_client_id
   AUTH_GOOGLE_SECRET=your_google_client_secret
   AUTH_GITHUB_ID=your_github_client_id
   AUTH_GITHUB_SECRET=your_github_client_secret
   ```

4. **Run the development server:**

   ```sh
   npm run dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000).

### Build for Production

```sh
npm run build
npm start
```

## Folder Overview

- [`src/app/page.tsx`](src/app/page.tsx): Main dashboard entry point.
- [`src/components/task-dashboard.tsx`](src/components/task-dashboard.tsx): Dashboard logic and layout.
- [`src/components/task-list.tsx`](src/components/task-list.tsx): Task list rendering.
- [`src/components/profile-settings.tsx`](src/components/profile-settings.tsx): User profile management.
- [`src/app/api/`](src/app/api/): API endpoints for tasks, users, authentication, and uploads.
- [`src/models/Task.ts`](src/models/Task.ts), [`src/models/User.ts`](src/models/User.ts): Mongoose models.
- [`src/types/task.ts`](src/types/task.ts), [`src/types/user.ts`](src/types/user.ts): TypeScript types.

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements and bug fixes.

##
