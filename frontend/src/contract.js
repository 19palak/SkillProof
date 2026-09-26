export const CONTRACT_ADDRESS =
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

export const CONTRACT_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },

  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "issuer",
        type: "address",
      },
    ],
    name: "IssuerAuthorized",
    type: "event",
  },

  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "issuer",
        type: "address",
      },
    ],
    name: "IssuerRevoked",
    type: "event",
  },

  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "credentialId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "student",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "issuer",
        type: "address",
      },
    ],
    name: "CredentialIssued",
    type: "event",
  },

  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "credentialId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "issuer",
        type: "address",
      },
    ],
    name: "CredentialRevoked",
    type: "event",
  },

  {
    inputs: [
      {
        internalType: "address",
        name: "issuer",
        type: "address",
      },
    ],
    name: "authorizeIssuer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "authorizedIssuers",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [
      {
        internalType: "uint256",
        name: "credentialId",
        type: "uint256",
      },
    ],
    name: "getCredential",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "student",
            type: "address",
          },
          {
            internalType: "address",
            name: "issuer",
            type: "address",
          },
          {
            internalType: "string",
            name: "credentialType",
            type: "string",
          },
          {
            internalType: "string",
            name: "metadataURI",
            type: "string",
          },
          {
            internalType: "bytes32",
            name: "credentialHash",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "issuedAt",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "revoked",
            type: "bool",
          },
        ],
        internalType: "struct SkillProof.Credential",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [
      {
        internalType: "address",
        name: "student",
        type: "address",
      },
      {
        internalType: "string",
        name: "credentialType",
        type: "string",
      },
      {
        internalType: "string",
        name: "metadataURI",
        type: "string",
      },
      {
        internalType: "bytes32",
        name: "credentialHash",
        type: "bytes32",
      },
    ],
    name: "issueCredential",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },

  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },

  {
    inputs: [
      {
        internalType: "uint256",
        name: "credentialId",
        type: "uint256",
      },
    ],
    name: "revokeCredential",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  {
    inputs: [
      {
        internalType: "address",
        name: "issuer",
        type: "address",
      },
    ],
    name: "revokeIssuer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  {
    inputs: [
      {
        internalType: "uint256",
        name: "credentialId",
        type: "uint256",
      },
    ],
    name: "verifyCredential",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];