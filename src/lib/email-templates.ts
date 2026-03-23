/**
 * Standard Email Templates for Veritum PRO
 * Follows the premium brand style with gradient header and clean typography.
 */

interface PaymentEmailProps {
    officeName: string;
    clientName: string;
    amount: string;
    dueDate?: string;
    paymentLink: string;
    description?: string;
}

export function generatePaymentLinkEmailHtml({
    officeName,
    clientName,
    amount,
    dueDate,
    paymentLink,
    description
}: PaymentEmailProps) {
    const today = new Date().getFullYear();
    
    return `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 20px; overflow: hidden; shadow: 0 10px 30px rgba(0,0,0,0.05);">
            <!-- Header with Brand Gradient -->
            <div style="background: linear-gradient(135deg, #1bd28f 0%, #37a1f5 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">Veritum Pro</h1>
                <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Gestão de Cobrança</p>
            </div>
            
            <div style="padding: 40px 30px; background-color: white;">
                <h2 style="margin-top: 0; color: #1e293b; font-size: 22px; font-weight: 700; text-align: center;">Olá, ${clientName}</h2>
                <p style="color: #64748b; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
                    O escritório <strong>${officeName}</strong> gerou um link de pagamento para você referente aos serviços jurídicos prestados.
                </p>
                
                <!-- Payment Card -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; margin-bottom: 35px; text-align: center;">
                    <p style="margin: 0 0 10px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Valor da Cobrança</p>
                    <p style="margin: 0; font-size: 32px; font-weight: 900; color: #0f172a;">${amount}</p>
                    
                    ${dueDate ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #cbd5e1; display: inline-block; width: 80%;">
                        <p style="margin: 0; font-size: 13px; color: #475569;">Vencimento: <strong>${dueDate}</strong></p>
                    </div>
                    ` : ''}
                    
                    ${description ? `
                    <p style="margin: 15px 0 0 0; font-size: 13px; color: #64748b; font-style: italic;">
                        "${description}"
                    </p>
                    ` : ''}
                </div>
                
                <!-- Action Button -->
                <div style="text-align: center;">
                    <a href="${paymentLink}" style="display: inline-block; background-color: #10b981; color: white; padding: 18px 40px; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2); transition: all 0.3s ease;">
                        Pagar Agora
                    </a>
                </div>
                
                <p style="color: #94a3b8; font-size: 13px; text-align: center; margin-top: 40px;">
                    Se o botão acima não funcionar, copie e cole o link abaixo no seu navegador:<br>
                    <a href="${paymentLink}" style="color: #3b82f6; text-decoration: none; word-break: break-all;">${paymentLink}</a>
                </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f1f5f9; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 10px 0; color: #475569; font-size: 13px; font-weight: 700;">${officeName}</p>
                <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                    © ${today} Veritum PRO. Todos os direitos reservados.
                </p>
            </div>
        </div>
    `;
}

export function generateFintechOnboardingEmailHtml({
    officeName,
    clientName,
    onboardingUrl
}: {
    officeName: string;
    clientName: string;
    onboardingUrl: string;
}) {
    const today = new Date().getFullYear();
    
    return `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 20px; overflow: hidden; shadow: 0 10px 30px rgba(0,0,0,0.05);">
            <!-- Header with Brand Gradient -->
            <div style="background: linear-gradient(135deg, #1bd28f 0%, #37a1f5 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px;">Veritum Pro</h1>
                <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Identidade Fintech</p>
            </div>
            
            <div style="padding: 40px 30px; background-color: white;">
                <h2 style="margin-top: 0; color: #1e293b; font-size: 22px; font-weight: 700; text-align: center;">Olá, ${clientName}</h2>
                <p style="color: #64748b; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
                    O escritório <strong>${officeName}</strong> iniciou o processo de ativação da sua <strong>Identidade Fintech</strong> no Veritum PRO.
                </p>
                
                <!-- Info Card -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px; margin-bottom: 35px; text-align: center;">
                    <p style="margin: 0 0 15px 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">Status do Processo</p>
                    <p style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase;">Aguardando Documentação</p>
                    <div style="margin-top: 20px; padding: 15px; background-color: #f0f4ff; border-radius: 12px; display: inline-block;">
                        <p style="margin: 0; font-size: 13px; color: #3b82f6; font-weight: 600;">Para concluir sua ativação, você precisa enviar alguns documentos básicos através do link seguro abaixo.</p>
                    </div>
                </div>
                
                <!-- Action Button -->
                <div style="text-align: center;">
                    <a href="${onboardingUrl}" style="display: inline-block; background: linear-gradient(135deg, #1bd28f 0%, #10b981 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 14px; font-weight: 800; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2); transition: all 0.3s ease;">
                        Enviar Documentos Agora
                    </a>
                </div>
                
                <p style="color: #94a3b8; font-size: 13px; text-align: center; margin-top: 40px;">
                    Este é um ambiente seguro e criptografado.<br>
                    Se o botão acima não funcionar, copie e cole o link no seu navegador:<br>
                    <a href="${onboardingUrl}" style="color: #3b82f6; text-decoration: none; word-break: break-all;">${onboardingUrl}</a>
                </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f1f5f9; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 10px 0; color: #475569; font-size: 13px; font-weight: 700;">${officeName}</p>
                <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                    © ${today} Veritum PRO. Todos os direitos reservados.
                </p>
            </div>
        </div>
    `;
}
