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
      workspace_onboarding: {
        Row: {
          id: string
          workspace_id: string
          first_name: string
          last_name: string
          email: string
          company_name: string
          website: string | null
          sales_development_representative: string | null
          product_description_short: string
          product_description_indepth: string | null
          usp: string
          icp_persona: string
          icp_geography: "US" | "EU" | "Global" | "Other"
          icp_industry: string
          icp_job_titles: string
          icp_company_size: "1-10" | "11-50" | "51-200" | "201-5000" | "5001+" | null
          icp_pains_needs: string
          competitors: string
          common_objections: string
          reasons_to_believe: string
          lead_magnet_ideas: string
          product_presentation_url: string | null
          video_presentation_url: string | null
          calendar_integration: boolean
          cal_com_api_key: string | null
          useful_information: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['workspace_onboarding']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['workspace_onboarding']['Insert']>
      }
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'client'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      workspaces: {
        Row: {
          id: string
          name: string
          subdomain: string | null
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['workspaces']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['workspaces']['Insert']>
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