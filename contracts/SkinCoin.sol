pragma solidity ^0.4.11;

import "./StandardToken.sol";
import "./Ownable.sol";

contract SkinCoin is StandardToken, Ownable {
  string public constant name = "SkinCoin";
  string public constant symbol = "SKIN";
  uint public constant decimals = 6;


  // Constructor
  function SkinCoin() {
      totalSupply = 1000000000000000;
      balances[msg.sender] = totalSupply; // Send all tokens to owner
  }

  function burn(uint _value) onlyOwner returns (bool) {
    balances[msg.sender] = balances[msg.sender].sub(_value);
    totalSupply = totalSupply.sub(_value);
    Transfer(msg.sender, 0x0, _value);
    return true;
  }

}






