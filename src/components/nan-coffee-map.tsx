"use client";

import {
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";

export type NanLngLat = readonly [longitude: number, latitude: number];

export type NanPolygonCoordinates = readonly (readonly NanLngLat[])[];

export type NanBoundaryInput =
  | readonly NanLngLat[]
  | NanPolygonCoordinates
  | {
      readonly type: "Polygon";
      readonly coordinates: NanPolygonCoordinates;
    }
  | {
      readonly type: "MultiPolygon";
      readonly coordinates: readonly NanPolygonCoordinates[];
    };

export type NanMapLocation = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  source: string;
};

/** @deprecated Use NanMapLocation. Kept as a compatibility alias. */
export type NanMapSelectedLocation = NanMapLocation;

export type NanMapCafe = {
  id: string;
  name: string;
  slug?: string;
  lat: number;
  lng: number;
  isCorridorMatch?: boolean;
};

export type NanCoffeeMapProps = {
  nanBoundary: NanBoundaryInput;
  selectedLocations: readonly NanMapLocation[];
  cafes: readonly NanMapCafe[];
  radiusKm: number;
  corridorKm: number;
  title?: string;
  description?: string;
  className?: string;
};

type ProjectedPoint = {
  x: number;
  y: number;
};

type Projection = {
  project: (position: NanLngLat) => ProjectedPoint;
  kilometersToPixels: (kilometers: number) => number;
};

export type MapViewport = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type MapDragState = {
  pointerId: number;
  clientX: number;
  clientY: number;
  viewport: MapViewport;
};

const VIEWBOX_WIDTH = 760;
const VIEWBOX_HEIGHT = 700;
const MAP_PADDING = 54;
const DETAIL_VIEWBOX_WIDTH = 760;
const DETAIL_VIEWBOX_HEIGHT = 360;
const DETAIL_MAP_PADDING = 42;
const DETAIL_MINIMUM_EXTENT_KM = 12;
const KM_PER_LATITUDE_DEGREE = 110.574;
const MAX_MAP_ZOOM = 16;
const ZOOM_STEP = 1.6;
const FULL_MAP_VIEWPORT: MapViewport = {
  x: 0,
  y: 0,
  width: VIEWBOX_WIDTH,
  height: VIEWBOX_HEIGHT,
};

const surfaceStyle: CSSProperties = {
  border: "1px solid var(--line, rgba(64, 43, 33, 0.14))",
  borderRadius: "var(--radius-lg, 30px)",
  background: "var(--cream-50, #fffdf8)",
  boxShadow: "var(--shadow-sm, 0 8px 24px rgba(65, 43, 30, 0.06))",
  overflow: "hidden",
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "1rem",
  flexWrap: "wrap",
  padding: "1.25rem 1.25rem 1rem",
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "var(--espresso-950, #241813)",
  fontFamily: "var(--font-display, Georgia, serif)",
  fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
  lineHeight: 1.2,
};

const descriptionStyle: CSSProperties = {
  maxWidth: "42rem",
  margin: "0.4rem 0 0",
  color: "var(--muted, #73665e)",
  fontSize: "0.92rem",
  lineHeight: 1.55,
};

const resultStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "baseline",
  gap: "0.35rem",
  padding: "0.55rem 0.75rem",
  borderRadius: "999px",
  color: "var(--forest-900, #203c31)",
  background: "var(--forest-100, #dfece5)",
  whiteSpace: "nowrap",
};

const legendStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "0.55rem 1rem",
  margin: 0,
  padding: "0.9rem 1.25rem 1rem",
  borderTop: "1px solid var(--line, rgba(64, 43, 33, 0.14))",
  listStyle: "none",
  color: "var(--muted, #73665e)",
  fontSize: "0.78rem",
};

const legendItemStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
};

const visuallyHiddenStyle: CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

const mapControlsStyle: CSSProperties = {
  position: "absolute",
  zIndex: 4,
  top: "0.7rem",
  right: "0.7rem",
  display: "flex",
  maxWidth: "calc(100% - 1.4rem)",
  padding: "0.3rem",
  alignItems: "center",
  justifyContent: "flex-end",
  border: "1px solid var(--line, rgba(64, 43, 33, 0.14))",
  borderRadius: "0.9rem",
  background: "rgba(255, 253, 248, 0.94)",
  boxShadow: "0 6px 18px rgba(51, 32, 25, 0.12)",
  gap: "0.25rem",
  flexWrap: "wrap",
};

