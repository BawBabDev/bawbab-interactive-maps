<?php
/**
 * Plugin Name:       Bawbab Interactive Maps
 * Description:       Bawbab Interactive Maps is a campus and facilities map plugin for WordPress with Pedestrian Indoor Routing.
 * Version:           0.1.0
 * Requires at least: 6.8
 * Requires PHP:      7.4
 * Author:            Bawbab Technologies
 * Author URI:        https://www.bawbab.com/
 * Contributors:      Marcel Oketch, Dr. Coretin Sanchez
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       bawbab-interactive-maps
 *
 * @package CreateBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

// ==========================================
// SEPARATE MODULAR FILES FOR DB TABLE SETUP AND REST API ENDPOINTS REGISTRATION
// ==========================================
require_once plugin_dir_path( __FILE__ ) . 'includes/db/dbtables/bawbin-maps-general-spatial-dbtable.php'; // general spatial db setup
require_once plugin_dir_path( __FILE__ ) . 'includes/db/dbtables/bawbin-maps-nav-entries-dbtable.php'; // nav entries db setup
require_once plugin_dir_path( __FILE__ ) . 'includes/db/dbtables/bawbin-maps-nav-network-dbtable.php'; // nav network db setup
require_once plugin_dir_path( __FILE__ ) . 'includes/apis/class-bawbin-maps-federated-api.php'; // Federated Bawbab REST API endpoints

// ==========================================
// ONETIME ACTIVATION HOOKS FOR DB TABLE CREATION
// ==========================================
register_activation_hook( __FILE__, 'bawbin_maps_create_general_spatial_dbtable' ); // General spatial data table activation
register_activation_hook( __FILE__, 'bawbin_maps_create_nav_entries_dbtable' ); // Nav entries table activation
register_activation_hook( __FILE__, 'bawbin_maps_create_nav_network_dbtable' ); // Nav network table activation


// ==========================================
// SMART DATABASE SCHEMA VERSIONING & MIGRATION
// ==========================================
require_once plugin_dir_path( __FILE__ ) . 'includes/db/class-bawbin-maps-smart-db-migration-engine.php'; // BIM map db migrator for schema versioning and migrations

// Activate or Initialise the migration coordinator hooks immediately this file is loaded
BAWBIN_Maps_Smart_DB_Migrator::init();

// ==========================================
// SHORTCODE REGISTRATION
// ==========================================
require_once plugin_dir_path( __FILE__ ) . 'includes/shortcodes/class-bawbin-maps-shortcode.php'; // Main interactive map shortcode registration


// ==========================================
// BLOCKS AND BLOCK ASSETS REGISTRATION
// ==========================================

function bawbin_maps_block_init() {
    if ( function_exists( 'wp_register_block_types_from_metadata_collection' ) ) {
        wp_register_block_types_from_metadata_collection( __DIR__ . '/build', __DIR__ . '/build/blocks-manifest.php' );
    }
}
add_action( 'init', 'bawbin_maps_block_init' );


// ==========================================
// INTEGRATIONS REGISTRATION
// ==========================================
// TinyMCE Visual Editor Button Integration
require_once plugin_dir_path( __FILE__ ) . 'includes/integrations/class-bawbin-maps-tinymce-veditor-btn.php'; // TinyMCE Visual Editor Button Integration


// ==========================================
// FEDERATED REST API ENDPOINTS CONTROLLERS ACTIVATION
// ==========================================
new BAWBIN_Maps_Federated_API_Controller();


// ==========================================
// CORE INIT & SETTINGS REGISTRATION- BELLY OF THE BEAST
// ==========================================
// Load the map options registry to register settings schema first before any other code that may depend on it
require_once plugin_dir_path( __FILE__ ) . 'includes/core/bawbin-maps-options.php';


// ==========================================
// ADMIN UI & ASSETS REGISTRATION
// ==========================================

// Call back for rendering all the admin page content
function bawbin_maps_render_admin_page() {
    echo '<div class="wrap"><div id="bawbin-maps-admin-app"></div></div>';
}

// Include the admin menu registration file
require_once plugin_dir_path( __FILE__ ) . 'includes/core/bawbin-maps-admin-menu.php';

// Load administrative asset bundles script loader
require_once plugin_dir_path( __FILE__ ) . 'includes/core/bawbin-maps-hook-admin-assets.php';

// Load bundled frontend assets
require_once plugin_dir_path( __FILE__ ) . 'includes/core/bawbin-maps-hook-block-assets.php';