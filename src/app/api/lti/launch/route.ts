import { NextRequest, NextResponse } from "next/server";
import { setLtiSessionCookie, verifyIdToken } from "@/lib/lti";
import { LtiClaims } from "@/lib/lti-claims";
import { verifyState } from "@/lib/state";
import { getEnv } from "@/lib/env";
import { getCohortId, getUsersByIds } from "@/lib/moodle-api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData();
    const id_token = String(fd.get("id_token") ?? "");
    const state = String(fd.get("state") ?? "");

    if (!id_token) {
      return new NextResponse("Missing id_token", { status: 400 });
    }
    if (!state) {
      return new NextResponse("Missing state", { status: 400 });
    }

    const { nonce } = verifyState(state);
    const payload = await verifyIdToken(id_token, nonce);


    const claims = new LtiClaims(payload);

    if (claims.isDeepLinkingRequest()) {
      const deepLink = claims.getDeepLinkingSettings();
      const env = getEnv();
      const url = new URL('/deep-link', env.NEXT_PUBLIC_TOOL_HOST);
      url.searchParams.set('idToken', encodeURIComponent(JSON.stringify(payload)));
      url.searchParams.set('deepLink', encodeURIComponent(JSON.stringify(deepLink)));
      return NextResponse.redirect(url.toString(), { status: 303 });
    }

    // --- KEY CHANGE STARTS HERE ---
    // Create the session object, now including name and email if they exist
    const customParams = claims.getCustomParameters();
    const taskId = customParams?.taskId;

    const launchInfo: {
      roles: string[];
      contextId: string | undefined;
      deploymentId: string;
      sub: string;
      name: string | undefined;
      email: string | undefined;
      taskId: any;
      isInstructor: boolean;
      cohortId: number | null;
    } = {
      roles: claims.getRoles(),
      contextId: claims.getContextId(),
      deploymentId: claims.getDeploymentId(),
      sub: claims.getSub(),
      name: claims.getName(),
      email: claims.getEmail(),
      taskId: taskId, // Add taskId to the session
      isInstructor: claims.isInstructor(), // Add isInstructor flag
      cohortId: null, // Initialize cohortId
    };

    if (launchInfo.isInstructor && launchInfo.sub) {
      const users = await getUsersByIds([parseInt(launchInfo.sub, 10)]);
      if (users && users.length > 0) {
        const instructorUsername = users[0].username;
        const cohortId = await getCohortId(instructorUsername);
        if (cohortId) {
          launchInfo.cohortId = cohortId;
        }
      }
    }
    // --- KEY CHANGE ENDS HERE ---

    console.log("LTI LAUNCH: Launch info created:", launchInfo);

    await setLtiSessionCookie(launchInfo);

    console.log("LTI LAUNCH: Session cookie should be set.");

    const env = getEnv();
    const redirectUrl = env.NEXT_PUBLIC_TOOL_HOST;
    
    console.log("LTI LAUNCH: Redirecting to:", redirectUrl);

    return NextResponse.redirect(redirectUrl, { status: 303 });

  } catch (err: any) {
    const msg = err?.message || "Internal error";
    return new NextResponse(`Launch error: ${msg}`, { status: 500 });
  }
}

