# Meritto Extended Registration Sync Implementation

## Overview

This implementation adds comprehensive Meritto CRM synchronization when users complete their extended registration (Step 1 of the application process). Previously, leads were only synced during initial enquiry and basic registration. Now, when users fill out their detailed profile information, all the rich data is automatically synced to Meritto with proper field mapping.

## What Was Implemented

### 1. Enhanced MeritoService (`src/services/merito.service.ts`)

**New Features:**
- ✅ Complete field mapping for all Meritto custom fields
- ✅ New `syncExtendedRegistration()` method specifically for extended registration
- ✅ Enhanced `mapApplicationToMerito()` with extended profile data mapping
- ✅ Helper methods for data transformation:
  - `formatDateOfBirthForMerito()` - DD/MM/YYYY format
  - `mapGenderToMerito()` - Maps to Meritto dropdown values
  - `mapMonthToMerito()` - Maps month names/numbers to Meritto format
- ✅ Improved lead quality scoring based on profile completeness
- ✅ Updated conversion stage mapping for `registration_completed` status

**Meritto Field Mappings Added:**
```javascript
// Personal Information
cf_date_of_birth: "DD/MM/YYYY format"
cf_specify_your_gender: "Male/Female/Third Gender"
cf_where_do_you_live: "Current city"
cf_state: "Current state"
cf_city: "Current city"
cf_current_address: "Full address"
cf_postal_zip_code: "PIN code"

// Social Profiles
cf_linkedin_profile: "LinkedIn URL"
cf_instagram_id: "Instagram profile"

// Education
cf_highest_education_level: "Qualification"
cf_field_of_study: "Field of study"
cf_institution_name: "Institution name"
cf_graduation_month_new: "January/February/etc."
cf_graduation_year: "Year"

// Work Experience
cf_do_you_have_work_experience: "Yes/No"
cf_work_experience_type: "Experience type"
cf_job_description: "Job title/description"
cf_company_name: "Company name"
cf_work_start_year: "Start year"
cf_work_end_month_new: "End month"

// Family Information
cf_fathers_first_name: "Father's first name"
cf_fathers_last_name: "Father's last name"
cf_fathers_contact_number: "Father's phone (cleaned)"
cf_fathers_occupation: "Father's occupation"
cf_fathers_email: "Father's email"

cf_mothers_first_name: "Mother's first name"
cf_mothers_last_name: "Mother's last name"
cf_mothers_contact_number: "Mother's phone (cleaned)"
cf_mothers_occupation: "Mother's occupation"
cf_mothers_email: "Mother's email"

// Financial Aid
cf_have_you_applied_for_financial_aid: "Yes/No"
cf_who_applied_for_this_loan: "Loan applicant name"
cf_type_of_loan: "Loan type"
cf_loan_amount: "Loan amount"
cf_cibil_score: "CIBIL score"
cf_family_income: "Family income"

// Emergency Contact
cf_emergency_contact_first_name: "Emergency contact first name"
cf_emergency_contact_last_name: "Emergency contact last name"
cf_emergency_contact_number: "Emergency contact phone (cleaned)"
cf_relationship: "Relationship"
```

### 2. Enhanced ProfileExtendedService (`src/services/profileExtended.service.ts`)

**New Features:**
- ✅ Automatic Meritto sync trigger when significant profile data is saved
- ✅ `shouldSyncToMerito()` method to determine when sync is needed
- ✅ `syncExtendedRegistrationToMerito()` method for automatic syncing
- ✅ `forceSaveAndSyncToMerito()` method for explicit sync
- ✅ Helper methods to fetch profile and application data
- ✅ Comprehensive error handling and logging

**Sync Triggers:**
The system automatically syncs to Meritto when any of these significant fields are updated:
- `current_address`
- `institution_name`
- `linkedin_profile`
- `father_first_name`
- `mother_first_name`
- `emergency_first_name`
- `highest_qualification`
- `company_name`
- `has_work_experience`

### 3. Updated ApplicationStep Component (`src/pages/auth/application-steps/ApplicationStep.tsx`)

**Changes:**
- ✅ Added explicit Meritto sync when extended registration is completed
- ✅ Updated both payment and no-payment flows to trigger sync
- ✅ Added proper error handling for sync failures
- ✅ Uses `forceSaveAndSyncToMerito()` for guaranteed sync

### 4. Test Component (`src/components/debug/MeritoExtendedRegistrationTest.tsx`)

**Features:**
- ✅ Complete test interface for extended registration sync
- ✅ Mock data generation for testing
- ✅ Direct MeritoService testing
- ✅ ProfileExtendedService integration testing
- ✅ Comprehensive test instructions

## Flow Diagram

