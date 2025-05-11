export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          category_id: string | null
          active: boolean
          created_at: string
          updated_at: string | null
          allowed_additional_ids: string[] | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          category_id?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string | null
          allowed_additional_ids?: string[] | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          category_id?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string | null
          allowed_additional_ids?: string[] | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          active: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          active?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      additionals: {
        Row: {
          id: string
          name: string
          price: number
          active: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          price: number
          active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          price?: number
          active?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      carousel_slides: {
        Row: {
          id: string
          title: string | null
          subtitle: string | null
          image_url: string
          active: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          title?: string | null
          subtitle?: string | null
          image_url: string
          active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string | null
          subtitle?: string | null
          image_url?: string
          active?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      phrases: {
        Row: {
          id: string
          text: string
          active: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          text: string
          active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          text?: string
          active?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      store_config: {
        Row: {
          id: string
          store_name: string
          logo_url: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          store_name: string
          logo_url?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          store_name?: string
          logo_url?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          customer_name: string
          customer_phone: string
          delivery_address: string | null
          payment_method: string
          total_amount: number
          status: string
          created_at: string
          updated_at: string | null
          items: Json
        }
        Insert: {
          id?: string
          customer_name: string
          customer_phone: string
          delivery_address?: string | null
          payment_method: string
          total_amount: number
          status?: string
          created_at?: string
          updated_at?: string | null
          items: Json
        }
        Update: {
          id?: string
          customer_name?: string
          customer_phone?: string
          delivery_address?: string | null
          payment_method?: string
          total_amount?: number
          status?: string
          created_at?: string
          updated_at?: string | null
          items?: Json
        }
      }
      page_contents: {
        Row: {
          id: string
          page_name: string
          content: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          page_name: string
          content: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          page_name?: string
          content?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      store_hours: {
        Row: {
          id: string
          day_of_week: number
          open_time: string | null
          close_time: string | null
          is_closed: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          day_of_week: number
          open_time?: string | null
          close_time?: string | null
          is_closed?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          day_of_week?: number
          open_time?: string | null
          close_time?: string | null
          is_closed?: boolean
          created_at?: string
          updated_at?: string | null
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
