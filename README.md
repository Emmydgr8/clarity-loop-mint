# LoopMint
A decentralized platform for creating and distributing rewards built on Stacks blockchain.

## Features
- Create new reward campaigns
- Set reward criteria and amounts
- Distribute rewards to eligible participants
- Track reward distribution history
- Query reward balances and eligibility
- Whitelist-based access control
- Multiple claims per user with configurable limits

## Contract Overview
The LoopMint contract allows campaign creators to set up reward distribution programs with customizable criteria. Participants can claim rewards once they meet the specified eligibility requirements.

## Usage
Campaign creators can:
- Initialize new reward campaigns
- Fund campaigns with tokens
- Set distribution parameters
- Configure maximum claims per user
- Enable/disable whitelist functionality
- Manage campaign whitelists
- End campaigns

Participants can:
- Check eligibility for rewards
- Claim available rewards (up to max claim limit)
- View reward history
- Check whitelist status

## New Features
### Whitelist Support
- Campaign creators can enable whitelist-based access control
- Add/remove participants from campaign whitelists
- Only whitelisted participants can claim rewards when enabled

### Multi-Claim Support
- Configure maximum number of claims per user
- Track claim counts per participant
- Prevent claims beyond configured limit
- Query remaining available claims
