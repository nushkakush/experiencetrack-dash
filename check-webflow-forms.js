// Script to check Webflow form fields and identify unmapped fields
import https from 'https';

// Use the same API endpoint as our service
const API_URL =
  'https://ghmpaghyasyllfvamfna.supabase.co/functions/v1/webflow-api';
const API_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdobXBhZ2h5YXN5bGxmdmFtZm5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NTI0NDgsImV4cCI6MjA3MDIyODQ0OH0.qhWHU-KkdpvfOTG-ROxf1BMTUlah2xDYJean69hhyH4';

// Function to make API request
function makeRequest(action, additionalData = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      action,
      ...additionalData,
    });

    const options = {
      hostname: 'ghmpaghyasyllfvamfna.supabase.co',
      port: 443,
      path: '/functions/v1/webflow-api',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Function to analyze form fields
function analyzeFormFields(submissions, formName) {
  if (submissions.length === 0) {
    console.log(`\n📝 Form: ${formName}`);
    console.log('='.repeat(50));
    console.log('No submissions found for this form.\n');
    return;
  }

  console.log(`\n📝 Form: ${formName}`);
  console.log('='.repeat(50));
  console.log(`📊 Total submissions: ${submissions.length}`);

  // Analyze the first submission to see all available fields
  const firstSubmission = submissions[0];
  const fieldNames = Object.keys(firstSubmission.formResponse || {});

  console.log(`\n🔍 Available fields (${fieldNames.length} total):`);
  fieldNames.forEach((fieldName, index) => {
    const value = firstSubmission.formResponse[fieldName];
    const valueType = typeof value;
    const valuePreview =
      valueType === 'string' && value.length > 50
        ? value.substring(0, 50) + '...'
        : value;

    console.log(
      `  ${index + 1}. ${fieldName}: ${valueType} = "${valuePreview}"`
    );
  });

  // Check for UTM parameters specifically
  console.log('\n🎯 UTM Parameters found:');
  const utmFields = fieldNames.filter(
    name =>
      name.toLowerCase().includes('utm') ||
      name.toLowerCase().includes('source') ||
      name.toLowerCase().includes('medium') ||
      name.toLowerCase().includes('campaign') ||
      name.toLowerCase().includes('term') ||
      name.toLowerCase().includes('content') ||
      name.toLowerCase().includes('referrer') ||
      name.toLowerCase().includes('referer')
  );

  if (utmFields.length > 0) {
    utmFields.forEach(field => {
      console.log(`  ✅ ${field}: "${firstSubmission.formResponse[field]}"`);
    });
  } else {
    console.log('  ❌ No UTM parameters found in this form.');
  }

  // Check for other common tracking fields
  console.log('\n🔍 Other tracking/metadata fields:');
  const trackingFields = fieldNames.filter(
    name =>
      name.toLowerCase().includes('user_agent') ||
      name.toLowerCase().includes('ip') ||
      name.toLowerCase().includes('timestamp') ||
      name.toLowerCase().includes('page') ||
      name.toLowerCase().includes('url') ||
      name.toLowerCase().includes('form') ||
      name.toLowerCase().includes('submitted') ||
      name.toLowerCase().includes('date') ||
      name.toLowerCase().includes('time') ||
      name.toLowerCase().includes('browser') ||
      name.toLowerCase().includes('device') ||
      name.toLowerCase().includes('platform') ||
      name.toLowerCase().includes('os')
  );

  if (trackingFields.length > 0) {
    trackingFields.forEach(field => {
      console.log(`  ✅ ${field}: "${firstSubmission.formResponse[field]}"`);
    });
  } else {
    console.log('  ❌ No additional tracking fields found.');
  }

  // Check for fields we're currently mapping
  console.log('\n📋 Currently mapped fields:');
  const mappedFields = [
    'First Name',
    'name',
    'First-Name',
    'first-name',
    'firstName',
    'Email',
    'email',
    'Phone',
    'phone',
    'phone-number',
    'phoneNumber',
    'Age',
    'age',
    'You are currently a',
    'i-am-a',
    'professionalStatus',
    'professional_status',
    'professional-status',
    'occupation',
    'role',
    'relocate-intent',
    'relocationPossible',
    'relocation_possible',
    'relocation-possible',
    'relocation',
    'time-intent',
    'investmentWilling',
    'investment_willing',
    'investment-willing',
    'investment',
    'budget',
    'Career-Goals',
    'careerGoals',
    'career_goals',
    'career-goals',
    'goals',
    'objectives',
    'gender',
    'Gender',
    'location',
    'Location',
    'city',
    'address',
    'dob',
    'DoB',
    'date-of-birth',
    'dateOfBirth',
    'birthday',
  ];

  const currentlyMapped = fieldNames.filter(name =>
    mappedFields.some(
      mapped =>
        name.toLowerCase() === mapped.toLowerCase() ||
        name.toLowerCase().includes(mapped.toLowerCase()) ||
        mapped.toLowerCase().includes(name.toLowerCase())
    )
  );

  currentlyMapped.forEach(field => {
    console.log(`  ✅ ${field}: "${firstSubmission.formResponse[field]}"`);
  });

  // Check for unmapped fields
  console.log('\n❓ Unmapped fields (potential new data):');
  const unmappedFields = fieldNames.filter(
    name =>
      !mappedFields.some(
        mapped =>
          name.toLowerCase() === mapped.toLowerCase() ||
          name.toLowerCase().includes(mapped.toLowerCase()) ||
          mapped.toLowerCase().includes(name.toLowerCase())
      ) &&
      !utmFields.includes(name) &&
      !trackingFields.includes(name)
  );

  if (unmappedFields.length > 0) {
    unmappedFields.forEach(field => {
      console.log(`  ❓ ${field}: "${firstSubmission.formResponse[field]}"`);
    });
  } else {
    console.log('  ✅ All fields are currently mapped or are tracking fields.');
  }

  console.log('\n');
}

// Main function
async function checkWebflowForms() {
  try {
    console.log('🔍 Fetching Webflow forms and submissions...\n');

    // Get all forms
    const formsResponse = await makeRequest('getForms');
    const forms = formsResponse.forms || [];

    console.log('📋 Available Forms:');
    forms.forEach((form, index) => {
      console.log(`${index + 1}. ${form.displayName} (ID: ${form.id})`);
    });
    console.log('');

    // Get submissions for each form
    for (const form of forms) {
      try {
        const submissionsResponse = await makeRequest('getFormSubmissions', {
          formId: form.id,
          limit: 10, // Just get a few samples
        });

        const submissions = submissionsResponse.submissions || [];
        analyzeFormFields(submissions, form.displayName);
      } catch (error) {
        console.log(
          `❌ Error fetching submissions for form ${form.displayName}:`,
          error.message
        );
      }
    }

    console.log('\n🎯 Summary:');
    console.log(
      '- Check the "Unmapped fields" sections above for potential new data to capture'
    );
    console.log(
      '- UTM parameters can be useful for tracking marketing campaigns'
    );
    console.log(
      '- Additional tracking fields might provide valuable analytics data'
    );
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the check
checkWebflowForms();
