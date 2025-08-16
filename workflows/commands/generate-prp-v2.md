# Generate PRP Command v2 - Enhanced with Mandatory Agent Collaboration

## Command: `/generate-prp`

## Purpose
Generate a comprehensive Project Requirements Plan (PRP) with MANDATORY agent collaboration and full-stack consideration.

## Key Changes from v1
1. **Mandatory Agent Usage**: Must use specified agents at each phase
2. **Full-Stack Coverage**: Frontend, Backend, and UX must all be addressed
3. **Validation Gates**: Checkpoints to ensure nothing is missed
4. **Visual Requirements**: Must include UI mockups/wireframes

## Execution Flow

### Phase 1: Initial Analysis (5 min)
```yaml
Steps:
1. Determine feature scope:
   - Is it backend-only? (rare)
   - Is it frontend-only? (rare)  
   - Is it full-stack? (most common)
   
2. Identify affected layers:
   - Data layer (database, models)
   - Service layer (business logic)
   - API layer (endpoints)
   - UI layer (components, screens)
   - UX layer (user flows, interactions)

3. Create task list for TodoWrite:
   - [ ] Run spec-writer agent
   - [ ] Run ux-flow-designer agent
   - [ ] Run risk-assessor agent
   - [ ] Run backend-architect agent
   - [ ] Run typescript-type-guardian agent
   - [ ] Integrate all outputs
   - [ ] Create visual mockups
   - [ ] Validate completeness
```

### Phase 2: Agent Collaboration (MANDATORY - 15 min)
```yaml
Planning Agents (MUST RUN ALL):
- spec-writer:
    prompt: |
      Create technical specifications for [feature].
      Include:
      - Data models needed
      - API endpoints
      - Business logic
      - Integration points
      Context: [provide researched context]
    
- ux-flow-designer:
    prompt: |
      Design user flow for [feature].
      Include:
      - Entry points
      - User actions
      - Decision points
      - Success/error states
      - Mobile considerations
      Platform: React Native (iOS/Android/Web)
    
- risk-assessor:
    prompt: |
      Assess risks for [feature].
      Consider:
      - Security risks
      - Performance impacts
      - Data integrity
      - UX complexity
      - Platform differences

Architecture Agents (MUST RUN ALL):
- backend-architect:
    prompt: |
      Design backend architecture for [feature].
      Stack: Node.js, Firebase, TypeScript
      Include:
      - Service structure
      - Database schema
      - Caching strategy
      - API design
    
- typescript-type-guardian:
    prompt: |
      Define TypeScript types for [feature].
      Include:
      - Interfaces
      - Type guards
      - Validation schemas
      - API contracts

Validation Agents:
- ux-journey-analyzer:
    prompt: |
      Analyze user journey for [feature].
      Identify:
      - Pain points
      - Drop-off risks
      - Optimization opportunities
      - Accessibility concerns
```

### Phase 3: Frontend Planning (MANDATORY - 10 min)
```yaml
Required Sections:
1. UI Components:
   - List every component needed
   - Define props and state
   - Specify platform differences (Web vs Native)
   
2. Screen Layouts:
   - Create ASCII mockups or descriptions
   - Show responsive breakpoints
   - Define navigation flow
   
3. User Interactions:
   - List all clickable elements
   - Define gestures (mobile)
   - Specify feedback mechanisms
   
4. Data Binding:
   - How UI connects to backend
   - State management approach
   - Real-time updates needed?

Example Mockup:
┌────────────────────────┐
│  Import Data Wizard    │
├────────────────────────┤
│ Step 1: Upload File    │
│ ┌──────────────────┐   │
│ │ Drop CSV here    │   │
│ │   or Browse      │   │
│ └──────────────────┘   │
│                        │
│ Step 2: Map Fields     │
│ [CSV Field] → [Type]   │
│ Name       → Text      │
│ Email      → Email     │
│                        │
│ [Back]    [Next]       │
└────────────────────────┘
```

