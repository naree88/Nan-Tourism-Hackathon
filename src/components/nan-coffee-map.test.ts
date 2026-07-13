import { describe, expect, it } from "vitest";
import {
  clampMapViewport,
  fitMapViewport,
  pinchMapViewport,
  zoomMapViewport,
  type MapViewport,
} from "./nan-coffee-map";

const fullViewport: MapViewport = { x: 0, y: 0, width: 760, height: 700 };

describe("NanCoffeeMap viewport controls", () => {
  it("zooms in around the center while preserving the map aspect ratio", () => {
    const zoomed = zoomMapViewport(fullViewport, 1.6);

    expect(zoomed).toEqual({ x: 142.5, y: 131.25, width: 475, height: 437.5 });
    expect(zoomed.width / zoomed.height).toBeCloseTo(760 / 700, 10);
  });

  it("keeps the chosen focal point in the same relative viewport position", () => {
    const focus = { x: 190, y: 525 };
    const zoomed = zoomMapViewport(fullViewport, 2, focus);

    expect((focus.x - zoomed.x) / zoomed.width).toBeCloseTo(focus.x / fullViewport.width, 10);
    expect((focus.y - zoomed.y) / zoomed.height).toBeCloseTo(focus.y / fullViewport.height, 10);
  });

  it("clamps zoom and pan to the province-map viewport", () => {
    const clamped = clampMapViewport({ x: -500, y: 900, width: 1, height: 1 });

    expect(clamped.width).toBe(11.875);
    expect(clamped.height).toBeCloseTo(10.9375, 10);
    expect(clamped.x).toBe(0);
    expect(clamped.y).toBeCloseTo(689.0625, 10);
  });

  it("supports pinch zoom beyond 1600% while keeping the gesture focus stable", () => {
    const focus = { x: 380, y: 350 };
    const zoomed = pinchMapViewport(fullViewport, 32, focus, { x: 0.5, y: 0.5 });

    expect(760 / zoomed.width).toBe(32);
    expect((focus.x - zoomed.x) / zoomed.width).toBeCloseTo(0.5, 10);
    expect((focus.y - zoomed.y) / zoomed.height).toBeCloseTo(0.5, 10);
  });

  it("caps the map at 6400% zoom", () => {
    const zoomed = zoomMapViewport(fullViewport, 100);

    expect(760 / zoomed.width).toBe(64);
  });

  it("fits plotted points inside a bounded, aspect-correct detail viewport", () => {
    const points = [
      { x: 320, y: 300 },
      { x: 335, y: 312 },
      { x: 350, y: 296 },
    ];
    const fitted = fitMapViewport(points);

    expect(fitted.width).toBeLessThan(fullViewport.width);
    expect(fitted.width / fitted.height).toBeCloseTo(760 / 700, 10);
    for (const point of points) {
      expect(point.x).toBeGreaterThanOrEqual(fitted.x);
      expect(point.x).toBeLessThanOrEqual(fitted.x + fitted.width);
      expect(point.y).toBeGreaterThanOrEqual(fitted.y);
      expect(point.y).toBeLessThanOrEqual(fitted.y + fitted.height);
    }
  });
});
