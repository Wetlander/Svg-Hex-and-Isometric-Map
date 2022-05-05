"use strict";

function Point(x, y) {
  return {x: x, y: y};
}

function Hex(q, r, s) {
  if (Math.round(q + r + s) !== 0) throw "q + r + s must be 0";
  return {q: q, r: r, s: s};
}

function hex_add(a, b) {
  return Hex(a.q + b.q, a.r + b.r, a.s + b.s);
}

function hex_subtract(a, b) {
  return Hex(a.q - b.q, a.r - b.r, a.s - b.s);
}

function hex_scale(a, k) {
  return Hex(a.q * k, a.r * k, a.s * k);
}

function hex_rotate_left(a) {
  return Hex(-a.s, -a.q, -a.r);
}

function hex_rotate_right(a) {
  return Hex(-a.r, -a.s, -a.q);
}

var hex_directions = [Hex(1, 0, -1), Hex(1, -1, 0), Hex(0, -1, 1), Hex(-1, 0, 1), Hex(-1, 1, 0), Hex(0, 1, -1)];
function hex_direction(direction) {
  return hex_directions[direction];
}

function hex_neighbor(hex, direction) {
  return hex_add(hex, hex_direction(direction));
}

var hex_diagonals = [Hex(2, -1, -1), Hex(1, -2, 1), Hex(-1, -1, 2), Hex(-2, 1, 1), Hex(-1, 2, -1), Hex(1, 1, -2)];
function hex_diagonal_neighbor(hex, direction) {
  return hex_add(hex, hex_diagonals[direction]);
}

function hex_length(hex) {
  return (Math.abs(hex.q) + Math.abs(hex.r) + Math.abs(hex.s)) / 2;
}

function hex_distance(a, b) {
  return hex_length(hex_subtract(a, b));
}

function hex_round(h) {
  var qi = Math.round(h.q);
  var ri = Math.round(h.r);
  var si = Math.round(h.s);
  var q_diff = Math.abs(qi - h.q);
  var r_diff = Math.abs(ri - h.r);
  var s_diff = Math.abs(si - h.s);
  if (q_diff > r_diff && q_diff > s_diff) {
      qi = -ri - si;
  } else {
      if (r_diff > s_diff) {
          ri = -qi - si;
      } else {
          si = -qi - ri;
      }
  }
  return Hex(qi, ri, si);
}

function hex_lerp(a, b, t) {
  return Hex(a.q * (1.0 - t) + b.q * t, a.r * (1.0 - t) + b.r * t, a.s * (1.0 - t) + b.s * t);
}

function hex_linedraw(a, b) {
  var N = hex_distance(a, b);
  var a_nudge = Hex(a.q + 1e-06, a.r + 1e-06, a.s - 2e-06);
  var b_nudge = Hex(b.q + 1e-06, b.r + 1e-06, b.s - 2e-06);
  var results = [];
  var step = 1.0 / Math.max(N, 1);
  for (var i = 0; i <= N; i++)  {
    results.push(hex_round(hex_lerp(a_nudge, b_nudge, step * i)));
  }
  return results;
}

function OffsetCoord(col, row) {
  return {col: col, row: row};
}

var EVEN = 1;
var ODD = -1;
function qoffset_from_cube(offset, h) {
  var col = h.q;
  var row = h.r + (h.q + offset * (h.q & 1)) / 2;
  if (offset !== EVEN && offset !== ODD) {
    throw "offset must be EVEN (+1) or ODD (-1)";
  }
  return OffsetCoord(col, row);
}

function qoffset_to_cube(offset, h) {
  var q = h.col;
  var r = h.row - (h.col + offset * (h.col & 1)) / 2;
  var s = -q - r;
  if (offset !== EVEN && offset !== ODD) {
    throw "offset must be EVEN (+1) or ODD (-1)";
  }
  return Hex(q, r, s);
}

function roffset_from_cube(offset, h) {
  var col = h.q + (h.r + offset * (h.r & 1)) / 2;
  var row = h.r;
  if (offset !== EVEN && offset !== ODD) {
    throw "offset must be EVEN (+1) or ODD (-1)";
  }
  return OffsetCoord(col, row);
}

function roffset_to_cube(offset, h) {
  var q = h.col - (h.row + offset * (h.row & 1)) / 2;
  var r = h.row;
  var s = -q - r;
  if (offset !== EVEN && offset !== ODD) {
    throw "offset must be EVEN (+1) or ODD (-1)";
  }
  return Hex(q, r, s);
}


function DoubledCoord(col, row) {
  return {col: col, row: row};
}

function qdoubled_from_cube(h) {
  var col = h.q;
  var row = 2 * h.r + h.q;
  return DoubledCoord(col, row);
}

function qdoubled_to_cube(h) {
  var q = h.col;
  var r = (h.row - h.col) / 2;
  var s = -q - r;
  return Hex(q, r, s);
}

function rdoubled_from_cube(h) {
  var col = 2 * h.q + h.r;
  var row = h.r;
  return DoubledCoord(col, row);
}

function rdoubled_to_cube(h) {
  var q = (h.col - h.row) / 2;
  var r = h.row;
  var s = -q - r;
  return Hex(q, r, s);
}


function Orientation(f0, f1, f2, f3, b0, b1, b2, b3, start_angle) {
  return {f0: f0, f1: f1, f2: f2, f3: f3, b0: b0, b1: b1, b2: b2, b3: b3, start_angle: start_angle};
}

function Layout(orientation, size, origin) {
  return {orientation: orientation, size: size, origin: origin};
}

var layout_pointy = Orientation(Math.sqrt(3.0), Math.sqrt(3.0) / 2.0, 0.0, 3.0 / 2.0, Math.sqrt(3.0) / 3.0, -1.0 / 3.0, 0.0, 2.0 / 3.0, 0.5);
var layout_flat = Orientation(3.0 / 2.0, 0.0, Math.sqrt(3.0) / 2.0, Math.sqrt(3.0), 2.0 / 3.0, 0.0, -1.0 / 3.0, Math.sqrt(3.0) / 3.0, 0.0);
function hex_to_pixel(layout, h) {
  var M = layout.orientation;
  var size = layout.size;
  var origin = layout.origin;
  var x = (M.f0 * h.q + M.f1 * h.r) * size.x;
  var y = (M.f2 * h.q + M.f3 * h.r) * size.y;
  return Point(x + origin.x, y + origin.y);
}

function pixel_to_hex(layout, p) {
  var M = layout.orientation;
  var size = layout.size;
  var origin = layout.origin;
  var pt = Point((p.x - origin.x) / size.x, (p.y - origin.y) / size.y);
  var q = M.b0 * pt.x + M.b1 * pt.y;
  var r = M.b2 * pt.x + M.b3 * pt.y;
  return Hex(q, r, -q - r);
}

function hex_corner_offset(layout, corner) {
  var M = layout.orientation;
  var size = layout.size;
  var angle = 2.0 * Math.PI * (M.start_angle - corner) / 6.0;
  return Point(size.x * Math.cos(angle), size.y * Math.sin(angle));
}

function polygon_corners(layout, h) {
  var corners = [];
  var center = hex_to_pixel(layout, h);
  for (var i = 0; i < 6; i++) {
      var offset = hex_corner_offset(layout, i);
      corners.push(Point(center.x + offset.x, center.y + offset.y));
  }
  return corners;
}