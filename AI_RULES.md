# AI Rules for AcademIA Application

This document outlines the core technologies and best practices for developing the AcademIA application.

## Tech Stack Overview

*   **React:** The primary JavaScript library for building user interfaces.
*   **TypeScript:** Used for type safety and improved code quality across the entire codebase.
*   **React Router:** Manages client-side routing, with all main routes defined in `src/App.tsx`.
*   **Tailwind CSS:** The exclusive utility-first CSS framework for all styling, ensuring a consistent and responsive design.
*   **shadcn/ui:** A collection of re-usable components built with Radix UI and styled with Tailwind CSS, providing a consistent UI.
*   **Radix UI:** The underlying unstyled component primitives used by shadcn/ui.
*   **Lucide React:** The icon library used for all visual icons within the application.
*   **TanStack Query (React Query):** Handles server state management, data fetching, caching, and synchronization.
*   **Sonner:** The library used for displaying elegant and accessible toast notifications.
*   **Next.js Themes:** Manages theme switching (light/dark mode) for the application.
*   **React Hook Form & Zod:** Used together for robust form management and schema-based validation.
*   **Vite:** The build tool for a fast development experience.

## Library Usage Rules

*   **UI Components:**
    *   Always prioritize using components from `shadcn/ui` (`@/components/ui`).
    *   If a required component is not available in `shadcn/ui` or needs significant custom logic, create a new component in `src/components/` and style it using Tailwind CSS.
    *   **Do NOT modify existing `shadcn/ui` component files directly.**
*   **Styling:**
    *   All styling must be done using **Tailwind CSS utility classes**.
    *   Avoid inline styles or custom CSS files (except for `src/globals.css` for global styles).
*   **Icons:**
    *   Use icons from the `lucide-react` library.
*   **Routing:**
    *   Use `react-router-dom` for all navigation.
    *   All top-level routes should be defined in `src/App.tsx`.
    *   Nested routes should be handled within their respective layouts (e.g., `DashboardLayout`).
*   **State Management & Data Fetching:**
    *   For server-side data fetching and caching, use `TanStack Query`.
    *   For simple component-level or client-side state, `React.useState` and `React.useReducer` are appropriate.
*   **Forms & Validation:**
    *   Implement forms using `react-hook-form`.
    *   Use `zod` for defining and validating form schemas.
*   **Toast Notifications:**
    *   Use the `sonner` library for all toast notifications.
    *   Utilize the helper functions provided in `src/utils/toast.ts` (`showSuccess`, `showError`, `showLoading`, `dismissToast`).
*   **Theming:**
    *   The `next-themes` library is configured for theme management. Use `useTheme` hook from `next-themes` for theme-related logic.
*   **File Structure:**
    *   New components should be created in `src/components/`.
    *   New pages should be created in `src/pages/`.
    *   Utility functions should be placed in `src/lib/utils.ts` or new files in `src/utils/`.