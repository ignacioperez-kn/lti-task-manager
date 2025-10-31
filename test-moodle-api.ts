// test-moodle-api.ts
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // Explicitly load .env.local

import { getCohortId, getCohortMembers } from './src/lib/moodle-api';

async function runTest() {
  try {
    const testInstructorEmail = 'valme.valmentaja@katjanoponen.fi';
    console.log(`[TS Test] Testing Moodle API for instructor: ${testInstructorEmail}`);

    const cohortId = await getCohortId(testInstructorEmail);

    if (cohortId) {
      console.log(`[TS Test] Found Cohort ID: ${cohortId}`);
      const members = await getCohortMembers(cohortId);
      if (members.length > 0) {
        console.log(`[TS Test] Cohort Members (User IDs): ${members.join(', ')}`);
        console.log("\n✅ Test Passed: The moodle-api.ts file is working correctly.");
      } else {
        console.log('[TS Test] No members found in the cohort.');
        console.log("\n❌ Test Failed: Found cohort but no members.");
      }
    } else {
      console.log(`[TS Test] No cohort found for instructor: ${testInstructorEmail}`);
      console.log("\n❌ Test Failed: Could not find cohort.");
    }
  } catch (error) {
    console.error('\n❌ An error occurred during the test:', error);
  }
}

runTest();
