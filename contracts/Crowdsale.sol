pragma solidity ^0.4.11;


import "./Pausable.sol";
import "./PullPayment.sol";
import "./SkinCoin.sol";


contract Crowdsale is Pausable, PullPayment {
    
    using SafeMath for uint;

  	struct Backer {
		uint weiReceived; // Amount of Ether given
		uint coinSent;
	}

	/*
	* Constants
	*/
	/* Minimum number of SkinCoin to sell */
	uint public constant MIN_CAP = 100000000;
	/* Maximum number of SkinCoin to sell */
	uint public constant MAX_CAP = 600000000;
	/* Minimum amount to invest */
	uint public constant MIN_INVEST_ETHER = 100 finney;
	/* Crowdsale period */
	uint constant CROWDSALE_PERIOD = 30 days;


	/*
	* Variables
	*/
	/* SkinCoin contract reference */
	SkinCoin public coin;
    /* Multisig contract that will receive the Ether */
	address public multisigEther;
	/* Number of SkinCoins per Ether */
	uint public coinPerEther;
	/* Number of Ether received */
	uint public etherReceived;
	/* Number of SkinCoins sent to Ether contributors */
	uint public coinSentToEther;
	/* Crowdsale start time */
	uint public startTime = 0;
	/* Crowdsale end time */
	uint public endTime;
	/* Max cap has been reached */
	bool public maxCapReached;
 	/* Is crowdsale still on going */
	bool public crowdsaleClosed;

	/* Backers Ether indexed by their Ethereum address */
	mapping(address => Backer) public backers;


	/*
	* Modifiers
	*/
	modifier minCapNotReached() {
		if ((now < endTime) || coinSentToEther >= MIN_CAP ) throw;
		_;
	}

	modifier respectTimeFrame() {
		if ((now < startTime) || (now > endTime )) throw;
		_;
	}

	/*
	 * Event
	*/
	event ReceivedETH(address addr, uint value);
	event Logs(address indexed from, uint amount, string value);

	/*
	 * Constructor
	*/
	function Crowdsale(address _skinCoinAddress, address _to) {
		coin = SkinCoin(_skinCoinAddress);
		multisigEther = _to;
		
		coinPerEther = 10000;
	}

	/* 
	 * The fallback function corresponds to a donation in ETH
	 */
	function() stopInEmergency respectTimeFrame payable {
		receiveETH(msg.sender);
	}

	/* 
	 * To call to start the crowdsale
	 */
	function start() onlyOwner {
		if (startTime != 0) throw; // Crowdsale was already started

		startTime = now ;            
		endTime =  now + CROWDSALE_PERIOD;    
	}

	/*
	 *	Receives a donation in Ether
	*/
	function receiveETH(address beneficiary) internal {
		if (msg.value < MIN_INVEST_ETHER) throw; // Don't accept funding under a predefined threshold
		
		uint coinToSend = bonus(msg.value.mul(coinPerEther) /(1 ether)); // Compute the number of SkinCoin to send
		if (coinToSend.add(coinSentToEther) > MAX_CAP) throw;	

		Backer backer = backers[beneficiary];
		coin.transfer(beneficiary, coinToSend); // Transfer SkinCoins right now 

		backer.coinSent = backer.coinSent.add(coinToSend);
		backer.weiReceived = backer.weiReceived.add(msg.value); // Update the total wei collected during the crowdfunding for this backer    

		etherReceived = etherReceived.add(msg.value); // Update the total wei collected during the crowdfunding
		coinSentToEther = coinSentToEther.add(coinToSend);

		// Send events
		Logs(msg.sender ,coinToSend, "emitCoins");
		ReceivedETH(beneficiary, etherReceived); 
	}
	

	/*
	 *Compute the SkinCoin bonus according to the investment period
	 */
	function bonus(uint amount) internal constant returns (uint) {
		if (now < startTime.add(2 days)) return amount.add(amount.div(5));   // bonus 20%
		return amount;
	}

	/* 
	 * When MIN_CAP is not reach backer can call the approveAndCall function of the SkinCoin token contract
	 * with this crowdsale contract on parameter with all the SkinCoin they get in order to be refund
	 */
	function receiveApproval(address _from, uint256 _value) minCapNotReached public {
		if (msg.sender != address(coin)) throw; 
		
		// if (_extraData.length != 0) throw; // no extradata needed
		
		if (_value != backers[_from].coinSent) throw; // compare value from backer balance

		coin.transferFrom(_from, address(this), _value); // get the token back to the crowdsale contract

		if (!coin.burn(_value)) throw ; // token sent for refund are burnt

		uint ETHToSend = backers[_from].weiReceived;
		backers[_from].weiReceived=0;

		if (ETHToSend > 0) {
			asyncSend(_from, ETHToSend); // pull payment to get refund in ETH
		}
	}

	/*	
	 * Finalize the crowdsale, should be called after the refund period
	*/
	function finalize() onlyOwner {
		// check
		if (now < endTime) throw; // Cannot finalise before CROWDSALE_PERIOD

		if (coinSentToEther < MIN_CAP && now < endTime + 15 days) throw; // If MIN_CAP is not reached donors have 15days to get refund before we can finalise

		if (!multisigEther.send(this.balance)) throw; // Move the remaining Ether to the multisig address
		
		uint remains = coin.balanceOf(this);
		if (remains > 0) { // Burn the rest of SkinCoins
			if (!coin.burn(remains)) throw ;
		}
		crowdsaleClosed = true;
	}

	/*	
	* Failsafe drain
	*/
	function drain() onlyOwner {
		if (!owner.send(this.balance)) throw;
	}
}