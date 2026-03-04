import { SupabaseClient } from '@supabase/supabase-js';

export interface SendEmailPayload {
    to: string;
    subject: string;
    html: string;
    fullName: string;
    scenario?: 'sales' | 'support' | 'general' | 'finance';
}

/**
 * Utility function to send emails via Supabase Edge Function 'send-email'.
 * This centralization ensures all outbound emails follow the same infrastructure.
 * 
 * @param supabase An authenticated Supabase client instance (Client or Server).
 * @param payload The email data payload containing the destination, subject, and content.
 * @returns Successful operation boolean and potential error messages.
 */
export async function sendEmail(
    supabase: SupabaseClient<any, 'public', any>,
    payload: SendEmailPayload
) {
    try {
        const { data, error } = await supabase.functions.invoke('send-email', {
            body: payload
        });

        if (error) {
            console.error('[sendEmail Helper] Error invoking send-email edge function:', error);
            return { success: false, error };
        }

        if (!data?.success) {
            console.error('[sendEmail Helper] Edge function returned controlled error:', data?.error);
            return { success: false, error: data?.error };
        }

        return { success: true, data };
    } catch (err) {
        console.error('[sendEmail Helper] Unexpected error during send-email invocation:', err);
        return { success: false, error: err };
    }
}