### Phase 4: Integration & Validation (10 min)
```yaml
Integration Checklist:
- [ ] Agent outputs integrated into PRP
- [ ] Frontend matches backend capabilities
- [ ] Type definitions cover all data flows
- [ ] UI components match UX flows
- [ ] Test scenarios cover all paths

Validation Questions:
1. Can a developer implement the frontend from this PRP?
2. Are all user interactions specified?
3. Are platform differences addressed?
4. Is the data flow clear?
5. Are error states defined?
```

### Phase 5: Final PRP Generation (5 min)
```yaml
Use Template: PRPs/templates/prp_base_v3.md

Required Sections:
- [ ] Goal (frontend + backend)
- [ ] Agent outputs (clearly marked)
- [ ] Frontend components list
- [ ] Backend services list
- [ ] UI mockups/wireframes
- [ ] Mobile/Web differences
- [ ] Type definitions
- [ ] Test scenarios
- [ ] Risk mitigation

Quality Score:
- 10/10: Can implement without questions
- 8-9/10: Minor clarifications needed
- 6-7/10: Some assumptions required
- <6/10: Needs more planning
```

## Common Mistakes to Avoid

### ❌ Backend-Only Thinking
```yaml
Wrong:
- Only defining API endpoints
- No UI components specified
- Missing user interaction flows

Right:
- API + UI components + User flows
- Platform-specific implementations
- Complete data lifecycle
```

### ❌ Missing Visual Design
```yaml
Wrong:
- "User sees a form" (too vague)
- No layout specification
- No responsive design

Right:
- ASCII mockup or detailed description
- Component hierarchy
- Mobile/Tablet/Desktop layouts
```

### ❌ Skipping Agent Collaboration
```yaml
Wrong:
- "I'll plan it myself"
- Partial agent usage
- Ignoring agent outputs

Right:
- Run ALL required agents
- Integrate ALL outputs
- Mark agent contributions clearly
```

## Validation Checklist

### Before Starting
- [ ] Feature scope identified
- [ ] Affected layers listed
- [ ] TodoWrite updated with tasks

### During Planning
- [ ] All planning agents run
- [ ] All architecture agents run
- [ ] Frontend mockups created
- [ ] Type definitions complete

### Before Submitting
- [ ] All agent outputs integrated
- [ ] Frontend specs complete
- [ ] Backend specs complete
- [ ] UX flows documented
- [ ] Risks assessed and mitigated
- [ ] Test scenarios defined
- [ ] Platform differences addressed

## Example: Good vs Bad PRP

### ❌ Bad PRP (Backend-only)
```markdown
## Goal
Implement dynamic field mapping for CSV import

## Implementation
- Read CSV headers
- Store in database
- Create API endpoint

## Tasks
1. Create field service
2. Add database schema
3. Create API
```

### ✅ Good PRP (Full-Stack)
```markdown
## Goal
Backend: Dynamic field detection and storage
Frontend: Interactive field mapper with drag-drop

## UX Flow (from ux-flow-designer)
1. User uploads CSV → 
2. Sees field list →
3. Configures each field →
4. Previews data →
5. Confirms import

## UI Components
1. FileUploader
   - Drag-drop zone
   - Progress indicator
   
2. FieldMapper
   - Sortable list
   - Type selector
   - Preview panel

## Backend (from backend-architect)
[Services, APIs, Database]

## Mockup
[ASCII or image]

## Platform Differences
Web: Drag-drop supported
Mobile: Tap to upload
```

## Success Metrics
- Agent collaboration: 100% of required agents used
- Frontend coverage: All UI components specified
- Backend coverage: All services defined
- UX completeness: User can complete flow
- Platform support: Web + iOS + Android addressed
- Type safety: All data types defined
- Test coverage: All paths have test scenarios

## Migration from Old Process
1. Update CLAUDE.md to reference this v2 process
2. Archive old PRP templates
3. Train on new template usage
4. Validate first 3 PRPs manually
5. Adjust based on outcomes

---

**Version**: 2.0
**Updated**: 2024-01-16
**Confidence**: This process ensures 90%+ complete PRPs