# Design Frontend UI

You are tasked with designing a frontend UI using shadcn and related component libraries.

## Objective

Analyze the UI requirements and determine which components from available registries should be used to build the interface.

## Process

### 1. Understanding Requirements

First, understand what UI needs to be designed:
- What is the purpose of this UI?
- What features/functionality does it need?
- What user interactions are required?

### 2. Component Discovery

Use the shadcn MCP server to find suitable components:

- **Search for components** using `mcp__shadcn__search_items_in_registries`
  - Search across all available registries: `@shadcn`, `@aceternity`, `@originui`, `@cult`, `@kibo`, `@reui`
  - Look for individual components (buttons, inputs, cards, etc.)
  - Look for complete blocks/patterns (login forms, dashboards, etc.)

- **Review component details** using `mcp__shadcn__view_items_in_registries`
  - Check component features and capabilities
  - Understand component structure and dependencies

- **Find usage examples** using `mcp__shadcn__get_item_examples_from_registries`
  - Look for demos and examples
  - Study how components are composed together
  - Understand implementation patterns

### 3. Component Selection

Determine the best components to use:

1. **Prioritize whole blocks** - If complete patterns exist (e.g., "login-form", "dashboard-layout"), use them
2. **Compose from components** - If no blocks exist, identify individual components needed
3. **Mix registries strategically** - Different registries may excel at different component types
4. **Consider consistency** - Maintain visual and interaction consistency across the UI

### 4. Design Plan

Create a comprehensive design plan that includes:

1. **Component List** - All components/blocks to be used with their registry sources
2. **Layout Structure** - How components will be organized and nested
3. **Data Flow** - How data will flow between components
4. **Interactions** - User interactions and state management needs
5. **Installation Steps** - Which components need to be installed

### 5. Implementation Guidance

Provide clear next steps:

- Use `mcp__shadcn__get_add_command_for_items` to get installation commands
- Reference specific demo examples for implementation patterns
- Note any customizations needed beyond the base components

## Output

Present your design plan with:

1. **UI Overview** - High-level description of the UI design
2. **Component Architecture** - Detailed breakdown of components and their relationships
3. **Selected Components** - List of all components with registry sources
4. **Installation Commands** - Commands to install required components
5. **Implementation Roadmap** - Step-by-step guide to build the UI

Now proceed with designing the frontend UI based on the user's requirements.
