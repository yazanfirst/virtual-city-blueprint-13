import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - no authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with the user's JWT to verify identity
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // User client to verify the requesting user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Failed to get user:', userError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`Processing account deletion for user: ${userId}`);

    // Create admin client with service role to delete the auth user
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Delete storage files in user's folder
    try {
      console.log(`Deleting storage files for user: ${userId}`);
      
      // List all files in user's folder
      const { data: userFiles, error: listError } = await adminClient.storage
        .from('shop-logos')
        .list(userId);

      if (listError) {
        console.error('Error listing user files:', listError.message);
      } else if (userFiles && userFiles.length > 0) {
        // Delete all files in user's folder (including subfolders like items/, texture-)
        const filesToDelete = userFiles.map(file => `${userId}/${file.name}`);
        
        // Also check for nested folders
        for (const file of userFiles) {
          if (file.metadata === null) {
            // This is a folder, list its contents
            const { data: nestedFiles } = await adminClient.storage
              .from('shop-logos')
              .list(`${userId}/${file.name}`);
            
            if (nestedFiles && nestedFiles.length > 0) {
              nestedFiles.forEach(nested => {
                filesToDelete.push(`${userId}/${file.name}/${nested.name}`);
              });
            }
          }
        }

        if (filesToDelete.length > 0) {
          const { error: deleteFilesError } = await adminClient.storage
            .from('shop-logos')
            .remove(filesToDelete);

          if (deleteFilesError) {
            console.error('Error deleting user files:', deleteFilesError.message);
          } else {
            console.log(`Deleted ${filesToDelete.length} storage files for user: ${userId}`);
          }
        }
      }

      // Also delete avatar files (both new folder format and legacy format)
      const { error: avatarDeleteError } = await adminClient.storage
        .from('shop-logos')
        .remove([
          `${userId}/avatar.png`, 
          `${userId}/avatar.jpg`, 
          `${userId}/avatar.jpeg`, 
          `${userId}/avatar.webp`,
          // Legacy format cleanup
          `${userId}-avatar.png`, 
          `${userId}-avatar.jpg`, 
          `${userId}-avatar.jpeg`, 
          `${userId}-avatar.webp`
        ]);

      if (avatarDeleteError) {
        console.log('No avatar files to delete or error:', avatarDeleteError.message);
      }
    } catch (storageError) {
      console.error('Storage cleanup error:', storageError);
      // Continue with account deletion even if storage cleanup fails
    }

    // Delete profile data (cascades to related data via FK constraints)
    const { error: profileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError.message);
      // Continue anyway - the auth user deletion is more important
    }

    // Delete user roles
    const { error: rolesError } = await adminClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (rolesError) {
      console.error('Error deleting user roles:', rolesError.message);
      // Continue anyway
    }

    // Delete the auth user using admin API
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to delete account', details: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully deleted account for user: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Account successfully deleted' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unexpected error in delete-account:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
