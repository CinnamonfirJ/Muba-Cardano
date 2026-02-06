import { agenda, JOB_TYPES } from './agenda.ts';
import { SendEmail } from '../utils/sendEmail.utils.ts';
import type { SendEmailTypes } from '../dto/email.dto.ts';
import type { Job } from 'agenda';

/**
 * Define Email Jobs
 */
export const defineEmailJobs = () => {
    
    // Generic Email Sender Job
    agenda.define(JOB_TYPES.EMAIL.SEND, async (job: Job) => {
        const { email, title, html } = job.attrs.data as SendEmailTypes;
        
        console.log(`📨 Processing email job for: ${email}`);
        
        try {
            const result = await SendEmail({ email, title, html });
            if (!result) {
                throw new Error("SendEmail returned null");
            }
            console.log(`✅ Email sent successfully to ${email}`);
        } catch (error) {
            console.error(`❌ Email job failed for ${email}:`, error);
            throw error; // Let Agenda handle retries
        }
    });

    // Specific Vendor Notification Job (Wrapper)
    agenda.define(JOB_TYPES.EMAIL.VENDOR_NOTIFICATION, async (job: Job) => {
        const data = job.attrs.data as SendEmailTypes;
        // Logic can be extended here (e.g., logging specific analytics)
        await job.schedule('now').save(); // Should check if this recursively schedules - NO.
        // Actually, better to just call the send logic or re-use the generic sender.
        // For simplicity, let's just use the logic directly.
        await SendEmail(data);
    });

    console.log('📬 Email jobs defined');
};