const mapControlButtonStyle: CSSProperties = {
  display: "inline-grid",
  minWidth: "2.5rem",
  minHeight: "2.5rem",
  padding: "0.35rem 0.55rem",
  placeItems: "center",
  border: "1px solid var(--line, rgba(64, 43, 33, 0.14))",
  borderRadius: "0.65rem",
  color: "var(--espresso-950, #241813)",
  background: "var(--cream-50, #fffdf8)",
  cursor: "pointer",
  fontSize: "0.76rem",
  fontWeight: 750,
  lineHeight: 1,
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function clampMapViewport(viewport: MapViewport): MapViewport {
  const minimumWidth = VIEWBOX_WIDTH / MAX_MAP_ZOOM;
  const width = clamp(viewport.width, minimumWidth, VIEWBOX_WIDTH);
  const height = width * (VIEWBOX_HEIGHT / VIEWBOX_WIDTH);

  return {
    x: clamp(viewport.x, 0, VIEWBOX_WIDTH - width),
    y: clamp(viewport.y, 0, VIEWBOX_HEIGHT - height),
    width,
    height,
  };
}

export function zoomMapViewport(
  viewport: MapViewport,
  factor: number,
  focus: ProjectedPoint = {
    x: viewport.x + viewport.width / 2,
    y: viewport.y + viewport.height / 2,
  },
): MapViewport {
  const width = clamp(
    viewport.width / factor,
    VIEWBOX_WIDTH / MAX_MAP_ZOOM,
    VIEWBOX_WIDTH,
  );
  const height = width * (VIEWBOX_HEIGHT / VIEWBOX_WIDTH);
  const focusRatioX = (focus.x - viewport.x) / viewport.width;
  const focusRatioY = (focus.y - viewport.y) / viewport.height;

  return clampMapViewport({
    x: focus.x - focusRatioX * width,
    y: focus.y - focusRatioY * height,
    width,
    height,
  });
}

export function fitMapViewport(points: readonly ProjectedPoint[]): MapViewport {
  if (points.length === 0) return FULL_MAP_VIEWPORT;

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const paddedWidth = Math.max((maxX - minX) * 1.8, VIEWBOX_WIDTH / MAX_MAP_ZOOM);
  const paddedHeight = Math.max((maxY - minY) * 1.8, VIEWBOX_HEIGHT / MAX_MAP_ZOOM);
  const width = Math.max(paddedWidth, paddedHeight * (VIEWBOX_WIDTH / VIEWBOX_HEIGHT));
  const height = width * (VIEWBOX_HEIGHT / VIEWBOX_WIDTH);

  return clampMapViewport({
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
  });
}

function isLngLat(value: unknown): value is NanLngLat {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    Number.isFinite(value[0]) &&
    typeof value[1] === "number" &&
    Number.isFinite(value[1])
  );
}

function collectBoundaryRings(value: unknown, rings: NanLngLat[][]): void {
  if (!Array.isArray(value) || value.length === 0) return;

  if (isLngLat(value[0])) {
    const ring = value.filter(isLngLat);
    if (ring.length >= 3) rings.push(ring);
    return;
  }

  value.forEach((child) => collectBoundaryRings(child, rings));
}

function isGeoJsonBoundary(
  boundary: NanBoundaryInput,
): boundary is Extract<NanBoundaryInput, { readonly coordinates: unknown }> {
  return !Array.isArray(boundary);
}

function normalizeBoundary(boundary: NanBoundaryInput): NanLngLat[][] {
  const rings: NanLngLat[][] = [];
  const coordinates = isGeoJsonBoundary(boundary) ? boundary.coordinates : boundary;
  collectBoundaryRings(coordinates, rings);
  return rings;
}

function isValidMapPoint(point: { lat: number; lng: number }): boolean {
  return (
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    point.lng >= -180 &&
    point.lng <= 180
  );
}

function createProjection(
  rings: readonly (readonly NanLngLat[])[],
  additionalPositions: readonly NanLngLat[],
): Projection | null {
  const boundaryPositions = rings.flat();
  if (boundaryPositions.length === 0) return null;
  return createProjectionFromPositions(
    [...boundaryPositions, ...additionalPositions],
    VIEWBOX_WIDTH,
    VIEWBOX_HEIGHT,
    MAP_PADDING,
    1,
  );
}

function createProjectionFromPositions(
  positions: readonly NanLngLat[],
  viewportWidth: number,
  viewportHeight: number,
  padding: number,
  minimumExtentKm: number,
): Projection | null {
  if (positions.length === 0) return null;

  const longitudes = positions.map(([longitude]) => longitude);
  const latitudes = positions.map(([, latitude]) => latitude);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const referenceLongitude = (minLongitude + maxLongitude) / 2;
  const referenceLatitude = (minLatitude + maxLatitude) / 2;
  const kmPerLongitudeDegree = 111.32 * Math.cos((referenceLatitude * Math.PI) / 180);

  function toKilometers([longitude, latitude]: NanLngLat) {
    return {
      x: (longitude - referenceLongitude) * kmPerLongitudeDegree,
      y: (latitude - referenceLatitude) * KM_PER_LATITUDE_DEGREE,
    };
  }

  const kilometerPositions = positions.map(toKilometers);
  const xs = kilometerPositions.map((point) => point.x);
  const ys = kilometerPositions.map((point) => point.y);
  let minX = Math.min(...xs);
  let maxX = Math.max(...xs);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);
  const rawWidth = maxX - minX;
  const rawHeight = maxY - minY;

  if (rawWidth < minimumExtentKm) {
    const centerX = (minX + maxX) / 2;
    minX = centerX - minimumExtentKm / 2;
    maxX = centerX + minimumExtentKm / 2;
  }

  if (rawHeight < minimumExtentKm) {
    const centerY = (minY + maxY) / 2;
    minY = centerY - minimumExtentKm / 2;
    maxY = centerY + minimumExtentKm / 2;
  }

  const extentWidth = maxX - minX;
  const extentHeight = maxY - minY;
  const availableWidth = viewportWidth - padding * 2;
  const availableHeight = viewportHeight - padding * 2;
  const scale = Math.min(availableWidth / extentWidth, availableHeight / extentHeight);
  const renderedWidth = extentWidth * scale;
  const renderedHeight = extentHeight * scale;
  const offsetX = (viewportWidth - renderedWidth) / 2;
  const offsetY = (viewportHeight - renderedHeight) / 2;

  return {
    project(position) {
      const point = toKilometers(position);
      return {
        x: offsetX + (point.x - minX) * scale,
        y: viewportHeight - (offsetY + (point.y - minY) * scale),
      };
    },
    kilometersToPixels(kilometers) {
      return Math.max(0, kilometers) * scale;
    },
  };
}