```
Website Enquiry → Meritto Lead (enquiry status)
        ↓
User Registers → Meritto Lead Updated (registration_initiated)
        ↓
Password Setup → Meritto Lead Updated (registration_complete)
        ↓
Extended Registration (Step 1) → Meritto Lead Updated (registration_completed)
        ↓                              ↓
Application Fee Payment         Rich Profile Data Synced:
        ↓                       - Personal details
Meritto Lead Updated           - Education info
(application_fee_paid)         - Work experience
                              - Family information
                              - Emergency contact
                              - Social profiles
                              - Financial aid details
```

## Status Progression in Meritto

| Internal Status | Meritto Status | Conversion Stage | Lead Quality |
|----------------|----------------|------------------|--------------|
| `enquiry` | `enquiry` | `awareness` | `cold/warm/hot` |
| `registration_initiated` | `registration_initiated` | `awareness` | `warm` |
| `registration_complete` | `registration_complete` | `awareness` | `warm` |
| `registration_completed` | `registration_completed` | `consideration` | `warm/hot` |
| `application_fee_paid` | `application_fee_paid` | `consideration` | `warm` |
| `application_initiated` | `application_initiated` | `consideration` | `warm` |
| `application_accepted` | `application_accepted` | `decision` | `hot` |
| `interview_scheduled` | `interview_scheduled` | `decision` | `hot` |
| `enrolled` | `enrolled` | `enrolled` | `hot` |

## Lead Quality Scoring

**For Extended Registration:**
- Complete basic profile (name, email, phone): +1 point
- Has qualification: +1 point
- Has extended info (address/institution/LinkedIn): +2 points
- Has work experience: +2 points
- Has family information: +1 point

**Scoring:**
- 4+ points = `warm`
- Basic profile + qualification = `warm`
- Otherwise = `cold`

## Testing

### Manual Testing Steps

1. **Setup Test Environment:**
   ```bash
   # Add the test component to your routing or directly import
   import MeritoExtendedRegistrationTest from '@/components/debug/MeritoExtendedRegistrationTest'
   ```

2. **Test Direct Sync:**
   - Enter a valid Profile ID from your database
   - Fill in test data
   - Click "Test Direct Meritto Sync"
   - Check browser console for logs
   - Verify lead in Meritto dashboard

3. **Test Service Integration:**
   - Use the same Profile ID
   - Click "Test ProfileExtended Service"
   - This tests the complete flow including auto-save triggers

### Expected Behavior

1. **When User Completes Extended Registration:**
   - All profile data is saved to `profile_extended` table
   - Meritto sync is automatically triggered
   - Lead status updates to `registration_completed`
   - Conversion stage changes to `consideration`
   - Lead quality improves based on data completeness

2. **Error Handling:**
   - Meritto sync failures don't break the registration process
   - Comprehensive logging for debugging
   - Retry mechanism for API calls

## Configuration

### Environment Variables Required

```env
MERITO_ENABLED=true
MERITO_SECRET_KEY=your_secret_key
MERITO_ACCESS_KEY=your_access_key
```

### Database Schema

The implementation expects these tables:
- `profiles` - Basic user profile data
- `profile_extended` - Extended profile data
- `student_applications` - Application tracking

## Monitoring and Logging

All sync operations are logged with:
- Profile ID
- Email address
- Status changes
- Fields updated
- Success/failure status
- Error details

Check logs for:
- `✅ Extended registration synced to Merito CRM`
- `❌ Failed to sync extended registration to Merito`

## Future Enhancements

1. **Webhook Integration:** Add Meritto webhook to sync status changes back to your system
2. **Bulk Sync:** Add capability to sync existing users who completed extended registration
3. **Field Validation:** Add validation for Meritto field formats before sync
4. **Sync Queue:** Add queue system for handling sync failures and retries
5. **Analytics:** Add tracking for sync success rates and lead progression

## Troubleshooting

### Common Issues

1. **Sync Not Triggering:**
   - Check if `MERITO_ENABLED=true`
   - Verify API credentials
   - Check if significant fields are being updated

2. **API Errors:**
   - Verify field formats (especially dates and phone numbers)
   - Check Meritto field mappings
   - Review API rate limits

3. **Missing Data:**
   - Ensure profile and application records exist
   - Check database relationships
   - Verify data transformations

### Debug Steps

1. Enable detailed logging
2. Use the test component for isolated testing
3. Check browser console for client-side errors
4. Review server logs for API call details
5. Verify data in Meritto dashboard

## Conclusion

This implementation provides a complete solution for syncing extended registration data to Meritto CRM. It maintains data consistency, provides proper error handling, and ensures that leads are properly tracked through their registration journey with rich profile information.

The system is designed to be robust, scalable, and maintainable, with comprehensive logging and testing capabilities.
