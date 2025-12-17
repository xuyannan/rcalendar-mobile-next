# RCalendar Mobile Next

RCalendar Mobile Next is a mobile web application built for the "Run365" (跑者日历) podcast community. It features an immersive vertical slide presentation and user management capabilities.

## Features

### 📱 Slide Presentation
The main interface is a vertical full-screen swiper that showcases:
- **Cover**: Brand visual with logo and slogan ("有料，有趣的跑步播客").
- **Album**: Introduction to the podcast matrix (Run365, Gear Talk, PB Plan, First 100K).
- **Numbers**: Key statistics of the podcast (Episodes, Subscribers, Plays, etc.).
- **Run365**: Additional community information.

### 👥 User Management
A dedicated section for managing community members:
- **User List**: View and search users.
- **Search Filters**: Filter by Real Name, Nickname, and Role.
- **Roles**: Admin, User, Organizer, Crew Admin, Event Admin.

## Tech Stack

- **Framework**: [React](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [Ant Design Mobile](https://mobile.ant.design/)
- **Routing**: [React Router](https://reactrouter.com/)

## Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Start the development server**:
    ```bash
    npm run dev
    ```

3.  **Build for production**:
    ```bash
    npm run build
    ```

## Project Structure

- `src/pages/Index.tsx`: Main entry point containing the vertical swiper.
- `src/pages/slides/`: Individual slide components (Cover, Album, Numbers, Run365).
- `src/pages/UserList.tsx`: User management interface.
- `src/assets/`: Static assets (images, logos).
