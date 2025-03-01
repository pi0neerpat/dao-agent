import { config } from 'dotenv';
config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

export async function getOrCreateUser(telegramId, username = null) {
    const { data, error } = await supabase
        .from('telegram_users')
        .select()
        .eq('id', telegramId)
        .single();

    if (error && error.code === 'PGRST116') {
        // User doesn't exist, create new user
        const { data: newUser, error: createError } = await supabase
            .from('telegram_users')
            .insert([{
                id: telegramId,
                username: username
            }])
            .select()
            .single();

        if (createError) throw createError;
        return newUser;
    }

    if (!error && username && data.username !== username) {
        // Update username if changed
        const { data: updatedUser, error: updateError } = await supabase
            .from('telegram_users')
            .update({ username: username })
            .eq('id', telegramId)
            .select()
            .single();

        if (updateError) throw updateError;
        return updatedUser;
    }

    if (error) throw error;
    return data;
}

export async function createSession(telegramId) {
    const { data, error } = await supabase
        .from('telegram_sessions')
        .insert([{
            user_id: telegramId,
            current_pair: 0,
            answers: [],
            is_complete: false
        }])
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateSession(sessionId, updates) {
    const { data, error } = await supabase
        .from('telegram_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getActiveSession(telegramId) {
    try {
        // First try to get the most recent incomplete session
        const { data: activeSession, error: activeError } = await supabase
            .from('telegram_sessions')
            .select()
            .eq('user_id', telegramId)
            .eq('is_complete', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // If no active session found, check if we have any session at all
        if (activeError && activeError.code === 'PGRST116') {
            console.log(`No active session found for user ${telegramId}`);
            return null;
        }

        if (activeError) {
            console.error('Error fetching session:', activeError);
            throw activeError;
        }

        return activeSession;
    } catch (error) {
        console.error('Error in getActiveSession:', error);
        throw error;
    }
}

export async function updateUserPersona(telegramId, persona, walletAddress = null) {
    const { data, error } = await supabase
        .from('telegram_users')
        .update({
            persona,
            wallet_address: walletAddress,
            updated_at: new Date()
        })
        .eq('id', telegramId)
        .select()
        .single();

    if (error) throw error;
    return data;
}
