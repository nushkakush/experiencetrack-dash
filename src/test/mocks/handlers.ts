/**
 * MSW handlers for API mocking
 * Provides realistic API responses for testing
 */

import { http, HttpResponse } from 'msw';
import { createTestUser, createTestCohort, createTestStudent } from '../utils/test-utils';

// Base URL for API
const API_BASE = 'https://ghmpaghyasyllfvamfna.supabase.co/rest/v1';

// Mock data stores
let mockUsers = [
  createTestUser({ id: 'user-1', email: 'admin@example.com', role: 'super_admin' }),
  createTestUser({ id: 'user-2', email: 'manager@example.com', role: 'program_manager' }),
  createTestUser({ id: 'user-3', email: 'student@example.com', role: 'student' }),
];

let mockCohorts = [
  createTestCohort({ id: 'cohort-1', cohort_id: 'COHORT-2024-01', name: 'Spring 2024 Cohort' }),
  createTestCohort({ id: 'cohort-2', cohort_id: 'COHORT-2024-02', name: 'Summer 2024 Cohort' }),
];

let mockStudents = [
  createTestStudent({ id: 'student-1', cohort_id: 'cohort-1', email: 'student1@example.com' }),
  createTestStudent({ id: 'student-2', cohort_id: 'cohort-1', email: 'student2@example.com' }),
  createTestStudent({ id: 'student-3', cohort_id: 'cohort-2', email: 'student3@example.com' }),
];

// Auth handlers
export const authHandlers = [
  // Get session
  http.get(`${API_BASE}/auth/v1/user`, () => {
    return HttpResponse.json({
      id: 'user-1',
      email: 'admin@example.com',
      role: 'super_admin',
    });
  }),

  // Sign out
  http.post(`${API_BASE}/auth/v1/logout`, () => {
    return HttpResponse.json({ message: 'Signed out successfully' });
  }),
];

// Profile handlers
export const profileHandlers = [
  // Get profile
  http.get(`${API_BASE}/profiles`, ({ request }) => {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
    
    const profile = mockUsers.find(user => user.id === userId);
    
    if (!profile) {
      return HttpResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(profile);
  }),

  // Update profile
  http.patch(`${API_BASE}/profiles`, async ({ request }) => {
    const body = await request.json();
    const { id, ...updates } = body;
    
    const userIndex = mockUsers.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return HttpResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...updates };
    return HttpResponse.json(mockUsers[userIndex]);
  }),
];

// Cohort handlers
export const cohortHandlers = [
  // List cohorts
  http.get(`${API_BASE}/cohorts`, () => {
    return HttpResponse.json(mockCohorts);
  }),

  // Get cohort by ID
  http.get(`${API_BASE}/cohorts`, ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    const cohort = mockCohorts.find(c => c.id === id);
    
    if (!cohort) {
      return HttpResponse.json(
        { error: 'Cohort not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(cohort);
  }),

  // Create cohort
  http.post(`${API_BASE}/cohorts`, async ({ request }) => {
    const body = await request.json();
    const newCohort = {
      ...createTestCohort(),
      ...body,
      id: `cohort-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    mockCohorts.push(newCohort);
    return HttpResponse.json(newCohort);
  }),

  // Update cohort
  http.patch(`${API_BASE}/cohorts`, async ({ request }) => {
    const body = await request.json();
    const { id, ...updates } = body;
    
    const cohortIndex = mockCohorts.findIndex(c => c.id === id);
    if (cohortIndex === -1) {
      return HttpResponse.json(
        { error: 'Cohort not found' },
        { status: 404 }
      );
    }
    
    mockCohorts[cohortIndex] = { 
      ...mockCohorts[cohortIndex], 
      ...updates,
      updated_at: new Date().toISOString(),
    };
    
    return HttpResponse.json(mockCohorts[cohortIndex]);
  }),

  // Delete cohort
  http.delete(`${API_BASE}/cohorts`, ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    const cohortIndex = mockCohorts.findIndex(c => c.id === id);
    if (cohortIndex === -1) {
      return HttpResponse.json(
        { error: 'Cohort not found' },
        { status: 404 }
      );
    }
    
    mockCohorts.splice(cohortIndex, 1);
    return HttpResponse.json({ message: 'Cohort deleted successfully' });
  }),
];

// Student handlers
export const studentHandlers = [
  // List students by cohort
  http.get(`${API_BASE}/cohort_students`, ({ request }) => {
    const url = new URL(request.url);
    const cohortId = url.searchParams.get('cohort_id');
    
    if (cohortId) {
      const students = mockStudents.filter(s => s.cohort_id === cohortId);
      return HttpResponse.json(students);
    }
    
    return HttpResponse.json(mockStudents);
  }),

  // Get student by ID
  http.get(`${API_BASE}/cohort_students`, ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    const student = mockStudents.find(s => s.id === id);
    
    if (!student) {
      return HttpResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(student);
  }),

  // Create student
  http.post(`${API_BASE}/cohort_students`, async ({ request }) => {
    const body = await request.json();
    const newStudent = {
      ...createTestStudent(),
      ...body,
      id: `student-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    mockStudents.push(newStudent);
    return HttpResponse.json(newStudent);
  }),

  // Update student
  http.patch(`${API_BASE}/cohort_students`, async ({ request }) => {
    const body = await request.json();
    const { id, ...updates } = body;
    
    const studentIndex = mockStudents.findIndex(s => s.id === id);
    if (studentIndex === -1) {
      return HttpResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }
    
    mockStudents[studentIndex] = { 
      ...mockStudents[studentIndex], 
      ...updates,
      updated_at: new Date().toISOString(),
    };
    
    return HttpResponse.json(mockStudents[studentIndex]);
  }),

  // Delete student
  http.delete(`${API_BASE}/cohort_students`, ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    const studentIndex = mockStudents.findIndex(s => s.id === id);
    if (studentIndex === -1) {
      return HttpResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }
    
    mockStudents.splice(studentIndex, 1);
    return HttpResponse.json({ message: 'Student deleted successfully' });
  }),
];

// Combine all handlers
export const handlers = [
  ...authHandlers,
  ...profileHandlers,
  ...cohortHandlers,
  ...studentHandlers,
];

// Utility functions for test setup
export const resetMockData = () => {
  mockUsers = [
    createTestUser({ id: 'user-1', email: 'admin@example.com', role: 'super_admin' }),
    createTestUser({ id: 'user-2', email: 'manager@example.com', role: 'program_manager' }),
    createTestUser({ id: 'user-3', email: 'student@example.com', role: 'student' }),
  ];
  
  mockCohorts = [
    createTestCohort({ id: 'cohort-1', cohort_id: 'COHORT-2024-01', name: 'Spring 2024 Cohort' }),
    createTestCohort({ id: 'cohort-2', cohort_id: 'COHORT-2024-02', name: 'Summer 2024 Cohort' }),
  ];
  
  mockStudents = [
    createTestStudent({ id: 'student-1', cohort_id: 'cohort-1', email: 'student1@example.com' }),
    createTestStudent({ id: 'student-2', cohort_id: 'cohort-1', email: 'student2@example.com' }),
    createTestStudent({ id: 'student-3', cohort_id: 'cohort-2', email: 'student3@example.com' }),
  ];
};

export const getMockData = () => ({
  users: mockUsers,
  cohorts: mockCohorts,
  students: mockStudents,
});
