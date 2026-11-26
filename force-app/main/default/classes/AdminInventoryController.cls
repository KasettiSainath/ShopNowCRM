public with sharing class AdminInventoryController {

    public class StockUpdate {
        @AuraEnabled public Id variantId;
        @AuraEnabled public Decimal stock;
    }

    @AuraEnabled(cacheable=true)
    public static List<Product_Variant__c> getAllVariants() {
        List<Product_Variant__c> rows = [
            SELECT Id, Name, Product__c, Product__r.Name, Size__c, Color__c,
                   Stock__c, Reorder_Level__c
            FROM Product_Variant__c
            ORDER BY Product__r.Name, Size__c, Color__c
            LIMIT 2000
        ];
        return (List<Product_Variant__c>) Security.stripInaccessible(AccessType.READABLE, rows).getRecords();
    }

    // Imperative call: saves every edited row in one transaction
    @AuraEnabled
    public static Integer updateStock(List<StockUpdate> updates) {
        if (updates == null || updates.isEmpty()) {
            throw buildError('Nothing to update.');
        }

        List<Product_Variant__c> toUpdate = new List<Product_Variant__c>();
        for (StockUpdate u : updates) {
            if (u.variantId == null || u.stock == null || u.stock < 0) {
                throw buildError('Stock must be a number of 0 or more.');
            }
            toUpdate.add(new Product_Variant__c(Id = u.variantId, Stock__c = u.stock));
        }

        // enforces field-level security: user must be able to edit Stock__c
        SObjectAccessDecision decision = Security.stripInaccessible(AccessType.UPDATABLE, toUpdate);
        List<Product_Variant__c> safeRows = (List<Product_Variant__c>) decision.getRecords();

        try {
            update safeRows;
        } catch (DmlException e) {
            throw buildError(e.getDmlMessage(0));
        }
        return safeRows.size();
    }

    private static AuraHandledException buildError(String message) {
        AuraHandledException ex = new AuraHandledException(message);
        ex.setMessage(message);
        return ex;
    }
}