
import { NextRequest, NextResponse } from 'next/server';
import { setLtiSessionCookie, LtiSessionData } from '@/lib/lti';

export async function POST(req: NextRequest) {
  // --- SECURITY GUARD ---
  // This endpoint is for development ONLY. It should not exist in production.
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
        const { role, taskId, sub, email } = await req.json();
    
        if (role !== 'learner' && role !== 'instructor') {
          return new NextResponse('Invalid role specified', { status: 400 });
        }
        if (!taskId || typeof taskId !== 'string') {
          return new NextResponse('Invalid or missing taskId', { status: 400 });
        }
    
        // --- MOCK SESSION DATA ---
        // Use provided user details, or fall back to defaults.
        const finalSub = sub || `dev-${role}-${Date.now()}`;
        const finalEmail = email || `${role}@example.com`;
        const finalName = `Dev ${role === 'learner' ? 'Student' : 'Instructor'}`;
    
        const mockSession: LtiSessionData = {
          sub: finalSub,
          contextId: 'dev-course-1',
          deploymentId: 'dev-deployment-1',
          name: finalName,
          email: finalEmail,
          taskId: taskId,
          roles:
            role === 'learner'
              ? [
                  'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Learner',
                  'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
                ]
              : [
                  'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Instructor',
                  'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor',
                ],
        };
    

    // Use the existing session cookie function to set the mock session
    await setLtiSessionCookie(mockSession);

    return new NextResponse('Mock session created successfully', {
      status: 200,
    });
  } catch (err: any) {
    const msg = err?.message || 'Internal error';
    return new NextResponse(`Dev launch error: ${msg}`, { status: 500 });
  }
}
