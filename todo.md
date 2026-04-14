# SKU Wood Tracker - TODO

## Completed Features
- [x] Basic wood cost calculator
- [x] Multi-channel pricing support
- [x] SKU version tracking
- [x] Production type (Outsource/In-House) support
- [x] Visual distinction for In-House versions (blue background)
- [x] Net margin calculation from sales channels
- [x] Export data functionality
- [x] Database integration for cloud storage
- [x] User authentication system
- [x] Data migration from localStorage to database
- [x] API routes for CRUD operations

## Pending Features
- [x] Import data functionality
- [ ] Search/filter SKUs in Tracker page
- [ ] Production comparison page (Outsource vs In-House)
- [ ] Cost trend analysis charts
- [ ] PDF export for reports

## Completed This Session
- [x] Add search bar to Tracker page
- [x] Create production comparison page (Outsource vs In-House)
- [x] Add Import Data functionality (JSON file upload)
- [x] Auto Email Backup - weekly backup sent to owner's email
- [x] Enhance Backup Email to include JSON download link (full data)
- [x] Add Production Type badge (In-House/Outsource) to SKU cards in Tracker
- [x] Add Production Type filter (In-House/Outsource/All) to Tracker page
- [x] Show both In-House and Outsource metrics side-by-side in each SKU card

## Bug Fixes
- [x] Fix bug: Wood material details (code, usage, length) missing when editing project - only showing price
- [x] Show single production type layout when SKU has only one type (no empty "ยังไม่มีข้อมูล" box)
- [x] Add price history tracking - record all price changes with timestamps when using Manage Price
- [x] Add Price Alert - warning when Net Margin < 23%
- [x] Add Price Comparison Chart - show price trends over time for each channel
- [x] Migrate project data from localStorage to database so all users see the same data
- [x] Make all project data shared globally - everyone sees and edits the same data (no userId filtering)
- [ ] Update wood material costs: 4c15200=33, 3c15200=23, 4s5200=105, 4s6200=115, 3s580=15, 4s580=30
- [ ] Create pricing formula calculator (bound formula) for dynamic profit calculation
- [ ] Integrate formula calculator into Calculator page
- [ ] Integrate formula calculator into Tracker page (Manage Prices modal)
- [x] Duplicate latest versions of วงกบประตู (all sizes except 70*200 and 80*200) with updated wood prices and notes
- [x] Create วงกบประตู 180*200 v.1 by copying from 160*200 latest version
- [x] Add woodMaterials table to DB with price history tracking
- [x] Create Wood Price Management page (editable table + history)
- [x] Update Calculator to load wood prices from DB

## Market Price Feature
- [x] Add marketPrice field to woodMaterials DB schema
- [x] Update backend API to support marketPrice (upsert, updatePrice, getAll)
- [x] Update WoodPrices UI: rename "ราคา Default" to "ราคาตลาด", allow editing, show savings badge

## P0 Dashboard Redesign
- [x] Extract shared projectStats utility to client/src/lib/projectStats.ts
- [x] Redesign Home.tsx: 3 KPI cards, Needs Attention list, Top 5 Performers, Margin History chart
- [x] Remove clutter: cost structure pie chart, gamification level, broken charts

## SKU Quick-View Drawer (Dashboard)
- [x] Build SKUDrawer component: slide-in panel with channel comparison table, cost waterfall bar, action buttons
- [x] Replace "Analyze" button in Needs Attention and Top Performers lists with row-click to open drawer
- [x] Add "แก้ไขต้นทุน" (→ Calculator edit) and "อัปเดตราคาขาย" (inline price modal) action buttons in drawer

## Tracker Redesign + Bug Fixes
- [x] Fix "แก้ไขต้นทุน" button in SKUDrawer to pass project ID to Calculator
- [x] Redesign Tracker: Tab 1 SKU Portfolio (Keep/Optimize/Review badges, sortable)
- [x] Redesign Tracker: Tab 2 Version Timeline (per-SKU cost reduction history)
- [x] Redesign Tracker: Tab 3 Cost Sensitivity (wood price impact + backsolve margin)

## UI Improvements (Apr 2026)
- [x] Remove +/- signs from profit fields app-wide, use green/red color instead
- [x] Add cost-as-% of selling price label under cost numbers in SKU Analysis
- [x] Fix bar labels in Tracker SKU Analysis (clarify "ไม้/ทุน" label → "ไม้/ต้นทุน%")
- [x] Redesign cost breakdown bar to Profit Waterfall Bar with tooltips and margin threshold line

## Tracker Lean Display (Apr 2026)
- [x] Remove ฿ symbol from all numbers in Tracker page (all 3 tabs)
- [x] Add cost-as-% of selling price under cost column in Portfolio tab
- [x] Show (X%) under selling price column in Portfolio tab
- [x] Show (X%) under selling price in Version Timeline tab
