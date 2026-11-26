import { LightningElement, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import getProducts from '@salesforce/apex/ProductCatalogController.getProducts';

export default class ProductCatalog extends LightningElement {
    cart = [];

    @wire(getProducts) products;

    get productList() {
        return this.products.data || [];
    }
    get hasError() {
        return !!this.products.error;
    }
    get showEmpty() {
        return !!this.products.data && this.products.data.length === 0;
    }
    get cartCount() {
        return this.cart.reduce((sum, i) => sum + i.quantity, 0);
    }
    get cartTotal() {
        return this.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    }
    get cartLines() {
        return this.cart.map((i) => ({
            ...i,
            label: [i.name, i.size, i.color].filter(Boolean).join(' - ')
        }));
    }
    get hasCart() {
        return this.cart.length > 0;
    }

    handleAddToCart(event) {
        const item = event.detail;
        const existing = this.cart.find((c) => c.variantId === item.variantId);
        if (existing) {
            this.cart = this.cart.map((c) =>
                c.variantId === item.variantId ? { ...c, quantity: c.quantity + 1 } : c
            );
        } else {
            this.cart = [...this.cart, { ...item }];
        }
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Added to cart',
                message: item.name,
                variant: 'success'
            })
        );
    }
}