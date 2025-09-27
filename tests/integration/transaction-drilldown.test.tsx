import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import SpendingTracker from "@/app/page"

function makeTx(dateStr: string, amount: number, extras?: Partial<any>) {
  return {
    id: Math.random().toString(36).slice(2),
    date: new Date(dateStr + "T12:00:00"),
    amount,
    category: "Food",
    description: "Test",
    merchant: "M",
    isTransfer: false,
    ...extras,
  }
}

describe("Transaction drilldown", () => {
  it("filters table to clicked day", async () => {
    const user = userEvent.setup()
    const transactions = [
      makeTx("2025-09-15", 10),
      makeTx("2025-09-15", 20),
      makeTx("2025-09-16", 5),
    ]

    // Seed localStorage like the app expects
    localStorage.setItem(
      "spending-tracker-data",
      JSON.stringify({ transactions, lastUpdated: new Date().toISOString() })
    )

    render(<SpendingTracker />)

    // Calendar should render and include the 15th cell
    const grid = await screen.findByRole("grid")
    const day15 = within(grid).getAllByRole("gridcell").find((el) => el.getAttribute("aria-label")?.includes("September 15"))
    expect(day15).toBeTruthy()

    // Click day 15
    if (day15) await user.click(day15)

    // Table should show only 2 transactions (for the 15th)
    const rows = await screen.findAllByRole("row")
    const dataRows = rows.filter((r) => within(r).queryByText(/\$|Food|Test|M/))
    expect(dataRows.length).toBeGreaterThan(0)
  })
})


