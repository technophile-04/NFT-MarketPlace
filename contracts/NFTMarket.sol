// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


contract NFTMarket is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemSold;

    address payable owner;
    uint listingPrice = 0.025 ether;

    constructor() {
        owner = payable(msg.sender);
    }

    struct MarketItem {
        uint itemId;
        address nftContract;
        uint tokenId;
        address payable seller;
        address payable owner;
        uint price;
        bool sold;
    }

    mapping(uint => MarketItem) private idToMarketItem;

    event MarketItemCreated (
        uint indexed itemId,
        address indexed nftContract,
        uint indexed tokenId,
        address payable seller,
        address payable owner,
        uint price,
        bool sold
    );

    function getListingPrice() view public returns(uint) { 
        return listingPrice;
    }

    function createMarketItem(address nftContract, uint tokenId, uint price ) public payable nonReentrant {
        require(price > 0, "Price must be atleast 1 wei");
        require(msg.value == listingPrice, "Price must be equal to listing price");

        _itemIds.increment();
        uint itemId = _itemIds.current();
        idToMarketItem[itemId] = MarketItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false
        );

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit MarketItemCreated(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false
        );

    }

    function createMarketSale(address nftContract, uint itemId) public payable nonReentrant {
        uint price = idToMarketItem[itemId].price;
        uint tokenId = idToMarketItem[itemId].tokenId;

        require(msg.value == price, "Please submit the asking price in order to complete the purchase");

        idToMarketItem[itemId].seller.transfer(msg.value);
        IERC721(nftContract).transferFrom(address(this),msg.sender,tokenId);
        idToMarketItem[itemId].owner = payable(msg.sender);
        idToMarketItem[itemId].sold = true;
        _itemSold.increment();
        owner.transfer(listingPrice);
    }  

    function fetchMarketItem() public view returns(MarketItem[] memory) {
        uint totalItemCount = _itemIds.current();
        uint unSoldItemCount =_itemIds.current() -  _itemSold.current();
        uint currIndex = 0;

        MarketItem[] memory items= new MarketItem[](unSoldItemCount);

        for (uint256 i = 0; i < totalItemCount; i++) {
                if(idToMarketItem[i+1].owner == address(0)){
                    uint currentId = idToMarketItem[i+1].itemId;
                    MarketItem storage currentItem = idToMarketItem[currentId];
                    items[currIndex] = currentItem;
                    currIndex++;
                }
        }

        return items;

    }

    function fetchMyNFTs() public view returns(MarketItem[] memory) {
        uint totalItemCount = _itemIds.current();
        uint currentIndex = 0;
        uint itemCount = 0;

        for (uint256 i = 0; i < totalItemCount; i++) {
            if(idToMarketItem[i+1].owner == msg.sender) {
                itemCount++;
            }
        }

        MarketItem[] memory items= new MarketItem[](itemCount); 

        for (uint256 i = 0; i < totalItemCount; i++) {
            if(idToMarketItem[i+1].owner == msg.sender) {
                uint currentId = idToMarketItem[i+1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex++;
            } 
        }

        return items;

    }

    function fetchItemsCreated() public view returns(MarketItem[] memory) {
        uint totalItemCount = _itemIds.current();
        uint itemsCreatedCount = 0;
        uint currentIndex = 0;

        for(uint256 i = 0; i < totalItemCount; i++) {
            if(idToMarketItem[i+1].seller == msg.sender) {
                itemsCreatedCount++;
            }
        }

        MarketItem[] memory items= new MarketItem[](itemsCreatedCount);

        for(uint256 i = 0; i < totalItemCount; i++) {
            if(idToMarketItem[i+1].seller == msg.sender){
                uint currentId = idToMarketItem[i+1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex++;
            }
        }

        return items;

    }

}
    