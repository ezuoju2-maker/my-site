import { useEffect } from "react";

const API_BASE_URL = "https://my-site-n7j.pages.dev";

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
          window.location.replace(
            `${import.meta.env.BASE_URL}developing/`,
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
