export interface Experience {
  id: string
  title: string
  company: string
  startDate: string
  endDate: string
  projectUrl?: string
}

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
  country?: string | null
  timezone?: string | null
  bio?: string | null
  resume_url?: string | null
  motivational_letter_url?: string | null
  website?: string | null
  portfolio?: string | null
  experiences?: Experience[] | null
}

export interface Job {
  id: string
  title: string
  category: string
  description: string
  deadline: string // format YYYY-MM-DD
  is_open: boolean
  job_picture: string | null
  open_seats: number
  created_at: string
}

export interface Candidature {
  id: string
  user_id: string
  job_id: string
  status: 'pending' | 'accepted' | 'rejected'
  applied_at: string
}

export interface Conge {
  id: string
  user_id: string
  type: string
  start_date: string
  end_date: string
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      utilisateur: {
        Row: Utilisateur
        Insert: Partial<Utilisateur> & { id: string }
        Update: Partial<Utilisateur>
        Relationships: []
      }
      jobs: {
        Row: Job
        Insert: Omit<Job, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Job, 'id'>>
        Relationships: []
      }
      candidatures: {
        Row: Candidature
        Insert: Omit<Candidature, 'id' | 'applied_at' | 'status'> & { id?: string; applied_at?: string; status?: 'pending' | 'accepted' | 'rejected' }
        Update: Partial<Omit<Candidature, 'id'>>
        Relationships: []
      }
      conges: {
        Row: Conge
        Insert: Omit<Conge, 'id' | 'created_at' | 'status'> & { id?: string; created_at?: string; status?: 'pending' | 'approved' | 'rejected' }
        Update: Partial<Omit<Conge, 'id'>>
        Relationships: []
      }
    }
    Views: Record<string, any>
    Functions: Record<string, any>
    Enums: Record<string, any>
  }
}