import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Test campaign creation with whitelist",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('loop_mint', 'create-campaign', [
        types.ascii("Test Campaign"),
        types.uint(1000),
        types.uint(100),
        types.uint(3), // max claims per user
        types.bool(true) // whitelist enabled
      ], deployer.address),
      
      // Test adding user to whitelist
      Tx.contractCall('loop_mint', 'add-to-whitelist', [
        types.uint(0),
        types.principal(user1.address)
      ], deployer.address)
    ]);
    
    block.receipts[0].result.expectOk().expectUint(0);
    block.receipts[1].result.expectOk().expectBool(true);
    
    // Verify whitelist status
    let verifyBlock = chain.mineBlock([
      Tx.contractCall('loop_mint', 'is-whitelisted', [
        types.uint(0),
        types.principal(user1.address)
      ], user1.address)
    ]);
    
    verifyBlock.receipts[0].result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "Test multiple reward claims",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const user1 = accounts.get('wallet_1')!;
    
    // Create campaign with 3 max claims
    let setup = chain.mineBlock([
      Tx.contractCall('loop_mint', 'create-campaign', [
        types.ascii("Test Campaign"),
        types.uint(1000),
        types.uint(100),
        types.uint(3),
        types.bool(false)
      ], deployer.address)
    ]);
    
    // Test multiple claims
    let claims = [];
    for(let i = 0; i < 4; i++) {
      claims.push(
        Tx.contractCall('loop_mint', 'claim-reward', [
          types.uint(0)
        ], user1.address)
      );
    }
    
    let block = chain.mineBlock(claims);
    
    // First 3 claims should succeed
    block.receipts[0].result.expectOk().expectBool(true);
    block.receipts[1].result.expectOk().expectBool(true);
    block.receipts[2].result.expectOk().expectBool(true);
    // 4th claim should fail
    block.receipts[3].result.expectErr(types.uint(106));
    
    // Verify claim count
    let verifyBlock = chain.mineBlock([
      Tx.contractCall('loop_mint', 'get-participant-claims', [
        types.uint(0),
        types.principal(user1.address)
      ], user1.address)
    ]);
    
    verifyBlock.receipts[0].result.expectOk().expectUint(3);
  }
});
