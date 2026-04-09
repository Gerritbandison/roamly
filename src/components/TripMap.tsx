"use client";

import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { DayPlan } from "@/types/itinerary";

interface TripMapProps {
  days: DayPlan[];
  activeDay: number;
  onDayClick?: (day: number) => void;
}

export default function TripMap({ days, activeDay, onDayClick }: TripMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeRef = useRef<L.Polyline | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeDayRef = useRef(activeDay);
  const onDayClickRef = useRef(onDayClick);

  // Keep refs in sync
  activeDayRef.current = activeDay;
  onDayClickRef.current = onDayClick;

  // Initialize map (once)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([0, 0], 2);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 }
    ).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Build markers helper
  const buildMarkers = useCallback((map: L.Map, daysData: DayPlan[], currentActiveDay: number) => {
    // Clear old markers and route
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (routeRef.current) {
      const segGroup = (routeRef.current as L.Polyline & { _segmentGroup?: L.LayerGroup })._segmentGroup;
      if (segGroup) segGroup.remove();
      routeRef.current.remove();
      routeRef.current = null;
    }

    // Build route from primary location of each day
    const routePoints: L.LatLngExpression[] = [];
    const sortedDays = [...daysData].sort((a, b) => a.day - b.day);
    sortedDays.forEach((day) => {
      if (day.locations.length > 0) {
        routePoints.push([day.locations[0].lat, day.locations[0].lng]);
      }
    });

    // Draw route lines — use different styles for local vs inter-city segments
    if (routePoints.length > 1) {
      // Detect multi-city by checking if any consecutive points are far apart
      const segments: { points: L.LatLngExpression[]; isTravel: boolean }[] = [];
      let currentSegment: L.LatLngExpression[] = [routePoints[0]];
      let currentIsTravel = false;

      for (let i = 1; i < routePoints.length; i++) {
        const [lat1, lng1] = routePoints[i - 1] as [number, number];
        const [lat2, lng2] = routePoints[i] as [number, number];
        const dist = Math.sqrt((lat2 - lat1) ** 2 + (lng2 - lng1) ** 2);
        const isTravel = dist > 0.5; // ~50km+ = inter-city travel

        if (isTravel !== currentIsTravel && currentSegment.length > 0) {
          segments.push({ points: [...currentSegment], isTravel: currentIsTravel });
          currentSegment = [routePoints[i - 1]];
          currentIsTravel = isTravel;
        }
        currentSegment.push(routePoints[i]);
      }
      if (currentSegment.length > 1) {
        segments.push({ points: currentSegment, isTravel: currentIsTravel });
      }

      // If no segments detected, draw single line
      if (segments.length === 0) {
        routeRef.current = L.polyline(routePoints, {
          color: "#c8843a",
          weight: 2,
          opacity: 0.4,
          dashArray: "8, 8",
          lineCap: "round",
        }).addTo(map);
      } else {
        // Draw each segment with appropriate styling
        const group = L.layerGroup();
        segments.forEach((seg) => {
          L.polyline(seg.points, {
            color: seg.isTravel ? "#c0502a" : "#c8843a",
            weight: seg.isTravel ? 3 : 2,
            opacity: seg.isTravel ? 0.6 : 0.4,
            dashArray: seg.isTravel ? "12, 6" : "8, 8",
            lineCap: "round",
          }).addTo(group);
        });
        group.addTo(map);
        routeRef.current = L.polyline(routePoints, { opacity: 0 }); // keep ref for cleanup
        routeRef.current.addTo(map);
        // Store group for cleanup
        (routeRef.current as L.Polyline & { _segmentGroup?: L.LayerGroup })._segmentGroup = group;
      }
    }

    // Add markers
    daysData.forEach((day) => {
      day.locations.forEach((loc, locIndex) => {
        const isActive = day.day === currentActiveDay;
        const isPrimary = locIndex === 0;

        // Only show primary location marker, or all for active day
        if (!isPrimary && !isActive) return;

        const size = isActive && isPrimary ? 34 : isActive ? 24 : 26;

        const icon = L.divIcon({
          className: "custom-day-marker",
          html: `<div style="
            background: ${isActive && isPrimary ? "#c8843a" : isActive ? "rgba(200,132,58,0.7)" : "#1a1208"};
            color: ${isActive && isPrimary ? "#1a1208" : isActive ? "#1a1208" : "#c8843a"};
            border-radius: 50%;
            width: ${size}px;
            height: ${size}px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Playfair Display', serif;
            font-size: ${isActive && isPrimary ? "13px" : "10px"};
            font-weight: 700;
            border: 2px solid #c8843a;
            box-shadow: ${isActive ? "0 3px 14px rgba(200,132,58,0.5)" : "0 2px 8px rgba(0,0,0,0.3)"};
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
          ">${isPrimary ? day.day : ""}</div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([loc.lat, loc.lng], { icon })
          .addTo(map)
          .bindPopup(
            `<div>
              <div style="font-size:0.62rem;text-transform:uppercase;letter-spacing:0.1em;color:#c8843a;margin-bottom:2px;">Day ${day.day}${day.region ? " · " + day.region : ""}</div>
              <div style="font-family:'Playfair Display',serif;font-size:0.95rem;font-weight:700;margin-bottom:2px;">${loc.name}</div>
              <div style="font-size:0.75rem;color:rgba(245,240,232,0.7);">${loc.notes}</div>
            </div>`
          );

        // Click marker to switch day
        if (isPrimary) {
          marker.on("click", () => onDayClickRef.current?.(day.day));
        }

        markersRef.current.push(marker);
      });
    });
  }, []);

  // Rebuild markers when days data changes (not on activeDay change)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !days.length) return;

    buildMarkers(map, days, activeDayRef.current);

    // Fit bounds to show all markers on initial load
    const bounds = L.latLngBounds([]);
    days.forEach((day) => {
      day.locations.forEach((loc) => {
        bounds.extend([loc.lat, loc.lng]);
      });
    });
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [days, buildMarkers]);

  // Update marker styles and pan when active day changes (no fitBounds)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !days.length) return;

    // Rebuild markers with new active state (lightweight — just marker visuals)
    buildMarkers(map, days, activeDay);

    // Pan to active day's primary location
    const activeData = days.find((d) => d.day === activeDay);
    if (activeData && activeData.locations.length > 0) {
      const loc = activeData.locations[0];
      map.flyTo([loc.lat, loc.lng], 12, { duration: 0.8 });
    }
  }, [activeDay, days, buildMarkers]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ minHeight: "400px" }}
    />
  );
}
