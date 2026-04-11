export interface Utilisateur {
  id: string
  user_name: string | null
  email: string | null
  role: 'postulant' | 'employee' | 'admin'
  status: 'pending' | 'approved' | 'rejected'
  phone: string | null
  department: string | null
  position: string | null
  hire_date: string | null
  avatar_url: string | null
  created_at: string | null
}

export interface Job {
  id: string
  title: string
  category: string
  description: string
  deadline: string // format YYYY-MM-DD
  status: 'published' | 'draft'
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      utilisateur: {
        Row: Utilisateur
        Insert: Partial<Utilisateur> & { id: string }
        Update: Partial<Utilisateur>
      }
      jobs: {
        Row: Job
        Insert: Omit<Job, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Job, 'id'>>
      }
    }
    Views: Record<string, any>
    Functions: Record<string, any>
    Enums: Record<string, any>
  }
}