# SkinCoin-token

Universal Cryptocurrency based on Ethereum for instant trading CS:GO, Dota 2 skins, and making bets on e-sports events

## Requirements

To run tests you need to install the following software:

- [Truffle v3.2.4](https://github.com/trufflesuite/truffle-core)
- [EthereumJS TestRPC v3.0.5](https://github.com/ethereumjs/testrpc)

## How to test

To run test open the terminal and run the following commands:

```sh
$ cd smart-contract
$ truffle migrate
$ traffle test ./test/MainFlow.js
$ traffle test ./test/RefundFlow.js
$ traffle test ./test/RefundFlow.js
```

**NOTE:** All tests must be run separately as specified

## Deployment

To deploy smart contracts to live network do the following steps:
1. Go to the smart contract folder and run truffle console:
```sh
$ cd smart-contract
$ truffle console
```
2. Inside truffle console invoke "migrate" command to deploy contracts:
```sh
truffle> migrate
```