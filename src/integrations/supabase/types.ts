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
      brand_profiles: {
        Row: {
          business_objectives: string[] | null
          company_name: string
          created_at: string
          editorial_charter: Json | null
          example_posts: string[] | null
          forbidden_words: string[] | null
          id: string
          kpis: string[] | null
          publishing_frequency: string
          sector: string
          targets: string[] | null
          tone: string
          updated_at: string
          user_id: string
          values: string[] | null
        }
        Insert: {
          business_objectives?: string[] | null
          company_name: string
          created_at?: string
          editorial_charter?: Json | null
          example_posts?: string[] | null
          forbidden_words?: string[] | null
          id?: string
          kpis?: string[] | null
          publishing_frequency?: string
          sector: string
          targets?: string[] | null
          tone?: string
          updated_at?: string
          user_id: string
          values?: string[] | null
        }
        Update: {
          business_objectives?: string[] | null
          company_name?: string
          created_at?: string
          editorial_charter?: Json | null
          example_posts?: string[] | null
          forbidden_words?: string[] | null
          id?: string
          kpis?: string[] | null
          publishing_frequency?: string
          sector?: string
          targets?: string[] | null
          tone?: string
          updated_at?: string
          user_id?: string
          values?: string[] | null
        }
        Relationships: []
      }
      calendar_items: {
        Row: {
          brand_profile_id: string | null
          content_type: string
          created_at: string
          id: string
          objective: string | null
          scheduled_date: string
          status: string
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_profile_id?: string | null
          content_type?: string
          created_at?: string
          id?: string
          objective?: string | null
          scheduled_date: string
          status?: string
          theme: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_profile_id?: string | null
          content_type?: string
          created_at?: string
          id?: string
          objective?: string | null
          scheduled_date?: string
          status?: string
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_items_brand_profile_id_fkey"
            columns: ["brand_profile_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          brand_profile_id: string | null
          calendar_item_id: string | null
          content: string
          created_at: string
          cta: string | null
          editorial_justification: string | null
          hashtags: string[] | null
          id: string
          keywords: string[] | null
          length: string | null
          readability_score: number | null
          status: string
          suggestions: string[] | null
          tone: string | null
          updated_at: string
          user_id: string
          variants: string[] | null
        }
        Insert: {
          brand_profile_id?: string | null
          calendar_item_id?: string | null
          content: string
          created_at?: string
          cta?: string | null
          editorial_justification?: string | null
          hashtags?: string[] | null
          id?: string
          keywords?: string[] | null
          length?: string | null
          readability_score?: number | null
          status?: string
          suggestions?: string[] | null
          tone?: string | null
          updated_at?: string
          user_id: string
          variants?: string[] | null
        }
        Update: {
          brand_profile_id?: string | null
          calendar_item_id?: string | null
          content?: string
          created_at?: string
          cta?: string | null
          editorial_justification?: string | null
          hashtags?: string[] | null
          id?: string
          keywords?: string[] | null
          length?: string | null
          readability_score?: number | null
          status?: string
          suggestions?: string[] | null
          tone?: string | null
          updated_at?: string
          user_id?: string
          variants?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_brand_profile_id_fkey"
            columns: ["brand_profile_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_calendar_item_id_fkey"
            columns: ["calendar_item_id"]
            isOneToOne: false
            referencedRelation: "calendar_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_inspirations: {
        Row: {
          brand_profile_id: string | null
          created_at: string
          description: string | null
          id: string
          is_pinned: boolean | null
          metadata: Json | null
          source: string | null
          title: string
          type: string
          url: string | null
          user_id: string
        }
        Insert: {
          brand_profile_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_pinned?: boolean | null
          metadata?: Json | null
          source?: string | null
          title: string
          type: string
          url?: string | null
          user_id: string
        }
        Update: {
          brand_profile_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_pinned?: boolean | null
          metadata?: Json | null
          source?: string | null
          title?: string
          type?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_inspirations_brand_profile_id_fkey"
            columns: ["brand_profile_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_items: {
        Row: {
          alert: string | null
          angle: string | null
          brand_profile_id: string | null
          created_at: string
          id: string
          objective: string | null
          relevance: string | null
          source: string | null
          summary: string | null
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          alert?: string | null
          angle?: string | null
          brand_profile_id?: string | null
          created_at?: string
          id?: string
          objective?: string | null
          relevance?: string | null
          source?: string | null
          summary?: string | null
          title: string
          url?: string | null
          user_id: string
        }
        Update: {
          alert?: string | null
          angle?: string | null
          brand_profile_id?: string | null
          created_at?: string
          id?: string
          objective?: string | null
          relevance?: string | null
          source?: string | null
          summary?: string | null
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_items_brand_profile_id_fkey"
            columns: ["brand_profile_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
        ]
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
    Enums: {},
  },
} as const
