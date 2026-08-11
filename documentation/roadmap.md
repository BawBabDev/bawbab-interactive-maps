## 🚀 This week's Accomplishments

📦 GeoJSON Importer & API Rework
- Complete API Overhaul: Fully reworked the GeoJSON import pipeline.
- Interactive Import Wizard: Built a step-by-step wizard component to control property mapping:
- Toggle individual fields on/off to decide what gets imported.
- Explicit handling of mandatory/necessary fields vs. predetermined fields.
- Dedicated Lat/Long mapping system.
- Unmapped/custom attributes are automatically stored dynamically in a dedicated JSON database column.

🗺️ Map Rendering & Viewport Adjustments
- Dynamic Geofencing & Viewport: Map bounds and geofencing are now recomputed automatically using the bounding box (bbox) of the imported GeoJSON.
- Map Center & Zoom Fixes: Dynamic calculation of center coordinates and zoom levels upon loading dataset geometry.
- Performance Optimization: Enhanced map rendering efficiency and smoothness for handling feature rendering.

🎛️ Unit Visibility & Interactivity
- Label Visibility Controls: Added database columns and UI logic to manage label toggling on a per-unit basis.
- Interactivity Flags: Added properties to define whether individual units/features can be interacted with or selected.

🎨 Category & Legend Management
- Dedicated Management Page: Built a new UI page to manage how units are grouped into categories.
- Styling & Legend Customization: Enabled customization options for map legends, category display rules, and color palettes.

🏗️ Generalization & Compatibility
- Domain Neutrality: Shifted the app architecture away from hardcoded Fonquez-specific logic toward a generic GIS model.
- Backward Compatibility: Maintained complete compatibility so existing Fonquez maps continue to function smoothly.

## 🔮 Next Steps & To-Do List

### Done
- Avoid constant page reload on data import / deletion or settings changes from the admin panel
- Editor
    - Fixed Interactivity Toggles
- Importer:
    - Make sure the predetermined data not imported don't end up in custom fields
    - Option to remove custom fields
- Styling & Legend Verification:
    - Verify that color picker selections properly update both the UI legend and live map rendering.
    - Allow to create new categories and assign them to features
    - Adapt the legend
        - Dynamic
        - Toggable
    - Simplify the category tool:
        - one ligne by category: label, pick color, pick group
        - simple tool to create new groups


🛠️ Immediate Fixes & Polish

- Editor
    - Allow to modify batch of feature (ex. is interactive etc)
    - Have option with pen button to edit actual name and code
    - Fix the add attributes button to modify for all features
- Use custom confirmation modal everywhere
- Styling & Legend Verification:
    - Insure proper styling for additionnal custom fields in side drawer + Allow to choose icons from a library or WP library
    - Have more customization options for legend (grouping classes etc, labels, item order, exclude layers / categories)
- Weird zoom behavior in the preview map
- Import the geom field
- Update Info tab


🗺️ Future Roadmap Items
- Multi-Layer Support: Build the architecture to add and toggle multiple layers.
- Advanced GIS Tools: Expand map capability with dedicated GIS tools and spatial analysis features (delete and add polygons + improving marker edit tool).

- Navigation Engine: Implement user navigation and routing workflows.
    - Geolocation system
    - Transportation type (walking / car)
    - Time estimate
    - Directions / Instructions
    - Integrated with Bawbab DAI for external navigation



Think how to manage networ layer
Adapt editor to edit all layers