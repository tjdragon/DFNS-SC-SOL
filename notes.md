# SOLANA X-Border Payment

## Syncs the keys from JSON with the lib.rs
```bash
anchor keys sync
```

## DFNS Sender Details:
- Address: GidScLu4wK5JJ3CUFRbCPeKbyrMf7SLc2nCTCuoNRqqS
- Wallet: wa-01jip-s9pis-e1kph66br1k8e5ja

## DFNS Receiver Details
- Address: 4vPYnkYUXnRN8FbxmRzaAb1MRRoJCAL1ouqpTBKRYxEa
- Wallet: wa-01jis-rp3bq-e45rrptg0krgspdi

## Stable Coins
- tEUR Stable Coin: (H4WRimGyS4iXaybe87HKuE3ZWRuFvMonUr5STNWXTBUN) https://explorer.solana.com/address/H4WRimGyS4iXaybe87HKuE3ZWRuFvMonUr5STNWXTBUN?cluster=devnet
- tSGD Stable Coin: (8iRgQcRDqMWyHRyWzDUGPHkJmveGpDeRnWMCvji6Noqw) https://explorer.solana.com/address/8iRgQcRDqMWyHRyWzDUGPHkJmveGpDeRnWMCvji6Noqw?cluster=devnet

## Minting to GidScLu4wK5JJ3CUFRbCPeKbyrMf7SLc2nCTCuoNRqqS:
https://explorer.solana.com/tx/4hvs3uTThVUpdxAk6av8LfU54e4W7xHoy1HpTXAPVZhxCpEhUxWJXA4khbiDtxyUdKdYdU4yqSA9Q1Mrtj9HMYef?cluster=devnet
https://explorer.solana.com/address/GidScLu4wK5JJ3CUFRbCPeKbyrMf7SLc2nCTCuoNRqqS/tokens?cluster=devnet

## Hello World Program
- https://explorer.solana.com/address/Bfvo1MWybSGRUy39txvBCdDt22LRzsi8jzv2VfpLw5KQ?cluster=devnet

## Cross Border Payment Program
- https://explorer.solana.com/address/CEMoNh21BbxrVdPM6N9xwpqFHD8dxAFkBscZqPEdfrbe?cluster=devnet 

## Init Payment
```bash
npx tsx dfns/InitPayment.ts 3 4vPYnkYUXnRN8FbxmRzaAb1MRRoJCAL1ouqpTBKRYxEa 50000
```

Output:
```text
Initializing Payment PDA: D71N3p2mf5UdcUCzpQbby3VzWa6rHeDQmPnau4xeyFyE
Broadcasting transaction via DFNS (Wallet: wa-01jip-s9pis-e1kph66br1k8e5ja)...
DFNS Broadcast Result: {
  "id": "tx-01jiv-c7it0-ermbukibs4ji5166",
  "walletId": "wa-01jip-s9pis-e1kph66br1k8e5ja",
  "network": "SolanaDevnet",
  "requester": {
    "userId": "us-01jis-dgc46-echrkuqd141e34ps"
  },
  "requestBody": {
    "kind": "Transaction",
    "transaction": "010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000305e989525794235dbe31ae6e15551b307bf37fcb9c20ccabc007befe05e16ec709b3d6236829b41092bf946a226e56fc73843ca01b0d0731a7ceeca065b60975e500000000000000000000000000000000000000000000000000000000000000003a4056bf6ff6e00daa5a69fab8aea7dfb4530af4e444aa87df6a8f9ef60c7de7a6dc9ff53460a1d7477688539a507524b285a255840acda4c6e6d0da0c7d948d61b313df68a9c1ff07154580f3459cb1de58f7081f34e111f6bb61a50aff2d5301040401000302180a122bfeaecbf603030000000000000050c3000000000000"
  },
  "status": "Broadcasted",
  "txHash": "5vHK68WjZL45UPD9TXxDjYJWaxC8Cz18NPFbJ6aCfbvL1FBdRx618QpAyo758wk1fF68LCyiEGh5yG9Pkuj8JLLx",
  "dateRequested": "2026-03-05T16:10:28.640Z",
  "dateBroadcasted": "2026-03-05T16:10:29.343Z"
}
Transaction Signature: 5vHK68WjZL45UPD9TXxDjYJWaxC8Cz18NPFbJ6aCfbvL1FBdRx618QpAyo758wk1fF68LCyiEGh5yG9Pkuj8JLLx
```

- https://explorer.solana.com/tx/5vHK68WjZL45UPD9TXxDjYJWaxC8Cz18NPFbJ6aCfbvL1FBdRx618QpAyo758wk1fF68LCyiEGh5yG9Pkuj8JLLx?cluster=devnet

## Set FX Rate
```bash
npx tsx dfns/SetFXRate.ts 3 GidScLu4wK5JJ3CUFRbCPeKbyrMf7SLc2nCTCuoNRqqS 60000
```

