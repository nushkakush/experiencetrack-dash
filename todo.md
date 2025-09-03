DATA UPLOAD ISSUES

1. Need to change all lit school IDs to personal IDs on the dashboard.
2. Handle 
2. Did Kuldeep Rajput drop out from CP1? simran will get back

COMPLETED
- Experience Designer role setup with bare-shell dashboard and experience page
- Epic Management system for Experience Designers:
  - Extended epics table with description, outcomes, avatar_url, banner_url fields
  - Created comprehensive Epic management page with CRUD operations
  - Added image upload functionality for avatar and banner images
  - Implemented search and filtering capabilities
  - Added proper role-based permissions and database policies
  - Created feature flags for Epic management functionality
  - Updated learning outcomes to use bulleted points system with JSON storage
  - Created reusable BulletedInput component for structured outcome entry
- Epic Learning Paths Management system for Experience Designers:
  - Created epic_learning_paths table with title, description, outcomes, avatar_url, banner_url, epics (JSON)
  - Built comprehensive Epic Learning Paths management page with CRUD operations
  - Implemented epic selection and reordering functionality within learning paths
  - Added image upload for avatar and banner images
  - Created bulleted learning outcomes system with JSON storage
  - Added search, filtering, and pagination capabilities
  - Implemented proper role-based permissions and database policies
  - Created feature flags for Epic Learning Paths management
  - Added navigation and routing for Epic Learning Paths page
- Experience Design Management system for Experience Designers:
  - Created experiences table with comprehensive CBL support and complex condition logic
  - Built sophisticated condition builder system with nested AND/OR logic and real-time preview
  - Created 4-step stepper dialog for experience creation (Basic Info, CBL Content, Lecture Sessions, Sample Profiles)
  - Implemented WYSIWYG editor, deliverable builder, grading rubric builder, and lecture module builder
  - Added comprehensive experience management page with search, filtering, and CRUD operations
  - Created view and delete dialogs with detailed experience information display
  - Implemented proper role-based permissions and database policies
  - Added feature flags for Experience management functionality
  - Added navigation and routing for Experience Design management page
  - Integrated Epic selector with active epic context for automatic experience-epic linking
  - Added epic_id field to experiences table with proper foreign key relationships
  - Created reusable EpicSelector component and ActiveEpicContext for cross-application epic management
3. un documented - dropout fees + refund
4. Status of Mokshal Gandhi (cm5) (dropped) - reason?
5. in informed/emepted, puttin in the reason is important.
6. There were no uninformed absences
   some people were uninformed LATE so its showing in the absences box

7. after updating scholorship/payment plan the cell doesnt update until i hard refresh
8. after dropdout status, in fee collector dashboard how should it work?
9. how is refund stored, used of dropped out students?
   AFTER CURRICULUM/PROGRAM APP

10. Fee Payment Reports and Visibility
11. have a waiver option
12. Download fee structure PDF
13. Late Fee needed
14. deleting equipment is still throwing bugs
15. Slack Integration

BACKLOG

1. If its a damage/loss report needs to mention
2. Collect the report the moment it was lost and no need to give separate option to report the same
3. Borrow is not showing up in damage report
4. Check if reports are showing correctly
5. Mobile Responsive
6. Manage one student being invited and registered to more than one cohort's flow.
   Handle saving of admission fee date as well
   Bulk upload for fees needs to be figured out.

TECHNICAL/BORING

- Testing Architecture Improvement
- Lot of popup have 2 x buttons
- Modularise large file and enterprise level refactor

DEPENDENCY

1. Ui and language of email reminders need to be set up.
2. Sending Whatsapp Reminders Through GUPSHUP
3. Add Shimmer effects across the application
4. Razorpay E Nach for Instalment wise
5. Razorpay API set up
