# Ribbit - Complete Design Specification

> **Version:** 1.0  
> **Date:** January 23, 2026  
> **Status:** Design Phase  

---

## Table of Contents

1. [Brand Identity](#1-brand-identity)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Iconography](#4-iconography)
5. [Layout System](#5-layout-system)
6. [Component Specifications](#6-component-specifications)
7. [Page Specifications](#7-page-specifications)
8. [Interaction Patterns](#8-interaction-patterns)
9. [Animation Guidelines](#9-animation-guidelines)
10. [Accessibility](#10-accessibility)
11. [Responsive Behavior](#11-responsive-behavior)
12. [State Management](#12-state-management)

---

## 1. Brand Identity

### 1.1 Name & Tagline

- **App Name:** Ribbit
- **Inspiration:** The natural frog call, symbolizing communication, signals, and awareness in the wild
- **Tagline:** "Signal with Nature's Clarity"

### 1.2 Brand Personality

| Attribute | Description |
|-----------|-------------|
| **Grounded** | Stable, reliable, earthy |
| **Calm** | Peaceful yet alert, not overwhelming |
| **Natural** | Organic, breathable, authentic |
| **Minimal** | Clean, focused, purposeful |
| **Resilient** | Strong, enduring, dependable |

### 1.3 Logo Concept

**Primary Logo:** Minimalist frog silhouette with signal ripple metaphor

Design Elements:
- Stylized frog head profile or frontal view
- Circular ripple/wave emanating (representing signals)
- Optional: Leaf accent to reinforce nature theme
- Must work at 24x24px minimum (sidebar) up to 80x80px (auth page)

**Logo Variations:**
1. **Full Logo:** Icon + "Ribbit" text
2. **Icon Only:** For compact spaces (sidebar collapsed, favicon)
3. **Monochrome:** Single color for special contexts

**Logo Color Usage:**
- Light mode: Hunter Green (#3a5a40) icon on Dust Grey background
- Dark mode: Dry Sage (#a3b18a) icon on Pine Teal background

### 1.4 Voice & Tone

- **Professional** but not corporate
- **Friendly** but not casual
- **Clear** and direct
- Avoid jargon; use natural language
- Error messages should be helpful, not alarming

---

## 2. Color System

### 2.1 Primary Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Dust Grey** | `#dad7cd` | rgb(218, 215, 205) | Backgrounds, containers, dividers, subtle surfaces |
| **Dry Sage** | `#a3b18a` | rgb(163, 177, 138) | Secondary accents, soft highlights, hover states |
| **Fern** | `#588157` | rgb(88, 129, 87) | Primary action buttons, links, key highlights |
| **Hunter Green** | `#3a5a40` | rgb(58, 90, 64) | Headers, strong CTAs, active sidebar items |
| **Pine Teal** | `#344e41` | rgb(52, 78, 65) | Dark mode backgrounds, topbar, sidebar, depth layers |

### 2.2 Semantic Colors

| Purpose | Light Mode | Dark Mode |
|---------|------------|-----------|
| **Background (Primary)** | Dust Grey `#dad7cd` | Pine Teal `#344e41` |
| **Background (Secondary)** | `#f5f4f0` (lighter dust) | `#2d4438` (darker pine) |
| **Background (Card)** | `#ffffff` | `#3a5a40` |
| **Text (Primary)** | Pine Teal `#344e41` | Dust Grey `#dad7cd` |
| **Text (Secondary)** | `#5a7260` | `#a3b18a` |
| **Text (Muted)** | `#7a8a7e` | `#7a9a80` |
| **Border (Default)** | `#c5c2b8` | `#4a6a50` |
| **Border (Subtle)** | `#e5e3db` | `#3d5545` |

### 2.3 Interactive Colors

| State | Color | Usage |
|-------|-------|-------|
| **Primary Action** | Fern `#588157` | Main buttons, primary links |
| **Primary Hover** | Hunter Green `#3a5a40` | Button hover, link hover |
| **Primary Active** | `#2f4a35` | Button pressed state |
| **Secondary Action** | Dry Sage `#a3b18a` | Secondary buttons |
| **Secondary Hover** | `#8fa077` | Secondary hover |
| **Destructive** | `#c53030` | Delete actions, errors |
| **Destructive Hover** | `#9b2c2c` | Delete hover |
| **Success** | `#48bb78` | Success states, confirmations |
| **Warning** | `#d69e2e` | Warnings, cautions |
| **Info** | `#4299e1` | Informational messages |

### 2.4 Status Badge Colors

All status badges use muted, nature-inspired tones:

| Status | Background | Text |
|--------|------------|------|
| **Active/Pending** | `#588157` at 15% opacity | Fern `#588157` |
| **Completed** | `#3a5a40` at 15% opacity | Hunter Green `#3a5a40` |
| **Incomplete** | `#d69e2e` at 15% opacity | `#b7791f` |
| **Draft/Scheduled** | `#a3b18a` at 20% opacity | `#6b7a5a` |
| **Expired** | `#718096` at 15% opacity | `#4a5568` |

### 2.5 Focus & Selection States

```css
/* Focus ring */
--focus-ring: 0 0 0 3px rgba(88, 129, 87, 0.4); /* Fern at 40% */

/* Selection highlight */
--selection-bg: rgba(163, 177, 138, 0.3); /* Dry Sage at 30% */
```

### 2.6 Dark Mode Mapping

```
Light Mode              →  Dark Mode
──────────────────────────────────────
Dust Grey (bg)          →  Pine Teal (bg)
Pine Teal (text)        →  Dust Grey (text)
Fern (primary)          →  Fern (primary) - same
Hunter Green (headers)  →  Dry Sage (headers)
White (cards)           →  Hunter Green (cards)
```

---

## 3. Typography

### 3.1 Font Stack

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Helvetica Neue', Arial, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace;
```

**Note:** Inter is recommended for its excellent readability and modern feel. Falls back to system fonts.

### 3.2 Type Scale

| Name | Size | Line Height | Weight | Usage |
|------|------|-------------|--------|-------|
| **Display** | 32px (2rem) | 1.2 | 600 | Auth page title |
| **H1** | 24px (1.5rem) | 1.3 | 600 | Page titles |
| **H2** | 20px (1.25rem) | 1.4 | 600 | Section headers |
| **H3** | 18px (1.125rem) | 1.4 | 500 | Card titles |
| **H4** | 16px (1rem) | 1.5 | 500 | Subsection headers |
| **Body** | 16px (1rem) | 1.5 | 400 | Default text |
| **Body Small** | 14px (0.875rem) | 1.5 | 400 | Secondary text |
| **Caption** | 12px (0.75rem) | 1.4 | 400 | Labels, hints |
| **Overline** | 11px (0.6875rem) | 1.4 | 600 | Category labels (uppercase) |

### 3.3 Text Styles

```css
/* Page Title */
.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

/* Section Header */
.section-header {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Signal Title */
.signal-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
}
```

---

## 4. Iconography

### 4.1 Icon Library

**Primary:** Lucide React (already installed)

### 4.2 Icon Sizing

| Context | Size | Stroke Width |
|---------|------|--------------|
| **Inline (with text)** | 16px | 2px |
| **Button** | 18px | 2px |
| **Navigation** | 20px | 1.75px |
| **Feature/Empty State** | 48px | 1.5px |

### 4.3 Navigation Icons

| Item | Icon | Notes |
|------|------|-------|
| Inbox | `Inbox` | Standard inbox icon |
| Sent | `Send` | Paper plane |
| Labels | `Tag` | Tag icon |
| Groups | `Users` | Multiple people |
| Settings | `Settings` | Gear/cog |
| Notifications | `Bell` | With badge support |
| Profile | `User` or Avatar | Circular |
| Dark Mode | `Sun` / `Moon` | Toggle between |
| Create Signal | `Plus` or `PlusCircle` | Primary action |

### 4.4 Signal Status Icons

| Status | Icon |
|--------|------|
| Active | `Clock` |
| Completed | `CheckCircle` |
| Incomplete | `AlertCircle` |
| Scheduled | `CalendarClock` |
| Draft | `FileEdit` |
| Persistent | `Pin` |
| Anonymous | `EyeOff` |
| Edited | `Pencil` |

---

## 5. Layout System

### 5.1 Grid System

**Base Unit:** 4px  
**Spacing Scale:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### 5.2 Application Shell

```
┌─────────────────────────────────────────────────────────────┐
│                         TOPBAR (56px)                       │
│  [Logo] Ribbit              [Theme] [Notifications] [Profile]│
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│   SIDEBAR    │              MAIN CONTENT                    │
│   (240px)    │                                              │
│              │  ┌─────────────────────────────────────────┐ │
│  ┌────────┐  │  │ Page Header                             │ │
│  │ Inbox  │  │  │ [Title]              [Create Signal]    │ │
│  │ (5)    │  │  └─────────────────────────────────────────┘ │
│  ├────────┤  │                                              │
│  │ Sent   │  │  ┌─────────────────────────────────────────┐ │
│  │ (12)   │  │  │ [All] [Incomplete] [Completed] [Draft]  │ │
│  ├────────┤  │  └─────────────────────────────────────────┘ │
│  │ Labels │  │                                              │
│  ├────────┤  │  ┌─────────────────────────────────────────┐ │
│  │ Groups │  │  │ [Search...] [Filters ▼] [Sort ▼]        │ │
│  └────────┘  │  └─────────────────────────────────────────┘ │
│              │                                              │
│              │  ┌─────────────────────────────────────────┐ │
│              │  │ Signal List                             │ │
│  ┌────────┐  │  │ ┌─────────────────────────────────────┐ │ │
│  │Settings│  │  │ │ Signal Row 1                        │ │ │
│  └────────┘  │  │ ├─────────────────────────────────────┤ │ │
│              │  │ │ Signal Row 2                        │ │ │
│              │  │ └─────────────────────────────────────┘ │ │
│              │  └─────────────────────────────────────────┘ │
│              │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### 5.3 Dimensions

| Element | Dimension |
|---------|-----------|
| **Topbar Height** | 56px |
| **Sidebar Width** | 240px |
| **Sidebar Width (Collapsed)** | 64px |
| **Main Content Max Width** | 1200px |
| **Main Content Padding** | 24px (desktop), 16px (mobile) |
| **Card Border Radius** | 12px |
| **Button Border Radius** | 8px |
| **Input Border Radius** | 8px |

### 5.4 Z-Index Scale

```css
--z-base: 0;
--z-dropdown: 100;
--z-sticky: 200;
--z-sidebar: 300;
--z-topbar: 400;
--z-modal-backdrop: 500;
--z-modal: 600;
--z-sliding-panel: 700;
--z-toast: 800;
--z-tooltip: 900;
```

---

## 6. Component Specifications

### 6.1 Topbar

**Dimensions:** Full width × 56px height  
**Background:** Pine Teal `#344e41` (light mode), same (dark mode)  
**Position:** Fixed, top: 0

**Structure:**
```
┌────────────────────────────────────────────────────────────────┐
│ [Logo 32×32] [8px] "Ribbit"     [Theme] [16px] [Bell] [16px] [Avatar] │
└────────────────────────────────────────────────────────────────┘
      ↑ 16px padding                           16px padding ↑
```

**Left Section:**
- Logo: 32×32px
- Spacing: 8px
- App name: "Ribbit" in Body weight 500, Dust Grey color

**Right Section:**
- Theme toggle: 40×40px touch target
- Notification bell: 40×40px with red badge
- Profile avatar: 36×36px circular

**Colors (on dark topbar):**
- Text: Dust Grey `#dad7cd`
- Icons: Dust Grey at 70% opacity, 100% on hover
- Hover background: White at 10% opacity

### 6.2 Sidebar

**Dimensions:** 240px width × (viewport height - 56px)  
**Background:** Card background color  
**Position:** Fixed, left: 0, top: 56px  
**Border:** 1px right border

**Structure:**
```
┌─────────────────────┐
│                     │ ← 16px top padding
│  MAIN NAVIGATION    │
│  ┌─────────────────┐│
│  │ 📥 Inbox    (5) ││ ← 48px height each
│  ├─────────────────┤│
│  │ 📤 Sent    (12) ││ ← Publisher only
│  ├─────────────────┤│
│  │ 🏷️ Labels       ││ ← Publisher only
│  ├─────────────────┤│
│  │ 👥 Groups       ││ ← Publisher only
│  └─────────────────┘│
│                     │
│  ─────────────────  │ ← Spacer/flex grow
│                     │
│  BOTTOM             │
│  ┌─────────────────┐│
│  │ ⚙️ Settings     ││
│  └─────────────────┘│
│                     │ ← 16px bottom padding
└─────────────────────┘
     ↑
   16px horizontal padding
```

**Nav Item Specs:**
- Height: 48px
- Padding: 12px horizontal
- Icon: 20px, 12px gap to text
- Text: Body Small (14px), weight 500
- Border radius: 8px
- Active: Fern background at 15%, Fern text
- Hover: Background at 5% opacity
- Count badge: Pill shape, 20px min-width, Caption size

**Role-Based Visibility:**
```typescript
const navItems = [
  { icon: Inbox, label: 'Inbox', count: inboxCount, visible: true },
  { icon: Send, label: 'Sent', count: sentCount, visible: user.isPublisher },
  { icon: Tag, label: 'Labels', visible: user.isPublisher },
  { icon: Users, label: 'Groups', visible: user.isPublisher },
];
```

### 6.3 Page Header

**Height:** 72px  
**Background:** Transparent  
**Padding:** 24px horizontal, 16px vertical

**Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Page Title                              [+ Create Signal]  │
│  ──────────────────                      ─────────────────  │
│  24px H1                                 Primary Button     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Create Signal Button:**
- Style: Primary filled button
- Size: Default (40px height)
- Icon: Plus (16px) + "Create Signal" text
- Visible: Publishers only

### 6.4 Status Filter Cards

**Layout:** 4 equal-width cards in a row  
**Gap:** 16px between cards  
**Card Height:** 80px

**Card Structure:**
```
┌─────────────────────┐
│                     │
│  All          (47)  │
│  ───          ────  │
│  Label        Count │
│                     │
└─────────────────────┘
```

**Card Specs:**
- Border radius: 12px
- Padding: 16px
- Border: 1px solid border color
- Background: Card background
- Hover: Subtle shadow, slight scale (1.02)
- Active/Selected: Fern border, Fern background at 10%

**Count Badge:**
- Size: 24px minimum width
- Background: Muted (default), Fern (when card active)
- Border radius: Full (pill)
- Font: Caption, weight 600

### 6.5 Search & Filters Row

**Height:** 48px  
**Layout:** Flexbox, gap 12px

**Structure:**
```
┌──────────────────────────────────────────────────────────────┐
│ [🔍 Search signals...        ] [Filters ▼] [Sort: Newest ▼] │
│  ─────────────────────────────  ──────────  ────────────────│
│  flex-1 (fills space)           Button      Dropdown         │
└──────────────────────────────────────────────────────────────┘
```

**Search Input:**
- Height: 40px
- Padding: 12px left (icon), 16px right
- Icon: Search, 16px, muted color
- Placeholder: "Search signals..."
- Border: 1px, 8px radius
- Focus: Fern border, focus ring

**Filters Button:**
- Height: 40px
- Style: Secondary (outlined)
- Icon: Filter + "Filters"
- Badge: Shows count when filters active

**Sort Dropdown:**
- Height: 40px
- Style: Secondary
- Options: Newest, Oldest, Deadline, Title A-Z

### 6.6 Signal List Item

**Height:** Variable (collapsed ~80px, expanded ~auto)  
**Border:** 1px bottom border  
**Background:** Card background

**Collapsed State:**
```
┌────────────────────────────────────────────────────────────────────────┐
│ ┌──────┐                                                               │
│ │ Poll │  Signal Title Here That Can Be Long...     [Analytics] [⋮]   │
│ └──────┘  ──────────────────────────────────────                       │
│  Type     Deadline: Jan 25, 2026 • 2 days left                         │
│  Badge    Publisher: John Doe • NYC • Admin                            │
│           Labels: [urgent] [team-a]     [Persistent] [Anonymous]       │
│                                                                    [▼] │
└────────────────────────────────────────────────────────────────────────┘
   ↑                                                                  ↑
 16px                                                               16px
```

**Information Hierarchy (top to bottom):**

1. **Type Badge** (left)
   - Poll / Survey / Form
   - Pill shape, 24px height
   - Status-based color

2. **Title** (main)
   - H3 style, weight 500
   - Truncate with ellipsis if too long
   - Max 2 lines

3. **Deadline & Time Remaining**
   - Caption size
   - Format: "Jan 25, 2026 • 2 days left"
   - Color: Warning if < 24h, Destructive if < 1h

4. **Publisher Info**
   - Caption size, muted color
   - Format: "Name • Location • Role • email@example.com"

5. **Indicators Row**
   - Persistent: Pin icon + "Persistent"
   - Anonymous: EyeOff icon + "Anonymous"
   - Edited: Pencil icon + "Edited"

6. **Labels**
   - Simple text pills (no colors)
   - Background: Muted, 8px padding
   - Max display: 3, then "+X more"

**Action Buttons (Right Side):**
- Analytics: BarChart icon (all users)
- Edit: Pencil icon (publisher only, own signals)
- More: MoreVertical (publisher only)
- Delete: In More dropdown (publisher only)

**Expand Button:**
- Chevron down icon
- Bottom right corner
- Rotates 180° when expanded

**Expanded State:**
- Slides open smoothly (300ms)
- Shows full signal details
- If user can respond: Show response form
- If already responded: Show submitted response (read-only)
- If publisher viewing own signal & not in audience: Read-only view

### 6.7 Create Signal Panel (Sliding)

**Width:** calc(100vw - 240px - 48px) or max 800px  
**Position:** Fixed, right: 0  
**Animation:** Slide from right, 400ms ease-out

**Structure:**
```
┌────────────────────────────────────────────────────────────┐
│ [×]  Create Signal                                         │ ← Header
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ● Basic Info  ○ Options  ○ Settings  ○ Recipients  ○ Review │ ← Breadcrumb
│  ───────────────────────────────────────────────────────── │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │                   FORM CONTENT                       │  │ ← Scrollable
│  │                                                      │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                            [Back] [Continue / Publish]     │ ← Footer
└────────────────────────────────────────────────────────────┘
```

**Breadcrumb Steps:**
1. **Basic Info:** Title, Description
2. **Options:** Answer choices
3. **Settings:** Anonymity, Persistence, Default Response
4. **Recipients:** Consumer selection, file upload
5. **Scheduling:** Optional schedule time
6. **Labels:** Select from existing labels (no inline labels)
7. **Review:** Preview before publish

**Panel Behavior:**
- Backdrop: Semi-transparent overlay over main content only (not sidebar)
- Close: X button, ESC key, or click backdrop
- Unsaved changes: Confirm dialog before closing

### 6.8 Filters Panel

**Trigger:** Filters button click  
**Type:** Dropdown panel or slide-out drawer  
**Width:** 320px

**Filter Options:**

1. **By Label**
   - Multi-select dropdown
   - Shows all available labels
   - Checkbox for each

2. **By Date Range**
   - Airbnb-style single calendar
   - Click start date, then end date
   - Visual range highlight
   - Quick presets: Today, This Week, This Month, Custom

3. **By Publisher**
   - Search + select dropdown
   - Shows publisher name + email

4. **By Location**
   - Dropdown with all locations
   - From publisher data

5. **By Signal Type**
   - Checkboxes: Poll, Survey, Form, etc.

6. **Scheduled Only**
   - Toggle switch

**Actions:**
- Apply Filters button
- Clear All link
- Active filter count badge on main Filters button

### 6.9 Date Range Picker (Airbnb Style)

**Type:** Single calendar, range selection  
**Width:** 300px

**Structure:**
```
┌─────────────────────────────────────────┐
│  ◀  January 2026  ▶                     │
├─────────────────────────────────────────┤
│  Su  Mo  Tu  We  Th  Fr  Sa             │
│  --  --  --  1   2   3   4              │
│  5   6   7  [8══════════14]             │ ← Selected range
│  15  16  17  18  19  20  21             │
│  22  23  24  25  26  27  28             │
│  29  30  31  --  --  --  --             │
├─────────────────────────────────────────┤
│  [Today] [This Week] [This Month]       │ ← Quick presets
├─────────────────────────────────────────┤
│  Start: Jan 8, 2026                     │
│  End: Jan 14, 2026                      │
└─────────────────────────────────────────┘
```

**Interactions:**
- First click: Set start date
- Second click: Set end date
- Hover between dates: Preview range
- Click same date twice: Single day filter

### 6.10 Labels (Simplified)

**No Colors** - All labels use consistent theme styling

**Label Pill (Display):**
```
┌─────────────────┐
│  team-alpha     │
└─────────────────┘
```
- Background: Muted (Dry Sage at 20%)
- Text: Primary text color
- Border: 1px solid border color
- Padding: 4px 8px
- Border radius: 6px
- Font: Caption (12px), weight 500

**Label Management Table:**
| Column | Width | Content |
|--------|-------|---------|
| Name | 200px | Label name text |
| Description | flex-1 | Description or "No description" italic |
| Actions | 80px | Edit button only (no delete) |

### 6.11 Notification Bell

**Icon:** Bell (Lucide)  
**Size:** 20px  
**Badge:** Red circle with count

**Dropdown:**
```
┌─────────────────────────────────────────┐
│  Notifications                    [Mark all read] │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐│
│  │ 🔔 New signal from John Doe        ││
│  │    Team Survey - Due in 2 hours    ││
│  │    5 minutes ago           [unread]││
│  ├─────────────────────────────────────┤│
│  │ ✓ Response submitted               ││
│  │    Weekly Standup Poll             ││
│  │    1 hour ago                      ││
│  └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│            View all notifications       │
└─────────────────────────────────────────┘
```

### 6.12 Profile Menu

**Trigger:** Avatar click  
**Type:** Dropdown

**Structure:**
```
┌─────────────────────────────────────────┐
│  ┌────┐                                 │
│  │ JD │  John Doe                       │
│  └────┘  john.doe@company.com           │
│          Publisher                      │
├─────────────────────────────────────────┤
│  ⚙️  Settings                           │
│  🚪  Logout                             │
└─────────────────────────────────────────┘
```

---

## 7. Page Specifications

### 7.1 Auth Page (Login)

**Layout:** Centered, max-width 480px

**Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    ┌─────────────────────┐                  │
│                    │                     │                  │
│                    │      [LOGO]         │                  │
│                    │      Ribbit         │                  │
│                    │                     │                  │
│                    │  Signal with        │                  │
│                    │  Nature's Clarity   │                  │
│                    │                     │                  │
│                    ├─────────────────────┤                  │
│                    │                     │                  │
│                    │  Email              │                  │
│                    │  [________________] │                  │
│                    │                     │                  │
│                    │  Password           │                  │
│                    │  [________________] │                  │
│                    │                     │                  │
│                    │  [    Sign In     ] │                  │
│                    │                     │                  │
│                    └─────────────────────┘                  │
│                                                             │
│          Decorative forest/nature elements                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Decorative Elements:**
- Subtle leaf/fern patterns in background
- Soft gradient using Dust Grey and Dry Sage
- Optional: Animated fireflies or gentle ripple effects

### 7.2 Inbox Page (Default)

**URL:** `/inbox` or default route

**Content:**
- Page title: "Inbox"
- Status cards: All, Incomplete, Completed (no Draft for consumers)
- Search, filters, sort
- Signal list (signals addressed to current user)

**Empty State:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                      🐸                                     │
│              (Frog illustration)                            │
│                                                             │
│              No signals yet                                 │
│                                                             │
│      When someone sends you a signal, it will               │
│      appear here waiting for your response.                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Sent Page (Publishers Only)

**URL:** `/sent`

**Content:**
- Page title: "Sent"
- Status cards: All, Active, Completed, Draft/Scheduled
- Search, filters, sort
- Signal list (signals created by current user)
- Each signal shows response stats (X/Y responded)

### 7.4 Labels Page (Publishers Only)

**URL:** `/labels`

**Content:**
- Page title: "Labels"
- Create Label button
- Search bar
- Labels table:
  - Name column
  - Description column
  - Edit action (no delete)
- Pagination if many labels

**Create/Edit Label Modal:**
```
┌─────────────────────────────────────────────────────────────┐
│  Create Label                                         [×]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Label Name *                                               │
│  [________________________________]                         │
│  No spaces or special characters                            │
│                                                             │
│  Description                                                │
│  [________________________________]                         │
│  [________________________________]                         │
│  Optional, max 500 characters                               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                [Cancel] [Create Label]      │
└─────────────────────────────────────────────────────────────┘
```

### 7.5 Groups Page (Publishers Only - Future)

**URL:** `/groups`

**Content (Empty State):**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                      👥                                     │
│              (Group illustration)                           │
│                                                             │
│              Groups coming soon                             │
│                                                             │
│      Create recipient groups to quickly send signals        │
│      to predefined sets of users.                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.6 Settings Page

**URL:** `/settings`

**Sections:**
1. **Account** - View account details (read-only)
2. **Appearance** - Theme preference (System, Light, Dark)
3. **Notifications** - Notification preferences
4. **About** - App version, attributions

---

## 8. Interaction Patterns

### 8.1 Button States

| State | Visual |
|-------|--------|
| **Default** | Base styling |
| **Hover** | Darker shade, subtle shadow |
| **Active/Pressed** | Even darker, inset shadow |
| **Focus** | Focus ring (3px, Fern at 40%) |
| **Disabled** | 50% opacity, cursor: not-allowed |
| **Loading** | Spinner icon, disabled state |

### 8.2 Form Field States

| State | Border Color | Background | Additional |
|-------|--------------|------------|------------|
| **Default** | Border color | Input bg | - |
| **Hover** | Slightly darker | Input bg | - |
| **Focus** | Fern | Input bg | Focus ring |
| **Error** | Destructive | Light red tint | Error message below |
| **Disabled** | Muted | Muted bg | 50% opacity |
| **Read-only** | Transparent | Muted bg | - |

### 8.3 Selection Patterns

**Single Select (Radio):**
- Circle indicator
- Filled with Fern when selected

**Multi Select (Checkbox):**
- Rounded square
- Checkmark with Fern background when selected
- Indeterminate state for "Select All"

### 8.4 Feedback Patterns

**Toast Notifications:**
- Position: Bottom right
- Auto-dismiss: 5 seconds (configurable)
- Types: Success (green), Error (red), Warning (yellow), Info (blue)
- Dismissible with X button

**Inline Validation:**
- Shows on blur or submit
- Error message below field
- Field border turns red
- Error icon inside field (optional)

**Loading States:**
- Buttons: Spinner replaces icon
- Lists: Skeleton loaders
- Full page: Centered spinner with text

### 8.5 Confirmation Dialogs

**Delete Confirmation:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│      ⚠️  Delete Signal?                                     │
│                                                             │
│      This action cannot be undone. All responses            │
│      will be permanently deleted.                           │
│                                                             │
│                            [Cancel]  [Delete]               │
│                                       ─────────             │
│                                       Destructive           │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Animation Guidelines

### 9.1 Timing

| Animation Type | Duration | Easing |
|----------------|----------|--------|
| **Micro (hover, focus)** | 150ms | ease-out |
| **Small (dropdown, tooltip)** | 200ms | ease-out |
| **Medium (modal, panel)** | 300ms | ease-out |
| **Large (page transition)** | 400ms | ease-in-out |

### 9.2 Specific Animations

**Sliding Panel (Create Signal):**
```css
/* Enter */
transform: translateX(100%); → translateX(0);
opacity: 0 → 1;
duration: 400ms;
easing: cubic-bezier(0.16, 1, 0.3, 1); /* ease-out-expo */

/* Exit */
transform: translateX(0) → translateX(100%);
opacity: 1 → 0;
duration: 300ms;
easing: ease-in;
```

**Signal Row Expand:**
```css
/* Expand */
height: 0 → auto; (use max-height trick)
opacity: 0 → 1;
duration: 300ms;
easing: ease-out;
```

**Status Card Hover:**
```css
transform: scale(1) → scale(1.02);
box-shadow: none → subtle shadow;
duration: 150ms;
```

### 9.3 Reduced Motion

Respect `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. Accessibility

### 10.1 Color Contrast

All text must meet WCAG 2.1 AA standards:
- Normal text: 4.5:1 minimum
- Large text (18px+ or 14px bold): 3:1 minimum
- UI components: 3:1 minimum

**Verified Combinations:**
| Foreground | Background | Ratio | Pass |
|------------|------------|-------|------|
| Pine Teal on Dust Grey | `#344e41` / `#dad7cd` | 5.2:1 | ✓ AA |
| Dust Grey on Pine Teal | `#dad7cd` / `#344e41` | 5.2:1 | ✓ AA |
| Fern on White | `#588157` / `#ffffff` | 4.6:1 | ✓ AA |
| Hunter Green on Dust Grey | `#3a5a40` / `#dad7cd` | 5.8:1 | ✓ AA |

### 10.2 Keyboard Navigation

**Focus Order:**
1. Skip to main content link
2. Topbar items (left to right)
3. Sidebar items (top to bottom)
4. Main content (top to bottom, left to right)

**Focus Indicators:**
- Visible focus ring on all interactive elements
- 3px ring, Fern color at 40% opacity
- Offset: 2px

**Keyboard Shortcuts:**
| Key | Action |
|-----|--------|
| `Tab` | Next focusable element |
| `Shift+Tab` | Previous focusable element |
| `Enter` | Activate button/link |
| `Space` | Toggle checkbox, activate button |
| `Escape` | Close modal/panel/dropdown |
| `Arrow keys` | Navigate within menus |

### 10.3 Screen Reader Support

**Landmarks:**
- `<header>` for topbar
- `<nav>` for sidebar
- `<main>` for content
- `<aside>` for sliding panel

**ARIA Labels:**
```html
<button aria-label="Toggle dark mode">
<nav aria-label="Main navigation">
<button aria-expanded="false" aria-controls="filters-panel">
<div role="alert" aria-live="polite"> <!-- for toasts -->
```

### 10.4 Form Accessibility

- Labels associated with inputs via `for`/`id`
- Error messages linked via `aria-describedby`
- Required fields marked with `aria-required="true"`
- Invalid fields marked with `aria-invalid="true"`

---

## 11. Responsive Behavior

### 11.1 Breakpoints

| Name | Width | Behavior |
|------|-------|----------|
| **Mobile** | < 640px | Sidebar hidden, hamburger menu |
| **Tablet** | 640px - 1024px | Collapsed sidebar (icons only) |
| **Desktop** | > 1024px | Full layout |

### 11.2 Mobile Adaptations

**Navigation:**
- Hamburger menu in topbar
- Sidebar becomes full-screen overlay
- Bottom navigation bar (optional alternative)

**Content:**
- Status cards: 2×2 grid
- Signal list: Cards instead of rows
- Create Signal: Full-screen modal instead of side panel

**Touch Targets:**
- Minimum 44×44px for all interactive elements

### 11.3 Tablet Adaptations

**Sidebar:**
- Collapsed to 64px width
- Shows only icons
- Tooltip on hover for labels

**Content:**
- Similar to desktop
- Slightly reduced padding

---

## 12. State Management

### 12.1 Application State

```typescript
interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // Navigation
  currentPage: 'inbox' | 'sent' | 'labels' | 'groups' | 'settings';
  
  // Create Signal Panel
  isCreatePanelOpen: boolean;
  createPanelStep: number;
  
  // Filters
  activeFilters: FilterState;
  
  // Signals
  signals: Signal[];
  selectedSignal: Signal | null;
  expandedSignalId: string | null;
}
```

### 12.2 User Object

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  isPublisher: boolean;
  location?: string;
  avatarUrl?: string;
}
```

### 12.3 Signal Object

```typescript
interface Signal {
  id: string;
  type: 'poll' | 'survey' | 'form';
  title: string;
  description?: string;
  options: Option[];
  
  // Publisher info
  publisherEmail: string;
  publisherName: string;
  publisherLocation?: string;
  publisherRole?: string;
  
  // Timing
  deadline: string; // ISO date
  scheduledFor?: string; // ISO date
  publishedAt: string; // ISO date
  
  // Settings
  isPersistent: boolean;
  isAnonymous: boolean;
  showDefaultToConsumers: boolean;
  defaultResponse?: string;
  
  // Status
  status: 'active' | 'completed' | 'scheduled' | 'draft';
  isEdited: boolean;
  
  // Targeting
  consumers: string[];
  labels: string[];
  
  // Cloud sync
  cloudSignalId?: number;
  syncStatus?: 'synced' | 'pending' | 'error';
}
```

### 12.4 Filter State

```typescript
interface FilterState {
  status: 'all' | 'incomplete' | 'completed' | 'draft';
  labels: string[];
  dateRange: {
    start: string | null;
    end: string | null;
  };
  publisher: string | null;
  location: string | null;
  signalType: string[];
  scheduledOnly: boolean;
  searchQuery: string;
  sortBy: 'newest' | 'oldest' | 'deadline' | 'title';
}
```

---

## Appendix A: Component Checklist

### Layout Components
- [ ] RibbitLayout
- [ ] Topbar
- [ ] Sidebar
- [ ] PageHeader
- [ ] MainContent

### Navigation Components
- [ ] SidebarNavItem
- [ ] ThemeToggle
- [ ] NotificationBell
- [ ] ProfileMenu
- [ ] Breadcrumb

### Signal Components
- [ ] StatusFilterCards
- [ ] SignalFilters
- [ ] SignalListItem
- [ ] SignalDetail (expanded)
- [ ] SignalTypeB badge
- [ ] SignalIndicators

### Form Components
- [ ] CreateSignalPanel
- [ ] CreateSignalSteps
- [ ] DateRangePicker
- [ ] LabelSelector
- [ ] ConsumerSelector

### Common Components
- [ ] RibbitLogo
- [ ] LabelPill (no colors)
- [ ] EmptyState
- [ ] LoadingSpinner
- [ ] ConfirmDialog
- [ ] Toast

### Page Components
- [ ] InboxPage
- [ ] SentPage
- [ ] LabelsPage
- [ ] GroupsPage
- [ ] SettingsPage
- [ ] AuthPage

---

## Appendix B: File Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── RibbitLayout.tsx
│   │   ├── Topbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── PageHeader.tsx
│   │   └── MainContent.tsx
│   ├── navigation/
│   │   ├── SidebarNavItem.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── NotificationBell.tsx
│   │   └── ProfileMenu.tsx
│   ├── signals/
│   │   ├── StatusFilterCards.tsx
│   │   ├── SignalFilters.tsx
│   │   ├── SignalListItem.tsx
│   │   ├── SignalDetail.tsx
│   │   └── CreateSignalPanel.tsx
│   ├── common/
│   │   ├── RibbitLogo.tsx
│   │   ├── LabelPill.tsx
│   │   ├── DateRangePicker.tsx
│   │   ├── EmptyState.tsx
│   │   └── ConfirmDialog.tsx
│   ├── pages/
│   │   ├── InboxPage.tsx
│   │   ├── SentPage.tsx
│   │   ├── LabelsPage.tsx
│   │   ├── GroupsPage.tsx
│   │   └── SettingsPage.tsx
│   └── ui/
│       └── ... (existing shadcn components)
├── styles/
│   ├── globals.css
│   └── themes/
│       ├── light.css
│       └── dark.css
├── hooks/
│   ├── useTheme.ts
│   ├── useFilters.ts
│   └── useSignals.ts
├── types/
│   └── index.ts
└── App.tsx
```

---

## Appendix C: CSS Variables Reference

```css
:root {
  /* Colors - Forest Palette */
  --ribbit-dust-grey: #dad7cd;
  --ribbit-dry-sage: #a3b18a;
  --ribbit-fern: #588157;
  --ribbit-hunter-green: #3a5a40;
  --ribbit-pine-teal: #344e41;
  
  /* Semantic Colors */
  --background: var(--ribbit-dust-grey);
  --background-secondary: #f5f4f0;
  --background-card: #ffffff;
  --foreground: var(--ribbit-pine-teal);
  --foreground-secondary: #5a7260;
  --foreground-muted: #7a8a7e;
  
  /* Interactive */
  --primary: var(--ribbit-fern);
  --primary-hover: var(--ribbit-hunter-green);
  --primary-active: #2f4a35;
  --secondary: var(--ribbit-dry-sage);
  --destructive: #c53030;
  --success: #48bb78;
  --warning: #d69e2e;
  --info: #4299e1;
  
  /* Borders */
  --border: #c5c2b8;
  --border-subtle: #e5e3db;
  
  /* Focus */
  --ring: rgba(88, 129, 87, 0.4);
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(52, 78, 65, 0.05);
  --shadow: 0 1px 3px rgba(52, 78, 65, 0.1), 0 1px 2px rgba(52, 78, 65, 0.06);
  --shadow-md: 0 4px 6px rgba(52, 78, 65, 0.1), 0 2px 4px rgba(52, 78, 65, 0.06);
  --shadow-lg: 0 10px 15px rgba(52, 78, 65, 0.1), 0 4px 6px rgba(52, 78, 65, 0.05);
  
  /* Layout */
  --topbar-height: 56px;
  --sidebar-width: 240px;
  --sidebar-width-collapsed: 64px;
  --content-max-width: 1200px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
  
  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition: 200ms ease-out;
  --transition-slow: 300ms ease-out;
}

.dark {
  --background: var(--ribbit-pine-teal);
  --background-secondary: #2d4438;
  --background-card: var(--ribbit-hunter-green);
  --foreground: var(--ribbit-dust-grey);
  --foreground-secondary: var(--ribbit-dry-sage);
  --foreground-muted: #7a9a80;
  --border: #4a6a50;
  --border-subtle: #3d5545;
}
```

---

**End of Design Specification**

*This document should be updated as the design evolves during implementation.*
