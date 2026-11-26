List<Product2> prods = new List<Product2>{
    new Product2(Name = 'Classic Cotton T-Shirt', IsActive = true, Description = '100% cotton, regular fit'),
    new Product2(Name = 'Running Shoes', IsActive = true, Description = 'Lightweight everyday trainers'),
    new Product2(Name = 'Denim Jacket', IsActive = true, Description = 'Mid-weight denim')
};
insert prods;

List<Product_Variant__c> vars = new List<Product_Variant__c>();
for (Product2 p : prods) {
    for (String s : new List<String>{ 'S', 'M', 'L' }) {
        for (String c : new List<String>{ 'Black', 'Blue' }) {
            vars.add(new Product_Variant__c(
                Name = p.Name + ' ' + s + ' ' + c,
                Product__c = p.Id,
                Size__c = s,
                Color__c = c,
                Price__c = 999,
                Stock__c = 25
            ));
        }
    }
}
vars[0].Stock__c = 0;   // to test "Out of stock"
vars[1].Stock__c = 5;   // to test "Only 5 left"
insert vars;