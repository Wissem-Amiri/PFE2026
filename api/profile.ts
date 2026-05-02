import { supabase } from './supabase'
import type { BaseUtilisateur, FullProfile, Employee } from './database.types'

/** Get a single user profile by email with all role-specific data using joins */
export async function getProfileByEmail(email: string) {
  const { data, error } = await supabase
    .from('utilisateur')
    .select(`
      *,
      candidat(*),
      employee(*),
      admin(*)
    `)
    .eq('email', email)
    .maybeSingle()
  
  return { data: data as FullProfile | null, error }
}

/** Get a single user profile with all role-specific data using joins */
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('utilisateur')
    .select(`
      *,
      candidat(*),
      employee(*),
      admin(*)
    `)
    .eq('id', userId)
    .single()
  
  return { data: data as FullProfile | null, error }
}

export async function updateProfile(userId: string, updates: Partial<BaseUtilisateur> & {
  candidat?: Partial<Candidat> | null,
  employee?: Partial<Employee> | null,
  admin?: Partial<Admin> | null
}) {
  const { candidat, employee, admin, ...baseUpdates } = updates

  // 1. Update Base utilisateur if there are base fields
  if (Object.keys(baseUpdates).length > 0) {
    const { error: baseError } = await supabase
      .from('utilisateur')
      .update(baseUpdates)
      .eq('id', userId)
    
    if (baseError) return { data: null, error: baseError }
  }

  // 2. Update Role-specific tables
  if (candidat) {
    const { error: pError } = await supabase.from('candidat').upsert({ id: userId, ...candidat })
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

/** Get all users (Admin view) - base info + essential employee/candidat fields */
export async function getAllUsers() {
  const { data, error } = await supabase
    .from('utilisateur')
    .select(`
      *,
      candidat(id, country),
      employee(id, department, position, hire_date, vacation_balance, monthly_rate)
    `)
    .order('created_at', { ascending: false })
  
  return { data: data as FullProfile[], error }
}

/** Get employees with pagination and filters (Admin) */
export async function getEmployeesPaginated(params: {
  page: number;
  pageSize: number;
  search?: string;
  department?: string;
  showArchived?: boolean;
}) {
  const { page, pageSize, search, department, showArchived = false } = params;

  let query = supabase
    .from('v_employee_directory')
    .select('*', { count: 'exact' })
    .eq('role', 'employee')
    .eq('status', 'approved')
    .eq('is_archived', showArchived);

  if (department && department !== 'All Departments') {
    query = query.eq('department', department);
  }

  if (search) {
    query = query.or(`user_name.ilike.%${search}%,email.ilike.%${search}%,department.ilike.%${search}%,position.ilike.%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  return { data: data as FullProfile[], count: count || 0, error };
}

export async function archiveUsers(ids: string[]) {
  const { data, error } = await supabase
    .from('utilisateur')
    .update({ is_archived: true })
    .in('id', ids)
    .select()
  return { data, error }
}

export async function unarchiveUsers(ids: string[]) {
  const { data, error } = await supabase
    .from('utilisateur')
    .update({ is_archived: false })
    .in('id', ids)
    .select()
  return { data, error }
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
    const employeeData: Partial<Employee> = {
      id: userId,
      hire_date: hiringDetails?.hire_date || new Date().toISOString().split('T')[0],
      department: hiringDetails?.department || 'General',
      position: hiringDetails?.position || 'Employee',
      monthly_rate: Number(hiringDetails?.monthly_rate) || 0,
      vacation_balance: 0, // Will be accumulated monthly by the cron job (with prorata)
      candidat_id: hiringDetails?.candidat_id || null // link back to its candidat self if exists
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

/** Upload user avatar to 'avatars' bucket */
export async function uploadAvatar(userId: string, file: File) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `${userId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file)

  if (uploadError) {
    return { publicUrl: null, error: uploadError }
  }

  const { data } = supabase.storage
    .from('avatars')
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
/**
 * Admin creates a brand new employee account from scratch.
 * Note: In a production environment, this should trigger an Edge Function 
 * to securely create the Auth user without logging out the Admin.
 */
export async function createEmployeeAccount(data: {
  user_name: string
  email: string
  password?: string
  hire_date: string
  department: string
  position: string
  monthly_rate: number
}) {
  console.log('🚀 Calling invitation API for:', data.email)
  
  try {
    const response = await fetch('/api/invite-employee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    const result = await response.json()

    if (!response.ok) {
      return { data: null, error: new Error(result.error || 'Failed to invite employee') }
    }

    console.log('✅ Invitation Success:', result)
    return { data: result, error: null }
  } catch (error: any) {
    console.error('❌ API Error:', error)
    return { data: null, error }
  }
}
