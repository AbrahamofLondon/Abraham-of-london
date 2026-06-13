/**
 * components/product/ProductEvidenceStatus.tsx
 *
 * Evidence Status Component
 *
 * Displays validation test results and evidence status.
 * Shows which gates have passed/failed.
 *
 * Usage:
 *   <ProductEvidenceStatus contract={contract} />
 */

import React from "react";
import { ProductAuthorityContract } from "@/lib/product/product-authority-contract";

interface ProductEvidenceStatusProps {
  contract: ProductAuthorityContract;
}

interface TestResult {
  name: string;
  passed: boolean;
  critical?: boolean;
}

export function ProductEvidenceStatus({
  contract,
}: ProductEvidenceStatusProps) {
  const tests: TestResult[] = [
    {
      name: "Evidence Ledger v2",
      passed: contract.validation.evidenceLedgerV2Present,
      critical: true,
    },
    {
      name: "Anti-Toy Validation",
      passed: contract.validation.antiToyPassed,
    },
    {
      name: "Red-Team Validation",
      passed: contract.validation.redTeamPassed,
    },
    {
      name: "Generic-AI Comparison",
      passed: contract.validation.genericAiComparisonPassed,
    },
    {
      name: "Market Comparison",
      passed: contract.validation.marketComparisonPassed,
    },
    {
      name: "Release Firewall",
      passed: contract.validation.releaseFirewallPassed,
      critical: true,
    },
    {
      name: "Validation Constitution",
      passed: contract.validation.constitutionPassed,
      critical: true,
    },
    {
      name: "No-Mock Authority",
      passed: contract.validation.noMockAuthorityPassed,
      critical: true,
    },
    {
      name: "Anti-Gaming",
      passed: contract.validation.antiGamingPassed,
    },
    {
      name: "Adversarial Validation",
      passed: contract.validation.adversarialValidationPassed,
    },
  ];

  const passedCount = tests.filter((t) => t.passed).length;
  const totalCount = tests.length;

  return (
    <div
      style={{
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        padding: "16px",
        backgroundColor: "#f9fafb",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          marginBottom: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "16px",
            fontWeight: "600",
            color: "#1f2937",
          }}
        >
          Validation Results
        </h3>
        <div
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: passedCount === totalCount ? "#10b981" : "#ef4444",
          }}
        >
          {passedCount}/{totalCount} Passed
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "8px",
        }}
      >
        {tests.map((test, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 12px",
              backgroundColor: test.passed ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${
                test.passed
                  ? "#bbf7d0"
                  : "#fecaca"
              }`,
              borderRadius: "4px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: test.passed ? "#10b981" : "#ef4444",
                marginRight: "8px",
                flexShrink: 0,
              }}
            />
            <div
              style={{
                fontSize: "13px",
                color: test.passed ? "#065f46" : "#7f1d1d",
                fontWeight: test.critical ? "600" : "500",
              }}
            >
              {test.name}
              {test.critical && (
                <span
                  style={{
                    marginLeft: "6px",
                    fontSize: "10px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  [Required]
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "12px", borderTop: "1px solid #e5e7eb", paddingTop: "12px" }}>
        <div
          style={{
            fontSize: "12px",
            color: "#6b7280",
            fontWeight: "500",
            marginBottom: "8px",
          }}
        >
          MEASUREMENT BOUNDARY
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "6px",
          }}
        >
          {[
            ["Product Changed", contract.boundary.productChangedThisPass],
            ["Scorer Changed", contract.boundary.scorerChangedThisPass],
            ["Scenario Changed", contract.boundary.scenarioChangedThisPass],
            ["Benchmark Changed", contract.boundary.benchmarkChangedThisPass],
          ].map(([label, value], i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: "12px",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  marginRight: "6px",
                  backgroundColor: value ? "#ef4444" : "#10b981",
                }}
              />
              <span style={{ color: "#374151" }}>
                {label}: {value ? "Changed" : "Clean"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProductEvidenceStatus;
