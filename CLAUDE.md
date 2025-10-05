- use context7 mcp when you need to review library doucmentation
- use playwright mcp when testing the application
- use the shadcn mcp when working on shadcn componenets.

## UI Component Development Rules

When working on UI components:

1. **Always use the shadcn MCP server** to search, view, and implement components
2. **First call the demo tool** (`mcp__shadcn__get_item_examples_from_registries`) to see how components are used
3. **Then implement correctly** following the patterns from the demo
4. **Prefer existing components** from available registries over custom implementations
5. **Use whole blocks where possible** (e.g., login page, calendar, forms)

Available registries: `@shadcn`, `@aceternity`, `@originui`, `@cult`, `@kibo`, `@reui`
