import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Test campaign creation",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;
    
    let block = chain.mineBlock([
      // Test successful campaign creation by owner
      Tx.contractCall('loop_mint', 'create-campaign', [
        types.ascii("Test Campaign"),
        types.uint(1000),
        types.uint(100)
      ], deployer.address),
      
      // Test campaign creation by non-owner (should fail)
      Tx.contractCall('loop_mint', 'create-campaign', [
        types.ascii("Failed Campaign"),
        types.uint(1000),
        types.uint(100)
      ], user1.address)
    ]);
    
    block.receipts[0].result.expectOk().expectUint(0); // First campaign ID should be 0
    block.receipts[1].result.expectErr(types.uint(100)); // err-owner-only
  }
});

Clarinet.test({
  name: "Test reward claiming",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;
    
    // Create campaign first
    let setup = chain.mineBlock([
      Tx.contractCall('loop_mint', 'create-campaign', [
        types.ascii("Test Campaign"),
        types.uint(1000),
        types.uint(100)
      ], deployer.address)
    ]);
    
    // Test claiming
    let block = chain.mineBlock([
      Tx.contractCall('loop_mint', 'claim-reward', [
        types.uint(0)
      ], user1.address)
    ]);
    
    block.receipts[0].result.expectOk().expectBool(true);
    
    // Verify claim was recorded
    let verifyBlock = chain.mineBlock([
      Tx.contractCall('loop_mint', 'get-participant-claims', [
        types.uint(0),
        types.principal(user1.address)
      ], user1.address)
    ]);
    
    verifyBlock.receipts[0].result.expectOk().expectUint(1);
  }
});

Clarinet.test({
  name: "Test campaign management",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;
    
    // Create and end campaign
    let block = chain.mineBlock([
      Tx.contractCall('loop_mint', 'create-campaign', [
        types.ascii("Test Campaign"),
        types.uint(1000),
        types.uint(100)
      ], deployer.address),
      
      Tx.contractCall('loop_mint', 'end-campaign', [
        types.uint(0)
      ], deployer.address)
    ]);
    
    block.receipts[0].result.expectOk();
    block.receipts[1].result.expectOk().expectBool(true);
    
    // Verify campaign is inactive
    let verifyBlock = chain.mineBlock([
      Tx.contractCall('loop_mint', 'get-campaign', [
        types.uint(0)
      ], user1.address)
    ]);
    
    const campaign = verifyBlock.receipts[0].result.expectOk().expectSome();
    assertEquals(campaign['active'], false);
  }
});