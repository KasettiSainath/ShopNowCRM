import { LightningElement, wire } from 'lwc';
import { publish, MessageContext } from 'lightning/messageService';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import CASE_CREATED from '@salesforce/messageChannel/CaseCreated__c';
import getMyOrders from '@salesforce/apex/OrderTrackerController.getMyOrders';
import submitCase from '@salesforce/apex/CaseSubmissionController.submitCase';

const CATEGORIES = [
    'Delivery Delay',
    'Damaged Product',
    'Wrong Item',
    'Refund or Return',
    'Payment Issue',
    'Other'
].map((c) => ({ label: c, value: c }));

export default class CaseSubmissionForm extends LightningElement {
    categoryOptions = CATEGORIES;
    category = '';
    orderId = '';
    description = '';
    isSubmitting = false;

    @wire(MessageContext) messageContext;
    @wire(getMyOrders) orders;

    get orderOptions() {
        const list = (this.orders.data || []).map((o) => ({
            label: `${o.Name} (${o.Status__c})`,
            value: o.Id
        }));
        return [{ label: 'No specific order', value: 'none' }, ...list];
    }

    handleChange(event) {
        this[event.target.name] = event.detail.value;
    }

    isFormValid() {
        const fields = [...this.template.querySelectorAll('.field')];
        return fields.reduce((ok, f) => {
            f.reportValidity();
            return ok && f.checkValidity();
        }, true);
    }

    async handleSubmit() {
        if (!this.isFormValid()) return;

        this.isSubmitting = true;
        try {
            const orderId = !this.orderId || this.orderId === 'none' ? null : this.orderId;
            const created = await submitCase({
                category: this.category,
                description: this.description,
                orderId
            });

            // broadcast CASE_CREATED so the case list on the page refreshes
            publish(this.messageContext, CASE_CREATED, {
                caseId: created.Id,
                caseNumber: created.CaseNumber
            });

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Complaint submitted',
                    message: `Your case number is ${created.CaseNumber}.`,
                    variant: 'success'
                })
            );
            this.category = '';
            this.orderId = '';
            this.description = '';
        } catch (e) {
            const msg = e && e.body && e.body.message ? e.body.message : 'Could not submit your complaint.';
            this.dispatchEvent(new ShowToastEvent({ title: 'Submission failed', message: msg, variant: 'error' }));
        } finally {
            this.isSubmitting = false;
        }
    }
}