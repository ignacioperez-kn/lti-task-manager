param(
    [switch]$SkipBuild
)

# Stop the script immediately if any command fails.
$ErrorActionPreference = "Stop"

# --- Configuration ---
# IMPORTANT: Fill in your Google Cloud Project ID and desired region before running.
$PROJECT_ID = "moodle-kn"
$REGION = "europe-north1" # e.g., us-central1, europe-west1

# --- Service Details ---
$SERVICE_NAME = "lti-task-manager"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

# --- Pre-flight Checks ---
if ($PROJECT_ID -eq "your-gcp-project-id" -or $REGION -eq "your-gcp-region") {
    Write-Host "ERROR: Please update the PROJECT_ID and REGION variables in this script before running." -ForegroundColor Red
    exit 1
}

# --- Step 1: Run Cloud Build (Conditional) ---
if (-not $SkipBuild) {
    Write-Host "Starting Google Cloud Build..." -ForegroundColor Cyan
    gcloud builds submit --config cloudbuild.yaml --substitutions="_PROJECT_ID=$PROJECT_ID,_SERVICE_NAME=$SERVICE_NAME"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Google Cloud Build failed. See logs above for details." -ForegroundColor Red
        exit 1
    }
    Write-Host "Cloud Build successful!" -ForegroundColor Green
} else {
    Write-Host "Skipping Cloud Build as -SkipBuild was specified." -ForegroundColor Yellow
}

# --- Step 2: Deploy to Cloud Run using gcloud run deploy ---
Write-Host "Deploying to Google Cloud Run..." -ForegroundColor Cyan

# Define environment variables as a single comma-separated string
$envVars = @(
    "NODE_ENV=production",
    "PLATFORM_ISS=https://katjanoponen.moodlecloud.com",
    "PLATFORM_AUTHORIZATION_ENDPOINT=https://katjanoponen.moodlecloud.com/mod/lti/auth.php",
    "PLATFORM_TOKEN_ENDPOINT=https://katjanoponen.moodlecloud.com/mod/lti/token.php",
    "PLATFORM_JWKS_ENDPOINT=https://katjanoponen.moodlecloud.com/mod/lti/certs.php",
    "NEXT_PUBLIC_TOOL_HOST=https://lti-task-manager-67832099934.europe-north1.run.app",
    "MOODLE_API_URL=https://katjanoponen.moodlecloud.com/webservice/rest/server.php"
) -join ","

# Define secrets as a single comma-separated string
$secrets = @(
    "TOOL_PRIVATE_KEY=lti-tool-private-key:latest",
    "SESSION_SECRET=lti-session-secret:latest",
    "PLATFORM_CLIENT_ID=lti-platform-client-id:latest",
    "PUBLIC_KEY=lti-public-key:latest",
    "FIREBASE_API_KEY=firebase-api-key:latest",
    "FIREBASE_AUTH_DOMAIN=firebase-auth-domain:latest",
    "FIREBASE_PROJECT_ID=firebase-project-id:latest",
    "FIREBASE_STORAGE_BUCKET=firebase-storage-bucket:latest",
    "FIREBASE_MESSAGING_SENDER_ID=firebase-messaging-sender-id:latest",
    "FIREBASE_APP_ID=firebase-app-id:latest",
    "MOODLE_API_TOKEN=moodle-task-token:latest"
) -join ","

gcloud run deploy $SERVICE_NAME `
    --image $IMAGE_NAME `
    --region $REGION `
    --platform managed `
    --allow-unauthenticated `
    --set-env-vars "$envVars" `
    --set-secrets "$secrets"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Google Cloud Run deployment failed." -ForegroundColor Red
    exit 1
}

Write-Host "------------------------------------------------------------------" -ForegroundColor Green
Write-Host "SUCCESS! Your service has been deployed." -ForegroundColor Green
Write-Host "------------------------------------------------------------------"
