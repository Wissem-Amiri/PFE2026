import { supabase } from './supabase'
import type { Utilisateur } from './database.types'

/** Get a single user profile by auth id */
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('utilisateur')
    .select('*')
    .eq('id', userId)
    .single()
  return { data: data as Utilisateur | null, error }
}

/** Update current user's profile fields */
export async function updateProfile(userId: string, updates: Partial<Utilisateur>) {
  // Use upsert to create the row if it doesn't exist, preventing PGRST116 error (0 rows updated)
  const { data, error } = await supabase
    .from('utilisateur')
    // @ts-expect-error fallback generic issues
    .upsert({ id: userId, ...updates })
    .select()

  if (error) {
    return { data: null, error }
  }

  // If upsert fails silently (due to tight RLS), fallback to a basic update without .single()
  if (!data || data.length === 0) {
    const { data: updateData, error: updateError } = await supabase
      .from('utilisateur')
      // @ts-expect-error fallback generic issues
      .update(updates)
      .eq('id', userId)
      .select()

    if (updateError) return { data: null, error: updateError }
    return { data: updateData?.[0] as Utilisateur | null, error: null }
  }

  return { data: data[0] as Utilisateur | null, error: null }
}

/** Get all users (admin only) */
export async function getAllUsers() {
  const { data, error } = await supabase
    .from('utilisateur')
    .select('*')
    .order('created_at', { ascending: false })
  return { data: data as Utilisateur[], error }
}

/** Update user status + role (admin action) */
export async function updateUserStatus(
  userId: string,
  status: 'approved' | 'rejected',
  hiringDetails?: { hire_date?: string; department?: string; monthly_rate?: number }
) {
  const updates: Partial<Utilisateur> = { status }
  if (status === 'approved') {
    updates.role = 'employee'
    if (hiringDetails) {
      if (hiringDetails.hire_date) updates.hire_date = hiringDetails.hire_date
      if (hiringDetails.department) updates.department = hiringDetails.department
      if (hiringDetails.monthly_rate) {
        // @ts-expect-error adding new field not in core type yet
        updates.monthly_rate = hiringDetails.monthly_rate
      }
    }
  }

  const { data, error } = await supabase
    .from('utilisateur')
    // @ts-expect-error fallback generic issues
    .update(updates)
    .eq('id', userId)
    .select()

  if (error) {
    console.error('Error updating user status:', error)
    return { data: null, error }
  }

  if (!data || data.length === 0) {
    console.warn('No rows updated. Check RLS policies for role Admin on table utilisateur.')
    return { data: null, error: { message: 'No rows updated' } }
  }

  return { data: data[0] as Utilisateur | null, error: null }
}

/** Delete a user permanently (Admin only) */
export async function deleteUser(userId: string) {
  const { error } = await supabase
    .from('utilisateur')
    .delete()
    .eq('id', userId)
  
  return { error }
}

/** Delete multiple users permanently (Admin only) */
export async function deleteUsers(userIds: string[]) {
  const { error, count } = await supabase
    .from('utilisateur')
    .delete({ count: 'exact' })
    .in('id', userIds)
  
  if (error) {
    console.error('Database deletion error:', error)
  }

  if (count === 0 && !error) {
    console.warn('Deletion successful command-wise but 0 rows removed. Likely RLS policy issue.')
  }
  
  return { error, count: count ?? 0 }
}

/** Export users list as CSV string */
export function exportToCSV(users: Utilisateur[]): string {
  const headers = ['Nom', 'Email', 'Rôle', 'Statut', 'Département', 'Poste', 'Téléphone', 'Date embauche', 'Inscrit le']
  const rows = users.map(u => [
    u.user_name ?? '',
    u.email ?? '',
    u.role ?? '',
    u.status ?? '',
    u.department ?? '',
    u.position ?? '',
    u.phone ?? '',
    u.hire_date ?? '',
    u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '',
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  return csv
}

/** Trigger CSV download in browser */
export function downloadCSV(csv: string, filename = 'utilisateurs.csv') {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** Upload user document/resume to 'documents' bucket */
export async function uploadDocument(file: File) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file)

  if (uploadError) {
    return { publicUrl: null, error: uploadError }
  }

  const { data } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath)

  return { publicUrl: data.publicUrl, error: null }
}