function shouldShowDetailInset(
  rings: readonly (readonly NanLngLat[])[],
  plottedPositions: readonly NanLngLat[],
  provinceProjection: Projection,
): boolean {
  if (plottedPositions.length < 3) return false;

  const provincePoints = rings.flat().map((position) => provinceProjection.project(position));
  const plottedPoints = plottedPositions.map((position) => provinceProjection.project(position));
  if (provincePoints.length === 0) return false;

  const extent = (points: readonly ProjectedPoint[]) => {
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    return {
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    };
  };

  const provinceExtent = extent(provincePoints);
  const plottedExtent = extent(plottedPoints);
  const widthRatio = plottedExtent.width / Math.max(provinceExtent.width, 1);
  const heightRatio = plottedExtent.height / Math.max(provinceExtent.height, 1);

  return Math.max(widthRatio, heightRatio) <= 0.32;
}

function ringPath(ring: readonly NanLngLat[], projection: Projection): string {
  return ring
    .map((position, index) => {
      const point = projection.project(position);
      return `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    })
    .join(" ") + " Z";
}

function locationSourceLabel(source: string): string {
  const normalized = source.trim().toLowerCase();
  if (normalized === "current-location" || normalized === "current" || normalized === "geolocation") {
    return "ตำแหน่งปัจจุบัน";
  }
  return "สถานที่ที่ระบุ";
}

function shortenLabel(label: string, maximumLength = 24): string {
  return label.length > maximumLength ? `${label.slice(0, maximumLength - 1)}…` : label;
}

function LegendSwatch({ variant }: { variant: "location" | "radius" | "cafe" | "corridor" }) {
  const colors = {
    location: { background: "var(--forest-800, #2c5041)", border: "var(--forest-800, #2c5041)" },
    radius: { background: "transparent", border: "var(--forest-700, #3e6a57)" },
    cafe: { background: "var(--espresso-800, #4b2f24)", border: "var(--espresso-800, #4b2f24)" },
    corridor: { background: "var(--saffron-500, #d99530)", border: "var(--espresso-800, #4b2f24)" },
  }[variant];

  return (
    <span
      aria-hidden="true"
      style={{
        width: variant === "radius" ? "1.15rem" : "0.72rem",
        height: variant === "radius" ? "1.15rem" : "0.72rem",
        border: `2px ${variant === "radius" ? "dashed" : "solid"} ${colors.border}`,
        borderRadius: "999px",
        background: colors.background,
        flex: "0 0 auto",
      }}
    />
  );
}

type MapDetailInsetProps = {
  idPrefix: string;
  locations: readonly NanMapLocation[];
  cafes: readonly NanMapCafe[];
  radiusKm: number;
  corridorKm: number;
};

function MapDetailInset({
  idPrefix,
  locations,
  cafes,
  radiusKm,
  corridorKm,
}: MapDetailInsetProps) {
  const positions: NanLngLat[] = [
    ...locations.map((location): NanLngLat => [location.lng, location.lat]),
    ...cafes.map((cafe): NanLngLat => [cafe.lng, cafe.lat]),
  ];
  const projection = createProjectionFromPositions(
    positions,
    DETAIL_VIEWBOX_WIDTH,
    DETAIL_VIEWBOX_HEIGHT,
    DETAIL_MAP_PADDING,
    DETAIL_MINIMUM_EXTENT_KM,
  );

  if (!projection) return null;

  const headingId = `nan-map-detail-heading-${idPrefix}`;
  const descriptionId = `nan-map-detail-description-${idPrefix}`;
  const svgTitleId = `nan-map-detail-svg-title-${idPrefix}`;
  const svgDescriptionId = `nan-map-detail-svg-description-${idPrefix}`;
  const clipId = `nan-map-detail-clip-${idPrefix}`;
  const routePoints = locations
    .map((location) => projection.project([location.lng, location.lat]))
    .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");
  const radiusPixels = projection.kilometersToPixels(radiusKm);
  const corridorPixels = projection.kilometersToPixels(corridorKm);
  const scaleBarKm = 2;
  const scaleBarPixels = projection.kilometersToPixels(scaleBarKm);

  return (
    <section
      className="nan-map__detail-inset"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      style={{
        margin: "0.9rem",
        border: "1px solid var(--line, rgba(64, 43, 33, 0.14))",
        borderRadius: "1.1rem",
        background: "var(--cream-50, #fffdf8)",
        overflow: "hidden",
      }}
    >
      <header style={{ padding: "0.9rem 1rem 0.75rem" }}>
        <h3
          id={headingId}
          style={{
            margin: 0,
            color: "var(--espresso-950, #241813)",
            fontFamily: "var(--font-display, Georgia, serif)",
            fontSize: "1rem",
          }}
        >
          ขยายบริเวณที่มีจุดหนาแน่น
        </h3>
        <p
          id={descriptionId}
          style={{ margin: "0.3rem 0 0", color: "var(--muted, #73665e)", fontSize: "0.78rem", lineHeight: 1.5 }}
        >
          ใช้พิกัดและสเกลระยะทางเดิม เลขสีน้ำตาลตรงกับรายชื่อร้านด้านล่าง ส่วนจุดสีเขียวเรียงตามลำดับเส้นทาง
        </p>
      </header>

      <svg
        className="nan-map__detail-canvas"
        role="img"
        aria-labelledby={`${svgTitleId} ${svgDescriptionId}`}
        viewBox={`0 0 ${DETAIL_VIEWBOX_WIDTH} ${DETAIL_VIEWBOX_HEIGHT}`}
        style={{ display: "block", width: "100%", height: "auto", background: "#f6f0e5" }}
      >
        <title id={svgTitleId}>แผนที่ขยายตำแหน่งร้านกาแฟ</title>
        <desc id={svgDescriptionId}>
          แผนที่ขยายบริเวณที่มีจุดซ้อนกัน แสดงสถานที่ {locations.length} จุด และร้านกาแฟ {cafes.length} ร้านด้วยพิกัดเดิม
        </desc>
        <defs>
          <clipPath id={clipId}>
            <rect width={DETAIL_VIEWBOX_WIDTH} height={DETAIL_VIEWBOX_HEIGHT} rx="18" />
          </clipPath>
        </defs>

        <g clipPath={`url(#${clipId})`}>
          <rect width={DETAIL_VIEWBOX_WIDTH} height={DETAIL_VIEWBOX_HEIGHT} fill="#f6f0e5" />
          {[0.25, 0.5, 0.75].map((fraction) => (
            <g key={`detail-grid-${fraction}`} stroke="rgba(62, 106, 87, 0.09)" strokeWidth="1" aria-hidden="true">
              <line x1={DETAIL_VIEWBOX_WIDTH * fraction} y1="0" x2={DETAIL_VIEWBOX_WIDTH * fraction} y2={DETAIL_VIEWBOX_HEIGHT} />
              <line x1="0" y1={DETAIL_VIEWBOX_HEIGHT * fraction} x2={DETAIL_VIEWBOX_WIDTH} y2={DETAIL_VIEWBOX_HEIGHT * fraction} />
            </g>
          ))}

          {radiusKm > 0 && locations.map((location) => {
            const point = projection.project([location.lng, location.lat]);
            return (
              <circle
                key={`detail-radius-${location.id}`}
                cx={point.x}
                cy={point.y}
                r={radiusPixels}
                fill="rgba(62, 106, 87, 0.025)"
                stroke="rgba(62, 106, 87, 0.34)"
                strokeWidth="1.25"
                strokeDasharray="5 6"
                vectorEffect="non-scaling-stroke"
                aria-hidden="true"
              />
            );
          })}

          {locations.length > 1 && corridorKm > 0 && (
            <polyline
              points={routePoints}
              fill="none"
              stroke="rgba(217, 149, 48, 0.14)"
              strokeWidth={Math.max(2, corridorPixels * 2)}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            />
          )}

          {locations.length > 1 && (
            <polyline
              points={routePoints}
              fill="none"
              stroke="var(--forest-800, #2c5041)"
              strokeWidth="3"
              strokeDasharray="3 6"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              aria-hidden="true"
            />
          )}

          {cafes.map((cafe, index) => {
            const point = projection.project([cafe.lng, cafe.lat]);
            const markerColor = cafe.isCorridorMatch ? "var(--saffron-500, #d99530)" : "var(--espresso-800, #4b2f24)";
            const accessibleLabel = `ร้านหมายเลข ${index + 1} ${cafe.name}${cafe.isCorridorMatch ? " ร้านระหว่างเส้นทาง" : ""}`;
            return (
              <g key={`detail-cafe-${cafe.id}`} role="img" aria-label={accessibleLabel}>
                <title>{accessibleLabel}</title>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="10"
                  fill={markerColor}
                  stroke="var(--cream-50, #fffdf8)"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={point.x}
                  y={point.y + 3.4}
                  textAnchor="middle"
                  fill="var(--cream-50, #fffdf8)"
                  fontSize={index >= 9 ? "7.5" : "9"}
                  fontWeight="800"
                  aria-hidden="true"
                >
                  {index + 1}
                </text>
              </g>
            );
          })}

          {locations.map((location, index) => {
            const point = projection.project([location.lng, location.lat]);
            const accessibleLabel = `จุดที่ ${index + 1} ${location.label}`;
            return (
              <g key={`detail-location-${location.id}`} role="img" aria-label={accessibleLabel}>
                <title>{accessibleLabel}</title>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="13"
                  fill="var(--forest-800, #2c5041)"
                  stroke="var(--cream-50, #fffdf8)"
                  strokeWidth="3"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={point.x}
                  y={point.y + 4}
                  textAnchor="middle"
                  fill="var(--cream-50, #fffdf8)"
                  fontSize="10"
                  fontWeight="800"
                  aria-hidden="true"
                >
                  {index + 1}
                </text>
                <text
                  x={point.x + 18}
                  y={point.y - 9}
                  fill="var(--forest-900, #203c31)"
                  stroke="var(--cream-50, #fffdf8)"
                  strokeWidth="5"
                  paintOrder="stroke fill"
                  fontSize="11"
                  fontWeight="800"
                  aria-hidden="true"
                >
                  {shortenLabel(location.label, 20)}
                </text>
              </g>
            );
          })}

          <g transform={`translate(${DETAIL_MAP_PADDING} ${DETAIL_VIEWBOX_HEIGHT - 24})`} aria-hidden="true">
            <line x1="0" y1="0" x2={scaleBarPixels} y2="0" stroke="var(--espresso-950, #241813)" strokeWidth="3" />
            <line x1="0" y1="-4" x2="0" y2="4" stroke="var(--espresso-950, #241813)" strokeWidth="2" />
            <line x1={scaleBarPixels} y1="-4" x2={scaleBarPixels} y2="4" stroke="var(--espresso-950, #241813)" strokeWidth="2" />
            <text x={scaleBarPixels / 2} y="-7" textAnchor="middle" fill="var(--espresso-950, #241813)" fontSize="10" fontWeight="700">
              {scaleBarKm} กม.
            </text>
          </g>
        </g>
      </svg>

      {locations.length > 0 && (
        <ol
          aria-label="ลำดับสถานที่บนเส้นทาง"
          style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem 0.8rem", margin: 0, padding: "0.75rem 1rem 0", listStyle: "none", color: "var(--forest-900, #203c31)", fontSize: "0.76rem" }}
        >
          {locations.map((location, index) => (
            <li key={`detail-location-list-${location.id}`}>
              <strong>{index + 1}.</strong> {location.label}
            </li>
          ))}
        </ol>
      )}

      <ol
        aria-label="รายชื่อร้านหมายเลขบนแผนที่ขยาย"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(10.5rem, 1fr))",
          gap: "0.4rem 0.8rem",
          margin: 0,
          padding: "0.8rem 1rem 1rem",
          listStyle: "none",
          color: "var(--espresso-950, #241813)",
          fontSize: "0.75rem",
        }}
      >
        {cafes.map((cafe, index) => (
          <li key={`detail-cafe-list-${cafe.id}`} style={{ display: "flex", alignItems: "baseline", gap: "0.4rem", minWidth: 0 }}>
            <span
              aria-hidden="true"
              style={{ display: "inline-grid", placeItems: "center", width: "1.25rem", height: "1.25rem", flex: "0 0 auto", borderRadius: "999px", color: "#fffdf8", background: cafe.isCorridorMatch ? "var(--saffron-500, #d99530)" : "var(--espresso-800, #4b2f24)", fontSize: "0.65rem", fontWeight: 800 }}
            >
              {index + 1}
            </span>
            <span>{cafe.name}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function NanCoffeeMap({
  nanBoundary,
  selectedLocations,
  cafes,
  radiusKm,
  corridorKm,
  title = "แผนที่ร้านกาแฟจังหวัดน่าน",
  description,
  className,
}: NanCoffeeMapProps) {
  const reactId = useId().replaceAll(":", "");
  const titleId = `nan-map-title-${reactId}`;
  const descriptionId = `nan-map-description-${reactId}`;
  const svgTitleId = `nan-map-svg-title-${reactId}`;
  const svgDescriptionId = `nan-map-svg-description-${reactId}`;
  const backgroundId = `nan-map-background-${reactId}`;
  const mapCanvasId = `nan-map-canvas-${reactId}`;
  const [mapViewport, setMapViewport] = useState<MapViewport>(FULL_MAP_VIEWPORT);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<MapDragState | null>(null);
  const rings = normalizeBoundary(nanBoundary);
  const validLocations = selectedLocations.filter(isValidMapPoint);
  const validCafes = cafes.filter(isValidMapPoint);
  const plottedPositions: NanLngLat[] = [
    ...validLocations.map((location): NanLngLat => [location.lng, location.lat]),
    ...validCafes.map((cafe): NanLngLat => [cafe.lng, cafe.lat]),
  ];
  const projection = createProjection(rings, plottedPositions);
  const resolvedRadiusKm = Math.max(0, radiusKm);
  const resolvedCorridorKm = Math.max(0, corridorKm);
  const currentMapZoom = VIEWBOX_WIDTH / mapViewport.width;
  const inverseMapZoom = 1 / currentMapZoom;
  const showCafeLabels = validCafes.length <= 6;
  const resolvedDescription =
    description ??
    (validLocations.length > 0
      ? `แสดงร้านในรัศมี ${resolvedRadiusKm.toLocaleString("th-TH")} กิโลเมตรจากแต่ละจุด และร้านในแนวเส้นทาง ±${resolvedCorridorKm.toLocaleString("th-TH")} กิโลเมตร`
      : "แสดงร้านกาแฟในจังหวัดน่านที่มีข้อมูลอยู่ในแอป");

  if (!projection) {
    return (
      <section className={["nan-map", "nan-map--empty", className].filter(Boolean).join(" ")} style={surfaceStyle} aria-labelledby={titleId} aria-describedby={descriptionId}>
        <header className="nan-map__header" style={headerStyle}>
          <div className="nan-map__heading">
            <h2 id={titleId} style={titleStyle}>{title}</h2>
            <p id={descriptionId} style={descriptionStyle}>{resolvedDescription}</p>
          </div>
          <output className="nan-map__result-count" style={resultStyle} aria-live="polite">
            <strong>{validCafes.length.toLocaleString("th-TH")}</strong> ร้าน
          </output>
        </header>
        <p className="nan-map__empty-message" role="status" style={{ margin: "0 1.25rem 1.25rem", padding: "1rem", borderRadius: "1rem", background: "var(--cream-100, #f8f2e8)" }}>
          ยังไม่พบข้อมูลขอบเขตจังหวัดน่านสำหรับวาดแผนที่
        </p>
      </section>
    );
  }

  const provincePath = rings.map((ring) => ringPath(ring, projection)).join(" ");
  const routePoints = validLocations
    .map((location) => projection.project([location.lng, location.lat]))
    .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");
  const radiusPixels = projection.kilometersToPixels(resolvedRadiusKm);
  const corridorPixels = projection.kilometersToPixels(resolvedCorridorKm);
  const showDetailInset = shouldShowDetailInset(rings, plottedPositions, projection);
  const projectedPlotPoints = plottedPositions.map((position) => projection.project(position));
  const canZoomIn = currentMapZoom < MAX_MAP_ZOOM - 0.01;
  const canZoomOut = currentMapZoom > 1.01;

  function zoomIn() {
    setMapViewport((current) => zoomMapViewport(current, ZOOM_STEP));
  }

  function zoomOut() {
    setMapViewport((current) => zoomMapViewport(current, 1 / ZOOM_STEP));
  }

  function resetMapViewport() {
    setMapViewport(FULL_MAP_VIEWPORT);
  }

  function focusPlottedPoints() {
    setMapViewport(fitMapViewport(projectedPlotPoints));
  }

  function handleMapWheel(event: ReactWheelEvent<SVGSVGElement>) {
    if (
      (event.deltaY >= 0 && currentMapZoom <= 1.01) ||
      (event.deltaY < 0 && currentMapZoom >= MAX_MAP_ZOOM - 0.01)
    ) {
      return;
    }
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;

    const ratioX = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
    const ratioY = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);
    const factor = event.deltaY < 0 ? 1.28 : 1 / 1.28;

    setMapViewport((current) => zoomMapViewport(current, factor, {
      x: current.x + ratioX * current.width,
      y: current.y + ratioY * current.height,
    }));
  }

  function handleMapPointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (currentMapZoom <= 1.01) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      viewport: mapViewport,
    };
    setIsDragging(true);
  }

  function handleMapPointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0 || bounds.height <= 0) return;
    event.preventDefault();

    const deltaX = (event.clientX - dragState.clientX) * (dragState.viewport.width / bounds.width);
    const deltaY = (event.clientY - dragState.clientY) * (dragState.viewport.height / bounds.height);
    setMapViewport(clampMapViewport({
      ...dragState.viewport,
      x: dragState.viewport.x - deltaX,
      y: dragState.viewport.y - deltaY,
    }));
  }

  function finishMapDrag(event: ReactPointerEvent<SVGSVGElement>) {
    if (dragStateRef.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStateRef.current = null;
    setIsDragging(false);
  }

  return (
    <section className={["nan-map", className].filter(Boolean).join(" ")} style={surfaceStyle} aria-labelledby={titleId} aria-describedby={descriptionId}>
      <header className="nan-map__header" style={headerStyle}>
        <div className="nan-map__heading">
          <h2 id={titleId} style={titleStyle}>{title}</h2>
          <p id={descriptionId} style={descriptionStyle}>{resolvedDescription}</p>
        </div>
        <output className="nan-map__result-count" style={resultStyle} aria-live="polite" aria-label={`พบร้านกาแฟ ${validCafes.length} ร้าน`}>
          <strong style={{ fontSize: "1.15rem" }}>{validCafes.length.toLocaleString("th-TH")}</strong> ร้าน
        </output>
      </header>

      <figure className="nan-map__figure" style={{ position: "relative", margin: 0 }}>
        <div
          className="nan-map__controls"
          role="group"
          aria-label="ควบคุมการซูมแผนที่"
          style={mapControlsStyle}
        >
          <button
            type="button"
            onClick={zoomOut}
            disabled={!canZoomOut}
            aria-label="ซูมแผนที่ออก"
            aria-controls={mapCanvasId}
            title="ซูมออก"
            style={mapControlButtonStyle}
          >
            <span aria-hidden="true" style={{ fontSize: "1.25rem" }}>−</span>
          </button>
          <output
            aria-live="polite"
            aria-label={`ระดับการซูม ${currentMapZoom.toFixed(1)} เท่า`}
            style={{ minWidth: "3rem", color: "var(--muted, #73665e)", fontSize: "0.68rem", fontWeight: 750, textAlign: "center" }}
          >
            {Math.round(currentMapZoom * 100)}%
          </output>
          <button
            type="button"
            onClick={zoomIn}
            disabled={!canZoomIn}
            aria-label="ซูมแผนที่เข้า"
            aria-controls={mapCanvasId}
            title="ซูมเข้า"
            style={mapControlButtonStyle}
          >
            <span aria-hidden="true" style={{ fontSize: "1.25rem" }}>+</span>
          </button>
          <button
            type="button"
            onClick={focusPlottedPoints}
            disabled={projectedPlotPoints.length === 0}
            aria-controls={mapCanvasId}
            title="ขยายบริเวณที่มีจุดร้านและสถานที่"
            style={mapControlButtonStyle}
          >
            ดูจุด
          </button>
          <button
            type="button"
            onClick={resetMapViewport}
            disabled={!canZoomOut}
            aria-controls={mapCanvasId}
            title="กลับไปดูเต็มจังหวัดน่าน"
            style={mapControlButtonStyle}
          >
            รีเซ็ต
          </button>
        </div>
        <svg
          id={mapCanvasId}
          className="nan-map__canvas"
          role="img"
          aria-labelledby={`${svgTitleId} ${svgDescriptionId}`}
          viewBox={`${mapViewport.x.toFixed(2)} ${mapViewport.y.toFixed(2)} ${mapViewport.width.toFixed(2)} ${mapViewport.height.toFixed(2)}`}
          onWheel={handleMapWheel}
          onPointerDown={handleMapPointerDown}
          onPointerMove={handleMapPointerMove}
          onPointerUp={finishMapDrag}
          onPointerCancel={finishMapDrag}
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            background: "var(--cream-100, #f8f2e8)",
            cursor: currentMapZoom > 1.01 ? (isDragging ? "grabbing" : "grab") : "default",
            touchAction: currentMapZoom > 1.01 ? "none" : "pan-y",
            userSelect: "none",
          }}
        >
          <title id={svgTitleId}>{title}</title>
          <desc id={svgDescriptionId}>
            แผนที่ขอบเขตจังหวัดน่าน มีสถานที่ที่เลือก {validLocations.length} จุด ร้านกาแฟ {validCafes.length} ร้าน
            {validLocations.length > 1 ? " และเส้นทางเชื่อมตามลำดับสถานที่" : ""} ใช้ปุ่มควบคุม ล้อเมาส์ และการลากเพื่อซูมหรือเลื่อนแผนที่
          </desc>
          <defs>
            <linearGradient id={backgroundId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f8f2e8" />
              <stop offset="100%" stopColor="#e7efe9" />
            </linearGradient>
          </defs>

          <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill={`url(#${backgroundId})`} />
          <path
            className="nan-map__province"
            d={provincePath}
            fill="rgba(255, 253, 248, 0.82)"
            fillRule="evenodd"
            stroke="var(--forest-700, #3e6a57)"
            strokeWidth="2.2"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          <text
            x={VIEWBOX_WIDTH / 2}
            y={VIEWBOX_HEIGHT / 2}
            textAnchor="middle"
            fill="var(--forest-700, #3e6a57)"
            fillOpacity="0.11"
            fontFamily="var(--font-display, Georgia, serif)"
            fontSize={54 * inverseMapZoom}
            fontWeight="700"
            aria-hidden="true"
          >
            จังหวัดน่าน
          </text>

          {resolvedRadiusKm > 0 && validLocations.map((location) => {
            const point = projection.project([location.lng, location.lat]);
            return (
              <circle
                className="nan-map__radius"
                key={`radius-${location.id}`}
                cx={point.x}
                cy={point.y}
                r={radiusPixels}
                fill="rgba(62, 106, 87, 0.07)"
                stroke="var(--forest-700, #3e6a57)"
                strokeWidth="1.5"
                strokeDasharray="6 6"
                vectorEffect="non-scaling-stroke"
                aria-hidden="true"
              />
            );
          })}

          {validLocations.length > 1 && resolvedCorridorKm > 0 && (
            <polyline
              className="nan-map__corridor"
              points={routePoints}
              fill="none"
              stroke="rgba(217, 149, 48, 0.16)"
              strokeWidth={Math.max(2, corridorPixels * 2)}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            />
          )}

          {validLocations.length > 1 && (
            <polyline
              className="nan-map__route"
              points={routePoints}
              fill="none"
              stroke="var(--forest-800, #2c5041)"
              strokeWidth="4"
              strokeDasharray="3 7"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              aria-hidden="true"
            />
          )}

          {validCafes.map((cafe, index) => {
            const point = projection.project([cafe.lng, cafe.lat]);
            const markerColor = cafe.isCorridorMatch ? "var(--saffron-500, #d99530)" : "var(--espresso-800, #4b2f24)";
            const labelAbove = index % 2 === 1;
            const labelY = point.y + (labelAbove ? -12 : 18) * inverseMapZoom;
            const accessibleLabel = `ร้านลำดับที่ ${index + 1} ${cafe.name}${cafe.isCorridorMatch ? " ร้านระหว่างเส้นทาง" : ""}`;

            return (
              <g className={`map-marker map-marker--cafe${cafe.isCorridorMatch ? " map-marker--corridor" : ""}`} key={cafe.id} role="img" aria-label={accessibleLabel}>
                <title>{accessibleLabel}</title>
                {cafe.isCorridorMatch && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={10 * inverseMapZoom}
                    fill="none"
                    stroke="var(--saffron-500, #d99530)"
                    strokeWidth="2"
                    strokeDasharray="2 3"
                    vectorEffect="non-scaling-stroke"
                    aria-hidden="true"
                  />
                )}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={(showCafeLabels ? 6.5 : 9) * inverseMapZoom}
                  fill={markerColor}
                  stroke="var(--cream-50, #fffdf8)"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                />
                {showCafeLabels ? (
                  <>
                    <circle cx={point.x} cy={point.y} r={1.6 * inverseMapZoom} fill="var(--cream-50, #fffdf8)" aria-hidden="true" />
                    <text
                      x={point.x + 9 * inverseMapZoom}
                      y={labelY}
                      fill="var(--espresso-950, #241813)"
                      stroke="var(--cream-50, #fffdf8)"
                      strokeWidth={4 * inverseMapZoom}
                      paintOrder="stroke fill"
                      fontSize={10.5 * inverseMapZoom}
                      fontWeight="600"
                      aria-hidden="true"
                    >
                      {shortenLabel(cafe.name)}
                    </text>
                  </>
                ) : (
                  <text
                    x={point.x}
                    y={point.y + 3.5 * inverseMapZoom}
                    textAnchor="middle"
                    fill="var(--cream-50, #fffdf8)"
                    fontSize={8.5 * inverseMapZoom}
                    fontWeight="800"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </text>
                )}
              </g>
            );
          })}

          {validLocations.map((location, index) => {
            const point = projection.project([location.lng, location.lat]);
            const sourceLabel = locationSourceLabel(location.source);
            const accessibleLabel = `จุดที่ ${index + 1} ${location.label} ${sourceLabel}`;

            return (
              <g className="map-marker map-marker--location" key={location.id} role="img" aria-label={accessibleLabel}>
                <title>{accessibleLabel}</title>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={12 * inverseMapZoom}
                  fill="var(--forest-800, #2c5041)"
                  stroke="var(--cream-50, #fffdf8)"
                  strokeWidth="3"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={point.x}
                  y={point.y + 4 * inverseMapZoom}
                  textAnchor="middle"
                  fill="var(--cream-50, #fffdf8)"
                  fontSize={11 * inverseMapZoom}
                  fontWeight="800"
                  aria-hidden="true"
                >
                  {index + 1}
                </text>
                <text
                  x={point.x + 17 * inverseMapZoom}
                  y={point.y - 8 * inverseMapZoom}
                  fill="var(--forest-900, #203c31)"
                  stroke="var(--cream-50, #fffdf8)"
                  strokeWidth={5 * inverseMapZoom}
                  paintOrder="stroke fill"
                  fontSize={12 * inverseMapZoom}
                  fontWeight="800"
                  aria-hidden="true"
                >
                  {shortenLabel(location.label)}
                </text>
              </g>
            );
          })}
        </svg>

        {showDetailInset && (
          <MapDetailInset
            idPrefix={reactId}
            locations={validLocations}
            cafes={validCafes}
            radiusKm={resolvedRadiusKm}
            corridorKm={resolvedCorridorKm}
          />
        )}

        <figcaption>
          <ul className="nan-map__legend" style={legendStyle} aria-label="คำอธิบายสัญลักษณ์บนแผนที่">
            <li style={legendItemStyle}><LegendSwatch variant="location" /> สถานที่ที่เลือก</li>
            <li style={legendItemStyle}><LegendSwatch variant="radius" /> รัศมี {resolvedRadiusKm.toLocaleString("th-TH")} กม.</li>
            <li style={legendItemStyle}><LegendSwatch variant="cafe" /> ร้านที่ตรงกับตัวกรอง</li>
            <li style={legendItemStyle}><LegendSwatch variant="corridor" /> ร้านระหว่างเส้นทาง ±{resolvedCorridorKm.toLocaleString("th-TH")} กม.</li>
          </ul>
          <div style={visuallyHiddenStyle}>
            <h3>รายการจุดบนแผนที่</h3>
            <ol>
              {validLocations.map((location) => (
                <li key={`accessible-location-${location.id}`}>{location.label} — {locationSourceLabel(location.source)}</li>
              ))}
            </ol>
            <ul>
              {validCafes.map((cafe) => (
                <li key={`accessible-cafe-${cafe.id}`}>{cafe.name}{cafe.isCorridorMatch ? " — อยู่ระหว่างเส้นทาง" : ""}</li>
              ))}
            </ul>
          </div>
        </figcaption>
      </figure>

    </section>
  );
}
