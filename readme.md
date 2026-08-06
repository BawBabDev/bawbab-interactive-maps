# Bawbab Interactive Maps

Contributors:       Bawbab Technologies, marcellus89, @corentinsanchez  
Tags:               Mapping, Campus, Facility, Business location, Real estate  
Tested up to:       7.0  
Stable tag:         0.1.0  
License:            GPL-2.0-or-later  
License URI:        https://www.gnu.org/licenses/gpl-2.0.html

Bawbab Interative Maps is an Interactive mapping plugin for campuses and facilities.

# Introduction

Welcome to the **Bawbab Interactive Maps** user guide.

This guide explains how to configure, manage, and customize the Interactive Maps plugin for WordPress.

The plugin has been designed to provide an intuitive way to present campuses, residential communities, healthcare facilities, business parks, educational institutions, or any other location-based environment through an interactive digital map.

Unlike a traditional static map, the Interactive Campus Map allows visitors to explore a facility, search for locations, and access detailed information about individual buildings, units, or amenities directly from the map interface.

The plugin integrates seamlessly with WordPress, allowing administrators to manage most content using familiar WordPress tools while adding interactive geographic visualization and advanced customization features.

One of the key principles behind the plugin is to minimize duplicate work. Existing WordPress pages can be linked directly to map features, allowing their content to be displayed within the interactive map while still offering the flexibility to customize individual features whenever necessary.

This guide covers every aspect of the plugin, from installation and configuration to content management and day-to-day administration.

# What Visitors Can Do with the Interactive Map

The interactive map provides visitors with a modern and intuitive way to explore your campus or facility.

Rather than navigating through multiple webpages, users can visually browse the site and immediately access detailed information about buildings, residential units, amenities, or other points of interest.

The map is designed to work equally well on desktop computers, tablets, and mobile devices, automatically adapting its layout to different screen sizes to provide the best possible user experience.

<p align="center">
    <img src="screenshots/map-interface.png" width="100%">
</p>

# Searching for Locations

Visitors can quickly locate buildings, residential units, or amenities using several search methods.

### Search Bar

A search bar located at the top of the map **<span style="color:#0b00ffff">(1)</span>** allows users to search directly by name.

Simply typing the name or identifier of a building, unit, or amenity immediately filters the available results.

Selecting a result automatically centers the map on the corresponding feature and opens its information panel.

### Browse by Category

A category browser located in the upper-left corner of the map **<span style="color:#0b00ffff">(2)</span>** allows visitors to explore all available features grouped by category.

<p align="center">
    <img src="screenshots/category-browser.png" width="40%">
</p>

Depending on your installation, categories may include:

* Residential unit types
* Amenities
* Buildings
* Services
* Other custom feature groups

This provides an alternative navigation method for visitors who wish to browse available locations rather than search for a specific name.

# Exploring the Map

Visitors can navigate the map **<span style="color:#0b00ffff">(3)</span>** using familiar Google Maps controls.

They may:

* Pan the map by dragging.
* Zoom in and out.
* Select individual buildings or units.
* Explore the entire campus interactively.

Selecting a feature—either directly from the map or through one of the search tools—opens the information panel containing detailed information about that location.

> **Note:** To keep navigation focused on the campus or facility, the map includes built-in geographic boundaries. Users can zoom only within predefined limits and can pan the map only within the configured campus extent. This geofencing prevents visitors from navigating too far away from the area of interest while still allowing them to freely explore the entire mapped site.

# Multi-Level Building Support

The Interactive Campus Map supports buildings with multiple floors.

A floor selector located in the lower-right corner of the map **<span style="color:#0b00ffff">(4)</span>** allows visitors to switch between available levels.

Users may:

* Click the floor selector buttons.
* Scroll the mouse wheel while hovering over the floor selector.

The map automatically updates to display only the features located on the selected floor.

# Layer Controls

The map includes a layer management tool **<span style="color:#0b00ffff">(5)</span>** that allows visitors to customize the displayed information.

Available layers may include:

* Buildings
* Paths and roads
* Land use
* Labels
* Points of interest (markers)

Individual layers can be shown or hidden depending on the visitor's preferences.

For certain layers, including buildings, parks, and land-use polygons, transparency can also be adjusted to improve visibility or emphasize specific information.

# Legend

A collapsible legend is available in the lower-left corner of the map **<span style="color:#0b00ffff">(6)</span>**.

