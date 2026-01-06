import React from 'react';

/**
 * SVG Material Icons for the Material Calculator
 * These provide more realistic, professional icons than emojis
 */

// Helper component for consistent icon styling
const IconWrapper = ({ children, color = '#00c8ff' }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

// Flooring Icons
export const HardwoodIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Wood planks */}
    <rect x="2" y="4" width="20" height="4" rx="0.5" fill={color} fillOpacity="0.2" />
    <rect x="2" y="10" width="20" height="4" rx="0.5" fill={color} fillOpacity="0.2" />
    <rect x="2" y="16" width="20" height="4" rx="0.5" fill={color} fillOpacity="0.2" />
    <line x1="8" y1="4" x2="8" y2="8" />
    <line x1="14" y1="10" x2="14" y2="14" />
    <line x1="10" y1="16" x2="10" y2="20" />
  </IconWrapper>
);

export const VinylPlankIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Vinyl planks with click edges */}
    <rect x="2" y="3" width="20" height="5" rx="0.3" fill={color} fillOpacity="0.15" />
    <rect x="2" y="9" width="20" height="5" rx="0.3" fill={color} fillOpacity="0.15" />
    <rect x="2" y="15" width="20" height="5" rx="0.3" fill={color} fillOpacity="0.15" />
    <line x1="12" y1="3" x2="12" y2="8" strokeDasharray="1 1" />
    <line x1="6" y1="9" x2="6" y2="14" strokeDasharray="1 1" />
    <line x1="16" y1="15" x2="16" y2="20" strokeDasharray="1 1" />
  </IconWrapper>
);

export const TileIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Grid of tiles */}
    <rect x="2" y="2" width="9" height="9" fill={color} fillOpacity="0.15" />
    <rect x="13" y="2" width="9" height="9" fill={color} fillOpacity="0.15" />
    <rect x="2" y="13" width="9" height="9" fill={color} fillOpacity="0.15" />
    <rect x="13" y="13" width="9" height="9" fill={color} fillOpacity="0.15" />
  </IconWrapper>
);

export const CarpetIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Carpet roll */}
    <ellipse cx="18" cy="12" rx="3" ry="8" fill={color} fillOpacity="0.2" />
    <path d="M18 4 L6 4 C4 4 3 6 3 8 L3 16 C3 18 4 20 6 20 L18 20" />
    <line x1="6" y1="7" x2="15" y2="7" strokeOpacity="0.5" />
    <line x1="6" y1="12" x2="15" y2="12" strokeOpacity="0.5" />
    <line x1="6" y1="17" x2="15" y2="17" strokeOpacity="0.5" />
  </IconWrapper>
);

export const UnderlaymentIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Roll of underlayment */}
    <ellipse cx="17" cy="12" rx="4" ry="7" fill={color} fillOpacity="0.15" />
    <path d="M17 5 L5 5 L5 19 L17 19" fill="none" />
    <line x1="5" y1="8" x2="13" y2="8" strokeOpacity="0.3" />
    <line x1="5" y1="12" x2="13" y2="12" strokeOpacity="0.3" />
    <line x1="5" y1="16" x2="13" y2="16" strokeOpacity="0.3" />
  </IconWrapper>
);

export const BaseboardIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Baseboard trim profile */}
    <path d="M2 20 L2 10 L4 8 L4 6 L22 6 L22 20 Z" fill={color} fillOpacity="0.2" />
    <line x1="6" y1="6" x2="6" y2="20" strokeOpacity="0.3" />
    <line x1="12" y1="6" x2="12" y2="20" strokeOpacity="0.3" />
    <line x1="18" y1="6" x2="18" y2="20" strokeOpacity="0.3" />
  </IconWrapper>
);

// Paint Icons
export const PaintBucketIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Paint bucket */}
    <path d="M4 8 L4 18 C4 19 5 20 6 20 L18 20 C19 20 20 19 20 18 L20 8" fill={color} fillOpacity="0.2" />
    <ellipse cx="12" cy="8" rx="8" ry="3" fill={color} fillOpacity="0.3" />
    <path d="M20 10 Q22 12 21 15" strokeWidth="2" />
  </IconWrapper>
);

