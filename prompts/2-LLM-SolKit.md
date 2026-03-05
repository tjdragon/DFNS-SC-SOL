# Solana Kit

## Context

- Existing deployment using dfns/DeployProgram.ts does not work because of dfns/BpfLoaderUpgradeableProgram.ts
- I have confirmed that it is the wrong way of doing this and that we should use Solana Kit (https://www.solanakit.com/)
- We do not want to deploy using 'anchor' but we must deploy using DFNS.

## Task

- Refactor dfns/DeployProgram.ts to use Solana Kit instead
- You can test using programs/hello-world/src/lib.rs
- Remove uncessary files like dfns/BpfLoaderUpgradeableProgram.ts
- For your information declare_id! is set with 4vPYnkYUXnRN8FbxmRzaAb1MRRoJCAL1ouqpTBKRYxEa derived from the wallet paying for the deployment using the public key of that wallet
- Any question - just ask