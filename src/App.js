import React, { Component } from 'react'
import Lending from '../build/contracts/Lending.json'
import getWeb3 from './utils/getWeb3'
import * as interestRates from './interestRates.js'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

// Loan class for client-side representation
class Loan {
    constructor(id, proposer, accepter, timePeriod, amount, interestRatePremium, assetID,
		startTime, endTime, filled, deleted) {
	this.id = id
	this.proposer = proposer
	this.accepter = accepter
	this.timePeriod = timePeriod
	this.amount = amount
	this.interestRatePremium = interestRatePremium
	this.assetID = assetID
	this.startTime = startTime
	this.endTime = endTime
	this.filled = filled
	this.deleted = deleted
    }
}

// React component which displays a Loan object
class LoanView extends Component {
    constructor(props) {
	super(props)
    }
    render() {
	// Returns a style for <p> div given the with
	var pStyle = function(width) {
	    return {display:"inline-block", width:width+"px", "text-align":"center"}
	}
	// Returns a set of <p>, each with centered text of a certain width, to create columns
	return(<div style={{display:"inline-block"}}>
	       <p style={pStyle(this.props.idWidth)}>{this.props.loan.id}</p>
	       <p style={pStyle(this.props.assetIdWidth)}>{this.props.loan.assetID}</p>
	       <p style={pStyle(this.props.amountWidth)}>{this.props.loan.amount}</p>
	       <p style={pStyle(this.props.interestPremWidth)}>{this.props.loan.interestRatePremium}</p>
	       </div>)
    }
}

// React component that displays a list of LoanViews
class LoanList extends Component {
    constructor(props) {
	super(props)
    }
    render() {
	// Column widths
	var idWidth = 80
	var assetIdWidth = 80
	var interestPremWidth = 150
	var amountWidth = 110
	// Function that produces a column header of a certain width
	var columnHeader = function(text, width) {
	    return (<h4 style={{display:"inline-block", width:width+"px", "text-align":"center"}}>{text}</h4>)
	}
	// Returns the headers and then a list of LoanViews by mapping the loans list to LoanViews
	return (
		<div>
		<h4>{this.props.header}</h4>
		{columnHeader("ID", idWidth)}
	    {columnHeader("Asset ID", assetIdWidth)}
	    {columnHeader("Amount", amountWidth)}
	    {columnHeader("Interest Premium", interestPremWidth)}
		{this.props.loans.map( function(loan) {
		    return <div>
			<LoanView key={loan.id} loan={loan} idWidth={idWidth} assetIdWidth={assetIdWidth} amountWidth={amountWidth} interestPremWidth={interestPremWidth}/>
			{this.props.buttonAction ? <button style={{display:"inline-block"}} onClick={() => this.props.buttonAction(loan)}>{this.props.buttonText}</button> : null}
		    </div>
		}.bind(this))}
	    </div>
	)
    }
}

// React component for creating a new loan
class LoanCreator extends Component {
    constructor(props) {
	super(props)
	this.state = {amount:0, interestRate:0, assetID:0, lendingPeriod:0}
    }
    // The following setters all attempt to parse a number from text and if succesful, set the corresponding attribute
    setInterest(premium) {
	if (parseFloat(premium)) {
	    this.setState({interestRate: this.props.baseRate+parseFloat(premium)})
	}
    }
    setAmount(amount) {
	if (parseFloat(amount)) {
	    this.setState({amount: parseFloat(amount)})
	}
    }
    setAssetID(assetID) {
	if (parseInt(assetID)) {
	    this.setState({assetID: parseInt(assetID)})
	}
    }
    setLendingPeriod(lendingPeriod) {
	if (parseInt(lendingPeriod)) {
	    this.setState({lendingPeriod: parseInt(lendingPeriod)})
	}
    }
    render() {
	// Render some input elements for each of the fields, with a <p> field to confirm what is being done
	return (
		<div>
		Create here
		<input placeholder={"Amount"} onChange={(e) => this.setAmount(e.target.value)}></input>
		<input placeholder={"Interest Rate Premium"} onChange={(e) => this.setInterest(e.target.value)}></input>
		<input placeholder={"Asset ID"} onChange={(e) => this.setAssetID(e.target.value)}></input>
		<input placeholder={"Time period (weeks)"} onChange={(e) => this.setLendingPeriod(e.target.value)}></input>
		<p>Requesting a loan for {this.state.amount} with interest rate {this.state.interestRate} to be paid back in {this.state.lendingPeriod} weeks with asset number {this.state.assetID} as collateral</p>
		<button onClick={() => {this.props.addNewLoan(this.state.amount, this.state.interestRatePremium, this.state.lendingPeriod, this.state.assetId)}}>Request Loan</button>
	    </div> )
    }
}

