import { handleSignIn } from '@logto/next/server-actions';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
import { logtoConfig } from '@/lib/logto';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const result = await handleSignIn(logtoConfig, searchParams);

  if (result && result.claims) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createServiceClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { sub: logtoId, name, picture, email } = result.claims;

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('logto_id', logtoId)
        .single();

      if (!existingProfile) {
        const { data: existingByEmail } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email || '')
          .single();

        if (existingByEmail) {
          await supabase
            .from('profiles')
            .update({
              logto_id: logtoId,
              full_name: name || '',
              avatar_url: picture || '',
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingByEmail.id);
        } else {
          await supabase.from('profiles').insert({
            id: logtoId,
            email: email || '',
            full_name: name || '',
            avatar_url: picture || '',
            logto_id: logtoId,
          });
        }
      } else {
        await supabase
          .from('profiles')
          .update({
            full_name: name || '',
            avatar_url: picture || '',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingProfile.id);
      }
    }
  }

  redirect('/');
}
