"use client";

import React, { useState } from "react";
import type { DevtaDistanceEntry } from "./FloorPlanCanvas";

interface DevtaDistancePanelProps {
  entries: DevtaDistanceEntry[];
  visible?: boolean;
  onClose?: () => void;
  selectedEntryName?: string | null;
  onSelectEntry?: (name: string | null) => void;
  isEmbedded?: boolean;
}

const RING_LABEL: Record<string, string> = {
  outer: "Outer Ring",
  middle: "Middle Ring",
  inner: "Inner Ring",
  center: "Brahma / Center",
};

const RING_BG: Record<string, string> = {
  outer: "rgba(59,130,246,0.12)",
  middle: "rgba(245,158,11,0.12)",
  inner: "rgba(168,85,247,0.12)",
  center: "rgba(16,185,129,0.12)",
};

export function DevtaDistancePanel({
  entries,
  visible = true,
  onClose,
  selectedEntryName,
  onSelectEntry,
  isEmbedded = false,
}: DevtaDistancePanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (!visible || entries.length === 0) return null;

  // Filter entries based on search query
  const filteredEntries = entries.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );  // Group entries by ring
  const rings = ["outer", "middle", "inner", "center"] as const;
  const grouped = rings
    .map((ring) => ({ ring, items: filteredEntries.filter((e) => e.ring === ring) }))
    .filter((g) => g.items.length > 0);

  const containerStyle: React.CSSProperties = isEmbedded
    ? {
        width: "100%",
        maxHeight: "380px",
        background: "rgba(15, 23, 42, 0.95)",
        backdropFilter: "blur(16px)",
        borderRadius: "1rem",
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        overflow: "hidden",
        fontFamily: "'Inter', system-ui, sans-serif",
      }
    : {
        position: "absolute",
        bottom: 12,
        right: 12,
        zIndex: 50,
        width: collapsed ? 160 : 260,
        maxHeight: collapsed ? 44 : 380,
        background: "rgba(15, 23, 42, 0.95)",
        backdropFilter: "blur(16px)",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        overflow: "hidden",
        transition: "all 0.2s ease",
        fontFamily: "'Inter', system-ui, sans-serif",
      };

  return (
    <div style={containerStyle} className="my-2">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: collapsed ? "none" : "1px solid rgba(255,255,255,0.08)",
          cursor: "pointer",
          userSelect: "none",
          background: "rgba(30, 41, 59, 0.6)",
        }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#3B82F6,#10B981)",
              boxShadow: "0 0 8px #3B82F6",
            }}
          />
          <span style={{ color: "#F8FAFC", fontSize: 12, fontWeight: 800, letterSpacing: 0.8 }} className="uppercase">
            Zone & Devta Distances
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700 }}>
            {entries.length} items
          </span>
          {selectedEntryName && onSelectEntry && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectEntry(null);
              }}
              title="Clear highlight on plot"
              style={{
                background: "rgba(59,130,246,0.2)",
                border: "1px solid rgba(59,130,246,0.5)",
                cursor: "pointer",
                color: "#93C5FD",
                fontSize: 10,
                fontWeight: 800,
                lineHeight: 1,
                padding: "3px 8px",
                borderRadius: 6,
              }}
            >
              Clear ✕
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed((c) => !c);
            }}
            title={collapsed ? "Expand" : "Collapse"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.6)",
              fontSize: 12,
              lineHeight: 1,
              padding: 0,
            }}
          >
            {collapsed ? "▲" : "▼"}
          </button>
          {onClose && !isEmbedded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              title="Close panel"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "rgba(255,255,255,0.4)",
                fontSize: 14,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div style={{ overflowY: "auto", maxHeight: 330, padding: "6px 0" }} className="custom-scrollbar">
          {/* Search Input */}
          <div style={{ padding: "4px 10px 8px" }}>
            <input
              type="text"
              placeholder="Tap a length below to show it on the plot…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                padding: "6px 10px",
                fontSize: 11,
                fontWeight: 600,
                color: "#F8FAFC",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                outline: "none",
              }}
            />
          </div>

          {filteredEntries.length === 0 && (
            <div style={{ padding: "18px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#E2E8F0" }}>
                {entries.length === 0 ? "No zones yet — draw your plot first." : "No matches. Try another name."}
              </div>
            </div>
          )}

          {grouped.map(({ ring, items }) => (
            <div key={ring}>
              {/* Ring section header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px",
                  background: RING_BG[ring],
                  marginBottom: 1,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: items[0]?.color || "#888",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: items[0]?.color || "#ccc",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  {RING_LABEL[ring] || ring} ({items.length})
                </span>
              </div>

              {/* Rows */}
              {items.map((entry) => {
                const isSelected =
                  selectedEntryName &&
                  (selectedEntryName.toLowerCase() === entry.name.toLowerCase() ||
                    entry.name.toLowerCase().includes(selectedEntryName.toLowerCase()));

                return (
                  <div
                    key={entry.index}
                    onClick={() => {
                      if (onSelectEntry) {
                        onSelectEntry(isSelected ? null : entry.name);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "6px 12px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      cursor: "pointer",
                      background: isSelected
                        ? "rgba(59, 130, 246, 0.25)"
                        : "transparent",
                      borderLeft: isSelected ? "3px solid #3B82F6" : "3px solid transparent",
                      transition: "all 0.15s ease",
                    }}
                    className="hover:bg-white/10"
                  >
                    {/* Number badge */}
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: isSelected ? "#2563EB" : entry.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: 10,
                        fontWeight: 800,
                        color: "#fff",
                        boxShadow: isSelected ? "0 0 8px #3B82F6" : "0 1px 4px rgba(0,0,0,0.3)",
                      }}
                    >
                      {entry.index}
                    </div>

                    {/* Name */}
                    <span
                      style={{
                        flex: 1,
                        fontSize: 12,
                        color: isSelected ? "#FFFFFF" : "rgba(255,255,255,0.9)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontWeight: isSelected ? 700 : 600,
                      }}
                      title={entry.name}
                    >
                      {entry.name}
                    </span>

                    {/* Distance */}
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: isSelected ? "#60A5FA" : entry.color,
                        flexShrink: 0,
                        letterSpacing: 0.3,
                      }}
                    >
                      {entry.distanceFt !== null
                        ? `${entry.distanceFt.toFixed(1)} ft`
                        : `${Math.round(entry.distancePx)} px`}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
