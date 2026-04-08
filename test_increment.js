import SupplierPurchaseRepositoryImpl from "./src/infrastructure/repositories/Purchase/SupplierPurchaseRepositoryImpl.js";

async function test() {
  const repo = new SupplierPurchaseRepositoryImpl();
  // Assume purchase 33 is branch 2
  console.log("Updating purchase 33 to ARRIVED...");
  const result = await repo.updateStatus(33, 'ARRIVED');
  console.log("Result:", result);
  process.exit();
}
test();
