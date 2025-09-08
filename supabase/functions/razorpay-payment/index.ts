import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface RazorpayOrderRequest {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
  studentId: string;
  cohortId: string;
  paymentPlan: string;
  installmentId?: string;
  semesterNumber?: number;
}

interface RazorpayPaymentVerificationRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  studentId: string;
  cohortId: string;
  amount: number;
  paymentPlan: string;
  installmentId?: string;
  semesterNumber?: number;
  paymentType?: string;
}

interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔍 [DEBUG] Edge function started');
    console.log('🔍 [DEBUG] Request method:', req.method);
    console.log(
      '🔍 [DEBUG] Request headers:',
      Object.fromEntries(req.headers.entries())
    );

    // Get the authorization header and extract user ID from JWT
    const authHeader = req.headers.get('Authorization');
    console.log('🔍 [DEBUG] Authorization header:', authHeader);

    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
        console.log('🔍 [DEBUG] Extracted user ID from JWT:', userId);
        console.log('🔍 [DEBUG] JWT payload:', payload);
      } catch (error) {
        console.log('🔍 [DEBUG] Failed to decode JWT token:', error);
        // Don't fail here, just log and continue without userId
        console.log('🔍 [DEBUG] Continuing without user ID extraction');
      }
    } else {
      console.log('🔍 [DEBUG] No authorization header found');
    }

    // Check if we have the required environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    console.log('🔍 [DEBUG] Supabase URL:', supabaseUrl);
    console.log('🔍 [DEBUG] Supabase Anon Key exists:', !!supabaseAnonKey);

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Use service role key to bypass RLS policies
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    console.log('🔍 [DEBUG] Service role key exists:', !!supabaseServiceKey);

    if (!supabaseServiceKey) {
      throw new Error('Missing Supabase service role key');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('🔍 [DEBUG] Supabase client created');

    const requestBody = await req.json();
    console.log(
      '🔍 [DEBUG] Received request body:',
      JSON.stringify(requestBody, null, 2)
    );

    const { action, ...data } = requestBody;

    console.log('🔍 [DEBUG] Action:', action);
    console.log('🔍 [DEBUG] Data:', JSON.stringify(data, null, 2));

    if (action === 'test') {
      console.log('🔍 [DEBUG] Test endpoint called');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Edge function is working',
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else if (action === 'create_order') {
      console.log('🔍 [DEBUG] Calling handleCreateOrder');
      return await handleCreateOrder(
        supabase,
        data as RazorpayOrderRequest,
        userId
      );
    } else if (action === 'verify_payment') {
      console.log('🔍 [DEBUG] Calling handleVerifyPayment');
      return await handleVerifyPayment(
        supabase,
        data as RazorpayPaymentVerificationRequest,
        userId
      );
    } else {
      console.log('🔍 [DEBUG] Invalid action:', action);
      throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Razorpay payment error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Payment processing failed',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function handleCreateOrder(
  supabase: any,
  data: RazorpayOrderRequest,
  userId: string | null
) {
  const {
    amount,
    currency,
    receipt,
    notes,
    studentId,
    cohortId,
    paymentPlan,
    installmentId,
    semesterNumber,
  } = data;

  console.log('🔍 [DEBUG] Validating fields:');
  console.log('🔍 [DEBUG] - amount:', amount, typeof amount);
  console.log('🔍 [DEBUG] - currency:', currency, typeof currency);
  console.log('🔍 [DEBUG] - receipt:', receipt, typeof receipt);
  console.log('🔍 [DEBUG] - studentId:', studentId, typeof studentId);
  console.log('🔍 [DEBUG] - cohortId:', cohortId, typeof cohortId);
  console.log('🔍 [DEBUG] - paymentPlan:', paymentPlan, typeof paymentPlan);

  // Validate required fields
  if (
    !amount ||
    !currency ||
    !receipt ||
    !studentId ||
    !cohortId ||
    !paymentPlan
  ) {
    const missingFields = [];
    if (!amount) missingFields.push('amount');
    if (!currency) missingFields.push('currency');
    if (!receipt) missingFields.push('receipt');
    if (!studentId) missingFields.push('studentId');
    if (!cohortId) missingFields.push('cohortId');
    if (!paymentPlan) missingFields.push('paymentPlan');

    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Create Razorpay order
  const orderData = {
    amount: amount * 100, // Razorpay expects amount in paise
    currency: currency,
    receipt: receipt,
    notes: {
      studentId,
      cohortId,
      paymentPlan,
      installmentId: installmentId || '',
      semesterNumber: semesterNumber?.toString() || '',
      ...notes,
    },
  };

  const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa(`${Deno.env.get('RAZORPAY_KEY_ID')}:${Deno.env.get('RAZORPAY_KEY_SECRET')}`)}`,
    },
    body: JSON.stringify(orderData),
  });

  if (!razorpayResponse.ok) {
    const errorData = await razorpayResponse.json();
    throw new Error(
      `Razorpay order creation failed: ${errorData.error?.description || 'Unknown error'}`
    );
  }

  const order: RazorpayOrderResponse = await razorpayResponse.json();

  console.log('🔍 [DEBUG] Razorpay order created successfully:', order.id);
  console.log(
    '🔍 [DEBUG] No transaction record created during order creation - will be created only after successful payment verification'
  );

  // Note: We do NOT create a payment transaction record here
  // Transaction records should only be created after successful payment verification
  // This prevents creating records for cancelled or failed payments

  return new Response(
    JSON.stringify({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        notes: order.notes,
      },
      key_id: Deno.env.get('RAZORPAY_KEY_ID'),
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleVerifyPayment(
  supabase: any,
  data: RazorpayPaymentVerificationRequest,
  userId: string | null
) {
  console.log(
    '🔍 [DEBUG] handleVerifyPayment called with data:',
    JSON.stringify(data, null, 2)
  );
  console.log('🔍 [DEBUG] Data types:', {
    razorpay_order_id: typeof data.razorpay_order_id,
    razorpay_payment_id: typeof data.razorpay_payment_id,
    razorpay_signature: typeof data.razorpay_signature,
    studentId: typeof data.studentId,
    cohortId: typeof data.cohortId,
    amount: typeof data.amount,
    paymentPlan: typeof data.paymentPlan,
    installmentId: typeof data.installmentId,
    semesterNumber: typeof data.semesterNumber,
  });

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    studentId,
    cohortId,
    amount,
    paymentPlan,
    installmentId,
    semesterNumber,
  } = data;

  console.log('🔍 [DEBUG] Extracted parameters:', {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    studentId,
    cohortId,
    amount,
    paymentPlan,
    installmentId: installmentId || 'undefined',
    semesterNumber: semesterNumber || 'undefined',
  });

  // Validate required fields
  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !studentId ||
    !cohortId ||
    !amount
  ) {
    const missingFields = [];
    if (!razorpay_order_id) missingFields.push('razorpay_order_id');
    if (!razorpay_payment_id) missingFields.push('razorpay_payment_id');
    if (!razorpay_signature) missingFields.push('razorpay_signature');
    if (!studentId) missingFields.push('studentId');
    if (!cohortId) missingFields.push('cohortId');
    if (!amount) missingFields.push('amount');

    console.log('🔍 [DEBUG] Missing required fields:', missingFields);
    throw new Error(
      `Missing required fields for payment verification: ${missingFields.join(', ')}`
    );
  }

  // Convert amount to number if it's a string
  const numericAmount =
    typeof amount === 'string' ? parseInt(amount, 10) : amount;
  console.log('🔍 [DEBUG] Amount conversion:', {
    original: amount,
    converted: numericAmount,
    type: typeof numericAmount,
  });

  if (isNaN(numericAmount)) {
    throw new Error(`Invalid amount: ${amount}`);
  }

  // Verify payment signature (with test mode support)
  try {
    // Check if this is a test payment (signature contains 'test')
    const isTestPayment =
      razorpay_signature.includes('test') ||
      razorpay_payment_id.includes('test');

    if (isTestPayment) {
      console.log(
        '🔍 [DEBUG] Test payment detected, skipping signature verification'
      );
    } else {
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const encoder = new TextEncoder();
      const key = encoder.encode(Deno.env.get('RAZORPAY_KEY_SECRET'));
      const message = encoder.encode(text);

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
      const expectedSignature = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      console.log('🔍 [DEBUG] Signature verification:', {
        expected: expectedSignature,
        received: razorpay_signature,
        text: text,
      });

      if (expectedSignature !== razorpay_signature) {
        throw new Error('Payment signature verification failed');
      }
    }
  } catch (error) {
    console.log('🔍 [DEBUG] Signature verification error:', error);
    throw new Error(`Signature verification failed: ${error.message}`);
  }

  // Get payment details from Razorpay (with test mode support)
  let paymentDetails;

  const isTestPayment = razorpay_payment_id.includes('test');

  if (isTestPayment) {
    console.log('🔍 [DEBUG] Test payment detected, using mock payment details');
    paymentDetails = {
      status: 'captured',
      amount: numericAmount * 100, // Convert to paise for consistency
    };
  } else {
    const paymentResponse = await fetch(
      `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Basic ${btoa(`${Deno.env.get('RAZORPAY_KEY_ID')}:${Deno.env.get('RAZORPAY_KEY_SECRET')}`)}`,
        },
      }
    );

    if (!paymentResponse.ok) {
      throw new Error('Failed to fetch payment details from Razorpay');
    }

    paymentDetails = await paymentResponse.json();

    // Verify payment status
    if (paymentDetails.status !== 'captured') {
      throw new Error(`Payment not captured. Status: ${paymentDetails.status}`);
    }

    // Verify amount
    const expectedAmount = numericAmount * 100; // Convert to paise
    if (paymentDetails.amount !== expectedAmount) {
      throw new Error(
        `Amount mismatch. Expected: ${expectedAmount}, Received: ${paymentDetails.amount}`
      );
    }
  }

  console.log(
    '🔍 [DEBUG] Payment verification successful, creating transaction record'
  );

  // Check if this is an application fee payment
  const isApplicationFee = data.paymentType === 'application_fee';
  console.log(
    '🔍 [DEBUG] Payment type:',
    isApplicationFee ? 'application_fee' : 'regular_payment'
  );

  let studentPaymentId: string | null = null;

  if (isApplicationFee) {
    console.log(
      '🔍 [DEBUG] Processing application fee payment - no student_payments record needed'
    );
    // For application fees, we don't need a student_payments record
    // We'll create a transaction record directly
  } else {
    // Get the student payment record ID for regular payments
    console.log('🔍 [DEBUG] Looking up student payment record for:', {
      studentId,
      cohortId,
    });

    const { data: studentPaymentData, error: studentPaymentError } =
      await supabase
        .from('student_payments')
        .select('id')
        .eq('student_id', studentId)
        .eq('cohort_id', cohortId)
        .single();

    console.log('🔍 [DEBUG] Student payment lookup result:', {
      data: studentPaymentData,
      error: studentPaymentError,
      errorMessage: studentPaymentError?.message,
    });

    if (studentPaymentError || !studentPaymentData) {
      console.log(
        '🔍 [DEBUG] Error fetching student payment record:',
        studentPaymentError
      );
      throw new Error(
        `Failed to fetch student payment record: ${studentPaymentError?.message || 'Record not found'}`
      );
    }

    studentPaymentId = studentPaymentData.id;
    console.log('🔍 [DEBUG] Found student payment ID:', studentPaymentId);
  }

  if (installmentId || semesterNumber) {
    console.log('🔍 [DEBUG] Processing installment-specific payment:', {
      installmentId,
      semesterNumber,
    });
  } else {
    console.log(
      '🔍 [DEBUG] Processing general payment (no specific installment targeted)'
    );
  }

  // Create payment transaction record only after successful payment verification
  try {
    const transactionRecord = {
      payment_id: studentPaymentId, // This will be null for application fees
      transaction_type: 'payment',
      amount: numericAmount,
      payment_method: 'razorpay',
      reference_number: razorpay_payment_id,
      status: 'success',
      notes: `Payment completed via Razorpay - Order: ${razorpay_order_id}, Payment: ${razorpay_payment_id}${installmentId ? `, Installment: ${installmentId}` : ''}${semesterNumber ? `, Semester: ${semesterNumber}` : ''}${isApplicationFee ? ', Application Fee Payment' : ''}`,
      created_by: userId || 'da1657be-92d1-4848-ac0e-0a9cb18f2933',
      verification_status: 'verification_pending',
      razorpay_order_id: razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id,
      razorpay_signature: razorpay_signature,
      payment_date: new Date().toISOString(),
      installment_id: installmentId || null,
      semester_number: semesterNumber || null,
    };

    console.log('🔍 [DEBUG] Creating transaction record:', transactionRecord);

    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .insert([transactionRecord]);

    if (transactionError) {
      console.log('🔍 [DEBUG] Transaction creation error:', transactionError);
      throw new Error(
        `Failed to create payment transaction: ${transactionError.message}`
      );
    }

    console.log('🔍 [DEBUG] Transaction record created successfully');

    // For application fees, update the student application record
    if (isApplicationFee) {
      console.log(
        '🔍 [DEBUG] Updating student application with payment details'
      );

      const { error: applicationUpdateError } = await supabase
        .from('student_applications')
        .update({
          application_fee_paid: true,
          application_fee_paid_at: new Date().toISOString(),
          application_fee_amount: numericAmount,
          status: 'registration_paid',
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', studentId);

      if (applicationUpdateError) {
        console.log(
          '🔍 [DEBUG] Application update error:',
          applicationUpdateError
        );
        throw new Error(
          `Failed to update application payment status: ${applicationUpdateError.message}`
        );
      }

      console.log('🔍 [DEBUG] Application payment status updated successfully');
    }
  } catch (error) {
    console.log('🔍 [DEBUG] Error in transaction creation:', error);
    throw error;
  }

  // Update student payment record timestamp (only for regular payments)
  if (!isApplicationFee && studentPaymentId) {
    const { error: studentPaymentUpdateError } = await supabase
      .from('student_payments')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', studentPaymentId);

    if (studentPaymentUpdateError) {
      console.warn(
        'Failed to update student payment record:',
        studentPaymentUpdateError
      );
      // Don't throw error as the main transaction was created successfully
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Payment verified successfully',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      amount: paymentDetails.amount / 100, // Convert back to rupees
      status: 'verification_pending',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
