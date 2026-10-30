"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { Town, DEFAULT_TOWNS, formatINR, formatDistanceKm, resolvePharmacyCoordinates } from "@/lib/locations";

interface PharmacyMapProps {
  userLocation: { lat: number; lng: number };
  locationLabel: string;
  results: any[];
  mode: string;
  towns?: Town[];
  onSelectReserve?: (item: any) => void;
  onSelectTown?: (town: Town) => void;
}

export default function PharmacyMap({
  userLocation,
  locationLabel,
  results,
  mode,
  towns = DEFAULT_TOWNS,
  onSelectReserve,
  onSelectTown,
}: PharmacyMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Helper to ensure clean, strictly valid numbers for coordinates
  const getSafeCoords = (coords: { lat?: number | null; lng?: number | null }) => {
    const lat = typeof coords?.lat === "number" && !isNaN(coords.lat) ? coords.lat : 10.8878;
    const lng = typeof coords?.lng === "number" && !isNaN(coords.lng) ? coords.lng : 76.0732;
    return { lat, lng };
  };

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch (e) {
        console.warn("Leaflet map cleanup warning:", e);
      }
      mapRef.current = null;
    }

    if ((containerRef.current as any)._leaflet_id) {
      (containerRef.current as any)._leaflet_id = null;
    }

    const { lat, lng } = getSafeCoords(userLocation);

    try {
      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 13,
        zoomControl: false,
      });

      // Standard OpenStreetMap tiles (free, reliable, complete Kerala roads & town coverage)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Add zoom control at top-right
      L.control.zoom({ position: "topright" }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapRef.current = map;

      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch (e) {}
      }, 200);
    } catch (e) {
      console.warn("Leaflet map initialization warning:", e);
    }

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {}
        mapRef.current = null;
      }
      if (containerRef.current && (containerRef.current as any)._leaflet_id) {
        (containerRef.current as any)._leaflet_id = null;
      }
    };
  }, []);

  // 2. Pan map safely when userLocation changes (avoid flyTo division by zero)
  useEffect(() => {
    if (!mapRef.current) return;

    const { lat, lng } = getSafeCoords(userLocation);

    try {
      const current = mapRef.current.getCenter();
      const deltaLat = Math.abs(current.lat - lat);
      const deltaLng = Math.abs(current.lng - lng);

      // Only animate if position has actually moved to prevent flyTo NaN frame bug
      if (deltaLat > 0.0001 || deltaLng > 0.0001) {
        mapRef.current.setView([lat, lng], 13, { animate: true });
      }

      setTimeout(() => {
        try {
          mapRef.current?.invalidateSize();
        } catch (e) {}
      }, 250);
    } catch (e) {
      console.warn("Leaflet setView warning:", e);
    }
  }, [userLocation.lat, userLocation.lng]);

  // 3. Update Markers when results, userLocation, or town selection changes
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const { lat, lng } = getSafeCoords(userLocation);

    // 1. User Location Center Marker (Pulsing blue indicator)
    const userIcon = L.divIcon({
      className: "custom-user-marker",
      html: `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 34px; height: 34px; background: rgba(37, 99, 235, 0.25); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; width: 20px; height: 20px; background: #1d4ed8; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);"></div>
          <div style="position: absolute; width: 6px; height: 6px; background: #ffffff; border-radius: 50%;"></div>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const userMarker = L.marker([lat, lng], { icon: userIcon });
    userMarker.bindPopup(`
      <div style="font-family: inherit; font-size: 13px; line-height: 1.4; padding: 4px;">
        <strong style="color: #1d4ed8; font-size: 14px;">📍 Selected Location</strong><br/>
        <span style="color: #4b5563; font-weight: 500;">${locationLabel || "Kerala"}</span><br/>
        <span style="color: #9ca3af; font-size: 11px;">Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}</span>
      </div>
    `);
    markersLayerRef.current.addLayer(userMarker);

    // 2. Add Pharmacy Markers
    (results || []).forEach((item) => {
      const p = item.pharmacy;
      if (!p) return;

      // Resolve coordinates safely (even if missing in DB for pharmacies like skpharmacy)
      const rawCoords = resolvePharmacyCoordinates(p, towns);
      const coords = getSafeCoords(rawCoords);

      const isInStock = item.status === "in_stock";
      const isLowStock = item.status === "low_stock";
      const markerColor =
        mode === "pharmacy"
          ? "#0284c7"
          : isInStock
          ? "#059669"
          : isLowStock
          ? "#d97706"
          : "#dc2626";

      const pharmacyIcon = L.divIcon({
        className: "custom-pharmacy-marker",
        html: `
          <div style="position: relative; width: 38px; height: 46px; display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.2s;">
            <div style="width: 32px; height: 32px; background: ${markerColor}; border: 2px solid #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.3); color: white;">
              <span class="material-symbols-outlined" style="font-size: 18px; line-height: 1;">local_pharmacy</span>
            </div>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${markerColor}; margin-top: -2px;"></div>
          </div>
        `,
        iconSize: [38, 46],
        iconAnchor: [19, 44],
        popupAnchor: [0, -40],
      });

      const marker = L.marker([coords.lat, coords.lng], { icon: pharmacyIcon });

      const stockBadge =
        mode !== "pharmacy"
          ? `<div style="margin-top: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; background: #f8fafc; padding: 4px 8px; border-radius: 6px; border: 1px solid #e2e8f0;">
             <span style="color: #64748b;">Estimated:</span>
             <strong style="color: #059669; font-size: 14px;">${formatINR(item.price || 0)}</strong>
           </div>`
          : "";

      const distText = formatDistanceKm(item.distance || 0);

      const popupContent = `
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4; min-width: 200px; padding: 4px;">
          <strong style="font-size: 14px; color: #0f172a; display: block; margin-bottom: 2px;">${p.name}</strong>
          <span style="color: #64748b; font-size: 12px; display: block;">📍 ${p.address || "Kerala"}</span>
          <div style="margin-top: 4px; display: flex; align-items: center; justify-content: space-between; font-size: 12px;">
            <span style="color: ${p.is_open ? "#16a34a" : "#9333ea"}; font-weight: 600;">
              ${p.is_open ? "● Open Now" : "● Verified Partner"}
            </span>
            <strong style="color: #1d4ed8;">${distText} away</strong>
          </div>
          ${stockBadge}
          <div style="margin-top: 10px; display: flex; gap: 6px;">
            <a 
              href="https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}" 
              target="_blank" 
              rel="noopener noreferrer"
              style="flex: 1; text-align: center; padding: 6px 10px; background: #f1f5f9; color: #334155; border-radius: 6px; font-size: 11px; font-weight: 600; text-decoration: none; border: 1px solid #cbd5e1;"
            >
              Directions ↗
            </a>
            <a 
              href="/pharmacy/${p.id}" 
              style="flex: 1; text-align: center; padding: 6px 10px; background: #0284c7; color: white; border-radius: 6px; font-size: 11px; font-weight: 600; text-decoration: none;"
            >
              View Store
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersLayerRef.current?.addLayer(marker);
    });
  }, [results, userLocation, locationLabel, mode, towns]);

  const activeTownList = towns && towns.length > 0 ? towns : DEFAULT_TOWNS;
  const { lat, lng } = getSafeCoords(userLocation);

  return (
    <div className="flex flex-col h-full w-full rounded-2xl overflow-hidden border border-outline-variant shadow-sm bg-surface">
      {/* Top Map Location Control Bar */}
      <div className="bg-surface border-b border-outline-variant px-4 py-3 flex flex-wrap items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            explore
          </span>
          <div>
            <h3 className="font-label-md text-on-surface font-semibold">
              Live Map: <span className="text-primary">{locationLabel}</span>
            </h3>
            <p className="text-[11px] text-on-surface-variant">
              Showing GPS pins & accurate pharmacy locations in Kerala (km distance)
            </p>
          </div>
        </div>

        {/* Quick Town Jump Switchers */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-on-surface-variant font-medium mr-1 hidden sm:inline">Jump to:</span>
          {activeTownList.map((town) => {
            const isSelected =
              Math.abs(lat - town.lat) < 0.015 &&
              Math.abs(lng - town.lng) < 0.015;
            return (
              <button
                key={town.name}
                type="button"
                onClick={() => onSelectTown && onSelectTown(town)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant"
                }`}
              >
                📍 {town.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actual Interactive Leaflet Map Container */}
      <div className="relative flex-grow min-h-[580px] w-full">
        <div ref={containerRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }} />

        {/* Floating Map Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-outline-variant shadow-md text-xs space-y-1.5">
          <div className="font-bold text-on-surface mb-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm text-primary">layers</span> Map Legend
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600 border border-white shadow-sm inline-block"></span>
            <span className="text-on-surface">Your Center Location</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-sm inline-block"></span>
            <span className="text-on-surface">Pharmacy (In Stock)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-sm inline-block"></span>
            <span className="text-on-surface">Pharmacy (Low Stock)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-sky-600 border border-white shadow-sm inline-block"></span>
            <span className="text-on-surface">Pharmacy Partner</span>
          </div>
        </div>

        {/* GPS Info Badge */}
        <div className="absolute top-3 left-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-outline-variant shadow-sm text-[11px] font-mono text-on-surface flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span>GPS: {lat.toFixed(4)}° N, {lng.toFixed(4)}° E</span>
        </div>
      </div>
    </div>
  );
}
