public with sharing class OrderTrackerController {
    public class OrderWrapper {
        @AuraEnabled public Order__c ord;
        @AuraEnabled public List<Order_Item__c> items;
    }

    @AuraEnabled(cacheable=true)
    public static List<Order__c> getMyOrders() {
        List<Order__c> orders = [
            SELECT Id, Name, Status__c, Channel__c, Total_Amount__c
            FROM Order__c
            ORDER BY CreatedDate DESC
            LIMIT 50
        ];
        return (List<Order__c>) Security.stripInaccessible(
            AccessType.READABLE,
            orders
        ).getRecords();
    }

    @AuraEnabled(cacheable=true)
    public static OrderWrapper getOrderDetails(Id orderId) {
        if (orderId == null) {
            throw new AuraHandledException('Order Id is required.');
        }

        List<Order__c> orders = [
            SELECT Id, Name, Status__c, Channel__c, Total_Amount__c, Tracking_No__c, Delivery_Date__c
            FROM Order__c
            WHERE Id = :orderId
            LIMIT 1
        ];
        if (orders.isEmpty()) {
            throw new AuraHandledException('Order not found or you do not have access.');
        }

        List<Order_Item__c> items = [
            SELECT Id, Qty__c, Unit_Price__c, Product_Variant__r.Name
            FROM Order_Item__c
            WHERE Order__c = :orderId
        ];

        OrderWrapper w = new OrderWrapper();
        w.ord = (Order__c) Security.stripInaccessible(
            AccessType.READABLE,
            orders
        ).getRecords()[0];
        w.items = (List<Order_Item__c>) Security.stripInaccessible(
            AccessType.READABLE,
            items
        ).getRecords();
        return w;
    }
}