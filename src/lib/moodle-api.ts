import { getEnv } from './env';

export interface MoodleUser {
  id: number;
  username: string;
  fullname: string;
  email: string;
  profileimageurl: string;
  lastaccess?: number;
}


async function _moodleApiCall(wsfunction: string, params: Record<string, string>) {
  const env = getEnv();
  
  console.log(`[Moodle API] Calling function: ${wsfunction}`);
  console.log(`[Moodle API] URL: ${env.MOODLE_API_URL}`);

  const body = new URLSearchParams({
    wsfunction,
    moodlewsrestformat: 'json',
    wstoken: env.MOODLE_API_TOKEN,
    ...params,
  });

  let lastError: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(env.MOODLE_API_URL, {
        method: 'POST',
        body,
      });

      const responseText = await response.text();

      if (response.ok) {
        console.log(`[Moodle API] Raw response for ${wsfunction}:`, responseText);
        return JSON.parse(responseText);
      }

      if (response.status === 503) {
        console.warn(`[Moodle API] Service unavailable (503) on attempt ${attempt} for ${wsfunction}. Retrying in 2s...`);
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          continue; // Next attempt
        }
      }
      
      // Handle non-503 errors or final failed 503 attempt
      console.error(`Moodle API error (${wsfunction}) - Status: ${response.status}`);
      console.error(`[Moodle API] URL: ${env.MOODLE_API_URL}`);
      console.error(`[Moodle API] Body: ${body.toString()}`);
      console.error(`[Moodle API] Response: ${responseText}`);
      return null;

    } catch (error) {
      lastError = error;
      console.error(`[Moodle API] Fetch failed on attempt ${attempt} for ${wsfunction}:`, error);
    }
  }
  
  console.error(`[Moodle API] All attempts failed for ${wsfunction}. Last error:`, lastError);
  return null;
}

export async function getCohortId(instructorUsername: string): Promise<number | null> {
  const env = getEnv(); // Moved from top level
  const data = await _moodleApiCall('core_cohort_search_cohorts', {
    query: instructorUsername,
    'context[contextlevel]': 'coursecat',
    'context[instanceid]': '1',
  });

  if (data?.cohorts?.length > 0) {
    return data.cohorts[0].id;
  }
  return null;
}

export async function getCohortMembers(cohortId: number): Promise<number[]> {
  const env = getEnv(); // Moved from top level
  const data = await _moodleApiCall('core_cohort_get_cohort_members', {
    'cohortids[0]': cohortId.toString(),
  });
  return data?.[0]?.userids || [];
}

export async function getUsersByIds(userIds: number[]): Promise<MoodleUser[]> {
  const env = getEnv(); // Moved from top level
  const params: Record<string, string> = { field: 'id' };
  userIds.forEach((id, index) => {
    params[`values[${index}]`] = id.toString();
  });
  const data = await _moodleApiCall('core_user_get_users_by_field', params);
  return data || [];
}
