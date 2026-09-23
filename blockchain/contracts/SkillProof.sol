// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SkillProof {

    struct Credential {
        uint256 id;
        address student;
        address issuer;
        string credentialType;
        string metadataURI;
        bytes32 credentialHash;
        uint256 issuedAt;
        bool revoked;
    }

    uint256 private nextCredentialId = 1;

    mapping(uint256 => Credential) private credentials;

    // Stores which addresses are authorized to issue credentials
    mapping(address => bool) public authorizedIssuers;

    // The contract deployer becomes the first authorized issuer
    address public owner;

    event IssuerAuthorized(address indexed issuer);
    event IssuerRevoked(address indexed issuer);

    event CredentialIssued(
        uint256 indexed credentialId,
        address indexed student,
        address indexed issuer
    );

    event CredentialRevoked(
        uint256 indexed credentialId,
        address indexed issuer
    );

    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only owner can perform this action"
        );
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(
            authorizedIssuers[msg.sender],
            "Not an authorized issuer"
        );
        _;
    }

    function authorizeIssuer(
        address issuer
    ) public onlyOwner {

        authorizedIssuers[issuer] = true;

        emit IssuerAuthorized(issuer);
    }

    function revokeIssuer(
        address issuer
    ) public onlyOwner {

        authorizedIssuers[issuer] = false;

        emit IssuerRevoked(issuer);
    }

    function issueCredential(
        address student,
        string memory credentialType,
        string memory metadataURI,
        bytes32 credentialHash
    )
        public
        onlyAuthorizedIssuer
        returns (uint256)
    {
        uint256 credentialId = nextCredentialId;

        credentials[credentialId] = Credential({
            id: credentialId,
            student: student,
            issuer: msg.sender,
            credentialType: credentialType,
            metadataURI: metadataURI,
            credentialHash: credentialHash,
            issuedAt: block.timestamp,
            revoked: false
        });

        nextCredentialId++;

        emit CredentialIssued(
            credentialId,
            student,
            msg.sender
        );

        return credentialId;
    }

    function getCredential(
        uint256 credentialId
    )
        public
        view
        returns (Credential memory)
    {
        require(
            credentials[credentialId].id != 0,
            "Credential does not exist"
        );

        return credentials[credentialId];
    }

    function verifyCredential(
        uint256 credentialId
    )
        public
        view
        returns (bool)
    {
        require(
            credentials[credentialId].id != 0,
            "Credential does not exist"
        );

        return !credentials[credentialId].revoked;
    }

    function revokeCredential(
        uint256 credentialId
    )
        public
    {
        require(
            credentials[credentialId].id != 0,
            "Credential does not exist"
        );

        require(
            credentials[credentialId].issuer == msg.sender,
            "Only issuer can revoke"
        );

        credentials[credentialId].revoked = true;

        emit CredentialRevoked(
            credentialId,
            msg.sender
        );
    }
}