export const PaintRollerIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Paint roller */}
    <rect x="4" y="4" width="12" height="6" rx="1" fill={color} fillOpacity="0.3" />
    <line x1="10" y1="10" x2="10" y2="14" strokeWidth="2" />
    <line x1="10" y1="14" x2="18" y2="14" strokeWidth="2" />
    <line x1="18" y1="14" x2="18" y2="20" strokeWidth="2" />
  </IconWrapper>
);

export const PrimerIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Can of primer */}
    <rect x="5" y="6" width="14" height="14" rx="1" fill={color} fillOpacity="0.15" />
    <ellipse cx="12" cy="6" rx="7" ry="2" fill={color} fillOpacity="0.25" />
    <text x="12" y="15" fontSize="6" fill={color} textAnchor="middle" fontWeight="bold">P</text>
  </IconWrapper>
);

export const TapeIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Roll of tape */}
    <circle cx="12" cy="12" r="8" fill={color} fillOpacity="0.2" />
    <circle cx="12" cy="12" r="4" fill="none" />
    <path d="M20 12 L22 14" strokeWidth="2" />
  </IconWrapper>
);

// Drywall Icons
export const DrywallSheetIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Drywall sheet */}
    <rect x="3" y="2" width="18" height="20" rx="0.5" fill={color} fillOpacity="0.15" />
    <line x1="3" y1="12" x2="21" y2="12" strokeOpacity="0.3" />
    <text x="12" y="8" fontSize="5" fill={color} textAnchor="middle">4×8</text>
  </IconWrapper>
);

export const JointCompoundIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Bucket of joint compound */}
    <path d="M5 8 L5 18 C5 19 6 20 7 20 L17 20 C18 20 19 19 19 18 L19 8" fill={color} fillOpacity="0.2" />
    <ellipse cx="12" cy="8" rx="7" ry="2.5" fill={color} fillOpacity="0.3" />
    <path d="M8 4 L8 6 M16 4 L16 6" strokeWidth="2" />
    <line x1="8" y1="4" x2="16" y2="4" strokeWidth="2" />
  </IconWrapper>
);

export const DrywallTapeIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Roll of paper tape */}
    <ellipse cx="12" cy="12" rx="8" ry="8" fill={color} fillOpacity="0.1" />
    <ellipse cx="12" cy="12" rx="3" ry="3" fill="none" />
    <path d="M20 12 L22 10 L22 14" />
  </IconWrapper>
);

export const ScrewIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Screw */}
    <circle cx="12" cy="5" r="3" fill={color} fillOpacity="0.3" />
    <line x1="10" y1="5" x2="14" y2="5" />
    <path d="M11 8 L11 20 M13 8 L13 20" />
    <line x1="10" y1="10" x2="14" y2="10" />
    <line x1="10" y1="13" x2="14" y2="13" />
    <line x1="10" y1="16" x2="14" y2="16" />
    <line x1="10" y1="19" x2="14" y2="19" />
  </IconWrapper>
);

// Tile Icons
export const ThinsetIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Bag of thinset */}
    <path d="M6 4 L18 4 L20 20 L4 20 Z" fill={color} fillOpacity="0.2" />
    <line x1="8" y1="4" x2="6" y2="2" />
    <line x1="16" y1="4" x2="18" y2="2" />
    <text x="12" y="14" fontSize="5" fill={color} textAnchor="middle">50lb</text>
  </IconWrapper>
);

export const GroutIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Bag of grout */}
    <path d="M7 4 L17 4 L19 20 L5 20 Z" fill={color} fillOpacity="0.15" />
    <line x1="9" y1="4" x2="7" y2="2" />
    <line x1="15" y1="4" x2="17" y2="2" />
    <rect x="8" y="8" width="8" height="6" rx="0.5" fill={color} fillOpacity="0.2" />
  </IconWrapper>
);

