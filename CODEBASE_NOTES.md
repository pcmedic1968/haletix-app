# HaleTix Codebase Review

**App Purpose:** Ticket sales tracker for Hale Theater in Gilbert, AZ.
Helps Kelly's mom track shows, church friends (people), and ticket sales.

## Architecture
- **Framework:** React 19 + Vite
- **Data:** localStorage (persistent in browser)
- **UI:** Glassmorphism dark theme, custom CSS (no component library)
- **Icons:** lucide-react
- **Utils:** date-fns, uuid

## Project Structure
```
src/
├── App.jsx              # Main router (Dashboard/Shows/People/Sales)
├── main.jsx             # Entry point with DataProvider
├── index.css            # Glassmorphism theme
├── components/
│   ├── Layout.jsx       # Sidebar nav + export/import
│   └── Modal.jsx        # Reusable modal
├── features/
│   ├── dashboard/Dashboard.jsx  # Stats cards, recent activity
│   ├── shows/Shows.jsx          # CRUD for shows
│   ├── people/People.jsx        # Contact management
│   └── sales/Sales.jsx          # Ticket sales + receipts
└── hooks/
    ├── useData.jsx      # Main data context (shows, people, sales)
    └── useLocalStorage.js  # localStorage hook
```

## Data Model

### Show
```js
{
  id: uuid,
  title: string,
  date: string (ISO),
  time: string,
  price: number,
  maxTickets: number,
  location: string,
  section: string (optional),
  createdAt: ISO
}
```

### Person
```js
{
  id: uuid,
  name: string,
  phone: string,
  email: string,
  notes: string,
  createdAt: ISO
}
```

### Sale
```js
{
  id: uuid,
  showId: uuid,
  personId: uuid,
  quantity: number,
  status: 'Reserved'|'Paid'|'Cancelled'|'Waitlist',
  paymentMethod: 'Cash',
  totalAmount: number,
  saleDate: ISO
}
```

## Key Features Working
- [x] Dashboard with stats (revenue, tickets sold, active shows)
- [x] Shows CRUD + date/time formatting
- [x] People search + contact management
- [x] Sales with ticket availability check
- [x] Print receipts (popup window)
- [x] Export/Import JSON backups
- [x] LocalStorage persistence

## Notable Code Highlights
- Clean React hooks pattern with Context
- Glassmorphism UI looks professional
- Defensive coding in Sales (handles missing context)
- Smart availability check before selling
- Export uses File System Access API with fallback

## Potential Improvements to Discuss
1. Data validation on import (only checks array existence)
2. Missing address field in People form (in model but not UI)
3. Shows "Tickets: 0 / max" is hardcoded, doesn't show actual sales
4. No bulk operations (bulk delete, bulk status update)
5. No reporting/analytics beyond dashboard basics
6. Receipt printing is basic HTML popup
7. No payment tracking beyond "status" field
8. No duplicate detection for people
9. No history/audit trail for changes

## Security/Reliability Notes
- All data is client-side (localStorage)
- No auth needed (single user app)
- Data loss risk if browser storage cleared
- Export/Import mitigates this

## Status
App is functional and well-structured for a vibe-coded project.
Google Antigravity did solid work on the architecture.
