export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_gateway_errors: {
        Row: {
          function_name: string
          id: string
          message: string | null
          occurred_at: string
          status_code: number
        }
        Insert: {
          function_name: string
          id?: string
          message?: string | null
          occurred_at?: string
          status_code: number
        }
        Update: {
          function_name?: string
          id?: string
          message?: string | null
          occurred_at?: string
          status_code?: number
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          id: string
          last_check_at: string | null
          last_check_result: Json | null
          monthly_token_quota: number | null
          openai_enabled: boolean
          updated_at: string
          warning_threshold_percent: number
        }
        Insert: {
          id?: string
          last_check_at?: string | null
          last_check_result?: Json | null
          monthly_token_quota?: number | null
          openai_enabled?: boolean
          updated_at?: string
          warning_threshold_percent?: number
        }
        Update: {
          id?: string
          last_check_at?: string | null
          last_check_result?: Json | null
          monthly_token_quota?: number | null
          openai_enabled?: boolean
          updated_at?: string
          warning_threshold_percent?: number
        }
        Relationships: []
      }
      briefing_requests: {
        Row: {
          blocked_by_limit: boolean
          business_name: string
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_whatsapp: string | null
          content_strategy: string | null
          created_at: string | null
          form_answers: Json | null
          id: string
          is_active: boolean
          niche: string | null
          persona: string | null
          positioning: string | null
          project_id: string | null
          project_name: string
          status: string
          token: string
          tone_of_voice: string | null
          user_id: string
          video_quantity: number
        }
        Insert: {
          blocked_by_limit?: boolean
          business_name: string
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_whatsapp?: string | null
          content_strategy?: string | null
          created_at?: string | null
          form_answers?: Json | null
          id?: string
          is_active?: boolean
          niche?: string | null
          persona?: string | null
          positioning?: string | null
          project_id?: string | null
          project_name: string
          status?: string
          token?: string
          tone_of_voice?: string | null
          user_id: string
          video_quantity?: number
        }
        Update: {
          blocked_by_limit?: boolean
          business_name?: string
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_whatsapp?: string | null
          content_strategy?: string | null
          created_at?: string | null
          form_answers?: Json | null
          id?: string
          is_active?: boolean
          niche?: string | null
          persona?: string | null
          positioning?: string | null
          project_id?: string | null
          project_name?: string
          status?: string
          token?: string
          tone_of_voice?: string | null
          user_id?: string
          video_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "briefing_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      briefings: {
        Row: {
          content_style: string | null
          created_at: string | null
          goal: string | null
          id: string
          project_id: string | null
          target_audience: string | null
          user_id: string | null
        }
        Insert: {
          content_style?: string | null
          created_at?: string | null
          goal?: string | null
          id?: string
          project_id?: string | null
          target_audience?: string | null
          user_id?: string | null
        }
        Update: {
          content_style?: string | null
          created_at?: string | null
          goal?: string | null
          id?: string
          project_id?: string | null
          target_audience?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "briefings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      client_content_memory: {
        Row: {
          angle: string | null
          content_category: string | null
          context_id: string
          created_at: string | null
          hook: string | null
          id: string
          idea_id: string | null
          script_id: string | null
          topic: string | null
          user_id: string
          was_selected: boolean | null
        }
        Insert: {
          angle?: string | null
          content_category?: string | null
          context_id: string
          created_at?: string | null
          hook?: string | null
          id?: string
          idea_id?: string | null
          script_id?: string | null
          topic?: string | null
          user_id: string
          was_selected?: boolean | null
        }
        Update: {
          angle?: string | null
          content_category?: string | null
          context_id?: string
          created_at?: string | null
          hook?: string | null
          id?: string
          idea_id?: string | null
          script_id?: string | null
          topic?: string | null
          user_id?: string
          was_selected?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "client_content_memory_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "client_strategic_contexts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_content_memory_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "content_ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_content_memory_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      client_strategic_contexts: {
        Row: {
          business_name: string
          business_niche: string | null
          communication_style: string | null
          created_at: string | null
          customer_persona: string | null
          differentiators: string | null
          id: string
          is_active: boolean
          is_completed: boolean | null
          main_platforms: string[] | null
          market_positioning: string | null
          marketing_objectives: string | null
          pain_points: string | null
          products_services: string | null
          target_audience: string | null
          tone_of_voice: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_name: string
          business_niche?: string | null
          communication_style?: string | null
          created_at?: string | null
          customer_persona?: string | null
          differentiators?: string | null
          id?: string
          is_active?: boolean
          is_completed?: boolean | null
          main_platforms?: string[] | null
          market_positioning?: string | null
          marketing_objectives?: string | null
          pain_points?: string | null
          products_services?: string | null
          target_audience?: string | null
          tone_of_voice?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_name?: string
          business_niche?: string | null
          communication_style?: string | null
          created_at?: string | null
          customer_persona?: string | null
          differentiators?: string | null
          id?: string
          is_active?: boolean
          is_completed?: boolean | null
          main_platforms?: string[] | null
          market_positioning?: string | null
          marketing_objectives?: string | null
          pain_points?: string | null
          products_services?: string | null
          target_audience?: string | null
          tone_of_voice?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          oab: string | null
          office_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          oab?: string | null
          office_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          oab?: string | null
          office_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      content_ideas: {
        Row: {
          content_category: string | null
          context_id: string | null
          created_at: string | null
          description: string | null
          id: string
          project_id: string | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          content_category?: string | null
          context_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          content_category?: string | null
          context_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_ideas_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "client_strategic_contexts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_ideas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          client_id: string
          created_at: string
          id: string
          is_ai_response: boolean | null
          last_message_at: string | null
          lead_id: string | null
          message_count: number
          phone: string | null
          status: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          is_ai_response?: boolean | null
          last_message_at?: string | null
          lead_id?: string | null
          message_count?: number
          phone?: string | null
          status?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          is_ai_response?: boolean | null
          last_message_at?: string | null
          lead_id?: string | null
          message_count?: number
          phone?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostic_leads: {
        Row: {
          answers: Json
          business_name: string
          city: string
          contacted_at: string | null
          created_at: string
          diagnostic_type: string
          email: string
          id: string
          name: string
          phone: string
          pipeline_stage: string
          result: Json | null
          score: number | null
          stage_updated_at: string
        }
        Insert: {
          answers?: Json
          business_name: string
          city: string
          contacted_at?: string | null
          created_at?: string
          diagnostic_type: string
          email: string
          id?: string
          name: string
          phone: string
          pipeline_stage?: string
          result?: Json | null
          score?: number | null
          stage_updated_at?: string
        }
        Update: {
          answers?: Json
          business_name?: string
          city?: string
          contacted_at?: string | null
          created_at?: string
          diagnostic_type?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          pipeline_stage?: string
          result?: Json | null
          score?: number | null
          stage_updated_at?: string
        }
        Relationships: []
      }
      form_settings: {
        Row: {
          compact_mode: boolean
          created_at: string
          field_bg_color: string
          field_border_color: string
          id: string
          input_radius: number
          label_color: string
          show_field_icons: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          compact_mode?: boolean
          created_at?: string
          field_bg_color?: string
          field_border_color?: string
          id?: string
          input_radius?: number
          label_color?: string
          show_field_icons?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          compact_mode?: boolean
          created_at?: string
          field_bg_color?: string
          field_border_color?: string
          id?: string
          input_radius?: number
          label_color?: string
          show_field_icons?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generation_cache: {
        Row: {
          created_at: string | null
          expires_at: string | null
          function_name: string
          id: string
          prompt_hash: string
          response_data: Json
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          function_name: string
          id?: string
          prompt_hash: string
          response_data: Json
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          function_name?: string
          id?: string
          prompt_hash?: string
          response_data?: Json
        }
        Relationships: []
      }
      ideas: {
        Row: {
          created_at: string | null
          id: string
          idea: string | null
          project_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          idea?: string | null
          project_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          idea?: string | null
          project_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ideas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      interface_settings: {
        Row: {
          accent_color: string
          background_color: string
          border_radius: number
          created_at: string
          density: string
          font_family: string
          font_size_base: number
          id: string
          primary_color: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string
          background_color?: string
          border_radius?: number
          created_at?: string
          density?: string
          font_family?: string
          font_size_base?: number
          id?: string
          primary_color?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string
          background_color?: string
          border_radius?: number
          created_at?: string
          density?: string
          font_family?: string
          font_size_base?: number
          id?: string
          primary_color?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          client_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_flows: {
        Row: {
          client_id: string
          created_at: string
          flow_name: string
          id: string
          is_active: boolean
          updated_at: string
          webhook_url: string
        }
        Insert: {
          client_id: string
          created_at?: string
          flow_name: string
          id?: string
          is_active?: boolean
          updated_at?: string
          webhook_url: string
        }
        Update: {
          client_id?: string
          created_at?: string
          flow_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "n8n_flows_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          asaas_payment_id: string | null
          asaas_subscription_id: string | null
          created_at: string
          id: string
          paid_at: string | null
          plan: string
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          asaas_payment_id?: string | null
          asaas_subscription_id?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          plan: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          asaas_payment_id?: string | null
          asaas_subscription_id?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          plan?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      pdf_settings: {
        Row: {
          created_at: string | null
          font_family: string
          font_size_body: number
          font_size_title: number
          footer_text: string | null
          header_text: string | null
          id: string
          logo_position: string
          logo_url: string | null
          primary_color: string
          secondary_color: string
          show_cover_page: boolean
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          font_family?: string
          font_size_body?: number
          font_size_title?: number
          footer_text?: string | null
          header_text?: string | null
          id?: string
          logo_position?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          show_cover_page?: boolean
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          font_family?: string
          font_size_body?: number
          font_size_title?: number
          footer_text?: string | null
          header_text?: string | null
          id?: string
          logo_position?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          show_cover_page?: boolean
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          client_id: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          client_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          client_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          campaign_objective: string | null
          client_name: string | null
          content_style: string | null
          context_id: string | null
          created_at: string | null
          funnel_stage: string | null
          id: string
          name: string | null
          objective: string | null
          platform: string | null
          publishing_frequency: string | null
          status: string | null
          user_id: string | null
          video_count: number | null
        }
        Insert: {
          campaign_objective?: string | null
          client_name?: string | null
          content_style?: string | null
          context_id?: string | null
          created_at?: string | null
          funnel_stage?: string | null
          id?: string
          name?: string | null
          objective?: string | null
          platform?: string | null
          publishing_frequency?: string | null
          status?: string | null
          user_id?: string | null
          video_count?: number | null
        }
        Update: {
          campaign_objective?: string | null
          client_name?: string | null
          content_style?: string | null
          context_id?: string | null
          created_at?: string | null
          funnel_stage?: string | null
          id?: string
          name?: string | null
          objective?: string | null
          platform?: string | null
          publishing_frequency?: string | null
          status?: string | null
          user_id?: string | null
          video_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_context_id_fkey"
            columns: ["context_id"]
            isOneToOne: false
            referencedRelation: "client_strategic_contexts"
            referencedColumns: ["id"]
          },
        ]
      }
      scripts: {
        Row: {
          created_at: string | null
          id: string
          project_id: string | null
          script: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          script?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          script?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scripts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_reports: {
        Row: {
          brand_positioning: string | null
          business_name: string
          content_funnel: string | null
          content_references: string | null
          created_at: string | null
          id: string
          objectives: string | null
          pdf_url: string | null
          persona: string | null
          positioning: string | null
          production_capacity: string | null
          script_ideas: Json | null
          status: string | null
          target_audience: string | null
          tone_of_voice: string | null
          user_id: string
        }
        Insert: {
          brand_positioning?: string | null
          business_name: string
          content_funnel?: string | null
          content_references?: string | null
          created_at?: string | null
          id?: string
          objectives?: string | null
          pdf_url?: string | null
          persona?: string | null
          positioning?: string | null
          production_capacity?: string | null
          script_ideas?: Json | null
          status?: string | null
          target_audience?: string | null
          tone_of_voice?: string | null
          user_id: string
        }
        Update: {
          brand_positioning?: string | null
          business_name?: string
          content_funnel?: string | null
          content_references?: string | null
          created_at?: string | null
          id?: string
          objectives?: string | null
          pdf_url?: string | null
          persona?: string | null
          positioning?: string | null
          production_capacity?: string | null
          script_ideas?: Json | null
          status?: string | null
          target_audience?: string | null
          tone_of_voice?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          id: string
          plan: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          plan?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          created_at: string | null
          function_name: string
          generation_type: string
          id: string
          prompt_hash: string | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          function_name: string
          generation_type: string
          id?: string
          prompt_hash?: string | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          function_name?: string
          generation_type?: string
          id?: string
          prompt_hash?: string | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          asaas_customer_id: string | null
          bairro: string | null
          billing_name: string | null
          cep: string | null
          cidade: string | null
          complemento: string | null
          cpf: string | null
          created_at: string | null
          data_expiracao: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          name: string | null
          numero: string | null
          plano_ativo: string | null
          status_assinatura: string | null
          whatsapp: string | null
        }
        Insert: {
          asaas_customer_id?: string | null
          bairro?: string | null
          billing_name?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string | null
          data_expiracao?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id: string
          name?: string | null
          numero?: string | null
          plano_ativo?: string | null
          status_assinatura?: string | null
          whatsapp?: string | null
        }
        Update: {
          asaas_customer_id?: string | null
          bairro?: string | null
          billing_name?: string | null
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string | null
          data_expiracao?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          name?: string | null
          numero?: string | null
          plano_ativo?: string | null
          status_assinatura?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      whatsapp_connections: {
        Row: {
          client_id: string
          connected_at: string | null
          created_at: string
          id: string
          phone_number: string | null
          status: string
          webhook_url: string | null
        }
        Insert: {
          client_id: string
          connected_at?: string | null
          created_at?: string
          id?: string
          phone_number?: string | null
          status?: string
          webhook_url?: string | null
        }
        Update: {
          client_id?: string
          connected_at?: string | null
          created_at?: string
          id?: string
          phone_number?: string | null
          status?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_connections_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_client_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client"
      lead_status: "novo" | "em_atendimento" | "fechado" | "perdido"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "client"],
      lead_status: ["novo", "em_atendimento", "fechado", "perdido"],
    },
  },
} as const
