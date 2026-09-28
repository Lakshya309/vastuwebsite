"use client";

import React, { useState } from "react";
import type { DevtaDistanceEntry } from "./FloorPlanCanvas";

interface DevtaDistancePanelProps {
  entries: DevtaDistanceEntry[];
  visible: boolean;
  onClose: () => void;
}

const RING_LABEL: Record<string, string> = {
  outer:  "Outer",
  middle: "Middle",
  inner:  "Inner",
  center: "Brahma",
};

const RING_BG: Record<string, string> = {
  outer:  "rgba(59,130,246,0.12)",
  middle: "rgba(245,158,11,0.12)",
  inner:  "rgba(168,85,247,0.12)",
  center: "rgba(16,185,129,0.12)",
};

export function DevtaDistancePanel({ entries, visible, onClose }: DevtaDistancePanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (!visible || entries.length === 0) return null;

  // Group entries by ring
  const rings = ["outer", "middle", "inner", "center"] as const;
  const grouped = rings
    .map(ring => ({ ring, items: entries.filter(e => e.ring === ring) }))
    .filter(g => g.items.length > 0);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 12,
        right: 12,
        zIndex: 50,
        width: collapsed ? 140 : 230,
        maxHeight: collapsed ? 40 : 340,
        background: "rgba(15, 23, 42, 0.94)",
        backdropFilter: "blur(12px)",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        overflow: "hidden",
        transition: "all 0.2s ease",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 10px",
          borderBottom: collapsed ? "none" : "1px solid rgba(255,255,255,0.08)",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setCollapsed(c => !c)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "linear-gradient(135deg,#3B82F6,#10B981)",
            }}
          />
          <span style={{ color: "#F8FAFC", fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
            DISTANCES
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            onClick={(e) => { e.stopPropagation(); setCollapsed(c => !c); }}
            title={collapsed ? "Expand" : "Collapse"}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1, padding: 0,
            }}
          >
            {collapsed ? "▲" : "▼"}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            title="Close panel"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1, padding: 0,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div style={{ overflowY: "auto", maxHeight: 296, padding: "6px 0" }}>
          {grouped.map(({ ring, items }) => (
            <div key={ring}>
              {/* Ring section header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px 3px",
                  background: RING_BG[ring],
                  marginBottom: 1,
                }}
              >
                <div
                  style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: items[0]?.color || "#888",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: items[0]?.color || "#ccc",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  {RING_LABEL[ring] || ring}
                </span>
              </div>

              {/* Rows */}
              {items.map((entry) => (
                <div
                  key={entry.index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "4px 10px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  {/* Number badge */}
                  <div
                    style={{
                      width: 18, height: 18, borderRadius: "50%",
                      background: entry.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                      fontSize: 9, fontWeight: 800, color: "#fff",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    }}
                  >
                    {entry.index}
                  </div>

                  {/* Name */}
                  <span
                    style={{
                      flex: 1,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.85)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontWeight: 500,
                    }}
                    title={entry.name}
                  >
                    {entry.name}
                  </span>

                  {/* Distance */}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: entry.color,
                      flexShrink: 0,
                      letterSpacing: 0.3,
                    }}
                  >
                    {entry.distanceFt !== null
                      ? `${entry.distanceFt.toFixed(1)} ft`
                      : `${Math.round(entry.distancePx)} px`}
                  </span>
                </div>
              ))}
            </div>
          ))}

          {/* Legend key */}
          <div
            style={{
              padding: "6px 10px 4px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {(["outer","middle","inner","center"] as const)
              .filter(r => grouped.some(g => g.ring === r))
              .map(r => (
                <div key={r} style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <div style={{ width:8, height:3, borderRadius:2, background: RING_BG[r].replace("0.12","0.8") }} />
                  <span style={{ fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:0.5 }}>
                    {RING_LABEL[r]}
                  </span>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
