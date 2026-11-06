// app/dashboard/settings/OpenSettingsButton.tsx
"use client";

import { useUI } from "@/components/providers/UIProvider";
import { Button } from "@/components/ui/Button";
import { Settings2 } from "lucide-react";

export default function OpenSettingsButton() {
  const { openSettings } = useUI();

  return (
    <Button 
      onClick={() => openSettings()}
      className="w-full sm:w-auto bg-lime-600 hover:bg-lime-700 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-lime-600/20 flex items-center gap-2 shrink-0"
    >
      <Settings2 size={18} /> Open Preferences
    </Button>
  );
}