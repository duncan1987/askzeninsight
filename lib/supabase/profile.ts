'use client'

import { createClient } from './client'
import type { User } from '@supabase/supabase-js'

/**
 * Ensure the current user has a profile record.
 * Call this after successful sign-in.
 */
export async function ensureProfileExists(user: User | null) {
  if (!user) return null

  const supabase = createClient()
  if (!supabase) return null

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  // If profile exists, return it
  if (existingProfile) {
    return existingProfile
  }

  // Create profile for new user
  const metadata = user.user_metadata || {}
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email,
      full_name: metadata.full_name || metadata.name || '',
      avatar_url: metadata.avatar_url || metadata.picture || ''
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating profile:', error)
  }

  return data
}
