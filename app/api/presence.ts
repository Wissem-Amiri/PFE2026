import axios from 'axios';

const PRESENCE_API_BASE = 'http://localhost:8000';

export interface DetectedUser {
  name: string;
  attendance: string | boolean; // Backend returns "Present"/"Absent" as string
  email: string;
  phone_number?: string; // Backend uses phone_number
  phone?: string; // Mapping compatibility
  department: string;
  role: string;
  duration?: string; // For videos
}

export interface PresenceResponse {
  detected_users: DetectedUser[];
  json_file_path: string;
  image_file_path?: string;
  video_file_path?: string;
  message?: string;
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
    timeout: 300000,
  });

  // Normalize response
  const data = response.data;
  return {
    detected_users: data.results.map((u: any) => ({
      ...u,
      attendance: u.attendance === 'Present' || u.attendance === true,
      phone: u.phone_number || u.phone
    })),
    json_file_path: data.json_file,
    image_file_path: data.image_with_boxes,
    message: data.message
  };
}

/**
 * Process a video for presence analysis
 */
export async function processVideoPresence(file: File): Promise<PresenceResponse> {
  const formData = new FormData();
  formData.append('video_file', file); // API expects 'video_file'

  const response = await axios.post(`${PRESENCE_API_BASE}/api/presence/process_video`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 300000,
  });

  // Normalize response
  const data = response.data;
  return {
    detected_users: data.results.map((u: any) => ({
      ...u,
      attendance: u.attendance === 'Present' || u.attendance === true,
      phone: u.phone_number || u.phone
    })),
    json_file_path: '', // Video endpoint doesn't return a json path directly in root
    video_file_path: data.video_file
  };
}

/**
 * Get the full URL for a processed file (image or json)
 */
export function getPresenceFileUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // Handle absolute paths from backend (e.g., C:\Users\...)
  if (path.includes(':') || path.startsWith('/app/')) {
    // If it's a static mount, we need to map it
    const filename = path.split(/[\\/]/).pop();
    return `${PRESENCE_API_BASE}/app/uploads/${filename}`;
  }
  return `${PRESENCE_API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

