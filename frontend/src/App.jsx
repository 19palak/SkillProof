import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { QRCodeCanvas } from "qrcode.react";
import "./App.css";

import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
} from "./contract";

function App() {
  // =========================
  // WALLET
  // =========================
  const [account, setAccount] = useState("");
  const [walletStatus, setWalletStatus] = useState("");

  // =========================
  // INSTITUTION / ISSUE
  // =========================
  const [studentAddress, setStudentAddress] = useState("");
  const [credentialType, setCredentialType] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [credentialHash, setCredentialHash] = useState("");
  const [metadataURI, setMetadataURI] = useState("");

  const [uploading, setUploading] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [issueStatus, setIssueStatus] = useState("");

  // =========================
  // STUDENT
  // =========================
  const [credentialId, setCredentialId] = useState("");
  const [studentCredential, setStudentCredential] =
    useState(null);

  const [studentStatus, setStudentStatus] =
    useState("");

  // =========================
  // EMPLOYER
  // =========================
  const [verifyId, setVerifyId] = useState("");
  const [verificationResult, setVerificationResult] =
    useState(null);

  const [verifyStatus, setVerifyStatus] =
    useState("");

  // =========================
  // REVOCATION
  // =========================
  const [revokeId, setRevokeId] = useState("");
  const [revokeStatus, setRevokeStatus] =
    useState("");

  // =========================
  // CONNECT WALLET
  // =========================
  async function connectWallet() {
    try {
      if (!window.ethereum) {
        setWalletStatus(
          "MetaMask is not installed. Please install MetaMask."
        );
        return;
      }

      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const accounts =
        await provider.send(
          "eth_requestAccounts",
          []
        );

      if (accounts.length === 0) {
        setWalletStatus(
          "No wallet account found."
        );
        return;
      }

      setAccount(accounts[0]);

      setWalletStatus(
        "Wallet connected successfully."
      );

    } catch (error) {
      console.error(error);

      setWalletStatus(
        error.message ||
          "Failed to connect wallet."
      );
    }
  }

  // =========================
  // HANDLE ACCOUNT CHANGE
  // =========================
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (
      accounts
    ) => {
      if (accounts.length === 0) {
        setAccount("");
        setWalletStatus(
          "Wallet disconnected."
        );
      } else {
        setAccount(accounts[0]);
      }
    };

    window.ethereum.on(
      "accountsChanged",
      handleAccountsChanged
    );

    return () => {
      window.ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );
    };
  }, []);

  // =========================
  // CONTRACT HELPER
  // =========================
  async function getContract() {
    if (!window.ethereum) {
      throw new Error(
        "MetaMask is not installed."
      );
    }

    const provider =
      new ethers.BrowserProvider(
        window.ethereum
      );

    const signer =
      await provider.getSigner();

    const contract =
      new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

    return contract;
  }

  // =========================
  // PDF UPLOAD + SHA256 HASH
  // =========================
  async function handleDocumentUpload(
    event
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFile(file);
    setCredentialHash("");
    setMetadataURI("");
    setIssueStatus("");

    // Only PDF
    if (
      file.type !==
      "application/pdf"
    ) {
      setIssueStatus(
        "Please upload a PDF certificate."
      );

      setSelectedFile(null);

      return;
    }

    // Maximum 10 MB
    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setIssueStatus(
        "PDF must be smaller than 10 MB."
      );

      setSelectedFile(null);

      return;
    }

    try {
      setUploading(true);

      // ---------------------------------
      // STEP 1: Generate SHA-256 hash
      // ---------------------------------
      const arrayBuffer =
        await file.arrayBuffer();

      const hashBuffer =
        await window.crypto.subtle.digest(
          "SHA-256",
          arrayBuffer
        );

      const hashArray =
        Array.from(
          new Uint8Array(hashBuffer)
        );

      const hashHex =
        hashArray
          .map((byte) =>
            byte
              .toString(16)
              .padStart(2, "0")
          )
          .join("");

      const finalHash =
        `0x${hashHex}`;

      setCredentialHash(
        finalHash
      );

      // ---------------------------------
      // STEP 2: Upload PDF to backend
      // ---------------------------------
      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      const response =
        await fetch(
          "http://localhost:5001/upload",
          {
            method: "POST",
            body: formData,
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.details ||
            result.error ||
            "Failed to upload document."
        );
      }

      // ---------------------------------
      // STEP 3: Store IPFS URI
      // ---------------------------------
      setMetadataURI(
        result.ipfsURI
      );

      setIssueStatus(
        "Certificate uploaded to IPFS and SHA-256 hash generated successfully."
      );

    } catch (error) {
      console.error(
        "Upload error:",
        error
      );

      setIssueStatus(
        error.message ||
          "Failed to upload certificate."
      );

      setCredentialHash("");
      setMetadataURI("");

    } finally {
      setUploading(false);
    }
  }

  // =========================
  // ISSUE CREDENTIAL
  // =========================
  async function issueCredential() {
    try {
      setIssueStatus("");

      if (!account) {
        setIssueStatus(
          "Please connect your wallet first."
        );
        return;
      }

      if (
        !ethers.isAddress(
          studentAddress
        )
      ) {
        setIssueStatus(
          "Please enter a valid student wallet address."
        );
        return;
      }

      if (
        !credentialType.trim()
      ) {
        setIssueStatus(
          "Please enter the credential type."
        );
        return;
      }

      if (!selectedFile) {
        setIssueStatus(
          "Please upload a certificate PDF."
        );
        return;
      }

      if (!credentialHash) {
        setIssueStatus(
          "Certificate hash has not been generated."
        );
        return;
      }

      if (!metadataURI) {
        setIssueStatus(
          "Certificate has not been uploaded to IPFS."
        );
        return;
      }

      setIssuing(true);

      const contract =
        await getContract();

      // Check whether current wallet
      // is an authorized issuer
      const isAuthorized =
        await contract.authorizedIssuers(
          account
        );

      if (!isAuthorized) {
        setIssueStatus(
          "This wallet is not an authorized issuer."
        );

        setIssuing(false);

        return;
      }

      setIssueStatus(
        "Please confirm the transaction in MetaMask..."
      );

      const transaction =
        await contract.issueCredential(
          studentAddress,
          credentialType,
          metadataURI,
          credentialHash
        );

      setIssueStatus(
        "Transaction submitted. Waiting for blockchain confirmation..."
      );

      const receipt =
        await transaction.wait();

      console.log(
        "Transaction receipt:",
        receipt
      );

      // ---------------------------------
      // Try to extract CredentialIssued event
      // ---------------------------------
      let issuedCredentialId = "";

      try {
        for (
          const log of receipt.logs
        ) {
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
              issuedCredentialId =
                parsed.args.credentialId.toString();

              break;
            }
          } catch {
            // Ignore unrelated logs
          }
        }
      } catch (error) {
        console.log(
          "Could not parse event:",
          error
        );
      }

      if (issuedCredentialId) {
        setCredentialId(
          issuedCredentialId
        );

        setIssueStatus(
          `Credential issued successfully! Credential ID: ${issuedCredentialId}`
        );
      } else {
        setIssueStatus(
          "Credential issued successfully!"
        );
      }

      // Reset form
      setStudentAddress("");
      setCredentialType("");
      setSelectedFile(null);
      setCredentialHash("");
      setMetadataURI("");

      // Reset file input
      const fileInput =
        document.getElementById(
          "certificateFile"
        );

      if (fileInput) {
        fileInput.value = "";
      }

    } catch (error) {
      console.error(
        "Issue credential error:",
        error
      );

      if (
        error.code ===
        "ACTION_REJECTED"
      ) {
        setIssueStatus(
          "Transaction rejected in MetaMask."
        );
      } else {
        setIssueStatus(
          error.reason ||
            error.shortMessage ||
            error.message ||
            "Failed to issue credential."
        );
      }

    } finally {
      setIssuing(false);
    }
  }

  // =========================
  // FETCH STUDENT CREDENTIAL
  // =========================
  async function fetchCredential(
    id = credentialId
  ) {
    try {
      setStudentStatus("");
      setStudentCredential(null);

      if (!id) {
        setStudentStatus(
          "Please enter a credential ID."
        );
        return;
      }

      const numericId =
        BigInt(id);

      const contract =
        await getContract();

      const credential =
        await contract.getCredential(
          numericId
        );

      const formattedCredential = {
        id: credential.id.toString(),
        student:
          credential.student,
        issuer:
          credential.issuer,
        credentialType:
          credential.credentialType,
        metadataURI:
          credential.metadataURI,
        credentialHash:
          credential.credentialHash,
        issuedAt:
          credential.issuedAt.toString(),
        revoked:
          credential.revoked,
      };

      setStudentCredential(
        formattedCredential
      );

      setStudentStatus(
        "Credential loaded successfully."
      );

    } catch (error) {
      console.error(
        "Fetch credential error:",
        error
      );

      setStudentStatus(
        error.reason ||
          error.shortMessage ||
          error.message ||
          "Credential not found."
      );
    }
  }

  // =========================
  // VERIFY CREDENTIAL
  // =========================
  async function verifyCredential(
    id = verifyId
  ) {
    try {
      setVerifyStatus("");
      setVerificationResult(null);

      if (!id) {
        setVerifyStatus(
          "Please enter a credential ID."
        );
        return;
      }

      const numericId =
        BigInt(id);

      const contract =
        await getContract();

      const valid =
        await contract.verifyCredential(
          numericId
        );

      const credential =
        await contract.getCredential(
          numericId
        );

      setVerificationResult({
        valid,
        id:
          credential.id.toString(),
        student:
          credential.student,
        issuer:
          credential.issuer,
        credentialType:
          credential.credentialType,
        metadataURI:
          credential.metadataURI,
        credentialHash:
          credential.credentialHash,
        issuedAt:
          credential.issuedAt.toString(),
        revoked:
          credential.revoked,
      });

      if (valid) {
        setVerifyStatus(
          "Credential verified successfully."
        );
      } else {
        setVerifyStatus(
          "Credential has been revoked."
        );
      }

    } catch (error) {
      console.error(
        "Verification error:",
        error
      );

      setVerifyStatus(
        error.reason ||
          error.shortMessage ||
          error.message ||
          "Credential verification failed."
      );
    }
  }

  // =========================
  // QR VERIFICATION
  // =========================
  async function verifyFromQR(
    id
  ) {
    if (!id) return;

    setVerifyId(id);

    await verifyCredential(id);
  }

  // =========================
  // CHECK URL FOR QR
  // =========================
  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const qrCredentialId =
      params.get("verify");

    if (qrCredentialId) {
      setVerifyId(
        qrCredentialId
      );

      verifyFromQR(
        qrCredentialId
      );
    }
  }, []);

  // =========================
  // REVOKE CREDENTIAL
  // =========================
  async function revokeCredential() {
    try {
      setRevokeStatus("");

      if (!account) {
        setRevokeStatus(
          "Please connect the issuer wallet first."
        );
        return;
      }

      if (!revokeId) {
        setRevokeStatus(
          "Please enter a credential ID."
        );
        return;
      }

      const numericId =
        BigInt(revokeId);

      const contract =
        await getContract();

      setRevokeStatus(
        "Please confirm the revocation transaction in MetaMask..."
      );

      const transaction =
        await contract.revokeCredential(
          numericId
        );

      setRevokeStatus(
        "Revocation transaction submitted. Waiting for confirmation..."
      );

      await transaction.wait();

      setRevokeStatus(
        "Credential revoked successfully."
      );

    } catch (error) {
      console.error(
        "Revoke error:",
        error
      );

      if (
        error.code ===
        "ACTION_REJECTED"
      ) {
        setRevokeStatus(
          "Transaction rejected in MetaMask."
        );
      } else {
        setRevokeStatus(
          error.reason ||
            error.shortMessage ||
            error.message ||
            "Failed to revoke credential."
        );
      }
    }
  }

  // =========================
  // FORMAT ADDRESS
  // =========================
  function shortAddress(
    address
  ) {
    if (!address) return "";

    return `${address.slice(
      0,
      6
    )}...${address.slice(-4)}`;
  }

  // =========================
  // FORMAT DATE
  // =========================
  function formatDate(
    timestamp
  ) {
    if (!timestamp) {
      return "N/A";
    }

    return new Date(
      Number(timestamp) * 1000
    ).toLocaleString();
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="app">

      {/* =========================
          NAVBAR
      ========================= */}
      <nav className="navbar">
        <div className="nav-container">

          <div className="logo">
            <span className="logo-icon">
              ◆
            </span>

            <span>
              SkillProof
            </span>
          </div>

          <div className="nav-links">
            <a href="#how-it-works">
              How It Works
            </a>

            <a href="#features">
              Features
            </a>

            <button
              className="connect-btn"
              onClick={
                connectWallet
              }
            >
              {account
                ? shortAddress(
                    account
                  )
                : "Connect Wallet"}
            </button>
          </div>

        </div>
      </nav>

      {/* =========================
          HERO
      ========================= */}
      <section className="hero">

        <div className="hero-content">

          <div className="hero-badge">
            Blockchain-Powered Credential Verification
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
            to issue tamper-evident digital
            credentials that students can
            securely share and employers can
            instantly verify.
          </p>

          <div className="hero-buttons">

            <a
              href="#issue"
              className="primary-btn"
            >
              Issue Credential
            </a>

            <a
              href="#verify"
              className="secondary-btn"
            >
              Verify Credential
            </a>

          </div>

        </div>

      </section>

      {/* =========================
          WALLET STATUS
      ========================= */}
      {walletStatus && (
        <div className="status-message">
          {walletStatus}
        </div>
      )}

      {/* =========================
          INSTITUTION
      ========================= */}
      <section
        id="issue"
        className="section"
      >

        <div className="section-header">

          <span className="section-tag">
            INSTITUTION
          </span>

          <h2>
            Issue a Credential
          </h2>

          <p>
            Institutions can issue
            blockchain-backed credentials
            to students.
          </p>

        </div>

        <div className="card">

          <div className="form-group">

            <label>
              Student Wallet Address
            </label>

            <input
              type="text"
              placeholder="0x..."
              value={
                studentAddress
              }
              onChange={(e) =>
                setStudentAddress(
                  e.target.value
                )
              }
            />

          </div>

          <div className="form-group">

            <label>
              Credential Type
            </label>

            <input
              type="text"
              placeholder="e.g. Machine Learning Internship"
              value={
                credentialType
              }
              onChange={(e) =>
                setCredentialType(
                  e.target.value
                )
              }
            />

          </div>

          <div className="form-group">

            <label>
              Upload Certificate
            </label>

            <input
              id="certificateFile"
              type="file"
              accept="application/pdf"
              onChange={
                handleDocumentUpload
              }
            />

            {selectedFile && (
              <div className="file-preview">

                <strong>
                  Selected file:
                </strong>

                <span>
                  {selectedFile.name}
                </span>

              </div>
            )}

          </div>

          {uploading && (
            <div className="status-message">
              Uploading certificate to
              IPFS and generating hash...
            </div>
          )}

          {credentialHash && (
            <div className="form-group">

              <label>
                SHA-256 Certificate Hash
              </label>

              <input
                className="hash-input"
                type="text"
                value={
                  credentialHash
                }
                readOnly
              />

              <small className="hash-success">
                ✓ Certificate fingerprint
                generated
              </small>

            </div>
          )}

          {metadataURI && (
            <div className="form-group">

              <label>
                IPFS Metadata URI
              </label>

              <input
                type="text"
                value={
                  metadataURI
                }
                readOnly
              />

              <small className="hash-success">
                ✓ Certificate stored on
                IPFS
              </small>

            </div>
          )}

          <button
            className="primary-btn full-width"
            onClick={
              issueCredential
            }
            disabled={
              issuing ||
              uploading
            }
          >
            {issuing
              ? "Issuing Credential..."
              : "Issue Credential"}
          </button>

          {issueStatus && (
            <div className="status-message">
              {issueStatus}
            </div>
          )}

        </div>

      </section>

      {/* =========================
          STUDENT DASHBOARD
      ========================= */}
      <section className="section">

        <div className="section-header">

          <span className="section-tag">
            STUDENT
          </span>

          <h2>
            Your Credential
          </h2>

          <p>
            View and share your verified
            blockchain credential.
          </p>

        </div>

        <div className="card">

          <div className="form-group">

            <label>
              Credential ID
            </label>

            <input
              type="number"
              placeholder="Enter credential ID"
              value={
                credentialId
              }
              onChange={(e) =>
                setCredentialId(
                  e.target.value
                )
              }
            />

          </div>

          <button
            className="primary-btn"
            onClick={() =>
              fetchCredential()
            }
          >
            View Credential
          </button>

          {studentStatus && (
            <div className="status-message">
              {studentStatus}
            </div>
          )}

          {studentCredential && (
            <div className="credential-card">

              <div className="credential-header">

                <span>
                  BLOCKCHAIN CREDENTIAL
                </span>

                <span
                  className={
                    studentCredential.revoked
                      ? "status revoked"
                      : "status verified"
                  }
                >
                  {studentCredential.revoked
                    ? "REVOKED"
                    : "VERIFIED"}
                </span>

              </div>

              <h3>
                {
                  studentCredential.credentialType
                }
              </h3>

              <div className="credential-details">

                <p>
                  <strong>
                    Credential ID:
                  </strong>{" "}
                  {
                    studentCredential.id
                  }
                </p>

                <p>
                  <strong>
                    Student:
                  </strong>{" "}
                  {
                    shortAddress(
                      studentCredential.student
                    )
                  }
                </p>

                <p>
                  <strong>
                    Issuer:
                  </strong>{" "}
                  {
                    shortAddress(
                      studentCredential.issuer
                    )
                  }
                </p>

                <p>
                  <strong>
                    Issued:
                  </strong>{" "}
                  {formatDate(
                    studentCredential.issuedAt
                  )}
                </p>

                <p>
                  <strong>
                    Certificate Hash:
                  </strong>
                </p>

                <code>
                  {
                    studentCredential.credentialHash
                  }
                </code>

              </div>

              <div className="qr-section">

                <h4>
                  Verify with QR
                </h4>

                <QRCodeCanvas
                  value={`${window.location.origin}/?verify=${studentCredential.id}`}
                  size={220}
                  level="H"
                />

                <p>
                  Scan this QR code to
                  verify this credential.
                </p>

              </div>

            </div>
          )}

        </div>

      </section>

      {/* =========================
          EMPLOYER VERIFICATION
      ========================= */}
      <section
        id="verify"
        className="section"
      >

        <div className="section-header">

          <span className="section-tag">
            EMPLOYER
          </span>

          <h2>
            Verify a Credential
          </h2>

          <p>
            Employers can verify a
            credential directly against
            blockchain records.
          </p>

        </div>

        <div className="card">

          <div className="form-group">

            <label>
              Credential ID
            </label>

            <input
              type="number"
              placeholder="Enter credential ID"
              value={
                verifyId
              }
              onChange={(e) =>
                setVerifyId(
                  e.target.value
                )
              }
            />

          </div>

          <button
            className="primary-btn"
            onClick={() =>
              verifyCredential()
            }
          >
            Verify Credential
          </button>

          {verifyStatus && (
            <div className="status-message">
              {verifyStatus}
            </div>
          )}

          {verificationResult && (
            <div
              className={
                verificationResult.valid
                  ? "verification-result verified-result"
                  : "verification-result revoked-result"
              }
            >

              <div className="verification-icon">
                {verificationResult.valid
                  ? "✓"
                  : "!"}
              </div>

              <h3>
                {verificationResult.valid
                  ? "Credential Verified"
                  : "Credential Revoked"}
              </h3>

              <p>
                {verificationResult.valid
                  ? "This credential exists on the blockchain and has not been revoked."
                  : "This credential exists on the blockchain but has been revoked by the issuer."}
              </p>

              <div className="verification-details">

                <p>
                  <strong>
                    Credential:
                  </strong>{" "}
                  {
                    verificationResult.credentialType
                  }
                </p>

                <p>
                  <strong>
                    Credential ID:
                  </strong>{" "}
                  {
                    verificationResult.id
                  }
                </p>

                <p>
                  <strong>
                    Student:
                  </strong>{" "}
                  {
                    shortAddress(
                      verificationResult.student
                    )
                  }
                </p>

                <p>
                  <strong>
                    Issuer:
                  </strong>{" "}
                  {
                    shortAddress(
                      verificationResult.issuer
                    )
                  }
                </p>

                <p>
                  <strong>
                    Issued:
                  </strong>{" "}
                  {formatDate(
                    verificationResult.issuedAt
                  )}
                </p>

                <p>
                  <strong>
                    Status:
                  </strong>{" "}
                  {verificationResult.revoked
                    ? "REVOKED"
                    : "VALID"}
                </p>

              </div>

            </div>
          )}

        </div>

      </section>

      {/* =========================
          REVOCATION
      ========================= */}
      <section className="section">

        <div className="section-header">

          <span className="section-tag">
            INSTITUTION
          </span>

          <h2>
            Revoke Credential
          </h2>

          <p>
            Issuers can revoke credentials
            when they are no longer valid.
          </p>

        </div>

        <div className="card">

          <div className="form-group">

            <label>
              Credential ID
            </label>

            <input
              type="number"
              placeholder="Enter credential ID"
              value={
                revokeId
              }
              onChange={(e) =>
                setRevokeId(
                  e.target.value
                )
              }
            />

          </div>

          <button
            className="secondary-btn"
            onClick={
              revokeCredential
            }
          >
            Revoke Credential
          </button>

          {revokeStatus && (
            <div className="status-message">
              {revokeStatus}
            </div>
          )}

        </div>

      </section>

      {/* =========================
          FEATURES
      ========================= */}
      <section
        id="features"
        className="section features-section"
      >

        <div className="section-header">

          <span className="section-tag">
            FEATURES
          </span>

          <h2>
            Why SkillProof?
          </h2>

        </div>

        <div className="feature-grid">

          <div className="feature-card">

            <div className="feature-icon">
              ◈
            </div>

            <h3>
              Blockchain Verification
            </h3>

            <p>
              Credential records are stored
              on blockchain, making them
              tamper-evident and independently
              verifiable.
            </p>

          </div>

          <div className="feature-card">

            <div className="feature-icon">
              #
            </div>

            <h3>
              Document Hashing
            </h3>

            <p>
              Every uploaded certificate
              receives a unique SHA-256
              fingerprint that can be used
              to detect document changes.
            </p>

          </div>

          <div className="feature-card">

            <div className="feature-icon">
              ◫
            </div>

            <h3>
              IPFS Storage
            </h3>

            <p>
              Certificate documents are
              stored off-chain using
              decentralized IPFS storage.
            </p>

          </div>

          <div className="feature-card">

            <div className="feature-icon">
              ✓
            </div>

            <h3>
              Instant Verification
            </h3>

            <p>
              Employers can verify credential
              records using a credential ID
              or QR code.
            </p>

          </div>

          <div className="feature-card">

            <div className="feature-icon">
              ↻
            </div>

            <h3>
              Revocation
            </h3>

            <p>
              Institutions can revoke
              credentials, and verification
              immediately reflects the
              revoked status.
            </p>

          </div>

          <div className="feature-card">

            <div className="feature-icon">
              ⛓
            </div>

            <h3>
              Student Ownership
            </h3>

            <p>
              Credentials are associated
              with the student's blockchain
              wallet address.
            </p>

          </div>

        </div>

      </section>

      {/* =========================
          HOW IT WORKS
      ========================= */}
      <section
        id="how-it-works"
        className="section"
      >

        <div className="section-header">

          <span className="section-tag">
            WORKFLOW
          </span>

          <h2>
            How SkillProof Works
          </h2>

        </div>

        <div className="steps">

          <div className="step">

            <div className="step-number">
              01
            </div>

            <h3>
              Issue
            </h3>

            <p>
              An institution uploads a
              certificate and issues a
              credential to the student's
              wallet.
            </p>

          </div>

          <div className="step">

            <div className="step-number">
              02
            </div>

            <h3>
              Store
            </h3>

            <p>
              The certificate is stored on
              IPFS while its hash and
              verification data are recorded
              on blockchain.
            </p>

          </div>

          <div className="step">

            <div className="step-number">
              03
            </div>

            <h3>
              Share
            </h3>

            <p>
              Students can view their
              credential and share its
              verification QR code.
            </p>

          </div>

          <div className="step">

            <div className="step-number">
              04
            </div>

            <h3>
              Verify
            </h3>

            <p>
              Employers check the credential
              directly against blockchain
              records.
            </p>

          </div>

        </div>

      </section>

      {/* =========================
          FOOTER
      ========================= */}
      <footer className="footer">

        <div className="footer-content">

          <div className="logo">
            <span className="logo-icon">
              ◆
            </span>

            <span>
              SkillProof
            </span>
          </div>

          <p>
            Decentralized Credential
            Verification Platform
          </p>

          <p>
            Built with React, Solidity,
            Hardhat, Ethereum, IPFS and
            MetaMask.
          </p>

        </div>

      </footer>

    </div>
  );
}

export default App;