The legend explains the symbols and colors used throughout the map and can be expanded or collapsed at any time without affecting navigation.

# Map Styles

Visitors can switch between different Google Maps background styles directly from the map interface **<span style="color:#0b00ffff">(7)</span>**.

Available options include:

* Standard Road Map
* Satellite View

Although a default background can be configured by the administrator, visitors remain free to switch between available map styles during their session.

# Google Maps Navigation Tools

Because the plugin is built on Google Maps, visitors also benefit from the standard Google Maps navigation controls **<span style="color:#0b00ffff">(8)</span>**.

These include:

* Zoom controls
* Compass (where supported)
* Street View (where available)

These familiar tools make the interface immediately accessible to most users.

# The Information Panel

Whenever a feature is selected, an information panel opens to display all available information associated with that location.

Depending on the configured content, this panel may include:

* Photo gallery
* Floor plans
* Videos
* Unit specifications
* Custom descriptions
* Information imported from the linked WordPress page
* A direct link to the full webpage

This allows visitors to access detailed information without leaving the interactive map while still providing quick access to the corresponding website page when additional information is available.

<p align="center">
    <img src="screenshots/information-panel.png" width="100%">
</p>

## Image Gallery and Videos

The top portion of the information panel displays the media gallery **<span style="color:#0b00ffff">(1)</span>** for the selected feature.

This gallery may contain:

* Photographs
* Floor plans
* Promotional videos

Users can browse the gallery by moving the mouse cursor toward the left or right edge of the gallery or by using the navigation controls provided.

Selecting any image or video opens it in full-screen mode for easier viewing.

## Unit Information

Below the media gallery, visitors can quickly view the key characteristics of the selected unit **<span style="color:#0b00ffff">(2)</span>**.

Depending on the available information, this may include:

* Square footage
* Number of bathrooms
* Fireplace availability
* Sunroom availability

This information provides an immediate overview of the property's main characteristics before reading the complete description.

## Floor Plans

When available, the floor plan is displayed within the information panel to provide visitors with an overview of the unit layout.

## Description

The lower portion of the information panel displays descriptive information about the selected feature.

This may include:

* Custom information created specifically for the interactive map **<span style="color:#0b00ffff">(3)</span>**.
* Content automatically imported from the linked WordPress page **<span style="color:#0b00ffff">(4)</span>**.

These two sources work together to provide comprehensive information while avoiding unnecessary duplication of content.

## Link to the Website

At the bottom of the information panel, visitors can access a direct link to the associated WordPress page **<span style="color:#0b00ffff">(5)</span>**.

This allows them to continue exploring additional information available on the main website whenever desired.

# Responsive Design

The Interactive Campus Map has been designed to function across a wide range of devices.

The interface automatically adapts to:

* Desktop computers
* Laptops
* Tablets
* Mobile phones

Menus, navigation panels, and map controls are rearranged automatically to provide the best possible experience on smaller screens while preserving the full functionality of the application.

# Future Developments

The Interactive Campus Map is designed as an evolving platform.

Future versions will continue to introduce new capabilities and improvements based on customer feedback.

One of the major planned enhancements is support for navigation and routing.

This future functionality will allow visitors to:

* Generate routes between locations within the campus.
* Navigate through buildings and across multiple floors where applicable.
* Launch external navigation through Google Maps for directions to the facility or selected destinations.

As the platform evolves, additional customization options and new interactive features will continue to be introduced while maintaining compatibility with existing installations.

# 1. Plugin Management

The Bawbab Interactive Map is installed and managed like any standard WordPress plugin. This section explains how to activate, update, and manage the plugin safely.

## Activating or Deactivating the Plugin

From the WordPress **Plugins** page, you can activate or deactivate the plugin **<span style="color:#0b00ffff">(1)</span>**.

* **Deactivate** disables the interactive map on your website.
* Deactivating **does not delete any of your data or settings**.
* All imported map data, custom information, and configuration remain stored and will be available again once the plugin is reactivated.

This is the recommended method if you temporarily wish to disable the map.

> **Important:** Deactivating the plugin is safe and non-destructive.

## Uninstalling the Plugin

WordPress also provides an option to uninstall the plugin.

⚠️ **Warning:** Uninstalling the plugin permanently removes:

* All imported map data
* All custom information
* All plugin settings
* Any other data managed by the plugin

