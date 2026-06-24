// ── Roster Breakdown Engine ─────────────────────────────────
// Handles Madden roster requirements, overfill detection, and group compatibility

import { POSITION_IDS, ROSTER_REQUIREMENTS, GROUP_COMPAT } from "./maddenIds";

// Count players by position group
export function countByPosition(roster) {
  const counts = {};
  roster.forEach((p) => {
    const pos = p.positionId ?? p.positionAbbr;
    counts[pos] = (counts[pos] || 0) + 1;
  });
  return counts;
}

// Count players by requirement group
export function countByRequirementGroup(roster, toggleSettings = {}) {
  const counts = {};

  Object.entries(ROSTER_REQUIREMENTS).forEach(([group, req]) => {
    // Skip toggled-off groups (FB/TE, OLB/MLB, DE/DT)
    if (req.toggleDefault !== undefined && toggleSettings[group] === false) {
      counts[group] = { count: 0, required: req.min, positions: [] };
      return;
    }

    let groupCount = 0;
    const posCounts = [];

    req.positions.forEach((posId) => {
      const posCount = roster.filter((p) => p.positionId === posId).length;
      groupCount += posCount;
      posCounts.push({ posId, count: posCount, abbr: POSITION_IDS[posId]?.abbr });
    });

    counts[group] = {
      count: groupCount,
      required: req.min,
      positions: posCounts,
      groupWith: req.groupWith,
      groupLabel: req.groupLabel,
    };
  });

  return counts;
}

// Detect overfill/underfill with group compatibility
export function analyzeBreakdown(roster, toggleSettings = {}) {
  const counts = countByRequirementGroup(roster, toggleSettings);
  const issues = [];

  Object.entries(counts).forEach(([group, data]) => {
    const under = data.count < data.required;
    const over = data.count > data.required;

    if (under) {
      issues.push({
        group,
        type: "under",
        count: data.count,
        required: data.required,
        deficit: data.required - data.count,
      });
    }

    // Check for overfill in individual positions within the group
    if (data.groupWith || data.groupLabel) {
      const req = ROSTER_REQUIREMENTS[group];
      if (req.groupLabel && GROUP_COMPAT[req.groupLabel]) {
        const grp = GROUP_COMPAT[req.groupLabel];
        const grpCounts = grp.positions.map((posId) => ({
          posId,
          abbr: POSITION_IDS[posId]?.abbr,
          count: roster.filter((p) => p.positionId === posId).length,
        }));

        // For OL, OT, OG, C are compatible — if OT is overfilled but C is under,
        // highlight OT overfill
        const total = grpCounts.reduce((sum, c) => sum + c.count, 0);
        const minPer = Math.ceil(total / grpCounts.length);

        grpCounts.forEach((c) => {
          if (c.count > minPer && total > grpCounts.length * 2) {
            issues.push({
              group: c.abbr,
              type: "overfill",
              count: c.count,
              maxReasonable: minPer,
              excess: c.count - minPer,
              compatibleWith: grpCounts.filter((x) => x.posId !== c.posId).map((x) => x.abbr),
            });
          }
        });
      }
    }

    if (over && !data.groupWith) {
      issues.push({
        group,
        type: "over",
        count: data.count,
        required: data.required,
        excess: data.count - data.required,
      });
    }
  });

  return { counts, issues };
}

// Check if a signing/release is allowed
export function validateRosterMove(roster, signing, release, toggleSettings = {}) {
  const maxRoster = 55;
  const errors = [];

  // Calculate new roster
  let newRoster = [...roster];
  if (release) {
    newRoster = newRoster.filter((p) => p.playerId !== release.playerId);
  }
  if (signing) {
    // Check roster size
    if (newRoster.length >= maxRoster) {
      return { allowed: false, errors: ["Roster is full (55/55). Must release a player first."] };
    }
    newRoster.push(signing);
  }

  // Check breakdown requirements
  const breakdown = analyzeBreakdown(newRoster, toggleSettings);
  const criticalUnder = breakdown.issues.filter(
    (i) => i.type === "under" && i.deficit > 0
  );

  // Same-category exception: if releasing from same group as signing, it's allowed
  if (release && signing) {
    const releaseGroup = getGroupForPosition(release.positionId);
    const signingGroup = getGroupForPosition(signing.positionId);

    if (releaseGroup === signingGroup) {
      // Same group swap — always allowed regardless of breakdown
      return { allowed: true, errors: [], newRoster };
    }

    // Cross-group: check if release fixes a deficit that signing creates
    const withoutRelease = analyzeBreakdown(
      roster.filter((p) => p.playerId !== release.playerId),
      toggleSettings
    );
    const withBoth = analyzeBreakdown(newRoster, toggleSettings);

    // If the release creates a new deficit that didn't exist before
    const newDeficits = withBoth.issues.filter(
      (i) => i.type === "under" && !withoutRelease.issues.some((x) => x.group === i.group && x.type === "under")
    );

    if (newDeficits.length > 0) {
      errors.push(`This move would create a deficit at: ${newDeficits.map((d) => d.group).join(", ")}`);
    }
  } else if (release && !signing) {
    // Pure release — check if it violates requirements
    if (criticalUnder.length > 0) {
      errors.push(`Cannot release: would violate requirements at ${criticalUnder.map((d) => d.group).join(", ")}`);
    }
  }

  if (errors.length > 0) {
    return { allowed: false, errors };
  }
  return { allowed: true, errors: [], newRoster };
}

// Get the requirement group for a position
function getGroupForPosition(posId) {
  for (const [group, req] of Object.entries(ROSTER_REQUIREMENTS)) {
    if (req.positions.includes(posId)) return group;
  }
  return null;
}

// Get display info for a roster breakdown
export function getBreakdownDisplay(roster, toggleSettings = {}) {
  const { counts, issues } = analyzeBreakdown(roster, toggleSettings);

  return Object.entries(ROSTER_REQUIREMENTS).map(([group, req]) => {
    const data = counts[group] || { count: 0, required: req.min, positions: [] };
    const issue = issues.find((i) => i.group === group);
    const isOverfilled = issue?.type === "overfill";
    const isUnder = issue?.type === "under";
    const isOver = issue?.type === "over";

    return {
      group,
      required: req.min,
      current: data.count,
      status: isUnder ? "under" : isOver || isOverfilled ? "over" : "ok",
      positions: data.positions,
      toggleable: req.toggleDefault !== undefined,
      toggleEnabled: toggleSettings[group] !== false,
    };
  });
}
