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
//SEPARATE MODULAR FILES FOR DB TABLE SETUP AND REST API ENDPOINTS REGISTRATION
// ==========================================
require_once plugin_dir_path( __FILE__ ) . 'includes/db/dbtables/bwb-general-spatial-dbtable.php';//general spatial db setup
require_once plugin_dir_path( __FILE__ ) . 'includes/db/dbtables/bwb-nav-entries-dbtable.php';//nav entries db setup
require_once plugin_dir_path( __FILE__ ) . 'includes/db/dbtables/bwb-nav-network-dbtable.php';//nav network db setup
require_once plugin_dir_path( __FILE__ ) . 'includes/apis/class-bwb-federated-imaps-api.php';//Federated Bawbab Imaps REST API endpoints

// ==========================================
//ONETIME ACTIVATION HOOKS FOR DB TABLE CREATION
// ==========================================
register_activation_hook( __FILE__, 'bwb_create_general_spatial_dbtable' );//General spatial data table activation
register_activation_hook( __FILE__, 'bwb_create_nav_entries_dbtable' );//Nav entries table activation
register_activation_hook( __FILE__, 'bwb_create_nav_network_dbtable' );//Nav network table activation


// ==========================================
// SMART DATABASE SCHEMA VERSIONING & MIGRATION
// ==========================================
require_once plugin_dir_path( __FILE__ ) . 'includes/db/class-smart-db-migration-engine.php';//BIM map db migrator for schema versioning and migrations

// Activate or Initialise the migration coordinator hooks immediately this file is loaded
BWB_Smart_DB_Migrator::init();

// ==========================================
//SHORTCODE REGISTRATION
//=========================================
require_once plugin_dir_path( __FILE__ ) . 'includes/shortcodes/class-bwb-imap-shortcode.php';//Main interactive map shortcode registration


// ==========================================
//BLOCKS AND BLOCK ASSETS REGISTRATION
// ==========================================

function create_block_bawbab_interactive_maps_block_init() {
    if ( function_exists( 'wp_register_block_types_from_metadata_collection' ) ) {
        wp_register_block_types_from_metadata_collection( __DIR__ . '/build', __DIR__ . '/build/blocks-manifest.php' );
    }
}
add_action( 'init', 'create_block_bawbab_interactive_maps_block_init' );


// ==========================================
//INTEGRATIONS REGISTRATION
// ==========================================
//TinyMCE Visual Editor Button Integration
require_once plugin_dir_path( __FILE__ ) . 'includes/integrations/class-bwb-tinymce-veditor-btn.php';//TinyMCE Visual Editor Button Integration


// ==========================================
//FEDERATED REST API ENDPOINTS CONTROLLERS ACTIVATION
// ==========================================
new BWB_Federated_Imaps_API_Controller();


// ==========================================
// CORE INIT & SETTINGS REGISTRATION- BELLY OF THE BEAST
// ==========================================
// Load the map options registry to register settings schema first before any other code that may depend on it
require_once plugin_dir_path( __FILE__ ) . 'includes/core/bwb-imaps-options.php';


// ==========================================
// ADMIN UI & ASSETS REGISTRATION
// ==========================================

//Call back for rendering all the admin page content
function bwb_imaps_render_admin_page() {
    echo '<div class="wrap"><div id="bwb-imaps-admin-app"></div></div>';
}
// Include the admin menu registration file
require_once plugin_dir_path( __FILE__ ) . 'includes/core/bwb-imaps-admin-menu.php';


// Load administrative asset bundles script loader
require_once plugin_dir_path( __FILE__ ) . 'includes/core/bwb-imaps-hook-admin-assets.php';


// ==========================================
// FRONTEND SETTINGS & ASSETS REGISTRATION
// ==========================================
// Inside your root plugin file:
if ( file_exists( plugin_dir_path( __FILE__ ) . 'includes/bwb-imaps-hook-global-assets.php' ) ) {
    require_once plugin_dir_path( __FILE__ ) . 'includes/bwb-imaps-hook-global-assets.php';
}

// Load bundled frontend assets
require_once plugin_dir_path( __FILE__ ) . 'includes/core/bwb-imaps-hook-block-assets.php';

// ==========================================
// DEBUGGING: CURRENT SCREEN ID DISPLAY
// ==========================================

// For debugging: Display the current screen ID or Admin hook in an admin notice
//This helps ensure the plugin assets are loading on the correct admin page(s)
add_action( 'admin_notices', 'wp_easy_conversion_toolkit_display_current_screen_id' );
function wp_easy_conversion_toolkit_display_current_screen_id() {
    if ( current_user_can( 'manage_options' ) ) {
        $screen = get_current_screen();
        echo '<div class="notice notice-info"><p>Current Screen ID: <strong>' . esc_html( $screen->id ) . '</strong></p></div>';
    }
}

