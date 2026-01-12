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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_name: string | null
          created_at: string | null
          display_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_name?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_name?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          price: number | null
          shop_id: string
          slot_index: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          price?: number | null
          shop_id: string
          slot_index: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          price?: number | null
          shop_id?: string
          slot_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_items_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_reviews: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          shop_id: string
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          shop_id: string
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_reviews_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_spots: {
        Row: {
          created_at: string | null
          id: string
          position_3d: Json
          sort_order: number
          spot_label: string
          street_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          position_3d: Json
          sort_order: number
          spot_label: string
          street_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          position_3d?: Json
          sort_order?: number
          spot_label?: string
          street_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_spots_street_id_fkey"
            columns: ["street_id"]
            isOneToOne: false
            referencedRelation: "streets"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          accent_color: string | null
          admin_notes: string | null
          branch_justification: string | null
          branch_label: string | null
          category: string | null
          created_at: string | null
          duplicate_brand: boolean | null
          external_link: string | null
          facade_template: Database["public"]["Enums"]["facade_template"] | null
          id: string
          logo_url: string | null
          merchant_id: string
          name: string
          primary_color: string | null
          signage_font: string | null
          spot_id: string
          status: Database["public"]["Enums"]["shop_status"] | null
          texture_template: string | null
          texture_url: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          admin_notes?: string | null
          branch_justification?: string | null
          branch_label?: string | null
          category?: string | null
          created_at?: string | null
          duplicate_brand?: boolean | null
          external_link?: string | null
          facade_template?:
            | Database["public"]["Enums"]["facade_template"]
            | null
          id?: string
          logo_url?: string | null
          merchant_id: string
          name: string
          primary_color?: string | null
          signage_font?: string | null
          spot_id: string
          status?: Database["public"]["Enums"]["shop_status"] | null
          texture_template?: string | null
          texture_url?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          admin_notes?: string | null
          branch_justification?: string | null
          branch_label?: string | null
          category?: string | null
          created_at?: string | null
          duplicate_brand?: boolean | null
          external_link?: string | null
          facade_template?:
            | Database["public"]["Enums"]["facade_template"]
            | null
          id?: string
          logo_url?: string | null
          merchant_id?: string
          name?: string
          primary_color?: string | null
          signage_font?: string | null
          spot_id?: string
          status?: Database["public"]["Enums"]["shop_status"] | null
          texture_template?: string | null
          texture_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shops_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: true
            referencedRelation: "shop_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      streets: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_active_or_suspended_public_shops_for_spots: {
        Args: { _spot_ids: string[] }
        Returns: {
          accent_color: string
          branch_justification: string
          branch_label: string
          category: string
          created_at: string
          duplicate_brand: boolean
          external_link: string
          facade_template: Database["public"]["Enums"]["facade_template"]
          id: string
          logo_url: string
          name: string
          primary_color: string
          signage_font: string
          spot_id: string
          status: Database["public"]["Enums"]["shop_status"]
          texture_template: string
          texture_url: string
          updated_at: string
        }[]
      }
      get_active_public_shops_for_spots: {
        Args: { _spot_ids: string[] }
        Returns: {
          accent_color: string
          branch_justification: string
          branch_label: string
          category: string
          created_at: string
          duplicate_brand: boolean
          external_link: string
          facade_template: Database["public"]["Enums"]["facade_template"]
          id: string
          logo_url: string
          name: string
          primary_color: string
          signage_font: string
          spot_id: string
          status: Database["public"]["Enums"]["shop_status"]
          texture_template: string
          texture_url: string
          updated_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_merchant: { Args: { _user_id: string }; Returns: boolean }
      is_shop_active: { Args: { _shop_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "merchant" | "admin" | "player"
      facade_template:
        | "modern_neon"
        | "minimal_white"
        | "classic_brick"
        | "cyber_tech"
        | "luxury_gold"
        | "urban_industrial"
        | "retro_vintage"
        | "nature_organic"
        | "led_display"
        | "pharaoh_gold"
        | "greek_marble"
        | "art_deco"
        | "japanese_zen"
        | "neon_cyberpunk"
      shop_status: "pending_review" | "active" | "rejected" | "suspended"
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
      app_role: ["merchant", "admin", "player"],
      facade_template: [
        "modern_neon",
        "minimal_white",
        "classic_brick",
        "cyber_tech",
        "luxury_gold",
        "urban_industrial",
        "retro_vintage",
        "nature_organic",
        "led_display",
        "pharaoh_gold",
        "greek_marble",
        "art_deco",
        "japanese_zen",
        "neon_cyberpunk",
      ],
      shop_status: ["pending_review", "active", "rejected", "suspended"],
    },
  },
} as const
