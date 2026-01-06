/**
 * Corner Renderer - Pre-computes wall edge trim points for clean mitered corners
 * Handles L-corners (two endpoints meeting) and T-intersections (endpoint meets wall body)
 * Also handles interior finish lines (drywall) and exterior finish (siding)
 */

import { WALL_THICKNESS_OPTIONS, WALL_LAYERS } from '../../../constants/walls';
import { GRID_SIZE } from '../../../constants/grid';
import { adjustColor } from '../../../utils/geometry';

// Debug logging - set to true to enable verbose output
const DEBUG = false;  // L-corner/general debug
const DEBUG_T_JUNCTION = false;  // T-junction specific debug

// Convert inches to pixels
const inchesToPixels = (inches) => inches * (GRID_SIZE / 6);

// Get finish line offsets for a wall type (in pixels from centerline)
const getFinishOffsets = (wallType) => {
  const config = WALL_LAYERS[wallType] || WALL_LAYERS['interior'];
  const thicknessInches = WALL_THICKNESS_OPTIONS[wallType]?.thickness || 6;
  const totalThickness = inchesToPixels(thicknessInches);
  const halfThick = totalThickness / 2;

  // Calculate layer positions
  const layers = config.layers || [];
  const totalLayerThickness = layers.reduce((sum, l) => sum + l.thickness, 0);
  const scaleFactor = totalThickness / totalLayerThickness;

  // Find drywall positions (inside finish)
  // For exterior walls: siding is on left (outside), drywall on right (inside)
  // For interior walls: drywall on both sides
  const isExterior = wallType?.includes('exterior');

  let leftFinishOffset = null;  // Offset from center for left finish line
  let rightFinishOffset = null; // Offset from center for right finish line

  if (isExterior) {
    // Left side: find where siding/sheathing meets (after siding layer)
    // Right side: find where drywall starts (before drywall layer)
    let offset = -halfThick;
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const layerThick = layer.thickness * scaleFactor;
      if (i === 0 && (layer.name === 'Siding' || layer.pattern === 'siding')) {
        // After siding layer
        leftFinishOffset = offset + layerThick;
      }
      if (layer.name === 'Drywall' && i === layers.length - 1) {
        // Before last drywall layer
        rightFinishOffset = offset;
      }
      offset += layerThick;
    }
  } else {
    // Interior wall - drywall on both sides
    let offset = -halfThick;
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const layerThick = layer.thickness * scaleFactor;
      if (layer.name === 'Drywall') {
        if (i === 0) {
          // First drywall - inside of left edge
          leftFinishOffset = offset + layerThick;
        } else if (i === layers.length - 1) {
          // Last drywall - inside of right edge
          rightFinishOffset = offset;
        }
      }
      offset += layerThick;
    }
  }

  return { leftFinishOffset, rightFinishOffset, isExterior };
};

// Distance between two points
const dist = (p1, p2) => Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);

// Check if two points are close enough to be considered connected
// Using a larger tolerance to account for grid snapping and wall thickness variations
// Increased to handle walls of different thicknesses meeting (e.g., 2x4 interior at 2x6 exterior)
const pointsClose = (p1, p2, tolerance = 40) => dist(p1, p2) < tolerance;

// Check if a point is on a line segment (not at endpoints)
// Returns the t parameter (0-1) if on segment, or null if not
// Takes into account the host wall's thickness - the incoming wall might snap to
// the edge of the host wall rather than exactly on its centerline
const pointOnSegmentT = (pt, segStart, segEnd, hostWallThickness = 20, incomingWallThickness = 20) => {
  const segLen = dist(segStart, segEnd);
  if (segLen === 0) return null;

  const dx = pt.x - segStart.x;
  const dy = pt.y - segStart.y;
  const segDx = segEnd.x - segStart.x;
  const segDy = segEnd.y - segStart.y;

  // Project pt onto segment line
  const t = (dx * segDx + dy * segDy) / (segLen * segLen);

  // Must be within segment (not at endpoints) - use slightly looser bounds
  if (t < 0.02 || t > 0.98) return null;

  // Find closest point on segment
  const closestX = segStart.x + t * segDx;
  const closestY = segStart.y + t * segDy;

  // Tolerance should account for:
  // - Half of host wall thickness (incoming might be at host edge)
  // - Half of incoming wall thickness (incoming centerline might be beyond host edge but wall body overlaps)
  // - Additional margin for grid snapping imprecision (grid is 20 pixels = 6")
  // The incoming wall's centerline might snap to a grid point beyond the host wall's far edge,
  // but the wall bodies should still be considered intersecting if they're within reasonable distance
  const tolerance = Math.max(
    (hostWallThickness + incomingWallThickness) / 2 + 15,  // Combined half-thicknesses plus grid margin
    40  // Minimum tolerance to handle grid snapping with thin walls
  );

  if (dist(pt, { x: closestX, y: closestY }) < tolerance) {
    return t;
  }
  return null;
};

// Get wall geometry info in world coordinates
const getWallGeometry = (wall) => {
  const thicknessInches = WALL_THICKNESS_OPTIONS[wall.type]?.thickness || 8;
  const thickness = inchesToPixels(thicknessInches);
  const halfThick = thickness / 2;

  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const len = Math.sqrt(dx * dx + dy * dy);

  if (len === 0) return null;

  // Unit vectors
  const dirX = dx / len;
  const dirY = dy / len;
  const perpX = -dirY; // perpendicular (90 deg CCW)
  const perpY = dirX;

  // Get finish line offsets
  const finishOffsets = getFinishOffsets(wall.type);
  const { leftFinishOffset, rightFinishOffset, isExterior } = finishOffsets;

  // If wall is flipped, swap the finish offsets
  const actualLeftFinish = wall.flipped ? (rightFinishOffset !== null ? -rightFinishOffset : null) : leftFinishOffset;
  const actualRightFinish = wall.flipped ? (leftFinishOffset !== null ? -leftFinishOffset : null) : rightFinishOffset;

  const geo = {
    wall,
    thickness,
    halfThick,
    len,
    dirX,
    dirY,
    perpX,
    perpY,
    isExterior,
    // Wall edge endpoints in world coordinates
    startLeft: { x: wall.start.x + perpX * halfThick, y: wall.start.y + perpY * halfThick },
    startRight: { x: wall.start.x - perpX * halfThick, y: wall.start.y - perpY * halfThick },
    endLeft: { x: wall.end.x + perpX * halfThick, y: wall.end.y + perpY * halfThick },
    endRight: { x: wall.end.x - perpX * halfThick, y: wall.end.y - perpY * halfThick },
  };

  // Add finish line endpoints if applicable
  // Left finish is on the positive perpendicular side (CCW from wall direction)
  // Right finish is on the negative perpendicular side
  if (actualLeftFinish !== null) {
    geo.startLeftFinish = { x: wall.start.x + perpX * actualLeftFinish, y: wall.start.y + perpY * actualLeftFinish };
    geo.endLeftFinish = { x: wall.end.x + perpX * actualLeftFinish, y: wall.end.y + perpY * actualLeftFinish };
    geo.leftFinishOffset = actualLeftFinish;
  }
  if (actualRightFinish !== null) {
    geo.startRightFinish = { x: wall.start.x + perpX * actualRightFinish, y: wall.start.y + perpY * actualRightFinish };
    geo.endRightFinish = { x: wall.end.x + perpX * actualRightFinish, y: wall.end.y + perpY * actualRightFinish };
    geo.rightFinishOffset = actualRightFinish;
  }

  return geo;
};

// Find intersection of two infinite lines (p1 + t*d1) and (p2 + s*d2)
const lineIntersect = (p1, d1, p2, d2) => {
  const denom = d1.x * d2.y - d1.y * d2.x;
  if (Math.abs(denom) < 0.0001) return null;
  const t = ((p2.x - p1.x) * d2.y - (p2.y - p1.y) * d2.x) / denom;
  return { x: p1.x + t * d1.x, y: p1.y + t * d1.y };
};


/**
 * Compute trim data for all walls
 */
