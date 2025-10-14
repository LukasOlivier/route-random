import { Footprints } from "lucide-react";
import ToggleModeButton from "./ToggleModeButton";
import SidebarForm from "./SidebarForm";

export default function Sidebar() {
  return (
    <div className="w-1/4 h-screen bg-gray-900 text-white flex-col p-6">
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
      <SidebarForm />
    </div>
  );
}
