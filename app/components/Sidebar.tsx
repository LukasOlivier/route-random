import { Footprints } from "lucide-react";
import SidebarForm from "./SidebarForm";

interface SidebarProps {
  isOpen?: boolean;
}

export default function Sidebar({ isOpen = false }: SidebarProps) {
  return (
    <div
      className={`h-screen bg-gray-900 text-white flex flex-col p-6 transition-transform duration-300 ease-in-out ${
        isOpen
          ? "fixed inset-0 z-[99999] md:relative md:w-1/4 md:translate-x-0"
          : "hidden md:flex md:w-1/4"
      }`}
    >
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Footprints color="white" size={24} />
          Route Random
        </h1>
        <h2 className="text-sm text-gray-400 mt-1 mb-4">
          A project made by{" "}
          <a
            className="underline"
            target="_blank"
            href="https://www.lukasolivier.be"
          >
            Lukas Olivier
          </a>
        </h2>
      </header>

      {/* Separator element */}
      <div className="border-t border-gray-700 my-4" />

      {/* Form for adjusting route generation settings */}
      <SidebarForm />

      {/* Footer */}
      <footer className="mt-auto text-xs text-gray-500 space-y-4">
        <h3 className="text-sm font-medium text-gray-300 mb-2">
          About Route Random
        </h3>
        <p className="text-gray-400 leading-relaxed">
          Route Random is a free random route generator that creates random
          circular routes for runners, joggers, and walkers. Generate random
          routes based on your desired distance and starting location anywhere
          in the world.
        </p>
        <p className="text-gray-400 leading-relaxed mt-2">
          Perfect for discovering new paths, exploring your neighborhood, or
          finding new routes to keep your workouts exciting.
        </p>
      </footer>
    </div>
  );
}
