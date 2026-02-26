# UX Minimum Mode

## Overview

Minimum Mode is designed for busy mechanics and low-tech environments. It minimizes required fields, hides advanced features by default, and provides a streamlined workflow.

## Principles

1. **Progressive Disclosure**: Advanced fields hidden by default
2. **Big Touch Targets**: Mobile-first, easy to tap
3. **Simple Copy**: Clear, concise labels
4. **Step-by-Step Flow**: One task at a time
5. **Forgiving Input**: Auto-create guest customers, normalize plates

## Fast Intake Workflow

### Single Screen Entry
```
┌─────────────────────────────────────┐
│ Fast Intake - Walk-In Customer     │
├─────────────────────────────────────┤
│ License Plate: [34 ABC 123    ]    │
│   → Auto-search existing vehicles   │
│                                     │
│ Customer: [John Doe          ]     │
│   → Auto-create guest if new       │
│                                     │
│ Phone (optional): [+90 555 123]    │
│                                     │
│ Problem: [Engine noise       ]     │
│                                     │
│ [▼ Show Advanced]                  │
│                                     │
│ [Create Work Order]                │
└─────────────────────────────────────┘
```

### Advanced Section (Collapsed by Default)
- Vehicle details: make, model, year, VIN
- Customer details: email, address
- Work order details: diagnostics, assigned mechanic

## Required vs Optional Fields

### Minimum Required
- **Customer**: fullName (or auto-generated "Guest")
- **Vehicle**: rawPlate, make
- **Work Order**: (none - can be created empty)

### Optional (Can Add Later)
- Customer: phone, email, address
- Vehicle: model, year, VIN, mileage, color
- Work Order: problemDetails, diagnostics, labor items, parts

## UI Components

### Input Fields
- Large touch targets (min 44x44px)
- Clear labels above fields
- Inline validation with helpful messages
- Auto-focus on first field

### Buttons
- Primary action: Large, prominent (e.g., "Create Work Order")
- Secondary actions: Smaller, less prominent
- Destructive actions: Red, with confirmation

### Lists
- Card-based layout
- Key info visible: plate, customer name, status
- Tap to view details
- Swipe actions for quick operations (optional)

### Search
- Auto-suggest as you type
- Recent searches
- Clear "No results" state with action (e.g., "Create New")

## Confirmations

### Required Confirmations (Policy-Driven)
1. **Attach Existing Vehicle to Different Customer**
   - "This vehicle is registered to [Name]. Attach to [New Name]?"
   - [Cancel] [Confirm]

2. **Create Duplicate Plate Vehicle**
   - "Vehicle with plate [34 ABC 123] already exists. Create anyway?"
   - [Cancel] [View Existing] [Create New]

## Status Indicators

### Work Order Status
- **DRAFT**: Gray, "Not Started"
- **OPEN**: Blue, "Ready to Start"
- **IN_PROGRESS**: Yellow, "In Progress"
- **COMPLETED**: Green, "Completed"
- **CANCELED**: Red, "Canceled"

### Visual Indicators
- Color-coded badges
- Icons for quick recognition
- Progress bars for multi-step processes

## Error Handling

### Friendly Error Messages
- ❌ "License plate is required" (not "Field 'rawPlate' cannot be null")
- ❌ "Phone number must start with +" (not "Invalid E.164 format")
- ❌ "Customer not found" (not "404 ERR_RESOURCE_NOT_FOUND")

### Recovery Actions
- Suggest fixes: "Did you mean [34 ABC 123]?"
- Provide alternatives: "Create new customer instead?"
- Clear next steps: "Try again" or "Contact support"

## Offline Support (Future)

### Draft Queue
- Save drafts locally (IndexedDB)
- Sync when online
- Visual indicator: "3 drafts pending sync"

### Idempotency
- Use Idempotency-Key for sync
- Prevent duplicates on reconnect

## Internationalization

### Supported Languages
- English (en)
- Turkish (tr)

### Locale-Aware
- Date/time formatting
- Number formatting (currency, decimals)
- Phone number formatting

### Translation Keys
```json
{
  "fastIntake.title": "Fast Intake",
  "fastIntake.licensePlate": "License Plate",
  "fastIntake.customer": "Customer",
  "fastIntake.problem": "Problem",
  "fastIntake.createButton": "Create Work Order"
}
```

## Accessibility

### WCAG 2.1 AA Compliance
- Keyboard navigation
- Screen reader support
- Sufficient color contrast (4.5:1 minimum)
- Focus indicators
- Alt text for images

### Touch Targets
- Minimum 44x44px
- Adequate spacing between targets
- Large buttons for primary actions

## Performance

### Fast Load Times
- Code splitting
- Lazy loading for advanced features
- Optimistic UI updates
- Skeleton screens while loading

### Perceived Performance
- Instant feedback on actions
- Progress indicators for long operations
- Cached data for offline viewing

## Testing Checklist

- [ ] Fast intake creates customer + vehicle + work order
- [ ] Auto-search finds existing vehicles by plate
- [ ] Guest customer auto-created with minimal info
- [ ] Advanced section hidden by default
- [ ] Confirmations shown for risky actions
- [ ] Error messages are user-friendly
- [ ] Works on mobile (iOS Safari, Android Chrome)
- [ ] Works offline (draft queue)
- [ ] Translations complete (en, tr)
- [ ] Accessible (keyboard, screen reader)
