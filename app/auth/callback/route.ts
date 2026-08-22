import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const returnTo = searchParams.get("returnTo") || "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user && data.user.email) {
      const cleanEmail = data.user.email.toLowerCase().trim();
      const meta = data.user.user_metadata || {};
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

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${returnTo}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${returnTo}`);
      } else {
        return NextResponse.redirect(`${origin}${returnTo}`);
      }
    }
  }

  // If error or no code, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=OAuthFailed`);
}
