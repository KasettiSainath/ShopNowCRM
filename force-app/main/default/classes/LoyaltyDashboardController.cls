public with sharing class LoyaltyDashboardController {

    public class LoyaltyData {
        @AuraEnabled public Loyalty_Account__c loyaltyAccount;
        @AuraEnabled public List<Loyalty_Transaction__c> transactions;
    }

    // recordId may be: a Loyalty_Account__c Id, an Account Id, or null.
    // with sharing + OWD Private means a customer only ever gets their own record.
    @AuraEnabled
    public static LoyaltyData getLoyaltyData(Id recordId) {
        List<Loyalty_Account__c> accounts;

        if (recordId != null && recordId.getSObjectType() == Loyalty_Account__c.SObjectType) {
            accounts = [
                SELECT Id, Name, Account__c, Account__r.Name, Points__c, Tier__c,
                       Total_Spent__c, Points_Expiry__c
                FROM Loyalty_Account__c WHERE Id = :recordId LIMIT 1
            ];
        } else if (recordId != null && recordId.getSObjectType() == Account.SObjectType) {
            accounts = [
                SELECT Id, Name, Account__c, Account__r.Name, Points__c, Tier__c,
                       Total_Spent__c, Points_Expiry__c
                FROM Loyalty_Account__c WHERE Account__c = :recordId LIMIT 1
            ];
        } else {
            accounts = [
                SELECT Id, Name, Account__c, Account__r.Name, Points__c, Tier__c,
                       Total_Spent__c, Points_Expiry__c
                FROM Loyalty_Account__c ORDER BY CreatedDate LIMIT 1
            ];
        }

        if (accounts.isEmpty()) {
            return null;
        }

        LoyaltyData result = new LoyaltyData();
        result.loyaltyAccount = (Loyalty_Account__c) Security.stripInaccessible(
            AccessType.READABLE, accounts
        ).getRecords()[0];

        Id loyaltyId = result.loyaltyAccount.Id;
        List<Loyalty_Transaction__c> txns = [
            SELECT Id, Name, Type__c, Points__c, Order__c, Order__r.Name, CreatedDate
            FROM Loyalty_Transaction__c
            WHERE Loyalty_Account__c = :loyaltyId
            ORDER BY CreatedDate DESC
            LIMIT 10
        ];
        result.transactions = (List<Loyalty_Transaction__c>) Security.stripInaccessible(
            AccessType.READABLE, txns
        ).getRecords();

        return result;
    }
}