import { eventBus, EVENTS } from '../eventBus.ts';
import { agenda, JOB_TYPES } from '../../queue/agenda.ts';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Pre-load templates or load on demand
const getTemplate = (type: string) => {
    // Navigate up from src/events/handlers to src/emailTemplates
    return path.join(__dirname, '../../../emailTemplates', type);
};

/**
 * Vendor Request Handler
 * Triggered when a user requests to become a vendor
 */
eventBus.on(EVENTS.VENDOR.REQUEST_CREATED, async (data: any) => {
    console.log(`🔔 Event received: ${EVENTS.VENDOR.REQUEST_CREATED}`, data.email);
    
    const { firstname, email, matric_number, department, faculty, valid_id, picture, cac, adminEmail } = data;

    try {
        // 1. Applicant Confirmation Email
        const applicantTemplatePath = getTemplate('vendorRequest.email.html');
        if (fs.existsSync(applicantTemplatePath)) {
            const template = fs.readFileSync(applicantTemplatePath, 'utf-8');
            const html = template.replace("{{vendor_name}}", firstname);
            
            await agenda.now(JOB_TYPES.EMAIL.SEND, {
                email,
                title: "Vendor Application Received",
                html
            });
        }

        // 2. Admin Notification Email
        if (adminEmail) {
            const adminTemplatePath = getTemplate('vendorApplicationAdmin.email.html');
            if (fs.existsSync(adminTemplatePath)) {
                let html = fs.readFileSync(adminTemplatePath, 'utf-8');

                const cacSection = cac 
                    ? `<a href="${cac}" class="button">View CAC</a>`
                    : "";

                html = html
                    .replace("{{firstname}}", firstname)
                    .replace("{{email}}", email)
                    .replace("{{matric_number}}", matric_number)
                    .replace("{{department}}", department || "N/A")
                    .replace("{{faculty}}", faculty || "N/A")
                    .replace("{{valid_id_url}}", valid_id)
                    .replace("{{picture_url}}", picture)
                    .replace("{{cac_section}}", cacSection);

                await agenda.now(JOB_TYPES.EMAIL.SEND, {
                    email: adminEmail,
                    title: "New Vendor Application Submitted",
                    html
                });
            }
        }

    } catch (error) {
        console.error('Error handling vendor request event:', error);
    }
});

console.log('🎧 Vendor handlers initialized');
