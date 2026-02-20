import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import nodemailer from "npm:nodemailer"
import { Buffer } from "node:buffer"

// Polyfill global Buffer for nodemailer
// @ts-ignore: Deno compatibility
globalThis.Buffer = Buffer

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { to, subject, html } = await req.json()

        if (!to || !subject || !html) {
            throw new Error('Campos obrigatórios ausentes: to, subject, html.')
        }

        const transporter = nodemailer.createTransport({
            host: Deno.env.get('SMTP_HOST'),
            port: parseInt(Deno.env.get('SMTP_PORT') || '465'),
            secure: true,
            auth: {
                user: Deno.env.get('SMTP_USER'),
                pass: Deno.env.get('SMTP_PASS'),
            },
        })

        await transporter.sendMail({
            from: `Veritum PRO <${Deno.env.get('SMTP_USER')}>`,
            to,
            subject,
            html,
        })

        return new Response(JSON.stringify({ success: true, message: 'Email enviado com sucesso!' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error('SMTP Error:', error)
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
