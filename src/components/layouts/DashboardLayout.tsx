import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { ThemeToggle } from "../theme-toggle";

const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-end p-4 border-b sm:h-16">
          <ThemeToggle />
        </header>
        <main className="flex-grow p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;