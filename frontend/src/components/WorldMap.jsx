import React, { useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import ReactTooltip from "react-tooltip";
import "../../styles/OnsiteEmployees.css"
// topojson url (public CDN)
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/**
 * Props:
 *  - onsiteEmployees: array of employees with { country } fields (country names like "USA", "UK", "Germany", etc.)
 *  - onCountryClick: function(countryName) -> called when user clicks a country
 *  - height (optional)
 */
const WorldMap = ({ onsiteEmployees = [], onCountryClick = () => {}, height = 300 }) => {
  // Count employees per country name (normalized keys)
  const countsByName = useMemo(() => {
    const map = {};
    onsiteEmployees.forEach((e) => {
      const raw = (e.country || "").toString().trim();
      if (!raw) return;
      const key = raw.toLowerCase();
      map[key] = (map[key] || 0) + 1;
    });
    return map; // keys are lowercased names, values counts
  }, [onsiteEmployees]);

  // small mapping for common display names -> country names in topojson
  // topojson country names are full names like "United States of America", "United Kingdom"
  const nameMap = {
    usa: "United States of America",
    us: "United States of America",
    unitedstates: "United States of America",
    "united states": "United States of America",
    uk: "United Kingdom",
    unitedkingdom: "United Kingdom",
    "great britain": "United Kingdom",
    england: "United Kingdom",
    germany: "Germany",
    deutschland: "Germany",
    australia: "Australia",
    singapore: "Singapore",
  };

  // Build a mapping from topojson country name -> count
  // We'll match using the normalized key strategy
  const countsByTopoName = useMemo(() => {
    const out = {}; // topoName -> count
    // first seed from known nameMap
    Object.entries(nameMap).forEach(([k, topoName]) => {
      const c = countsByName[k];
      if (c) out[topoName] = (out[topoName] || 0) + c;
    });

    // also add any keys that look like full names that might already match topojson keys
    Object.keys(countsByName).forEach((k) => {
      // try to reconstruct a candidate topo name (capitalize words)
      const candidate = k
        .split(/[\s_\-]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      // if not already mapped, set to candidate (some country names will match)
      if (!Object.values(nameMap).includes(candidate) && countsByName[k]) {
        out[candidate] = (out[candidate] || 0) + countsByName[k];
      }
    });

    return out;
  }, [countsByName]);

  // compute min/max for scale
  const countsArray = Object.values(countsByTopoName);
  const max = countsArray.length ? Math.max(...countsArray) : 0;
  const min = countsArray.length ? Math.min(...countsArray) : 0;

  // color scale (light -> strong)
  const colorScale = scaleLinear()
    .domain([min === max ? 0 : min, Math.max(1, max)]) // avoid zero range
    .range(["#e6f2ff", "#0050b3"]);

  // tooltip state: react-tooltip uses data-tip attribute, we'll include info per geography
  return (
    <div style={{ width: "100%", height }}>
      <ReactTooltip effect="solid" />
      <ComposableMap projectionConfig={{ scale: 140 }} width={980} height={height}>
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const topoName = geo.properties && (geo.properties.name || geo.properties.NAME);
              const count = countsByTopoName[topoName] || 0;
              const fill = count > 0 ? colorScale(count) : "#f0f0f0";

              // Display label for tooltip: prefer user-friendly topoName -> maybe convert to short label
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={() => {
                    const label = `${topoName}${count ? ` — ${count} onsite` : " — 0 onsite"}`;
                    // set tooltip content via data-tip attribute
                    // react-tooltip reads the attribute automatically
                    document.body.setAttribute("data-tip", label);
                    // but react-tooltip expects data-tip on element, so use 'data-tip' on wrapper below
                  }}
                  onMouseLeave={() => {
                    document.body.removeAttribute("data-tip");
                  }}
                  onClick={() => {
                    // call back with a readable short name
                    onCountryClick(topoName);
                  }}
                  style={{
                    default: {
                      fill,
                      stroke: "#d6d6d6",
                      strokeWidth: 0.5,
                      outline: "none",
                    },
                    hover: {
                      fill: count > 0 ? "#2b6cb0" : "#cfcfcf",
                      stroke: "#999",
                      strokeWidth: 0.8,
                      outline: "none",
                      cursor: "pointer",
                    },
                    pressed: {
                      fill: "#1a4f8b",
                      outline: "none",
                    },
                  }}
                  // pass tooltip content directly (stable)
                  data-tip={`${topoName}${count ? ` — ${count} onsite` : " — 0 onsite"}`}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
        <span style={{ fontSize: 12, color: "#333" }}>Legend:</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <LegendBox color="#e6f2ff" label="Low / 0-1" />
          <LegendBox color="#80b3ff" label="Few" />
          <LegendBox color="#2b7bd6" label="Medium" />
          <LegendBox color="#0050b3" label="High" />
        </div>
      </div>
    </div>
  );
};

const LegendBox = ({ color, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <div style={{ width: 22, height: 12, background: color, borderRadius: 3, border: "1px solid #ddd" }} />
    <div style={{ fontSize: 12, color: "#444" }}>{label}</div>
  </div>
);

export default WorldMap;
