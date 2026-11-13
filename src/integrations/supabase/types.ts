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
      account_blocks: {
        Row: {
          blocked_at: string
          reason: string
          user_id: string
        }
        Insert: {
          blocked_at?: string
          reason: string
          user_id: string
        }
        Update: {
          blocked_at?: string
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_blocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      account_programs: {
        Row: {
          category: string
          completed_at: string
          member_kind: string
          occupation: string
          points_awarded: boolean
          referral_free_until: string | null
          referral_rewarded_at: string | null
          reminder_consent: boolean
          sharing_active: boolean
          sharing_started_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          completed_at?: string
          member_kind: string
          occupation: string
          points_awarded?: boolean
          referral_free_until?: string | null
          referral_rewarded_at?: string | null
          reminder_consent?: boolean
          sharing_active?: boolean
          sharing_started_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          completed_at?: string
          member_kind?: string
          occupation?: string
          points_awarded?: boolean
          referral_free_until?: string | null
          referral_rewarded_at?: string | null
          reminder_consent?: boolean
          sharing_active?: boolean
          sharing_started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_programs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      approximate_route_alerts: {
        Row: {
          created_at: string
          id: string
          notification_id: string | null
          post_id: string
          processed_at: string | null
          route_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notification_id?: string | null
          post_id: string
          processed_at?: string | null
          route_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notification_id?: string | null
          post_id?: string
          processed_at?: string | null
          route_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approximate_route_alerts_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approximate_route_alerts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approximate_route_alerts_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "vehicle_route_preferences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approximate_route_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bell_board_chat_pairs: {
        Row: {
          interest_id: string
          member_id: string
          owner_id: string
        }
        Insert: {
          interest_id: string
          member_id: string
          owner_id: string
        }
        Update: {
          interest_id?: string
          member_id?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bell_board_chat_pairs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bell_board_chat_pairs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_referral_board_notices: {
        Row: {
          day: string
          notification_id: string | null
          user_id: string
        }
        Insert: {
          day: string
          notification_id?: string | null
          user_id: string
        }
        Update: {
          day?: string
          notification_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_referral_board_notices_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_referral_board_notices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deferred_listing_notices: {
        Row: {
          available_at: string
          created_at: string
          id: string
          matched_post_id: string | null
          message: string
          notice_mode: string
          post_id: string | null
          processed_at: string | null
          user_id: string
        }
        Insert: {
          available_at: string
          created_at?: string
          id?: string
          matched_post_id?: string | null
          message: string
          notice_mode: string
          post_id?: string | null
          processed_at?: string | null
          user_id: string
        }
        Update: {
          available_at?: string
          created_at?: string
          id?: string
          matched_post_id?: string | null
          message?: string
          notice_mode?: string
          post_id?: string | null
          processed_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deferred_listing_notices_matched_post_id_fkey"
            columns: ["matched_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deferred_listing_notices_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deferred_listing_notices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_content_registry: {
        Row: {
          created_at: string
          hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_content_registry_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      job_post_entitlements: {
        Row: {
          ends_at: string
          id: string
          payment_id: string
          starts_at: string
          user_id: string
        }
        Insert: {
          ends_at: string
          id?: string
          payment_id: string
          starts_at: string
          user_id: string
        }
        Update: {
          ends_at?: string
          id?: string
          payment_id?: string
          starts_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_post_entitlements_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "membership_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_post_entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_post_uses: {
        Row: {
          created_at: string
          entitlement_id: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entitlement_id: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          entitlement_id?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_post_uses_entitlement_id_fkey"
            columns: ["entitlement_id"]
            isOneToOne: false
            referencedRelation: "job_post_entitlements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_post_uses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_access: {
        Row: {
          ends_at: string
          granted_by: string | null
          id: string
          request_id: string | null
          revoked_at: string | null
          source: string
          starts_at: string
          user_id: string
        }
        Insert: {
          ends_at?: string
          granted_by?: string | null
          id?: string
          request_id?: string | null
          revoked_at?: string | null
          source: string
          starts_at?: string
          user_id: string
        }
        Update: {
          ends_at?: string
          granted_by?: string | null
          id?: string
          request_id?: string | null
          revoked_at?: string | null
          source?: string
          starts_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_access_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "membership_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_access_user_id_fkey"
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
      membership_requests: {
        Row: {
          amount: number
          id: string
          message_id: string
          note: string
          payer_id: string
          reference: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          amount: number
          id?: string
          message_id: string
          note?: string
          payer_id: string
          reference: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          id?: string
          message_id?: string
          note?: string
          payer_id?: string
          reference?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_requests_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_requests_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          chat_phone: string
          created_at: string
          id: string
          image_path: string
          is_auto: boolean
          needs_admin: boolean
          post_id: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          body: string
          chat_phone?: string
          created_at?: string
          id?: string
          image_path?: string
          is_auto?: boolean
          needs_admin?: boolean
          post_id?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          body?: string
          chat_phone?: string
          created_at?: string
          id?: string
          image_path?: string
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
      monthly_post_periods: {
        Row: {
          ends_at: string
          starts_at: string
          user_id: string
        }
        Insert: {
          ends_at: string
          starts_at: string
          user_id: string
        }
        Update: {
          ends_at?: string
          starts_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_post_periods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_post_usage: {
        Row: {
          post_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          post_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          post_id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_post_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          daily_limit: number | null
          enabled: boolean
          quiet_end: string | null
          quiet_start: string | null
          timezone: string
          user_id: string
        }
        Insert: {
          daily_limit?: number | null
          enabled?: boolean
          quiet_end?: string | null
          quiet_start?: string | null
          timezone?: string
          user_id: string
        }
        Update: {
          daily_limit?: number | null
          enabled?: boolean
          quiet_end?: string | null
          quiet_start?: string | null
          timezone?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
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
      post_bell_interests: {
        Row: {
          area: string
          created_at: string
          id: string
          need: string
          post_id: string
          section: string
          user_id: string
        }
        Insert: {
          area: string
          created_at?: string
          id?: string
          need: string
          post_id: string
          section: string
          user_id: string
        }
        Update: {
          area?: string
          created_at?: string
          id?: string
          need?: string
          post_id?: string
          section?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_bell_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_chat_pairs: {
        Row: {
          created_at: string
          member_id: string
          owner_id: string
          post_id: string
        }
        Insert: {
          created_at?: string
          member_id: string
          owner_id: string
          post_id: string
        }
        Update: {
          created_at?: string
          member_id?: string
          owner_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_chat_pairs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_chat_pairs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_chat_pairs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_sharing_evidence: {
        Row: {
          admin_note: string
          content_hashes: string[]
          created_at: string
          expires_at: string
          id: string
          paths: string[]
          post_id: string
          purpose: string
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string
          content_hashes?: string[]
          created_at?: string
          expires_at?: string
          id?: string
          paths: string[]
          post_id: string
          purpose: string
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_note?: string
          content_hashes?: string[]
          created_at?: string
          expires_at?: string
          id?: string
          paths?: string[]
          post_id?: string
          purpose?: string
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_sharing_evidence_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_sharing_evidence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          driver_name: string
          from_place: string | null
          goods_type: string | null
          id: string
          job_expires_at: string | null
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
          vehicle_name: string
          vehicle_number: string
          vehicle_type: string | null
          visibility_notified_at: string | null
          visible_after: string | null
        }
        Insert: {
          area_scope?: string
          capacity_tons?: number | null
          category?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          district?: string
          driver_name?: string
          from_place?: string | null
          goods_type?: string | null
          id?: string
          job_expires_at?: string | null
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
          vehicle_name?: string
          vehicle_number?: string
          vehicle_type?: string | null
          visibility_notified_at?: string | null
          visible_after?: string | null
        }
        Update: {
          area_scope?: string
          capacity_tons?: number | null
          category?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          district?: string
          driver_name?: string
          from_place?: string | null
          goods_type?: string | null
          id?: string
          job_expires_at?: string | null
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
          vehicle_name?: string
          vehicle_number?: string
          vehicle_type?: string | null
          visibility_notified_at?: string | null
          visible_after?: string | null
        }
        Relationships: []
      }
      prime99_payments: {
        Row: {
          alerts_start_at: string | null
          amount: number
          ends_at: string | null
          id: string
          payable_amount: number
          payment_purpose: string
          received_at: string | null
          reference: string
          review_note: string
          reviewed_by: string | null
          status: string
          submitted_at: string
          used_post_id: string | null
          user_id: string
        }
        Insert: {
          alerts_start_at?: string | null
          amount?: number
          ends_at?: string | null
          id?: string
          payable_amount?: number
          payment_purpose?: string
          received_at?: string | null
          reference: string
          review_note?: string
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          used_post_id?: string | null
          user_id: string
        }
        Update: {
          alerts_start_at?: string | null
          amount?: number
          ends_at?: string | null
          id?: string
          payable_amount?: number
          payment_purpose?: string
          received_at?: string | null
          reference?: string
          review_note?: string
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          used_post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prime99_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bell_activated_at: string | null
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
          bell_activated_at?: string | null
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
          bell_activated_at?: string | null
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
      program_evidence: {
        Row: {
          created_at: string
          expires_at: string
          hashes: string[]
          id: string
          paths: string[]
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          hashes: string[]
          id?: string
          paths: string[]
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          hashes?: string[]
          id?: string
          paths?: string[]
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_evidence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      program_reminders: {
        Row: {
          day: string
          notification_id: string | null
          user_id: string
        }
        Insert: {
          day: string
          notification_id?: string | null
          user_id: string
        }
        Update: {
          day?: string
          notification_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_reminders_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_contact_batches: {
        Row: {
          created_at: string
          id: string
          review_note: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_contact_batches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_contacts: {
        Row: {
          batch_id: string
          consent_confirmed: boolean
          id: string
          mobile: string
          service: string
          town: string
          user_id: string
        }
        Insert: {
          batch_id: string
          consent_confirmed: boolean
          id?: string
          mobile: string
          service: string
          town: string
          user_id: string
        }
        Update: {
          batch_id?: string
          consent_confirmed?: boolean
          id?: string
          mobile?: string
          service?: string
          town?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_contacts_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "provider_contact_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_deliveries: {
        Row: {
          attempts: number
          available_at: string
          device_id: string
          id: string
          notification_id: string
          provider_status: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          available_at?: string
          device_id: string
          id?: string
          notification_id: string
          provider_status?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          available_at?: string
          device_id?: string
          id?: string
          notification_id?: string
          provider_status?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_deliveries_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "push_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_deliveries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_devices: {
        Row: {
          id: string
          sound_enabled: boolean
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          sound_enabled?: boolean
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          sound_enabled?: boolean
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_board_consent: {
        Row: {
          display_name: string
          district: string
          district_group: string
          photo_consent: boolean
          published: boolean
          region: string
          user_id: string
        }
        Insert: {
          display_name?: string
          district?: string
          district_group?: string
          photo_consent?: boolean
          published?: boolean
          region?: string
          user_id: string
        }
        Update: {
          display_name?: string
          district?: string
          district_group?: string
          photo_consent?: boolean
          published?: boolean
          region?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_board_consent_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_cash_receipts: {
        Row: {
          amount_paise: number
          confirmed_by: string
          id: string
          received_at: string
          reference: string
          user_id: string
        }
        Insert: {
          amount_paise: number
          confirmed_by: string
          id?: string
          received_at?: string
          reference: string
          user_id: string
        }
        Update: {
          amount_paise?: number
          confirmed_by?: string
          id?: string
          received_at?: string
          reference?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_cash_receipts_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_cash_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_cash_rewards: {
        Row: {
          amount_paise: number
          created_at: string
          receipt_id: string
          user_id: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          receipt_id: string
          user_id: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          receipt_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_cash_rewards_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: true
            referencedRelation: "referral_cash_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_cash_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_invitee_rewards: {
        Row: {
          amount_paise: number
          created_at: string
          receipt_id: string
          user_id: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          receipt_id: string
          user_id: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          receipt_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_invitee_rewards_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: true
            referencedRelation: "referral_cash_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_invitee_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_prize_payouts: {
        Row: {
          paid_at: string
          receipt_id: string
          recorded_by: string
          reference: string
        }
        Insert: {
          paid_at?: string
          receipt_id: string
          recorded_by: string
          reference: string
        }
        Update: {
          paid_at?: string
          receipt_id?: string
          recorded_by?: string
          reference?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_prize_payouts_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: true
            referencedRelation: "referral_cash_rewards"
            referencedColumns: ["receipt_id"]
          },
        ]
      }
      referral_vip_campaign: {
        Row: {
          details_at: string
          event_label: string
          id: boolean
          started_at: string
        }
        Insert: {
          details_at?: string
          event_label?: string
          id?: boolean
          started_at?: string
        }
        Update: {
          details_at?: string
          event_label?: string
          id?: boolean
          started_at?: string
        }
        Relationships: []
      }
      referral_vip_joins: {
        Row: {
          joined_at: string
          joined_user: string
          referrer_id: string
        }
        Insert: {
          joined_at?: string
          joined_user: string
          referrer_id: string
        }
        Update: {
          joined_at?: string
          joined_user?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_vip_joins_joined_user_fkey"
            columns: ["joined_user"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_vip_joins_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_vip_notice_state: {
        Row: {
          signature: string
          user_id: string
        }
        Insert: {
          signature: string
          user_id: string
        }
        Update: {
          signature?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_vip_notice_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      service_chat_pairs: {
        Row: {
          created_at: string
          member_id: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          member_id: string
          owner_id: string
        }
        Update: {
          created_at?: string
          member_id?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_chat_pairs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_chat_pairs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "service_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      service_chat_presence: {
        Row: {
          member_id: string
          member_opened: boolean
          owner_id: string
          owner_opened: boolean
        }
        Insert: {
          member_id: string
          member_opened?: boolean
          owner_id: string
          owner_opened?: boolean
        }
        Update: {
          member_id?: string
          member_opened?: boolean
          owner_id?: string
          owner_opened?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "service_chat_presence_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_chat_presence_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
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
          category: string
          display_name: string
          photo_path: string
          published: boolean
          service: string
          town: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string
          category?: string
          display_name?: string
          photo_path?: string
          published?: boolean
          service?: string
          town?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string
          category?: string
          display_name?: string
          photo_path?: string
          published?: boolean
          service?: string
          town?: string
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
      service_request_pairs: {
        Row: {
          member_id: string
          owner_id: string
          request_id: string
        }
        Insert: {
          member_id: string
          owner_id: string
          request_id: string
        }
        Update: {
          member_id?: string
          owner_id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_request_pairs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_request_pairs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_request_pairs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          area: string
          created_at: string
          id: string
          service: string
          user_id: string
        }
        Insert: {
          area: string
          created_at?: string
          id?: string
          service: string
          user_id: string
        }
        Update: {
          area?: string
          created_at?: string
          id?: string
          service?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
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
      vehicle_availability: {
        Row: {
          available: boolean
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          available?: boolean
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          available?: boolean
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_availability_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_availability_requests: {
        Row: {
          created_at: string
          id: string
          notified_at: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notified_at?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notified_at?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_availability_requests_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_availability_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_bell_demands: {
        Row: {
          category: string
          display_name: string
          from_place: string
          id: string
          post_id: string | null
          rang_at: string
          to_place: string
          user_id: string
          vehicle_type: string
        }
        Insert: {
          category: string
          display_name: string
          from_place: string
          id?: string
          post_id?: string | null
          rang_at?: string
          to_place: string
          user_id: string
          vehicle_type: string
        }
        Update: {
          category?: string
          display_name?: string
          from_place?: string
          id?: string
          post_id?: string | null
          rang_at?: string
          to_place?: string
          user_id?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_bell_demands_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_demand_chat_pairs: {
        Row: {
          created_at: string
          demand_id: string
          member_id: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          demand_id: string
          member_id: string
          owner_id: string
        }
        Update: {
          created_at?: string
          demand_id?: string
          member_id?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_demand_chat_pairs_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "vehicle_bell_demands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_demand_chat_pairs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_demand_chat_pairs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_post_points: {
        Row: {
          created_at: string
          from_lat: number
          from_lng: number
          post_id: string
          to_lat: number
          to_lng: number
          user_id: string
        }
        Insert: {
          created_at?: string
          from_lat: number
          from_lng: number
          post_id: string
          to_lat: number
          to_lng: number
          user_id: string
        }
        Update: {
          created_at?: string
          from_lat?: number
          from_lng?: number
          post_id?: string
          to_lat?: number
          to_lng?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_post_points_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_post_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_route_points: {
        Row: {
          from_lat: number
          from_lng: number
          route_id: string
          to_lat: number
          to_lng: number
          user_id: string
        }
        Insert: {
          from_lat: number
          from_lng: number
          route_id: string
          to_lat: number
          to_lng: number
          user_id: string
        }
        Update: {
          from_lat?: number
          from_lng?: number
          route_id?: string
          to_lat?: number
          to_lng?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_route_points_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: true
            referencedRelation: "vehicle_route_preferences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_route_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_route_preferences: {
        Row: {
          capacity_tons: number | null
          created_at: string
          enabled: boolean
          from_place: string
          id: string
          radius_percent: number
          to_place: string
          user_id: string
          vehicle_type: string
        }
        Insert: {
          capacity_tons?: number | null
          created_at?: string
          enabled?: boolean
          from_place: string
          id?: string
          radius_percent?: number
          to_place: string
          user_id: string
          vehicle_type?: string
        }
        Update: {
          capacity_tons?: number | null
          created_at?: string
          enabled?: boolean
          from_place?: string
          id?: string
          radius_percent?: number
          to_place?: string
          user_id?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_route_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_winners: {
        Row: {
          created_at: string
          display_name: string
          joins: number
          paid: number
          percent: number
          photo_path: string
          region: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          display_name: string
          joins: number
          paid: number
          percent: number
          photo_path: string
          region: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          display_name?: string
          joins?: number
          paid?: number
          percent?: number
          photo_path?: string
          region?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_winners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      account_allowed: { Args: { _uid: string }; Returns: boolean }
      activate_program_sharing: {
        Args: {
          _hashes: string[]
          _paths: string[]
          _post?: string
          _user: string
        }
        Returns: string
      }
      admin_broadcast: { Args: { _message: string }; Returns: number }
      admin_evidence_sender: { Args: { _id: string }; Returns: string }
      admin_membership_access: {
        Args: { _enable: boolean; _user: string }
        Returns: undefined
      }
      admin_referral_eligibility: { Args: never; Returns: Json }
      admin_video_notice: {
        Args: { _message: string; _url: string }
        Returns: number
      }
      apply_referral: { Args: { _code: string }; Returns: boolean }
      block_confirmed_content: {
        Args: { _reason: string; _user: string }
        Returns: undefined
      }
      can_notify: { Args: { _uid: string }; Returns: boolean }
      can_post_chat: {
        Args: { _other?: string; _post?: string }
        Returns: boolean
      }
      claim_push_deliveries: {
        Args: never
        Returns: {
          attempts: number
          available_at: string
          device_id: string
          id: string
          notification_id: string
          provider_status: number | null
          status: string
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "push_deliveries"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      complete_account_profile: {
        Args: {
          _category: string
          _kind: string
          _location: string
          _name: string
          _occupation: string
        }
        Returns: string
      }
      configure_referral_event: { Args: { _label: string }; Returns: undefined }
      confirm_referral_cash: {
        Args: { _amount_paise: number; _reference: string; _user: string }
        Returns: string
      }
      confirm_referral_join: {
        Args: { _code: string; _phone: string }
        Returns: boolean
      }
      consume_post_slot: {
        Args: { _id: string; _user: string }
        Returns: undefined
      }
      dispatch_approximate_route_alerts: { Args: never; Returns: number }
      dispatch_daily_referral_board: { Args: never; Returns: number }
      dispatch_program_requests: { Args: never; Returns: number }
      dispatch_vehicle_availability: { Args: never; Returns: number }
      dispatch_visible_post_matches: { Args: never; Returns: number }
      ensure_my_referral_code: { Args: never; Returns: string }
      follow_vehicle_route: { Args: { _post: string }; Returns: string }
      get_post_details: { Args: { _post: string }; Returns: Json }
      grant_free_membership_month: {
        Args: { _source: string; _user: string }
        Returns: string
      }
      has_goods_membership: { Args: { _user?: string }; Returns: boolean }
      has_paid_bell: { Args: { _user: string }; Returns: boolean }
      has_prime99: { Args: { _user: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_goods_post: {
        Args: { _post: Database["public"]["Tables"]["posts"]["Row"] }
        Returns: boolean
      }
      list_anonymous_bell_board: {
        Args: { _section: string }
        Returns: {
          area: string
          id: string
          need: string
          source: string
        }[]
      }
      list_vehicle_bell_demands: {
        Args: never
        Returns: {
          category: string
          display_name: string
          from_place: string
          id: string
          post_id: string | null
          rang_at: string
          to_place: string
          user_id: string
          vehicle_type: string
        }[]
        SetofOptions: {
          from: "*"
          to: "vehicle_bell_demands"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      my_goods_membership: { Args: never; Returns: boolean }
      my_membership_price: { Args: never; Returns: number }
      my_notification_quota: { Args: never; Returns: Json }
      my_post_quota99: { Args: never; Returns: Json }
      my_prime99: { Args: never; Returns: Json }
      my_program_referrals: { Args: never; Returns: Json }
      my_referral_payment_requests: {
        Args: never
        Returns: {
          joined_at: string
          joined_user: string
        }[]
      }
      my_referral_stats: { Args: never; Returns: Json }
      my_referral_vip: { Args: never; Returns: Json }
      next_notice_open: {
        Args: { _at?: string; _zone?: string }
        Returns: string
      }
      notice_window_open: {
        Args: { _at?: string; _zone?: string }
        Returns: boolean
      }
      notify_matches: { Args: { _post_id: string }; Returns: number }
      notify_nearby_vehicles: { Args: { _post: string }; Returns: number }
      open_anonymous_bell_chat: {
        Args: { _id: string; _source: string }
        Returns: string
      }
      open_service_chat: { Args: { _other: string }; Returns: boolean }
      open_vehicle_demand_chat: { Args: { _demand: string }; Returns: string }
      paid_alert_ready: { Args: { _user: string }; Returns: boolean }
      post_alert_eligible: { Args: { _user: string }; Returns: boolean }
      posts_match_area: {
        Args: {
          a: Database["public"]["Tables"]["posts"]["Row"]
          b: Database["public"]["Tables"]["posts"]["Row"]
        }
        Returns: boolean
      }
      process_program_referral: { Args: { _user: string }; Returns: number }
      public_competition_areas: { Args: never; Returns: Json }
      public_referral_vip_board: { Args: never; Returns: Json }
      public_service_directory: { Args: never; Returns: Json }
      public_service_requests: {
        Args: { _area: string }
        Returns: {
          area: string
          id: string
          service: string
        }[]
      }
      public_stats: { Args: never; Returns: Json }
      record_evidence_hashes: {
        Args: { _claim: string; _hashes: string[] }
        Returns: undefined
      }
      record_referral_prize_paid: {
        Args: { _receipt: string; _reference: string }
        Returns: undefined
      }
      record_service_view: {
        Args: { _id: string; _visitor: string }
        Returns: undefined
      }
      redeem_reward_points: { Args: never; Returns: string }
      referral_payment_stats: {
        Args: { _from?: string; _to?: string }
        Returns: {
          eligible: boolean
          joins: number
          paid: number
          percent: number
          user_id: string
        }[]
      }
      referral_target: { Args: { _d: string }; Returns: number }
      referral_vip_ranks: {
        Args: never
        Returns: {
          joins: number
          rank_no: number
          user_id: string
        }[]
      }
      referral_vip_slots: { Args: never; Returns: Json }
      refresh_referral_vip_notices: { Args: never; Returns: number }
      register_membership_evidence: {
        Args: {
          _amount: number
          _message: string
          _payer: string
          _reference: string
          _user: string
        }
        Returns: string
      }
      request_own_bell_notice: { Args: { _device: string }; Returns: string }
      request_service: {
        Args: { _area: string; _service: string }
        Returns: string
      }
      request_vehicle_availability: { Args: { _post: string }; Returns: string }
      respond_service_request: { Args: { _request: string }; Returns: string }
      review_membership: {
        Args: { _approve: boolean; _id: string; _note?: string }
        Returns: undefined
      }
      review_membership_evidence: {
        Args: { _approve: boolean; _id: string }
        Returns: undefined
      }
      review_post_evidence: {
        Args: { _approve: boolean; _id: string }
        Returns: undefined
      }
      review_post_evidence_with_reason: {
        Args: { _approve: boolean; _id: string; _note: string }
        Returns: undefined
      }
      review_prime99: {
        Args: { _approve: boolean; _id: string; _note?: string }
        Returns: undefined
      }
      review_provider_contacts: {
        Args: { _approve: boolean; _id: string; _note?: string }
        Returns: undefined
      }
      review_sharing_claim: {
        Args: { _approve: boolean; _id: string; _note?: string }
        Returns: undefined
      }
      ring_post: { Args: { _post_id: string }; Returns: string }
      ring_service: { Args: { _owner: string }; Returns: string }
      ring_vehicle_demand: {
        Args: {
          _category?: string
          _from?: string
          _name_consent?: boolean
          _post?: string
          _to?: string
          _vehicle?: string
        }
        Returns: string
      }
      save_detailed_vehicle_route: {
        Args: { _from: string; _to: string; _tons: number; _vehicle: string }
        Returns: string
      }
      save_service_listing: {
        Args: {
          _category: string
          _name: string
          _published: boolean
          _service: string
          _town: string
        }
        Returns: undefined
      }
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
      save_vehicle_post_points: {
        Args: {
          _from_lat: number
          _from_lng: number
          _post: string
          _to_lat: number
          _to_lng: number
        }
        Returns: undefined
      }
      save_vehicle_route: {
        Args: { _from: string; _to: string }
        Returns: string
      }
      save_vehicle_route_points: {
        Args: {
          _from: string
          _from_lat: number
          _from_lng: number
          _to: string
          _to_lat: number
          _to_lng: number
        }
        Returns: string
      }
      select_weekly_winners: { Args: never; Returns: number }
      send_referral_reminders: { Args: never; Returns: number }
      service_occupation: { Args: { _value: string }; Returns: string }
      service_profile_data: { Args: { _id: string }; Returns: Json }
      set_program_reminders: { Args: { _enabled: boolean }; Returns: undefined }
      set_vehicle_available: { Args: { _post: string }; Returns: undefined }
      straight_line_km: {
        Args: { a_lat: number; a_lng: number; b_lat: number; b_lng: number }
        Returns: number
      }
      submit_post_evidence: {
        Args: { _paths: string[]; _post: string; _purpose: string }
        Returns: string
      }
      submit_provider_contacts: { Args: { _rows: Json }; Returns: string }
      submit_verified_post_evidence: {
        Args: {
          _hashes: string[]
          _paths: string[]
          _post: string
          _purpose: string
          _user: string
        }
        Returns: string
      }
      support_admin_id: { Args: never; Returns: string }
      vehicle_alert_context: {
        Args: { _target: string; _user: string }
        Returns: string
      }
      vehicle_public_details: { Args: { _post: string }; Returns: Json }
      vip_daily_reconcile: { Args: never; Returns: number }
      weekly_winner_photo_ok: { Args: { _path: string }; Returns: boolean }
      work_occupation: { Args: { _value: string }; Returns: string }
      work_posts_match: {
        Args: {
          a: Database["public"]["Tables"]["posts"]["Row"]
          b: Database["public"]["Tables"]["posts"]["Row"]
        }
        Returns: boolean
      }
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
