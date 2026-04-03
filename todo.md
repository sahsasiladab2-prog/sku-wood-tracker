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
