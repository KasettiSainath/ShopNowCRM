import { LightningElement, api, wire } from 'lwc';
import getVariants from '@salesforce/apex/ProductCatalogController.getVariants';

export default class ProductCard extends LightningElement {
    @api productId;
    @api productName;
    @api description;

    selectedSize;
    selectedColor;
    variants = [];
    error;

    @wire(getVariants, { productId: '$productId' })
    wiredVariants({ data, error }) {
        if (data) {
            this.variants = data;
            this.error = undefined;
        } else if (error) {
            this.variants = [];
            this.error = error.body ? error.body.message : 'Could not load variants.';
        }
    }

    toOptions(values) {
        return [...new Set(values.filter(Boolean))].map((v) => ({ label: v, value: v }));
    }
    get sizeOptions() {
        return this.toOptions(this.variants.map((v) => v.Size__c));
    }
    get colorOptions() {
        const pool = this.selectedSize
            ? this.variants.filter((v) => v.Size__c === this.selectedSize)
            : this.variants;
        return this.toOptions(pool.map((v) => v.Color__c));
    }
    get hasVariants() {
        return this.variants.length > 0;
    }
    get hasSizes() {
        return this.sizeOptions.length > 0;
    }
    get hasColors() {
        return this.toOptions(this.variants.map((v) => v.Color__c)).length > 0;
    }

    handleSizeChange(event) {
        this.selectedSize = event.detail.value;
        if (!this.colorOptions.some((o) => o.value === this.selectedColor)) {
            this.selectedColor = undefined;
        }
    }
    handleColorChange(event) {
        this.selectedColor = event.detail.value;
    }

    get selectedVariant() {
        if (!this.hasVariants) return undefined;
        if (this.hasSizes && !this.selectedSize) return undefined;
        if (this.hasColors && !this.selectedColor) return undefined;
        return this.variants.find(
            (v) =>
                (!this.hasSizes || v.Size__c === this.selectedSize) &&
                (!this.hasColors || v.Color__c === this.selectedColor)
        );
    }
    get isSelectionComplete() {
        return (!this.hasSizes || !!this.selectedSize) && (!this.hasColors || !!this.selectedColor);
    }
    get noMatch() {
        return this.isSelectionComplete && !this.selectedVariant;
    }
    get price() {
        return this.selectedVariant ? this.selectedVariant.Price__c : undefined;
    }
    get stockText() {
        const v = this.selectedVariant;
        if (!v) return '';
        if (!(v.Stock__c > 0)) return 'Out of stock';
        if (v.Stock__c < 10) return `Only ${v.Stock__c} left`;
        return 'In stock';
    }
    get stockClass() {
        const v = this.selectedVariant;
        if (!v || !(v.Stock__c > 0)) return 'slds-text-color_error';
        return v.Stock__c < 10 ? 'slds-text-color_weak' : 'slds-text-color_success';
    }
    get disableAdd() {
        const v = this.selectedVariant;
        return !v || !(v.Stock__c > 0);
    }

    handleAddToCart() {
        const v = this.selectedVariant;
        if (!v) return;
        this.dispatchEvent(
            new CustomEvent('addtocart', {
                detail: {
                    productId: this.productId,
                    variantId: v.Id,
                    name: this.productName,
                    size: v.Size__c,
                    color: v.Color__c,
                    price: v.Price__c,
                    quantity: 1
                }
            })
        );
    }
}