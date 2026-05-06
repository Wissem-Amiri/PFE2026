import { supabase } from '@/lib/supabase'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  is_read: boolean
  type: 'new_candidate' | 'job_application' | 'leave_request' | 'leave_status' | 'congrats' | 'info' | 'default'
  metadata?: any
  created_at: string
}

/**
 * Fetch notifications for a specific user with pagination.
 */
export async function getNotificationsPaginated(userId: string, { page = 1, pageSize = 10 }) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Error fetching notifications:', error)
    return { data: null, count: 0, error }
  }

  return { data: data as Notification[], count: count || 0, error: null }
}

/**
 * Fetch unread notifications for a specific user.
 */
export async function getUnreadNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching unread notifications:', error)
    return { data: null, error }
  }

  return { data: data as Notification[], error: null }
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(notificationId: string) {
  const { error } = await (supabase as any)
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) {
    console.error('Error marking notification as read:', error)
    return { error }
  }

  return { error: null }
}

/**
 * Mark all unread notifications as read for a specific user.
 */
export async function markAllNotificationsAsRead(userId: string) {
  const { error } = await (supabase as any)
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('Error marking all notifications as read:', error)
    return { error }
  }

  return { error: null }
}

/**
 * Delete a specific notification.
 */
export async function deleteNotification(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)

  if (error) {
    console.error('Error deleting notification:', error)
    return { error }
  }

  return { error: null }
}

