# e-VerifyMet Design System

## Product Surface

The authenticated e-VerifyMet experience is a government-grade operational surface for legal metrology officers. It should feel precise, trustworthy, calm, and highly readable rather than bureaucratic or visually heavy. The interface prioritizes fast orientation, explicit authorization scope, clear verification status, structured records, and reliable mobile access.

The public surface is intentionally simpler and task-led: certificate verification should require minimal cognitive effort, with the verification result presented as the primary visual focus.

The product should adopt a refined editorial SaaS visual language while retaining the seriousness and clarity expected from a government verification system. Visual personality comes from typography, whitespace, crisp blue accents, and careful hierarchy—not from decoration.

## Visual Direction

* **Mood:** refined, professional, minimal, editorial, trustworthy, and precise.
* **Palette:** bright white surfaces, charcoal text, light gray borders, soft neutral backgrounds, and a vivid electric blue accent.
* **Typography:** Ratio is used for major editorial headlines and page-level messaging. Manrope is used for navigation, body copy, labels, metadata, controls, and operational content.
* **Shape:** crisp and lightly softened. Small-radius controls and moderate-radius cards create a precise, architectural feel.
* **Depth:** intentionally flat. Borders, spacing, typography, and tonal contrast establish hierarchy. Avoid heavy shadows, gradients, glows, or glass effects.
* **Density:** moderate operational density. Data-heavy screens should remain efficient without becoming cramped. Large headings and section spacing provide clear separation between functional areas.
* **Motion:** restrained and functional. Use short transitions for hover, focus, expansion, navigation, and state changes. Skeleton loading may use subtle opacity changes. Respect `prefers-reduced-motion`.

## Design Tokens

### Colors

```yaml
primary: "#0070FF"
primary-60: "#4D97FF"
primary-70: "#1F7AFF"
secondary: "#333333"
tertiary: "#E5E7EB"
neutral: "#F5F5F5"
surface: "#FFFFFF"
on-surface: "#333333"
error: "#D92D20"
border: "#E5E7EB"
```

