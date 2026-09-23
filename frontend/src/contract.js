export const CONTRACT_ADDRESS =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const CONTRACT_ABI = [
  "function issueCredential(address student, string credentialType, string metadataURI, bytes32 credentialHash) returns (uint256)",

  "function getCredential(uint256 credentialId) view returns (uint256 id, address student, address issuer, string credentialType, string metadataURI, bytes32 credentialHash, uint256 issuedAt, bool revoked)",

  "function verifyCredential(uint256 credentialId) view returns (bool)",

  "function revokeCredential(uint256 credentialId)",

  "function authorizedIssuers(address) view returns (bool)",

  "function owner() view returns (address)"
];