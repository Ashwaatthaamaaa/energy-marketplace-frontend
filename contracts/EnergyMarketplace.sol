// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EnergyMarketplace {
    struct Listing {
        uint id;
        address payable producer;
        uint amount; // Energy amount in kWh
        uint price;  // Price in wei
        bool sold;
    }

    Listing[] public listings;
    mapping(address => uint) public balances;
    uint public nextListingId = 0;

    event EnergyListed(uint id, address producer, uint amount, uint price);
    event EnergySold(uint id, address consumer);

    function listEnergy(uint amount, uint price) public {
        listings.push(Listing(nextListingId, payable(msg.sender), amount, price, false));
        emit EnergyListed(nextListingId, msg.sender, amount, price);
        nextListingId++;
    }

    function buyEnergy(uint listingId) public payable {
        Listing storage listing = listings[listingId];
        require(!listing.sold, "Listing already sold");
        require(msg.sender != listing.producer, "Cannot buy your own listing");
        require(msg.value == listing.price, "Incorrect payment");

        listing.sold = true;
        balances[listing.producer] += msg.value;
        emit EnergySold(listingId, msg.sender);
    }

    function withdraw() public {
        uint amount = balances[msg.sender];
        require(amount > 0, "No balance to withdraw");
        balances[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
}