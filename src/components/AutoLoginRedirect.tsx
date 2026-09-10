import { API_BASE_URL } from "../lib/api";
import { useEffect } from "react";


export default function AutoLoginRedirect() {
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/auth/me`,
          {
            method: "GET",
            credentials: "include",
            cache: "no-store",
          },
        );

        if (!cancelled && response.ok) {
          const data = await response.json().catch(() => null);
          const role = data?.user?.role === "admin" ? "admin" : "user";
          const target = role === "admin" ? "/admin/" : "/dashboard/";
          window.location.replace(
            `${import.meta.env.BASE_URL.replace(/\/$/, "")}${target}`,
          );
        }
      } catch {
        // Ignore network errors and leave the login page available.
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