// Insulation Icons
export const InsulationBattIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Batt insulation bundle */}
    <rect x="3" y="4" width="18" height="16" rx="2" fill={color} fillOpacity="0.2" />
    <path d="M5 8 Q8 6 11 8 Q14 10 17 8 Q19 6 21 8" strokeOpacity="0.5" />
    <path d="M5 12 Q8 10 11 12 Q14 14 17 12 Q19 10 21 12" strokeOpacity="0.5" />
    <path d="M5 16 Q8 14 11 16 Q14 18 17 16 Q19 14 21 16" strokeOpacity="0.5" />
  </IconWrapper>
);

export const BlownInsulationIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Blown insulation bag with fluffy particles */}
    <path d="M6 4 L18 4 L20 20 L4 20 Z" fill={color} fillOpacity="0.15" />
    <circle cx="9" cy="10" r="1.5" fill={color} fillOpacity="0.4" />
    <circle cx="14" cy="9" r="1.5" fill={color} fillOpacity="0.4" />
    <circle cx="11" cy="14" r="1.5" fill={color} fillOpacity="0.4" />
    <circle cx="15" cy="15" r="1.5" fill={color} fillOpacity="0.4" />
    <circle cx="8" cy="16" r="1.5" fill={color} fillOpacity="0.4" />
  </IconWrapper>
);

// Concrete Icons
export const ConcreteTruckIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Concrete mixer truck */}
    <ellipse cx="10" cy="10" rx="6" ry="5" fill={color} fillOpacity="0.2" transform="rotate(-20 10 10)" />
    <rect x="14" y="14" width="8" height="5" rx="0.5" fill={color} fillOpacity="0.25" />
    <circle cx="16" cy="20" r="2" fill={color} fillOpacity="0.3" />
    <circle cx="20" cy="20" r="2" fill={color} fillOpacity="0.3" />
    <line x1="6" y1="14" x2="14" y2="10" />
  </IconWrapper>
);

export const ConcreteBagIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Bag of concrete */}
    <path d="M5 4 L19 4 L21 20 L3 20 Z" fill={color} fillOpacity="0.2" />
    <line x1="7" y1="4" x2="5" y2="2" />
    <line x1="17" y1="4" x2="19" y2="2" />
    <text x="12" y="13" fontSize="5" fill={color} textAnchor="middle">60lb</text>
  </IconWrapper>
);

export const RebarIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Rebar pieces */}
    <line x1="4" y1="6" x2="20" y2="6" strokeWidth="3" />
    <line x1="4" y1="12" x2="20" y2="12" strokeWidth="3" />
    <line x1="4" y1="18" x2="20" y2="18" strokeWidth="3" />
    <line x1="6" y1="5" x2="6" y2="7" />
    <line x1="10" y1="5" x2="10" y2="7" />
    <line x1="14" y1="5" x2="14" y2="7" />
    <line x1="18" y1="5" x2="18" y2="7" />
  </IconWrapper>
);

export const WireMeshIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Wire mesh grid */}
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
    <line x1="6" y1="4" x2="6" y2="20" />
    <line x1="12" y1="4" x2="12" y2="20" />
    <line x1="18" y1="4" x2="18" y2="20" />
  </IconWrapper>
);

export const GravelIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Pile of gravel */}
    <ellipse cx="12" cy="16" rx="9" ry="4" fill={color} fillOpacity="0.2" />
    <circle cx="8" cy="14" r="2" fill={color} fillOpacity="0.3" />
    <circle cx="14" cy="13" r="2.5" fill={color} fillOpacity="0.3" />
    <circle cx="11" cy="10" r="2" fill={color} fillOpacity="0.3" />
    <circle cx="16" cy="15" r="1.5" fill={color} fillOpacity="0.3" />
    <circle cx="6" cy="16" r="1.5" fill={color} fillOpacity="0.3" />
  </IconWrapper>
);

