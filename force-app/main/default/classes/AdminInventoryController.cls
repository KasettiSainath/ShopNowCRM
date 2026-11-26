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
    public static Integer updateStock(String updatesJson) {
        List<StockUpdate> updates;
        try {
            updates = (List<StockUpdate>) JSON.deserialize(updatesJson, List<StockUpdate>.class);
        } catch (Exception e) {
            throw buildError('Could not read the update request: ' + e.getMessage());
        }
        if (updates == null || updates.isEmpty()) {
            throw buildError('Nothing to update.');
        }

        List<Product_Variant__c> toUpdate = new List<Product_Variant__c>();
        for (StockUpdate u : updates) {
            if (u.variantId == null) {
                throw buildError('A row is missing its record Id.');
            }
            if (u.stock == null) {
                throw buildError('Stock value is missing for ' + u.variantId + '.');
            }
            if (u.stock < 0) {
                throw buildError('Stock cannot be negative.');
            }
            toUpdate.add(new Product_Variant__c(Id = u.variantId, Stock__c = u.stock));
        }

        SObjectAccessDecision decision = Security.stripInaccessible(AccessType.UPDATABLE, toUpdate);
        List<Product_Variant__c> safeRows = (List<Product_Variant__c>) decision.getRecords();

        try {
            update safeRows;
        } catch (DmlException e) {
            throw buildError('Save failed: ' + e.getDmlMessage(0));
        }
        return safeRows.size();
    }
    private static AuraHandledException buildError(String message) {
        AuraHandledException ex = new AuraHandledException(message);
        ex.setMessage(message);
        return ex;
    }
}