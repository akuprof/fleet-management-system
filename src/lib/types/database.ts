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
      fuel_records: {
        Row: {
          id: string
          vehicle_id: string | null
          driver_id: string | null
          liters: number
          amount: number
          filled_at: string
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id?: string | null
          driver_id?: string | null
          liters: number
          amount: number
          filled_at: string
          created_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string | null
          driver_id?: string | null
          liters?: number
          amount?: number
          filled_at?: string
          created_at?: string
        }
      }
      maintenance: {
        Row: {
          id: string
          vehicle_id: string | null
          description: string
          cost: number
          maintenance_date: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id?: string | null
          description: string
          cost: number
          maintenance_date: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string | null
          description?: string
          cost?: number
          maintenance_date?: string
          status?: string
          created_at?: string
        }
      }
      roles: {
        Row: {
          id: number
          name: string
          permissions_json: Json | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          permissions_json?: Json | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          permissions_json?: Json | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string | null
          username: string | null
          role_id: number | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          username?: string | null
          role_id?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          username?: string | null
          role_id?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      drivers: {
        Row: {
          id: string
          name: string
          phone: string | null
          email: string | null
          license_number: string | null
          license_expiry: string | null
          address: string | null
          join_date: string | null
          status: string | null
          emergency_contact: string | null
          profile_photo: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          email?: string | null
          license_number?: string | null
          license_expiry?: string | null
          address?: string | null
          join_date?: string | null
          status?: string | null
          emergency_contact?: string | null
          profile_photo?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          email?: string | null
          license_number?: string | null
          license_expiry?: string | null
          address?: string | null
          join_date?: string | null
          status?: string | null
          emergency_contact?: string | null
          profile_photo?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          registration_number: string
          model: string | null
          brand: string | null
          year: number | null
          color: string | null
          insurance_number: string | null
          insurance_expiry: string | null
          rc_number: string | null
          permit_number: string | null
          status: string | null
          purchase_date: string | null
          last_maintenance: string | null
          next_maintenance_due: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          registration_number: string
          model?: string | null
          brand?: string | null
          year?: number | null
          color?: string | null
          insurance_number?: string | null
          insurance_expiry?: string | null
          rc_number?: string | null
          permit_number?: string | null
          status?: string | null
          purchase_date?: string | null
          last_maintenance?: string | null
          next_maintenance_due?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          registration_number?: string
          model?: string | null
          brand?: string | null
          year?: number | null
          color?: string | null
          insurance_number?: string | null
          insurance_expiry?: string | null
          rc_number?: string | null
          permit_number?: string | null
          status?: string | null
          purchase_date?: string | null
          last_maintenance?: string | null
          next_maintenance_due?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          shift_id: string | null
          driver_id: string | null
          vehicle_id: string | null
          trip_start_time: string | null
          trip_end_time: string | null
          pickup_location: string | null
          drop_location: string | null
          distance_km: number | null
          fare_amount: number | null
          platform_commission: number | null
          net_revenue: number | null
          trip_status: string | null
          platform_trip_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shift_id?: string | null
          driver_id?: string | null
          vehicle_id?: string | null
          trip_start_time?: string | null
          trip_end_time?: string | null
          pickup_location?: string | null
          drop_location?: string | null
          distance_km?: number | null
          fare_amount?: number | null
          platform_commission?: number | null
          net_revenue?: number | null
          trip_status?: string | null
          platform_trip_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shift_id?: string | null
          driver_id?: string | null
          vehicle_id?: string | null
          trip_start_time?: string | null
          trip_end_time?: string | null
          pickup_location?: string | null
          drop_location?: string | null
          distance_km?: number | null
          fare_amount?: number | null
          platform_commission?: number | null
          net_revenue?: number | null
          trip_status?: string | null
          platform_trip_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      daily_summaries: {
        Row: {
          id: number
          driver_id: number | null
          vehicle_id: number | null
          summary_date: string | null
          total_trips: number | null
          total_revenue: number | null
          total_distance: number | null
          target_amount: number | null
          commission_earned: number | null
          incentive_earned: number | null
          total_payout: number | null
          fuel_expense: number | null
          toll_expense: number | null
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          driver_id?: number | null
          vehicle_id?: number | null
          summary_date?: string | null
          total_trips?: number | null
          total_revenue?: number | null
          total_distance?: number | null
          target_amount?: number | null
          commission_earned?: number | null
          incentive_earned?: number | null
          total_payout?: number | null
          fuel_expense?: number | null
          toll_expense?: number | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          driver_id?: number | null
          vehicle_id?: number | null
          summary_date?: string | null
          total_trips?: number | null
          total_revenue?: number | null
          total_distance?: number | null
          target_amount?: number | null
          commission_earned?: number | null
          incentive_earned?: number | null
          total_payout?: number | null
          fuel_expense?: number | null
          toll_expense?: number | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payouts: {
        Row: {
          id: number
          driver_id: number | null
          payout_date: string | null
          revenue_amount: number | null
          commission_amount: number | null
          incentive_amount: number | null
          deduction_amount: number | null
          net_payout: number | null
          approval_status: string | null
          approved_by: string | null
          approved_at: string | null
          payment_status: string | null
          payment_reference: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          driver_id?: number | null
          payout_date?: string | null
          revenue_amount?: number | null
          commission_amount?: number | null
          incentive_amount?: number | null
          deduction_amount?: number | null
          net_payout?: number | null
          approval_status?: string | null
          approved_by?: string | null
          approved_at?: string | null
          payment_status?: string | null
          payment_reference?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          driver_id?: number | null
          payout_date?: string | null
          revenue_amount?: number | null
          commission_amount?: number | null
          incentive_amount?: number | null
          deduction_amount?: number | null
          net_payout?: number | null
          approval_status?: string | null
          approved_by?: string | null
          approved_at?: string | null
          payment_status?: string | null
          payment_reference?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      assignments: {
        Row: {
          id: number
          driver_id: number
          vehicle_id: number
          start_date: string | null
          end_date: string | null
          status: string | null
          assigned_by: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          driver_id: number
          vehicle_id: number
          start_date?: string | null
          end_date?: string | null
          status?: string | null
          assigned_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          driver_id?: number
          vehicle_id?: number
          start_date?: string | null
          end_date?: string | null
          status?: string | null
          assigned_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shifts: {
        Row: {
          id: number
          driver_id: number | null
          vehicle_id: number | null
          assignment_id: number | null
          shift_date: string | null
          shift_type: string | null
          start_time: string | null
          end_time: string | null
          status: string | null
          pre_shift_inspection: string | null
          post_shift_inspection: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          driver_id?: number | null
          vehicle_id?: number | null
          assignment_id?: number | null
          shift_date?: string | null
          shift_type?: string | null
          start_time?: string | null
          end_time?: string | null
          status?: string | null
          pre_shift_inspection?: string | null
          post_shift_inspection?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          driver_id?: number | null
          vehicle_id?: number | null
          assignment_id?: number | null
          shift_date?: string | null
          shift_type?: string | null
          start_time?: string | null
          end_time?: string | null
          status?: string | null
          pre_shift_inspection?: string | null
          post_shift_inspection?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: number
          entity_type: string | null
          entity_id: number
          document_type: string | null
          file_path: string | null
          file_name: string | null
          expiry_date: string | null
          status: string | null
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          entity_type?: string | null
          entity_id: number
          document_type?: string | null
          file_path?: string | null
          file_name?: string | null
          expiry_date?: string | null
          status?: string | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          entity_type?: string | null
          entity_id?: number
          document_type?: string | null
          file_path?: string | null
          file_name?: string | null
          expiry_date?: string | null
          status?: string | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      expenses: {
        Row: {
          id: number
          expense_type: string | null
          driver_id: number | null
          vehicle_id: number | null
          amount: number | null
          expense_date: string | null
          category: string | null
          description: string | null
          receipt_path: string | null
          approved_by: string | null
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          expense_type?: string | null
          driver_id?: number | null
          vehicle_id?: number | null
          amount?: number | null
          expense_date?: string | null
          category?: string | null
          description?: string | null
          receipt_path?: string | null
          approved_by?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          expense_type?: string | null
          driver_id?: number | null
          vehicle_id?: number | null
          amount?: number | null
          expense_date?: string | null
          category?: string | null
          description?: string | null
          receipt_path?: string | null
          approved_by?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      incidents: {
        Row: {
          id: number
          driver_id: number | null
          vehicle_id: number | null
          incident_date: string | null
          incident_time: string | null
          location: string | null
          incident_type: string | null
          severity: string | null
          description: string | null
          is_negligence: boolean | null
          company_liable: boolean | null
          estimated_cost: number | null
          status: string | null
          reported_by: string | null
          photos_path: string | null
          police_report_number: string | null
          insurance_claim_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          driver_id?: number | null
          vehicle_id?: number | null
          incident_date?: string | null
          incident_time?: string | null
          location?: string | null
          incident_type?: string | null
          severity?: string | null
          description?: string | null
          is_negligence?: boolean | null
          company_liable?: boolean | null
          estimated_cost?: number | null
          status?: string | null
          reported_by?: string | null
          photos_path?: string | null
          police_report_number?: string | null
          insurance_claim_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          driver_id?: number | null
          vehicle_id?: number | null
          incident_date?: string | null
          incident_time?: string | null
          location?: string | null
          incident_type?: string | null
          severity?: string | null
          description?: string | null
          is_negligence?: boolean | null
          company_liable?: boolean | null
          estimated_cost?: number | null
          status?: string | null
          reported_by?: string | null
          photos_path?: string | null
          police_report_number?: string | null
          insurance_claim_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      deductions: {
        Row: {
          id: number
          driver_id: number | null
          incident_id: number | null
          deduction_type: string | null
          amount: number | null
          reason: string | null
          status: string | null
          approved_by: string | null
          approved_at: string | null
          applied_to_payout_id: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          driver_id?: number | null
          incident_id?: number | null
          deduction_type?: string | null
          amount?: number | null
          reason?: string | null
          status?: string | null
          approved_by?: string | null
          approved_at?: string | null
          applied_to_payout_id?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          driver_id?: number | null
          incident_id?: number | null
          deduction_type?: string | null
          amount?: number | null
          reason?: string | null
          status?: string | null
          approved_by?: string | null
          approved_at?: string | null
          applied_to_payout_id?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      incident_deductions: {
        Row: {
          id: number
          incident_id: number | null
          deduction_amount: number | null
          reason: string | null
          approved_by: string | null
          status: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          incident_id?: number | null
          deduction_amount?: number | null
          reason?: string | null
          approved_by?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          incident_id?: number | null
          deduction_amount?: number | null
          reason?: string | null
          approved_by?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_payout: {
        Args: {
          revenue: number
        }
        Returns: number
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