// Framing Icons
export const StudIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* 2x4 stud */}
    <rect x="8" y="2" width="8" height="20" fill={color} fillOpacity="0.2" />
    <line x1="8" y1="2" x2="8" y2="22" />
    <line x1="16" y1="2" x2="16" y2="22" />
    <line x1="10" y1="6" x2="14" y2="6" strokeOpacity="0.3" />
    <line x1="10" y1="12" x2="14" y2="12" strokeOpacity="0.3" />
    <line x1="10" y1="18" x2="14" y2="18" strokeOpacity="0.3" />
  </IconWrapper>
);

export const PlateIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Top/bottom plate (horizontal lumber) */}
    <rect x="2" y="9" width="20" height="6" fill={color} fillOpacity="0.2" />
    <line x1="2" y1="9" x2="22" y2="9" />
    <line x1="2" y1="15" x2="22" y2="15" />
    <line x1="8" y1="10" x2="8" y2="14" strokeOpacity="0.3" />
    <line x1="16" y1="10" x2="16" y2="14" strokeOpacity="0.3" />
  </IconWrapper>
);

export const SheathingIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* OSB/Plywood sheet */}
    <rect x="3" y="2" width="18" height="20" rx="0.5" fill={color} fillOpacity="0.15" />
    <path d="M5 5 Q8 7 6 10 Q9 8 12 11 Q15 9 18 12" strokeOpacity="0.3" />
    <path d="M5 14 Q8 16 10 13 Q14 17 18 14" strokeOpacity="0.3" />
    <text x="12" y="20" fontSize="4" fill={color} textAnchor="middle">OSB</text>
  </IconWrapper>
);

export const NailIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Framing nail */}
    <circle cx="12" cy="4" r="2.5" fill={color} fillOpacity="0.4" />
    <line x1="12" y1="6.5" x2="12" y2="21" strokeWidth="2" />
    <path d="M10 21 L12 23 L14 21" fill={color} />
  </IconWrapper>
);

export const BlockingIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Fire blocking between studs */}
    <rect x="2" y="8" width="4" height="14" fill={color} fillOpacity="0.15" />
    <rect x="18" y="8" width="4" height="14" fill={color} fillOpacity="0.15" />
    <rect x="6" y="10" width="12" height="4" fill={color} fillOpacity="0.3" />
    <line x1="6" y1="10" x2="18" y2="10" />
    <line x1="6" y1="14" x2="18" y2="14" />
  </IconWrapper>
);

// Default/fallback icon
export const DefaultIcon = ({ color }) => (
  <IconWrapper color={color}>
    <rect x="4" y="4" width="16" height="16" rx="2" fill={color} fillOpacity="0.2" />
    <line x1="8" y1="12" x2="16" y2="12" />
    <line x1="12" y1="8" x2="12" y2="16" />
  </IconWrapper>
);

// ============ CATEGORY ICONS ============

export const FlooringCategoryIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Floor planks perspective view */}
    <path d="M2 18 L12 22 L22 18 L22 14 L12 18 L2 14 Z" fill={color} fillOpacity="0.2" />
    <path d="M2 14 L12 18 L22 14 L22 10 L12 14 L2 10 Z" fill={color} fillOpacity="0.15" />
    <path d="M2 10 L12 14 L22 10 L12 6 L2 10 Z" fill={color} fillOpacity="0.1" />
    <line x1="12" y1="6" x2="12" y2="22" strokeOpacity="0.5" />
    <line x1="7" y1="8" x2="7" y2="20" strokeOpacity="0.3" />
    <line x1="17" y1="8" x2="17" y2="20" strokeOpacity="0.3" />
  </IconWrapper>
);

