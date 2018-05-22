import React from 'react';

export const Faq = () => (
    <div>
        <section id="wrapper">
            <header>
                <div className="inner">
                    <h2>Frequently Asked Questions</h2>
                </div>
            </header>

            {/* Content */}
            <div className="wrapper">
                <div className="inner">
                    <h3 className="major">What is Ethereum?</h3>
                    <p><a href="https://www.ethereum.org/" target="_blank">Ethereum</a> is a decentralised platform that runs smart contracts: applications that run exactly as programmed without any possibility of downtime, censorship, fraud or third-party interference.
					These apps run on a custom built blockchain, an enormously powerful shared global infrastructure that can move value around and represent the ownership of property.</p>

                    <h3 className="major">What is the TLS-N protocol?</h3>
                    <p><a href="https://tls-n.org/" target="_blank">TLS-N</a>, developed by a team of researchers at ETH Zurich, generates non-interactive proofs about the content of a TLS session that can be verified directly by smart contracts.
					This protocol is the first TLS extension that provides a secure, standardised non-repudiation mechanism. In essence, this allows anybody to become an 'oracle' service. It does this by making important additions to the existing secure TLS protocol.</p>

                    <h3 className="major">What do I need to use this website?</h3>
                    <p>As long as you have metamask installed and ether on the Rinkeby test network, you would be able to use the provided services.
                     In order to get ether on the Rinkeby network we would suggest following the guidlines outlined <a href="https://faucet.rinkeby.io/" target="_blank">here</a>.</p>

                    <h3 className="major">How do I install Metamask?</h3>
                    <p>You can install Metamask from this address: <a href="https://metamask.io" target="_blank">metamask.io</a>. You then need to click
                        “Add to Chrome” to install MetaMask as Google Chrome extension. You then need to click “Add Extension” to confirm and MetaMask will be added.
						You can see that MetaMask is added by the little fox logo that shows up on the top right corner.</p>
                </div>
            </div>
        </section>


        {/* TODO: Refactor the footer */}
        <section id="footer">
            <div className="inner">
                <ul className="copyright">
                    <li>&copy; TrustBet. All rights reserved.</li>
                </ul>
            </div>
        </section>
    </div>
);