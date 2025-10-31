
import { NextRequest, NextResponse } from 'next/server';
import { getLtiSessionCookie } from '@/lib/lti';

export async function GET(req: NextRequest) {
  const session = await getLtiSessionCookie();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  return NextResponse.json(session);
}
