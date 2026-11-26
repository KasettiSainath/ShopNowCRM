public with sharing class ProductCatalogController {

    @AuraEnabled(cacheable=true)
    public static List<Product2> getProducts() {
        List<Product2> products = [
            SELECT Id, Name, Description, Family
            FROM Product2
            WHERE IsActive = true
            AND Id IN (SELECT Product__c FROM Product_Variant__c)
            ORDER BY Name
            LIMIT 50
        ];
        return (List<Product2>) Security.stripInaccessible(AccessType.READABLE, products).getRecords();
    }

    @AuraEnabled(cacheable=true)
    public static List<Product_Variant__c> getVariants(Id productId) {
        if (productId == null) {
            return new List<Product_Variant__c>();
        }
        List<Product_Variant__c> variants = [
            SELECT Id, Name, Size__c, Color__c, Price__c, Stock__c
            FROM Product_Variant__c
            WHERE Product__c = :productId
            ORDER BY Size__c, Color__c
        ];
        return (List<Product_Variant__c>) Security.stripInaccessible(AccessType.READABLE, variants).getRecords();
    }
}