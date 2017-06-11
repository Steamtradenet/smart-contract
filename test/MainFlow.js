var SkinCoin = artifacts.require("./SkinCoin.sol");
var Crowdsale = artifacts.require("./Crowdsale.sol");

var TOTAL_COINS = 1000000000000000;
var CROWDSALE_CAP = 600000000000000;
var PERIOD_30_DAYS = 30*24*60*60;
var SEND_ETHER =  10000;
var SKIN_PER_ETHER = 10000;
var RECEIVE_SKIN_AMOUNT = SEND_ETHER * SKIN_PER_ETHER + ((SEND_ETHER * SKIN_PER_ETHER) / 5); // + 20% bonus

contract('MainFlow', function(accounts) {

  var eth = web3.eth;
  var owner = eth.accounts[0];
  var wallet = eth.accounts[1];
  var buyer = eth.accounts[2];

  function printBalance() {
    const ownerBalance = web3.eth.getBalance(owner);
    const walletBalance = web3.eth.getBalance(wallet);
    const buyerBalance = web3.eth.getBalance(buyer);

    console.log("Owner balance", web3.fromWei(ownerBalance, "ether").toString(), " ETHER");
    console.log("Wallet balance", web3.fromWei(walletBalance, "ether").toString(), " ETHER");
    console.log("Buyer balance", web3.fromWei(buyerBalance, "ether").toString(), " ETHER");
  }


  it("should put 1,000,000,000.000000 SkinCoin in the owner account", function() {
    return SkinCoin.deployed().then(function(instance) {
      return instance.balanceOf.call(owner);
    }).then(function(balance) {
      assert.equal(balance.valueOf(), TOTAL_COINS, "1,000,000,000.000000 wasn't in the owner account");
    });
  });

  it("Send 600,000,000.000000 SkinCoin to Crowdsale contract", function() {
    return SkinCoin.deployed().then(function(coin) {
      return coin.transfer(Crowdsale.address, CROWDSALE_CAP, {from: owner}).then(function (txn) {
        return coin.balanceOf.call(Crowdsale.address);
      });
    }).then(function (balance) {
      console.log("Craudsale balance: " + balance);
      assert.equal(balance.valueOf(), CROWDSALE_CAP, "600,000,000.000000 wasn't in the Crowdsale account");
    });
  });

  it("Start Crowdsale contract", function() {
    return Crowdsale.deployed().then(function(crowd) {
      return crowd.start({from: owner}).then(function() {
        console.log("Craudsale started");
      });
    });
  });

  it("Buy 100,000,000 coins", function() {
    return Crowdsale.deployed().then(function(crowd) {
       return crowd.sendTransaction({from: buyer, to: crowd.address, value: web3.toWei(SEND_ETHER, "ether")}).then(function(txn) {
          return SkinCoin.deployed().then(function(coin) {
            return coin.balanceOf.call(buyer);
          });
       })
     }).then(function(balance) {
        console.log("Buyer balance: ", balance.valueOf(), " SKIN");
        assert.equal(balance.valueOf(), RECEIVE_SKIN_AMOUNT, RECEIVE_SKIN_AMOUNT + " wasn't in the first account");
     });
  });


  it("Finalize crowdsale", function() {

    web3.evm.increaseTime(PERIOD_30_DAYS);

    return Crowdsale.deployed().then(function(crowd) {
      return crowd.finalize({from: owner}).then(function() {
        console.log("Finalize");
      });
    });
  });


  it("Get wallet balance", function() {
     printBalance();
  });


  function rpc(method, arg) {
    var req = {
      jsonrpc: "2.0",
      method: method,
      id: new Date().getTime()
    };

    if (arg) req.params = arg;

    return new Promise((resolve, reject) => {
      web3.currentProvider.sendAsync(req, (err, result) => {
        if (err) return reject(err)
        if (result && result.error) {
          return reject(new Error("RPC Error: " + (result.error.message || result.error)))
        }
        resolve(result)
      });
    })
  }

  // Change block time using the rpc call "evm_increaseTime"
  web3.evm = web3.evm || {}
  web3.evm.increaseTime = function (time) {
    return rpc('evm_increaseTime', [time]);
  }

});
