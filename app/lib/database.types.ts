export interface Experience {
  id: string
  title: string
  company: string
  startDate: string
  endDate: string
  projectUrl?: string
}

export interface BaseUtilisateur {
  id: string
  user_name: string | null
  email: string | null
  role: 'postulant' | 'employee' | 'admin'
  status: 'pending' | 'approved' | 'rejected'
  phone: string | null
  avatar_url: string | null
  created_at: string | null
}

export interface Postulant {
  id: string
  bio: string | null
  country: string | null
  timezone: string | null
  resume_url: string | null
  motivational_letter_url: string | null
  website: string | null
  portfolio: string | null
  position: string | null
  experiences: Experience[] | null
}

export interface Employee {
  id: string
  department: string | null
  position: string | null
  hire_date: string | null
  vacation_balance: number | null
  monthly_rate: number | null
  bio: string | null
  country: string | null
  postulant_id: string | null
}

export interface Admin {
  id: string
  department: string | null
}

/** Combined type for convenience in some views */
export type FullProfile = BaseUtilisateur & {
  postulant?: Postulant | null
  employee?: Employee | null
  admin?: Admin | null
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
  postulant_id: string
  job_id: string
  status: 'pending' | 'accepted' | 'rejected'
  is_archived: boolean
  applied_at: string
}

export interface Conge {
  id: string
  employee_id: string
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
        Row: BaseUtilisateur
        Insert: Partial<BaseUtilisateur> & { id: string }
        Update: Partial<BaseUtilisateur>
        Relationships: []
      }
      postulant: {
        Row: Postulant
        Insert: Partial<Postulant> & { id: string }
        Update: Partial<Postulant>
        Relationships: []
      }
      employee: {
        Row: Employee
        Insert: Partial<Employee> & { id: string }
        Update: Partial<Employee>
        Relationships: []
      }
      admin: {
        Row: Admin
        Insert: Partial<Admin> & { id: string }
        Update: Partial<Admin>
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
        Insert: Omit<Candidature, 'id' | 'applied_at' | 'status' | 'is_archived'> & { id?: string; applied_at?: string; status?: 'pending' | 'accepted' | 'rejected'; is_archived?: boolean }
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