export const PaintCategoryIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Paint brush and paint */}
    <path d="M4 14 L8 14 L8 20 C8 21 7 22 6 22 C5 22 4 21 4 20 Z" fill={color} fillOpacity="0.3" />
    <path d="M5 14 L5 8 L7 8 L7 14" />
    <path d="M3 8 L9 8 L9 6 L10 2 L14 2 L20 8 L16 12 L12 8 L9 8" fill={color} fillOpacity="0.2" />
    <line x1="10" y1="2" x2="14" y2="6" strokeOpacity="0.5" />
    <circle cx="17" cy="17" r="4" fill={color} fillOpacity="0.15" />
    <path d="M15 17 Q17 15 19 17" />
  </IconWrapper>
);

export const DrywallCategoryIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Stacked drywall sheets */}
    <rect x="3" y="4" width="16" height="18" rx="0.5" fill={color} fillOpacity="0.1" />
    <rect x="5" y="3" width="16" height="18" rx="0.5" fill={color} fillOpacity="0.15" />
    <rect x="7" y="2" width="16" height="18" rx="0.5" fill={color} fillOpacity="0.2" />
    <line x1="7" y1="11" x2="23" y2="11" strokeOpacity="0.3" />
    <text x="15" y="8" fontSize="4" fill={color} textAnchor="middle">4×8</text>
  </IconWrapper>
);

export const WallTileCategoryIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Wall with tiles */}
    <rect x="3" y="3" width="18" height="18" fill={color} fillOpacity="0.1" />
    <rect x="4" y="4" width="5" height="5" fill={color} fillOpacity="0.25" />
    <rect x="10" y="4" width="5" height="5" fill={color} fillOpacity="0.25" />
    <rect x="16" y="4" width="5" height="5" fill={color} fillOpacity="0.25" />
    <rect x="4" y="10" width="5" height="5" fill={color} fillOpacity="0.25" />
    <rect x="10" y="10" width="5" height="5" fill={color} fillOpacity="0.25" />
    <rect x="16" y="10" width="5" height="5" fill={color} fillOpacity="0.25" />
    <rect x="4" y="16" width="5" height="5" fill={color} fillOpacity="0.25" />
    <rect x="10" y="16" width="5" height="5" fill={color} fillOpacity="0.25" />
    <rect x="16" y="16" width="5" height="5" fill={color} fillOpacity="0.25" />
  </IconWrapper>
);

export const InsulationCategoryIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Insulation between studs */}
    <rect x="2" y="3" width="3" height="18" fill={color} fillOpacity="0.2" />
    <rect x="19" y="3" width="3" height="18" fill={color} fillOpacity="0.2" />
    <path d="M5 5 Q8 3 11 5 Q14 7 17 5 L19 5 L19 19 L17 19 Q14 17 11 19 Q8 21 5 19 Z" fill={color} fillOpacity="0.3" />
    <path d="M6 8 Q9 6 12 8 Q15 10 18 8" strokeOpacity="0.4" />
    <path d="M6 12 Q9 10 12 12 Q15 14 18 12" strokeOpacity="0.4" />
    <path d="M6 16 Q9 14 12 16 Q15 18 18 16" strokeOpacity="0.4" />
  </IconWrapper>
);

export const ConcreteCategoryIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Concrete slab with texture */}
    <path d="M2 16 L12 20 L22 16 L22 12 L12 8 L2 12 Z" fill={color} fillOpacity="0.25" />
    <line x1="2" y1="12" x2="2" y2="16" />
    <line x1="12" y1="8" x2="12" y2="12" strokeOpacity="0.5" />
    <line x1="22" y1="12" x2="22" y2="16" />
    <line x1="2" y1="16" x2="12" y2="20" />
    <line x1="12" y1="20" x2="22" y2="16" />
    <circle cx="7" cy="14" r="0.8" fill={color} fillOpacity="0.4" />
    <circle cx="12" cy="15" r="0.8" fill={color} fillOpacity="0.4" />
    <circle cx="17" cy="14" r="0.8" fill={color} fillOpacity="0.4" />
    <circle cx="9" cy="12" r="0.6" fill={color} fillOpacity="0.3" />
    <circle cx="15" cy="12" r="0.6" fill={color} fillOpacity="0.3" />
  </IconWrapper>
);

