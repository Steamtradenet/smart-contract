pragma solidity ^0.4.11;

import "./StandardToken.sol";
import "./TokenSpender.sol";


contract SkinCoin is StandardToken {
  string public constant name = "SkinCoin";
  string public constant symbol = "SKIN";
  uint public constant decimals = 6;


  // Constructor
  function SkinCoin() {
      totalSupply = 1000000000000000;
      balances[msg.sender] = totalSupply; // Send all tokens to owner
  }

  function burn(uint _value) returns (bool) {
    balances[msg.sender] = balances[msg.sender].sub(_value);
    totalSupply = totalSupply.sub(_value);
    Transfer(msg.sender, 0x0, _value);
    return true;
  }


  /* Approve and then communicate the approved contract in a single tx */
  function approveAndCall(address _spender, uint _value) {    
      TokenSpender spender = TokenSpender(_spender);
      approve(_spender, _value);
      spender.receiveApproval(msg.sender, _value);
  }
}






