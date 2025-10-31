import { NextRequest, NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { newNonce, signState } from "@/lib/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// This is your OIDC login initiation request handler.
// It is responsible for building the authentication request URL and redirecting the user.
async function handle(req: NextRequest) {
  console.log("--- LOGIN LOG ----");
  const env = getEnv();
  const allowedOrigin = env.PLATFORM_ISS; // Use PLATFORM_ISS for allowed origin

  // --- CORS Headers ---
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Read params from POST form or GET query
    let iss = "";
    let login_hint = "";
    let lti_message_hint = "";
    let target_link_uri = "";

    if (req.method === "POST") {
      const fd = await req.formData();
      iss = String(fd.get("iss") ?? "");
      login_hint = String(fd.get("login_hint") ?? "");
      lti_message_hint = String(fd.get("lti_message_hint") ?? "");
      target_link_uri = String(fd.get("target_link_uri") ?? "");
    } else {
      const u = new URL(req.url);
      iss = u.searchParams.get("iss") ?? "";
      login_hint = u.searchParams.get("login_hint") ?? "";
      lti_message_hint = u.searchParams.get("lti_message_hint") ?? "";
      target_link_uri = u.searchParams.get("target_link_uri") ?? "";
    }

    // Default the target to our launch endpoint
    if (!target_link_uri) {
      // ✅ CORRECTED THIS LINE
      target_link_uri = `${env.NEXT_PUBLIC_TOOL_HOST}/api/lti/launch`;
    }

    // Basic input validation
    if (!iss) return new NextResponse("Missing iss", { status: 400, headers: corsHeaders });
    if (iss !== env.PLATFORM_ISS) return new NextResponse("ISS mismatch", { status: 400, headers: corsHeaders });
    if (!login_hint) return new NextResponse("Missing login_hint", { status: 400, headers: corsHeaders });

    // Create state + nonce
    const nonce = newNonce();
    const state = signState({ ts: Math.floor(Date.now() / 1000), nonce });

    // Build the Moodle OIDC authorization URL
    const authUrl = new URL(env.PLATFORM_AUTHORIZATION_ENDPOINT);
    authUrl.searchParams.set("response_type", "id_token");
    authUrl.searchParams.set("response_mode", "form_post");
    authUrl.searchParams.set("scope", "openid");
    authUrl.searchParams.set("client_id", env.PLATFORM_CLIENT_ID);
    // ✅ CORRECTED THIS LINE
    authUrl.searchParams.set("redirect_uri", `${env.NEXT_PUBLIC_TOOL_HOST}/api/lti/launch`);
    authUrl.searchParams.set("login_hint", login_hint);
    authUrl.searchParams.set("nonce", nonce);
    authUrl.searchParams.set("state", state);
    if (lti_message_hint) authUrl.searchParams.set("lti_message_hint", lti_message_hint);

    // Redirect to Moodle
    return NextResponse.redirect(authUrl.toString(), { status: 302, headers: corsHeaders });

  } catch (err: any) {
    const msg = err?.message || "Internal error";
    return new NextResponse(`OIDC login error: ${msg}`, { status: 500, headers: corsHeaders });
  }
}

// Handler for CORS preflight requests
export async function OPTIONS(req: NextRequest) {
  const env = getEnv();
  const allowedOrigin = env.PLATFORM_ISS;
  const headers = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  return new NextResponse(null, { status: 204, headers });
}

export async function GET(req: NextRequest) { return handle(req); }
export async function POST(req: NextRequest) { return handle(req); }
