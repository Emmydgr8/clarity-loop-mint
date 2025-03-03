import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

// [Previous tests remain unchanged]

Clarinet.test({
  name: "Test campaign deactivation and token recovery",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    // Create campaign
    let block = chain.mineBlock([
      Tx.contractCall('loop_mint', 'create-campaign', [
        types.ascii("Test Campaign"),
        types.uint(1000),
        types.uint(100),
        types.uint(3),
        types.bool(false)
      ], deployer.address)
    ]);
    
    // Deactivate campaign
    block = chain.mineBlock([
      Tx.contractCall('loop_mint', 'deactivate-campaign', [
        types.uint(0)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk(true);
    
    // Recover tokens
    block = chain.mineBlock([
      Tx.contractCall('loop_mint', 'recover-tokens', [
        types.uint(0)
      ], deployer.address)
    ]);
    block.receipts[0].result.expectOk(true);
  }
});
