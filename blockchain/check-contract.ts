import { network } from "hardhat";

const { viem } = await network.connect();

const skillProof = await viem.getContractAt(
  "SkillProof",
  "0x5FbDB2315678afecb367f032d93F642f64180aa3"
);

const owner = await skillProof.read.owner();

console.log("Contract owner:", owner);

const student =
  "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";

const authorized =
  await skillProof.read.authorizedIssuers([
    student
  ]);

console.log(
  "Student authorized as issuer:",
  authorized
);