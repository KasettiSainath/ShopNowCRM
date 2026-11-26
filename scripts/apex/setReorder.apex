List<Product_Variant__c> rows = [SELECT Id FROM Product_Variant__c WHERE Reorder_Level__c = null];
for (Product_Variant__c v : rows) {
    v.Reorder_Level__c = 10;
}
update rows;