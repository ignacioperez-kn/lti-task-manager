# main.py
import json
import logging
import uuid
import httpx

from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse, PlainTextResponse
from pydantic import BaseModel

# Import our separated modules
import config
import lti_security
import lti_services
import app_logic

# ------------------------------------------------------------------------------
# App & Logging Setup
# ------------------------------------------------------------------------------

logging.basicConfig(
    level=config.LOG_LEVEL,
    format="%(asctime)s %(levelname)s %(name)s [%(process)d] %(message)s",
)
logger = logging.getLogger("lti-tool")

app = FastAPI(title="LTI 1.3 Tool")

# ------------------------------------------------------------------------------
# Health & JWKS Endpoints
# ------------------------------------------------------------------------------

@app.get("/")
async def root():
    return {"message": "LTI tool root OK. Try /oidc/login or POST /lti/launch."}

@app.get("/healthz")
async def healthz():
    return {"ok": True}

@app.get("/.well-known/jwks.json")
async def tool_jwks():
    if not config.TOOL_PUBLIC_JWK_JSON:
        return {"keys": []}
    jwk = json.loads(config.TOOL_PUBLIC_JWK_JSON)
    jwk["kid"] = config.TOOL_KID
    return {"keys": [jwk]}

# ------------------------------------------------------------------------------
# LTI Handshake Endpoints
# ------------------------------------------------------------------------------

@app.get("/oidc/login")
@app.post("/oidc/login")
async def oidc_login(
    request: Request,
    iss: str = Form(default=""),
    login_hint: str = Form(default=""),
    lti_message_hint: str = Form(default=""),
    target_link_uri: str = Form(default=""),
):
    # Accept both GET and POST forms
    if not iss: iss = request.query_params.get("iss", "")
    if not login_hint: login_hint = request.query_params.get("login_hint", "")
    if not lti_message_hint: lti_message_hint = request.query_params.get("lti_message_hint", "")
    if not target_link_uri: target_link_uri = request.query_params.get("target_link_uri", "")

    if iss != config.PLATFORM_ISS:
        logger.warning(f"OIDC login attempt from unknown issuer: {iss}")
        return HTMLResponse("ISS mismatch", status_code=400)

    nonce = lti_security.new_nonce()
    state = lti_security.sign_state({"ts": lti_security.now(), "nonce": nonce})

    q = {
        "response_type": "id_token",
        "response_mode": "form_post",
        "scope": "openid",
        "client_id": config.PLATFORM_CLIENT_ID,
        "redirect_uri": f"{config.TOOL_HOST}/lti/launch",
        "login_hint": login_hint,
        "nonce": nonce,
        "state": state,
    }
    if lti_message_hint:
        q["lti_message_hint"] = lti_message_hint

    url = f"{config.PLATFORM_AUTHORIZATION_ENDPOINT}?{httpx.QueryParams(q)}"
    logger.info(f"OIDC login redirecting to: {url}")
    return RedirectResponse(url, status_code=302)


@app.post("/lti/launch")
async def lti_launch(id_token: str = Form(""), state: str = Form("")):
    try:
        # 1. Verify State
        state_payload = lti_security.verify_state(state)
        
        # 2. Validate ID Token
        claims = await lti_security.validate_id_token(id_token)
        
        # 3. Check nonce (must match nonce from state)
        if claims.get("nonce") != state_payload.get("nonce"):
             raise ValueError("Invalid nonce")

    except Exception as e:
        logger.error(f"LTI launch validation failed: {e}")
        return HTMLResponse(f"LTI launch validation failed: {e}", status_code=400)

    # 4. Route based on message type
    message_type = claims.get("https://purl.imsglobal.org/spec/lti/claim/message_type")
    
    if message_type == "LtiResourceLinkRequest":
        return await app_logic.handle_resource_link_request(claims)
        
    elif message_type == "LtiDeepLinkingRequest":
        return await app_logic.handle_deep_linking_request(claims)
        
    else:
        logger.error(f"LTI error: unknown message_type: {message_type}")
        return HTMLResponse(f"LTI error: unknown message_type: {message_type}", status_code=400)


@app.post("/lti/deeplink")
async def deep_link_return(state: str = Form(default=""), task_id: str = Form(...)):
    try:
        state_payload = lti_security.verify_state(state)
    except Exception as e:
        logger.error(f"Bad state for deep linking return: {e}")
        return HTMLResponse(f"Bad state for deep linking: {e}", status_code=400)

    dl_return_url = state_payload.get("dl_return")
    if not dl_return_url:
        return HTMLResponse("Missing return URL in state", status_code=400)

    try:
        deep_link_jwt = app_logic.build_deep_link_jwt(task_id, state_payload)
    except Exception as e:
        logger.error(f"Failed to build deep link JWT: {e}")
        return HTMLResponse(f"Server error: {e}", status_code=500)

    # Auto-POST back to platform’s return URL
    html = f"""
    <html>
    <head><title>Returning Deep Link</title></head>
    <body onload="document.forms[0].submit()" style="font-family: system-ui, sans-serif">
      <h1>Returning selection…</h1>
      <form method="post" action="{dl_return_url}">
        <input type="hidden" name="JWT" value="{deep_link_jwt}" />
        <noscript><button type="submit">Continue</button></noscript>
      </form>
    </body>
    </html>
    """
    return HTMLResponse(html)


# ------------------------------------------------------------------------------
# Submission Endpoint
# ------------------------------------------------------------------------------

class SubmissionPayload(BaseModel):
    user_id: int
    comment: str
    moodle_cmid: int

@app.post("/api/submit-feedback")
async def submit_feedback(payload: SubmissionPayload):
    """
    Receives the final submission from the task and passes it to the Moodle assignment.
    """
    logger.info(f"Received submission for user {payload.user_id} for CMID {payload.moodle_cmid}")

    success, error = await lti_services.create_assignment_submission(
        user_id=payload.user_id,
        submission_text=payload.comment,
        moodle_cmid=payload.moodle_cmid
    )

    if not success:
        logger.error(f"Moodle submission failed: {error}")
        return JSONResponse({"success": False, "error": error}, status_code=400)

    logger.info("Moodle submission successful.")
    return JSONResponse({"success": True})


# ------------------------------------------------------------------------------
# Debug endpoints for AGS and NRPS
# ------------------------------------------------------------------------------

@app.get("/debug/ags/lineitems")
async def debug_ags_lineitems():
    return HTMLResponse("""...""") # Omitting for brevity

@app.get("/debug/ags/lineitems/call")
async def call_ags_lineitems(url: str, scope: str):
    token, err = await lti_services.get_access_token(scope)
    if err:
        return PlainTextResponse(f"Token error: {err}", status_code=500)
    async with httpx.AsyncClient(timeout=15, headers={"Authorization": f"Bearer {token}"}) as client:
        r = await client.get(url)
    return PlainTextResponse(f"{r.status_code}\n\n{r.text}", status_code=r.status_code)

@app.get("/debug/nrps/memberships")
async def debug_nrps_memberships():
    return HTMLResponse("""...""") # Omitting for brevity

@app.get("/debug/nrps/memberships/call")
async def call_nrps_members(url: str, scope: str):
    token, err = await lti_services.get_access_token(scope)
    if err:
        return PlainTextResponse(f"Token error: {err}", status_code=500)
    async with httpx.AsyncClient(timeout=15, headers={
        "Authorization": f"Bearer {token}", 
        "Accept": "application/vnd.ims.lti-nrps.v2.membershipcontainer+json"
    }) as client:
        r = await client.get(url)
    return PlainTextResponse(f"{r.status_code}\n\n{r.text}", status_code=r.status_code)