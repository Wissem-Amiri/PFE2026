export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          password: string | null;
          created_at: string | null;        
        }
    }
}
    }
  }