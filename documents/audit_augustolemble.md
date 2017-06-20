# SkinCoin Audit

Audit done by [Augusto Lemble](mailto:me@augustolemble.com) on the commit https://github.com/AugustoL/smart-contract/commit/62d04f6aa6771d942aabdbad7c599a90b777caf7 over the SkinCoin smart contracts.

## Severe

Tokens are transfered while the crowdale is still runnig, a token holder that receives his token can start trading them instantly, this can have a hard impact on the crowdsale taking in mind that the first buyers will buy tokens at a 20% discount, after that bonus period the token price will be a fixed amount of ether but the previus buyer can sell the tokens they bought individually to external buyers, without even knowing yet if the crowdsale was sucesfull. This can create a side market, giving the investors another way to get tokens, buying them without increasing the capital raised and tokens issued.

## Notes:
* Poor documentation in general.

* Not clear test and install instructions, wanted to run the tests all together but it was not possible, I had to run it separately.

* Crowdsale and SkinCoin contracts don't have any description of them at the beginning of the contract source code.

* SafeMath not used on line 105 of Crwodsale.sol
  `uint coinToSend = bonus(msg.value.mul(COIN_PER_ETHER) / (1 ether));`

* Value is not needed as argument in the refund method, assuming that whis method will only be called when the crowdsale dont reach the minimun capital all investors will want their all ethers back, there is not reason to check the value is the calls is done by the investor address.

* Unnecessary getRemainCoins method. This particular case can be checked on the receiveETH method.

## Conclusion

One severe problem with the crowdsale strategy was found, I strongly suggest to distribute the tokens after the crowdsale finish sucessfuly. Also the Crowdsale contract should use some improvements and code refactoring on methods mentined on the notes.
About the tests and documentation I strongly suggest to make all more developer-friendly, with more documentation and a description on every test case explainig the expected results.
My final conclusion and advise is to proceed with the crowdsale once the distribution after crowdsale finish is implemented and I strongly suggest to do a code refactor to review the notes posted above.

## Suggestions
  * Use https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/scripts/test.sh script for testing and ran testrpc with truffle tests simultaniusly.
  * It would be nice to have clear and complete install and test instructions with a description of how the crowdsale will work.
  * Specify nodejs, truffle and testrpc versions needed to test.
  * Describe every test case.
  * Consider using zeppelin-solidity as library.
  * Consider writing tests like https://github.com/OpenZeppelin/zeppelin-solidity/tree/master/test.