// Main app that runs the program
class App extends Component {
    constructor(props) {
	super(props)

	this.state = {
	    storageValue: 0,
	    web3: null,
	    boeInterestRate: 0.2,
	    unfundedLoans: [],
	    fundedLoans:[],
	    loansMade:[],
	    proposedLoans:[]
	}
	this.getAllLoans()
    }

    // Called by react once the component is mounted, attempts to connect with blockchain and finds and sets up the contract
    componentWillMount() {
	// Get network provider and web3 instance.
	// See utils/getWeb3 for more info.

	getWeb3
	    .then(results => {
		this.setState({
		    web3: results.web3
		})

		// Instantiate contract once web3 provided.
		this.instantiateContract()
	    })
	    .catch(() => {
		console.log('Error finding web3.')
	    }).then( (result) => {
		// Instantiate contract once web3 provided.
		console.log("getting contract")
		return this.getContract()
	    }).then( (result) => {
		// Start watching for bet changes with getLoans callback
		var getLoans = function() {
		    console.log("event triggered")
		    this.getAllLoans()
		}.bind(this)
		this.event = this.lendingContractInst.AssetChange()
		return this.event.watch(getLoans)
	    }).then( (result) => {
		// Create a function that regularly checks for changes to account
		this.currAccount = this.state.web3.eth.accounts[0]
		console.log(this.currAccount, this.state.web3.eth.accounts)
		this.getCurrAccount = function() {
		    if (this.state.web3.eth.accounts[0] !== this.currAccount) {
			this.currAccount = this.state.web3.eth.accounts[0];
			this.getAllLoans()
		    }
		}.bind(this)
		setInterval(this.getCurrAccount, 100)
		return this.getAllLoans()
	    })
    }

    // Gets the contract from the blockchain
    async getContract() {
	console.log("getting contract")
	const contract = require('truffle-contract')
	this.lendingContract = contract(Lending)
	this.lendingContract.setProvider(this.state.web3.currentProvider)
	this.lendingContractInst = await this.lendingContract.deployed()
    }

    // Gets the loans from the blockchain and sorts them into various lists
    async getAllLoans() {
	console.log("getting loans")
	var loans = [new Loan(1,this.currAccount,0,2,1,1,1001,3,2, false, false),
		     new Loan(2,2,1,1,1,1,1001,1,3, false, false),
		     new Loan(3,this.currAccount,0,2,1,1,1001,3,2, true, false),
		     new Loan(4,0,this.currAccount,2,1,1,1001,3,2, true, false),
		     new Loan(5,this.currAccount,0,2,1,1,1001,3,2, false, true)]
	var unfundedLoans = []
	var fundedLoans = []
	var loansMade = []
	var proposedLoans = []
	for (var i = 0; i < loans.length; i++) {
	    var loan = loans[i]
	    if (loan.deleted == false) {
		// If loan hasnt been deleted
		if (loan.proposer == this.currAccount) {
		    // IF the current user is proposing the loan
		    if (loan.filled == false) {
			// and if it has not yet been filled, add to unfunded loans
			unfundedLoans.push(loan)
		    }
		    else {
			// and if it has been filled, add to funded loans
			fundedLoans.push(loan)
		    }
		}
		else if (loan.filled == false) {
		    // If it has not been filled and isnt the players proposal, add it to the list of proposed loans
		    proposedLoans.push(loan)
		}
		else if (loan.accepter == this.currAccount) {
		    // If the player has accepted the loan, add it to the list of loans he has made
		    loansMade.push(loan)
		}
	    }
	}
	this.setState({unfundedLoans: unfundedLoans, fundedLoans: fundedLoans, loansMade: loansMade, proposedLoans: proposedLoans}) 
    }