This action **cannot be undone**.

Unless specifically instructed by our support team, **do not uninstall the plugin**.

## Installing / Updating the Plugin

At the moment, plugin updates are performed manually.

To install a new version:

1. Go to **Plugins → Add New Plugin** **<span style="color:#0b00ffff">(2)</span>**.
2. Select **Upload Plugin** **<span style="color:#0b00ffff">(3)</span>**.
3. Choose the plugin ZIP file provided by our team.
4. Click **Install** **<span style="color:#0b00ffff">(4)</span>**.
5. WordPress will detect if the plugin already exists and will install or replace it with the latest version **<span style="color:#0b00ffff">(5)</span>**..
6. Reactivate the plugin if required.

Our team will provide updated plugin versions whenever new features, improvements, or bug fixes are available.

<p align="center">
    <img src="screenshots/add-plugin.png" width="100%">
</p>

<p align="center">
    <img src="screenshots/upload-plugin.png" width="100%">
</p>

<p align="center">
    <img src="screenshots/replace-plugin.png" width="100%">
</p>

## Will an Update Delete My Data?

No.

Plugin updates are designed to be **non-destructive**.

During an update:

* Imported map data is preserved.
* Custom information remains intact.
* Marker information is preserved.
* Map settings remain unchanged.

Only the plugin files themselves are replaced.

Every update is tested before release to ensure compatibility with existing data.

# 2. Map Settings

The **Map Settings** menu contains all configuration options for the interactive map.

The page displays a live map preview on the right while configuration options are organized into several tabs.

<p align="center">
    <img src="screenshots/map-settings.png" width="100%">
</p>

## General

The **General** tab allows you to customize the overall appearance of the interactive map.

### Map Description

A general description field is available for documentation purposes **<span style="color:#0b00ffff">(1)</span>**.

At the moment, this description is **not displayed publicly** on the website but may be used in future versions of the plugin.

### Logo

You can upload or replace the logo displayed at the top of the interactive map **<span style="color:#0b00ffff">(2)</span>**.

This is typically used to display your organization's logo or branding.

### Navigation Bar Background

You can also change the background image used in the navigation bar displayed above the map **<span style="color:#0b00ffff">(3)</span>**.

This allows you to personalize the appearance of the map to match your website or organization branding.

## Locations

The **Locations** tab allows you to create custom points of interest displayed on the map.

Examples include:

* Main Entrance
* Reception
* Parking
* Visitor Center
* Amenities
* Emergency Assembly Point

<p align="center">
    <img src="screenshots/add-locations.png" width="100%">
</p>

### Adding a Location

Click the **+ (Add)** button to create a new marker.

For each location, you can specify:

* Title **<span style="color:#0b00ffff">(1)</span>**.
* Latitude **<span style="color:#0b00ffff">(2)</span>**.
* Longitude **<span style="color:#0b00ffff">(2)</span>**.
* Image **<span style="color:#0b00ffff">(3)</span>**.
* Description **<span style="color:#0b00ffff">(4)</span>**.

When visitors click the marker on the map, the title, image, and description are displayed.

### Showing or Hiding Markers

Each marker includes a visibility toggle **<span style="color:#0b00ffff">(5)</span>**.

This allows you to temporarily hide a location without deleting it.

### Future Improvements

The current system requires entering the coordinates manually.

A future version of the plugin may allow markers to be added simply by clicking directly on the map, making marker creation even easier.

## Importer

The **Importer** is used to import or update the geographic data displayed by the map.

<p align="center">
    <img src="screenshots/importer.png" width="100%">
</p>

### Supported Layers

Currently, the importer supports the following layers:

* Parcels (campus boundaries and property outlines)
* Buildings
* Roads and Paths
* Land Use (background polygons)

### Importing Data

To import data:

1. Select the layer you wish to import **<span style="color:#0b00ffff">(1)</span>**.
2. Choose the corresponding GeoJSON file from your computer **<span style="color:#0b00ffff">(2)</span>**.
3. Start the import **<span style="color:#0b00ffff">(3)</span>**.

Selecting the correct layer is important because the plugin automatically associates imported features with the appropriate styling and editing tools.

Our team will provide the latest GeoJSON files whenever updated geographic data becomes available.

### Updating Existing Geographic Data

