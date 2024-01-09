// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IDualSpaceNFT is IERC721 {
    function getTokenBatchRatio(uint256 tokenId) external view returns (uint8);
    function getTokenRarity(uint256 tokenId) external pure returns (uint8);
}
