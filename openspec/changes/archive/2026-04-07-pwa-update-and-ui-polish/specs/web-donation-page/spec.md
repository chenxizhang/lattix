# web-donation-page

## MODIFIED Requirements

### Requirement: Desktop navbar donation link
The web dashboard's desktop navigation bar SHALL include a "Donate" link that opens `/donate.html`. The heart icon preceding the link text SHALL be displayed in red (#e74c3c).

#### Scenario: Desktop navbar rendering
- **WHEN** the navbar renders on a desktop viewport
- **THEN** a "Donate" link SHALL appear in the desktop navigation links
- **THEN** clicking the link SHALL open `/donate.html` in a new tab

#### Scenario: Heart icon color
- **WHEN** the navbar renders the Donate link on a desktop viewport
- **THEN** the heart icon (&#9829;) SHALL be displayed in red color (#e74c3c)

#### Scenario: Mobile tab bar unchanged
- **WHEN** the navbar renders on a mobile viewport
- **THEN** the mobile bottom tab bar SHALL NOT contain a "Donate" tab
- **THEN** the tab bar SHALL contain exactly three tabs: Home, Tasks, Settings
