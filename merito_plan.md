# Merito CRM Integration Plan

## Overview

This document outlines the integration plan for syncing student enquiries and applications with the Merito CRM system. The integration will automatically create or update leads in Merito when students either enquire on the website or apply directly through the registration page.

## Current System Analysis

### Existing Data Flows

#### 1. Enquiry Flow

- **Source**: Webflow forms on website
- **Webhook**: `webflow-enquiry-webhook` Edge Function
- **Database**: `enquiries` table
- **Key Fields**: `full_name`, `email`, `phone`, `professional_status`, `course_of_interest`, `utm_*` parameters

#### 2. Registration/Application Flow

- **Source**: Direct registration page (`/auth/register`)
- **Service**: `RegistrationService.registerUser()`
- **Database**: `student_applications` table
- **Key Fields**: `email`, `firstName`, `lastName`, `phone`, `dateOfBirth`, `qualification`, `cohortId`

### Application Statuses

- **Registration Flow**: `registration_initiated` → `registration_completed` → `application_fee_paid`
- **Application Flow**: `application_initiated` → `application_accepted` → `interview_scheduled` → `enrolled`

## Integration Requirements

### 1. Merito API Integration

#### API Endpoint

- **URL**: `https://api.nopaperforms.io/lead/v1/createOrUpdate`
- **Method**: POST
- **Headers**:
  - `secret-key: <7073a99d3efe4b0c9066e84e08d9916d>`
  - `access-key: <314c10e35cbc48acbcd95daaec207a8a>`

#### Required Parameters

- `email` (string) - Primary identifier
- `mobile` (integer) - Alternative identifier
- `search_criteria` (string) - "email" or "mobile"
- Additional fields: `name`, `lead_stage`, etc.

### 2. Lead Status Mapping

#### Enquiry Statuses

| Internal Status | Merito Lead Stage | Description                            |
| --------------- | ----------------- | -------------------------------------- |
| `active`        | `enquiry`         | Initial enquiry from website           |
| `active`        | `hot`             | High-value enquiry (based on criteria) |

#### Application Statuses

| Internal Status          | Merito Lead Stage | Description              |
| ------------------------ | ----------------- | ------------------------ |
| `registration_initiated` | `warm`            | Registration started     |
| `registration_completed` | `warm`            | Registration completed   |
| `application_fee_paid`   | `hot`             | Application fee paid     |
| `application_initiated`  | `hot`             | Application submitted    |
| `application_accepted`   | `hot`             | Application accepted     |
| `interview_scheduled`    | `hot`             | Interview scheduled      |
| `interview_selected`     | `hot`             | Selected after interview |
| `enrolled`               | `converted`       | Successfully enrolled    |

## Implementation Plan

### Phase 1: Core Integration Service

#### 1.1 Create Merito Service

**File**: `src/services/merito.service.ts`

```typescript
export class MeritoService {
  private static readonly API_URL =
    'https://api.nopaperforms.io/lead/v1/createOrUpdate';
  private static readonly SECRET_KEY = process.env.MERITO_SECRET_KEY;
  private static readonly ACCESS_KEY = process.env.MERITO_ACCESS_KEY;

  static async createOrUpdateLead(
    leadData: MeritoLeadData
  ): Promise<MeritoResponse> {
    // Implementation
  }

  static async syncEnquiry(enquiry: Enquiry): Promise<void> {
    // Map enquiry to Merito lead format
  }

  static async syncApplication(application: StudentApplication): Promise<void> {
    // Map application to Merito lead format
  }
}
```

#### 1.2 Create Merito Types

**File**: `src/types/merito.ts`

```typescript
export interface MeritoLeadData {
  email: string;
  mobile?: number;
  search_criteria: 'email' | 'mobile';
  name?: string;
  lead_stage?: string;
  // Additional custom fields
}

export interface MeritoResponse {
  code: number;
  status: boolean;
  message: string;
  data: {
    lead_id: string;
  };
}
```

### Phase 2: Integration Points

#### 2.1 Enquiry Integration

**File**: `supabase/functions/webflow-enquiry-webhook/index.ts`

Add Merito sync after successful enquiry creation:

```typescript
// After line 258 (after enquiry creation)
if (createdEnquiry) {
  // Sync to Merito CRM
  try {
    await MeritoService.syncEnquiry(createdEnquiry);
    console.log('✅ Enquiry synced to Merito CRM');
  } catch (error) {
    console.error('❌ Failed to sync enquiry to Merito:', error);
    // Don't fail the webhook if Merito sync fails
  }
}
```

#### 2.2 Registration Integration

**File**: `src/services/registration.service.ts`

Add Merito sync after successful registration:

```typescript
// After line 160 (after application creation)
if (applicationData) {
  // Sync to Merito CRM
  try {
    await MeritoService.syncApplication(applicationData);
    console.log('✅ Application synced to Merito CRM');
  } catch (error) {
    console.error('❌ Failed to sync application to Merito:', error);
    // Don't fail registration if Merito sync fails
  }
}
```

#### 2.3 Application Status Updates

**File**: `src/services/studentApplications.service.ts`

Add Merito sync when application status changes:

