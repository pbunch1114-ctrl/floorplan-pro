/**
 * Corner Renderer - Pre-computes wall edge trim points for clean mitered corners
 * Handles L-corners (two endpoints meeting) and T-intersections (endpoint meets wall body)
 * Also handles interior finish lines (drywall) and exterior finish (siding)
 */

import { WALL_THICKNESS_OPTIONS, WALL_LAYERS } from '../../../constants/walls';
import { GRID_SIZE } from '../../../constants/grid';

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
const pointsClose = (p1, p2, tolerance = 25) => dist(p1, p2) < tolerance;

// Check if a point is on a line segment (not at endpoints)
// Returns the t parameter (0-1) if on segment, or null if not
const pointOnSegmentT = (pt, segStart, segEnd, tolerance = 5) => {
  const segLen = dist(segStart, segEnd);
  if (segLen === 0) return null;

  const dx = pt.x - segStart.x;
  const dy = pt.y - segStart.y;
  const segDx = segEnd.x - segStart.x;
  const segDy = segEnd.y - segStart.y;

  // Project pt onto segment line
  const t = (dx * segDx + dy * segDy) / (segLen * segLen);

  // Must be within segment (not at endpoints)
  if (t < 0.05 || t > 0.95) return null;

  // Find closest point on segment
  const closestX = segStart.x + t * segDx;
  const closestY = segStart.y + t * segDy;

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
  if (actualLeftFinish !== null) {
    geo.startLeftFinish = { x: wall.start.x + perpX * (-actualLeftFinish), y: wall.start.y + perpY * (-actualLeftFinish) };
    geo.endLeftFinish = { x: wall.end.x + perpX * (-actualLeftFinish), y: wall.end.y + perpY * (-actualLeftFinish) };
    geo.leftFinishOffset = -actualLeftFinish;
  }
  if (actualRightFinish !== null) {
    geo.startRightFinish = { x: wall.start.x + perpX * (-actualRightFinish), y: wall.start.y + perpY * (-actualRightFinish) };
    geo.endRightFinish = { x: wall.end.x + perpX * (-actualRightFinish), y: wall.end.y + perpY * (-actualRightFinish) };
    geo.rightFinishOffset = -actualRightFinish;
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
        const maxDist = Math.max(geo1.halfThick, geo2.halfThick) * 5;
        const isReasonable = (pt) => pt && dist(pt, check.pt1) < maxDist;

        // For an L-corner miter:
        // - The INSIDE corner is where the walls overlap - use LL or RR
        // - The OUTSIDE corner is where the walls don't overlap - use LR or RL
        // Which is which depends on the turning direction (cross product sign)
        //
        // If cross > 0: wall2 turns LEFT (CCW) from wall1
        //   - INSIDE corner: wall1's RIGHT meets wall2's RIGHT (RR)
        //   - OUTSIDE corner: wall1's LEFT meets wall2's LEFT (LL)
        // If cross < 0: wall2 turns RIGHT (CW) from wall1
        //   - INSIDE corner: wall1's LEFT meets wall2's LEFT (LL)
        //   - OUTSIDE corner: wall1's RIGHT meets wall2's RIGHT (RR)

        if (cross > 0.001) {
          // CCW turn: inside=RR, outside=LL
          if (isReasonable(intRR)) {
            trims[wall1.id][`${trim1Key}RightTrim`] = intRR;
            trims[wall2.id][`${trim2Key}RightTrim`] = intRR;
          }
          if (isReasonable(intLL)) {
            trims[wall1.id][`${trim1Key}LeftTrim`] = intLL;
            trims[wall2.id][`${trim2Key}LeftTrim`] = intLL;
          }
        } else if (cross < -0.001) {
          // CW turn: inside=LL, outside=RR
          if (isReasonable(intLL)) {
            trims[wall1.id][`${trim1Key}LeftTrim`] = intLL;
            trims[wall2.id][`${trim2Key}LeftTrim`] = intLL;
          }
          if (isReasonable(intRR)) {
            trims[wall1.id][`${trim1Key}RightTrim`] = intRR;
            trims[wall2.id][`${trim2Key}RightTrim`] = intRR;
          }
        }
        // If cross is near zero, walls are parallel/collinear - no miter needed

        // Also compute finish line trims for L-corners using same cross-product approach
        const w1LeftFinish = check.w1End === 'start' ? geo1.startLeftFinish : geo1.endLeftFinish;
        const w1RightFinish = check.w1End === 'start' ? geo1.startRightFinish : geo1.endRightFinish;
        const w2LeftFinish = check.w2End === 'start' ? geo2.startLeftFinish : geo2.endLeftFinish;
        const w2RightFinish = check.w2End === 'start' ? geo2.startRightFinish : geo2.endRightFinish;

        // Compute finish intersections
        const intFinishLL = (w1LeftFinish && w2LeftFinish) ? lineIntersect(w1LeftFinish, d1, w2LeftFinish, d2) : null;
        const intFinishRR = (w1RightFinish && w2RightFinish) ? lineIntersect(w1RightFinish, d1, w2RightFinish, d2) : null;

        // Apply same cross-product logic to finish lines
        if (cross > 0.001) {
          // CCW turn
          if (intFinishRR && isReasonable(intFinishRR)) {
            trims[wall1.id][`${trim1Key}RightFinishTrim`] = intFinishRR;
            trims[wall2.id][`${trim2Key}RightFinishTrim`] = intFinishRR;
          }
          if (intFinishLL && isReasonable(intFinishLL)) {
            trims[wall1.id][`${trim1Key}LeftFinishTrim`] = intFinishLL;
            trims[wall2.id][`${trim2Key}LeftFinishTrim`] = intFinishLL;
          }
        } else if (cross < -0.001) {
          // CW turn
          if (intFinishLL && isReasonable(intFinishLL)) {
            trims[wall1.id][`${trim1Key}LeftFinishTrim`] = intFinishLL;
            trims[wall2.id][`${trim2Key}LeftFinishTrim`] = intFinishLL;
          }
          if (intFinishRR && isReasonable(intFinishRR)) {
            trims[wall1.id][`${trim1Key}RightFinishTrim`] = intFinishRR;
            trims[wall2.id][`${trim2Key}RightFinishTrim`] = intFinishRR;
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
        const t = pointOnSegmentT(incomingPt, tCheck.host.start, tCheck.host.end);

        if (t === null) continue;

        // Found a T-intersection!
        // The host wall needs a gap in its near edge where the incoming wall meets
        // The incoming wall keeps its natural endpoints (no extension needed)

        const hostGeo = tCheck.hostGeo;
        const incomingGeo = tCheck.incomingGeo;

        // Determine which edge of the host wall is "near" to the incoming wall
        // Use the center of the incoming wall (away from junction) to determine approach direction
        const incomingCenter = tCheck.incomingEnd === 'start'
          ? tCheck.incoming.end  // if start is at junction, the wall extends toward end
          : tCheck.incoming.start; // if end is at junction, the wall extends toward start

        // Vector from junction point to incoming wall center
        const toIncoming = {
          x: incomingCenter.x - incomingPt.x,
          y: incomingCenter.y - incomingPt.y,
        };

        // Dot product with host's perpendicular tells us which side the incoming wall is on
        const side = toIncoming.x * hostGeo.perpX + toIncoming.y * hostGeo.perpY;

        // Calculate gap positions along the host wall
        const incomingHalfThick = incomingGeo.halfThick;
        const hostLen = hostGeo.len;

        // Convert incoming wall thickness to a t-range on the host wall
        const tGapHalf = incomingHalfThick / hostLen;
        const tGapStart = Math.max(0, t - tGapHalf);
        const tGapEnd = Math.min(1, t + tGapHalf);

        // The incoming wall is on one side of the host wall
        // Gap goes in the edge facing the incoming wall
        // Incoming wall edges need to extend to meet that edge

        const trimKey = tCheck.incomingEnd === 'start' ? 'start' : 'end';

        // Get the incoming wall's edge endpoints at the junction
        const incomingLeft = tCheck.incomingEnd === 'start' ? incomingGeo.startLeft : incomingGeo.endLeft;
        const incomingRight = tCheck.incomingEnd === 'start' ? incomingGeo.startRight : incomingGeo.endRight;

        // Direction the incoming wall is traveling (toward host)
        const incomingDirToHost = tCheck.incomingEnd === 'start'
          ? { x: -incomingGeo.dirX, y: -incomingGeo.dirY }
          : { x: incomingGeo.dirX, y: incomingGeo.dirY };

        if (side > 0) {
          // Incoming wall body is on the "left" side (positive perp direction)
          // So it approaches from the left - gap goes in LEFT edge of host
          const gapStart = {
            x: hostGeo.startLeft.x + (hostGeo.endLeft.x - hostGeo.startLeft.x) * tGapStart,
            y: hostGeo.startLeft.y + (hostGeo.endLeft.y - hostGeo.startLeft.y) * tGapStart,
          };
          const gapEnd = {
            x: hostGeo.startLeft.x + (hostGeo.endLeft.x - hostGeo.startLeft.x) * tGapEnd,
            y: hostGeo.startLeft.y + (hostGeo.endLeft.y - hostGeo.startLeft.y) * tGapEnd,
          };
          trims[tCheck.host.id].leftEdgeGaps.push({ start: gapStart, end: gapEnd, t: t, tStart: tGapStart, tEnd: tGapEnd });

          // Find where incoming wall's edges intersect host's left edge line
          const hostEdgeDir = { x: hostGeo.dirX, y: hostGeo.dirY };
          const leftTrim = lineIntersect(incomingLeft, incomingDirToHost, hostGeo.startLeft, hostEdgeDir);
          const rightTrim = lineIntersect(incomingRight, incomingDirToHost, hostGeo.startLeft, hostEdgeDir);

          if (leftTrim) trims[tCheck.incoming.id][`${trimKey}LeftTrim`] = leftTrim;
          if (rightTrim) trims[tCheck.incoming.id][`${trimKey}RightTrim`] = rightTrim;
        } else {
          // Incoming wall body is on the "right" side (negative perp direction)
          // So it approaches from the right - gap goes in RIGHT edge of host
          const gapStart = {
            x: hostGeo.startRight.x + (hostGeo.endRight.x - hostGeo.startRight.x) * tGapStart,
            y: hostGeo.startRight.y + (hostGeo.endRight.y - hostGeo.startRight.y) * tGapStart,
          };
          const gapEnd = {
            x: hostGeo.startRight.x + (hostGeo.endRight.x - hostGeo.startRight.x) * tGapEnd,
            y: hostGeo.startRight.y + (hostGeo.endRight.y - hostGeo.startRight.y) * tGapEnd,
          };
          trims[tCheck.host.id].rightEdgeGaps.push({ start: gapStart, end: gapEnd, t: t, tStart: tGapStart, tEnd: tGapEnd });

          // Find where incoming wall's edges intersect host's right edge line
          const hostEdgeDir = { x: hostGeo.dirX, y: hostGeo.dirY };
          const leftTrim = lineIntersect(incomingLeft, incomingDirToHost, hostGeo.startRight, hostEdgeDir);
          const rightTrim = lineIntersect(incomingRight, incomingDirToHost, hostGeo.startRight, hostEdgeDir);

          if (leftTrim) trims[tCheck.incoming.id][`${trimKey}LeftTrim`] = leftTrim;
          if (rightTrim) trims[tCheck.incoming.id][`${trimKey}RightTrim`] = rightTrim;
        }

        // Mark the incoming wall's end so we don't draw an end cap there
        trims[tCheck.incoming.id][`${trimKey}HasT`] = true;

        // Also handle finish line gaps and trims for T-intersections
        // Incoming wall's finish lines need to be trimmed at the host wall's finish line
        // And the gap in the host's finish line should match exactly where the incoming finish lines hit
        const incomingLeftFinish = tCheck.incomingEnd === 'start' ? incomingGeo.startLeftFinish : incomingGeo.endLeftFinish;
        const incomingRightFinish = tCheck.incomingEnd === 'start' ? incomingGeo.startRightFinish : incomingGeo.endRightFinish;

        const hostEdgeDir = { x: hostGeo.dirX, y: hostGeo.dirY };

        if (side > 0) {
          // Incoming approaches from left - trim to host's left finish line
          const hostFinishPt = hostGeo.startLeftFinish || hostGeo.startLeft;
          let leftFinishTrim = null;
          let rightFinishTrim = null;

          if (incomingLeftFinish) {
            leftFinishTrim = lineIntersect(incomingLeftFinish, incomingDirToHost, hostFinishPt, hostEdgeDir);
            if (leftFinishTrim) trims[tCheck.incoming.id][`${trimKey}LeftFinishTrim`] = leftFinishTrim;
          }
          if (incomingRightFinish) {
            rightFinishTrim = lineIntersect(incomingRightFinish, incomingDirToHost, hostFinishPt, hostEdgeDir);
            if (rightFinishTrim) trims[tCheck.incoming.id][`${trimKey}RightFinishTrim`] = rightFinishTrim;
          }

          // Finish line gap should be exactly where the incoming finish lines hit the host finish line
          // Order the gap start/end along the host wall direction
          if (hostGeo.startLeftFinish && hostGeo.endLeftFinish && leftFinishTrim && rightFinishTrim) {
            // Project both points onto the host wall direction to determine order
            const tLeft = (leftFinishTrim.x - hostGeo.startLeftFinish.x) * hostGeo.dirX +
                          (leftFinishTrim.y - hostGeo.startLeftFinish.y) * hostGeo.dirY;
            const tRight = (rightFinishTrim.x - hostGeo.startLeftFinish.x) * hostGeo.dirX +
                           (rightFinishTrim.y - hostGeo.startLeftFinish.y) * hostGeo.dirY;

            const gapStart = tLeft < tRight ? leftFinishTrim : rightFinishTrim;
            const gapEnd = tLeft < tRight ? rightFinishTrim : leftFinishTrim;

            trims[tCheck.host.id].leftFinishGaps.push({
              start: gapStart,
              end: gapEnd,
              t: t,
              tStart: tGapStart,
              tEnd: tGapEnd
            });
          }
        } else {
          // Incoming approaches from right - trim to host's right finish line
          const hostFinishPt = hostGeo.startRightFinish || hostGeo.startRight;
          let leftFinishTrim = null;
          let rightFinishTrim = null;

          if (incomingLeftFinish) {
            leftFinishTrim = lineIntersect(incomingLeftFinish, incomingDirToHost, hostFinishPt, hostEdgeDir);
            if (leftFinishTrim) trims[tCheck.incoming.id][`${trimKey}LeftFinishTrim`] = leftFinishTrim;
          }
          if (incomingRightFinish) {
            rightFinishTrim = lineIntersect(incomingRightFinish, incomingDirToHost, hostFinishPt, hostEdgeDir);
            if (rightFinishTrim) trims[tCheck.incoming.id][`${trimKey}RightFinishTrim`] = rightFinishTrim;
          }

          // Finish line gap should be exactly where the incoming finish lines hit the host finish line
          // Order the gap start/end along the host wall direction
          if (hostGeo.startRightFinish && hostGeo.endRightFinish && leftFinishTrim && rightFinishTrim) {
            // Project both points onto the host wall direction to determine order
            const tLeft = (leftFinishTrim.x - hostGeo.startRightFinish.x) * hostGeo.dirX +
                          (leftFinishTrim.y - hostGeo.startRightFinish.y) * hostGeo.dirY;
            const tRight = (rightFinishTrim.x - hostGeo.startRightFinish.x) * hostGeo.dirX +
                           (rightFinishTrim.y - hostGeo.startRightFinish.y) * hostGeo.dirY;

            const gapStart = tLeft < tRight ? leftFinishTrim : rightFinishTrim;
            const gapEnd = tLeft < tRight ? rightFinishTrim : leftFinishTrim;

            trims[tCheck.host.id].rightFinishGaps.push({
              start: gapStart,
              end: gapEnd,
              t: t,
              tStart: tGapStart,
              tEnd: tGapEnd
            });
          }
        }
      }
    }
  }

  // Sort gaps by position for proper drawing
  Object.values(trims).forEach(trim => {
    trim.leftEdgeGaps.sort((a, b) => a.t - b.t);
    trim.rightEdgeGaps.sort((a, b) => a.t - b.t);
    trim.leftFinishGaps.sort((a, b) => a.t - b.t);
    trim.rightFinishGaps.sort((a, b) => a.t - b.t);
  });

  return trims;
}

