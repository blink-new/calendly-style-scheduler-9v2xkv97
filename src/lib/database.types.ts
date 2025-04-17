
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      availability: {
        Row: {
          id: string
          user_id: string
          day_of_week: number
          start_time: string
          end_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          day_of_week: number
          start_time: string
          end_time: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          host_id: string
          guest_email: string
          guest_name: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          host_id: string
          guest_email: string
          guest_name: string
          title: string
          description?: string | null
          start_time: string
          end_time: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          host_id?: string
          guest_email?: string
          guest_name?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      meeting_types: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          duration: number
          color: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          duration: number
          color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          duration?: number
          color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}