# syntax=docker/dockerfile:1.4
# Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Non-secret variables can also be passed this way for consistency
ENV PLATFORM_ISS="https://katjanoponen.moodlecloud.com"
ENV PLATFORM_AUTHORIZATION_ENDPOINT="https://katjanoponen.moodlecloud.com/mod/lti/auth.php"
ENV PLATFORM_TOKEN_ENDPOINT="https://katjanoponen.moodlecloud.com/mod/lti/token.php"
ENV PLATFORM_JWKS_ENDPOINT="https://katjanoponen.moodlecloud.com/mod/lti/certs.php"
ENV NEXT_PUBLIC_TOOL_HOST="https://lti-task-manager-67832099934.europe-north1.run.app"
ENV MOODLE_API_URL="https://katjanoponen.moodlecloud.com/webservice/rest/server.php"
ENV NODE_ENV=production

# Non-secret variables can also be passed this way for consistency
ENV PLATFORM_ISS="https://katjanoponen.moodlecloud.com"
ENV PLATFORM_AUTHORIZATION_ENDPOINT="https://katjanoponen.moodlecloud.com/mod/lti/auth.php"
ENV PLATFORM_TOKEN_ENDPOINT="https://katjanoponen.moodlecloud.com/mod/lti/token.php"
ENV PLATFORM_JWKS_ENDPOINT="https://katjanoponen.moodlecloud.com/mod/lti/certs.php"
ENV NEXT_PUBLIC_TOOL_HOST="https://lti-task-manager-67832099934.europe-north1.run.app"
ENV MOODLE_API_URL="https://katjanoponen.moodlecloud.com/webservice/rest/server.php"
ENV NODE_ENV=production

RUN npm run build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the port Next.js runs on
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
