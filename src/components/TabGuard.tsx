"use client";

import { useEffect, useState } from "react";
import { logout } from "@/app/login/actions";
import { TAB_KEY } from "@/lib/session";

/** Signs out when the admin is opened in a tab that didn't sign in — i.e. after the tab was closed. */
export function TabGuard({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let signedInHere = true;
    try {
      signedInHere = sessionStorage.getItem(TAB_KEY) === "1";
    } catch {
      // Storage blocked: don't lock the admin out, the cookie still guards the pages.
    }
    if (signedInHere) setOk(true);
    else logout();
  }, []);

  return <div className={ok ? undefined : "invisible"}>{children}</div>;
}