* **Primary (#0070FF):** the main interactive accent. Use for primary actions, active navigation states, links, verification highlights, and important positive emphasis.
* **Primary-60 (#4D97FF):** softer blue for hover, focus, and supportive interactive states.
* **Primary-70 (#1F7AFF):** deeper blue for stronger active states where additional contrast is useful.
* **Secondary (#333333):** the dominant graphite color for headings, navigation, buttons, and high-priority operational text.
* **Tertiary / Border (#E5E7EB):** the default border and divider color. Keep structural lines subtle.
* **Neutral (#F5F5F5):** quiet backgrounds for metadata regions, chips, secondary information, and supporting interface elements.
* **Surface (#FFFFFF):** the primary application and component surface.
* **On-surface (#333333):** default readable text on white surfaces.
* **Error (#D92D20):** reserved for validation errors, failed verification, destructive actions, and critical system states.

Do not introduce additional accent colors without a clear semantic requirement. Status colors may be introduced when required for legal or operational clarity, but they should remain muted and subordinate to the core blue/charcoal system.

## Typography

The system combines two voices:

* **Ratio:** editorial, calm, distinctive. Use for page titles, hero messaging, major section headings, and prominent verification outcomes.
* **Manrope:** functional, highly readable, and consistent. Use for navigation, body copy, labels, buttons, form controls, tables, metadata, and operational content.

### Typography Scale

```yaml
headline-display:
  fontFamily: "Ratio"
  fontSize: "64px"
  fontWeight: 400
  lineHeight: "70px"
  letterSpacing: "-0.75px"

headline-lg:
  fontFamily: "Ratio"
  fontSize: "40px"
  fontWeight: 400
  lineHeight: "40px"
  letterSpacing: "-0.75px"

headline-md:
  fontFamily: "Ratio"
  fontSize: "21px"
  fontWeight: 400
  lineHeight: "28px"
  letterSpacing: "-0.13px"

headline-sm:
  fontFamily: "Manrope"
  fontSize: "18px"
  fontWeight: 400
  lineHeight: "22px"
  letterSpacing: "0px"

body-lg:
  fontFamily: "Manrope"
  fontSize: "18px"
  fontWeight: 400
  lineHeight: "26px"
  letterSpacing: "0px"

body-md:
  fontFamily: "Manrope"
  fontSize: "16px"
  fontWeight: 400
  lineHeight: "22px"
  letterSpacing: "0px"

body-sm:
  fontFamily: "Manrope"
  fontSize: "14px"
  fontWeight: 400
  lineHeight: "20px"
  letterSpacing: "0px"

label-lg:
  fontFamily: "Manrope"
  fontSize: "16px"
  fontWeight: 600
  lineHeight: "20px"
  letterSpacing: "0px"

label-md:
  fontFamily: "Manrope"
  fontSize: "14px"
  fontWeight: 600
  lineHeight: "18px"
  letterSpacing: "0px"

label-sm:
  fontFamily: "Manrope"
  fontSize: "12px"
  fontWeight: 600
  lineHeight: "16px"
  letterSpacing: "0px"

nav-md:
  fontFamily: "Manrope"
  fontSize: "14px"
  fontWeight: 400
  lineHeight: "18px"
  letterSpacing: "0px"

caption-sm:
  fontFamily: "Manrope"
  fontSize: "13px"
  fontWeight: 400
  lineHeight: "18px"
  letterSpacing: "0px"
```

Headings should remain light and spacious rather than bold and oversized throughout the application. Use typography and whitespace to establish hierarchy.

Avoid all-caps text as a default pattern. Use natural casing with semibold Manrope for controls and labels.

Monospace typography should **not** be a primary visual language. If metadata such as certificate IDs, verification codes, hashes, or reference numbers benefit from monospace treatment, use it sparingly and only for machine-readable values.

## Layout Grammar

The application should feel like a spacious editorial system adapted for operational work.

### Desktop

* Use a **248px navigation rail** for authenticated users.
* Keep the primary content area constrained rather than allowing text and forms to stretch indefinitely.
* Use a maximum content width appropriate to the task, generally around 1200px.
* Maintain generous horizontal gutters.
* Use a 24px base layout gutter.
* Prefer structured vertical stacking over visually complicated dashboard grids.
* Keep primary actions close to the content they affect.
* Use generous section separation so different operational tasks remain visually distinct.

### Navigation Rail

The navigation rail should be quiet and functional rather than visually dominant.

* White or very lightly contrasted surface.
* Thin border separating it from the content area.
* Manrope `nav-md` typography.
* Compact but touch-friendly navigation rows.
* Active navigation is indicated primarily through the primary blue accent and subtle background treatment.
* Avoid large filled navigation blocks, gradients, or excessive icon decoration.
* Role-aware navigation is driven by the authenticated session returned from `/api/v1/auth/session`.
* Future modules must appear unavailable rather than pretending to contain functionality that does not exist.

### Header

Authenticated top headers should remain below 80px in height.

The header should contain only information needed for orientation and session control:

* product identity where necessary;
* current module/page;
* authorization or role scope where relevant;
* session/user actions.

Avoid filling the header with decorative controls, analytics, or redundant navigation.

### Mobile

Mobile is a first-class operational experience.

* Collapse the 248px navigation rail into an off-canvas drawer.
* Use a subtle scrim behind the drawer.
* Keep controls large enough for touch interaction.
* Preserve the same typography hierarchy while scaling display headlines down appropriately.
* Allow tables to scroll horizontally rather than forcing unreadable columns.
* Keep primary actions visible and easy to reach.
* Avoid dense multi-column layouts on narrow screens.

## Spacing

Use a consistent spacing rhythm:

```yaml
xs: 4px
sm: 8px
md: 16px
lg: 20px
xl: 48px
gutter: 24px
section: 80px
```

Use:

* `4px` for tiny visual gaps and icon alignment.
* `8px` for control internals and compact component spacing.
* `16px` for standard component padding.
* `20px` for larger internal groups.
* `24px` for layout gutters and larger component compositions.
* `48px` for major content separation.
* `80px` for major page/section separation where the screen permits it.

Avoid arbitrary spacing values unless the content genuinely requires them.

## Elevation & Depth

The design is intentionally flat.

* Cards and panels should primarily use borders rather than shadows.
* Default border: `#E5E7EB`.
* Avoid strong drop shadows.
* Avoid gradients, glows, glassmorphism, and layered floating surfaces.
* Use whitespace and tonal contrast to separate content.
* Elevated surfaces may use an extremely subtle shadow only when necessary to distinguish an overlay, drawer, dialog, or temporary surface.

The product should feel like a precise document/workspace rather than a glossy dashboard.

## Shapes

```yaml
none: 0px
sm: 2px
md: 8px
lg: 12px
xl: 16px
full: 9999px
```

Shape language should remain crisp and restrained.

* Buttons: `2px` radius.
* Inputs: `2px` radius.
* Cards/panels: `8px` radius.
* Larger visual containers: up to `12px` where appropriate.
* Status badges and role labels: full pill radius.
* Do not use pill-shaped primary buttons.
* Avoid exaggerated rounded cards or playful bubble-like UI.

## Components

### Primary Button

```yaml
backgroundColor: "#333333"
textColor: "#FFFFFF"
typography: "label-lg"
rounded: "2px"
padding: "8px 16px"
height: "42px"
```

Primary actions should feel decisive and businesslike.

On hover, the background may transition to `#0070FF`.

Use primary buttons for actions such as:

* Verify
* Submit
* Save
* Confirm
* Continue
* Generate

Do not use large oversized CTA buttons unless the task genuinely requires them.

### Secondary Button

```yaml
backgroundColor: "#FFFFFF"
textColor: "#333333"
border: "1px solid #E5E7EB"
typography: "label-lg"
rounded: "2px"
padding: "8px 16px"
height: "42px"
```

Use for secondary actions such as Cancel, Back, or alternative workflows.

### Link

Links should be text-led and restrained.

* No filled background.
* No unnecessary border.
* Use the primary blue for interactive links where appropriate.
* Underline on hover or when additional discoverability is useful.

### Cards & Panels

```yaml
backgroundColor: "#FFFFFF"
textColor: "#333333"
border: "1px solid #E5E7EB"
rounded: "8px"
padding: "16px"
```

Cards should provide structure without feeling like decorative dashboard tiles.

Use larger internal padding for important verification results or complex operational panels when necessary.

Do not add shadows by default.

### Inputs

```yaml
backgroundColor: "#FFFFFF"
textColor: "#333333"
typography: "body-md"
border: "1px solid #E5E7EB"
rounded: "2px"
padding: "10px 12px"
```

Inputs must have clear labels, readable values, and obvious focus states.

Focus should use the primary blue without creating a heavy glow.

### Status Badges

Status badges are one of the few places where pill-shaped geometry is appropriate.

Use them for:

* Verified
* Pending
* Expired
* Rejected
* Draft
* Active
* Inactive
* Role labels

Keep status treatments compact and semantically clear. Do not use badges merely for decoration.

### Data Tables

Tables should feel like structured records rather than dense spreadsheets.

* Use Manrope for all table content.
* Use `body-sm` for dense supporting information where appropriate.
* Keep row spacing compact but readable.
* Use subtle `#E5E7EB` dividers.
* Avoid heavy vertical borders.
* Keep column alignment consistent.
* Highlight important status values using badges or restrained blue emphasis.
* On mobile, permit horizontal scrolling rather than shrinking text below comfortable readability.

### Icon Buttons

Icon buttons should be minimal and functional.

* Maintain adequate touch targets.
* Use charcoal or muted gray by default.
* Use primary blue for active/selected states.
* Provide accessible labels/tooltips where the icon meaning is not obvious.
* Avoid decorative iconography.

### Verification Result

The certificate verification result is a primary product moment and should receive stronger visual hierarchy than ordinary content.

The result should be presented in a clean white panel with:

* a clear Ratio headline;
* an immediately understandable verification status;
* supporting certificate information;
* structured metadata;
* relevant issuing/measurement information;
* clear next actions where applicable.

A successful verification should use the primary blue sparingly to reinforce trust and confirmation. Do not turn the entire result into a saturated blue panel.

Failed, expired, or invalid verification states should use the semantic error treatment while preserving the same underlying layout.

## Loading States

Loading states are first-class interface states.

Use lightweight skeleton placeholders that follow the same geometry as the content they replace.

* Avoid spinning loaders for large content areas when skeletons are appropriate.
* Skeletons should use subtle neutral contrast.
* Use opacity animation only when motion is enabled.
* With reduced motion, preserve the skeleton hierarchy without animation.

## Empty States

Empty states should explain:

1. What is currently empty.
2. Why the user may be seeing the empty state.
3. What action, if any, is available next.

Keep empty states editorial and restrained. Avoid large illustrations or decorative graphics unless they communicate something meaningful.

## Error States

Errors should be explicit and actionable.

Use:

* concise error title;
* short explanation;
* relevant recovery action;
* error color only where it improves recognition.

Do not flood the interface with red. Error styling should remain rare and semantically meaningful.

## Public Verification Surface

The public verification page should be simpler than the authenticated officer experience.

Its primary purpose is to answer one question:

**Is this certificate valid and what does it represent?**

The page should therefore prioritize:

1. verification input;
2. verification action;
3. verification result;
4. essential certificate information;
5. supporting explanatory content.

Do not expose authenticated navigation or unnecessary operational controls on the public surface.

The visual treatment should remain consistent with the authenticated application: white surfaces, charcoal typography, subtle borders, Ratio for prominent messaging, Manrope for functional content, and blue for the key interaction.

## Authorization & Navigation

The interface must reflect the actual authenticated session.

Role-aware navigation is driven by:

`/api/v1/auth/session`

Navigation should expose only functionality the current role is authorized to access.

Future modules may be visually indicated as unavailable, but the UI must never fabricate pages, records, metrics, dashboards, or backend-backed functionality that does not exist.

The visual system should distinguish between:

* available functionality;
* unavailable/future functionality;
* unauthorized functionality;
* loading session state;
* failed session state.

## Accessibility & Focus

Accessibility is part of the visual system.

* Maintain readable contrast between text and surfaces.
* Never rely on color alone to communicate verification status.
* Provide visible keyboard focus states.
* Use sufficiently large touch targets on mobile.
* Preserve semantic heading hierarchy.
* Respect `prefers-reduced-motion`.
* Ensure error and verification states are understandable without relying solely on color.

## Do's and Don'ts

### Do

* Keep the interface bright, spacious, precise, and centered around clear content columns.
* Use Ratio for major editorial headlines.
* Use Manrope for operational and functional UI.
* Use charcoal as the dominant text/action color.
* Use electric blue selectively for interaction and emphasis.
* Prefer borders and whitespace over shadows.
* Keep controls compact, rectangular, and highly legible.
* Use pills only for statuses and role labels.
* Make verification status immediately understandable.
* Treat loading, empty, error, and unavailable states as deliberate parts of the design.
* Preserve usability and readability on mobile.

### Don't

* Don't use the old cool paper / blue-green / civic-teal visual direction.
* Don't introduce heavy gradients, glows, glassmorphism, or glossy dashboard effects.
* Don't use large rounded cards or pill-shaped primary buttons.
* Don't make every component blue.
* Don't rely on heavy shadows to establish hierarchy.
* Don't make the authenticated shell visually dense or bureaucratic.
* Don't use decorative illustrations where a clear information hierarchy is more useful.
* Don't fabricate dashboard data or future backend functionality.
* Don't hide authorization scope or system state.
* Don't sacrifice readability for visual minimalism.

## Design Principle

**e-VerifyMet should feel like a precise editorial workspace for public-sector verification: calm enough to inspire trust, structured enough for operational work, and distinctive enough to feel like a modern product.**

The design should communicate confidence through restraint. Typography, whitespace, borders, and a single strong blue accent should do most of the visual work.
