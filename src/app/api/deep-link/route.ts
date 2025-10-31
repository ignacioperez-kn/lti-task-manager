
import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/env';
import { JWK, JWS } from 'node-jose';

export async function POST(req: NextRequest) {
  const env = getEnv();
  const formData = await req.formData();
  
  const deepLink = JSON.parse(formData.get('deepLink') as string);
  const id_token = JSON.parse(formData.get('idToken') as string);
  const taskId = formData.get('taskId') as string;

  // Define a title for the task based on taskId
  const taskTitle = taskId === 'kuvaa-itsesi' ? 'Kuvaa Itsesi Task' : `Task ${taskId}`;

  const contentItems = [
    {
      type: 'ltiResourceLink',
      url: `${env.NEXT_PUBLIC_TOOL_HOST}/task/${taskId}`,
      title: taskTitle,
      presentation: { documentTarget: 'iframe' },
      custom: {
        taskId: taskId,
      },
    },
  ];

  const jwtPayload = {
    iss: env.PLATFORM_CLIENT_ID,
    aud: env.PLATFORM_ISS,
    sub: id_token.sub,
    'https://purl.imsglobal.org/spec/lti/claim/deployment_id': id_token['https://purl.imsglobal.org/spec/lti/claim/deployment_id'],
    'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiDeepLinkingResponse',
    'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
    'https://purl.imsglobal.org/spec/lti-dl/claim/content_items': contentItems,
    'https://purl.imsglobal.org/spec/lti-dl/claim/data': deepLink.data,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
  };

  const privateKey = JSON.parse(env.TOOL_PRIVATE_KEY);
  const keystore = await JWK.asKeyStore([privateKey]);
  const key = keystore.get(privateKey.kid);

  const jwt = await JWS.createSign({ format: 'compact' }, key)
    .update(JSON.stringify(jwtPayload))
    .final();

  // Return a self-submitting form to Moodle
  const deepLinkReturnUrl = deepLink.deep_link_return_url;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Returning selection...</title>
    </head>
    <body onload="document.forms[0].submit()">
      <p>Returning your selection to Moodle...</p>
      <form action="${deepLinkReturnUrl}" method="POST">
        <input type="hidden" name="JWT" value="${jwt}" />
        <noscript>
          <button type="submit">Continue</button>
        </noscript>
      </form>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
