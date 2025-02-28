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
  name: "Test invalid campaign parameters",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    let block = chain.mineBlock([
      Tx.contractCall('loop_mint', 'create-campaign', [
        types.ascii("Invalid Campaign"),
        types.uint(100),  // total amount
        types.uint(200),  // reward per claim > total
        types.uint(3),
        types.bool(false)
      ], deployer.address)
    ]);
    
    block.receipts[0].result.expectErr(types.uint(107));
  }
});

Clarinet.test({
  name: "Test creator cannot claim own rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    let setup = chain.mineBlock([
      Tx.contractCall('loop_mint', 'create-campaign', [
        types.ascii("Test Campaign"),
        types.uint(1000),
        types.uint(100),
        types.uint(3),
        types.bool(false)
      ], deployer.address)
    ]);
    
    let claim = chain.mineBlock([
      Tx.contractCall('loop_mint', 'claim-reward', [
        types.uint(0)
      ], deployer.address)
    ]);
    
    claim.receipts[0].result.expectErr(types.uint(108));
  }
});