Output:
```text
Setting FX Rate for Payment PDA: D71N3p2mf5UdcUCzpQbby3VzWa6rHeDQmPnau4xeyFyE
Broadcasting transaction via DFNS (Wallet: wa-01jip-s9pis-e1kph66br1k8e5ja)...
DFNS Broadcast Result: {
  "id": "tx-01jiv-c9nuj-et6a375dokb73c8h",
  "walletId": "wa-01jip-s9pis-e1kph66br1k8e5ja",
  "network": "SolanaDevnet",
  "requester": {
    "userId": "us-01jis-dgc46-echrkuqd141e34ps"
  },
  "requestBody": {
    "kind": "Transaction",
    "transaction": "010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000103e989525794235dbe31ae6e15551b307bf37fcb9c20ccabc007befe05e16ec709b3d6236829b41092bf946a226e56fc73843ca01b0d0731a7ceeca065b60975e5a6dc9ff53460a1d7477688539a507524b285a255840acda4c6e6d0da0c7d948d4e25ffb6f57595ae9b045853cc5a04c20c3e5060fbc67af1087a7a7ff845e405010202010018dbfab98ff177cf41030000000000000060ea000000000000"
  },
  "status": "Broadcasted",
  "txHash": "2BeHK919xeuSseXHoJ9CiW6XERShu1vjqMyHHPhjLUqL69duvpPu8rTnjpqMTpu4SA1NJodW2qKTKgmcvVzk6HEy",
  "dateRequested": "2026-03-05T16:11:39.347Z",
  "dateBroadcasted": "2026-03-05T16:11:40.265Z"
}
Transaction Signature: 2BeHK919xeuSseXHoJ9CiW6XERShu1vjqMyHHPhjLUqL69duvpPu8rTnjpqMTpu4SA1NJodW2qKTKgmcvVzk6HEy
```

- https://explorer.solana.com/tx/2BeHK919xeuSseXHoJ9CiW6XERShu1vjqMyHHPhjLUqL69duvpPu8rTnjpqMTpu4SA1NJodW2qKTKgmcvVzk6HEy?cluster=devnet

## Execute Payment
```bash
npx tsx dfns/ExecutePayment.ts 3 GidScLu4wK5JJ3CUFRbCPeKbyrMf7SLc2nCTCuoNRqqS
```

Output:
```text
Fetched Receiver from PDA: 4vPYnkYUXnRN8FbxmRzaAb1MRRoJCAL1ouqpTBKRYxEa
Adding instruction to create receiver ATA: 3g5FMewAdcghbUhM688A9reJLzLJtKn38jSXeupbaqC7
Executing Payment for PDA: D71N3p2mf5UdcUCzpQbby3VzWa6rHeDQmPnau4xeyFyE
Broadcasting transaction via DFNS (Wallet: wa-01jip-s9pis-e1kph66br1k8e5ja)...
DFNS Broadcast Result: {
  "id": "tx-01jiv-cc1th-e96pd4um6st6pmfb",
  "walletId": "wa-01jip-s9pis-e1kph66br1k8e5ja",
  "network": "SolanaDevnet",
  "requester": {
    "userId": "us-01jis-dgc46-echrkuqd141e34ps"
  },
  "requestBody": {
    "kind": "Transaction",
    "transaction": "01000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100050be989525794235dbe31ae6e15551b307bf37fcb9c20ccabc007befe05e16ec70927b9d3fdd19266eabb770ec2e63792d597d4cdc91cc2a5272c9ce421e556fe6c729e86db0978efd81b6bde2a5c2be405d819bb7c07283862dffac7b41deea6c6b3d6236829b41092bf946a226e56fc73843ca01b0d0731a7ceeca065b60975e5e51ce48722647972df0f9779e858b5c1a79ec9b2e1bc9d7b165d732305528905eea1016ceb04456fe7b63fdfdf14d27ffccdab4bce3fd2e03cfe7f33bf190deb00000000000000000000000000000000000000000000000000000000000000003a4056bf6ff6e00daa5a69fab8aea7dfb4530af4e444aa87df6a8f9ef60c7de78c97258f4e2489f1bb3d1029148e0d830b5a1399daff1084048e7bd8dbe9f859a6dc9ff53460a1d7477688539a507524b285a255840acda4c6e6d0da0c7d948d06ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a96710ea21fcddbc00ae00503a22404217021539793333b81da3d448515008ea9c02080600010702060a000908030005040201000a1056040707788be88b0300000000000000"
  },
  "status": "Broadcasted",
  "txHash": "2z7JxeWq43i4gRFEStdJcdqS87NxkzxmFNCpsVbRo5NfUNg3HfQP8dPtfqUSgdFkFz79GrCX2n6RoFrXJsLC3gfG",
  "dateRequested": "2026-03-05T16:12:55.089Z",
  "dateBroadcasted": "2026-03-05T16:13:01.714Z"
}
Transaction Signature: 2z7JxeWq43i4gRFEStdJcdqS87NxkzxmFNCpsVbRo5NfUNg3HfQP8dPtfqUSgdFkFz79GrCX2n6RoFrXJsLC3gfG
```

- https://explorer.solana.com/tx/2z7JxeWq43i4gRFEStdJcdqS87NxkzxmFNCpsVbRo5NfUNg3HfQP8dPtfqUSgdFkFz79GrCX2n6RoFrXJsLC3gfG?cluster=devnet

## Senders' account tokens

You should see less tEUR 

- https://explorer.solana.com/address/GidScLu4wK5JJ3CUFRbCPeKbyrMf7SLc2nCTCuoNRqqS/tokens?cluster=devnet

## Receivers' account tokens

You should see more tSGD

- https://explorer.solana.com/address/4vPYnkYUXnRN8FbxmRzaAb1MRRoJCAL1ouqpTBKRYxEa/tokens?cluster=devnet

