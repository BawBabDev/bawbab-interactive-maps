## Executive Summary & Core Conclusion

The central conclusion is that custom last-meter network data and gateway routing logic must be stored and processed inside the main centralized AI/DAI system on GCP, rather than isolated within individual WordPress plugin instances.

While the WordPress plugin remains an ideal tool for campus managers to visually draw and edit local features, the network data must automatically sync up to the central GCP engine. This creates a single source of truth capable of serving high-speed enterprise APIs, web apps, and delivery logistics networks.

## Key Discussion Points & Architectural Decisions

1. The Core Problem: The "Last-Meter" Spatial Gap
- The Limitation: Standard navigation tools (like Google Maps) route drivers to property polygons or nearby public road points. They do not know about campus access gates, visitor parking bays, or specific building entrance doors.
- The Opportunity: The DAI system bridges the gap between the Gateway Node (where a vehicle turns off a public road) and the Entrance Pin (the specific door pin).

2. Can/Should Google Maps Consume Custom Network Paths?
- Technical Reality: Google Maps cannot be injected with ad-hoc, custom geometry at runtime via API. If an address sits 200 meters off-road inside a gated campus, Google will simply drop the pin on the nearest public road it recognizes.
- Strategic Position: We should not give away custom network data to Google for free. Doing so destroys our core IP, product moat, and enterprise monetization potential.

3. Navigation Workflows by User Persona

                                  [ USER APPROACHING DESTINATION ]
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   ▼                                                           ▼
       [ General Public / Visitors ]                               [ Enterprise / B2B Fleets ]
   (Receives Web Link or QR Code)                              (Integrated with Baobab API)
                   │                                                           │
   1. Clicks "Navigate Here" link                               1. Queries `api.baobab.io/v1/navigate`
   2. Opens Google Maps to Gateway Lat/Lng                      2. Receives Multi-Stage Payload:
   3. Arrives at Gateway/Parking                                    • Stage 1: Google Lat/Lng to Gateway
   4. Opens Web Walk-Map for pedestrian steps to door               • Stage 2: DAI Polyline/GeoJSON to Door

A. General Public (Consumers)
- Search / Direct Input: Standard Google Maps will not interpret custom address codes directly without a native platform deal.
- The UX Solution (Smart Web Links): Users receive a link (address.baobab.io/FLK-8829). Clicking "Navigate" triggers standard Google/Apple Maps directed specifically to the Gateway Lat/Lng (not the building center).
- The Transition: Upon arrival at the parking lot/gateway, the web page updates to present a pedestrian walk-map for the remaining steps to the door.

B. Enterprise / Commercial Clients (Logistics, Delivery, Emergency Services)
- System Integration: B2B platforms store DAI Address Codes in their CRMs and query our centralized GCP API before launching routes.Multi-Stage API Payload: The API returns a hierarchical response containing:
    - Public Routing Stage: Gateway Lat/Lng for public highways.
    - Private Vehicular Stage: Parking/Drop-off coordinates + custom road polyline.
    - Pedestrian Stage: Floor level, door code, and internal walk polyline.
- Execution: Driver apps navigate to the gateway via standard mapping, then switch over to render our DAI last-meter geometry on our embedded SDK/widget.

4. Centralized DAI (GCP) vs. Decentralized WordPress APIs

We evaluated whether individual WordPress plugins should expose local APIs versus syncing to a central GCP engine.Dimension
Decentralized (WordPress APIs)
Centralized (DAI on GCP)

Developer Experience
❌ Poor: Logistics fleets must handle hundreds of distinct client endpoints.
✅ Seamless: Single API key (api.baobab.io/v1/resolve) globally.

Performance & Uptime
❌ Risky: Cheap WP hosting crashes under heavy pathfinding queries.
✅ Enterprise-Grade: PostGIS on GCP handles spatial calculations in milliseconds.

Commercial Moat
❌ Weak: IP remains trapped on client servers; hard to bill per API call.
✅ Strong: Centralized control over access, rate limits, and monetization.Final Strategy: "Edit Locally, Sync Centrally"

┌─────────────────────────────────────────┐
│     WordPress Campus Plugin (CMS)       │
│  • Easy drawing UI for campus admins    │
│  • Local display widget for website     │
└────────────────────┬────────────────────┘
                     │ (Webhook Sync on Save)
                     ▼
┌─────────────────────────────────────────┐
│       Centralized DAI Engine (GCP)      │
│  • Canonical PostGIS spatial database   │
│  • Global DAI code resolution           │
│  • B2B Multi-Stage Routing API          │
└─────────────────────────────────────────┘
WordPress as the CMS: Campus managers use the familiar WordPress interface to draw gateways, parking areas, walkways, and doors.Automatic Background Sync: Hitting "Save" in WordPress pushes spatial edges and nodes to the central PostGIS database on GCP.Monetized API Engine: Centralized GCP endpoints serve enterprise clients, power deep-link web transitions, and protect the core business moat.