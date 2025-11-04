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

  try {
    const response = await fetch(env.MOODLE_API_URL, {
      method: 'POST',
      body,
    });

    const responseText = await response.text();
    console.log(`[Moodle API] Raw response for ${wsfunction}:`, responseText);

    if (!response.ok) {
      console.error(`Moodle API error (${wsfunction}):`, response.status);
      return null;
    }
    return JSON.parse(responseText);
  } catch (error) {
    console.error(`Failed to fetch from Moodle API (${wsfunction}):`, error);
    return null;
  }
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