When updated geographic information becomes available—for example, if building outlines or paths have changed—you can simply import the updated GeoJSON file.

Updating geographic data is designed to be **non-destructive**.

The process updates:

* Geometries
* Feature identifiers
* Geographic information

while preserving:

* Custom descriptions
* Images
* Linked webpages
* User-entered information
* Other customized content

This allows the geographic data to evolve without requiring the website content to be recreated.

### Clearing a Layer

A **Clear Layer** button is also available **<span style="color:#0b00ffff">(4)</span>**.

⚠️ **Warning:** This action is destructive.

Using this option permanently removes:

* Every feature in the selected layer
* All associated custom information
* Any edits linked to that layer

This option should only be used if you intentionally want to completely reset a layer or if instructed by our support team.

## Settings

The **Settings** tab contains global configuration options for the map.

<p align="center">
    <img src="screenshots/layout-settings.png" width="100%">
</p>

### Google Maps Background

You can choose the Google Maps background style used beneath the campus map **<span style="color:#0b00ffff">(1)</span>**.

Available options include:

* Road Map
* Satellite
* Hybrid

### Highlight Color

You can customize the color used throughout the map interface **<span style="color:#0b00ffff">(2)</span>**.

Current color themes include:

* Green
* Blue
* Yellow

Additional color themes may be introduced in future versions.

### Google Maps API Key and Map ID

The plugin requires two Google Maps credentials:

* Google Maps API Key
* Google Map ID

The current installation is configured using credentials provided by BawBab.

For production use, we recommend creating your own credentials under your Google Cloud account.

Using your own API credentials provides:

* Full control over billing
* Usage monitoring
* Independent quota management
* Better long-term security

After creating your credentials, simply enter the values in the corresponding fields **<span style="color:#0b00ffff">(3)</span>** and click **Save All Changes**.

# Creating Your Own Google Maps API Key

Google provides a generous free monthly usage allowance for Google Maps.

For small and medium-sized websites, usage typically remains within the free tier, meaning **most organizations will incur little or no cost** unless traffic becomes very high.

To create your own credentials:

1. Sign in to the Google Cloud Console.
2. Create a new Google Cloud project (or select an existing one).
3. Enable the **Maps JavaScript API**.
4. Create an **API Key** under **APIs & Services → Credentials**.
5. Restrict the API key to your website's domain for improved security.
6. Create a **Map ID** by navigating to **Google Maps Platform → Map Management**.
7. Choose the desired map style and create a new Map ID.
8. Copy both the API Key and the Map ID into the plugin's **Settings** page.
9. Click **Save All Changes**.

We strongly recommend restricting your API key to authorized domains and enabling only the APIs required by the plugin. This helps protect your account from unauthorized usage.

If you need assistance creating or configuring your Google Maps credentials, our team can guide you through the process.

# 3. Feature Editor ("Edit Tools")

The **Edit Tools** section allows you to customize the information displayed for each feature on the interactive map.

Unlike the **Map Settings**, which control the appearance and geographic data of the map, the **Edit Tools** are used to manage the metadata associated with individual features, such as residential units.

<p align="center">
    <img src="screenshots/feature-editor.png" width="100%">
</p>

The interface is divided into two main sections:

* A panel on the left used to browse and search available features **<span style="color:#0b00ffff">(1)</span>**.
* A detailed editing form on the right that displays the information for the selected feature **<span style="color:#0b00ffff">(2)</span>**.

## Browsing Features

All editable features are organized into groups to make navigation easier.

For example, residential units may be grouped as:

* One Bedroom – Standard
* One Bedroom – Expanded
* Two Bedroom
* Studio
* Cottage
* Townhouse

The exact groups available depend on the imported map data.

## Filtering Features

Several filtering options are available to help locate the feature you wish to edit **<span style="color:#0b00ffff">(3)</span>**.

You can browse by category or use the available filters to narrow down the list.

Additional filtering options can also be added in future versions if needed. For example:

* Units with fireplaces
* Units with sunrooms
* Unit categories
* Other custom attributes

If additional filtering capabilities become useful for your workflow, they can be incorporated into future updates.

## Searching for a Specific Unit

A search bar is provided above the feature list **<span style="color:#0b00ffff">(4)</span>**.

You can simply begin typing the name or identifier of a unit to quickly locate it.

Once selected, the editing panel opens automatically and displays all available information for that feature.

