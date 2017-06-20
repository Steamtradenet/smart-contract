var SafeMath = artifacts.require("./SafeMath.sol");
var SkinCoin = artifacts.require("./SkinCoin.sol");
var Crowdsale = artifacts.require("./Crowdsale.sol");


module.exports = function(deployer) {

	var owner = web3.eth.accounts[0];
	var wallet = web3.eth.accounts[1];

	// var owner = '0x6f2010D0FBaf8B7Dbc13eE7252FF8594A2Be3C51';
	// var wallet = '0x532691886A05eDc95457BFd5aEDA9b65b5413c83';

	console.log("Owner address: " + owner);	
	console.log("Wallet address: " + wallet);	

	deployer.deploy(SafeMath, { from: owner });
	deployer.link(SafeMath, SkinCoin);
	return deployer.deploy(SkinCoin, { from: owner }).then(function() {
		console.log("SkinCoin address: " + SkinCoin.address);
		return deployer.deploy(Crowdsale, SkinCoin.address, wallet, { from: owner }).then(function() {
			console.log("Crowdsale address: " + Crowdsale.address);
			return SkinCoin.deployed().then(function(coin) {
				return coin.owner.call().then(function(owner) {
					console.log("SkinCoin owner : " + owner);
					return coin.transferOwnership(Crowdsale.address, {from: owner}).then(function(txn) {
						console.log("SkinCoin owner was changed: " + Crowdsale.address);		
					});
				})
			});
		});
	});
};