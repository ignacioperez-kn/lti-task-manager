
import { NextRequest, NextResponse } from 'next/server';
import { getLtiSessionCookie } from '@/lib/lti';
import { dbPromise } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  const session = await getLtiSessionCookie();
  if (!session?.sub) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { taskId, output } = await req.json();
  if (!taskId || !output) {
    return new NextResponse('Missing taskId or output', { status: 400 });
  }

  try {
    const db = await dbPromise;
    const docRef = doc(db, 'tasks', session.sub, 'tasks', taskId);
    await setDoc(docRef, {
      output,
      updatedAt: serverTimestamp(),
    });
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Error saving task state:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
