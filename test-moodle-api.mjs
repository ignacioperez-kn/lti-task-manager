// test-moodle-api.mjs
import { z } from 'zod';
import dotenv from 'dotenv';

// Explicitly load variables from .env.local
dotenv.config({ path: '.env.local' });

// --- Logic from src/lib/env.ts ---
const EnvSchema = z.object({
  MOODLE_API_TOKEN: z.string(),
  MOODLE_API_URL: z.string().url(),
});

let env;
function getEnv() {
  if (!env) {
    const result = EnvSchema.safeParse(process.env);
    if (!result.success) {
      console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
      throw new Error('Invalid environment variables. Make sure MOODLE_API_TOKEN and MOODLE_API_URL are in .env.local');
    }
    env = result.data;
  }
  return env;
}

// --- Logic from src/lib/moodle-api.ts ---
async function getCohortId(instructorEmail) {
  const env = getEnv();
  const emailPrefix = instructorEmail.split('@')[0];

  const params = new URLSearchParams({
    wsfunction: 'core_cohort_search_cohorts',
    moodlewsrestformat: 'json',
    wstoken: env.MOODLE_API_TOKEN,
    query: emailPrefix,
    'context[contextlevel]': 'coursecat',
    'context[instanceid]': '1',
  });

  try {
    const response = await fetch(env.MOODLE_API_URL, {
      method: 'POST',
      body: params,
    });

    if (!response.ok) {
      console.error('Moodle API error (getCohortId):', await response.text());
      return null;
    }

    const data = await response.json();
    if (data.cohorts && data.cohorts.length > 0) {
      return data.cohorts[0].id;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch cohort ID from Moodle:', error);
    return null;
  }
}

async function getCohortMembers(cohortId) {
  const env = getEnv();
  const params = new URLSearchParams({
    wsfunction: 'core_cohort_get_cohort_members',
    moodlewsrestformat: 'json',
    wstoken: env.MOODLE_API_TOKEN,
    'cohortids[0]': cohortId.toString(),
  });

  try {
    const response = await fetch(env.MOODLE_API_URL, {
      method: 'POST',
      body: params,
    });

    if (!response.ok) {
      console.error('Moodle API error (getCohortMembers):', await response.text());
      return [];
    }

    const data = await response.json();
    if (data && data.length > 0 && data[0].userids) {
      return data[0].userids;
    }
    return [];
  } catch (error) {
    console.error('Failed to fetch cohort members from Moodle:', error);
    return [];
  }
}


// --- Test Runner ---
async function testMoodleApi() {
  try {
    const testInstructorEmail = 'valme.valmentaja@katjanoponen.fi'; 
    console.log(`Testing Moodle API for instructor: ${testInstructorEmail}`);

    const cohortId = await getCohortId(testInstructorEmail);
    if (cohortId) {
      console.log(`Found Cohort ID: ${cohortId}`);
      const members = await getCohortMembers(cohortId);
      if (members.length > 0) {
        console.log(`Cohort Members (User IDs): ${members.join(', ')}`);
      } else {
        console.log('No members found in the cohort.');
      }
    } else {
      console.log(`No cohort found for instructor: ${testInstructorEmail}`);
    }
  } catch (error) {
    console.error('An error occurred during Moodle API test:', error);
  }
}

testMoodleApi();