export const FramingCategoryIcon = ({ color }) => (
  <IconWrapper color={color}>
    {/* Wall framing structure */}
    <rect x="2" y="2" width="20" height="3" fill={color} fillOpacity="0.2" />
    <rect x="2" y="19" width="20" height="3" fill={color} fillOpacity="0.2" />
    <rect x="3" y="5" width="2" height="14" fill={color} fillOpacity="0.25" />
    <rect x="8" y="5" width="2" height="14" fill={color} fillOpacity="0.25" />
    <rect x="14" y="5" width="2" height="14" fill={color} fillOpacity="0.25" />
    <rect x="19" y="5" width="2" height="14" fill={color} fillOpacity="0.25" />
    <line x1="2" y1="2" x2="22" y2="2" />
    <line x1="2" y1="5" x2="22" y2="5" />
    <line x1="2" y1="19" x2="22" y2="19" />
    <line x1="2" y1="22" x2="22" y2="22" />
  </IconWrapper>
);

// Map material IDs to icon components
export const MATERIAL_ICON_COMPONENTS = {
  // Flooring
  hardwood: HardwoodIcon,
  vinyl_plank: VinylPlankIcon,
  tile_12x12: TileIcon,
  tile_18x18: TileIcon,
  carpet: CarpetIcon,
  underlayment: UnderlaymentIcon,
  baseboards: BaseboardIcon,

  // Paint
  wall_paint: PaintBucketIcon,
  wall_paint_2coat: PaintBucketIcon,
  ceiling_paint: PaintRollerIcon,
  primer: PrimerIcon,
  painters_tape: TapeIcon,

  // Drywall
  drywall_walls: DrywallSheetIcon,
  drywall_ceiling: DrywallSheetIcon,
  joint_compound: JointCompoundIcon,
  drywall_tape: DrywallTapeIcon,
  drywall_screws: ScrewIcon,

  // Wall Tile
  wall_tile: TileIcon,
  thinset: ThinsetIcon,
  grout: GroutIcon,

  // Insulation
  batt_r13_walls: InsulationBattIcon,
  batt_r30_ceiling: InsulationBattIcon,
  blown_in: BlownInsulationIcon,

  // Concrete
  concrete_yards: ConcreteTruckIcon,
  concrete_bags: ConcreteBagIcon,
  rebar: RebarIcon,
  wire_mesh: WireMeshIcon,
  gravel_base: GravelIcon,

  // Framing
  studs: StudIcon,
  studs_2x4: StudIcon,
  studs_2x6: StudIcon,
  top_plates: PlateIcon,
  top_plates_2x4: PlateIcon,
  top_plates_2x6: PlateIcon,
  bottom_plate: PlateIcon,
  bottom_plate_2x4: PlateIcon,
  bottom_plate_2x6: PlateIcon,
  sheathing: SheathingIcon,
  sheathing_osb: SheathingIcon,
  framing_nails: NailIcon,
  sheathing_nails: NailIcon,
  blocking: BlockingIcon,
  blocking_2x4: BlockingIcon,
  blocking_2x6: BlockingIcon,
};

// Helper function to get icon for a material
export const getMaterialIcon = (materialId, color = '#00c8ff') => {
  const IconComponent = MATERIAL_ICON_COMPONENTS[materialId] || DefaultIcon;
  return <IconComponent color={color} />;
};

// Map category IDs to icon components
export const CATEGORY_ICON_COMPONENTS = {
  flooring: FlooringCategoryIcon,
  paint: PaintCategoryIcon,
  drywall: DrywallCategoryIcon,
  tile: WallTileCategoryIcon,
  insulation: InsulationCategoryIcon,
  concrete: ConcreteCategoryIcon,
  framing: FramingCategoryIcon,
};

// Helper function to get icon for a category
export const getCategoryIcon = (categoryId, color = '#00c8ff') => {
  const IconComponent = CATEGORY_ICON_COMPONENTS[categoryId] || DefaultIcon;
  return <IconComponent color={color} />;
};
