export type HasRoleFunction = {
  Args: {
    _user_id: string
    _role: "student" | "super_admin" | "program_manager" | "fee_collector" | "partnerships_head" | "placement_coordinator"
  }
  Returns: boolean
}

export type IsSessionCancelledFunction = {
  Args: {
    p_cohort_id: string
    p_epic_id: string
    p_session_number: number
    p_session_date: string
  }
  Returns: boolean
}

export type MarkStudentAttendanceFunction = {
  Args: {
    p_cohort_id: string
    p_epic_id: string
    p_session_number: number
    p_session_date: string
    p_student_id: string
    p_status: string
    p_absence_type?: string
    p_reason?: string
  }
  Returns: string
}

export type ToggleSessionCancellationFunction = {
  Args: {
    p_cohort_id: string
    p_epic_id: string
    p_session_number: number
    p_session_date: string
    p_is_cancelled: boolean
  }
  Returns: undefined
}
