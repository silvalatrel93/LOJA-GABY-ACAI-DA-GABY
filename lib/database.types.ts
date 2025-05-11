export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: number
          name: string
          description: string
          image: string
          sizes: Json
          category_id: number
          active: boolean
          allowed_additionals: number[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description: string
          image: string
          sizes: Json
          category_id: number
          active?: boolean
          allowed_additionals?: number[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string
          image?: string
          sizes?: Json
          category_id?: number
          active?: boolean
          allowed_additionals?: number[] | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: number
          name: string
          order: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          order: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      additionals: {
        Row: {
          id: number
          name: string
          price: number
          category_id: number
          active: boolean
          image: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          price: number
          category_id: number
          active?: boolean
          image?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          price?: number
          category_id?: number
          active?: boolean
          image?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: number
          customer_name: string
          customer_phone: string
          address: Json
          items: Json
          subtotal: number
          delivery_fee: number
          total: number
          payment_method: string
          status: string
          date: string
          printed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          customer_name: string
          customer_phone: string
          address: Json
          items: Json
          subtotal: number
          delivery_fee: number
          total: number
          payment_method: string
          status: string
          date: string
          printed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          customer_name?: string
          customer_phone?: string
          address?: Json
          items?: Json
          subtotal?: number
          delivery_fee?: number
          total?: number
          payment_method?: string
          status?: string
          date?: string
          printed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      carousel_slides: {
        Row: {
          id: number
          image: string
          title: string
          subtitle: string
          order: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          image: string
          title: string
          subtitle: string
          order: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          image?: string
          title?: string
          subtitle?: string
          order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      phrases: {
        Row: {
          id: number
          text: string
          order: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          text: string
          order: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          text?: string
          order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      store_config: {
        Row: {
          id: string
          name: string
          logo_url: string
          delivery_fee: number
          is_open: boolean
          operating_hours: Json
          special_dates: Json
          last_updated: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          logo_url: string
          delivery_fee: number
          is_open?: boolean
          operating_hours: Json
          special_dates?: Json
          last_updated: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string
          delivery_fee?: number
          is_open?: boolean
          operating_hours?: Json
          special_dates?: Json
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
      }
      page_content: {
        Row: {
          id: string
          title: string
          content: string
          last_updated: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          title: string
          content: string
          last_updated: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          last_updated?: string
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: number
          title: string
          message: string
          type: string
          active: boolean
          start_date: string
          end_date: string
          priority: number
          read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title: string
          message: string
          type: string
          active?: boolean
          start_date: string
          end_date: string
          priority: number
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string
          message?: string
          type?: string
          active?: boolean
          start_date?: string
          end_date?: string
          priority?: number
          read?: boolean
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
