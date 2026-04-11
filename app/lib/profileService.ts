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
  const { data, error } = await supabase
    .from('utilisateur')
    // @ts-expect-error fallback generic issues
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  return { data: data as Utilisateur | null, error }
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
) {
  const updates: Partial<Utilisateur> = { status }
  if (status === 'approved') updates.role = 'employee'

  const { data, error } = await supabase
    .from('utilisateur')
    // @ts-expect-error fallback generic issues
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  return { data: data as Utilisateur | null, error }
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
