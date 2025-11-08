# AI Rules for GB Finance 2.0

This document outlines the core technologies used in the GB Finance 2.0 application and provides guidelines for using specific libraries and tools.

## Tech Stack Description

*   **React**: The primary JavaScript library for building the user interface.
*   **TypeScript**: Used for type safety, improving code quality and maintainability.
*   **Tailwind CSS**: A utility-first CSS framework for styling components efficiently and responsively.
*   **Supabase**: Provides backend services including authentication and database management.
*   **Recharts**: A charting library for building interactive data visualizations, such as financial overviews and expense breakdowns.
*   **Vite**: The build tool used for a fast development experience and optimized production builds.
*   **React Router**: The library for handling client-side routing within the application.
*   **localStorage**: Utilized for client-side data persistence, managing transactions and categories locally.
*   **Lucide React**: A collection of beautiful and customizable SVG icons.
*   **shadcn/ui**: A set of reusable components built with Radix UI and styled with Tailwind CSS.

## Library Usage Rules

*   **UI Components & Styling**:
    *   Always prioritize using **shadcn/ui** components where applicable for consistency and accessibility.
    *   For custom styling or modifications, use **Tailwind CSS** classes directly. Avoid writing custom CSS files unless absolutely necessary for global styles.
*   **Icons**:
    *   Use icons from the **lucide-react** library.
*   **Charting & Data Visualization**:
    *   All charts and graphs should be implemented using **Recharts**.
*   **State Management**:
    *   For local component state and simple global state, use React's built-in hooks (`useState`, `useContext`, `useReducer`).
    *   For derived state and performance optimizations, use `useMemo` and `useCallback`.
*   **Routing**:
    *   Manage all application routes using **React Router**. Keep route definitions centralized in `src/App.tsx`.
*   **Backend & Authentication**:
    *   Interact with the backend for data storage, retrieval, and user authentication exclusively through **Supabase** services (`services/supabase.ts`).
*   **Local Data Persistence**:
    *   For local storage operations, use the `storageService.ts` utility, which wraps the browser's `localStorage` API.
*   **Notifications**:
    *   Use the existing `Toast` component for all user feedback notifications (success, error messages).