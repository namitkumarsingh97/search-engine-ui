"use client";

import { LogOut } from "lucide-react";
import { clearSession } from "@/lib/auth";

export default function LogoutButton() {
  return (
    <button
      className="icon-btn"
      title="Sign out"
      aria-label="Sign out"
      onClick={() => {
        clearSession();
        // Full reload so every component drops the old session.
        window.location.assign("/");
      }}
    >
      <LogOut size={18} />
    </button>
  );
}
