import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/lib/db";

function renderMobileBounceHtml(
  mobileTarget: string,
  badgeText = "⚡ QuickCart",
  title = "Login Successful! 🎉",
  message = "Returning to QuickCart App...",
  buttonText = "Open QuickCart App"
) {
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
    <meta http-equiv="refresh" content="0;url=${mobileTarget}">
    <script>
      window.location.replace("${mobileTarget}");
    </script>
    <style>
      body {
        margin: 0;
        padding: 24px;
        background-color: #020617;
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        box-sizing: border-box;
        text-align: center;
      }
      .card {
        background-color: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 20px;
        padding: 32px 24px;
        max-width: 360px;
        width: 100%;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
      }
      .badge {
        display: inline-block;
        background-color: rgba(249, 115, 22, 0.15);
        color: #f97316;
        font-weight: 800;
        font-size: 11px;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        padding: 4px 12px;
        border-radius: 9999px;
        margin-bottom: 16px;
      }
      h2 {
        margin: 0 0 8px;
        font-size: 22px;
        font-weight: 800;
      }
      p {
        margin: 0 0 24px;
        font-size: 14px;
        color: #94a3b8;
        line-height: 1.5;
      }
      .btn {
        display: inline-block;
        background: linear-gradient(to right, #f97316, #ea580c);
        color: #ffffff;
        text-decoration: none;
        padding: 14px 28px;
        border-radius: 9999px;
        font-weight: 800;
        font-size: 14px;
        box-shadow: 0 10px 15px -3px rgba(249, 115, 22, 0.3);
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="badge">${badgeText}</div>
      <h2>${title}</h2>
      <p>${message}</p>
      <a class="btn" href="${mobileTarget}">${buttonText}</a>
    </div>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

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

    // Handle Mobile Deep-Link Target
    if (isMobileTarget) {
      const hashParams = new URLSearchParams();
      if (sessionTokens.access_token) {
        hashParams.set("access_token", sessionTokens.access_token);
      }
      if (sessionTokens.refresh_token) {
        hashParams.set("refresh_token", sessionTokens.refresh_token);
      }
      // Pass the code through so the mobile client can exchange it locally if needed (PKCE)
      if (code) {
        hashParams.set("code", code);
      }

      const separator = returnTo.includes("#") ? "&" : "#";
      const mobileTarget = `${returnTo}${separator}${hashParams.toString()}`;
      return renderMobileBounceHtml(mobileTarget);
    }

    // Handle Web Target
    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";
    const redirectUrl = resolveWebRedirect(returnTo, origin, forwardedHost, isLocalEnv);
    return NextResponse.redirect(redirectUrl);
  }

  // If no code was provided or OAuth failed:
  if (isMobileTarget) {
    const separator = returnTo.includes("#") ? "&" : "#";
    const mobileTarget = `${returnTo}${separator}error=OAuthFailed`;
    return renderMobileBounceHtml(
      mobileTarget,
      "⚡ QuickCart",
      "Authentication Notice",
      "Redirecting back to QuickCart App...",
      "Return to App"
    );
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const loginRedirect = resolveWebRedirect("/login?error=OAuthFailed", origin, forwardedHost, isLocalEnv);
  return NextResponse.redirect(loginRedirect);
}