    // Convert loan array to loan object
    convertLoans(loanArr) {
	var id = loanArr[0]//.toNumber()
	var proposer = loanArr[1]
	var accepter = loanArr[2]
	var amount = loanArr[3].toNumber()
	var interestRatePremium = loanArr[4].toNumber()
	var startTime = loanArr[5].toNumber()
	var endTime = loanArr[6].toNumber()
	var timePeriod = loanArr[7].toNumber()
	var assetID = loanArr[8].toNumber()
	var filled = loanArr[9]
	var deleted = loanArr[10]
	var loan = Loan(id, proposer, accepter, timePeriod, amount, interestRatePremium, assetID,
		startTime, endTime, filled, deleted);
	return loan
    }

    // Adds a new loan to the blockchain
    async addNewLoan(amount, premium, lendingPeriod, assetId) {
	console.log((await this.lendingContractInst.getAssetIds()))
	var proof = interestRates.fetchInterestRate().proof
	console.log(proof)
	this.lendingContractInst.borrowFunds(1000, this.state.web3.toWei(amount, "ether"),
					     lendingPeriod, proof,
					     {from:this.currAccount, value:this.state.web3.toWei(premium, "ether")}) 
    }

    async addNewAsset(value) {
	console.log(this.currAccount);
	await this.lendingContractInst.addAsset(this.currAccount, value, {from:this.currAccount});
	console.log((await this.lendingContractInst.getAssetIds()))
    }

    // Cancels a proposed loan
    async cancelLoan(loan) {
	console.log("cancelling loan " + loan.id)
    }

    // Agree to makes a loan
    async acceptLoan(loan) {
	console.log("accepting loan" + loan.id)
    }

    // Repay a loan
    async repayLoan(loan) {
	console.log("repaying loan " + loan.id)
    }

    // Claim an asset as a result of non-repayement
    async claimAsset(loan) {
	console.log("claim loan" + loan.id)
    }

    render() {
	return (
		<div className="App">
		<nav className="navbar pure-menu pure-menu-horizontal">
		<a href="#" className="pure-menu-heading pure-menu-link">Truffle Box</a>
		</nav>

		<main className="container">
		<div className="pure-g">
		<div className="pure-u-1-1">
		<LoanCreator addNewLoan={this.addNewLoan.bind(this)} baseRate={this.state.boeInterestRate}/>
		<button onClick={() => {this.addNewAsset(1)}}>Add New Asset </button>
		<LoanList loans={this.state.unfundedLoans} header={"Your Unfunded Loans"} buttonAction={this.cancelLoan.bind(this)} buttonText={"Cancel Loan"}/>
		<LoanList loans={this.state.fundedLoans} header={"Your Funded Loans"} buttonAction={this.repayLoan.bind(this)} buttonText={"Repay Loan"}/>
		<LoanList loans={this.state.loansMade} header={"Loans You've Made"} buttonAction={this.claimAsset.bind(this)} buttonText={"Claim Asset"}/>
		<LoanList loans={this.state.proposedLoans} header={"Proposed Loans"} buttonAction={this.acceptLoan.bind(this)} buttonText={"Make Loan"}/>
	    </div>
		</div>
		</main>
		</div>
	);
    }
}

export default App


/* Plan:
 * - Try the actions out on the  blockchain
 * - Show the BOE interest rate somewhere
 * - New loan creator 
*/
