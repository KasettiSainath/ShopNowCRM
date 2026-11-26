import { LightningElement, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { subscribe, unsubscribe, APPLICATION_SCOPE, MessageContext } from 'lightning/messageService';
import CASE_CREATED from '@salesforce/messageChannel/CaseCreated__c';
import getMyCases from '@salesforce/apex/CaseSubmissionController.getMyCases';

const COLUMNS = [
    { label: 'Case', fieldName: 'CaseNumber', type: 'text', initialWidth: 110 },
    { label: 'Subject', fieldName: 'Subject', type: 'text' },
    { label: 'Order', fieldName: 'orderName', type: 'text', initialWidth: 120 },
    { label: 'Status', fieldName: 'Status', type: 'text', initialWidth: 110 },
    { label: 'Created', fieldName: 'CreatedDate', type: 'date', initialWidth: 130 }
];

export default class CaseList extends LightningElement {
    columns = COLUMNS;
    cases = [];
    error;
    wiredResult;
    subscription;

    @wire(MessageContext) messageContext;

    @wire(getMyCases)
    wiredCases(result) {
        this.wiredResult = result;
        const { data, error } = result;
        if (data) {
            this.cases = data.map((c) => ({ ...c, orderName: c.Order__r ? c.Order__r.Name : '-' }));
            this.error = undefined;
        } else if (error) {
            this.cases = [];
            this.error = error.body ? error.body.message : 'Could not load cases.';
        }
    }

    get hasCases() {
        return this.cases.length > 0;
    }

    connectedCallback() {
        // listen for CASE_CREATED published by caseSubmissionForm
        this.subscription = subscribe(
            this.messageContext,
            CASE_CREATED,
            () => this.handleCaseCreated(),
            { scope: APPLICATION_SCOPE }
        );
    }

    disconnectedCallback() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }

    handleCaseCreated() {
        refreshApex(this.wiredResult);
    }
}