# Feature editor form

<p align="center">
    <img src="screenshots/feature-editor-form.png" width="60%">
</p>

# Linking a WordPress Page

The first step when configuring a feature is usually to associate it with an existing WordPress page **<span style="color:#0b00ffff">(1)</span>**.

Click **Link WordPress Page**.

A searchable list of your website pages will appear, allowing you to either:

* Search for the page by name.
* Browse through the available pages.

Once a page has been selected, the plugin automatically retrieves information from that page.

By default, the following content is imported:

* Page title
* Text content
* Images
* Embedded videos

This significantly reduces duplicate work since most information can be managed directly from WordPress while still being displayed inside the interactive map.

## Automatically Ignored Content

Not every element from the WordPress page is imported.

Certain elements are intentionally ignored because they are intended for page layout rather than map content.

These include:

* Links
* Buttons
* Tables
* Forms
* Scripts
* Styling information
* Embedded iframes
* WordPress Button blocks
* WordPress File blocks
* WordPress Table blocks

This filtering helps ensure that the information displayed inside the interactive map remains clean, readable, and focused on the content relevant to visitors.

# Customizing Individual Features

After linking a WordPress page, you can override or supplement the imported information using the custom fields provided in the editor.

These custom values apply only to the selected feature.

## Display Title

The **Display Title** allows you to override the title imported from the linked WordPress page **<span style="color:#0b00ffff">(2)</span>**.

If left empty, the page title is displayed.

If a custom display title is entered, it replaces the default page title within the interactive map while leaving the original WordPress page unchanged.

## Unit Information

Several fields allow you to customize the information presented for each residential unit **<span style="color:#0b00ffff">(3)</span>**.

These include:

* Square Footage
* Number of Bathrooms
* Fireplace
* Sunroom

These values are displayed directly within the map interface and allow visitors to quickly compare available units.

## Bathroom Numbering

Bathrooms are represented using the standard real estate notation.

Examples include:

| Value   | Displayed Meaning                                                                               |
| ------- | ----------------------------------------------------------------------------------------------- |
| **1**   | One full bathroom (one shower/bath, one toilet & sink)                                          |
| **2**   | Two full bathrooms                                                                              |
| **1.5** | One full bathroom and one additional half bathroom (one shower/bath, two toilets & sinks)       |

This notation is commonly used throughout the website and the interactive map.

# Videos and Floor Plans

When a WordPress page is linked, the plugin automatically retrieves the associated video and floor plan information from the website's **Advanced Custom Fields (ACF)** configuration.

Normally, no additional configuration is required.

However, several customization options are available **<span style="color:#0b00ffff">(4)</span>**.

## Hiding Videos or Floor Plans

For any individual feature, you may choose to hide:

* The video
* The floor plan

Simply enable the corresponding toggle.

The original information remains available on the linked WordPress page but will no longer appear inside the interactive map for that specific feature.

## Using Custom Videos

If a particular unit should display a different video than the one associated with the linked WordPress page, you can provide a custom video URL.

When a custom URL is specified, it takes precedence over the automatically imported video.

## Using a Custom Floor Plan

Similarly, you may choose a different floor plan image for an individual feature.

The image can be selected directly from the WordPress Media Library.

Once selected, this image replaces the default floor plan imported from the linked page.

# Custom Description

Each feature can also contain its own custom description **<span style="color:#0b00ffff">(5)</span>**.

This provides flexibility when individual units require additional information beyond what appears on the linked WordPress page.

Two behaviors are available.

### Replace the Existing Description

If the **Append** option is disabled, the custom description completely replaces the description imported from the linked WordPress page.

### Append to the Existing Description

If the **Append** option is enabled **<span style="color:#0b00ffff">(6)</span>**, the custom description is inserted before the description imported from the linked page.

This allows you to add feature-specific notes while still keeping the original page content.

This is particularly useful for highlighting:

* Limited-time information
* Unit-specific characteristics
* Availability notes
* Recent renovations
* Promotional information

without modifying the original WordPress page.

# Custom Images

Additional images may be assigned to any individual feature **<span style="color:#0b00ffff">(7)</span>**.

Images can be selected directly from the WordPress Media Library, or newly uploaded if required.

These images are displayed only for the selected feature within the interactive map and do not modify the linked WordPress page.

This allows each unit to have its own image gallery whenever needed.

# Saving Your Changes

