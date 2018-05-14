pragma solidity ^0.4.18;
import "../installed_contracts/jsmnsol-lib/contracts/JsmnSolLib.sol";
import "../installed_contracts/bytesutils.sol";
import "../installed_contracts/tlsnutils.sol";

contract Lending {

  /***********************************/
  /******* CONTRACT ATTRIBUTES *******/
  /***********************************/

  struct LendingContract {
    uint lendingID;
    address proposer;
    address acceptor;
    uint borrowedAmount;
    uint interestRatePremium; // measured in bps on top of Bank of England base rate
    uint startTime;
    uint endTime;
    uint lendingTimePeriod; // in weeks
    uint collateralAssetID;
    bool filled;
    bool deleted;
  }

  struct AssetOwnership {
    uint assetID;
    address owner;
    uint value;
    bool borrowedAgainst;
  }

  address public master;

  uint[] lendingIDs;
  uint lendingContractCount;
  mapping(uint => LendingContract) public allLendingContracts;

  uint[] assetIDs;
  uint assetCount;
  mapping(uint => AssetOwnership) public allAssets;

  /***********************************/
  /************* MODIFIERS ***********/
  /***********************************/

  modifier isOwner() {
    require(msg.sender == master);
    _; // continue executing rest of method body
  }

  /***********************************/
  /************** EVENTS *************/
  /***********************************/

  event AssetChange(uint assetID);
  event LendingContractChange(uint lendingID);

  /***********************************/
  /********* PUBLIC FUNCTIONS ********/
  /***********************************/

  /// @dev      Lending contract constructor sets initial lending contract count to 0
  function Lending() public {
    master = msg.sender;
    lendingContractCount = 0;
    assetCount = 0;
  }

  /// @dev                    Allows a user with an asset to request a loan
  /// @param  _assetID        The json file passing the interest rate
  /// @param  borrowAmount    The odds put forward by the user
  /// @param  _home_score     The home score proposed by the user
  /// @param  _away_score     The away score proposed by the user
  /// @param  _proof          The json file passing the interest rate
  function borrowFunds(uint _assetID, uint borrowAmount, uint _premium, uint _lending_period) public payable {
    require(!allAssets[_assetID].borrowedAgainst);
    require(allAssets[_assetID].value >= borrowAmount);
    require(allAssets[_assetID].owner == msg.sender);

    // Work out the Bank of England Base Interest Rate from Hex Proof

    // Check that the funds transferred into the contract are equl to the number of weeks money required and above base rate
    // The individual will need to transfer enough funds in to cover the entire period, even if withdraw early

    // Setup Contract
    uint lendingID = (lendingContractCount++)+1000;
    lendingIDs.push(lendingID);
    allLendingContracts[lendingID] = LendingContract(lendingID, msg.sender, 0, borrowAmount, _premium, 0, 0, _lending_period, _assetID, false, false);
    LendingContractChange(lendingID);
  }

  function lendFunds(uint _lendingID) public payable {
    require(msg.value == allLendingContracts[_lendingID].borrowedAmount);
    require(!allLendingContracts[_lendingID].filled);
    allLendingContracts[_lendingID].proposer.transfer(msg.value);
    allLendingContracts[_lendingID].filled = true;
    allLendingContracts[_lendingID].acceptor = msg.sender;
    allLendingContracts[_lendingID].startTime = now;
    allLendingContracts[_lendingID].endTime = now + (allLendingContracts[_lendingID].lendingTimePeriod * 1 weeks);
  }

  function payFundsBack(uint _lendingID) public payable {
    require(allLendingContracts[_lendingID].proposer == msg.sender);
    require(allLendingContracts[_lendingID].borrowedAmount == msg.value);
    require(allLendingContracts[_lendingID].filled);
    require(now < allLendingContracts[_lendingID].endTime);

    // Also need to pay back some of the premium that the individual paid in
    // Proportional to how many days early they repaid

    allLendingContracts[_lendingID].acceptor.transfer(msg.value);
    allLendingContracts[_lendingID].deleted = true;
    allAssets[allLendingContracts[_lendingID].collateralAssetID].borrowedAgainst = false;
    lendingContractCount--;
  }

  function reportLatePayment(uint _lendingID) public payable {
    require(allLendingContracts[_lendingID].acceptor == msg.sender);
    require(allLendingContracts[_lendingID].filled);
    require(!allLendingContracts[_lendingID].deleted);
    require(now > allLendingContracts[_lendingID].endTime);

    allAssets[allLendingContracts[_lendingID].collateralAssetID].owner = msg.sender;
    allAssets[allLendingContracts[_lendingID].collateralAssetID].borrowedAgainst = false;
    allLendingContracts[_lendingID].deleted = true;
  }

  // Done
  function addAsset(address _owner, uint _value) public isOwner {
    uint assetID = (assetCount++)+1000;
    assetIDs.push(assetID);
    allAssets[assetID] = AssetOwnership(assetID, _owner, _value, false);
    AssetChange(assetID);
  }

  // Done
  function transferOwnership(address _recipient, uint _assetID) public {
    require(allAssets[_assetID].owner == msg.sender || msg.sender == master);
    allAssets[_assetID].owner = _recipient;
  }

  // Done
  function changeValue(uint _assetID, uint _new_value) public isOwner {
    allAssets[_assetID].value = _new_value;
  }

  // Done
  function getLendingIds() public constant returns (uint[]) {
    return lendingIDs;
  }

  // Done
  function getAssetIds() public constant returns (uint[]) {
    return assetIDs;
  }

  // Done
  function getLendingContractCount() public constant returns (uint) {
    return lendingContractCount;
  }

  // Done
  function getAssetCount() public constant returns (uint) {
    return assetCount;
  }

  function getTime() public constant returns (uint){
    return now;
  }
  /***********************************/
  /******** PRIVATE FUNCTIONS ********/
  /***********************************/

}
