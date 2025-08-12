# Product Backlog

## 🚀 High Priority

- **Student Dashboard Re-rendering Issue**: Page reloads when switching tabs or multitasking
  - **Issue**: Student dashboard re-renders and reloads data every time user switches browser tabs or multitasks
  - **Impact**: Poor user experience, unnecessary API calls, potential data loss
  - **Location**: `src/pages/dashboards/StudentDashboard.tsx`
  - **Status**: Partially fixed - routing optimization completed, but re-rendering persists
  - **Next Steps**: 
    - Investigate React Query cache invalidation
    - Check for auth state changes triggering re-renders
    - Review useEffect dependencies and component lifecycle
    - Consider implementing React Query's `refetchOnWindowFocus: false`

## 📋 Medium Priority

- Exempt exemptions from the leaderboard (attendance exemptions should not count against attendance scores)
- Session wise data should not reset
- Holidays not getting saved
- 

## 🔧 Low Priority



