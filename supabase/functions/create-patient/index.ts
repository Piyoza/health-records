
// @ts-expect-error Deno resolves npm: specifiers at runtime; local TypeScript tooling may not.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonResponse = (
  body: Record<string, unknown>,
  status: number
) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
};

declare const Deno: {
  env: any;
  serve(
    handler: (req: Request) => Response | Promise<Response>
  ): void;
};

Deno.serve(async (req) => {
  // ------------------------------------
  // 1. CORS
  // ------------------------------------

  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  // ------------------------------------
  // 2. Only POST is allowed
  // ------------------------------------

  if (req.method !== 'POST') {
    return jsonResponse(
      {
        success: false,
        error: 'Method not allowed',
      },
      405
    );
  }

  try {
    // ------------------------------------
    // 3. Get authorization token
    // ------------------------------------

    const authorization =
      req.headers.get('Authorization');

    if (!authorization) {
      return jsonResponse(
        {
          success: false,
          error: 'Authorization token is required.',
        },
        401
      );
    }

    // ------------------------------------
    // 4. Get Supabase environment variables
    // ------------------------------------

    const supabaseUrl =
      Deno.env.get('SUPABASE_URL');

    const supabaseAnonKey =
      Deno.env.get('SUPABASE_ANON_KEY');

    const supabaseServiceRoleKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl) {
      console.error(
        'SUPABASE_URL is missing'
      );

      return jsonResponse(
        {
          success: false,
          error: 'Server configuration error.',
        },
        500
      );
    }

    if (!supabaseAnonKey) {
      console.error(
        'SUPABASE_ANON_KEY is missing'
      );

      return jsonResponse(
        {
          success: false,
          error: 'Server configuration error.',
        },
        500
      );
    }

    if (!supabaseServiceRoleKey) {
      console.error(
        'SUPABASE_SERVICE_ROLE_KEY is missing'
      );

      return jsonResponse(
        {
          success: false,
          error: 'Server configuration error.',
        },
        500
      );
    }

    // ------------------------------------
    // 5. Client using the logged-in user's
    //    access token
    // ------------------------------------

    const userClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      }
    );

    // ------------------------------------
    // 6. Verify logged-in user
    // ------------------------------------

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      console.error(
        'AUTH ERROR:',
        userError?.message
      );

      return jsonResponse(
        {
          success: false,
          error:
            'Unauthorized. Please log in again.',
        },
        401
      );
    }

    console.log(
      'CREATE PATIENT USER:',
      user.id
    );

    // ------------------------------------
    // 7. Service-role client
    //
    // IMPORTANT:
    // This key stays inside the Edge Function.
    // It is NEVER sent to the React Native app.
    // ------------------------------------

    const adminClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // ------------------------------------
    // 8. Get user's profile and role
    // ------------------------------------

    const {
      data: profile,
      error: profileError,
    } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        'PROFILE ERROR:',
        profileError
      );

      return jsonResponse(
        {
          success: false,
          error:
            'Unable to verify your account permissions.',
        },
        500
      );
    }

    // ------------------------------------
    // 9. Profile must exist
    // ------------------------------------

    if (!profile) {
      console.error(
        'PROFILE NOT FOUND:',
        user.id
      );

      return jsonResponse(
        {
          success: false,
          error:
            'Your user profile could not be found.',
        },
        403
      );
    }

    const role =
      typeof profile.role === 'string'
        ? profile.role.toLowerCase().trim()
        : '';

    console.log(
      'USER ROLE:',
      role
    );

    // ------------------------------------
    // 10. ADMIN ONLY
    // ------------------------------------

    if (role !== 'admin') {
      console.warn(
        'CREATE PATIENT DENIED:',
        user.id,
        'ROLE:',
        role
      );

      return jsonResponse(
        {
          success: false,
          error:
            'Forbidden. Only administrators can create patients.',
        },
        403
      );
    }

    // ------------------------------------
    // 11. Read request body
    // ------------------------------------

    let body: Record<string, unknown>;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        {
          success: false,
          error:
            'Invalid JSON request body.',
        },
        400
      );
    }

    // ------------------------------------
    // 12. Extract fields
    // ------------------------------------

    const idNumber =
      typeof body.id_number === 'string'
        ? body.id_number.trim().replace(/\s/g, '')
        : '';

    const firstName =
      typeof body.first_name === 'string'
        ? body.first_name.trim()
        : '';

    const lastName =
      typeof body.last_name === 'string'
        ? body.last_name.trim()
        : '';

    const dateOfBirth =
      typeof body.date_of_birth === 'string' &&
      body.date_of_birth.trim()
        ? body.date_of_birth.trim()
        : null;

    const gender =
      typeof body.gender === 'string' &&
      body.gender.trim()
        ? body.gender.trim()
        : null;

    const phoneNumber =
      typeof body.phone_number === 'string' &&
      body.phone_number.trim()
        ? body.phone_number.trim()
        : null;

    const address =
      typeof body.address === 'string' &&
      body.address.trim()
        ? body.address.trim()
        : null;

    const emergencyContactName =
      typeof body.emergency_contact_name ===
        'string' &&
      body.emergency_contact_name.trim()
        ? body.emergency_contact_name.trim()
        : null;

    const emergencyContactPhone =
      typeof body.emergency_contact_phone ===
        'string' &&
      body.emergency_contact_phone.trim()
        ? body.emergency_contact_phone.trim()
        : null;

    // ------------------------------------
    // 13. Validate ID number
    // ------------------------------------

    if (!idNumber) {
      return jsonResponse(
        {
          success: false,
          error: 'ID number is required.',
        },
        400
      );
    }

    if (!/^\d{13}$/.test(idNumber)) {
      return jsonResponse(
        {
          success: false,
          error:
            'ID number must contain exactly 13 digits.',
        },
        400
      );
    }

    // ------------------------------------
    // 14. Validate first name
    // ------------------------------------

    if (!firstName) {
      return jsonResponse(
        {
          success: false,
          error: 'First name is required.',
        },
        400
      );
    }

    // ------------------------------------
    // 15. Validate last name
    // ------------------------------------

    if (!lastName) {
      return jsonResponse(
        {
          success: false,
          error: 'Last name is required.',
        },
        400
      );
    }

    // ------------------------------------
    // 16. Create patient
    // ------------------------------------

    const {
      data: patient,
      error: patientError,
    } = await adminClient
      .from('patients')
      .insert({
        id_number: idNumber,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth,
        gender,
        phone_number: phoneNumber,
        address,
        emergency_contact_name:
          emergencyContactName,
        emergency_contact_phone:
          emergencyContactPhone,
      })
      .select()
      .single();

    // ------------------------------------
    // 17. Database error
    // ------------------------------------

    if (patientError) {
      console.error(
        'CREATE PATIENT DATABASE ERROR:',
        patientError
      );

      // PostgreSQL duplicate key
      if (patientError.code === '23505') {
        return jsonResponse(
          {
            success: false,
            error:
              'A patient with this ID number already exists.',
          },
          409
        );
      }

      return jsonResponse(
        {
          success: false,
          error:
            patientError.message ||
            'Unable to create patient.',
        },
        400
      );
    }

    // ------------------------------------
    // 18. Success
    // ------------------------------------

    console.log(
      'PATIENT CREATED SUCCESSFULLY:',
      patient?.id
    );

    return jsonResponse(
      {
        success: true,
        message:
          'Patient created successfully.',
        patient,
      },
      201
    );
  } catch (error) {
    console.error(
      'CREATE PATIENT API ERROR:',
      error
    );

    return jsonResponse(
      {
        success: false,
        error:
          'An unexpected error occurred while creating the patient.',
      },
      500
    );
  }
});

