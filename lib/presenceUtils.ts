import { getProfileByEmail } from '@/app/api/profile';
import type { DetectedUser } from '@/app/api/presence';
import type { FullProfile } from './database.types';

export interface DetectionWithProfile extends DetectedUser {
  profile?: FullProfile | null;
}

/**
 * Enriches a list of detections with local profile data from Supabase
 */
export async function enrichDetections(detections: DetectedUser[]): Promise<DetectionWithProfile[]> {
  const enrichmentPromises = detections.map(async (detection) => {
    try {
      const { data: profile } = await getProfileByEmail(detection.email);
      return {
        ...detection,
        profile: profile || null,
      };
    } catch (err) {
      console.error(`Error enriching detection for ${detection.email}:`, err);
      return { ...detection, profile: null };
    }
  });

  return Promise.all(enrichmentPromises);
}
