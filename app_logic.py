# app_logic.py
import json
import uuid
from typing import Dict, Any, Tuple, Optional
from urllib.parse import urlparse, parse_qs

from fastapi.responses import HTMLResponse
from jose import jwt

import config
import lti_services
from lti_security import now

# --- Task Configuration ---
KNOWN_TASKS = {
    "kuvaa-itsesi": {"name": "Kuvaa Itsesi Työkalu", "path": "tasks/kuvaa-itsesi/index.html", "moodle_assignment_cmid": 67},
}

# --- Main Logic Handlers ---

async def handle_resource_link_request(claims: Dict[str, Any]) -> HTMLResponse:
    """
    Handles a standard LTI launch. Injects LTI data into the task HTML.
    """
    # --- DEBUG: Print all claims received from Moodle ---
    print("--- LTI LAUNCH CLAIMS ---")
    print(json.dumps(claims, indent=2))
    print("-------------------------")
    # -----------------------------------------------------

    target_link_uri = claims.get("https://purl.imsglobal.org/spec/lti/claim/target_link_uri", "")
    parsed_url = urlparse(target_link_uri)
    path_parts = parsed_url.path.strip("/").split("/")
    query_params = parse_qs(parsed_url.query)

    try:
        task_id = path_parts[1]
    except IndexError:
        return HTMLResponse("LTI Error: Invalid or missing task ID in Tool URL.", status_code=400)

    moodle_cmid = query_params.get("moodle_cmid", [None])[0]
    if moodle_cmid:
        try:
            moodle_cmid = int(moodle_cmid)
        except ValueError:
            return HTMLResponse("LTI Error: Invalid moodle_cmid in Tool URL.", status_code=400)

    if task_id not in KNOWN_TASKS:
        return HTMLResponse(f"LTI Error: Unknown task ID '{task_id}'.", status_code=404)

    task_path = KNOWN_TASKS[task_id]["path"]

    try:
        with open(task_path, "r", encoding="utf-8") as f:
            html_content = f.read()
    except FileNotFoundError:
        return HTMLResponse(f"Server Error: Task file not found at '{task_path}'.", status_code=500)

    # --- LTI Data Injection ---
    user_id = claims.get("sub")

    can_submit_feedback = bool(user_id and moodle_cmid)

    launch_data = {
        "grading_disabled": not can_submit_feedback,
        "user_id": user_id,
        "moodle_cmid": moodle_cmid,
    }

    # Inject the data into a <script> tag.
    injection_script = f'''
    <script>
      window.LTI_LAUNCH_DATA = {json.dumps(launch_data)};
    </script>
    '''
    html_content = injection_script + html_content

    return HTMLResponse(content=html_content, status_code=200)


async def handle_deep_linking_request(claims: Dict[str, Any]) -> HTMLResponse:
    """
    Handles a deep linking launch (LtiDeepLinkingRequest).
    - Shows a UI for the teacher to select a task.
    - The selection posts to /lti/deeplink to complete the flow.
    """
    dl_settings = claims.get("https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings", {})
    dl_return_url = dl_settings.get("deep_link_return_url")
    
    if not dl_return_url:
        return HTMLResponse("Deep linking launch is missing return URL.", status_code=400)

    # Store necessary data in a secure, short-lived state token
    from lti_security import sign_state, now
    state_payload = {
        "ts": now(),
        "nonce": str(uuid.uuid4()), # Just for uniqueness
        "dl_return": dl_return_url,
        "deployment_id": claims.get("https://purl.imsglobal.org/spec/lti/claim/deployment_id"),
        "data": dl_settings.get("data"), # Optional pass-through value
    }
    state = sign_state(state_payload)

    # Build the beautiful HTML UI for the teacher to select a task
    items_html = ""
    for task_id, task_info in KNOWN_TASKS.items():
        items_html += f"""
        <div class="task">
            <h3>{task_info['name']}</h3>
            <form action="/lti/deeplink" method="post">
                <input type="hidden" name="state" value="{state}" />
                <input type="hidden" name="task_id" value="{task_id}" />
                <button class="button" type="submit">Select this Task</button>
            </form>
        </div>
        """

    html_content = f"""
    <html>
    <head>
        <title>Select a Task</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background-color: #f0f2f5;
                color: #333;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
            }}
            .container {{
                background-color: #fff;
                padding: 2rem 3rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 500px;
            }}
            h1 {{
                color: #2c3e50;
                margin-bottom: 2rem;
                font-weight: 500;
            }}
            .task {{
                border: 1px solid #e0e0e0;
                padding: 1.5rem;
                border-radius: 8px;
            }}
            h3 {{
                margin-top: 0;
                margin-bottom: 1.5rem;
                color: #34495e;
                font-weight: 500;
            }}
            .button {{
                background-color: #007bff;
                color: white;
                border: none;
                padding: 12px 24px;
                text-align: center;
                text-decoration: none;
                display: inline-block;
                font-size: 16px;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.3s;
            }}
            .button:hover {{
                background-color: #0056b3;
            }}
        </style>
    </head>
    <body>
      <div class="container">
          <h1>Select a Task to Add to Moodle</h1>
          {items_html}
      </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)


def build_deep_link_jwt(task_id: str, state: Dict[str, Any]) -> str:
    """
    Builds the signed JWT to return to the platform after a deep linking selection.
    """
    if task_id not in KNOWN_TASKS:
        raise ValueError("Unknown task_id")
    
    task = KNOWN_TASKS[task_id]
    tool_host = config.TOOL_HOST
    
    # This is the URL that will be configured in Moodle for the new link
    # Embed moodle_assignment_cmid in the target_link_uri
    launch_url = f"{tool_host}/task/{task_id}?moodle_cmid={task['moodle_assignment_cmid']}"

    now_ts = now()
    private_jwk = json.loads(config.TOOL_PRIVATE_JWK_JSON)

    payload = {
        "iss": config.PLATFORM_CLIENT_ID,
        "aud": config.PLATFORM_ISS,
        "iat": now_ts,
        "exp": now_ts + 300,
        "nonce": str(uuid.uuid4()),
        "https://purl.imsglobal.org/spec/lti/claim/message_type": "LtiDeepLinkingResponse",
        "https://purl.imsglobal.org/spec/lti/claim/version": "1.3.0",
        "https://purl.imsglobal.org/spec/lti/claim/deployment_id": state.get("deployment_id"),
        "https://purl.imsglobal.org/spec/lti-dl/claim/content_items": [
            {
                "type": "ltiResourceLink",
                "title": task["name"],
                "url": launch_url,
                "presentation": {"documentTarget": "iframe"},
                # You can add custom params here if needed
                "custom": {
                    "task_id": task_id,
                    "source": "deep-link-tool"
                }
            }
        ]
    }
    
    # Optional: include 'data' if platform provided it
    if state.get("data"):
        payload["https://purl.imsglobal.org/spec/lti-dl/claim/data"] = state.get("data")

    jwt_token = jwt.encode(
        payload,
        private_jwk,
        algorithm="RS256",
        headers={"kid": config.TOOL_KID, "typ": "JWT"}
    )
    return jwt_token