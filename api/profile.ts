import { supabase } from './supabase'
import type { BaseUtilisateur, FullProfile, Employee } from './database.types'

/** Get a single user profile with all role-specific data using joins */
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('utilisateur')
    .select(`
      *,
      postulant(*),
      employee(*),
      admin(*)
    `)
    .eq('id', userId)
    .single()
  
  return { data: data as FullProfile | null, error }
}

/** Update user profile. Updates either base utilisateur or child table based on what is provided */
export async function updateProfile(userId: string, updates: Partial<FullProfile>) {
  const { postulant, employee, admin, ...baseUpdates } = updates

  // 1. Update Base utilisateur if there are base fields
  if (Object.keys(baseUpdates).length > 0) {
    const { error: baseError } = await supabase
      .from('utilisateur')
      .update(baseUpdates)
      .eq('id', userId)
    
    if (baseError) return { data: null, error: baseError }
  }

  // 2. Update Role-specific tables
  if (postulant) {
    const { error: pError } = await supabase.from('postulant').upsert({ id: userId, ...postulant })
    if (pError) return { data: null, error: pError }
  }
  
  if (employee) {
    const { error: eError } = await supabase.from('employee').upsert({ id: userId, ...employee })
    if (eError) return { data: null, error: eError }
  }

  if (admin) {
    const { error: aError } = await supabase.from('admin').upsert({ id: userId, ...admin })
    if (aError) return { data: null, error: aError }
  }

  return getProfile(userId)
}

/** Get all users (Admin view) - base info + essential employee/postulant fields */
export async function getAllUsers() {
  const { data, error } = await supabase
    .from('utilisateur')
    .select(`
      *,
      postulant(id, country),
      employee(id, department, position, hire_date, vacation_balance, monthly_rate)
    `)
    .order('created_at', { ascending: false })
  
  return { data: data as FullProfile[], error }
}

/** Update user status + role transition (Admin action) */
export async function updateUserStatus(
  userId: string,
  status: 'approved' | 'rejected',
  hiringDetails?: { hire_date?: string; department?: string; monthly_rate?: number; position?: string }
) {
  // 1. Update status in Base table
  const baseUpdates: Partial<BaseUtilisateur> = { status }
  
  if (status === 'approved') {
    baseUpdates.role = 'employee'
  }

  const { error: baseError } = await supabase
    .from('utilisateur')
    .update(baseUpdates)
    .eq('id', userId)

  if (baseError) return { data: null, error: baseError }

  // 2. If approved, create/update Employee record
  if (status === 'approved') {
    // Calculate initial vacation balance
    const hireDate = hiringDetails?.hire_date ? new Date(hiringDetails.hire_date) : new Date()
    const joinMonth = hireDate.getMonth() + 1
    const monthsRemaining = 12 - joinMonth + 1
    const initialBalance = (24 / 12) * monthsRemaining

    const employeeData: Partial<Employee> = {
      id: userId,
      hire_date: hiringDetails?.hire_date || new Date().toISOString().split('T')[0],
      department: hiringDetails?.department || 'General',
      position: hiringDetails?.position || 'Employee',
      monthly_rate: hiringDetails?.monthly_rate || 0,
      vacation_balance: initialBalance,
      postulant_id: userId // link back to its postulant self
    }

    const { error: empError } = await supabase
      .from('employee')
      .upsert(employeeData)
    
    if (empError) return { data: null, error: empError }
  }

  return getProfile(userId)
}

/** Delete a user permanently (Admin only) - cascades to child tables */
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
  
  return { error, count: count ?? 0 }
}

/** Upload user document to 'documents' bucket */
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

/**
 * Export a list of users to CSV format
 */
export function exportToCSV(users: FullProfile[]) {
  const headers = ['Name', 'Email', 'Role', 'Status', 'Created At']
  const rows = users.map(u => [
    u.user_name || '',
    u.email || '',
    u.role || '',
    u.status || '',
    u.created_at ? new Date(u.created_at).toLocaleDateString() : ''
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  return csvContent
}

/**
 * Triggers a download of a CSV string in the browser
 */
export function downloadCSV(csvContent: string, fileName: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
