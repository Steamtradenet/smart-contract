var SafeMath = artifacts.require("./SafeMath.sol");
var SkinCoin = artifacts.require("./SkinCoin.sol");
var Crowdsale = artifacts.require("./Crowdsale.sol");


module.exports = function(deployer) {

	var owner = web3.eth.accounts[0];
	var wallet = web3.eth.accounts[1];

	console.log("Owner address: " + owner);	
	console.log("Wallet address: " + wallet);	

	deployer.deploy(SafeMath, { from: owner });
	deployer.link(SafeMath, SkinCoin);
	deployer.deploy(SkinCoin, { from: owner }).then(function() {
		console.log("SkinCoin address: " + SkinCoin.address);

		return deployer.deploy(Crowdsale, SkinCoin.address, wallet, { from: owner });
	});
};