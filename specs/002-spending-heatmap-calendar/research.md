# Research: Spending Heatmap Calendar

## Calendar Heatmap Component Design

**Decision**: Use a custom React component with TailwindCSS for styling, similar to GitHub's contribution graph
**Rationale**:
- Existing project uses TailwindCSS for consistent styling
- Custom component allows precise control over color scaling and interactions
- Better performance than third-party calendar libraries for this specific use case
**Alternatives considered**:
- react-calendar-heatmap (adds external dependency, less customization)
- Recharts calendar (overkill for simple heatmap, performance concerns)

## Color Scale Implementation

**Decision**: Dynamic HSL color scale from green (low) to yellow (medium) to red (high)
**Rationale**:
- HSL allows smooth color interpolation between spending levels
- Intuitive color coding (green=good/low, red=high spending)
- Dynamic scaling adapts to user's actual spending ranges
**Alternatives considered**:
- Fixed color brackets (doesn't adapt to user data)
- Single-color intensity scale (less intuitive than green-to-red)

## Date Calculations and Performance

**Decision**: Use date-fns for date manipulation with React.useMemo for expensive calculations
**Rationale**:
- date-fns already in project dependencies
- Tree-shakable and performant
- useMemo prevents recalculation on every render
**Alternatives considered**:
- Native Date API (more complex date math, timezone issues)
- moment.js (deprecated, bundle size concerns)

## Calendar Layout Strategy

**Decision**: CSS Grid for calendar layout with responsive breakpoints
**Rationale**:
- CSS Grid ideal for calendar grid layouts
- Native browser support for responsive behavior
- Easier to implement touch-friendly sizing on mobile
**Alternatives considered**:
- Flexbox (more complex for grid layouts)
- Table layout (accessibility and styling limitations)

## Transaction Data Integration

**Decision**: Extend existing transaction data structures with daily aggregation utilities
**Rationale**:
- Reuses existing transaction models and validation
- Maintains data consistency with rest of application
- Can leverage existing data processing services
**Alternatives considered**:
- Separate data model for calendar (data duplication)
- Direct database aggregation (not applicable for local-first app)

## State Management Approach

**Decision**: React useState with custom hooks for calendar state management
**Rationale**:
- Consistent with existing app's state management patterns
- Avoids adding complexity for localized calendar state
- Custom hooks enable reusability and testing
**Alternatives considered**:
- Redux/Zustand (overkill for component-specific state)
- Context API (unnecessary prop drilling for calendar component)

## Touch and Mobile Optimization

**Decision**: Minimum 44px touch targets with hover states disabled on touch devices
**Rationale**:
- Meets WCAG accessibility guidelines
- CSS media queries can detect touch vs. mouse interaction
- Prevents hover state issues on mobile devices
**Alternatives considered**:
- Fixed sizing (poor mobile experience)
- JavaScript touch detection (more complex, performance overhead)

## Virtualization Strategy

**Decision**: Conditional virtualization for datasets > 365 days
**Rationale**:
- Most users will view monthly/yearly data (< 365 days)
- Virtualization adds complexity but needed for multi-year datasets
- React.lazy and Intersection Observer for efficient rendering
**Alternatives considered**:
- Always virtualize (unnecessary overhead for small datasets)
- No virtualization (performance issues with 5+ years data)