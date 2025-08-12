export type ProfileTable = {
  Row: {
    created_at: string
    email: string | null
    first_name: string | null
    id: string
    last_name: string | null
    role: "student" | "super_admin" | "program_manager" | "fee_collector" | "partnerships_head" | "placement_coordinator"
    updated_at: string
    user_id: string
  }
  Insert: {
    created_at?: string
    email?: string | null
    first_name?: string | null
    id?: string
    last_name?: string | null
    role?: "student" | "super_admin" | "program_manager" | "fee_collector" | "partnerships_head" | "placement_coordinator"
    updated_at?: string
    user_id: string
  }
  Update: {
    created_at?: string
    email?: string | null
    first_name?: string | null
    id?: string
    last_name?: string | null
    role?: "student" | "super_admin" | "program_manager" | "fee_collector" | "partnerships_head" | "placement_coordinator"
    updated_at?: string
    user_id?: string
  }
  Relationships: []
}