```typescript
// In updateApplicationStatus method
static async updateApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus
): Promise<void> {
  // Update in database
  // ... existing code ...

  // Sync to Merito CRM
  try {
    const application = await this.getApplicationById(applicationId);
    if (application) {
      await MeritoService.syncApplication(application);
    }
  } catch (error) {
    console.error('❌ Failed to sync application status to Merito:', error);
  }
}
```

### Phase 3: Data Mapping

#### 3.1 Enquiry to Merito Mapping

```typescript
function mapEnquiryToMerito(enquiry: Enquiry): MeritoLeadData {
  return {
    email: enquiry.email,
    mobile: parseInt(enquiry.phone.replace(/\D/g, '')),
    search_criteria: 'email',
    name: enquiry.full_name,
    lead_stage: determineLeadStage(enquiry),
    // Additional fields
    course_of_interest: enquiry.course_of_interest,
    professional_status: enquiry.professional_status,
    utm_source: enquiry.utm_source,
    utm_campaign: enquiry.utm_campaign,
  };
}
```

#### 3.2 Application to Merito Mapping

```typescript
function mapApplicationToMerito(
  application: StudentApplication
): MeritoLeadData {
  return {
    email: application.profile.email,
    mobile: parseInt(application.profile.phone.replace(/\D/g, '')),
    search_criteria: 'email',
    name: `${application.profile.first_name} ${application.profile.last_name}`,
    lead_stage: mapApplicationStatusToLeadStage(application.status),
    // Additional fields
    cohort_id: application.cohort_id,
    registration_source: application.registration_source,
  };
}
```

### Phase 4: Error Handling & Monitoring

#### 4.1 Retry Mechanism

- Implement exponential backoff for failed API calls
- Queue failed syncs for retry
- Log all sync attempts and failures

#### 4.2 Monitoring Dashboard

- Add Merito sync status to enquiries page
- Show sync history and error logs
- Manual retry functionality for failed syncs

### Phase 5: Configuration & Environment

#### 5.1 Environment Variables

```env
MERITO_SECRET_KEY=your_secret_key
MERITO_ACCESS_KEY=your_access_key
MERITO_API_URL=https://api.nopaperforms.io/lead/v1/createOrUpdate
MERITO_ENABLED=true
```

#### 5.2 Feature Flag

Add Merito integration as a feature flag to enable/disable:

```typescript
// In feature flags
MERITO_INTEGRATION: {
  enabled: true,
  description: 'Sync enquiries and applications to Merito CRM'
}
```

## Data Flow Diagrams

### Enquiry Flow

```
Webflow Form → Webhook → Database → Merito API
     ↓              ↓         ↓         ↓
  Form Data → Transform → Store → Sync Lead
```

### Application Flow

```
Registration → Database → Merito API
     ↓            ↓         ↓
  Form Data → Store → Sync Lead
```

### Status Update Flow

```
Status Change → Database → Merito API
      ↓            ↓         ↓
  New Status → Update → Sync Lead
```

## Testing Strategy

### 1. Unit Tests

- Test Merito service methods
- Test data mapping functions
- Test error handling

### 2. Integration Tests

- Test webhook integration
- Test registration flow integration
- Test status update integration

### 3. End-to-End Tests

- Test complete enquiry flow
- Test complete application flow
- Test error scenarios

## Rollout Plan

### Phase 1: Development

- [ ] Create Merito service and types
- [ ] Implement basic CRUD operations
- [ ] Add unit tests

### Phase 2: Integration

- [ ] Integrate with enquiry webhook
- [ ] Integrate with registration flow
- [ ] Add error handling and logging

### Phase 3: Testing

- [ ] Test with staging environment
- [ ] Verify data mapping accuracy
- [ ] Test error scenarios

### Phase 4: Production

- [ ] Deploy to production
- [ ] Monitor sync status
- [ ] Fine-tune based on real data

## Success Metrics

- **Sync Success Rate**: >95% of enquiries/applications synced successfully
- **Data Accuracy**: 100% of synced data matches source data
- **Performance**: <2 seconds average sync time
- **Error Rate**: <5% of syncs fail

## Risk Mitigation

### 1. API Failures

- Implement retry mechanism
- Queue failed syncs
- Don't fail main flows if Merito sync fails

### 2. Data Inconsistency

- Validate data before syncing
- Implement data reconciliation
- Regular audit of synced data

### 3. Performance Impact

- Async processing where possible
- Rate limiting for API calls
- Monitoring and alerting

## Future Enhancements

1. **Bidirectional Sync**: Sync changes from Merito back to our system
2. **Advanced Mapping**: More sophisticated field mapping based on lead source
3. **Bulk Operations**: Batch sync multiple records
4. **Analytics**: Track conversion rates and lead quality
5. **Custom Fields**: Sync additional custom fields based on requirements

## Questions for Clarification

1. **Merito API Credentials**: What are the actual secret key and access key?
2. **Lead Stages**: Are there specific lead stages you want to use in Merito?
3. **Custom Fields**: What additional fields should be synced to Merito?
4. **Error Handling**: How should we handle cases where Merito API is down?
5. **Data Retention**: How long should we keep sync logs and error records?
6. **Testing**: Do you have a staging environment for Merito API testing?

## Next Steps

1. **Get Merito API credentials** from the user
2. **Review and approve** this integration plan
3. **Set up development environment** with Merito API access
4. **Begin implementation** starting with Phase 1
5. **Test integration** with sample data
6. **Deploy to production** after thorough testing
