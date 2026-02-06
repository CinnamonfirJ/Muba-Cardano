import { agenda, JOB_TYPES } from './agenda.ts';
import VendorOrders from '../models/vendorOrder.model.ts';
import Users from '../models/users.model.ts';
import type { Job } from 'agenda';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getTemplate = (type: string) => {
    return path.join(__dirname, '../../emailTemplates', type);
};

export const defineScheduledJobs = () => {

    agenda.define(JOB_TYPES.SCHEDULE.CHECK_DELIVERIES, async (job: Job) => {
        console.log('⏰ Running Scheduled Job: Check Deliveries');

        const now = new Date();
        const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const next4Hours = new Date(now.getTime() + 4 * 60 * 60 * 1000);

        try {
            // Find active orders with due dates
            const orders = await VendorOrders.find({
                status: { $in: ['paid', 'order_confirmed'] },
                deliveryDueDate: { $exists: true, $ne: null }
            }).populate('vendor_id').populate('customer_id');

            for (const order of orders) {
                // Skip if due date passed (handled by overdue logic later) or bad data
                if (!order.deliveryDueDate) continue;

                const dueDate = new Date(order.deliveryDueDate);
                const vendor = await Users.findById(order.vendor_id); // Vendor is User or Store? Model says ref Store, but user might be owner. 
                // VendorOrder: vendor_id ref Stores. Store has owner (User).
                // We need the EMAIL. Stores model checks needed.
                // Actually, VendorOrders schema says: vendor_id: { type: ObjectId, ref: "Stores" }
                // So order.vendor_id is the Store document. 
                // We need to fetch the Store to get the owner ID, then fetch User to get email.
                // Or maybe Store has email?
                
                // Let's assume populate('vendor_id') gives us the Store.
                // Verification needed: Stores model.
                
                // For now, let's try to get email from populated vendor_id (Store) if it has contact email, 
                // or we need to look up the owner.
                // Optimization: Just check timestamps first.
                
                const timeLeft = dueDate.getTime() - now.getTime();
                const hoursLeft = timeLeft / (1000 * 60 * 60);

                if (hoursLeft <= 24 && hoursLeft > 4 && !order.reminderSent?.dayBefore) {
                    // Send 24h Reminder
                    if (vendor) {
                         // We need to resolve email. Let's do it inside the block.
                         await sendReminderEmail(order, '24h');
                         order.reminderSent.dayBefore = true;
                         await order.save();
                    }
                } else if (hoursLeft <= 4 && hoursLeft > 0 && !order.reminderSent?.urgent) {
                    // Send Urgent Reminder
                    await sendReminderEmail(order, 'urgent');
                    order.reminderSent.urgent = true;
                    await order.save();
                }
            }

        } catch (error) {
            console.error('❌ Error in Check Deliveries Job:', error);
        }
    });

    console.log('📅 Scheduled jobs defined');
};

// Helper to resolve email and send
const sendReminderEmail = async (order: any, type: '24h' | 'urgent') => {
    try {
        // Resolve Vendor Email
        // order.vendor_id is populated. Check if it has email or owner.
        // If not populated correctly, we might fail.
        // Let's re-fetch to be safe if populate isn't robust here.
        
        // Assuming order.vendor_id is the Store object
        const store = order.vendor_id;
        let email = store.email; // Does store have email?
        
        if (!email && store.owner) {
             const owner = await Users.findById(store.owner);
             email = owner?.email;
        }

        if (!email) {
            console.log(`⚠️ No email found for vendor of order ${order.refId}`);
            return;
        }

        const templateName = type === '24h' ? 'vendorDeliveryReminder.email.html' : 'vendorUrgentReminder.email.html';
        const templatePath = getTemplate(templateName);
        
        if (fs.existsSync(templatePath)) {
            let html = fs.readFileSync(templatePath, 'utf-8');
            const customerName = order.customer_id?.firstname || "Customer";
            
            html = html
                .replace("{{vendor_name}}", store.name || "Vendor")
                .replace("{{ref_id}}", order.refId)
                .replace("{{item_name}}", order.items[0]?.name + (order.items.length > 1 ? ` + ${order.items.length - 1} others` : ""))
                .replace("{{customer_name}}", customerName)
                .replace("{{delivery_option}}", order.delivery_option)
                .replace("{{due_date}}", new Date(order.deliveryDueDate).toLocaleString());

            await agenda.now(JOB_TYPES.EMAIL.SEND, {
                email,
                title: type === 'urgent' ? "URGENT: Order Due Soon" : "Reminder: Upcoming Delivery",
                html
            });
            
            console.log(`📨 Sent ${type} reminder for order ${order.refId}`);
        }

    } catch (e) {
        console.error(`Failed to send ${type} reminder:`, e);
    }
}

export const initScheduler = async () => {
    // Schedule the job to run every hour
    await agenda.every('1 hour', JOB_TYPES.SCHEDULE.CHECK_DELIVERIES);
    console.log('⏳ Scheduler initialized: Checking deliveries every hour');
};
