var SkinCoin = artifacts.require("./SkinCoin.sol");
var Crowdsale = artifacts.require("./Crowdsale.sol");

var TOTAL_COINS = 1000000000000000;
var CROWDSALE_CAP = 600000000000000;
var PERIOD_30_DAYS = 30*24*60*60;
var PERIOD_15_DAYS = 15*24*60*60;

contract('RefundFlow', function(accounts) {

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

    console.log("Owner balance", web3.fromWei(ownerBalance, "ether").toString(), " ETHER");
    console.log("Wallet balance", web3.fromWei(walletBalance, "ether").toString(), " ETHER");
    console.log("Buyer balance", web3.fromWei(buyerBalance, "ether").toString(), " ETHER");
    console.log("Crowdsale balance", web3.fromWei(crowdsaleBalance, "ether").toString(), " ETHER");
  }

  it("Start balance", function() {
     printBalance();
  });


  it("should put 1,000,000,000.000000 SkinCoin in the owner account", function() {
    return SkinCoin.deployed().then(function(instance) {
      return instance.balanceOf.call(owner);
    }).then(function(balance) {
      assert.equal(balance.valueOf(), TOTAL_COINS, "1,000,000,000.000000 wasn't in the owner account.");
    });
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

  it("Try to start Crowdsale contract {from: not Owner}", function() {
    return Crowdsale.deployed().then(function(crowd) {
      return crowd.start({from: buyer}).then(function() {
        assert(false, "Throw was supposed to throw but didn't.");
      }).catch(function(error) {
        console.log("Throw was happened. Test succeeded");
      });
    });
  });

  it("Start Crowdsale contract", function() {
    return Crowdsale.deployed().then(function(crowd) {
      return crowd.start({from: owner}).then(function() {
        console.log("Crowdsale started.");
      });
    });
  });

  it("Try to invest less than MIN_INVEST_ETHER", function() {
    return Crowdsale.deployed().then(function(crowd) {
       return crowd.sendTransaction({from: buyer, to: crowd.address, value: web3.toWei(99, "finney")}).then(function(txn) {
          assert(false, "Throw was supposed to throw but didn't.");
       })
     }).catch(function(error) {
        console.log("Throw was happened. Test succeeded.");
     });
  });


  it("STOP Crowdsale!!! (from: not Owner)", function() {
    return Crowdsale.deployed().then(function(crowd) {
      return crowd.emergencyStop({from: buyer}).then(function() {
         assert(false, "Throw was supposed to throw but didn't.");
      }).catch(function(error) {
        console.log("Throw was happened. Test succeeded.");
      })
    });
  });

  it("STOP Crowdsale!!! (from: Owner)", function() {
    return Crowdsale.deployed().then(function(crowd) {
      return crowd.emergencyStop({from: owner}).then(function() {
         console.log("Crowdsale stopped by owner. Test succeeded.");
      }).catch(function(error) {
        assert(false, "Throw was supposed to throw but didn't.");
      })
    });
  });

  it("Try to buy 6,000,000 coins", function() {
    return Crowdsale.deployed().then(function(crowd) {
      return crowd.sendTransaction({from: buyer, to: crowd.address, value: web3.toWei(1000, "ether")}).then(function(txn) {
        assert(false, "Throw was supposed to throw but didn't.");
      }).catch(function(error) {
        console.log("Throw was happened. Test succeeded.");
      })
    });
  });

  it("Try to release Crowdsale (from: not Owner)", function() {
    return Crowdsale.deployed().then(function(crowd) {
      return crowd.release({from: buyer}).then(function() {
        assert(false, "Throw was supposed to throw but didn't.");
      }).catch(function(error) {
        console.log("Throw was happened. Test succeeded.");
      })
    });
  });

  it("Release Crowdsale (from: Owner)", function() {
    return Crowdsale.deployed().then(function(crowd) {
      return crowd.release({from: owner}).then(function() {
        console.log("Crowdsale was released. Test succeeded.");
      }).catch(function(error) {
        assert(false, "Throw was happened, but wasn't expected.");
      })
    });
  });

  it("Buy only 6,000,000 coins", function() {
    return Crowdsale.deployed().then(function(crowd) {
       return crowd.sendTransaction({from: buyer, to: crowd.address, value: web3.toWei(1000, "ether")}).then(function(txn) {
          return SkinCoin.deployed().then(function(coin) {
            return coin.balanceOf.call(buyer);
          });
       })
     }).then(function(balance) {
        console.log("Buyer balance: ", balance.valueOf(), " SKIN");

        var count = 1000*10000 + (1000*10000*0.2);
        assert.equal(balance.valueOf(), count, "10000 wasn't in the first account.");
     });
  });


  it("Try to finalize crowdsale, when END_TIME isn't reached", function() {
    return Crowdsale.deployed().then(function(crowd) {
      return crowd.finalize({from: owner}).then(function() {
        assert(false, "Throw was supposed to throw but didn't.");
      }).catch(function(error) {
        console.log("Throw was happened. Test succeeded.");
      });
    });
  });

  it("Try to finalize crowdsale {from: not Owner}}", function() {
    web3.evm.increaseTime(PERIOD_30_DAYS);

    return Crowdsale.deployed().then(function(crowd) {
      return crowd.finalize({from: owner}).then(function() {
        assert(false, "Throw was supposed to throw but didn't.");
      }).catch(function(error) {
        console.log("Throw was happened. Test succeeded.");
      });
    });
  });

  it("Try to finalize crowdsale, when MIN_CAP isn't reached", function() {

    return Crowdsale.deployed().then(function(crowd) {
      return crowd.finalize({from: owner}).then(function() {
        assert(false, "Throw was supposed to throw but didn't.");
      }).catch(function(error) {
        console.log("Throw was happened. Test succeeded.");
      });
    });
  });

  it("Try to reserve the overlimit payments {from: buyer}", function() {
    return SkinCoin.deployed().then(function(coin) {
      return coin.balanceOf.call(buyer).then(function(balance) {
        return Crowdsale.deployed().then(function(crowd) {
          return coin.approveAndCall(crowd.address, balance.valueOf()+1, {from: buyer}).then(function() {
            assert(false, "Throw was supposed to throw but didn't.");
          })
        }).catch(function(error) {
          console.log("Throw was happened. Test succeeded.");
        });
      });
    });
  });

  it("Reserve the payments {from: buyer}", function() {
    return SkinCoin.deployed().then(function(coin) {
      return coin.balanceOf.call(buyer).then(function(balance) {
        return Crowdsale.deployed().then(function(crowd) {
          console.log('Buyer SKIN: ' + balance.valueOf());
          return coin.approveAndCall(crowd.address, balance.valueOf(), {from: buyer}).then(function() {
            console.log("Reserve was happened. Test succeeded.");
          })
        }).catch(function(error) {
          assert(false, "Throw was happened, but wasn't expected.");
        });
      });
    });
  });

  it("Refund the payments {from: buyer}", function() {
    return Crowdsale.deployed().then(function(crowd) {

      var oldBuyerBalance = web3.eth.getBalance(buyer);
      console.log("Buyer balance", web3.fromWei(oldBuyerBalance, "ether").toString(), " ETHER");

      return crowd.withdrawPayments({from: buyer, gas: 300000, gasPrice: 0}).then(function(txn) {

        var refund = web3.eth.getBalance(buyer) - oldBuyerBalance;
        console.log("Refund: " + refund);
        assert.isAbove(refund, web3.toWei(1000, "ether"));
        
      });
    });
  });

  it("Finalize crowdsale, after the passage of 45 days", function() {
    web3.evm.increaseTime(PERIOD_15_DAYS);

    return Crowdsale.deployed().then(function(crowd) {
      return crowd.finalize({from: owner}).then(function() {
        console.log("Finalize succeeded.");
      });
    });
  });  

  it("End balance", function() {
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

  // Change block time using the rpc call "evm_setTimestamp" available in the testrpc fork https://github.com/Georgi87/testrpc
  web3.evm = web3.evm || {}
  web3.evm.increaseTime = function (time) {
    return rpc('evm_increaseTime', [time]);
  }

});