export function computeWallTrims(walls) {
  if (!walls || walls.length === 0) return {};

  if (DEBUG) {
    console.log('=== ALL WALLS ===');
    walls.forEach(w => {
      console.log(`Wall ${w.id?.slice(-4)} [${w.type}]: (${Math.round(w.start.x)},${Math.round(w.start.y)}) -> (${Math.round(w.end.x)},${Math.round(w.end.y)})`);
    });
    console.log('=================');
  }

  const trims = {};
  const geos = {};

  // Initialize trim data and geometry for each wall
  walls.forEach(wall => {
    const geo = getWallGeometry(wall);
    if (!geo) return;

    geos[wall.id] = geo;
    trims[wall.id] = {
      startLeftTrim: null,
      startRightTrim: null,
      endLeftTrim: null,
      endRightTrim: null,
      // Finish line trims
      startLeftFinishTrim: null,
      startRightFinishTrim: null,
      endLeftFinishTrim: null,
      endRightFinishTrim: null,
      // For T-intersections: gaps in the host wall's edges
      // Each gap is { start: point, end: point } representing where to break the edge line
      leftEdgeGaps: [],
      rightEdgeGaps: [],
      leftFinishGaps: [],
      rightFinishGaps: [],
      // Interior T-junction connectors: short lines connecting incoming finish to host finish
      interiorTConnectors: [],
      geo,
    };
  });

  // Find L-corners and T-intersections
  for (let i = 0; i < walls.length; i++) {
    for (let j = i + 1; j < walls.length; j++) {
      const wall1 = walls[i];
      const wall2 = walls[j];
      const geo1 = geos[wall1.id];
      const geo2 = geos[wall2.id];

      if (!geo1 || !geo2) continue;

      // Check all endpoint combinations for L-corners
      const checks = [
        { w1End: 'start', w2End: 'start', pt1: wall1.start, pt2: wall2.start },
        { w1End: 'start', w2End: 'end', pt1: wall1.start, pt2: wall2.end },
        { w1End: 'end', w2End: 'start', pt1: wall1.end, pt2: wall2.start },
        { w1End: 'end', w2End: 'end', pt1: wall1.end, pt2: wall2.end },
      ];

      for (const check of checks) {
        const distance = dist(check.pt1, check.pt2);
        if (!pointsClose(check.pt1, check.pt2)) {
          continue;
        }
        // Found an L-corner - compute miter intersection
        // Direction vectors for the walls (always in the wall's natural direction: start -> end)
        const d1 = { x: geo1.dirX, y: geo1.dirY };
        const d2 = { x: geo2.dirX, y: geo2.dirY };

        const w1Left = check.w1End === 'start' ? geo1.startLeft : geo1.endLeft;
        const w1Right = check.w1End === 'start' ? geo1.startRight : geo1.endRight;
        const w2Left = check.w2End === 'start' ? geo2.startLeft : geo2.endLeft;
        const w2Right = check.w2End === 'start' ? geo2.startRight : geo2.endRight;

        const trim1Key = check.w1End === 'start' ? 'start' : 'end';
        const trim2Key = check.w2End === 'start' ? 'start' : 'end';

        // Determine effective direction vectors pointing AWAY from the corner for each wall
        // If wall's start is at corner, direction away is toward end (positive dir)
        // If wall's end is at corner, direction away is toward start (negative dir)
        const dir1Away = check.w1End === 'start'
          ? { x: d1.x, y: d1.y }   // start at corner -> away is toward end
          : { x: -d1.x, y: -d1.y }; // end at corner -> away is toward start
        const dir2Away = check.w2End === 'start'
          ? { x: d2.x, y: d2.y }
          : { x: -d2.x, y: -d2.y };

        // Use cross product of "away" directions to determine turning direction
        // Cross > 0: wall2 is to the left (CCW) of wall1
        // Cross < 0: wall2 is to the right (CW) of wall1
        const cross = dir1Away.x * dir2Away.y - dir1Away.y * dir2Away.x;

        // Compute all four possible edge intersections
        const intLL = lineIntersect(w1Left, d1, w2Left, d2);
        const intRR = lineIntersect(w1Right, d1, w2Right, d2);
        const intLR = lineIntersect(w1Left, d1, w2Right, d2);
        const intRL = lineIntersect(w1Right, d1, w2Left, d2);

        // Helper to check if intersection is reasonably close to corner
        const maxDist = Math.max(geo1.halfThick, geo2.halfThick) * 8;
        const isReasonable = (pt) => pt && dist(pt, check.pt1) < maxDist;

        // For L-corner miter, we use same-side intersections (LL and RR)
        // These extend the wall edges until they meet, creating a proper miter joint
        // The key insight: both walls share the same "left" and "right" edges at the corner
        // because left/right is defined relative to the wall's direction vector
        //
        // EXCEPTION: When an exterior wall meets an interior wall at an L-corner,
        // the exterior wall's OUTER edge (siding side) should NOT be mitered.
        // The exterior siding should continue straight past the corner.
        // Only the interior-facing edges should be mitered.

        if (Math.abs(cross) > 0.001 && intLL && intRR) {
          const wall1IsExterior = geo1.isExterior;
          const wall2IsExterior = geo2.isExterior;
          const bothExterior = wall1IsExterior && wall2IsExterior;
          const bothInterior = !wall1IsExterior && !wall2IsExterior;

          if (bothExterior || bothInterior) {
            // Same wall type - apply full miter to both walls on both sides
            trims[wall1.id][`${trim1Key}LeftTrim`] = intLL;
            trims[wall2.id][`${trim2Key}LeftTrim`] = intLL;
            trims[wall1.id][`${trim1Key}RightTrim`] = intRR;
            trims[wall2.id][`${trim2Key}RightTrim`] = intRR;
          } else {
            // Mixed wall types (exterior meets interior)
            // The exterior wall's OUTER edge (siding) should NOT be mitered
            // Only the interior-facing edges should be mitered
            //
            // For exterior walls (when not flipped):
            // - "left" edge (positive perpendicular) = outside (siding)
            // - "right" edge (negative perpendicular) = inside (drywall)
            // When flipped, these are swapped
            //
            // The interior wall should trim BOTH edges to the exterior wall's DRYWALL edge
            // (not to its own side's edge on the exterior wall)
            // The exterior wall should only miter its drywall edge

            // Determine which wall is exterior and which is interior
            const exteriorWall = wall1IsExterior ? wall1 : wall2;
            const interiorWall = wall1IsExterior ? wall2 : wall1;
            const exteriorGeo = wall1IsExterior ? geo1 : geo2;
            const interiorGeo = wall1IsExterior ? geo2 : geo1;
            const exteriorTrimKey = wall1IsExterior ? trim1Key : trim2Key;
            const interiorTrimKey = wall1IsExterior ? trim2Key : trim1Key;
            const exteriorDir = wall1IsExterior ? d1 : d2;
            const interiorDir = wall1IsExterior ? d2 : d1;
            const interiorLeft = wall1IsExterior ? w2Left : w1Left;
            const interiorRight = wall1IsExterior ? w2Right : w1Right;

            const exteriorFlipped = exteriorWall.flipped;
            // For unflipped exterior: right edge is drywall
            // For flipped exterior: left edge is drywall
            // Get a point on the exterior wall's drywall edge line
            const drywallEdgePt = wall1IsExterior
              ? (exteriorFlipped
                  ? (check.w1End === 'start' ? geo1.startLeft : geo1.endLeft)
                  : (check.w1End === 'start' ? geo1.startRight : geo1.endRight))
              : (exteriorFlipped
                  ? (check.w2End === 'start' ? geo2.startLeft : geo2.endLeft)
                  : (check.w2End === 'start' ? geo2.startRight : geo2.endRight));

            // Interior wall: BOTH edges trim to the exterior wall's DRYWALL edge line
            const intLeftToDrywall = lineIntersect(interiorLeft, interiorDir, drywallEdgePt, exteriorDir);
            const intRightToDrywall = lineIntersect(interiorRight, interiorDir, drywallEdgePt, exteriorDir);

            if (DEBUG) {
              console.log(`L-CORNER: exterior=${exteriorWall.id?.slice(-4)} interior=${interiorWall.id?.slice(-4)} flipped=${exteriorFlipped}`);
              console.log(`  drywallEdgePt=(${drywallEdgePt.x.toFixed(0)},${drywallEdgePt.y.toFixed(0)}) intLeftToDrywall=${intLeftToDrywall ? 'yes' : 'no'} intRightToDrywall=${intRightToDrywall ? 'yes' : 'no'}`);
            }

            if (intLeftToDrywall) {
              trims[interiorWall.id][`${interiorTrimKey}LeftTrim`] = intLeftToDrywall;
            }
            if (intRightToDrywall) {
              trims[interiorWall.id][`${interiorTrimKey}RightTrim`] = intRightToDrywall;
            }

            // Exterior wall: only miter the drywall edge
            if (exteriorFlipped) {
              // Flipped: left is drywall - miter left
              trims[exteriorWall.id][`${exteriorTrimKey}LeftTrim`] = intLL;
            } else {
              // Not flipped: right is drywall - miter right
              trims[exteriorWall.id][`${exteriorTrimKey}RightTrim`] = intRR;
            }
          }
        }
        // If cross is near zero, walls are parallel/collinear - no miter needed

        // Also compute finish line trims for L-corners
        const w1LeftFinish = check.w1End === 'start' ? geo1.startLeftFinish : geo1.endLeftFinish;
        const w1RightFinish = check.w1End === 'start' ? geo1.startRightFinish : geo1.endRightFinish;
        const w2LeftFinish = check.w2End === 'start' ? geo2.startLeftFinish : geo2.endLeftFinish;
        const w2RightFinish = check.w2End === 'start' ? geo2.startRightFinish : geo2.endRightFinish;

        // Compute finish intersections
        const intFinishLL = (w1LeftFinish && w2LeftFinish) ? lineIntersect(w1LeftFinish, d1, w2LeftFinish, d2) : null;
        const intFinishRR = (w1RightFinish && w2RightFinish) ? lineIntersect(w1RightFinish, d1, w2RightFinish, d2) : null;

        // ============================================================================
        // CRITICAL L-CORNER FINISH LINE LOGIC - DO NOT MODIFY WITHOUT CAREFUL TESTING
        // ============================================================================
        // For interior walls meeting at L-corners, BOTH finish lines (left and right
        // sheetrock) need to be mitered. This is different from the main edges where
        // only the "inside" corner gets mitered.
        // ============================================================================
        if (Math.abs(cross) > 0.001) {
          // Apply finish trims to BOTH sides for interior-to-interior L-corners
          if (intFinishLL && isReasonable(intFinishLL)) {
            trims[wall1.id][`${trim1Key}LeftFinishTrim`] = intFinishLL;
            trims[wall2.id][`${trim2Key}LeftFinishTrim`] = intFinishLL;
            if (DEBUG) console.log(`L-CORNER FINISH LL: wall1=${wall1.id?.slice(-4)} wall2=${wall2.id?.slice(-4)} at (${intFinishLL.x.toFixed(0)},${intFinishLL.y.toFixed(0)})`);
          }
          if (intFinishRR && isReasonable(intFinishRR)) {
            trims[wall1.id][`${trim1Key}RightFinishTrim`] = intFinishRR;
            trims[wall2.id][`${trim2Key}RightFinishTrim`] = intFinishRR;
            if (DEBUG) console.log(`L-CORNER FINISH RR: wall1=${wall1.id?.slice(-4)} wall2=${wall2.id?.slice(-4)} at (${intFinishRR.x.toFixed(0)},${intFinishRR.y.toFixed(0)})`);
          }
        }
      }

      // Check T-intersections: wall1's endpoint on wall2's body
      const tChecks = [
        { incoming: wall1, incomingEnd: 'start', host: wall2, incomingGeo: geo1, hostGeo: geo2 },
        { incoming: wall1, incomingEnd: 'end', host: wall2, incomingGeo: geo1, hostGeo: geo2 },
        { incoming: wall2, incomingEnd: 'start', host: wall1, incomingGeo: geo2, hostGeo: geo1 },
        { incoming: wall2, incomingEnd: 'end', host: wall1, incomingGeo: geo2, hostGeo: geo1 },
      ];

      for (const tCheck of tChecks) {
        const incomingPt = tCheck.incomingEnd === 'start' ? tCheck.incoming.start : tCheck.incoming.end;
        // Pass both wall thicknesses to allow detection when:
        // - incoming wall is snapped to the edge of the host wall rather than its centerline
        // - incoming wall centerline is outside host but wall bodies overlap
        const hostThickness = tCheck.hostGeo.thickness;
        const incomingThickness = tCheck.incomingGeo.thickness;
        const t = pointOnSegmentT(incomingPt, tCheck.host.start, tCheck.host.end, hostThickness, incomingThickness);

        // Debug: log T-junction detection attempts
        if (DEBUG_T_JUNCTION) {
          const hostLen = dist(tCheck.host.start, tCheck.host.end);
          const projT = ((incomingPt.x - tCheck.host.start.x) * (tCheck.host.end.x - tCheck.host.start.x) +
                        (incomingPt.y - tCheck.host.start.y) * (tCheck.host.end.y - tCheck.host.start.y)) / (hostLen * hostLen);
          const closestX = tCheck.host.start.x + projT * (tCheck.host.end.x - tCheck.host.start.x);
          const closestY = tCheck.host.start.y + projT * (tCheck.host.end.y - tCheck.host.start.y);
          const perpDist = dist(incomingPt, { x: closestX, y: closestY });
          const actualTolerance = Math.max((hostThickness + incomingThickness) / 2 + 15, 40);

          // Log ALL checks to understand the geometry
          console.log(`T: ${tCheck.incoming.id?.slice(-4)}.${tCheck.incomingEnd}(${Math.round(incomingPt.x)},${Math.round(incomingPt.y)}) -> ${tCheck.host.id?.slice(-4)}[(${Math.round(tCheck.host.start.x)},${Math.round(tCheck.host.start.y)})-(${Math.round(tCheck.host.end.x)},${Math.round(tCheck.host.end.y)})] projT=${projT.toFixed(2)} perpDist=${perpDist.toFixed(0)} | ${t !== null ? 'HIT' : 'miss'}`);
        }

        if (t === null) continue;

        // Found a T-intersection!
        // The host wall needs a gap in its near edge where the incoming wall meets
        // The incoming wall keeps its natural endpoints (no extension needed)
        if (DEBUG_T_JUNCTION) console.log(`*** T-JUNCTION FOUND: incoming=${tCheck.incoming.id?.slice(-4)} at ${tCheck.incomingEnd} -> host=${tCheck.host.id?.slice(-4)} at t=${t.toFixed(2)}`);

        const hostGeo = tCheck.hostGeo;
        const incomingGeo = tCheck.incomingGeo;

        // Determine which edge of the host wall the incoming wall ENTERS through
        // This is the "near" edge from the incoming wall's perspective
        //
        // The incoming wall is traveling TOWARD the host. We need to find which edge
        // of the host wall the incoming wall's JUNCTION POINT is closer to.
        // The junction point itself tells us which side we're approaching from.
        //
        // Calculate perpendicular distances from the junction point to each edge line
        // of the host wall. The closer edge is the one the incoming wall enters through.

        // Get a point on the host's left edge (use the point at the same t position as the junction)
        const hostLeftAtT = {
          x: hostGeo.startLeft.x + t * (hostGeo.endLeft.x - hostGeo.startLeft.x),
          y: hostGeo.startLeft.y + t * (hostGeo.endLeft.y - hostGeo.startLeft.y),
        };
        const hostRightAtT = {
          x: hostGeo.startRight.x + t * (hostGeo.endRight.x - hostGeo.startRight.x),
          y: hostGeo.startRight.y + t * (hostGeo.endRight.y - hostGeo.startRight.y),
        };

        // The junction point (incomingPt) is on or near the host's centerline
        // Measure distance from junction to each edge
        const distToLeftEdge = Math.sqrt(
          (incomingPt.x - hostLeftAtT.x) ** 2 +
          (incomingPt.y - hostLeftAtT.y) ** 2
        );
        const distToRightEdge = Math.sqrt(
          (incomingPt.x - hostRightAtT.x) ** 2 +
          (incomingPt.y - hostRightAtT.y) ** 2
        );

        // But wait - the junction point is at the centerline, so distances will be equal!
        // We need to check which side the incoming wall's CENTER (away from junction) is on.
        const incomingCenter = tCheck.incomingEnd === 'start'
          ? tCheck.incoming.end
          : tCheck.incoming.start;

        // Distance from incoming wall center to each edge
        const centerToLeftEdge = Math.sqrt(
          (incomingCenter.x - hostLeftAtT.x) ** 2 +
          (incomingCenter.y - hostLeftAtT.y) ** 2
        );
        const centerToRightEdge = Math.sqrt(
          (incomingCenter.x - hostRightAtT.x) ** 2 +
          (incomingCenter.y - hostRightAtT.y) ** 2
        );

        // The incoming wall is CLOSER to one edge - that's the NEAR edge (where it enters)
        // But we want to trim the incoming wall to that near edge and put the gap there
        const nearEdgeIsLeft = centerToLeftEdge < centerToRightEdge;

        if (DEBUG_T_JUNCTION) {
          console.log(`  SIDE: centerToLeft=${centerToLeftEdge.toFixed(0)} centerToRight=${centerToRightEdge.toFixed(0)} -> ${nearEdgeIsLeft ? 'LEFT' : 'RIGHT'}`);
        }

        const side = nearEdgeIsLeft ? 1 : -1;

        // Calculate gap positions along the host wall
        // Instead of using centerline-based approximation, calculate where the incoming
        // wall's edges actually intersect the host wall's edge for precise gap placement
        const incomingHalfThick = incomingGeo.halfThick;
        const hostLen = hostGeo.len;

        // Direction the incoming wall is traveling (toward host)
        const incomingDirToHost = tCheck.incomingEnd === 'start'
          ? { x: -incomingGeo.dirX, y: -incomingGeo.dirY }
          : { x: incomingGeo.dirX, y: incomingGeo.dirY };

        const hostEdgeDir = { x: hostGeo.dirX, y: hostGeo.dirY };

        // Get the incoming wall's edge endpoints at the junction
        const incomingLeft = tCheck.incomingEnd === 'start' ? incomingGeo.startLeft : incomingGeo.endLeft;
        const incomingRight = tCheck.incomingEnd === 'start' ? incomingGeo.startRight : incomingGeo.endRight;

        // Helper to calculate t position along host edge
        const calcTOnHost = (point, hostStart, hostEnd) => {
          const dx = hostEnd.x - hostStart.x;
          const dy = hostEnd.y - hostStart.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len === 0) return 0;
          return ((point.x - hostStart.x) * dx + (point.y - hostStart.y) * dy) / (len * len);
        };

        // Default gap based on centerline (fallback)
        const tGapHalf = incomingHalfThick / hostLen;
        let tGapStart = Math.max(0, t - tGapHalf);
        let tGapEnd = Math.min(1, t + tGapHalf);

        // The incoming wall is on one side of the host wall
        // Gap goes in the edge facing the incoming wall
        // Incoming wall edges need to extend to meet that edge

        const trimKey = tCheck.incomingEnd === 'start' ? 'start' : 'end';

        // Also get the FAR edge endpoints (the other end of the incoming wall, away from junction)
        const incomingLeftFar = tCheck.incomingEnd === 'start' ? incomingGeo.endLeft : incomingGeo.startLeft;
        const incomingRightFar = tCheck.incomingEnd === 'start' ? incomingGeo.endRight : incomingGeo.startRight;

        // The incoming wall approaches from one side of the host wall
        // - Gap goes in the host wall's edge facing the incoming wall
        // - Incoming wall edges should be trimmed to that SAME edge (where they meet)
        //
        // HOWEVER, visually we want the incoming wall to stop at the NEAR edge of the host
        // (the edge closest to the incoming wall), not pass through to the far edge.
        // The "side" calculation tells us which edge the incoming wall is approaching FROM.

        // Determine if the host wall is exterior and which side is "outside" (siding)
        // For exterior walls: left edge is outside (siding), right edge is inside (drywall)
        // If flipped, it's reversed
        const hostIsExterior = hostGeo.isExterior;
        const hostFlipped = tCheck.host.flipped === true; // Explicitly check for true, not just truthy
        // For unflipped exterior: left = outside (siding), right = inside (drywall)
        // For flipped exterior: left = inside (drywall), right = outside (siding)
        const hostInsideIsRight = hostIsExterior && !hostFlipped;  // drywall on right
        const hostInsideIsLeft = hostIsExterior && hostFlipped;    // drywall on left (flipped)

        // For exterior walls: interior walls should ONLY connect to the INSIDE (drywall) edge
        // The siding edge should NEVER get a gap - it continues unbroken
        // The incoming wall trims to the inside edge of the exterior wall

        if (DEBUG_T_JUNCTION) console.log(`  HOST: ${tCheck.host.id?.slice(-4)} isExterior=${hostIsExterior} side=${side}`);

        if (hostIsExterior) {
          // Exterior host wall - special handling:
          // 1. GAP only goes in the edge on the SAME side as the incoming wall (the "near" edge)
          // 2. BUT only if that edge is the drywall (inside) edge - NEVER put gap in siding
          // 3. TRIM incoming wall to the NEAR edge (whichever edge it approaches from)
          //
          // For unflipped exterior: left = siding (outside), right = drywall (inside)
          // For flipped exterior: left = drywall (inside), right = siding (outside)

          const approachingFromRight = side < 0; // side < 0 means incoming is on RIGHT side
          const approachingFromLeft = side > 0;  // side > 0 means incoming is on LEFT side

          // Determine if the incoming wall is approaching from the drywall side
          // If unflipped: drywall is on right, so approaching from right = drywall side
          // If flipped: drywall is on left, so approaching from left = drywall side
          const drywallIsRight = !hostFlipped;
          const drywallIsLeft = hostFlipped;
          const approachingFromDrywallSide = (drywallIsRight && approachingFromRight) || (drywallIsLeft && approachingFromLeft);

          if (DEBUG_T_JUNCTION) console.log(`  EXTERIOR: drywallIsRight=${drywallIsRight}, approachFromRight=${approachingFromRight}, approachFromDrywall=${approachingFromDrywallSide}`);

          // Trim incoming wall to the NEAR edge (the edge it approaches from)
          // For a clean T-junction, we want the incoming wall to end with a perpendicular cut
          // First, find where the incoming wall's CENTERLINE hits the host edge
          const nearEdgePt = side > 0 ? hostGeo.startLeft : hostGeo.startRight;
          const incomingCenterAtJunction = tCheck.incomingEnd === 'start'
            ? tCheck.incoming.start
            : tCheck.incoming.end;

          // Find where centerline intersects the host edge
          const centerTrim = lineIntersect(incomingCenterAtJunction, incomingDirToHost, nearEdgePt, hostEdgeDir);
          if (DEBUG_T_JUNCTION) console.log(`  centerTrim=${centerTrim ? `(${centerTrim.x.toFixed(0)},${centerTrim.y.toFixed(0)})` : 'NULL'}`);

          // Now create perpendicular trim points for left and right edges at this centerline position
          // The trim points should be at the same distance along the wall, creating a perpendicular cut
          let leftTrim, rightTrim;
          if (centerTrim) {
            // Calculate the perpendicular offset from centerline to each edge
            leftTrim = {
              x: centerTrim.x + incomingGeo.perpX * incomingGeo.halfThick,
              y: centerTrim.y + incomingGeo.perpY * incomingGeo.halfThick
            };
            rightTrim = {
              x: centerTrim.x - incomingGeo.perpX * incomingGeo.halfThick,
              y: centerTrim.y - incomingGeo.perpY * incomingGeo.halfThick
            };
          } else {
            // Fallback to diagonal intersection if centerline calc fails
            leftTrim = lineIntersect(incomingLeft, incomingDirToHost, nearEdgePt, hostEdgeDir);
            rightTrim = lineIntersect(incomingRight, incomingDirToHost, nearEdgePt, hostEdgeDir);
          }

          // For T-junctions, ALWAYS create gap on the NEAR edge (the side the incoming wall approaches from)
          // The "no gap on siding" logic only applies to L-corners where exterior walls meet
          // Project the perpendicular trim points onto the host edge line for the gap
          if (leftTrim && rightTrim) {
            // The trim points form a perpendicular cut but may not be exactly on the host edge
            // Project them onto the host edge to get accurate gap points
            // Use the NEAR edge (based on side) not the drywall edge
            const hostEdgeStart = side > 0 ? hostGeo.startLeft : hostGeo.startRight;
            const hostEdgeEnd = side > 0 ? hostGeo.endLeft : hostGeo.endRight;

            // Project leftTrim onto host edge
            const leftGapPt = lineIntersect(leftTrim, { x: hostGeo.perpX, y: hostGeo.perpY }, hostEdgeStart, hostEdgeDir);
            // Project rightTrim onto host edge
            const rightGapPt = lineIntersect(rightTrim, { x: hostGeo.perpX, y: hostGeo.perpY }, hostEdgeStart, hostEdgeDir);

            if (leftGapPt && rightGapPt) {
              const leftT = calcTOnHost(leftGapPt, hostEdgeStart, hostEdgeEnd);
              const rightT = calcTOnHost(rightGapPt, hostEdgeStart, hostEdgeEnd);
              const gapStartPt = leftT < rightT ? leftGapPt : rightGapPt;
              const gapEndPt = leftT < rightT ? rightGapPt : leftGapPt;
              const actualTStart = Math.min(leftT, rightT);
              const actualTEnd = Math.max(leftT, rightT);

              if (side > 0) {
                trims[tCheck.host.id].leftEdgeGaps.push({ start: gapStartPt, end: gapEndPt, t: t, tStart: actualTStart, tEnd: actualTEnd });
                if (DEBUG_T_JUNCTION) console.log(`  -> GAP in host ${tCheck.host.id?.slice(-4)} LEFT edge: (${gapStartPt.x.toFixed(0)},${gapStartPt.y.toFixed(0)}) to (${gapEndPt.x.toFixed(0)},${gapEndPt.y.toFixed(0)})`);
              } else {
                trims[tCheck.host.id].rightEdgeGaps.push({ start: gapStartPt, end: gapEndPt, t: t, tStart: actualTStart, tEnd: actualTEnd });
                if (DEBUG_T_JUNCTION) console.log(`  -> GAP in host ${tCheck.host.id?.slice(-4)} RIGHT edge: (${gapStartPt.x.toFixed(0)},${gapStartPt.y.toFixed(0)}) to (${gapEndPt.x.toFixed(0)},${gapEndPt.y.toFixed(0)})`);
              }
            } else {
              if (DEBUG_T_JUNCTION) console.log(`  -> NO GAP created - projection calculation failed`);
            }
          } else {
            if (DEBUG_T_JUNCTION) console.log(`  -> NO GAP created - trim calculation failed`);
          }

          // Only apply trim if it SHORTENS the wall
          const leftFarDist = leftTrim ? Math.sqrt((incomingLeftFar.x - leftTrim.x)**2 + (incomingLeftFar.y - leftTrim.y)**2) : Infinity;
          const leftOrigDist = Math.sqrt((incomingLeftFar.x - incomingLeft.x)**2 + (incomingLeftFar.y - incomingLeft.y)**2);
          const rightFarDist = rightTrim ? Math.sqrt((incomingRightFar.x - rightTrim.x)**2 + (incomingRightFar.y - rightTrim.y)**2) : Infinity;
          const rightOrigDist = Math.sqrt((incomingRightFar.x - incomingRight.x)**2 + (incomingRightFar.y - incomingRight.y)**2);

          if (DEBUG) console.log(`TRIM CHECK ${tCheck.incoming.id?.slice(-4)}.${trimKey}: leftFarDist=${leftFarDist.toFixed(0)} leftOrigDist=${leftOrigDist.toFixed(0)} -> ${leftFarDist < leftOrigDist ? 'APPLY' : 'SKIP'}`);

          if (leftTrim && leftFarDist < leftOrigDist) {
            trims[tCheck.incoming.id][`${trimKey}LeftTrim`] = leftTrim;
            if (DEBUG) console.log(`TRIM ${tCheck.incoming.id?.slice(-4)}.${trimKey}Left to (${Math.round(leftTrim.x)},${Math.round(leftTrim.y)}) [to host ${side > 0 ? 'LEFT' : 'RIGHT'} edge]`);
          }
          if (rightTrim && rightFarDist < rightOrigDist) {
            trims[tCheck.incoming.id][`${trimKey}RightTrim`] = rightTrim;
            if (DEBUG) console.log(`TRIM ${tCheck.incoming.id?.slice(-4)}.${trimKey}Right to (${Math.round(rightTrim.x)},${Math.round(rightTrim.y)}) [to host ${side > 0 ? 'LEFT' : 'RIGHT'} edge]`);
          }

          if (DEBUG) console.log(`INCOMING WALL ${tCheck.incoming.id?.slice(-4)} trimmed to ${side > 0 ? 'LEFT' : 'RIGHT'} edge (near side)`);
        } else {
          // Non-exterior host wall - use normal logic based on which side incoming is on
          if (DEBUG_T_JUNCTION) console.log(`  -> NON-EXTERIOR HOST: gap will go in ${side > 0 ? 'LEFT' : 'RIGHT'} edge based on side=${side}`);

          // For clean T-junction, find where centerline hits host edge, then create perpendicular cut
          const nearEdgePtNonExt = side > 0 ? hostGeo.startLeft : hostGeo.startRight;
          const incomingCenterAtJunctionNonExt = tCheck.incomingEnd === 'start'
            ? tCheck.incoming.start
            : tCheck.incoming.end;
          const centerTrimNonExt = lineIntersect(incomingCenterAtJunctionNonExt, incomingDirToHost, nearEdgePtNonExt, hostEdgeDir);

          let leftTrim, rightTrim;
          if (centerTrimNonExt) {
            // Create perpendicular trim points
            leftTrim = {
              x: centerTrimNonExt.x + incomingGeo.perpX * incomingGeo.halfThick,
              y: centerTrimNonExt.y + incomingGeo.perpY * incomingGeo.halfThick
            };
            rightTrim = {
              x: centerTrimNonExt.x - incomingGeo.perpX * incomingGeo.halfThick,
              y: centerTrimNonExt.y - incomingGeo.perpY * incomingGeo.halfThick
            };
          } else {
            // Fallback
            leftTrim = lineIntersect(incomingLeft, incomingDirToHost, nearEdgePtNonExt, hostEdgeDir);
            rightTrim = lineIntersect(incomingRight, incomingDirToHost, nearEdgePtNonExt, hostEdgeDir);
          }

          if (side > 0) {
            // Incoming wall body is on the "left" side - gap in left edge
            // Project perpendicular trim points onto host edge for accurate gap
            if (leftTrim && rightTrim) {
              const leftGapPt = lineIntersect(leftTrim, { x: hostGeo.perpX, y: hostGeo.perpY }, hostGeo.startLeft, hostEdgeDir);
              const rightGapPt = lineIntersect(rightTrim, { x: hostGeo.perpX, y: hostGeo.perpY }, hostGeo.startLeft, hostEdgeDir);
              if (leftGapPt && rightGapPt) {
                const leftT = calcTOnHost(leftGapPt, hostGeo.startLeft, hostGeo.endLeft);
                const rightT = calcTOnHost(rightGapPt, hostGeo.startLeft, hostGeo.endLeft);
                const gapStartPt = leftT < rightT ? leftGapPt : rightGapPt;
                const gapEndPt = leftT < rightT ? rightGapPt : leftGapPt;
                const actualTStart = Math.min(leftT, rightT);
                const actualTEnd = Math.max(leftT, rightT);
                trims[tCheck.host.id].leftEdgeGaps.push({ start: gapStartPt, end: gapEndPt, t: t, tStart: actualTStart, tEnd: actualTEnd });
                if (DEBUG_T_JUNCTION) console.log(`  -> GAP in host ${tCheck.host.id?.slice(-4)} LEFT edge: (${gapStartPt.x.toFixed(0)},${gapStartPt.y.toFixed(0)}) to (${gapEndPt.x.toFixed(0)},${gapEndPt.y.toFixed(0)})`);

              }
            }

            if (leftTrim) {
              trims[tCheck.incoming.id][`${trimKey}LeftTrim`] = leftTrim;
              if (DEBUG) console.log(`TRIM ${tCheck.incoming.id?.slice(-4)}.${trimKey}Left to (${Math.round(leftTrim.x)},${Math.round(leftTrim.y)}) [to host LEFT edge]`);
            }
            if (rightTrim) {
              trims[tCheck.incoming.id][`${trimKey}RightTrim`] = rightTrim;
              if (DEBUG) console.log(`TRIM ${tCheck.incoming.id?.slice(-4)}.${trimKey}Right to (${Math.round(rightTrim.x)},${Math.round(rightTrim.y)}) [to host LEFT edge]`);
            }
          } else {
            // Incoming wall body is on the "right" side - gap in right edge
            // Project perpendicular trim points onto host edge for accurate gap
            if (leftTrim && rightTrim) {
              const leftGapPt = lineIntersect(leftTrim, { x: hostGeo.perpX, y: hostGeo.perpY }, hostGeo.startRight, hostEdgeDir);
              const rightGapPt = lineIntersect(rightTrim, { x: hostGeo.perpX, y: hostGeo.perpY }, hostGeo.startRight, hostEdgeDir);
              if (leftGapPt && rightGapPt) {
                const leftT = calcTOnHost(leftGapPt, hostGeo.startRight, hostGeo.endRight);
                const rightT = calcTOnHost(rightGapPt, hostGeo.startRight, hostGeo.endRight);
                const gapStartPt = leftT < rightT ? leftGapPt : rightGapPt;
                const gapEndPt = leftT < rightT ? rightGapPt : leftGapPt;
                const actualTStart = Math.min(leftT, rightT);
                const actualTEnd = Math.max(leftT, rightT);
                trims[tCheck.host.id].rightEdgeGaps.push({ start: gapStartPt, end: gapEndPt, t: t, tStart: actualTStart, tEnd: actualTEnd });
                if (DEBUG_T_JUNCTION) console.log(`  -> GAP in host ${tCheck.host.id?.slice(-4)} RIGHT edge: (${gapStartPt.x.toFixed(0)},${gapStartPt.y.toFixed(0)}) to (${gapEndPt.x.toFixed(0)},${gapEndPt.y.toFixed(0)})`);

              }
            }

            if (leftTrim) {
              trims[tCheck.incoming.id][`${trimKey}LeftTrim`] = leftTrim;
              if (DEBUG) console.log(`TRIM ${tCheck.incoming.id?.slice(-4)}.${trimKey}Left to (${Math.round(leftTrim.x)},${Math.round(leftTrim.y)}) [to host RIGHT edge]`);
            }
            if (rightTrim) {
              trims[tCheck.incoming.id][`${trimKey}RightTrim`] = rightTrim;
              if (DEBUG) console.log(`TRIM ${tCheck.incoming.id?.slice(-4)}.${trimKey}Right to (${Math.round(rightTrim.x)},${Math.round(rightTrim.y)}) [to host RIGHT edge]`);
            }
          }
        }

        // Mark the incoming wall's end so we don't draw an end cap there
        trims[tCheck.incoming.id][`${trimKey}HasT`] = true;
        // Also store if the host was exterior (affects how finish-to-main connectors are drawn)
        trims[tCheck.incoming.id][`${trimKey}HostIsExterior`] = hostIsExterior;

        if (DEBUG) console.log(`FINISH TRIM SETUP for ${tCheck.incoming.id?.slice(-4)}: trimKey=${trimKey} incomingEnd=${tCheck.incomingEnd}`);

        // Also handle finish line gaps and trims for T-intersections
        // Incoming wall's finish lines need to be trimmed to match where the main wall edges are trimmed
        // For exterior host walls: ALWAYS trim to drywall edge and create gap there
        // For non-exterior host walls: use side to determine which edge
        const incomingLeftFinish = tCheck.incomingEnd === 'start' ? incomingGeo.startLeftFinish : incomingGeo.endLeftFinish;
        const incomingRightFinish = tCheck.incomingEnd === 'start' ? incomingGeo.startRightFinish : incomingGeo.endRightFinish;

        if (DEBUG) console.log(`  incomingLeftFinish=${incomingLeftFinish ? 'exists' : 'null'} incomingRightFinish=${incomingRightFinish ? 'exists' : 'null'}`);

        // Also get the FAR finish endpoints (the other end of the incoming wall, away from junction)
        const incomingLeftFinishFar = tCheck.incomingEnd === 'start' ? incomingGeo.endLeftFinish : incomingGeo.startLeftFinish;
        const incomingRightFinishFar = tCheck.incomingEnd === 'start' ? incomingGeo.endRightFinish : incomingGeo.startRightFinish;

        // Determine which side of the HOST wall gets a finish line gap
        // For EXTERIOR host walls: gap goes in DRYWALL side (interior side of exterior wall)
        // For INTERIOR host walls: gap goes on the NEAR side (where incoming wall approaches)
        let finishGapInRight;
        let createFinishGap = true;

        if (hostIsExterior) {
          // Exterior wall: gap goes in drywall side (interior finish line)
          // For unflipped exterior: drywall is on RIGHT
          // For flipped exterior: drywall is on LEFT
          const drywallIsOnRight = !hostFlipped;
          finishGapInRight = drywallIsOnRight;
          if (DEBUG_T_JUNCTION) console.log(`  EXTERIOR HOST: finishGapInRight=${finishGapInRight} (drywallIsOnRight=${drywallIsOnRight}, hostFlipped=${hostFlipped})`);
        } else {
          // Interior wall: gap goes on the side the incoming wall approaches from
          finishGapInRight = side < 0; // side < 0 means approaching from right
        }

        // For T-junctions, the finish line should be trimmed to a point that is:
        // - On the same perpendicular line as the main edge trim point
        // - On the finish line itself
        // This ensures the connection from finish trim to main trim is perpendicular to the wall
        let leftFinishTrim = null;
        let rightFinishTrim = null;

        // Get the main edge trim that was just calculated for this T-junction
        const mainLeftTrim = trims[tCheck.incoming.id][`${trimKey}LeftTrim`];
        const mainRightTrim = trims[tCheck.incoming.id][`${trimKey}RightTrim`];

        if (DEBUG_T_JUNCTION) console.log(`  mainLeftTrim=${mainLeftTrim ? `(${mainLeftTrim.x.toFixed(0)},${mainLeftTrim.y.toFixed(0)})` : 'null'} mainRightTrim=${mainRightTrim ? `(${mainRightTrim.x.toFixed(0)},${mainRightTrim.y.toFixed(0)})` : 'null'}`);
        if (DEBUG_T_JUNCTION) console.log(`  incomingLeftFinish=${incomingLeftFinish ? `(${incomingLeftFinish.x.toFixed(0)},${incomingLeftFinish.y.toFixed(0)})` : 'null'} incomingRightFinish=${incomingRightFinish ? `(${incomingRightFinish.x.toFixed(0)},${incomingRightFinish.y.toFixed(0)})` : 'null'}`);

        // Calculate finish trim points for T-junctions
        // For EXTERIOR host walls: incoming finish lines should extend to host's DRYWALL line (interior)
        // For INTERIOR host walls: finish lines trim at same position as main edges

        // Get the target line for finish trim - for exterior hosts, use the drywall (interior) line
        let finishTargetLine = null;
        let finishTargetDir = hostEdgeDir;

        if (hostIsExterior) {
          // Exterior host: incoming finish lines should reach the host's drywall line
          const drywallIsOnRight = !hostFlipped;
          finishTargetLine = drywallIsOnRight ? hostGeo.startRightFinish : hostGeo.startLeftFinish;
          if (DEBUG_T_JUNCTION) console.log(`  FINISH TARGET: host drywall line at ${finishTargetLine ? `(${finishTargetLine.x.toFixed(0)},${finishTargetLine.y.toFixed(0)})` : 'null'}`);
        }

        // Handle finish line trims and gaps
        const incomingDir = { x: incomingGeo.dirX, y: incomingGeo.dirY };

        if (hostIsExterior) {
          // EXTERIOR HOST: trim incoming finish lines to host's drywall line
          if (finishTargetLine) {
            if (incomingLeftFinish) {
              leftFinishTrim = lineIntersect(incomingLeftFinish, incomingDir, finishTargetLine, hostEdgeDir);
              if (leftFinishTrim) trims[tCheck.incoming.id][`${trimKey}LeftFinishTrim`] = leftFinishTrim;
            }
            if (incomingRightFinish) {
              rightFinishTrim = lineIntersect(incomingRightFinish, incomingDir, finishTargetLine, hostEdgeDir);
              if (rightFinishTrim) trims[tCheck.incoming.id][`${trimKey}RightFinishTrim`] = rightFinishTrim;
            }
          }

          // Create gap in host's drywall finish line
          const drywallIsOnRight = !hostFlipped;
          const hostFinishForGap = drywallIsOnRight ? hostGeo.startRightFinish : hostGeo.startLeftFinish;
          const gapsArray = drywallIsOnRight ? trims[tCheck.host.id].rightFinishGaps : trims[tCheck.host.id].leftFinishGaps;

          if (hostFinishForGap && leftFinishTrim && rightFinishTrim) {
            const tLeft = (leftFinishTrim.x - hostFinishForGap.x) * hostGeo.dirX +
                          (leftFinishTrim.y - hostFinishForGap.y) * hostGeo.dirY;
            const tRight = (rightFinishTrim.x - hostFinishForGap.x) * hostGeo.dirX +
                           (rightFinishTrim.y - hostFinishForGap.y) * hostGeo.dirY;

            const gapStart = tLeft < tRight ? leftFinishTrim : rightFinishTrim;
            const gapEnd = tLeft < tRight ? rightFinishTrim : leftFinishTrim;

            gapsArray.push({ start: gapStart, end: gapEnd, t: t, tStart: tGapStart, tEnd: tGapEnd });
          }
        } else {
          // INTERIOR HOST
          const incomingIsExterior = incomingGeo.isExterior;
          console.log(`INTERIOR HOST: incomingIsExterior=${incomingIsExterior}, hostIsExterior=${hostIsExterior}, incoming.type=${tCheck.incoming.type}, host.type=${tCheck.host.type}`);

          if (!incomingIsExterior) {
            // INTERIOR-TO-INTERIOR T-junction:
            // For interior walls, both finish lines (left and right) exist on both sides
            // The incoming wall's finish lines should stop at the host's FAR finish line
            // (the one on the opposite side from where the incoming wall enters)
            // Create gaps in BOTH host finish lines where the incoming wall passes through
            console.log(`  INTERIOR-TO-INTERIOR T-junction: side=${side}`);

            // NEAR finish is on the side the incoming wall approaches from
            // FAR finish is on the opposite side (where incoming wall exits the host)
            const nearFinishPt = side > 0 ? hostGeo.startLeftFinish : hostGeo.startRightFinish;
            const farFinishPt = side > 0 ? hostGeo.startRightFinish : hostGeo.startLeftFinish;
            const nearGapsArray = side > 0 ? trims[tCheck.host.id].leftFinishGaps : trims[tCheck.host.id].rightFinishGaps;
            const farGapsArray = side > 0 ? trims[tCheck.host.id].rightFinishGaps : trims[tCheck.host.id].leftFinishGaps;

            console.log(`  nearFinishPt=(${nearFinishPt?.x.toFixed(0)},${nearFinishPt?.y.toFixed(0)}) farFinishPt=(${farFinishPt?.x.toFixed(0)},${farFinishPt?.y.toFixed(0)})`);

            // Trim incoming finish lines to the host's FAR finish line (where they exit)
            if (farFinishPt) {
              if (incomingLeftFinish) {
                leftFinishTrim = lineIntersect(incomingLeftFinish, incomingDir, farFinishPt, hostEdgeDir);
                console.log(`  leftFinishTrim to FAR=(${leftFinishTrim?.x.toFixed(0)},${leftFinishTrim?.y.toFixed(0)})`);
                if (leftFinishTrim) trims[tCheck.incoming.id][`${trimKey}LeftFinishTrim`] = leftFinishTrim;
              }
              if (incomingRightFinish) {
                rightFinishTrim = lineIntersect(incomingRightFinish, incomingDir, farFinishPt, hostEdgeDir);
                console.log(`  rightFinishTrim to FAR=(${rightFinishTrim?.x.toFixed(0)},${rightFinishTrim?.y.toFixed(0)})`);
                if (rightFinishTrim) trims[tCheck.incoming.id][`${trimKey}RightFinishTrim`] = rightFinishTrim;
              }
            }

            // Create gaps in BOTH host finish lines
            // Gap in NEAR finish line (where incoming enters)
            if (nearFinishPt && incomingLeftFinish && incomingRightFinish) {
              const nearLeftInt = lineIntersect(incomingLeftFinish, incomingDir, nearFinishPt, hostEdgeDir);
              const nearRightInt = lineIntersect(incomingRightFinish, incomingDir, nearFinishPt, hostEdgeDir);
              if (nearLeftInt && nearRightInt) {
                const tLeft = (nearLeftInt.x - nearFinishPt.x) * hostGeo.dirX + (nearLeftInt.y - nearFinishPt.y) * hostGeo.dirY;
                const tRight = (nearRightInt.x - nearFinishPt.x) * hostGeo.dirX + (nearRightInt.y - nearFinishPt.y) * hostGeo.dirY;
                const gapStart = tLeft < tRight ? nearLeftInt : nearRightInt;
                const gapEnd = tLeft < tRight ? nearRightInt : nearLeftInt;
                nearGapsArray.push({ start: gapStart, end: gapEnd, t: t, tStart: tGapStart, tEnd: tGapEnd });
                console.log(`  GAP in NEAR (${side > 0 ? 'LEFT' : 'RIGHT'}) finish: (${gapStart.x.toFixed(0)},${gapStart.y.toFixed(0)}) to (${gapEnd.x.toFixed(0)},${gapEnd.y.toFixed(0)})`);

                // Add connector line at the NEAR finish line to close off the gap
                // This connects where the incoming wall's finish lines intersect the near host finish
                trims[tCheck.incoming.id].interiorTConnectors.push({
                  from: nearLeftInt,
                  to: nearRightInt
                });
                console.log(`  CONNECTOR at NEAR: (${nearLeftInt.x.toFixed(0)},${nearLeftInt.y.toFixed(0)})->(${nearRightInt.x.toFixed(0)},${nearRightInt.y.toFixed(0)})`);
              }
            }

            // Gap in FAR finish line (where incoming exits)
            if (farFinishPt && incomingLeftFinish && incomingRightFinish) {
              const farLeftInt = lineIntersect(incomingLeftFinish, incomingDir, farFinishPt, hostEdgeDir);
              const farRightInt = lineIntersect(incomingRightFinish, incomingDir, farFinishPt, hostEdgeDir);
              if (farLeftInt && farRightInt) {
                const tLeft = (farLeftInt.x - farFinishPt.x) * hostGeo.dirX + (farLeftInt.y - farFinishPt.y) * hostGeo.dirY;
                const tRight = (farRightInt.x - farFinishPt.x) * hostGeo.dirX + (farRightInt.y - farFinishPt.y) * hostGeo.dirY;
                const gapStart = tLeft < tRight ? farLeftInt : farRightInt;
                const gapEnd = tLeft < tRight ? farRightInt : farLeftInt;
                farGapsArray.push({ start: gapStart, end: gapEnd, t: t, tStart: tGapStart, tEnd: tGapEnd });
                console.log(`  GAP in FAR (${side > 0 ? 'RIGHT' : 'LEFT'}) finish: (${gapStart.x.toFixed(0)},${gapStart.y.toFixed(0)}) to (${gapEnd.x.toFixed(0)},${gapEnd.y.toFixed(0)})`);
              }
            }
          } else {
            // EXTERIOR incoming to INTERIOR host:
            // The exterior wall's finish lines (siding + drywall) should stop at the host's FAR finish line
            // Create gaps in BOTH host finish lines where the exterior wall passes through
            console.log(`  EXTERIOR-TO-INTERIOR T-junction: side=${side}`);

            // NEAR finish is on the side the incoming wall approaches from
            // FAR finish is on the opposite side (where incoming wall exits the host)
            const nearFinishPt = side > 0 ? hostGeo.startLeftFinish : hostGeo.startRightFinish;
            const farFinishPt = side > 0 ? hostGeo.startRightFinish : hostGeo.startLeftFinish;
            const nearGapsArray = side > 0 ? trims[tCheck.host.id].leftFinishGaps : trims[tCheck.host.id].rightFinishGaps;
            const farGapsArray = side > 0 ? trims[tCheck.host.id].rightFinishGaps : trims[tCheck.host.id].leftFinishGaps;

            // Trim incoming finish lines to the host's FAR finish line (where they exit)
            if (farFinishPt) {
              if (incomingLeftFinish) {
                leftFinishTrim = lineIntersect(incomingLeftFinish, incomingDir, farFinishPt, hostEdgeDir);
                if (leftFinishTrim) trims[tCheck.incoming.id][`${trimKey}LeftFinishTrim`] = leftFinishTrim;
              }
              if (incomingRightFinish) {
                rightFinishTrim = lineIntersect(incomingRightFinish, incomingDir, farFinishPt, hostEdgeDir);
                if (rightFinishTrim) trims[tCheck.incoming.id][`${trimKey}RightFinishTrim`] = rightFinishTrim;
              }
            }

            // Create gaps in BOTH host finish lines
            // Gap in NEAR finish line (where incoming enters)
            if (nearFinishPt && incomingLeftFinish && incomingRightFinish) {
              const nearLeftInt = lineIntersect(incomingLeftFinish, incomingDir, nearFinishPt, hostEdgeDir);
              const nearRightInt = lineIntersect(incomingRightFinish, incomingDir, nearFinishPt, hostEdgeDir);
              if (nearLeftInt && nearRightInt) {
                const tLeft = (nearLeftInt.x - nearFinishPt.x) * hostGeo.dirX + (nearLeftInt.y - nearFinishPt.y) * hostGeo.dirY;
                const tRight = (nearRightInt.x - nearFinishPt.x) * hostGeo.dirX + (nearRightInt.y - nearFinishPt.y) * hostGeo.dirY;
                const gapStart = tLeft < tRight ? nearLeftInt : nearRightInt;
                const gapEnd = tLeft < tRight ? nearRightInt : nearLeftInt;
                nearGapsArray.push({ start: gapStart, end: gapEnd, t: t, tStart: tGapStart, tEnd: tGapEnd });

                // Add connector line at the NEAR finish line to close off the gap
                trims[tCheck.incoming.id].interiorTConnectors.push({
                  from: nearLeftInt,
                  to: nearRightInt
                });
              }
            }

            // Gap in FAR finish line (where incoming exits)
            if (farFinishPt && incomingLeftFinish && incomingRightFinish) {
              const farLeftInt = lineIntersect(incomingLeftFinish, incomingDir, farFinishPt, hostEdgeDir);
              const farRightInt = lineIntersect(incomingRightFinish, incomingDir, farFinishPt, hostEdgeDir);
              if (farLeftInt && farRightInt) {
                const tLeft = (farLeftInt.x - farFinishPt.x) * hostGeo.dirX + (farLeftInt.y - farFinishPt.y) * hostGeo.dirY;
                const tRight = (farRightInt.x - farFinishPt.x) * hostGeo.dirX + (farRightInt.y - farFinishPt.y) * hostGeo.dirY;
                const gapStart = tLeft < tRight ? farLeftInt : farRightInt;
                const gapEnd = tLeft < tRight ? farRightInt : farLeftInt;
                farGapsArray.push({ start: gapStart, end: gapEnd, t: t, tStart: tGapStart, tEnd: tGapEnd });
              }
            }
          }
        }
      }

      // ============================================================================
      // CROSS INTERSECTION DETECTION
      // ============================================================================
      // Check if two walls' bodies cross each other (neither endpoint at intersection)
      // This happens when walls pass through each other mid-span
      // ============================================================================

      // Check if wall centerlines intersect
      // Find intersection point of centerlines
      const centerIntersect = lineIntersect(wall1.start, { x: geo1.dirX, y: geo1.dirY }, wall2.start, { x: geo2.dirX, y: geo2.dirY });

      if (centerIntersect) {
        // Check if intersection is within BOTH wall segments (not at endpoints)
        const t1 = ((centerIntersect.x - wall1.start.x) * geo1.dirX + (centerIntersect.y - wall1.start.y) * geo1.dirY) / (geo1.len);
        const t2 = ((centerIntersect.x - wall2.start.x) * geo2.dirX + (centerIntersect.y - wall2.start.y) * geo2.dirY) / (geo2.len);

        // Margin to exclude endpoints (avoid double-processing with T-junctions)
        const endpointMargin = 0.05;

        if (t1 > endpointMargin && t1 < (1 - endpointMargin) && t2 > endpointMargin && t2 < (1 - endpointMargin)) {
          // This is a TRUE cross intersection - both walls pass through each other
          if (DEBUG) console.log(`CROSS INTERSECTION: ${wall1.id?.slice(-4)} (t=${t1.toFixed(2)}) X ${wall2.id?.slice(-4)} (t=${t2.toFixed(2)}) at (${centerIntersect.x.toFixed(0)},${centerIntersect.y.toFixed(0)})`);

          // For cross intersections, we need to create gaps in BOTH walls' finish lines
          // Each wall gets gaps where the other wall passes through

          // For cross intersections: use FINISH lines to cut FINISH lines
          // This ensures gaps are at the actual crossing points of the finish lines
          const createCrossGaps = (hostWall, hostGeo, crossingGeo, hostTrims) => {
            const crossingDir = { x: crossingGeo.dirX, y: crossingGeo.dirY };
            const hostDir = { x: hostGeo.dirX, y: hostGeo.dirY };

            // Use the crossing wall's FINISH lines to define where to cut the host's finish lines
            const crossLeftFinish = crossingGeo.startLeftFinish || crossingGeo.startLeft;
            const crossRightFinish = crossingGeo.startRightFinish || crossingGeo.startRight;

            // Create gaps in host's left finish line
            if (hostGeo.startLeftFinish && crossLeftFinish && crossRightFinish) {
              const gapLeft = lineIntersect(crossLeftFinish, crossingDir, hostGeo.startLeftFinish, hostDir);
              const gapRight = lineIntersect(crossRightFinish, crossingDir, hostGeo.startLeftFinish, hostDir);

              if (gapLeft && gapRight) {
                const tLeft = (gapLeft.x - hostGeo.startLeftFinish.x) * hostGeo.dirX + (gapLeft.y - hostGeo.startLeftFinish.y) * hostGeo.dirY;
                const tRight = (gapRight.x - hostGeo.startLeftFinish.x) * hostGeo.dirX + (gapRight.y - hostGeo.startLeftFinish.y) * hostGeo.dirY;
                const gapStart = tLeft < tRight ? gapLeft : gapRight;
                const gapEnd = tLeft < tRight ? gapRight : gapLeft;
                hostTrims.leftFinishGaps.push({ start: gapStart, end: gapEnd });
                if (DEBUG) console.log(`  CROSS GAP in ${hostWall.id?.slice(-4)} LEFT finish: (${gapStart.x.toFixed(0)},${gapStart.y.toFixed(0)}) to (${gapEnd.x.toFixed(0)},${gapEnd.y.toFixed(0)})`);
              }
            }

            // Create gaps in host's right finish line
            if (hostGeo.startRightFinish && crossLeftFinish && crossRightFinish) {
              const gapLeft = lineIntersect(crossLeftFinish, crossingDir, hostGeo.startRightFinish, hostDir);
              const gapRight = lineIntersect(crossRightFinish, crossingDir, hostGeo.startRightFinish, hostDir);

              if (gapLeft && gapRight) {
                const tLeft = (gapLeft.x - hostGeo.startRightFinish.x) * hostGeo.dirX + (gapLeft.y - hostGeo.startRightFinish.y) * hostGeo.dirY;
                const tRight = (gapRight.x - hostGeo.startRightFinish.x) * hostGeo.dirX + (gapRight.y - hostGeo.startRightFinish.y) * hostGeo.dirY;
                const gapStart = tLeft < tRight ? gapLeft : gapRight;
                const gapEnd = tLeft < tRight ? gapRight : gapLeft;
                hostTrims.rightFinishGaps.push({ start: gapStart, end: gapEnd });
                if (DEBUG) console.log(`  CROSS GAP in ${hostWall.id?.slice(-4)} RIGHT finish: (${gapStart.x.toFixed(0)},${gapStart.y.toFixed(0)}) to (${gapEnd.x.toFixed(0)},${gapEnd.y.toFixed(0)})`);
              }
            }

            // Also create gaps in host's EDGE lines where crossing wall passes through
            const crossLeftEdge = crossingGeo.startLeft;
            const crossRightEdge = crossingGeo.startRight;

            // Create gaps in host's left edge line
            if (hostGeo.startLeft && crossLeftEdge && crossRightEdge) {
              const gapLeft = lineIntersect(crossLeftEdge, crossingDir, hostGeo.startLeft, hostDir);
              const gapRight = lineIntersect(crossRightEdge, crossingDir, hostGeo.startLeft, hostDir);

              if (gapLeft && gapRight) {
                const tLeft = (gapLeft.x - hostGeo.startLeft.x) * hostGeo.dirX + (gapLeft.y - hostGeo.startLeft.y) * hostGeo.dirY;
                const tRight = (gapRight.x - hostGeo.startLeft.x) * hostGeo.dirX + (gapRight.y - hostGeo.startLeft.y) * hostGeo.dirY;
                const gapStart = tLeft < tRight ? gapLeft : gapRight;
                const gapEnd = tLeft < tRight ? gapRight : gapLeft;
                hostTrims.leftEdgeGaps.push({ start: gapStart, end: gapEnd });
                if (DEBUG) console.log(`  CROSS GAP in ${hostWall.id?.slice(-4)} LEFT edge: (${gapStart.x.toFixed(0)},${gapStart.y.toFixed(0)}) to (${gapEnd.x.toFixed(0)},${gapEnd.y.toFixed(0)})`);
              }
            }

            // Create gaps in host's right edge line
            if (hostGeo.startRight && crossLeftEdge && crossRightEdge) {
              const gapLeft = lineIntersect(crossLeftEdge, crossingDir, hostGeo.startRight, hostDir);
              const gapRight = lineIntersect(crossRightEdge, crossingDir, hostGeo.startRight, hostDir);

              if (gapLeft && gapRight) {
                const tLeft = (gapLeft.x - hostGeo.startRight.x) * hostGeo.dirX + (gapLeft.y - hostGeo.startRight.y) * hostGeo.dirY;
                const tRight = (gapRight.x - hostGeo.startRight.x) * hostGeo.dirX + (gapRight.y - hostGeo.startRight.y) * hostGeo.dirY;
                const gapStart = tLeft < tRight ? gapLeft : gapRight;
                const gapEnd = tLeft < tRight ? gapRight : gapLeft;
                hostTrims.rightEdgeGaps.push({ start: gapStart, end: gapEnd });
                if (DEBUG) console.log(`  CROSS GAP in ${hostWall.id?.slice(-4)} RIGHT edge: (${gapStart.x.toFixed(0)},${gapStart.y.toFixed(0)}) to (${gapEnd.x.toFixed(0)},${gapEnd.y.toFixed(0)})`);
              }
            }
          };

          // Create gaps in both walls - call twice with swapped roles
          createCrossGaps(wall1, geo1, geo2, trims[wall1.id]);
          createCrossGaps(wall2, geo2, geo1, trims[wall2.id]);
        }
      }
    }
  }

  // Sort gaps by actual geometric position along each edge
  // The drawing goes from startLeft->endLeft and startRight->endRight
  // So we need to sort by distance from the start point
  Object.entries(trims).forEach(([wallId, trim]) => {
    const geo = trim.geo;
    if (!geo) return;

    // Sort left edge gaps by distance from startLeft
    trim.leftEdgeGaps.sort((a, b) => {
      const distA = Math.sqrt((a.start.x - geo.startLeft.x)**2 + (a.start.y - geo.startLeft.y)**2);
      const distB = Math.sqrt((b.start.x - geo.startLeft.x)**2 + (b.start.y - geo.startLeft.y)**2);
      return distA - distB;
    });

    // Sort right edge gaps by distance from startRight
    trim.rightEdgeGaps.sort((a, b) => {
      const distA = Math.sqrt((a.start.x - geo.startRight.x)**2 + (a.start.y - geo.startRight.y)**2);
      const distB = Math.sqrt((b.start.x - geo.startRight.x)**2 + (b.start.y - geo.startRight.y)**2);
      return distA - distB;
    });

    if (DEBUG && (trim.leftEdgeGaps.length > 0 || trim.rightEdgeGaps.length > 0)) {
      console.log(`SORTED GAPS for ${wallId.slice(-4)}:`);
      console.log(`  startLeft=(${geo.startLeft.x.toFixed(0)},${geo.startLeft.y.toFixed(0)}) endLeft=(${geo.endLeft.x.toFixed(0)},${geo.endLeft.y.toFixed(0)})`);
      trim.leftEdgeGaps.forEach((g, i) => {
        const dist = Math.sqrt((g.start.x - geo.startLeft.x)**2 + (g.start.y - geo.startLeft.y)**2);
        console.log(`  leftGap[${i}]: (${g.start.x.toFixed(0)},${g.start.y.toFixed(0)})-(${g.end.x.toFixed(0)},${g.end.y.toFixed(0)}) dist=${dist.toFixed(0)}`);
      });
      trim.rightEdgeGaps.forEach((g, i) => {
        const dist = Math.sqrt((g.start.x - geo.startRight.x)**2 + (g.start.y - geo.startRight.y)**2);
        console.log(`  rightGap[${i}]: (${g.start.x.toFixed(0)},${g.start.y.toFixed(0)})-(${g.end.x.toFixed(0)},${g.end.y.toFixed(0)}) dist=${dist.toFixed(0)}`);
      });
    }

    // Sort finish gaps similarly
    if (geo.startLeftFinish) {
      trim.leftFinishGaps.sort((a, b) => {
        const distA = Math.sqrt((a.start.x - geo.startLeftFinish.x)**2 + (a.start.y - geo.startLeftFinish.y)**2);
        const distB = Math.sqrt((b.start.x - geo.startLeftFinish.x)**2 + (b.start.y - geo.startLeftFinish.y)**2);
        return distA - distB;
      });
    }
    if (geo.startRightFinish) {
      trim.rightFinishGaps.sort((a, b) => {
        const distA = Math.sqrt((a.start.x - geo.startRightFinish.x)**2 + (a.start.y - geo.startRightFinish.y)**2);
        const distB = Math.sqrt((b.start.x - geo.startRightFinish.x)**2 + (b.start.y - geo.startRightFinish.y)**2);
        return distA - distB;
      });
    }

    if (DEBUG && (trim.leftFinishGaps.length > 0 || trim.rightFinishGaps.length > 0)) {
      console.log(`FINISH GAPS for ${wallId?.slice(-4)}: leftFinishGaps=${trim.leftFinishGaps.length} rightFinishGaps=${trim.rightFinishGaps.length}`);
      trim.leftFinishGaps.forEach((g, i) => {
        console.log(`  leftFinishGap[${i}]: (${g.start.x.toFixed(0)},${g.start.y.toFixed(0)})-(${g.end.x.toFixed(0)},${g.end.y.toFixed(0)})`);
      });
      trim.rightFinishGaps.forEach((g, i) => {
        console.log(`  rightFinishGap[${i}]: (${g.start.x.toFixed(0)},${g.start.y.toFixed(0)})-(${g.end.x.toFixed(0)},${g.end.y.toFixed(0)})`);
      });
    }
  });

  return trims;
}

