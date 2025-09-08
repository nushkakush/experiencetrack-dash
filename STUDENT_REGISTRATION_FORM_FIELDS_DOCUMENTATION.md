# Student Registration Form - Field Details

## Overview

This document explains all the fields students need to fill out in Step 1 of the registration process. Each field is organized by section and includes what type of input it is, whether it's required, and what validation rules apply.

## Validation Features

- **Real-time Validation**: Fields validate as you type with immediate feedback
- **Format Validation**: Phone numbers, emails, postal codes, and URLs are validated for correct format
- **Business Logic**: Age restrictions, date ranges, and numeric ranges are enforced
- **Auto-save**: Form automatically saves as you type
- **Error Messages**: Clear, helpful error messages guide users to correct input

---

## Section 1: Personal Information

### Full Name

- **Field Type**: Text box (pre-filled, cannot be changed)
- **Required**: Yes
- **Purpose**: Student's complete name as registered in the system

### Email Address

- **Field Type**: Email box (pre-filled, cannot be changed)
- **Required**: Yes
- **Purpose**: Student's email address for communication

### Contact Number

- **Field Type**: Phone number box
- **Required**: Yes
- **Validation**: Must be a valid Indian phone number (10 digits starting with 6-9)
- **Format**: Accepts +91 prefix or just 10 digits
- **Purpose**: Student's phone number for contact and verification

### Contact Verification

- **Field Type**: Verify button
- **Required**: No
- **Purpose**: To confirm the phone number is working

### Date of Birth

- **Field Type**: Three dropdown menus (Day, Month, Year)
- **Required**: Yes
- **Validation**: Must be at least 16 years old to apply
- **Purpose**: Student's birth date for age verification

### LinkedIn Profile

- **Field Type**: Website link box
- **Required**: No
- **Validation**: Must be a valid URL format if provided
- **Purpose**: Student's LinkedIn profile for professional networking

### Instagram ID

- **Field Type**: Text box
- **Required**: No
- **Purpose**: Student's Instagram username for social media connection

### Gender

- **Field Type**: Radio buttons (Male, Female, Other)
- **Required**: Yes
- **Purpose**: Student's gender identification

### Current Address

- **Field Type**: Text box
- **Required**: Yes
- **Purpose**: Student's current residential address

### City

- **Field Type**: Dropdown menu
- **Required**: Yes
- **Purpose**: City where student currently lives (cities appear based on selected state)

### State

- **Field Type**: Dropdown menu
- **Required**: Yes
- **Purpose**: State where student currently lives (select from list of Indian states)

### Postal/ZIP Code

- **Field Type**: Text box
- **Required**: Yes
- **Validation**: Must be a valid 6-digit Indian postal code
- **Format**: First digit 1-9, followed by 5 digits (0-9)
- **Purpose**: Postal code for address verification

---

## Section 2: Education Information

### Highest Education Level

- **Field Type**: Dropdown menu
- **Required**: Yes
- **Purpose**: Student's highest educational qualification

### Field of Study

- **Field Type**: Text box
- **Required**: No
- **Purpose**: What subject the student studied

### Institution Name

- **Field Type**: Text box
- **Required**: Yes
- **Purpose**: Name of the school/college/university attended

### Graduation Month

- **Field Type**: Dropdown menu
- **Required**: No
- **Purpose**: Month when student graduated

### Graduation Year

- **Field Type**: Dropdown menu
- **Required**: Yes
- **Validation**: Must be a reasonable year (not in future, not too old)
- **Purpose**: Year when student graduated

### Do you have work experience?

- **Field Type**: Toggle switch (Yes/No)
- **Required**: No
- **Purpose**: To know if student has work experience

#### Work Experience Details (only shown if "Yes" is selected above)

### Work Experience Type

- **Field Type**: Dropdown menu
- **Required**: Yes (if work experience = Yes)
- **Purpose**: Type of work experience (Employee, Freelancer, Intern, etc.)

### Job Description

- **Field Type**: Large text box
- **Required**: No
- **Purpose**: Description of what the student did at work

### Company Name

- **Field Type**: Text box
- **Required**: Yes (if work experience = Yes)
- **Purpose**: Name of the company where student worked

### Work Start Month

- **Field Type**: Dropdown menu
- **Required**: No
- **Purpose**: Month when work started

### Work Start Year

- **Field Type**: Dropdown menu
- **Required**: No
- **Purpose**: Year when work started

### Work End Month

