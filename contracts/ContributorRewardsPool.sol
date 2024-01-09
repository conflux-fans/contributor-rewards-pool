// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IDualSpaceNFT.sol";

// This contract is designed to be as simple as possible
// no admin because we can issue NFT from DualSpaceNFT to claim all token
contract ContributorRewardsPool{
    IDualSpaceNFT public nft;
    IERC20 public token;

    uint256 public baseTokenAmountPerClaim;
    mapping(uint256 => bool) public claimedTokenIds;

    constructor(address _nftAddress, address _tokenAddress, uint256 _baseTokenAmountPerClaim){
        nft = IDualSpaceNFT(_nftAddress);
        token = IERC20(_tokenAddress);
        baseTokenAmountPerClaim = _baseTokenAmountPerClaim;
    }

    function claimReward(uint256 tokenId) public returns (uint256 amount){
        require(nft.ownerOf(tokenId) == msg.sender, "Not the NFT owner");
        require(!rewardClaimed(tokenId), "Tokens already claimed for this NFT");

        amount = calculateRewardAmountForNFT(tokenId);

        claimedTokenIds[tokenId] = true;
        require(token.balanceOf(address(this)) >= amount, "Insufficient balance in the rewards pool");
        require(token.transfer(msg.sender, amount), "Token transfer failed");
    }

    function calculateRewardAmountForNFT(uint256 tokenId) public view returns (uint256 amount) {
        require(nft.ownerOf(tokenId) != address(0), "Token is not mint or already burnt");
        return baseTokenAmountPerClaim * nft.getTokenBatchRatio(tokenId) * nft.getTokenRarity(tokenId);
    }

    function rewardClaimed(uint256 tokenId) internal view returns (bool) {
        return claimedTokenIds[tokenId];
    }

    // if already claimed, will return 0, 
    // else return the amount that can be claimed
    function rewardAmountsCanClaimForNFTs(uint256[] memory tokenIds) external view returns (uint256[] memory) {
        uint256[] memory results = new uint256[](tokenIds.length);
        
        for (uint i = 0; i < tokenIds.length; i++) {
            if (rewardClaimed(tokenIds[i])) {
                results[i] = 0;
            } else {
                results[i] = calculateRewardAmountForNFT(tokenIds[i]);
            }
        }
        
        return results;
    }
}
