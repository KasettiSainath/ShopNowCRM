import { LightningElement, api } from 'lwc';
import getLoyaltyData from '@salesforce/apex/LoyaltyDashboardController.getLoyaltyData';

// thresholds from the project brief
const TIERS = [
    { name: 'Silver', min: 1000 },
    { name: 'Gold', min: 5000 },
    { name: 'Platinum', min: 15000 }
];

export default class LoyaltyDashboard extends LightningElement {
    @api recordId;

    loyalty;
    transactions = [];
    error;
    isLoading = false;
    loaded = false;

    // imperative Apex call: runs on load and when Refresh is clicked
    connectedCallback() {
        this.loadData();
    }

    async loadData() {
        this.isLoading = true;
        try {
            const result = await getLoyaltyData({ recordId: this.recordId });
            this.loyalty = result ? result.loyaltyAccount : undefined;
            this.transactions = result && result.transactions ? result.transactions : [];
            this.error = undefined;
        } catch (e) {
            this.loyalty = undefined;
            this.transactions = [];
            this.error = e && e.body && e.body.message ? e.body.message : 'Could not load loyalty data.';
        } finally {
            this.isLoading = false;
            this.loaded = true;
        }
    }

    handleRefresh() {
        this.loadData();
    }

    // ---------- state flags
    get hasData() {
        return !!this.loyalty;
    }
    get showEmpty() {
        return this.loaded && !this.loyalty && !this.error;
    }

    // ---------- values
    get points() {
        return this.loyalty && this.loyalty.Points__c ? this.loyalty.Points__c : 0;
    }
    get totalSpent() {
        return this.loyalty && this.loyalty.Total_Spent__c ? this.loyalty.Total_Spent__c : 0;
    }
    get customerName() {
        return this.loyalty && this.loyalty.Account__r ? this.loyalty.Account__r.Name : '';
    }
    get tierName() {
        return this.loyalty && this.loyalty.Tier__c ? this.loyalty.Tier__c : 'Member';
    }
    get tierBadgeClass() {
        return `tier-badge ${this.tierName.toLowerCase()}`;
    }

    // ---------- expiry
    get expiryDate() {
        const d = this.loyalty && this.loyalty.Points_Expiry__c;
        return d ? new Date(`${d}T00:00:00`) : undefined;
    }
    get hasExpiry() {
        return !!this.expiryDate;
    }
    get expiryText() {
        return this.expiryDate
            ? this.expiryDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : '';
    }
    get expiringSoon() {
        if (!this.expiryDate) return false;
        const days = (this.expiryDate - new Date()) / (1000 * 60 * 60 * 24);
        return days <= 30;
    }
    get expiryClass() {
        return this.expiringSoon ? 'slds-text-color_error' : 'slds-text-color_default';
    }

    // ---------- tier progress (HTML/CSS bar)
    get progress() {
        const p = this.points;
        let floor = 0;
        let next = TIERS[0];
        for (let i = 0; i < TIERS.length; i++) {
            if (p >= TIERS[i].min) {
                floor = TIERS[i].min;
                next = TIERS[i + 1];
            }
        }
        if (!next) {
            return { pct: 100, isMax: true, message: 'Top tier reached', floor, ceiling: floor };
        }
        const pct = Math.min(100, Math.round(((p - floor) / (next.min - floor)) * 100));
        return {
            pct,
            isMax: false,
            floor,
            ceiling: next.min,
            message: `${next.min - p} points to ${next.name}`
        };
    }
    get progressMessage() {
        return this.progress.message;
    }
    get progressFloor() {
        return this.progress.floor;
    }
    get progressCeiling() {
        return this.progress.ceiling;
    }
    get showRange() {
        return !this.progress.isMax;
    }
    get barStyle() {
        return `width:${this.progress.pct}%`;
    }

    // ---------- recent transactions
    get hasTransactions() {
        return this.transactions.length > 0;
    }
    get txnRows() {
        return this.transactions.map((t) => {
            const isEarn = t.Type__c === 'Earn';
            return {
                id: t.Id,
                dateText: new Date(t.CreatedDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                }),
                orderName: t.Order__r ? t.Order__r.Name : '-',
                type: t.Type__c,
                typeClass: isEarn ? 'slds-badge slds-theme_success' : 'slds-badge slds-theme_warning',
                pointsText: `${isEarn ? '+' : '-'}${t.Points__c || 0}`,
                pointsClass: isEarn ? 'slds-text-color_success' : 'slds-text-color_error'
            };
        });
    }
}