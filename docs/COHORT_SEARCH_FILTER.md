# Cohort Details Page - Search and Filter Functionality

## Overview

The Cohort Details page now includes comprehensive search and filter functionality to help program managers efficiently manage and find students within their cohorts. This feature provides real-time filtering capabilities with a clean, intuitive interface.

## Features

### 1. **Search Functionality**
- **Real-time Search**: Search students by name or email address
- **Instant Results**: Results update as you type
- **Case-insensitive**: Search works regardless of case
- **Partial Matching**: Finds students with partial name or email matches

### 2. **Filter Options**

#### **Status Filter**
- **All Statuses**: Shows all students regardless of invite status
- **Pending**: Students who haven't been invited yet
- **Sent**: Students who have been sent invitations
- **Accepted**: Students who have accepted their invitations
- **Failed**: Students whose invitations failed

#### **Scholarship Filter** (Only visible to users with scholarship permissions)
- **All Students**: Shows all students regardless of scholarship status
- **With Scholarship**: Students who have been assigned scholarships
- **Without Scholarship**: Students who haven't been assigned scholarships

#### **Payment Plan Filter** (Only visible to users with scholarship permissions)
- **All Students**: Shows all students regardless of payment plan status
- **With Payment Plan**: Students who have been assigned payment plans
- **Without Payment Plan**: Students who haven't been assigned payment plans

### 3. **User Interface Elements**

#### **Search Bar**
- Prominent search input with search icon
- Placeholder text: "Search students by name or email..."
- Real-time filtering as you type

#### **Filter Toggle**
- Collapsible filter section
- Filter button with active filter count badge
- Clear all filters button when filters are active

#### **Results Summary**
- Shows current filtered count vs total students
- Example: "Students (5 of 20)" or "Showing 5 of 20 students"
- No results message when filters return empty

#### **Active Filter Indicators**
- Badge on filter button showing number of active filters
- Clear button appears when filters are active
- Visual feedback for active search terms

## Usage

### **Basic Search**
1. Type in the search bar to find students by name or email
2. Results update automatically as you type
3. Clear search by deleting the text or clicking the clear button

### **Using Filters**
1. Click the "Filters" button to expand the filter section
2. Select desired filters from the dropdown menus
3. Filters can be combined with search terms
4. Use the "Clear" button to reset all filters

### **Combining Search and Filters**
- Search and filters work together
- You can search for "john" and filter by "accepted" status
- Results will show only students named John who have accepted invitations

### **Clearing Filters**
- Individual filters can be reset to "All" options
- Use the "Clear" button to reset all filters and search at once
- The clear button only appears when filters are active

## Technical Implementation

### **State Management**
- Search query state for text input
- Filter states for each filter type
- Collapsible filter section state
- Computed filtered results using `useMemo`

### **Performance Optimizations**
- Debounced search input for better performance
- Memoized filtered results to prevent unnecessary re-computations
- Efficient filtering logic that handles multiple filter types

### **Responsive Design**
- Mobile-friendly filter layout
- Collapsible filters to save space on smaller screens
- Responsive grid layout for filter options

## User Experience Features

### **Visual Feedback**
- **Active Filter Badge**: Shows count of active filters
- **Results Count**: Always shows current filtered count
- **No Results State**: Helpful message when no students match filters
- **Loading States**: Proper loading indicators during data fetching

### **Accessibility**
- Proper ARIA labels for screen readers
- Keyboard navigation support
- Clear visual hierarchy and contrast
- Descriptive button and input labels

### **Error Handling**
- Graceful handling of empty search results
- Clear messaging when no students match criteria
- Fallback states for edge cases

## Filter Logic

### **Search Logic**
```typescript
const matchesSearch = searchQuery === '' || 
  student.first_name?.toLowerCase().includes(searchLower) ||
  student.last_name?.toLowerCase().includes(searchLower) ||
  student.email?.toLowerCase().includes(searchLower);
```

### **Status Filter Logic**
```typescript
const matchesStatus = statusFilter === 'all' || student.invite_status === statusFilter;
```

### **Scholarship Filter Logic**
```typescript
const hasScholarship = scholarshipAssignments[student.id];
const matchesScholarship = scholarshipFilter === 'all' || 
  (scholarshipFilter === 'assigned' && hasScholarship) ||
  (scholarshipFilter === 'not_assigned' && !hasScholarship);
```

### **Payment Plan Filter Logic**
```typescript
const hasPaymentPlan = paymentPlanAssignments[student.id] && paymentPlanDetails[student.id]?.payment_plan;
const matchesPaymentPlan = paymentPlanFilter === 'all' || 
  (paymentPlanFilter === 'assigned' && hasPaymentPlan) ||
  (paymentPlanFilter === 'not_assigned' && !hasPaymentPlan);
```

## Testing

The search and filter functionality includes comprehensive tests covering:
- Basic rendering of all students
- Search functionality with various queries
- Filter functionality for each filter type
- Combined search and filter scenarios
- Clear filter functionality
- No results handling
- Active filter indicators

## Future Enhancements

### **Potential Improvements**
- **Advanced Search**: Search by phone number or other fields
- **Saved Filters**: Allow users to save frequently used filter combinations
- **Export Filtered Results**: Export only filtered students to CSV
- **Bulk Actions**: Perform actions on filtered students
- **Search History**: Remember recent search terms
- **Filter Presets**: Quick filter combinations for common scenarios

### **Performance Optimizations**
- **Virtual Scrolling**: For very large student lists
- **Server-side Filtering**: For cohorts with hundreds of students
- **Caching**: Cache filtered results for better performance
- **Debouncing**: Further optimize search input performance

## Integration

The search and filter functionality integrates seamlessly with existing features:
- **Student Management**: All existing student actions work with filtered results
- **Scholarship Assignment**: Filter by scholarship status and assign scholarships
- **Payment Plans**: Filter by payment plan status and manage plans
- **Bulk Operations**: Bulk upload and other operations respect current filters
- **Real-time Updates**: Filtered results update when student data changes

This search and filter functionality significantly improves the user experience for program managers managing large cohorts, making it easy to find specific students and perform targeted operations.
