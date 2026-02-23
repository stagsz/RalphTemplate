import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import KPICard from "./KPICard";

describe("KPICard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a kpi card container", () => {
    render(<KPICard title="Revenue" value="$1,234" />);
    expect(screen.getByTestId("kpi-card")).toBeInTheDocument();
  });

  it("displays the title", () => {
    render(<KPICard title="Total Sales" value={500} />);
    expect(screen.getByTestId("kpi-title")).toHaveTextContent("Total Sales");
  });

  it("displays a string value", () => {
    render(<KPICard title="Revenue" value="$1,234.56" />);
    expect(screen.getByTestId("kpi-value")).toHaveTextContent("$1,234.56");
  });

  it("displays a numeric value", () => {
    render(<KPICard title="Count" value={42} />);
    expect(screen.getByTestId("kpi-value")).toHaveTextContent("42");
  });

  it("displays the unit when provided", () => {
    render(<KPICard title="Revenue" value={1000} unit="USD" />);
    expect(screen.getByTestId("kpi-unit")).toHaveTextContent("USD");
  });

  it("does not render unit when not provided", () => {
    render(<KPICard title="Count" value={10} />);
    expect(screen.queryByTestId("kpi-unit")).not.toBeInTheDocument();
  });

  it("renders up trend icon", () => {
    render(<KPICard title="Revenue" value={100} trend="up" />);
    const icon = screen.getByTestId("trend-up");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("text-emerald-500");
  });

  it("renders down trend icon", () => {
    render(<KPICard title="Churn" value={5} trend="down" />);
    const icon = screen.getByTestId("trend-down");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("text-red-500");
  });

  it("renders flat trend icon", () => {
    render(<KPICard title="Stability" value={99} trend="flat" />);
    const icon = screen.getByTestId("trend-flat");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("text-gray-400");
  });

  it("does not render trend section when no trend or comparison", () => {
    render(<KPICard title="Revenue" value={100} />);
    expect(screen.queryByTestId("trend-up")).not.toBeInTheDocument();
    expect(screen.queryByTestId("trend-down")).not.toBeInTheDocument();
    expect(screen.queryByTestId("trend-flat")).not.toBeInTheDocument();
    expect(screen.queryByTestId("kpi-comparison")).not.toBeInTheDocument();
  });

  it("displays comparison text", () => {
    render(
      <KPICard
        title="Revenue"
        value={100}
        comparison="12% vs last month"
      />,
    );
    expect(screen.getByTestId("kpi-comparison")).toHaveTextContent(
      "12% vs last month",
    );
  });

  it("renders trend and comparison together", () => {
    render(
      <KPICard
        title="Revenue"
        value="$5,000"
        trend="up"
        comparison="+15% from last quarter"
      />,
    );
    expect(screen.getByTestId("trend-up")).toBeInTheDocument();
    expect(screen.getByTestId("kpi-comparison")).toHaveTextContent(
      "+15% from last quarter",
    );
  });

  it("renders comparison without trend", () => {
    render(
      <KPICard
        title="Users"
        value={200}
        comparison="Same as yesterday"
      />,
    );
    expect(screen.queryByTestId("trend-up")).not.toBeInTheDocument();
    expect(screen.queryByTestId("trend-down")).not.toBeInTheDocument();
    expect(screen.queryByTestId("trend-flat")).not.toBeInTheDocument();
    expect(screen.getByTestId("kpi-comparison")).toHaveTextContent(
      "Same as yesterday",
    );
  });

  it("renders trend without comparison", () => {
    render(<KPICard title="Score" value={88} trend="down" />);
    expect(screen.getByTestId("trend-down")).toBeInTheDocument();
    expect(screen.queryByTestId("kpi-comparison")).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <KPICard title="Revenue" value={100} className="w-64 h-32" />,
    );
    const card = screen.getByTestId("kpi-card");
    expect(card).toHaveClass("w-64");
    expect(card).toHaveClass("h-32");
  });

  it("applies custom style", () => {
    render(
      <KPICard
        title="Revenue"
        value={100}
        style={{ maxWidth: 300 }}
      />,
    );
    const card = screen.getByTestId("kpi-card");
    expect(card.style.maxWidth).toBe("300px");
  });

  it("has proper card styling", () => {
    render(<KPICard title="Revenue" value={100} />);
    const card = screen.getByTestId("kpi-card");
    expect(card).toHaveClass("rounded-lg");
    expect(card).toHaveClass("border");
    expect(card).toHaveClass("bg-white");
    expect(card).toHaveClass("shadow-sm");
  });

  it("displays value with large font", () => {
    render(<KPICard title="Revenue" value={100} />);
    const value = screen.getByTestId("kpi-value");
    expect(value).toHaveClass("text-3xl");
    expect(value).toHaveClass("font-semibold");
  });

  it("displays title with muted style", () => {
    render(<KPICard title="Revenue" value={100} />);
    const title = screen.getByTestId("kpi-title");
    expect(title).toHaveClass("text-sm");
    expect(title).toHaveClass("text-gray-500");
  });

  it("handles zero value", () => {
    render(<KPICard title="Errors" value={0} />);
    expect(screen.getByTestId("kpi-value")).toHaveTextContent("0");
  });

  it("handles empty string value", () => {
    render(<KPICard title="Status" value="" />);
    expect(screen.getByTestId("kpi-value")).toBeInTheDocument();
  });

  it("handles large numbers", () => {
    render(<KPICard title="Revenue" value="$1,234,567,890" />);
    expect(screen.getByTestId("kpi-value")).toHaveTextContent(
      "$1,234,567,890",
    );
  });

  it("renders all props together", () => {
    render(
      <KPICard
        title="Monthly Revenue"
        value="$45,678"
        unit="USD"
        trend="up"
        comparison="+23% vs last month"
        className="custom-kpi"
        style={{ width: 250 }}
      />,
    );
    expect(screen.getByTestId("kpi-title")).toHaveTextContent("Monthly Revenue");
    expect(screen.getByTestId("kpi-value")).toHaveTextContent("$45,678");
    expect(screen.getByTestId("kpi-unit")).toHaveTextContent("USD");
    expect(screen.getByTestId("trend-up")).toBeInTheDocument();
    expect(screen.getByTestId("kpi-comparison")).toHaveTextContent(
      "+23% vs last month",
    );
    expect(screen.getByTestId("kpi-card")).toHaveClass("custom-kpi");
  });
});
