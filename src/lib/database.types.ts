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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      character_inventory: {
        Row: {
          character_id: string
          id: string
          item_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          character_id: string
          id?: string
          item_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          character_id?: string
          id?: string
          item_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_inventory_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          account_id: string
          attribute_points: number
          charisma: number
          contracts_completed_today: number
          contracts_reset_date: string
          created_at: string
          dexterity: number
          endurance: number
          gold: number
          id: string
          intelligence: number
          knowledge: number
          last_active_at: string
          level: number
          luck: number
          name: string
          region: string
          strength: number
          xp: number
        }
        Insert: {
          account_id: string
          attribute_points?: number
          charisma?: number
          contracts_completed_today?: number
          contracts_reset_date?: string
          created_at?: string
          dexterity?: number
          endurance?: number
          gold?: number
          id?: string
          intelligence?: number
          knowledge?: number
          last_active_at?: string
          level?: number
          luck?: number
          name: string
          region?: string
          strength?: number
          xp?: number
        }
        Update: {
          account_id?: string
          attribute_points?: number
          charisma?: number
          contracts_completed_today?: number
          contracts_reset_date?: string
          created_at?: string
          dexterity?: number
          endurance?: number
          gold?: number
          id?: string
          intelligence?: number
          knowledge?: number
          last_active_at?: string
          level?: number
          luck?: number
          name?: string
          region?: string
          strength?: number
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "characters_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_contracts: {
        Row: {
          contract_type: string
          description: string
          faction: string
          gold_reward_per_unit: number
          id: string
          knowledge_reward: number
          max_qty: number
          min_level: number
          min_qty: number
          requirement_item: string
          title: string
        }
        Insert: {
          contract_type: string
          description: string
          faction: string
          gold_reward_per_unit?: number
          id: string
          knowledge_reward?: number
          max_qty?: number
          min_level?: number
          min_qty?: number
          requirement_item: string
          title: string
        }
        Update: {
          contract_type?: string
          description?: string
          faction?: string
          gold_reward_per_unit?: number
          id?: string
          knowledge_reward?: number
          max_qty?: number
          min_level?: number
          min_qty?: number
          requirement_item?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_contracts_requirement_item_fkey"
            columns: ["requirement_item"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
        ]
      }
      content_discoveries: {
        Row: {
          base_value: number
          category: string
          description: string
          effect_type: string | null
          effect_value: string | null
          icon_path: string
          id: string
          lore: string
          name: string
          rarity: string
        }
        Insert: {
          base_value?: number
          category?: string
          description: string
          effect_type?: string | null
          effect_value?: string | null
          icon_path?: string
          id: string
          lore?: string
          name: string
          rarity?: string
        }
        Update: {
          base_value?: number
          category?: string
          description?: string
          effect_type?: string | null
          effect_value?: string | null
          icon_path?: string
          id?: string
          name?: string
          rarity?: string
        }
        Relationships: []
      }
      content_items: {
        Row: {
          base_value: number
          category: string
          description: string
          icon_path: string
          id: string
          is_tradeable: boolean
          name: string
          rarity: string
          subcategory: string
          tier: number
        }
        Insert: {
          base_value?: number
          category: string
          description?: string
          icon_path?: string
          id: string
          is_tradeable?: boolean
          name: string
          rarity?: string
          subcategory?: string
          tier?: number
        }
        Update: {
          base_value?: number
          category?: string
          description?: string
          icon_path?: string
          id?: string
          is_tradeable?: boolean
          name?: string
          rarity?: string
          subcategory?: string
          tier?: number
        }
        Relationships: []
      }
      content_profession_rewards: {
        Row: {
          id: string
          item_id: string
          max_qty: number
          min_level: number
          min_qty: number
          profession_id: string
          weight: number
        }
        Insert: {
          id?: string
          item_id: string
          max_qty?: number
          min_level?: number
          min_qty?: number
          profession_id: string
          weight?: number
        }
        Update: {
          id?: string
          item_id?: string
          max_qty?: number
          min_level?: number
          min_qty?: number
          profession_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_profession_rewards_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_profession_rewards_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "content_professions"
            referencedColumns: ["id"]
          },
        ]
      }
      content_professions: {
        Row: {
          base_time_seconds: number
          base_xp_per_action: number
          category: string
          description: string
          icon_path: string
          id: string
          name: string
          unlocks_at_level: number
        }
        Insert: {
          base_time_seconds?: number
          base_xp_per_action?: number
          category: string
          description: string
          icon_path?: string
          id: string
          name: string
          unlocks_at_level?: number
        }
        Update: {
          base_time_seconds?: number
          base_xp_per_action?: number
          category?: string
          description?: string
          icon_path?: string
          id?: string
          name?: string
          unlocks_at_level?: number
        }
        Relationships: []
      }
      content_region_discoveries: {
        Row: {
          discovery_id: string
          id: string
          min_exploration_level: number
          region_id: string
          weight: number
        }
        Insert: {
          discovery_id: string
          id?: string
          min_exploration_level?: number
          region_id: string
          weight?: number
        }
        Update: {
          discovery_id?: string
          id?: string
          min_exploration_level?: number
          region_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_region_discoveries_discovery_id_fkey"
            columns: ["discovery_id"]
            isOneToOne: false
            referencedRelation: "content_discoveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_region_discoveries_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "content_regions"
            referencedColumns: ["id"]
          },
        ]
      }
      content_regions: {
        Row: {
          description: string
          exploration_base_time: number
          icon_path: string
          id: string
          name: string
          required_level: number
          unlock_cost_gold: number
        }
        Insert: {
          description: string
          exploration_base_time?: number
          icon_path?: string
          id: string
          name: string
          required_level?: number
          unlock_cost_gold?: number
        }
        Update: {
          description?: string
          exploration_base_time?: number
          icon_path?: string
          id?: string
          name?: string
          required_level?: number
          unlock_cost_gold?: number
        }
        Relationships: []
      }
      contracts: {
        Row: {
          character_id: string
          completed: boolean
          contract_type: string
          created_at: string
          expires_at: string
          faction: string
          id: string
          requirement_item: string
          requirement_qty: number
          reward_gold: number
          reward_knowledge: number
          reward_reputation: string | null
        }
        Insert: {
          character_id: string
          completed?: boolean
          contract_type: string
          created_at?: string
          expires_at: string
          faction: string
          id?: string
          requirement_item: string
          requirement_qty: number
          reward_gold?: number
          reward_knowledge?: number
          reward_reputation?: string | null
        }
        Update: {
          character_id?: string
          completed?: boolean
          contract_type?: string
          created_at?: string
          expires_at?: string
          faction?: string
          id?: string
          requirement_item?: string
          requirement_qty?: number
          reward_gold?: number
          reward_knowledge?: number
          reward_reputation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      exploration: {
        Row: {
          character_id: string
          completed: boolean
          created_at: string
          discoveries: Json
          finish_at: string
          id: string
          is_queued: boolean
          region: string
          started_at: string
        }
        Insert: {
          character_id: string
          completed?: boolean
          created_at?: string
          discoveries?: Json
          finish_at: string
          id?: string
          is_queued?: boolean
          region: string
          started_at: string
        }
        Update: {
          character_id?: string
          completed?: boolean
          created_at?: string
          discoveries?: Json
          finish_at?: string
          id?: string
          is_queued?: boolean
          region?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exploration_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      game_logs: {
        Row: {
          account_id: string
          action: string
          character_id: string | null
          created_at: string
          details: Json
          id: string
        }
        Insert: {
          account_id: string
          action: string
          character_id?: string | null
          created_at?: string
          details?: Json
          id?: string
        }
        Update: {
          account_id?: string
          action?: string
          character_id?: string | null
          created_at?: string
          details?: Json
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_logs_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_logs_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      player_discoveries: {
        Row: {
          account_id: string
          discovered_at: string
          discovery_id: string
          id: string
          region_id: string | null
          lore: string
        }
        Insert: {
          account_id: string
          discovered_at?: string
          discovery_id: string
          id?: string
          region_id?: string | null
          lore?: string
        }
        Update: {
          account_id?: string
          discovered_at?: string
          discovery_id?: string
          id?: string
          region_id?: string | null
          lore?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_discoveries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_discoveries_discovery_id_fkey"
            columns: ["discovery_id"]
            isOneToOne: false
            referencedRelation: "content_discoveries"
            referencedColumns: ["id"]
          },
        ]
      }
      professions: {
        Row: {
          category: string
          character_id: string
          created_at: string
          finish_at: string | null
          id: string
          is_active: boolean
          is_queued: boolean
          level: number
          profession: string
          started_at: string | null
          xp: number
        }
        Insert: {
          category?: string
          character_id: string
          created_at?: string
          finish_at?: string | null
          id?: string
          is_active?: boolean
          is_queued?: boolean
          level?: number
          profession: string
          started_at?: string | null
          xp?: number
        }
        Update: {
          category?: string
          character_id?: string
          created_at?: string
          finish_at?: string | null
          id?: string
          is_active?: boolean
          is_queued?: boolean
          level?: number
          profession?: string
          started_at?: string | null
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "professions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bob_coins: number
          bob_pass: boolean
          bob_pass_lifetime: boolean
          created_at: string
          display_name: string | null
          id: string
          reputation: Json
          updated_at: string
          username: string
        }
        Insert: {
          bob_coins?: number
          bob_pass?: boolean
          bob_pass_lifetime?: boolean
          created_at?: string
          display_name?: string | null
          id: string
          reputation?: Json
          updated_at?: string
          username: string
        }
        Update: {
          bob_coins?: number
          bob_pass?: boolean
          bob_pass_lifetime?: boolean
          created_at?: string
          display_name?: string | null
          id?: string
          reputation?: Json
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      research: {
        Row: {
          character_id: string
          finish_at: string | null
          id: string
          level: number
          started_at: string | null
          technology: string
        }
        Insert: {
          character_id: string
          finish_at?: string | null
          id?: string
          level?: number
          started_at?: string | null
          technology: string
        }
        Update: {
          character_id?: string
          finish_at?: string | null
          id?: string
          level?: number
          started_at?: string | null
          technology?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      storage: {
        Row: {
          account_id: string
          id: string
          item_id: string
          item_type: string
          quantity: number
          updated_at: string
        }
        Insert: {
          account_id: string
          id?: string
          item_id: string
          item_type: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          account_id?: string
          id?: string
          item_id?: string
          item_type?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "storage_account_id_fkey"
            columns: ["account_id"]
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
      add_gold: {
        Args: { p_amount: number; p_character_id: string }
        Returns: Json
      }
      add_knowledge: {
        Args: { p_amount: number; p_character_id: string }
        Returns: Json
      }
      calculate_xp_for_level: { Args: { level: number }; Returns: number }
      get_active_activities: {
        Args: { p_account_id: string }
        Returns: {
          character_id: string
          character_name: string
          elapsed_seconds: number
          finish_at: string
          profession: string
          started_at: string
        }[]
      }
      process_offline_activity: {
        Args: { p_character_id: string; p_profession: string }
        Returns: Json
      }
      transfer_to_storage: {
        Args: { p_character_id: string; p_item_id: string; p_quantity: number }
        Returns: Json
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