The **Feature Editor** allows you to modify multiple features before saving your work.

For example, you may edit several residential units, amenities, or other map features in succession, making changes to their metadata without saving after each individual edit.

Once you have completed all desired modifications, click **Save All Changes** **<span style="color:#0b00ffff">(8)</span>**.

The plugin will save all pending changes simultaneously and apply them to every feature that has been modified during the current editing session.

If you decide not to keep your edits, click **Cancel** instead.

This discards all unsaved changes made during the current editing session and restores the previously saved values.

After clicking **Save All Changes**, your updates are stored by the plugin and will be reflected the next time visitors view the interactive map.

# Feature Location Preview

At the bottom of the editing page, a miniature interactive map displays the geographic location of the currently selected feature **<span style="color:#0b00ffff">(9)</span>**.

This preview allows you to quickly verify that you are editing the correct unit and provides additional context without needing to return to the main interactive map.

# 4. Integrating the Map into Your Website

The Interactive Campus Map can be embedded into your website in different ways depending on which WordPress editor you are using.

The plugin supports both:

* The **Classic WordPress Editor**
* The **Gutenberg (Block) Editor**

Although both methods produce the same interactive map, the insertion and customization process differs slightly.

# Using the Classic WordPress Editor

If your website uses the Classic WordPress Editor, the map can be inserted using a shortcode.

## Adding the Map to a Page

Open the page where you would like the interactive map to appear.

In the editor toolbar, click the **Map** icon.

The plugin automatically inserts the required shortcode into your page.

After publishing or updating the page, the interactive map will appear in the selected location.

## Default Map Size

By default, the embedded map is displayed:

* At **100%** of the available content width.
* With a default height of **640 pixels**.

The height can be adjusted if a different size better suits your page layout.

The width automatically follows the width of the page content container, allowing the map to integrate naturally into your website's design.

Future versions of the plugin may include additional display and layout customization options.

# Controlling Which Page Content Appears on the Map

When a WordPress page is linked to a feature, the plugin automatically extracts its content and displays it inside the information panel (side drawer) when visitors select that feature.

The Classic Editor provides an easy way to control exactly which parts of the page should appear inside the map.

This is accomplished using the **Map Visibility** toolbar button.

## The Map Visibility Toolbar

The **Map Visibility** button provides two options:

* **Include Section on Map**
* **Exclude Section on Map**

To use either option:

1. Select the content you wish to modify.
2. Click the **Map Visibility** button.
3. Choose either **Include Section on Map** or **Exclude Section on Map**.

The selected content is automatically wrapped in the appropriate shortcode.

These shortcodes affect **only** the information displayed inside the map and **do not modify the appearance of the original WordPress page**.

## Include Section on Map

The **Include** option works as a **whitelist**.

When at least one **Include** shortcode is present on a page, **only** the content contained within the included sections will appear inside the map.

Everything outside those sections is ignored.

This option is particularly useful when a page contains a large amount of information but only a small portion should be displayed in the map's information panel.

## Exclude Section on Map

The **Exclude** option works as a **blacklist**.

All page content is displayed inside the map **except** the sections wrapped inside the **Exclude** shortcode.

This is useful when only a few elements—such as lengthy tables, forms, or supplementary information—should be hidden from the map while leaving the remainder of the page unchanged.

## Combining Include and Exclude

Depending on your needs, you can choose the approach that best matches your content structure:

* Use **Include** when only specific sections should appear in the map.
* Use **Exclude** when most of the page should appear and only a few sections should be hidden.

These tools make it possible to maintain a single WordPress page while presenting a simplified, map-friendly version of its content.

## Interaction with the Feature Editor

The **Feature Editor** provides an additional level of customization.

Any custom information entered in the **Feature Editor**—such as custom descriptions, images, videos, or display titles—takes precedence over the content imported from the linked WordPress page.

In other words:

* The **WordPress page** defines the default content.
* **Include** and **Exclude** controls determine which portions of that page are displayed in the map.
* The **Feature Editor** can then override this information for individual features whenever additional customization is required.

This layered approach provides both efficient content management and fine-grained control over individual units.

## Featured Images

If a linked WordPress page has a **Featured Image**, it is always displayed within the map's information panel.

This image serves as the primary visual representation of the page and cannot currently be excluded using the Include or Exclude tools.