/**
 * Draw architectural walls with pre-computed trim points
 * Uses two-pass rendering: fills first, then edges, to prevent overlap issues
 */
export function drawArchitecturalWalls(ctx, walls, trims, selectedItems = [], thinLines = false, layerColor = null) {
  if (!walls || walls.length === 0) return;

  // Line width multiplier for thin lines mode (like Revit's Thin Lines toggle)
  const lineScale = thinLines ? 0.5 : 1;

  // Pre-compute wall data for both passes
  const wallData = walls.map(wall => {
    const geo = trims[wall.id]?.geo || getWallGeometry(wall);
    if (!geo) return null;

    const isSelected = selectedItems.some(s => s.type === 'wall' && s.item?.id === wall.id);
    const trim = trims[wall.id] || { leftEdgeGaps: [], rightEdgeGaps: [] };

    // Get trimmed edge endpoints
    const startLeft = trim.startLeftTrim || geo.startLeft;
    const startRight = trim.startRightTrim || geo.startRight;
    const endLeft = trim.endLeftTrim || geo.endLeft;
    const endRight = trim.endRightTrim || geo.endRight;

    if (DEBUG && trim.endLeftFinishTrim) {
      console.log(`WALL DATA ${wall.id?.slice(-4)}: endLeftTrim=${trim.endLeftTrim ? `(${trim.endLeftTrim.x.toFixed(0)},${trim.endLeftTrim.y.toFixed(0)})` : 'null'} endLeftFinishTrim=(${trim.endLeftFinishTrim.x.toFixed(0)},${trim.endLeftFinishTrim.y.toFixed(0)}) endLeft=(${endLeft.x.toFixed(0)},${endLeft.y.toFixed(0)}) geo.endLeft=(${geo.endLeft.x.toFixed(0)},${geo.endLeft.y.toFixed(0)})`);
    }

    return { wall, geo, isSelected, trim, startLeft, startRight, endLeft, endRight };
  }).filter(Boolean);

  // PASS 1: Draw all wall fills first
  wallData.forEach(({ wall, startLeft, startRight, endLeft, endRight, trim }) => {
    if (DEBUG && (trim.startLeftTrim || trim.startRightTrim || trim.endLeftTrim || trim.endRightTrim)) {
      console.log(`DRAWING ${wall.id?.slice(-4)} with trims: startL=${trim.startLeftTrim ? 'yes' : 'no'} startR=${trim.startRightTrim ? 'yes' : 'no'} endL=${trim.endLeftTrim ? 'yes' : 'no'} endR=${trim.endRightTrim ? 'yes' : 'no'}`);
      console.log(`  fill: sL(${startLeft.x.toFixed(0)},${startLeft.y.toFixed(0)}) eL(${endLeft.x.toFixed(0)},${endLeft.y.toFixed(0)}) eR(${endRight.x.toFixed(0)},${endRight.y.toFixed(0)}) sR(${startRight.x.toFixed(0)},${startRight.y.toFixed(0)})`);
    }

    // Fill the wall polygon - use layer color if provided, otherwise white
    ctx.fillStyle = layerColor || '#ffffff';
    ctx.beginPath();
    ctx.moveTo(startLeft.x, startLeft.y);
    ctx.lineTo(endLeft.x, endLeft.y);
    ctx.lineTo(endRight.x, endRight.y);
    ctx.lineTo(startRight.x, startRight.y);
    ctx.closePath();
    ctx.fill();
  });

  // PASS 2: Draw all wall edges (on top of all fills)
  // Calculate outline color based on fill color brightness
  const getOutlineColor = (fillColor) => {
    if (!fillColor || fillColor === '#ffffff') return '#000000';
    // For colored walls, use a darker version of the same color for outline
    const hex = fillColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Darken by 40%
    const darken = (c) => Math.max(0, Math.floor(c * 0.6));
    return `rgb(${darken(r)}, ${darken(g)}, ${darken(b)})`;
  };
  const outlineColor = getOutlineColor(layerColor);

  wallData.forEach(({ wall, geo, isSelected, trim, startLeft, startRight, endLeft, endRight }) => {
    ctx.save();

    // Draw the edge lines
    ctx.strokeStyle = isSelected ? '#00ffaa' : outlineColor;
    ctx.lineWidth = (isSelected ? 2 : 1) * lineScale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (DEBUG && (trim.startLeftTrim || trim.endLeftTrim || trim.startRightTrim || trim.endRightTrim)) {
      console.log(`=== EDGE DRAW ${wall.id?.slice(-4)} ===`);
      console.log(`  LEFT: from (${startLeft.x.toFixed(0)},${startLeft.y.toFixed(0)}) to (${endLeft.x.toFixed(0)},${endLeft.y.toFixed(0)})`);
      console.log(`  RIGHT: from (${startRight.x.toFixed(0)},${startRight.y.toFixed(0)}) to (${endRight.x.toFixed(0)},${endRight.y.toFixed(0)})`);
      console.log(`  geo.startLeft=(${geo.startLeft.x.toFixed(0)},${geo.startLeft.y.toFixed(0)}) geo.endLeft=(${geo.endLeft.x.toFixed(0)},${geo.endLeft.y.toFixed(0)})`);
      console.log(`  geo.startRight=(${geo.startRight.x.toFixed(0)},${geo.startRight.y.toFixed(0)}) geo.endRight=(${geo.endRight.x.toFixed(0)},${geo.endRight.y.toFixed(0)})`);
      console.log(`  trim.startLeftTrim=${trim.startLeftTrim ? `(${trim.startLeftTrim.x.toFixed(0)},${trim.startLeftTrim.y.toFixed(0)})` : 'null'}`);
      console.log(`  trim.startRightTrim=${trim.startRightTrim ? `(${trim.startRightTrim.x.toFixed(0)},${trim.startRightTrim.y.toFixed(0)})` : 'null'}`);
      console.log(`  trim.endLeftTrim=${trim.endLeftTrim ? `(${trim.endLeftTrim.x.toFixed(0)},${trim.endLeftTrim.y.toFixed(0)})` : 'null'}`);
      console.log(`  trim.endRightTrim=${trim.endRightTrim ? `(${trim.endRightTrim.x.toFixed(0)},${trim.endRightTrim.y.toFixed(0)})` : 'null'}`);
    }

    // Draw left edge with gaps for T-intersections
    if (trim.leftEdgeGaps && trim.leftEdgeGaps.length > 0) {
      if (DEBUG) console.log(`DRAWING LEFT GAPS for ${wall.id?.slice(-4)}: ${trim.leftEdgeGaps.length} gaps`, trim.leftEdgeGaps);
      // Draw segments between gaps
      let currentStart = startLeft;
      for (const gap of trim.leftEdgeGaps) {
        // Draw from current start to gap start
        ctx.beginPath();
        ctx.moveTo(currentStart.x, currentStart.y);
        ctx.lineTo(gap.start.x, gap.start.y);
        ctx.stroke();
        // Move current start to gap end
        currentStart = gap.end;
      }
      // Draw from last gap end to end of edge
      ctx.beginPath();
      ctx.moveTo(currentStart.x, currentStart.y);
      ctx.lineTo(endLeft.x, endLeft.y);
      ctx.stroke();
    } else {
      // No gaps - draw full edge
      ctx.beginPath();
      ctx.moveTo(startLeft.x, startLeft.y);
      ctx.lineTo(endLeft.x, endLeft.y);
      ctx.stroke();
    }

    // Draw right edge with gaps for T-intersections
    if (trim.rightEdgeGaps && trim.rightEdgeGaps.length > 0) {
      if (DEBUG) console.log(`DRAWING RIGHT GAPS for ${wall.id?.slice(-4)}: ${trim.rightEdgeGaps.length} gaps`, trim.rightEdgeGaps);
      let currentStart = startRight;
      for (const gap of trim.rightEdgeGaps) {
        ctx.beginPath();
        ctx.moveTo(currentStart.x, currentStart.y);
        ctx.lineTo(gap.start.x, gap.start.y);
        ctx.stroke();
        currentStart = gap.end;
      }
      ctx.beginPath();
      ctx.moveTo(currentStart.x, currentStart.y);
      ctx.lineTo(endRight.x, endRight.y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(startRight.x, startRight.y);
      ctx.lineTo(endRight.x, endRight.y);
      ctx.stroke();
    }

    // End caps only if not trimmed and not T-connected
    const drawStartCap = !trim.startLeftTrim && !trim.startRightTrim && !trim.startHasT;
    const drawEndCap = !trim.endLeftTrim && !trim.endRightTrim && !trim.endHasT;

    if (DEBUG && (trim.startHasT || trim.endHasT)) {
      console.log(`WALL ${wall.id?.slice(-4)} T-flags: startHasT=${trim.startHasT}, endHasT=${trim.endHasT}, drawStartCap=${drawStartCap}, drawEndCap=${drawEndCap}`);
    }

    if (drawStartCap) {
      ctx.beginPath();
      ctx.moveTo(startLeft.x, startLeft.y);
      ctx.lineTo(startRight.x, startRight.y);
      ctx.stroke();
    }

    if (drawEndCap) {
      ctx.beginPath();
      ctx.moveTo(endLeft.x, endLeft.y);
      ctx.lineTo(endRight.x, endRight.y);
      ctx.stroke();
    }

    // DEBUG: Draw red circles at trim points to visualize where walls are being trimmed
    const DEBUG_TRIMS = false;
    if (DEBUG_TRIMS && (trim.endLeftTrim || trim.endRightTrim || trim.startLeftTrim || trim.startRightTrim)) {
      ctx.fillStyle = 'red';
      if (trim.endLeftTrim) {
        ctx.beginPath();
        ctx.arc(trim.endLeftTrim.x, trim.endLeftTrim.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (trim.endRightTrim) {
        ctx.beginPath();
        ctx.arc(trim.endRightTrim.x, trim.endRightTrim.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'blue';
      if (trim.startLeftTrim) {
        ctx.beginPath();
        ctx.arc(trim.startLeftTrim.x, trim.startLeftTrim.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (trim.startRightTrim) {
        ctx.beginPath();
        ctx.arc(trim.startRightTrim.x, trim.startRightTrim.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw finish lines (drywall/siding) if present
    // Use thinner lines for finish details
    ctx.lineWidth = (isSelected ? 1.5 : 0.75) * lineScale;

    // Debug: draw small circles at finish trim points
    const debugFinish = false;
    if (debugFinish) {
      ctx.fillStyle = 'red';
      if (trim.startLeftFinishTrim) {
        ctx.beginPath();
        ctx.arc(trim.startLeftFinishTrim.x, trim.startLeftFinishTrim.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (trim.endLeftFinishTrim) {
        ctx.beginPath();
        ctx.arc(trim.endLeftFinishTrim.x, trim.endLeftFinishTrim.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'blue';
      if (trim.startRightFinishTrim) {
        ctx.beginPath();
        ctx.arc(trim.startRightFinishTrim.x, trim.startRightFinishTrim.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (trim.endRightFinishTrim) {
        ctx.beginPath();
        ctx.arc(trim.endRightFinishTrim.x, trim.endRightFinishTrim.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Left finish line (interior drywall or exterior siding)
    if (geo.startLeftFinish && geo.endLeftFinish) {
      const startLeftFinish = trim.startLeftFinishTrim || geo.startLeftFinish;
      const endLeftFinish = trim.endLeftFinishTrim || geo.endLeftFinish;

      if (trim.leftFinishGaps && trim.leftFinishGaps.length > 0) {
        if (DEBUG) console.log(`DRAWING LEFT FINISH with ${trim.leftFinishGaps.length} gaps for ${wall.id?.slice(-4)}`);
        let currentStart = startLeftFinish;
        for (const gap of trim.leftFinishGaps) {
          if (DEBUG) console.log(`  gap: draw (${currentStart.x.toFixed(0)},${currentStart.y.toFixed(0)}) to (${gap.start.x.toFixed(0)},${gap.start.y.toFixed(0)}), skip to (${gap.end.x.toFixed(0)},${gap.end.y.toFixed(0)})`);
          ctx.beginPath();
          ctx.moveTo(currentStart.x, currentStart.y);
          ctx.lineTo(gap.start.x, gap.start.y);
          ctx.stroke();
          currentStart = gap.end;
        }
        ctx.beginPath();
        ctx.moveTo(currentStart.x, currentStart.y);
        ctx.lineTo(endLeftFinish.x, endLeftFinish.y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(startLeftFinish.x, startLeftFinish.y);
        ctx.lineTo(endLeftFinish.x, endLeftFinish.y);
        ctx.stroke();
      }

      // Draw finish end caps at untrimmed ends (connect finish to outer edge)
      if (!trim.startLeftFinishTrim && !trim.startHasT) {
        ctx.beginPath();
        ctx.moveTo(geo.startLeft.x, geo.startLeft.y);
        ctx.lineTo(geo.startLeftFinish.x, geo.startLeftFinish.y);
        ctx.stroke();
      }
      if (!trim.endLeftFinishTrim && !trim.endHasT) {
        ctx.beginPath();
        ctx.moveTo(geo.endLeft.x, geo.endLeft.y);
        ctx.lineTo(geo.endLeftFinish.x, geo.endLeftFinish.y);
        ctx.stroke();
      }

      // T-junction connectors removed - finish lines now intersect directly with host finish lines
    }

    // Right finish line (interior drywall)
    if (geo.startRightFinish && geo.endRightFinish) {
      const startRightFinish = trim.startRightFinishTrim || geo.startRightFinish;
      const endRightFinish = trim.endRightFinishTrim || geo.endRightFinish;

      if (trim.rightFinishGaps && trim.rightFinishGaps.length > 0) {
        if (DEBUG) console.log(`DRAWING RIGHT FINISH with ${trim.rightFinishGaps.length} gaps for ${wall.id?.slice(-4)}`);
        let currentStart = startRightFinish;
        for (const gap of trim.rightFinishGaps) {
          if (DEBUG) console.log(`  gap: draw (${currentStart.x.toFixed(0)},${currentStart.y.toFixed(0)}) to (${gap.start.x.toFixed(0)},${gap.start.y.toFixed(0)}), skip to (${gap.end.x.toFixed(0)},${gap.end.y.toFixed(0)})`);
          ctx.beginPath();
          ctx.moveTo(currentStart.x, currentStart.y);
          ctx.lineTo(gap.start.x, gap.start.y);
          ctx.stroke();
          currentStart = gap.end;
        }
        ctx.beginPath();
        ctx.moveTo(currentStart.x, currentStart.y);
        ctx.lineTo(endRightFinish.x, endRightFinish.y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(startRightFinish.x, startRightFinish.y);
        ctx.lineTo(endRightFinish.x, endRightFinish.y);
        ctx.stroke();
      }

      // Draw finish end caps at untrimmed ends (connect finish to outer edge)
      if (!trim.startRightFinishTrim && !trim.startHasT) {
        ctx.beginPath();
        ctx.moveTo(geo.startRight.x, geo.startRight.y);
        ctx.lineTo(geo.startRightFinish.x, geo.startRightFinish.y);
        ctx.stroke();
      }
      if (!trim.endRightFinishTrim && !trim.endHasT) {
        ctx.beginPath();
        ctx.moveTo(geo.endRight.x, geo.endRight.y);
        ctx.lineTo(geo.endRightFinish.x, geo.endRightFinish.y);
        ctx.stroke();
      }

      // Draw interior T-junction connectors (short lines closing off the gap)
      if (trim.interiorTConnectors && trim.interiorTConnectors.length > 0) {
        for (const connector of trim.interiorTConnectors) {
          ctx.beginPath();
          ctx.moveTo(connector.from.x, connector.from.y);
          ctx.lineTo(connector.to.x, connector.to.y);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  });
}

// Keep the old function for backward compatibility
export function drawWallCorners(ctx, walls, selectedItems = []) {
  // No longer needed
}

/**
 * Draw standard walls with pre-computed trim points and colored layers
 */
export function drawStandardWalls(ctx, walls, trims, selectedItems = [], thinLines = false, layerColor = null) {
  if (!walls || walls.length === 0) return;

  const lineScale = thinLines ? 0.5 : 1;

  walls.forEach(wall => {
    const geo = trims[wall.id]?.geo || getWallGeometry(wall);
    if (!geo) return;

    const isSelected = selectedItems.some(s => s.type === 'wall' && s.item?.id === wall.id);
    const trim = trims[wall.id] || { leftEdgeGaps: [], rightEdgeGaps: [] };

    // Get wall config for layers
    const wallConfig = WALL_LAYERS[wall.type] || WALL_LAYERS['interior'];
    const thicknessInches = WALL_THICKNESS_OPTIONS[wall.type]?.thickness || 8;
    const thickness = inchesToPixels(thicknessInches);
    const totalLayerThickness = wallConfig.layers.reduce((sum, l) => sum + l.thickness, 0);
    const scaleFactor = thickness / totalLayerThickness;

    // Get trimmed edge endpoints for L-corner mitering
    const startLeft = trim.startLeftTrim || geo.startLeft;
    const startRight = trim.startRightTrim || geo.startRight;
    const endLeft = trim.endLeftTrim || geo.endLeft;
    const endRight = trim.endRightTrim || geo.endRight;

    ctx.save();

    // Build the wall polygon path for clipping using trimmed corners
    ctx.beginPath();
    ctx.moveTo(startLeft.x, startLeft.y);
    ctx.lineTo(endLeft.x, endLeft.y);
    ctx.lineTo(endRight.x, endRight.y);
    ctx.lineTo(startRight.x, startRight.y);
    ctx.closePath();
    ctx.clip();

    // Calculate wall direction and perpendicular
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const wallLength = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Draw in wall-local coordinates
    ctx.translate(wall.start.x, wall.start.y);
    ctx.rotate(angle);

    // If wall is flipped, reverse the layer order
    const layersToRender = wall.flipped ? [...wallConfig.layers].reverse() : wallConfig.layers;

    // Draw each layer as a colored band
    let yOffset = -thickness / 2;
    layersToRender.forEach(layer => {
      const layerThickness = layer.thickness * scaleFactor;
      ctx.fillStyle = isSelected ? adjustColor(layer.color, 30) : layer.color;
      ctx.fillRect(-50, yOffset, wallLength + 100, layerThickness); // Extend past ends (clipping will trim)
      yOffset += layerThickness;
    });

    // Draw layer separators
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 0.5 * lineScale;
    yOffset = -thickness / 2;
    layersToRender.forEach((layer, i) => {
      if (i > 0) {
        ctx.beginPath();
        ctx.moveTo(-50, yOffset);
        ctx.lineTo(wallLength + 100, yOffset);
        ctx.stroke();
      }
      yOffset += layer.thickness * scaleFactor;
    });

    ctx.restore();

    // Now draw the outline edges (outside of clip)
    ctx.save();
    ctx.strokeStyle = isSelected ? '#00ffaa' : '#555555';
    ctx.lineWidth = (isSelected ? 2 : 1) * lineScale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw left edge with gaps for T-intersections
    if (trim.leftEdgeGaps && trim.leftEdgeGaps.length > 0) {
      let currentStart = startLeft;
      for (const gap of trim.leftEdgeGaps) {
        ctx.beginPath();
        ctx.moveTo(currentStart.x, currentStart.y);
        ctx.lineTo(gap.start.x, gap.start.y);
        ctx.stroke();
        currentStart = gap.end;
      }
      ctx.beginPath();
      ctx.moveTo(currentStart.x, currentStart.y);
      ctx.lineTo(endLeft.x, endLeft.y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(startLeft.x, startLeft.y);
      ctx.lineTo(endLeft.x, endLeft.y);
      ctx.stroke();
    }

    // Draw right edge with gaps for T-intersections
    if (trim.rightEdgeGaps && trim.rightEdgeGaps.length > 0) {
      let currentStart = startRight;
      for (const gap of trim.rightEdgeGaps) {
        ctx.beginPath();
        ctx.moveTo(currentStart.x, currentStart.y);
        ctx.lineTo(gap.start.x, gap.start.y);
        ctx.stroke();
        currentStart = gap.end;
      }
      ctx.beginPath();
      ctx.moveTo(currentStart.x, currentStart.y);
      ctx.lineTo(endRight.x, endRight.y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(startRight.x, startRight.y);
      ctx.lineTo(endRight.x, endRight.y);
      ctx.stroke();
    }

    // End caps only if not trimmed (L-corner) and not T-connected
    const drawStartCap = !trim.startLeftTrim && !trim.startRightTrim && !trim.startHasT;
    const drawEndCap = !trim.endLeftTrim && !trim.endRightTrim && !trim.endHasT;

    if (drawStartCap) {
      ctx.beginPath();
      ctx.moveTo(startLeft.x, startLeft.y);
      ctx.lineTo(startRight.x, startRight.y);
      ctx.stroke();
    }

    if (drawEndCap) {
      ctx.beginPath();
      ctx.moveTo(endLeft.x, endLeft.y);
      ctx.lineTo(endRight.x, endRight.y);
      ctx.stroke();
    }

    ctx.restore();
  });
}

/**
 * Draw detailed walls with pre-computed trim points, colored layers, patterns, and studs
 */
export function drawDetailedWalls(ctx, walls, trims, selectedItems = [], thinLines = false, layerColor = null) {
  if (!walls || walls.length === 0) return;

  const lineScale = thinLines ? 0.5 : 1;

  walls.forEach(wall => {
    const geo = trims[wall.id]?.geo || getWallGeometry(wall);
    if (!geo) return;

    const isSelected = selectedItems.some(s => s.type === 'wall' && s.item?.id === wall.id);
    const trim = trims[wall.id] || { leftEdgeGaps: [], rightEdgeGaps: [] };

    // Get wall config for layers
    const wallConfig = WALL_LAYERS[wall.type] || WALL_LAYERS['interior'];
    const thicknessInches = WALL_THICKNESS_OPTIONS[wall.type]?.thickness || 8;
    const thickness = inchesToPixels(thicknessInches);
    const totalLayerThickness = wallConfig.layers.reduce((sum, l) => sum + l.thickness, 0);
    const scaleFactor = thickness / totalLayerThickness;

    // Get trimmed edge endpoints for L-corner mitering
    const startLeft = trim.startLeftTrim || geo.startLeft;
    const startRight = trim.startRightTrim || geo.startRight;
    const endLeft = trim.endLeftTrim || geo.endLeft;
    const endRight = trim.endRightTrim || geo.endRight;

    ctx.save();

    // Build the wall polygon path for clipping using trimmed corners
    ctx.beginPath();
    ctx.moveTo(startLeft.x, startLeft.y);
    ctx.lineTo(endLeft.x, endLeft.y);
    ctx.lineTo(endRight.x, endRight.y);
    ctx.lineTo(startRight.x, startRight.y);
    ctx.closePath();
    ctx.clip();

    // Calculate wall direction and perpendicular
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const wallLength = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Calculate pattern offset based on wall's global position
    const patternOffset = (wall.start.x + wall.start.y) % 48;

    // Draw in wall-local coordinates
    ctx.translate(wall.start.x, wall.start.y);
    ctx.rotate(angle);

    // If wall is flipped, reverse the layer order
    const layersToRender = wall.flipped ? [...wallConfig.layers].reverse() : wallConfig.layers;

    // Draw each layer with patterns
    let yOffset = -thickness / 2;
    layersToRender.forEach(layer => {
      const layerThickness = layer.thickness * scaleFactor;

      ctx.save();
      ctx.translate(0, yOffset);

      // Base fill
      ctx.fillStyle = isSelected ? adjustColor(layer.color, 20) : layer.color;
      ctx.fillRect(-50, 0, wallLength + 100, layerThickness); // Extend past ends (clipping will trim)

      // Draw pattern based on layer type
      if (layer.pattern === 'siding') {
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 0.5;
        const lineSpacing = Math.max(1.5, layerThickness / 4);
        for (let y = lineSpacing; y < layerThickness; y += lineSpacing) {
          ctx.beginPath();
          ctx.moveTo(-50, y);
          ctx.lineTo(wallLength + 100, y);
          ctx.stroke();
        }
      } else if (layer.pattern === 'plywood') {
        ctx.strokeStyle = 'rgba(139,90,43,0.3)';
        ctx.lineWidth = 0.5;
        const plywoodSpacing = 24;
        const startX = -((patternOffset) % plywoodSpacing);
        for (let x = startX; x < wallLength + 100; x += plywoodSpacing) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, layerThickness);
          ctx.stroke();
        }
      } else if (layer.pattern === 'insulation') {
        ctx.strokeStyle = 'rgba(255,150,180,0.4)';
        ctx.lineWidth = 1;
        const waveHeight = layerThickness * 0.3;
        const waveSpacing = 8;
        const startX = -((patternOffset) % waveSpacing);
        for (let x = startX; x < wallLength + 100; x += waveSpacing) {
          ctx.beginPath();
          ctx.moveTo(x, layerThickness / 2 - waveHeight);
          ctx.quadraticCurveTo(x + 4, layerThickness / 2 + waveHeight, x + waveSpacing, layerThickness / 2 - waveHeight);
          ctx.stroke();
        }
      } else if (layer.pattern === 'cavity') {
        ctx.fillStyle = isSelected ? '#3a3a3a' : '#1a1a1a';
        ctx.fillRect(-50, 0, wallLength + 100, layerThickness);
      }

      ctx.restore();
      yOffset += layerThickness;
    });

    // Draw studs in detailed mode
    if (wallConfig.studs) {
      // Stud spacing is in inches, convert to pixels (GRID_SIZE pixels = 6 inches)
      const studSpacing = wallConfig.studs.spacing * (GRID_SIZE / 6);
      // Stud width (1.5" for 2x4/2x6) converted to pixels
      const studWidth = wallConfig.studs.width * (GRID_SIZE / 6);
      const studDepth = wallConfig.studs.depth * scaleFactor;

      // Find the cavity layer position
      let cavityStart = -thickness / 2;
      let cavityThickness = 0;
      wallConfig.layers.forEach(layer => {
        const layerThick = layer.thickness * scaleFactor;
        if (layer.pattern === 'cavity' || layer.pattern === 'insulation') {
          cavityThickness = layerThick;
        } else if (cavityThickness === 0) {
          cavityStart += layerThick;
        }
      });

      // Draw studs
      ctx.fillStyle = isSelected ? '#E8C888' : wallConfig.studs.color;
      const studStartOffset = (patternOffset % studSpacing);

      // End stud at start
      ctx.fillRect(-50, cavityStart, studWidth + 50, cavityThickness);

      // Interior studs
      const firstStudX = studSpacing - studStartOffset;
      for (let x = firstStudX; x < wallLength + 50; x += studSpacing) {
        ctx.fillRect(x - studWidth / 2, cavityStart, studWidth, cavityThickness);
      }

      // End stud at end
      ctx.fillRect(wallLength - studWidth, cavityStart, studWidth + 50, cavityThickness);
    }

    // Draw layer separators
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 0.5 * lineScale;
    yOffset = -thickness / 2;
    layersToRender.forEach((layer, i) => {
      if (i > 0) {
        ctx.beginPath();
        ctx.moveTo(-50, yOffset);
        ctx.lineTo(wallLength + 100, yOffset);
        ctx.stroke();
      }
      yOffset += layer.thickness * scaleFactor;
    });

    ctx.restore();

    // Now draw the outline edges (outside of clip)
    ctx.save();
    ctx.strokeStyle = isSelected ? '#00ffaa' : '#555555';
    ctx.lineWidth = (isSelected ? 2 : 1.5) * lineScale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw left edge with gaps for T-intersections
    if (trim.leftEdgeGaps && trim.leftEdgeGaps.length > 0) {
      let currentStart = startLeft;
      for (const gap of trim.leftEdgeGaps) {
        ctx.beginPath();
        ctx.moveTo(currentStart.x, currentStart.y);
        ctx.lineTo(gap.start.x, gap.start.y);
        ctx.stroke();
        currentStart = gap.end;
      }
      ctx.beginPath();
      ctx.moveTo(currentStart.x, currentStart.y);
      ctx.lineTo(endLeft.x, endLeft.y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(startLeft.x, startLeft.y);
      ctx.lineTo(endLeft.x, endLeft.y);
      ctx.stroke();
    }

    // Draw right edge with gaps for T-intersections
    if (trim.rightEdgeGaps && trim.rightEdgeGaps.length > 0) {
      let currentStart = startRight;
      for (const gap of trim.rightEdgeGaps) {
        ctx.beginPath();
        ctx.moveTo(currentStart.x, currentStart.y);
        ctx.lineTo(gap.start.x, gap.start.y);
        ctx.stroke();
        currentStart = gap.end;
      }
      ctx.beginPath();
      ctx.moveTo(currentStart.x, currentStart.y);
      ctx.lineTo(endRight.x, endRight.y);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(startRight.x, startRight.y);
      ctx.lineTo(endRight.x, endRight.y);
      ctx.stroke();
    }

    // End caps only if not trimmed (L-corner) and not T-connected
    const drawStartCap = !trim.startLeftTrim && !trim.startRightTrim && !trim.startHasT;
    const drawEndCap = !trim.endLeftTrim && !trim.endRightTrim && !trim.endHasT;

    if (drawStartCap) {
      ctx.beginPath();
      ctx.moveTo(startLeft.x, startLeft.y);
      ctx.lineTo(startRight.x, startRight.y);
      ctx.stroke();
    }

    if (drawEndCap) {
      ctx.beginPath();
      ctx.moveTo(endLeft.x, endLeft.y);
      ctx.lineTo(endRight.x, endRight.y);
      ctx.stroke();
    }

    ctx.restore();
  });
}
