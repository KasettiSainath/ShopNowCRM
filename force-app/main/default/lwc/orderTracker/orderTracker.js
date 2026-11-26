import { LightningElement, api, wire } from 'lwc';
import getMyOrders from '@salesforce/apex/OrderTrackerController.getMyOrders';
import getOrderDetails from '@salesforce/apex/OrderTrackerController.getOrderDetails';

const STAGES = [
    { label: 'Order Placed', icon: 'utility:cart' },
    { label: 'Processing', icon: 'utility:settings' },
    { label: 'Shipped', icon: 'utility:package' },
    { label: 'Out for Delivery', icon: 'utility:location' },
    { label: 'Delivered', icon: 'utility:check' }
];

const STATUS_ALIAS = {
    Placed: 'Order Placed',
    In_Transit: 'Shipped'
};

export default class OrderTracker extends LightningElement {
    @api recordId;
    selectedOrderId;

    get showPicker() {
        return !this.recordId;
    }

    get activeOrderId() {
        return this.recordId || this.selectedOrderId;
    }

    @wire(getMyOrders) orders;

    get orderOptions() {
        return (this.orders.data || []).map((o) => ({
            label: `${o.Name} - ${o.Status__c}`,
            value: o.Id
        }));
    }

    handleOrderChange(event) {
        this.selectedOrderId = event.detail.value;
    }

    @wire(getOrderDetails, { orderId: '$activeOrderId' }) details;

    get order() {
        return this.details && this.details.data ? this.details.data.ord : undefined;
    }

    get items() {
        return this.details && this.details.data ? this.details.data.items : [];
    }

    get hasOrder() {
        return !!this.order;
    }

    get isCancelled() {
        return this.order && this.order.Status__c === 'Cancelled';
    }

    get errorMessage() {
        const e = this.details && this.details.error;
        return e && e.body ? e.body.message : 'Something went wrong.';
    }

    get hasError() {
        return !!(this.details && this.details.error);
    }

    get steps() {
        if (!this.order) return [];

        const status = STATUS_ALIAS[this.order.Status__c] || this.order.Status__c;
        const current = STAGES.findIndex((s) => s.label === status);
        const allDone = current === STAGES.length - 1;

        return STAGES.map((s, i) => {
            const isDone = i < current || allDone;
            const isCurrent = i === current && !allDone;
            const state = isDone ? 'done' : isCurrent ? 'current' : 'pending';
            let note = '';

            if (s.label === 'Shipped' && (isDone || isCurrent) && this.order.Tracking_No__c) {
                note = `Tracking No: ${this.order.Tracking_No__c}`;
            }
            if (s.label === 'Delivered' && isDone && this.order.Delivery_Date__c) {
                note = `Delivered on ${new Date(this.order.Delivery_Date__c).toLocaleDateString('en-IN')}`;
            }

            return {
                label: s.label,
                icon: s.icon,
                cssClass: `step ${state}`,
                isDone,
                isCurrent,
                note,
                hasNote: note !== '',
                statusText: isDone ? 'Completed' : isCurrent ? 'In progress' : 'Pending'
            };
        });
    }
}