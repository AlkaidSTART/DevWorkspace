import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import App from "./App";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("App", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(invoke).mockResolvedValue("Hello, Ada!");
  });

  it("renders the welcome page", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Welcome to Tauri + React" }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter a name...")).toBeInTheDocument();
  });

  it("greets the submitted name", async () => {
    render(<App />);
    const input = screen.getByPlaceholderText("Enter a name...");

    fireEvent.change(input, { target: { value: "Ada" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => expect(screen.getByText("Hello, Ada!")).toBeInTheDocument());
    expect(invoke).toHaveBeenCalledWith("greet", { name: "Ada" });
  });
});
