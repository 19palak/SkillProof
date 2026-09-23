import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SkillProofModule = buildModule("SkillProofModule", (m) => {
  const skillProof = m.contract("SkillProof");

  return {
    skillProof,
  };
});

export default SkillProofModule;