- **Field Type**: Dropdown menu
- **Required**: No
- **Purpose**: Month when work ended

### Work End Year

- **Field Type**: Dropdown menu
- **Required**: No
- **Validation**: Must be after work start year if both are provided
- **Purpose**: Year when work ended

---

## Section 3: Parental Information

### Father's First Name

- **Field Type**: Text box
- **Required**: Yes
- **Purpose**: Father's first name for family contact

### Father's Last Name

- **Field Type**: Text box
- **Required**: Yes
- **Purpose**: Father's last name for family contact

### Father's Contact Number

- **Field Type**: Phone number box
- **Required**: Yes
- **Validation**: Must be a valid Indian phone number (10 digits starting with 6-9)
- **Purpose**: Father's phone number for emergency contact

### Father's Occupation

- **Field Type**: Text box
- **Required**: No
- **Purpose**: Father's job or profession

### Father's Email

- **Field Type**: Email box
- **Required**: Yes
- **Validation**: Must be a valid email address format
- **Purpose**: Father's email address for communication

### Mother's First Name

- **Field Type**: Text box
- **Required**: Yes
- **Purpose**: Mother's first name for family contact

### Mother's Last Name

- **Field Type**: Text box
- **Required**: Yes
- **Purpose**: Mother's last name for family contact

### Mother's Contact Number

- **Field Type**: Phone number box
- **Required**: Yes
- **Validation**: Must be a valid Indian phone number (10 digits starting with 6-9)
- **Purpose**: Mother's phone number for emergency contact

### Mother's Occupation

- **Field Type**: Text box
- **Required**: No
- **Purpose**: Mother's job or profession

### Mother's Email

- **Field Type**: Email box
- **Required**: Yes
- **Validation**: Must be a valid email address format
- **Purpose**: Mother's email address for communication

### Have you applied for financial aid?

- **Field Type**: Toggle switch (Yes/No)
- **Required**: No
- **Purpose**: To know if student needs financial assistance

#### Financial Aid Details (only shown if "Yes" is selected above)

### Who applied for this loan?

- **Field Type**: Dropdown menu
- **Required**: Yes (if financial aid = Yes)
- **Purpose**: Who is applying for the loan (Self, Parent, Guardian, etc.)

### Type of Loan

- **Field Type**: Dropdown menu
- **Required**: Yes (if financial aid = Yes)
- **Purpose**: What type of loan (Education, Personal, Home, etc.)

### Loan Amount

- **Field Type**: Text box
- **Required**: Yes (if financial aid = Yes)
- **Validation**: Must be a valid positive number
- **Purpose**: How much money is being borrowed

### CIBIL Score

- **Field Type**: Number input box
- **Required**: Yes (if financial aid = Yes)
- **Validation**: Must be between 300 and 900
- **Purpose**: Credit score of the person taking the loan

### Family Income

- **Field Type**: Dropdown menu
- **Required**: Yes (if financial aid = Yes)
- **Purpose**: Total family income per year

---

## Section 4: Emergency Contact Details

### Emergency Contact First Name

- **Field Type**: Text box
- **Required**: Yes
- **Purpose**: First name of person to contact in emergency

### Emergency Contact Last Name

- **Field Type**: Text box
- **Required**: Yes
- **Purpose**: Last name of person to contact in emergency

### Emergency Contact Number

- **Field Type**: Phone number box
- **Required**: Yes
- **Validation**: Must be a valid Indian phone number (10 digits starting with 6-9)
- **Purpose**: Phone number to call in emergency

### Relationship

- **Field Type**: Dropdown menu
- **Required**: Yes
- **Purpose**: How this person is related to the student (Parent, Sibling, Friend, etc.)

---

## Summary

- **Total Fields**: 35+ fields across 4 sections
- **Required Fields**: 24 fields must be filled (increased from 20)
- **Optional Fields**: 11+ fields are optional
- **Conditional Fields**: Some fields only appear based on other selections
- **Validation**: All fields have appropriate format and business logic validation
- **Real-time Feedback**: Users see validation errors as they type
- **Auto-save**: Form automatically saves as you type

## Key Changes Made

- **Parental Contact Information**: Father's and Mother's contact numbers and emails are now required
- **Enhanced Validation**: Added comprehensive validation for phone numbers, emails, postal codes, and business logic
- **Real-time Validation**: Users get immediate feedback on field validation
- **Better Error Messages**: Clear, helpful error messages guide users to correct input
- **Format Enforcement**: Proper input types and constraints for all fields
