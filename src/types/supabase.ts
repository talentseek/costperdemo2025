export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          role: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          }
        ]
      }
      workspace_onboarding: {
        Row: {
          admin_notes: string | null
          cal_com_api_key: string | null
          calendar_integration: boolean | null
          common_objections: string | null
          company_name: string
          competitors: string | null
          created_at: string | null
          email: string
          first_name: string
          icp_company_size: string | null
          icp_geography: string | null
          icp_industry: string | null
          icp_job_titles: string | null
          icp_pains_needs: string | null
          icp_persona: string | null
          id: string
          last_name: string
          lead_magnet_ideas: string | null
          product_description_indepth: string | null
          product_description_short: string | null
          product_presentation_url: string | null
          reasons_to_believe: string | null
          sales_development_representative: string | null
          status: string | null
          useful_information: string | null
          usp: string | null
          video_presentation_url: string | null
          website: string | null
          workspace_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          cal_com_api_key?: string | null
          calendar_integration?: boolean | null
          common_objections?: string | null
          company_name: string
          competitors?: string | null
          created_at?: string | null
          email: string
          first_name: string
          icp_company_size?: string | null
          icp_geography?: string | null
          icp_industry?: string | null
          icp_job_titles?: string | null
          icp_pains_needs?: string | null
          icp_persona?: string | null
          id?: string
          last_name: string
          lead_magnet_ideas?: string | null
          product_description_indepth?: string | null
          product_description_short?: string | null
          product_presentation_url?: string | null
          reasons_to_believe?: string | null
          sales_development_representative?: string | null
          status?: string | null
          useful_information?: string | null
          usp?: string | null
          video_presentation_url?: string | null
          website?: string | null
          workspace_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          cal_com_api_key?: string | null
          calendar_integration?: boolean | null
          common_objections?: string | null
          company_name?: string
          competitors?: string | null
          created_at?: string | null
          email?: string
          first_name?: string
          icp_company_size?: string | null
          icp_geography?: string | null
          icp_industry?: string | null
          icp_job_titles?: string | null
          icp_pains_needs?: string | null
          icp_persona?: string | null
          id?: string
          last_name?: string
          lead_magnet_ideas?: string | null
          product_description_indepth?: string | null
          product_description_short?: string | null
          product_presentation_url?: string | null
          reasons_to_believe?: string | null
          sales_development_representative?: string | null
          status?: string | null
          useful_information?: string | null
          usp?: string | null
          video_presentation_url?: string | null
          website?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspace_onboarding_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          }
        ]
      }
      workspaces: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner_id: string | null
          subdomain: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_id?: string | null
          subdomain?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          subdomain?: string | null
          updated_at?: string | null
        }
        Relationships: []
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