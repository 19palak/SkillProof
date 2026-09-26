import { useState } from "react";
import { ethers } from "ethers";
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
} from "./contract";
import "./App.css";

function App() {
  // =========================
  // WALLET
  // =========================
  const [account, setAccount] = useState("");
  const [connecting, setConnecting] = useState(false);

  // =========================
  // ISSUE CREDENTIAL
  // =========================
  const [studentAddress, setStudentAddress] = useState("");
  const [credentialType, setCredentialType] = useState("");
  const [metadataURI, setMetadataURI] = useState("");

  // PDF
  const [selectedFile, setSelectedFile] = useState(null);
  const [credentialHash, setCredentialHash] = useState("");

  const [issuing, setIssuing] = useState(false);
  const [issuedCredentialId, setIssuedCredentialId] =
    useState("");

  // =========================
  // STUDENT DASHBOARD
  // =========================
  const [credentialId, setCredentialId] = useState("");
  const [credential, setCredential] = useState(null);
  const [fetching, setFetching] = useState(false);

  // =========================
  // VERIFY
  // =========================
  const [verifyId, setVerifyId] = useState("");
  const [verificationResult, setVerificationResult] =
    useState(null);
  const [verifying, setVerifying] = useState(false);

  // =========================
  // REVOKE
  // =========================
  const [revokeId, setRevokeId] = useState("");
  const [revoking, setRevoking] = useState(false);

  // =========================
  // MESSAGES
  // =========================
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================
  // CONNECT WALLET
  // =========================
  const connectWallet = async () => {
    setError("");
    setMessage("");

    try {
      if (!window.ethereum) {
        throw new Error(
          "MetaMask is not installed."
        );
      }

      setConnecting(true);

      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const accounts =
        await provider.send(
          "eth_requestAccounts",
          []
        );

      if (!accounts.length) {
        throw new Error(
          "No wallet account found."
        );
      }

      setAccount(accounts[0]);

      setMessage(
        "Wallet connected successfully."
      );
    } catch (err) {
      console.error(err);

      if (err.code === 4001) {
        setError(
          "MetaMask connection was rejected."
        );
      } else {
        setError(
          err.reason ||
            err.shortMessage ||
            err.message ||
            "Failed to connect wallet."
        );
      }
    } finally {
      setConnecting(false);
    }
  };

  // =========================
  // CONTRACT
  // =========================
  const getContract = async (
    withSigner = false
  ) => {
    if (!window.ethereum) {
      throw new Error(
        "MetaMask is not installed."
      );
    }

    const provider =
      new ethers.BrowserProvider(
        window.ethereum
      );

    if (withSigner) {
      const signer =
        await provider.getSigner();

      return new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );
    }

    return new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider
    );
  };

  // =========================
  // PDF UPLOAD + SHA256
  // =========================
  const handleFileChange = async (
    event
  ) => {
    setError("");
    setMessage("");
    setCredentialHash("");

    const file =
      event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (
      file.type !== "application/pdf" &&
      !file.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      setSelectedFile(null);

      event.target.value = "";

      setError(
        "Please select a PDF certificate."
      );

      return;
    }

    try {
      setSelectedFile(file);

      const fileBuffer =
        await file.arrayBuffer();

      const hashBuffer =
        await window.crypto.subtle.digest(
          "SHA-256",
          fileBuffer
        );

      const hashArray = Array.from(
        new Uint8Array(hashBuffer)
      );

      const hash =
        "0x" +
        hashArray
          .map((byte) =>
            byte
              .toString(16)
              .padStart(2, "0")
          )
          .join("");

      setCredentialHash(hash);

      setMessage(
        "Certificate fingerprint generated successfully."
      );
    } catch (err) {
      console.error(err);

      setSelectedFile(null);
      setCredentialHash("");

      setError(
        "Could not generate the certificate hash."
      );
    }
  };

  // =========================
  // ISSUE CREDENTIAL
  // =========================
  const issueCredential = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");
    setIssuedCredentialId("");

    try {
      if (!account) {
        throw new Error(
          "Please connect the authorized issuer wallet first."
        );
      }

      if (!studentAddress) {
        throw new Error(
          "Please enter the student wallet address."
        );
      }

      if (
        !ethers.isAddress(
          studentAddress
        )
      ) {
        throw new Error(
          "Invalid student wallet address."
        );
      }

      if (!credentialType.trim()) {
        throw new Error(
          "Please enter the credential type."
        );
      }

      if (!metadataURI.trim()) {
        throw new Error(
          "Please enter the IPFS metadata URI."
        );
      }

      if (!selectedFile) {
        throw new Error(
          "Please upload a PDF certificate."
        );
      }

      if (!credentialHash) {
        throw new Error(
          "Certificate hash has not been generated."
        );
      }

      if (
        !/^0x[a-fA-F0-9]{64}$/.test(
          credentialHash
        )
      ) {
        throw new Error(
          "Invalid SHA-256 hash."
        );
      }

      setIssuing(true);

      const contract =
        await getContract(true);

      // Check issuer permission
      const authorized =
        await contract.authorizedIssuers(
          account
        );

      if (!authorized) {
        throw new Error(
          "This wallet is not an authorized issuer. Connect Account #0 / the contract owner."
        );
      }

      setMessage(
        "Please confirm the transaction in MetaMask..."
      );

      const tx =
        await contract.issueCredential(
          studentAddress,
          credentialType.trim(),
          metadataURI.trim(),
          credentialHash
        );

      setMessage(
        "Transaction submitted. Waiting for confirmation..."
      );

      const receipt =
        await tx.wait();

      let newCredentialId = null;

      for (const log of receipt.logs) {
        try {
          const parsed =
            contract.interface.parseLog(
              log
            );

          if (
            parsed &&
            parsed.name ===
              "CredentialIssued"
          ) {
            newCredentialId =
              parsed.args.credentialId.toString();

            break;
          }
        } catch {
          // Ignore unrelated logs
        }
      }

      setIssuedCredentialId(
        newCredentialId ||
          "Transaction confirmed"
      );

      setMessage(
        "Credential issued successfully!"
      );

      // Clear form
      setStudentAddress("");
      setCredentialType("");
      setMetadataURI("");
      setSelectedFile(null);
      setCredentialHash("");

      const fileInput =
        document.getElementById(
          "certificate-file"
        );

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err) {
      console.error(
        "Issue credential error:",
        err
      );

      if (err.code === 4001) {
        setError(
          "Transaction rejected in MetaMask."
        );
      } else {
        setError(
          err.reason ||
            err.shortMessage ||
            err.message ||
            "Transaction failed."
        );
      }
    } finally {
      setIssuing(false);
    }
  };

  // =========================
  // FETCH CREDENTIAL
  // =========================
  const fetchCredential = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");
    setCredential(null);

    try {
      if (!credentialId) {
        throw new Error(
          "Please enter a credential ID."
        );
      }

      if (Number(credentialId) <= 0) {
        throw new Error(
          "Credential ID must be greater than 0."
        );
      }

      setFetching(true);

      const contract =
        await getContract(false);

      const result =
        await contract.getCredential(
          credentialId
        );

      const data = {
        id: result.id.toString(),
        student: result.student,
        issuer: result.issuer,
        credentialType:
          result.credentialType,
        metadataURI:
          result.metadataURI,
        credentialHash:
          result.credentialHash,
        issuedAt: new Date(
          Number(result.issuedAt) *
            1000
        ).toLocaleString(),
        revoked: result.revoked,
      };

      setCredential(data);

      setMessage(
        "Credential fetched successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err.reason ||
          err.shortMessage ||
          err.message ||
          "Failed to fetch credential."
      );
    } finally {
      setFetching(false);
    }
  };

  // =========================
  // VERIFY CREDENTIAL
  // =========================
  const verifyCredential = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");
    setVerificationResult(null);

    try {
      if (!verifyId) {
        throw new Error(
          "Please enter a credential ID."
        );
      }

      if (Number(verifyId) <= 0) {
        throw new Error(
          "Credential ID must be greater than 0."
        );
      }

      setVerifying(true);

      const contract =
        await getContract(false);

      const result =
        await contract.verifyCredential(
          verifyId
        );

      setVerificationResult(result);

      if (result) {
        setMessage(
          "Credential is valid and has not been revoked."
        );
      } else {
        setMessage(
          "Credential has been revoked."
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err.reason ||
          err.shortMessage ||
          err.message ||
          "Failed to verify credential."
      );
    } finally {
      setVerifying(false);
    }
  };

  // =========================
  // REVOKE CREDENTIAL
  // =========================
  const revokeCredential = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    try {
      if (!account) {
        throw new Error(
          "Please connect your wallet first."
        );
      }

      if (!revokeId) {
        throw new Error(
          "Please enter a credential ID."
        );
      }

      if (Number(revokeId) <= 0) {
        throw new Error(
          "Credential ID must be greater than 0."
        );
      }

      setRevoking(true);

      const contract =
        await getContract(true);

      setMessage(
        "Please confirm the transaction in MetaMask..."
      );

      const tx =
        await contract.revokeCredential(
          revokeId
        );

      setMessage(
        "Revocation submitted. Waiting for confirmation..."
      );

      await tx.wait();

      setMessage(
        "Credential revoked successfully."
      );

      setRevokeId("");
    } catch (err) {
      console.error(err);

      if (err.code === 4001) {
        setError(
          "Transaction rejected in MetaMask."
        );
      } else {
        setError(
          err.reason ||
            err.shortMessage ||
            err.message ||
            "Failed to revoke credential."
        );
      }
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="app">

      {/* ================= NAVBAR ================= */}
      <nav className="navbar">
        <div className="logo">
          ◆SkillProof
        </div>

        <div className="nav-links">
          <a href="#how-it-works">
            How It Works
          </a>

          <a href="#features">
            Features
          </a>

          <a href="#issue">
            Issue Credential
          </a>

          <a href="#student">
            Student Dashboard
          </a>

          <a href="#verify">
            Verify
          </a>

          <a href="#revoke">
            Revoke
          </a>
        </div>

        <button
          className="connect-button"
          onClick={connectWallet}
          disabled={connecting}
        >
          {connecting
            ? "Connecting..."
            : account
            ? `${account.slice(
                0,
                6
              )}...${account.slice(-4)}`
            : "Connect Wallet"}
        </button>
      </nav>

      {/* ================= HERO ================= */}
      <section className="hero">
        <div className="hero-content">

          <div className="hero-badge">
            Blockchain Credential Platform
          </div>

          <h1>
            Own Your Credentials.
            <br />
            <span>
              Prove Your Skills.
            </span>
          </h1>

          <p>
            SkillProof enables institutions
            to issue trusted digital
            credentials and allows students
            to prove their achievements
            through blockchain verification.
          </p>

          <button
            className="primary-button"
            onClick={connectWallet}
          >
            {account
              ? "Wallet Connected"
              : "Connect Wallet"}
          </button>

        </div>
      </section>

      {/* ================= MESSAGES ================= */}
      {(message || error) && (
        <div className="message-section">

          {message && (
            <div className="success-message">
              ✓ {message}
            </div>
          )}

          {error && (
            <div className="error-message">
              ✕ {error}
            </div>
          )}

        </div>
      )}

      {/* ================= HOW IT WORKS ================= */}
      <section
        id="how-it-works"
        className="section"
      >
        <div className="section-heading">
          <span>HOW IT WORKS</span>
          <h2>
            Credentials you can trust.
          </h2>
        </div>

        <div className="cards">

          <div className="card">
            <div className="card-number">
              01
            </div>

            <h3>
              Issue
            </h3>

            <p>
              Authorized issuers create
              blockchain-backed credentials
              for students.
            </p>
          </div>

          <div className="card">
            <div className="card-number">
              02
            </div>

            <h3>
              Own
            </h3>

            <p>
              Students receive credentials
              linked to their blockchain
              wallet address.
            </p>
          </div>

          <div className="card">
            <div className="card-number">
              03
            </div>

            <h3>
              Verify
            </h3>

            <p>
              Employers can verify the
              authenticity and current
              status of credentials.
            </p>
          </div>

        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <section
        id="features"
        className="section features-section"
      >
        <div className="section-heading">
          <span>FEATURES</span>

          <h2>
            Built for trusted credentials.
          </h2>
        </div>

        <div className="cards">

          <div className="card">
            <div className="feature-icon">
              ⛓
            </div>

            <h3>
              Blockchain Verified
            </h3>

            <p>
              Credential information is
              verified through a smart
              contract.
            </p>
          </div>

          <div className="card">
            <div className="feature-icon">
              ◈
            </div>

            <h3>
              Decentralized
            </h3>

            <p>
              Verification is powered by
              blockchain rather than relying
              only on a centralized database.
            </p>
          </div>

          <div className="card">
            <div className="feature-icon">
              ✓
            </div>

            <h3>
              Revocable
            </h3>

            <p>
              The issuing organization can
              revoke credentials when
              necessary.
            </p>
          </div>

        </div>
      </section>

      {/* ================= ISSUE ================= */}
      <section
        id="issue"
        className="section form-section"
      >
        <div className="section-heading">
          <span>ISSUER</span>

          <h2>
            Issue a Credential
          </h2>

          <p>
            Connect the authorized issuer
            wallet to create a blockchain
            credential.
          </p>
        </div>

        <form
          className="credential-form"
          onSubmit={issueCredential}
        >

          {/* STUDENT ADDRESS */}
          <div className="form-group">

            <label>
              Student Wallet Address
            </label>

            <input
              type="text"
              placeholder="0x..."
              value={studentAddress}
              onChange={(e) =>
                setStudentAddress(
                  e.target.value
                )
              }
            />

          </div>

          {/* CREDENTIAL TYPE */}
          <div className="form-group">

            <label>
              Credential Type
            </label>

            <input
              type="text"
              placeholder="Machine Learning Internship"
              value={credentialType}
              onChange={(e) =>
                setCredentialType(
                  e.target.value
                )
              }
            />

          </div>

          {/* PDF */}
          <div className="form-group">

            <label>
              Upload Certificate
            </label>

            <div className="file-upload">

              <input
                id="certificate-file"
                type="file"
                accept=".pdf,application/pdf"
                onChange={
                  handleFileChange
                }
              />

            </div>

            {selectedFile && (
              <div className="selected-file">

                <div>
                  <strong>
                    Selected file:
                  </strong>

                  <span>
                    {selectedFile.name}
                  </span>
                </div>

                <small>
                  {(
                    selectedFile.size /
                    1024
                  ).toFixed(1)}{" "}
                  KB
                </small>

              </div>
            )}

          </div>

          {/* HASH */}
          <div className="form-group">

            <label>
              SHA-256 Certificate Hash
            </label>

            <input
              type="text"
              value={credentialHash}
              placeholder="Upload a PDF to generate its hash"
              readOnly
            />

            {credentialHash && (
              <div className="hash-success">
                ✓ Certificate fingerprint
                generated
              </div>
            )}

          </div>

          {/* IPFS */}
          <div className="form-group">

            <label>
              IPFS Metadata URI
            </label>

            <input
              type="text"
              placeholder="ipfs://..."
              value={metadataURI}
              onChange={(e) =>
                setMetadataURI(
                  e.target.value
                )
              }
            />

            <small className="field-help">
              Enter the IPFS URI containing
              the certificate metadata.
            </small>

          </div>

          <button
            type="submit"
            className="primary-button issue-button"
            disabled={issuing}
          >
            {issuing
              ? "Issuing Credential..."
              : "Issue Credential"}
          </button>

        </form>

        {issuedCredentialId && (
          <div className="issued-box">

            <div className="issued-check">
              ✓
            </div>

            <div>
              <h3>
                Credential Issued
              </h3>

              <p>
                Credential ID:{" "}
                <strong>
                  {issuedCredentialId}
                </strong>
              </p>
            </div>

          </div>
        )}

      </section>

      {/* ================= STUDENT ================= */}
      <section
        id="student"
        className="section form-section"
      >
        <div className="section-heading">
          <span>STUDENT</span>

          <h2>
            Your Credential
          </h2>

          <p>
            View and share your verified
            blockchain credential.
          </p>
        </div>

        <form
          className="small-form"
          onSubmit={fetchCredential}
        >

          <input
            type="number"
            min="1"
            placeholder="Enter credential ID"
            value={credentialId}
            onChange={(e) =>
              setCredentialId(
                e.target.value
              )
            }
          />

          <button
            type="submit"
            className="primary-button"
            disabled={fetching}
          >
            {fetching
              ? "Fetching..."
              : "Fetch Credential"}
          </button>

        </form>

        {credential && (
          <div className="credential-result">

            <div className="credential-header">
              <div>
                <span>
                  VERIFIED CREDENTIAL
                </span>

                <h3>
                  {credential.credentialType}
                </h3>
              </div>

              <div
                className={
                  credential.revoked
                    ? "status revoked"
                    : "status active"
                }
              >
                {credential.revoked
                  ? "REVOKED"
                  : "ACTIVE"}
              </div>
            </div>

            <div className="credential-grid">

              <div>
                <span>
                  Credential ID
                </span>

                <strong>
                  #{credential.id}
                </strong>
              </div>

              <div>
                <span>
                  Student
                </span>

                <strong className="address">
                  {credential.student}
                </strong>
              </div>

              <div>
                <span>
                  Issuer
                </span>

                <strong className="address">
                  {credential.issuer}
                </strong>
              </div>

              <div>
                <span>
                  Issued At
                </span>

                <strong>
                  {credential.issuedAt}
                </strong>
              </div>

            </div>

            <div className="credential-detail">

              <span>
                IPFS Metadata
              </span>

              <p>
                {credential.metadataURI}
              </p>

            </div>

            <div className="credential-detail">

              <span>
                SHA-256 Certificate Hash
              </span>

              <p className="hash-text">
                {credential.credentialHash}
              </p>

            </div>

          </div>
        )}

      </section>

      {/* ================= VERIFY ================= */}
      <section
        id="verify"
        className="section verify-section"
      >
        <div className="section-heading">
          <span>VERIFICATION</span>

          <h2>
            Verify a Credential
          </h2>

          <p>
            Anyone can verify whether a
            credential is currently valid.
          </p>
        </div>

        <form
          className="small-form"
          onSubmit={verifyCredential}
        >

          <input
            type="number"
            min="1"
            placeholder="Enter credential ID"
            value={verifyId}
            onChange={(e) =>
              setVerifyId(
                e.target.value
              )
            }
          />

          <button
            type="submit"
            className="primary-button"
            disabled={verifying}
          >
            {verifying
              ? "Verifying..."
              : "Verify Credential"}
          </button>

        </form>

        {verificationResult !== null && (
          <div
            className={
              verificationResult
                ? "verification valid"
                : "verification invalid"
            }
          >

            <div className="verification-icon">
              {verificationResult
                ? "✓"
                : "✕"}
            </div>

            <div>

              <h3>
                {verificationResult
                  ? "Credential Verified"
                  : "Credential Revoked"}
              </h3>

              <p>
                {verificationResult
                  ? "This credential exists on the blockchain and has not been revoked."
                  : "This credential has been revoked by its issuer."}
              </p>

            </div>

          </div>
        )}

      </section>

      {/* ================= REVOKE ================= */}
      <section
        id="revoke"
        className="section form-section"
      >
        <div className="section-heading">
          <span>ISSUER</span>

          <h2>
            Revoke Credential
          </h2>

          <p>
            Only the original issuer of a
            credential can revoke it.
          </p>
        </div>

        <form
          className="small-form"
          onSubmit={revokeCredential}
        >

          <input
            type="number"
            min="1"
            placeholder="Enter credential ID"
            value={revokeId}
            onChange={(e) =>
              setRevokeId(
                e.target.value
              )
            }
          />

          <button
            type="submit"
            className="danger-button"
            disabled={revoking}
          >
            {revoking
              ? "Revoking..."
              : "Revoke Credential"}
          </button>

        </form>
      </section>

      {/* ================= FOOTER ================= */}
      <footer>

        <div className="footer-logo">
          ◆SkillProof
        </div>

        <p>
          Own Your Credentials. Prove Your
          Skills.
        </p>

        <small>
          © 2026 SkillProof — Decentralized
          Credential Platform
        </small>

      </footer>

    </div>
  );
}

export default App;