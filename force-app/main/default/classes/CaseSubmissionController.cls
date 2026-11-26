public with sharing class CaseSubmissionController {

    @AuraEnabled
    public static Case submitCase(String category, String description, Id orderId) {
        if (String.isBlank(category) || String.isBlank(description)) {
            throw buildError('Category and description are required.');
        }

        Case c = new Case(
            Origin = 'Web',
            Subject = category + ' - customer complaint',
            Description = description,
            Category__c = category,
            Order__c = orderId
        );

        // link the case to the customer who owns the order
        if (orderId != null) {
            List<Order__c> ord = [SELECT Account__c FROM Order__c WHERE Id = :orderId LIMIT 1];
            if (!ord.isEmpty()) {
                c.AccountId = ord[0].Account__c;
            }
        }

        SObjectAccessDecision decision = Security.stripInaccessible(
            AccessType.CREATABLE, new List<Case>{ c }
        );
        Case safeCase = (Case) decision.getRecords()[0];

        try {
            insert safeCase;
        } catch (DmlException e) {
            throw buildError(e.getDmlMessage(0));
        }
        return [SELECT Id, CaseNumber FROM Case WHERE Id = :safeCase.Id];
    }

    @AuraEnabled(cacheable=true)
    public static List<Case> getMyCases() {
        List<Case> rows = [
            SELECT Id, CaseNumber, Subject, Status, Priority, Category__c,
                   Order__r.Name, CreatedDate
            FROM Case
            WHERE CreatedById = :UserInfo.getUserId()
            ORDER BY CreatedDate DESC
            LIMIT 20
        ];
        return (List<Case>) Security.stripInaccessible(AccessType.READABLE, rows).getRecords();
    }

    private static AuraHandledException buildError(String message) {
        AuraHandledException ex = new AuraHandledException(message);
        ex.setMessage(message);
        return ex;
    }
}