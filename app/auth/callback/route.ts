import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/lib/db";

function resolveWebRedirect(
  returnTo: string,
  origin: string,
  forwardedHost: string | null,
  isLocalEnv: boolean
): string {
  // If returnTo is already an absolute HTTP/HTTPS URL, don't concatenate host prefix!
  if (/^https?:\/\//i.test(returnTo)) {
    return returnTo;
  }
  const safePath = returnTo.startsWith("/") ? returnTo : `/${returnTo}`;
  if (isLocalEnv) {
    return `${origin}${safePath}`;
  }
  if (forwardedHost) {
    return `https://${forwardedHost}${safePath}`;
  }
  return `${origin}${safePath}`;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const returnTo = searchParams.get("returnTo") || "/";
  const isMobileTarget =
    returnTo.startsWith("quickcart://") || returnTo.startsWith("exp://");

  if (code) {
    let sessionUser: any = null;
    let sessionTokens: { access_token?: string; refresh_token?: string } = {};

    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data?.user) {
        sessionUser = data.user;
        sessionTokens = {
          access_token: data.session?.access_token,
          refresh_token: data.session?.refresh_token,
        };

        if (sessionUser.email) {
          const cleanEmail = sessionUser.email.toLowerCase().trim();
          const meta = sessionUser.user_metadata || {};
          const name = meta.full_name || meta.name || cleanEmail.split("@")[0];
          const image = meta.avatar_url || meta.picture || undefined;

          try {
            await db.user.upsert({
              where: { email: cleanEmail },
              update: {
                name,
                ...(image ? { image } : {}),
              },
              create: {
                email: cleanEmail,
                name,
                image,
                role: "CUSTOMER",
                tokenBalance: 0,
              },
            });
          } catch (dbErr) {
            console.error("Supabase OAuth DB sync error:", dbErr);
          }
        }
      }
    } catch (exchangeErr) {
      console.warn("Server-side code exchange skipped or failed:", exchangeErr);
    }

    // ── Mobile Deep-Link Target ──────────────────────────────────────────────
    if (isMobileTarget) {
      const hashParams = new URLSearchParams();
      if (sessionTokens.access_token) {
        hashParams.set("access_token", sessionTokens.access_token);
      }
      if (sessionTokens.refresh_token) {
        hashParams.set("refresh_token", sessionTokens.refresh_token);
      }
      // Always pass code through — mobile app uses PKCE and can exchange it locally
      hashParams.set("code", code);

      const separator = returnTo.includes("#") ? "&" : "#";
      const mobileTarget = `${returnTo}${separator}${hashParams.toString()}`;

      // CRITICAL: Use a raw Response with HTTP 302 + Location header.
      // NextResponse.redirect() throws TypeError for non-HTTP schemes.
      // HTML meta-refresh / JS window.location are NOT intercepted by Android
      // Chrome Custom Tabs — only a top-level HTTP 302 redirect is intercepted
      // by WebBrowser.openAuthSessionAsync() to close the tab and return to app.
      return new Response(null, {
        status: 302,
        headers: {
          Location: mobileTarget,
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    // ── Web Target ───────────────────────────────────────────────────────────
    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";
    const redirectUrl = resolveWebRedirect(returnTo, origin, forwardedHost, isLocalEnv);
    return NextResponse.redirect(redirectUrl);
  }

  // ── No code / OAuth failed ───────────────────────────────────────────────
  if (isMobileTarget) {
    const separator = returnTo.includes("#") ? "&" : "#";
    const mobileTarget = `${returnTo}${separator}error=OAuthFailed`;
    return new Response(null, {
      status: 302,
      headers: {
        Location: mobileTarget,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const loginRedirect = resolveWebRedirect("/login?error=OAuthFailed", origin, forwardedHost, isLocalEnv);
  return NextResponse.redirect(loginRedirect);
}
