var SkinCoin = artifacts.require("./SkinCoin.sol");
var Crowdsale = artifacts.require("./Crowdsale.sol");

var TOTAL_COINS = 1000000000000000;
var CROWDSALE_CAP = 600000000000000;
var SKIN_PER_ETHER = 6000000000;
var PERIOD_2_DAYS = 2*24*60*60;

contract('FastFlow', function(accounts) {

  var eth = web3.eth;
  var owner = eth.accounts[0];
  var wallet = eth.accounts[1];
  var buyer = eth.accounts[2];
  var thief = eth.accounts[3];


  function printBalance() {
    const ownerBalance = web3.eth.getBalance(owner);
    const walletBalance = web3.eth.getBalance(wallet);
    const buyerBalance = web3.eth.getBalance(buyer);
    const crowdsaleBalance = web3.eth.getBalance(Crowdsale.address);

    // console.log("Owner balance", web3.fromWei(ownerBalance, "ether").toString(), " ETHER");
    console.log("Wallet balance", web3.fromWei(walletBalance, "ether").toString(), " ETHER");
    // console.log("Buyer balance", web3.fromWei(buyerBalance, "ether").toString(), " ETHER");
    // console.log("Crowdsale balance", web3.fromWei(crowdsaleBalance, "ether").toString(), " ETHER");


    return SkinCoin.deployed().then(function(instance) {
      return instance.balanceOf.call(owner)
    .then(function(balance) {
      console.log("Owner balance: ", web3.fromWei(ownerBalance, "ether").toString(), " ETHER / ", balance.valueOf(), " SKIN");
      return instance.balanceOf.call(buyer); 
    }).then(function(balance) {
      console.log("Buyer balance: ", web3.fromWei(buyerBalance, "ether").toString(), " ETHER / ", balance.valueOf(), " SKIN");
      return instance.balanceOf.call(Crowdsale.address); 
    }).then(function(balance) {
      console.log("Crowdsale balance: ", web3.fromWei(crowdsaleBalance, "ether").toString(), " ETHER / ", balance.valueOf(), " SKIN");
    })

  })


  }

  it("should put 1,000,000,000.000000 SkinCoin in the owner account", function() {
    return printBalance().then(function() {
      return SkinCoin.deployed().then(function(instance) {
        return instance.balanceOf.call(owner);
      }).then(function(balance) {
        assert.equal(balance.valueOf(), TOTAL_COINS, "1,000,000,000.000000 wasn't in the owner account.");
      });
    })
  });

  it("Send 600,000,000.000000 SkinCoin to Crowdsale contract", function() {
    return SkinCoin.deployed().then(function(coin) {
      return coin.transfer(Crowdsale.address, CROWDSALE_CAP, {from: owner}).then(function (txn) {
        return coin.balanceOf.call(Crowdsale.address);
      });
    }).then(function (balance) {
      console.log("Crowdsale balance: " + balance);
      assert.equal(balance.valueOf(), CROWDSALE_CAP, "600,000,000.000000 wasn't in the Crowdsale account");
    });
  });

  it("Start Crowdsale contract", function() {
    return Crowdsale.deployed().then(function(crowd) {
      return crowd.start({from: owner}).then(function() {
        console.log("Crowdsale started.");
      });
    });
  });


  it("Buy 5,994,000 coins", function() {
    web3.evm.increaseTime(PERIOD_2_DAYS);

    var investSum = web3.toWei(100000, "ether") - web3.toWei(101, "finney");
    
    return Crowdsale.deployed().then(function(crowd) {
       return crowd.sendTransaction({from: buyer, to: crowd.address, value: investSum}).then(function(txn) {
          return SkinCoin.deployed().then(function(coin) {
            return coin.balanceOf.call(buyer);
          });
       })
     }).then(function(balance) {
        console.log("Buyer balance: ", balance.valueOf(), " SKIN");

        var count = parseInt(investSum * (SKIN_PER_ETHER) / (web3.toWei(1, "ether")));
        assert.equal(balance.valueOf(), count, "10000 wasn't in the first account.");
     });
  });


  it("Try to invoke getRemainCoins {from: onwer}", function() {
    return Crowdsale.deployed().then(function(crowd) {
       return crowd.getRemainCoins({from: owner}).then(function(txn) {
        assert(false, "Throw was supposed to throw but didn't.");
       })
     }).catch(function(error) {
        console.log("Throw was happened. Test succeeded. ");
     });
  });

  it("Buy one more 6,000 coins", function() {
    return SkinCoin.deployed().then(function(coin) {
      return coin.balanceOf.call(buyer).then(function(oldBalance) {
        return Crowdsale.deployed().then(function(crowd) {
          return crowd.sendTransaction({from: buyer, to: crowd.address, value: web3.toWei(100, "finney")});
        }).then(function(txn) {
          return coin.balanceOf.call(buyer);
        }).then(function(newBalance) {
          var count = parseInt(web3.toWei(100, "finney") * (SKIN_PER_ETHER) / (web3.toWei(1, "ether")));

          var balanceMustBe = (newBalance.valueOf() - count);

          assert.equal(oldBalance.valueOf(), balanceMustBe, balanceMustBe + " is bad.");
        })        
      });
    });
  });


  it("Invoke getRemainCoins {from: onwer}", function() {
    return printBalance().then(function() {

    return Crowdsale.deployed().then(function(crowd) {

       var logCoinsEmitedEvent = crowd.LogCoinsEmited();
        logCoinsEmitedEvent.watch(function(err, result) {
          if (err) {
            console.log("Error event ", err);
            return;
          }
          console.log("LogCoinsEmited event = ",result.args.amount,result.args.from);
        }); 

        var logReceivedETH = crowd.LogReceivedETH();
        logReceivedETH.watch(function(err, result) {
          if (err) {
            console.log("Error event ", err);
            return;
          }
          console.log("LogReceivedETH event = ",result.args.addr,result.args.value);
        }); 


       return crowd.getRemainCoins({from: owner}).then(function(txn) {
          return SkinCoin.deployed().then(function(coin) {
            return coin.balanceOf.call(crowd.address);
          });
       })
     }).then(function(balance) {
        console.log("Crowdsale balance: ", balance.valueOf(), " SKIN");
        assert.equal(balance.valueOf(), 0, "Crowdsale balance must be empty.");
     });
    })
  });

  it("Finalize crowdsale", function() {
    return Crowdsale.deployed().then(function(crowd) {
      return crowd.finalize({from: owner}).then(function() {
        console.log("Finalize");
      }).then(function() {
        printBalance();   
      });
    });
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

  // Change block time using the rpc call "evm_setTimestamp" available in the testrpc fork https://github.com/Georgi87/testrpc
  web3.evm = web3.evm || {}
  web3.evm.increaseTime = function (time) {
    return rpc('evm_increaseTime', [time]);
  }

});
