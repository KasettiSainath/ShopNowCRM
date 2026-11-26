import { LightningElement, wire } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getAllVariants from '@salesforce/apex/AdminInventoryController.getAllVariants';
import updateStock from '@salesforce/apex/AdminInventoryController.updateStock';

const COLUMNS = [
    { label: 'Product', fieldName: 'productName', type: 'text' },
    { label: 'Size', fieldName: 'Size__c', type: 'text', initialWidth: 90 },
    { label: 'Color', fieldName: 'Color__c', type: 'text' },
    {
        label: 'Stock',
        fieldName: 'Stock__c',
        type: 'number',
        editable: true,
        cellAttributes: { alignment: 'left', class: { fieldName: 'stockClass' } }
    },
    { label: 'Reorder Level', fieldName: 'Reorder_Level__c', type: 'number', cellAttributes: { alignment: 'left' } },
    { label: 'Level', fieldName: 'levelLabel', type: 'text', initialWidth: 110 }
];

// red < 10, yellow < 50, green >= 50
function stockLevel(stock) {
    const s = stock || 0;
    if (s < 10) return { cls: 'slds-theme_error', label: 'Low' };
    if (s < 50) return { cls: 'slds-theme_warning', label: 'Medium' };
    return { cls: 'slds-theme_success', label: 'Healthy' };
}

export default class AdminInventoryPanel extends LightningElement {
    columns = COLUMNS;
    rows = [];
    draftValues = [];
    searchKey = '';
    error;
    isSaving = false;
    wiredResult;

    @wire(getAllVariants)
    wiredVariants(result) {
        this.wiredResult = result;
        const { data, error } = result;
        if (data) {
            this.rows = data.map((r) => {
                const lvl = stockLevel(r.Stock__c);
                return {
                    ...r,
                    productName: r.Product__r ? r.Product__r.Name : '',
                    stockClass: lvl.cls,
                    levelLabel: lvl.label
                };
            });
            this.error = undefined;
        } else if (error) {
            this.rows = [];
            this.error = error.body ? error.body.message : 'Could not load inventory.';
        }
    }

    get filteredRows() {
        const key = this.searchKey.trim().toLowerCase();
        if (!key) return this.rows;
        return this.rows.filter((r) =>
            [r.productName, r.Size__c, r.Color__c].some((v) => v && v.toLowerCase().includes(key))
        );
    }
    get hasRows() {
        return this.filteredRows.length > 0;
    }

    handleSearch(event) {
        this.searchKey = event.target.value || '';
    }

    async handleSave(event) {
        const updates = event.detail.draftValues.map((d) => ({
            variantId: d.Id,
            stock: Number(d.Stock__c)
        }));

        if (updates.some((u) => Number.isNaN(u.stock) || u.stock < 0)) {
            this.toast('Invalid stock', 'Stock must be a number of 0 or more.', 'error');
            return;
        }

        this.isSaving = true;
        try {
            const count = await updateStock({ updates });
            this.toast('Inventory updated', `${count} variant(s) saved.`, 'success');
            this.draftValues = [];
            await refreshApex(this.wiredResult);
        } catch (e) {
            const msg = e && e.body && e.body.message ? e.body.message : 'Update failed.';
            this.toast('Could not save', msg, 'error');
        } finally {
            this.isSaving = false;
        }
    }

    toast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}