All other page content remains fully customizable using the visibility controls described above.

# Using the Gutenberg (Block) Editor

If your website uses the Gutenberg editor, the map can be inserted as a native WordPress block.

## Adding the Map

Open the desired page in the Gutenberg editor.

Click **Add Block** and search for the Interactive Campus Map block.

Insert the block into your page just like any other Gutenberg block.

This provides a more integrated editing experience than using shortcodes.

## Block Settings

When the map block is selected, several display options become available.

Depending on your version of the plugin, you can configure:

* Map height
* Map width
* Default zoom level

These settings allow the embedded map to better match the layout of your page.

# Controlling Content Visibility in Gutenberg

Unlike the Classic Editor, Gutenberg does not rely on shortcodes to control which content appears inside the map.

Instead, visibility is managed using CSS classes assigned directly to individual blocks.

## Including Content

To force a block to appear inside the map:

1. Select the desired block.
2. Open the block settings sidebar.
3. Expand the **Advanced** section.
4. Locate **Additional CSS class(es)**.
5. Add the following class:

`map-include`

Any block assigned this class will be included in the map content.

## Excluding Content

To prevent a block from appearing inside the map:

1. Select the desired block.
2. Open **Advanced** settings.
3. Locate **Additional CSS class(es)**.
4. Add:

`map-exclude`

The selected block will continue to appear on the webpage but will be omitted from the information panel displayed by the interactive map.

## Choosing Between Include and Exclude

The behavior is identical to the Classic Editor:

* `.map-include` functions as a whitelist, displaying only marked content when include rules are used.
* `.map-exclude` functions as a blacklist, removing only the marked content while leaving the remainder visible.

This provides the same flexibility as the shortcode system while taking advantage of Gutenberg's block-based editing interface.

# 5. Troubleshooting & Frequently Asked Questions

This section addresses the most common questions and issues you may encounter while using the Bawbab Interactive Maps.

If your issue is not covered below, please contact our support team for assistance.

# My changes are not visible on the website

In most cases, this is caused by cached content rather than the plugin itself.

Before troubleshooting further, try the following:

1. Refresh the page using **Ctrl + F5** (Windows) or **Cmd + Shift + R** (Mac) to force your browser to reload the latest version.
2. Clear your browser cache if the changes are still not visible.
3. If your website uses a WordPress caching plugin or server-side caching, clear the website cache as well.
4. Reload the page and verify whether the changes are now displayed.

Some hosting providers also maintain their own cache, which may need to be cleared before updates become visible.

If the issue persists after clearing all caches, please contact our support team.

# How do I clear my browser cache?

The exact procedure depends on your browser, but the most common methods are:

* Press **Ctrl + Shift + Delete** (Windows/Linux)
* Press **Cmd + Shift + Delete** (Mac)

This opens the browser's cache management window, where you can clear cached images and files.

Alternatively, for a quick refresh after making changes, you can usually use:

* **Ctrl + F5** (Windows)
* **Cmd + Shift + R** (Mac)

to force the browser to reload the latest version of the page without relying on cached content.

# How do I clear the WordPress cache?

If your website uses a caching plugin, a **Clear Cache**, **Purge Cache**, or **Flush Cache** button is often available in the WordPress administration toolbar.

Some hosting providers also provide their own cache management tools within the hosting control panel.

If you are unsure whether caching is enabled, consult your website administrator or hosting provider.

# The information from my linked WordPress page is not appearing on the map

Several factors may cause this.

First, verify that the correct WordPress page has been linked to the feature using the **Feature Editor**.

Next, check whether **Include** or **Exclude** visibility rules have been applied to the page.

Remember:

* **Include** displays only the sections explicitly marked for inclusion.
* **Exclude** hides only the selected sections while displaying the remainder of the page.

If the expected content still does not appear, verify whether the missing elements belong to one of the content types intentionally ignored by the plugin.

The plugin does not import:

* Links
* Buttons
* Tables
* Forms
* Scripts
* Styles
* Embedded iframes
* WordPress Button blocks
* WordPress File blocks
* WordPress Table blocks

These elements are excluded intentionally because they are generally intended for webpage layout rather than display inside the map.

# Will updating the GeoJSON overwrite my custom information?

No.

Updating geographic data has been specifically designed to preserve your custom content whenever possible.

When importing a new GeoJSON file, the plugin identifies existing features using their unique **Feature ID (FID)** together with the layer type.

