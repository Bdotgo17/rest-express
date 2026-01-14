# Truck Driver Swap Point Tracker - Design Guidelines

## Design Approach: Design System Foundation

**Selected System**: Material Design 3 with utility-focused adaptations
**Rationale**: Reliability and clarity are critical for time-sensitive driver coordination. Clear information hierarchy, strong contrast, and familiar patterns reduce cognitive load during operations.

**Core Principles**:
- Information clarity over aesthetic flourish
- Quick-scan readability for drivers in motion
- High-contrast visual indicators for status/urgency
- Mobile-first (drivers primarily use phones)

---

## Typography

**Font Family**: 
- Primary: Inter (via Google Fonts CDN) - exceptional readability at all sizes
- Monospace: Roboto Mono - for times, IDs, and coordinates

**Hierarchy**:
- Page Titles: 2xl, semibold
- Section Headers: xl, semibold  
- Card Titles/Driver Names: lg, medium
- Body Text: base, normal
- Supporting Info/Timestamps: sm, normal
- Labels/Metadata: xs, medium, uppercase tracking-wide

---

## Layout System

**Spacing Scale**: Tailwind units of **2, 4, 6, 8, 12, 16**
- Tight spacing (2, 4): Within cards, between related elements
- Medium spacing (6, 8): Component padding, section gaps
- Generous spacing (12, 16): Page margins, major section breaks

**Responsive Containers**:
- Mobile: Full-width with px-4 padding
- Desktop: max-w-7xl centered with px-6

---

## Component Library

### Navigation
**Top App Bar**: Fixed header with logo left, active swap point center, profile/notifications right. Height h-16 with shadow-md.

**Bottom Navigation** (Mobile): Fixed 4-tab nav - Map View, Drivers, Swap Points, Messages. Icon-first with sm labels.

### Core Dashboard Components

**Map View** (Primary Interface):
- Full-screen interactive map (80vh on desktop, 70vh mobile)
- Driver pins with status indicators (active, en-route, waiting, delayed)
- Swap point markers (size indicates capacity/activity)
- Route lines connecting drivers to destinations
- Floating action button (bottom-right) for quick actions

**Driver Cards**:
- Compact horizontal cards with avatar left
- Name, status badge, ETA prominent
- Location, truck ID, contact button secondary
- Swipeable for quick actions (call, message, details)
- Border-l-4 for status color coding

**Swap Point Panel**:
- Location name, address, capacity indicator
- List of scheduled/active swaps
- Weather/traffic alerts if relevant
- Amenities icons (parking, rest facilities, fuel)

**Status Indicators**:
- Badge pills with icons: On-Time (check), Delayed (clock), Arrived (location), Waiting (pause)
- Traffic light system: Green/Yellow/Red for urgency
- Pulsing animation for active/in-transit status

### Forms & Inputs
- Outlined text fields with clear labels
- Date/time pickers with timezone awareness
- Location autocomplete with map preview
- Dropdowns for status selection with icons

### Data Display
**Timeline View**: Vertical timeline showing swap sequence, driver progression with connecting lines and timestamp nodes.

**Stats Grid**: 3-column on desktop (Active Swaps, Today's Completed, Pending), single-column mobile. Large number display with trend indicators.

### Communication
**Message Threads**: WhatsApp-style bubbles with timestamps, read receipts, and quick reply suggestions.

**Alert Banners**: Top-edge slide-in for urgent updates (delays, cancellations). Dismissible with action buttons.

---

## Images

**No Hero Image**: This is a functional dashboard app, not a marketing site.

**Practical Imagery**:
- Driver profile photos (circular avatars, 40px-48px)
- Truck photos in detail views (16:9 aspect ratio cards)
- Swap point location photos in facility cards
- Map imagery via Mapbox/Google Maps integration

---

## Animations

**Minimal & Purposeful**:
- Status badge transitions (200ms ease)
- Card expansion on detail view (300ms)
- Pulsing indicator on live tracking dots
- Smooth map pan/zoom (no custom animation needed)
- Loading spinners for data fetch only

---

## Icon Library

**Material Icons** (via CDN) for consistency:
- Navigation: map, people, location_on, chat
- Actions: call, directions, more_vert, swap_horiz
- Status: check_circle, warning, schedule, local_shipping
- UI: close, menu, notifications, search

---

## Key Screens Structure

1. **Live Map Dashboard**: Primary view with map, floating driver list overlay
2. **Swap Point Details**: Full facility info, scheduled swaps, contact
3. **Driver List**: Sortable/filterable table with quick-scan status
4. **Create Swap**: Multi-step form (drivers, location, timing, notes)
5. **Messages**: Centralized communication hub with threads

---

**Accessibility**: High-contrast text (WCAG AAA), tap targets min 44px, screen reader labels on all interactive elements, keyboard navigation support.