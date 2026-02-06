import EventEmitter from 'events';

class EventBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(20); // Increase default limit
    }
}

export const eventBus = new EventBus();

export const EVENTS = {
    VENDOR: {
        REQUEST_CREATED: 'vendor:request_created',
        APPROVED: 'vendor:approved',
        REJECTED: 'vendor:rejected',
        DELIVERY_REMINDER_24H: 'vendor:delivery_reminder_24h',
        DELIVERY_REMINDER_URGENT: 'vendor:delivery_reminder_urgent'
    },
    ORDER: {
        CREATED: 'order:created',
        PAID: 'order:paid',
        CONFIRMED: 'order:confirmed',
        READY_FOR_PICKUP: 'order:ready_for_pickup',
        DELIVERED: 'order:delivered'
    }
};