/**
 * Draw architectural walls with pre-computed trim points
 */
export function drawArchitecturalWalls(ctx, walls, trims, selectedItems = [], thinLines = false) {
  if (!walls || walls.length === 0) return;

  // Line width multiplier for thin lines mode (like Revit's Thin Lines toggle)
  const lineScale = thinLines ? 0.5 : 1;

  walls.forEach(wall => {
    const geo = trims[wall.id]?.geo || getWallGeometry(wall);
    if (!geo) return;

    const isSelected = selectedItems.some(s => s.type === 'wall' && s.item?.id === wall.id);
    const trim = trims[wall.id] || { leftEdgeGaps: [], rightEdgeGaps: [] };

    // Get trimmed edge endpoints
    const startLeft = trim.startLeftTrim || geo.startLeft;
    const startRight = trim.startRightTrim || geo.startRight;
    const endLeft = trim.endLeftTrim || geo.endLeft;
    const endRight = trim.endRightTrim || geo.endRight;

    ctx.save();

    // Fill the wall polygon with white
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(startLeft.x, startLeft.y);
    ctx.lineTo(endLeft.x, endLeft.y);
    ctx.lineTo(endRight.x, endRight.y);
    ctx.lineTo(startRight.x, startRight.y);
    ctx.closePath();
    ctx.fill();

    // Draw the edge lines
    ctx.strokeStyle = isSelected ? '#00ffaa' : '#000000';
    ctx.lineWidth = (isSelected ? 2 : 1) * lineScale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw left edge with gaps for T-intersections
    if (trim.leftEdgeGaps && trim.leftEdgeGaps.length > 0) {
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
        let currentStart = startLeftFinish;
        for (const gap of trim.leftFinishGaps) {
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
    }

    // Right finish line (interior drywall)
    if (geo.startRightFinish && geo.endRightFinish) {
      const startRightFinish = trim.startRightFinishTrim || geo.startRightFinish;
      const endRightFinish = trim.endRightFinishTrim || geo.endRightFinish;

      if (trim.rightFinishGaps && trim.rightFinishGaps.length > 0) {
        let currentStart = startRightFinish;
        for (const gap of trim.rightFinishGaps) {
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
    }

    ctx.restore();
  });
}

// Keep the old function for backward compatibility
export function drawWallCorners(ctx, walls, selectedItems = []) {
  // No longer needed
}