For every feature already present in the database, the plugin updates only the geographic information that needs to change.

This includes:

* Feature geometry
* Position
* Other geographic properties contained in the imported dataset

At the same time, all information customized through WordPress is preserved.

Examples include:

* Linked WordPress page
* Custom display title
* Custom description
* Square footage
* Bathroom count
* Fireplace information
* Sunroom information
* Custom video URL
* Custom floor plan
* Hidden video settings
* Hidden floor plan settings
* Image gallery

These values always take priority over the imported data.

# What happens if a field is empty?

During an import, the plugin follows a simple priority system.

If information already exists inside the WordPress database, it is preserved.

If a field in WordPress is empty but the imported GeoJSON contains a value, the imported value is used.

If both the WordPress field and the imported GeoJSON field are empty, the field simply remains empty.

Likewise, empty values contained in the GeoJSON never overwrite existing information stored in WordPress.

This approach minimizes the risk of accidentally losing manually entered content.

# Can I update metadata by importing a new GeoJSON?

Generally, no.

The importer is primarily intended to update the **geographic data** rather than replace manually managed content.

This design choice allows updated building outlines, paths, parcels, and other spatial information to be distributed without affecting the customizations made through WordPress.

The consequence is that changes to metadata inside the GeoJSON will not overwrite information that already exists in the WordPress database.

This behavior is intentional and helps protect administrator-entered content.

If you intentionally wish to replace all metadata with the information contained in a new dataset, you must first reset the corresponding layer (or reinstall the plugin) before importing the new data.

⚠️ **Warning:** Resetting a layer permanently removes all customizations associated with that layer.

# What happens when new buildings are added to the GeoJSON?

If the imported dataset contains features that do not yet exist in the database, the plugin automatically creates them.

Existing features are updated while preserving their custom information, and new features are added automatically.

This makes it possible to expand the map over time without affecting the information already configured for existing buildings or units.

# How do I prepare GeoJSON data for import?

The plugin accepts standard GeoJSON files, provided they follow the data structure expected by the importer.

Each feature should contain a unique Feature ID (FID) together with the properties required by the corresponding map layer.

Typical imported properties include:

* Feature ID
* Name
* Category
* Code
* Geographic coordinates
* Geometry
* Layer-specific attributes

Some information—such as custom descriptions, linked WordPress pages, galleries, custom videos, and floor plans—is intentionally managed within WordPress rather than imported from the GeoJSON.

This separation allows geographic updates to remain independent from website content management.

If you already maintain your data in GIS software such as QGIS or ArcGIS, you can typically export your layers directly as GeoJSON before importing them into the plugin.

# I already have Shapefiles. Can I use them?

Yes.

If your spatial data is currently stored as ESRI Shapefiles (or another GIS format), you can export the layers as GeoJSON using most GIS software.

Once exported, the resulting GeoJSON files can be imported using the plugin's **Importer** tool.

Depending on your workflow, some adjustments to the attribute names or structure may be required to match the format expected by the plugin.

If you need assistance preparing your data, we would be happy to help.

# I don't have any GIS data. Can you create it for me?

Yes.

If your campus or facility has not yet been digitized, we can prepare the geographic data on your behalf.

Our team can assist with:

* Digitizing buildings
* Creating parcels and campus boundaries
* Drawing roads and pedestrian paths
* Mapping amenities and points of interest
* Organizing the data for use within the plugin
* Preparing GeoJSON files ready for import

Once completed, the data can be imported directly into your website using the Importer or installed by our team as part of the deployment process.

# I Still Need Help

If you encounter an issue that is not covered in this guide, or if you would like assistance with installation, configuration, data preparation, plugin updates, or future enhancements, please contact our support team.

We are happy to assist with:

* Troubleshooting technical issues
* Plugin installation and configuration
* Plugin updates
* GIS data preparation and digitization
* Importing or updating map data
* Custom feature development
* Additional customization requests

You can contact us using the following email addresses:

**Corentin Sanchez Trenado**
Email: **[corentins@bawbab.com](mailto:corentins@bawbab.com)**

**Marcellus Oketch**
Email: **[oketchmarcellus@bawbab.com](mailto:oketchmarcellus@bawbab.com)**

We will be happy to answer your questions and provide guidance to help you get the most out of the Bawbab Interactive Maps.


