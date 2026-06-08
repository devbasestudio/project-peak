"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

const ADMIN_EMAIL = "admin@projectpeak.com";

export default function AuthHashHandler() {
  useEffect(() => {
    async function finishMagicLinkLogin() {
      if (!window.location.hash.includes("access_token")) return;

      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (!accessToken || !refreshToken) return;

      const supabase = createClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      const cleanUrl = `${window.location.pathname}${window.location.search}`;
      window.history.replaceState(null, "", cleanUrl || "/");

      if (error) {
        window.location.replace("/login?error=session_failed");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const next = new URLSearchParams(window.location.search).get("next");
      const fallback = user?.email === ADMIN_EMAIL ? "/admin/dashboard" : "/user/dashboard";
      window.location.replace(next || fallback);
    }

    finishMagicLinkLogin();
  }, []);

  return null;
}
