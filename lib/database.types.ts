export interface Experience {
  id: string
  title: string
  company: string
  startDate: string
  endDate: string
  projectUrl?: string
}

export interface BaseUser {
  id: string
  user_name: string | null
  email: string | null
  role: 'candidate' | 'employee' | 'admin'
  status: 'pending' | 'approved' | 'rejected'
  phone: string | null
  avatar_url: string | null
  is_archived: boolean
  created_at: string | null
}

export type User = BaseUser;

export interface Candidate {
  id: string
  bio: string | null
  country: string | null
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
  candidate_id: string | null
}

export interface Admin {
  id: string
  department: string | null
}

/** Combined type for convenience in some views */
export type FullProfile = BaseUser & {
  candidate?: Candidate | null
  employee?: Employee | null
  admin?: Admin | null
  department?: string | null
  position?: string | null
}

export interface EmployeeDirectoryItem extends BaseUser {
  department: string | null
  position: string | null
  hire_date: string | null
  vacation_balance: number | null
  monthly_rate: number | null
}

export interface LeaveActivityItem {
  id: string
  employee_id: string
  type: string
  start_date: string
  end_date: string
  reason: string | null
  status: string
  is_archived: boolean
  created_at: string
  user_name: string | null
  avatar_url: string | null
  department: string | null
  position: string | null
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
  requirements: string
  created_at: string
}

export interface Application {
  id: string
  candidate_id: string
  job_id: string
  status: 'pending' | 'accepted' | 'rejected'
  is_archived: boolean
  applied_at: string
  match_score: number | null
  ai_analysis: any | null
}

export interface DetailedApplication extends Application {
  candidate: (Candidate & { user: BaseUser }) | null
}

export interface ApplicationWithJob extends Application {
  job: Job | null
}

export interface ApplicationActivityItem {
  id: string
  candidate_id: string
  job_id: string
  status: string
  is_archived: boolean
  applied_at: string
  user_name: string | null
  avatar_url: string | null
  email: string | null
  phone: string | null
  job_title: string | null
  match_score: number | null
  ai_analysis: any | null
  resume_url: string | null
}

export interface Leave {
  id: string
  employee_id: string
  type: string
  start_date: string
  end_date: string
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string | null
  created_at: string
}

export interface Recording {
  id: string
  name: string
  url: string
  size: string
  type: string
  uploaded_by: string
  created_at: string
  updated_at: string
  uploader?: {
    user_name: string | null
    email: string | null
    avatar_url: string | null
  }
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: BaseUser
        Insert: Partial<BaseUser> & { id: string }
        Update: Partial<BaseUser>
        Relationships: []
      }
      candidates: {
        Row: Candidate
        Insert: Partial<Candidate> & { id: string }
        Update: Partial<Candidate>
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
        Insert: Omit<Job, 'id' | 'created_at' | 'requirements'> & { id?: string; created_at?: string; requirements?: string }
        Update: Partial<Omit<Job, 'id'>>
        Relationships: []
      }
      applications: {
        Row: Application
        Insert: Omit<Application, 'id' | 'applied_at' | 'status' | 'is_archived'> & { id?: string; applied_at?: string; status?: 'pending' | 'accepted' | 'rejected'; is_archived?: boolean }
        Update: Partial<Omit<Application, 'id'>>
        Relationships: []
      }
      leaves: {
        Row: Leave
        Insert: Omit<Leave, 'id' | 'created_at' | 'status'> & { id?: string; created_at?: string; status?: 'pending' | 'approved' | 'rejected' }
        Update: Partial<Omit<Leave, 'id'>>
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: Omit<{ id: string; user_id: string; title: string; message: string; is_read: boolean; created_at: string }, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<{ id: string; user_id: string; title: string; message: string; is_read: boolean; created_at: string }>
        Relationships: []
      }
    }
    Views: Record<string, any>
    Functions: {
      create_admin_notification: {
        Args: {
          p_title: string
          p_message: string
        }
        Returns: void
      }
    }
    Enums: Record<string, any>
  }
}
