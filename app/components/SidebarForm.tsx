"use client";

import { useState } from "react";
import ToggleModeButton from "./ToggleModeButton";

enum Mode {
  TIME = "time",
  DISTANCE = "distance",
}

export default function SidebarForm() {
  const [currentMode, setCurrentMode] = useState<Mode>(Mode.DISTANCE);

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
      {/* Toggling between time and distance mode */}
      <div className="w-full flex gap-2">
        <ToggleModeButton
          text="Distance"
          selected={currentMode === Mode.DISTANCE}
          onClick={() => setCurrentMode(Mode.DISTANCE)}
        />
        <ToggleModeButton
          text="Time"
          selected={currentMode === Mode.TIME}
          onClick={() => setCurrentMode(Mode.TIME)}
        />
      </div>
    </form>
  );
}
