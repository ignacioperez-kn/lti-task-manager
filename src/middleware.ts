
import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/env';

export function middleware(req: NextRequest) {
  const env = getEnv();
  const referer = req.headers.get('referer');
  const allowedReferer = env.PLATFORM_ISS;

  if (req.nextUrl.pathname.startsWith('/task/') || req.nextUrl.pathname.startsWith('/api/')) {
    // these are exceptions to the referer check
    if (
      req.nextUrl.pathname.startsWith('/api/lti/launch') ||
      req.nextUrl.pathname.startsWith('/api/oidc/login') ||
      req.nextUrl.pathname.startsWith('/api/deep-link') ||
      req.nextUrl.pathname.startsWith('/api/firebase-config')
    ) {
      return NextResponse.next();
    }

    if (!referer || (!referer.startsWith(allowedReferer) && !referer.startsWith(env.NEXT_PUBLIC_TOOL_HOST))) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return NextResponse.next();
}
