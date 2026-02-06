import { Agenda } from 'agenda';
import { dbConfig } from '../../config/index.ts';

// Connection string
const mongoConnectionString = dbConfig.uri;

// Define the agenda instance
export const agenda = new Agenda({
    db: { 
        address: mongoConnectionString as string, 
        collection: 'agendaJobs',
        options: { dbName: dbConfig.name } 
    },
    processEvery: '1 minute' // Poll every minute
} as any);

export const JOB_TYPES = {
    EMAIL: {
        SEND: 'email:send',
        VENDOR_NOTIFICATION: 'email:vendor_notification',
        DELIVERY_REMINDER: 'email:delivery_reminder'
    },
    SCHEDULE: {
        CHECK_DELIVERIES: 'schedule:check_deliveries'
    }
};

// Start agenda
export const startAgenda = async () => {
    try {
        await agenda.start();
        console.log('🚀 Agenda Job Scheduler started');
    } catch (error) {
        console.error('❌ Failed to start Agenda:', error);
    }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
    await agenda.stop();
    process.exit(0);
});
