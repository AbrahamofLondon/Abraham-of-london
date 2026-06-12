// @vitest-environment jsdom

import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ArrivalScreen from "@/components/report/arrival/ArrivalScreen";

afterEach(() => {
  vi.useRealTimers();
});

describe("ArrivalScreen", () => {
  it("fires onComplete after the configured duration", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();

    render(
      <ArrivalScreen
        tier="boardroom"
        referenceId="AoL-BB-001"
        productName="Boardroom Brief"
        issueDate="12 June 2026"
        autoAdvanceDuration={1200}
        onComplete={onComplete}
      />,
    );

    expect(onComplete).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1199);
    });
    expect(onComplete).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("does not render gated content before the arrival completes", () => {
    vi.useFakeTimers();

    render(
      <ArrivalScreen
        tier="paid"
        referenceId="AoL-PAID-001"
        productName="Decision Brief"
        issueDate="12 June 2026"
        customerName="A. Client"
        autoAdvanceDuration={900}
        onComplete={() => undefined}
      >
        <article>Executive judgement content</article>
      </ArrivalScreen>,
    );

    expect(screen.queryByText("Executive judgement content")).toBeNull();
    expect(screen.getByText("Prepared for A. Client")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(screen.getByText("Executive judgement content")).toBeTruthy();
  });

  it("uses organisation identity and reference in the arrival moment", () => {
    render(
      <ArrivalScreen
        tier="executive"
        organisationName="Northstar Holdings"
        referenceId="AoL-EX-774"
        productName="Executive Report"
        issueDate="12 June 2026"
        autoAdvanceDuration={5000}
        onComplete={() => undefined}
      />,
    );

    expect(screen.getByText("Prepared for Northstar Holdings")).toBeTruthy();
    expect(screen.getAllByText(/AoL-EX-774/).length).toBeGreaterThan(0);
  });

  it("does not show a skip control for boardroom arrival by default", () => {
    render(
      <ArrivalScreen
        tier="boardroom"
        referenceId="AoL-BB-002"
        productName="Boardroom Brief"
        issueDate="12 June 2026"
        autoAdvanceDuration={5000}
        onComplete={() => undefined}
      />,
    );

    expect(screen.queryByRole("button", { name: "Read" })).toBeNull();
    expect(screen.getByText("Preparing transmission")).toBeTruthy();
  });

  it("allows lightweight paid arrivals to be advanced by the reader", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();

    render(
      <ArrivalScreen
        tier="paid"
        referenceId="AoL-PAID-002"
        productName="Return Brief"
        issueDate="12 June 2026"
        autoAdvanceDuration={5000}
        onComplete={onComplete}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Read" }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
