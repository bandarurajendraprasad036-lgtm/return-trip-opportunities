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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      free_membership_months: {
        Row: {
          created_at: string
          ends_on: string
          id: string
          source: string
          starts_on: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_on: string
          id?: string
          source: string
          starts_on: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_on?: string
          id?: string
          source?: string
          starts_on?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "free_membership_months_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_payments: {
        Row: {
          admin_note: string
          amount: number
          created_at: string
          id: string
          membership_type: string
          referral_numbers: string[]
          reviewed_at: string | null
          status: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          admin_note?: string
          amount?: number
          created_at?: string
          id?: string
          membership_type?: string
          referral_numbers?: string[]
          reviewed_at?: string | null
          status?: string
          transaction_id: string
          user_id: string
        }
        Update: {
          admin_note?: string
          amount?: number
          created_at?: string
          id?: string
          membership_type?: string
          referral_numbers?: string[]
          reviewed_at?: string | null
          status?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_auto: boolean
          needs_admin: boolean
          post_id: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_auto?: boolean
          needs_admin?: boolean
          post_id?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_auto?: boolean
          needs_admin?: boolean
          post_id?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          matched_post_id: string | null
          message: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          matched_post_id?: string | null
          message: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          matched_post_id?: string | null
          message?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_matched_post_id_fkey"
            columns: ["matched_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          area_scope: string
          capacity_tons: number | null
          category: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          district: string
          from_place: string | null
          goods_type: string | null
          id: string
          kind: string
          location: string | null
          module: string
          public_brand: string
          public_photo: string
          salary: string | null
          service_type: string
          show_contact: boolean
          skill: string | null
          state: string
          status: string
          title: string
          to_place: string | null
          trip_date: string | null
          user_id: string
          vehicle_type: string | null
        }
        Insert: {
          area_scope?: string
          capacity_tons?: number | null
          category?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          district?: string
          from_place?: string | null
          goods_type?: string | null
          id?: string
          kind: string
          location?: string | null
          module: string
          public_brand?: string
          public_photo?: string
          salary?: string | null
          service_type?: string
          show_contact?: boolean
          skill?: string | null
          state?: string
          status?: string
          title?: string
          to_place?: string | null
          trip_date?: string | null
          user_id: string
          vehicle_type?: string | null
        }
        Update: {
          area_scope?: string
          capacity_tons?: number | null
          category?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          district?: string
          from_place?: string | null
          goods_type?: string | null
          id?: string
          kind?: string
          location?: string | null
          module?: string
          public_brand?: string
          public_photo?: string
          salary?: string | null
          service_type?: string
          show_contact?: boolean
          skill?: string | null
          state?: string
          status?: string
          title?: string
          to_place?: string | null
          trip_date?: string | null
          user_id?: string
          vehicle_type?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          free_months: number
          full_name: string
          id: string
          is_prime: boolean
          location: string
          phone: string
          prime_until: string | null
          public_brand: string
          public_photo: string
          referral_code: string | null
          referred_at: string | null
          referred_by: string | null
          show_public: boolean
        }
        Insert: {
          created_at?: string
          free_months?: number
          full_name?: string
          id: string
          is_prime?: boolean
          location?: string
          phone?: string
          prime_until?: string | null
          public_brand?: string
          public_photo?: string
          referral_code?: string | null
          referred_at?: string | null
          referred_by?: string | null
          show_public?: boolean
        }
        Update: {
          created_at?: string
          free_months?: number
          full_name?: string
          id?: string
          is_prime?: boolean
          location?: string
          phone?: string
          prime_until?: string | null
          public_brand?: string
          public_photo?: string
          referral_code?: string | null
          referred_at?: string | null
          referred_by?: string | null
          show_public?: boolean
        }
        Relationships: []
      }
      reward_wallets: {
        Row: {
          points: number
          user_id: string
        }
        Insert: {
          points?: number
          user_id: string
        }
        Update: {
          points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_likes: {
        Row: {
          profile_id: string
          user_id: string
        }
        Insert: {
          profile_id: string
          user_id: string
        }
        Update: {
          profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_likes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "service_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      service_photos: {
        Row: {
          caption: string
          id: string
          path: string
          user_id: string
        }
        Insert: {
          caption?: string
          id?: string
          path: string
          user_id: string
        }
        Update: {
          caption?: string
          id?: string
          path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "service_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      service_profiles: {
        Row: {
          bio: string
          display_name: string
          photo_path: string
          published: boolean
          service: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string
          display_name?: string
          photo_path?: string
          published?: boolean
          service?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string
          display_name?: string
          photo_path?: string
          published?: boolean
          service?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_reviews: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          profile_id: string
          rating: number
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          profile_id: string
          rating: number
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          profile_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_reviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "service_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      service_views: {
        Row: {
          day: string
          profile_id: string
          visitor_hash: string
        }
        Insert: {
          day?: string
          profile_id: string
          visitor_hash: string
        }
        Update: {
          day?: string
          profile_id?: string
          visitor_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_views_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "service_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      sharing_claims: {
        Row: {
          admin_note: string
          created_at: string
          evidence_paths: string[]
          id: string
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string
          created_at?: string
          evidence_paths: string[]
          id?: string
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_note?: string
          created_at?: string
          evidence_paths?: string[]
          id?: string
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sharing_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      apply_referral: { Args: { _code: string }; Returns: boolean }
      can_notify: { Args: { _uid: string }; Returns: boolean }
      grant_free_membership_month: {
        Args: { _source: string; _user: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      my_referral_stats: { Args: never; Returns: Json }
      notify_matches: { Args: { _post_id: string }; Returns: number }
      posts_match_area: {
        Args: {
          a: Database["public"]["Tables"]["posts"]["Row"]
          b: Database["public"]["Tables"]["posts"]["Row"]
        }
        Returns: boolean
      }
      public_stats: { Args: never; Returns: Json }
      record_service_view: {
        Args: { _id: string; _visitor: string }
        Returns: undefined
      }
      redeem_reward_points: { Args: never; Returns: string }
      referral_target: { Args: { _d: string }; Returns: number }
      review_membership: {
        Args: { _approve: boolean; _id: string; _note?: string }
        Returns: undefined
      }
      review_sharing_claim: {
        Args: { _approve: boolean; _id: string; _note?: string }
        Returns: undefined
      }
      ring_post: { Args: { _post_id: string }; Returns: string }
      save_service_profile: {
        Args: {
          _bio: string
          _name: string
          _photo: string
          _published: boolean
          _service: string
        }
        Returns: undefined
      }
      send_referral_reminders: { Args: never; Returns: number }
      service_profile_data: { Args: { _id: string }; Returns: Json }
      support_admin_id: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
