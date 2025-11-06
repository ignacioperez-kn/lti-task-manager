
import { NextRequest, NextResponse } from 'next/server';
import { getLtiSessionCookie } from '@/lib/lti';
import { dbPromise } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getCohortId, getCohortMembers, getUsersByIds } from '@/lib/moodle-api';

async function getParticipantIds(session: any): Promise<string[]> {
  if (!session.cohortId) {
    console.error("Cohort ID not found in session. Moodle connection likely failed.");
    throw new Error("MOODLE_CONNECTION_FAILED");
  }
  if (!session.sub) {
    console.error("Instructor ID (sub) not found in session.");
    return [];
  }

  const memberIds = await getCohortMembers(session.cohortId);
  
  // Filter out the instructor's own ID
  const instructorId = String(session.sub);
  const filteredMemberIds = memberIds.filter(id => String(id) !== instructorId);

  // Convert number IDs to strings for Firestore query
  return filteredMemberIds.map(id => String(id));
}

export async function GET(req: NextRequest) {
  console.log("--- /api/responses ---");
  console.log('NEXT_PUBLIC_TOOL_HOST:', process.env.NEXT_PUBLIC_TOOL_HOST);
  try {
    console.log("Step 1: Retrieving LTI session cookie...");
    const session = await getLtiSessionCookie();
    if (!session) {
      console.error("Session not found.");
      return new NextResponse('Unauthorized', { status: 401 });
    }
    console.log("Session retrieved successfully.");

    if (!session.isInstructor) {
      console.error("User is not an instructor.");
      return new NextResponse('Forbidden', { status: 403 });
    }
    console.log("User is an instructor.");

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    if (!taskId) {
      console.error("Task ID is missing from the request.");
      return new NextResponse('Missing taskId', { status: 400 });
    }
    console.log(`Task ID: ${taskId}`);

    console.log("Step 2: Getting participant IDs from Moodle...");
    const participantIds = await getParticipantIds(session);
    console.log(`Found participant IDs: ${participantIds.join(', ')}`);

    if (participantIds.length === 0) {
      console.log("No participants found, returning empty array.");
      return NextResponse.json([]);
    }

    console.log("Step 3: Getting user details from Moodle...");
    const users = await getUsersByIds(participantIds.map(Number));
    console.log(`Found ${users.length} user details.`);
    const userMap = new Map(users.map(user => [String(user.id), user.fullname]));
    console.log("User map created.");

    console.log("Step 4: Fetching responses from Firestore...");
    const db = await dbPromise;
    const responses: any[] = [];

    for (const userId of participantIds) {
      const querySnapshot = await getDocs(collection(db, 'tasks', userId, 'tasks'));
      querySnapshot.forEach((doc) => {
        if (doc.id === taskId) {
          responses.push({
            userId,
            userName: userMap.get(userId) || `User ${userId}`,
            ...doc.data(),
          });
        }
      });
    }
    console.log(`Found ${responses.length} matching responses in Firestore.`);
    console.log("--- Request Complete ---");
    return NextResponse.json(responses);

  } catch (error: any) {
    if (error.message === 'MOODLE_CONNECTION_FAILED') {
      return NextResponse.json({ error: "MOODLE_CONNECTION_FAILED" }, { status: 500 });
    }
    console.error('!!! Critical error in /api/responses:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
