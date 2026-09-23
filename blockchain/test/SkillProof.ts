import { describe, it } from "node:test";
import { expect } from "chai";
import { network } from "hardhat";

describe("SkillProof", function () {
  async function deploySkillProofFixture() {
    const { viem } = await network.connect();

    const [issuer, student, employer] =
      await viem.getWalletClients();

    const skillProof = await viem.deployContract(
      "SkillProof"
    );

    return {
      skillProof,
      issuer,
      student,
      employer,
    };
  }

  // Test 1: Issue a credential
  it("should issue a credential", async function () {
    const {
      skillProof,
      student,
      issuer,
    } = await deploySkillProofFixture();

    const credentialHash =
      "0x1234567890123456789012345678901234567890123456789012345678901234";

    await skillProof.write.issueCredential([
      student.account.address,
      "Machine Learning Internship",
      "ipfs://example-credential",
      credentialHash,
    ]);

    const credential =
      await skillProof.read.getCredential([1n]);

    expect(credential.id).to.equal(1n);

    expect(credential.student.toLowerCase())
      .to.equal(
        student.account.address.toLowerCase()
      );

    expect(credential.issuer.toLowerCase())
      .to.equal(
        issuer.account.address.toLowerCase()
      );

    expect(credential.credentialType)
      .to.equal("Machine Learning Internship");

    expect(credential.metadataURI)
      .to.equal("ipfs://example-credential");

    expect(credential.credentialHash)
      .to.equal(credentialHash);

    expect(credential.issuedAt > 0n).to.equal(true);

    expect(credential.revoked)
      .to.equal(false);
  });

  // Test 2: Verify a valid credential
  it("should verify a valid credential", async function () {
    const {
      skillProof,
      student,
    } = await deploySkillProofFixture();

    const credentialHash =
      "0x1234567890123456789012345678901234567890123456789012345678901234";

    await skillProof.write.issueCredential([
      student.account.address,
      "Web Development Certificate",
      "ipfs://example",
      credentialHash,
    ]);

    const isValid =
      await skillProof.read.verifyCredential([1n]);

    expect(isValid).to.equal(true);
  });

  // Test 3: Revoke a credential
  it("should allow the issuer to revoke a credential", async function () {
    const {
      skillProof,
      student,
    } = await deploySkillProofFixture();

    const credentialHash =
      "0x1234567890123456789012345678901234567890123456789012345678901234";

    await skillProof.write.issueCredential([
      student.account.address,
      "Blockchain Certificate",
      "ipfs://example",
      credentialHash,
    ]);

    // Credential should initially be valid
    let isValid =
      await skillProof.read.verifyCredential([1n]);

    expect(isValid).to.equal(true);

    // Issuer revokes the credential
    await skillProof.write.revokeCredential([1n]);

    // Credential should now be invalid
    isValid =
      await skillProof.read.verifyCredential([1n]);

    expect(isValid).to.equal(false);
  });
});