import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database schema
export interface Task {
  id: string
  user_id: string
  title: string
  description?: string
  due_date?: string
  completed: boolean
  tags?: string[]
  created_at: string
  updated_at: string
  category_id?: string
  priority: number
  order_index: number
  category?: Category
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  theme: 'light' | 'dark'
  background_image_url?: string
  notification_enabled: boolean
  reminder_time: number
  auto_background_change: boolean
  created_at: string
  updated_at: string
}

export interface BackgroundImage {
  id: string
  user_id: string
  url: string
  prompt: string
  is_active: boolean
  created_at: string
}

export interface TaskLog {
  id: string
  task_id: string
  user_id: string
  completed_at: string
  action: 'completed' | 'created' | 'updated'
}

// Database types
export interface Database{
    public: {
        Tables:{
            tasks:{
                Row: Task
                Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>
                Updated: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>
            }
            Category:{
                Row: Category
                Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'>
                Updated: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>
            }
            UserPreferences:{
                Row: UserPreferences
                Insert: Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>
                Updated: Partial<Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'>>
            }
            BackgroundImage:{
                Row: BackgroundImage
                Insert: Omit<BackgroundImage, 'id' | 'created_at' | 'updated_at'>
                Updated: Partial<Omit<BackgroundImage, 'id' | 'created_at' | 'updated_at'>>
            }
            TaskLog:{
                Row: TaskLog
                Insert: Omit<TaskLog, 'id' | 'created_at' | 'updated_at'>
                Updated: Partial<Omit<TaskLog, 'id' | 'created_at' | 'updated_at'>>
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