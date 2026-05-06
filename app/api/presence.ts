import axios from 'axios';

const PRESENCE_API_BASE = 'https://detection-2k25-1.onrender.com';

export interface DetectedUser {
  name: string;
  attendance: boolean;
  email: string;
  phone: string;
  department: string;
  role: string;
}

export interface PresenceResponse {
  detected_users: DetectedUser[];
  json_file_path: string;
  image_file_path?: string;
  video_file_path?: string;
}

/**
 * Process an image for face detection and presence analysis
 */
export async function processImagePresence(file: File): Promise<PresenceResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${PRESENCE_API_BASE}/api/image-presence/process_image`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

/**
 * Process a video for presence analysis
 */
export async function processVideoPresence(file: File): Promise<PresenceResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${PRESENCE_API_BASE}/api/presence/process_video`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

/**
 * Get the full URL for a processed file (image or json)
 */
export function getPresenceFileUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return `${PRESENCE_API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

