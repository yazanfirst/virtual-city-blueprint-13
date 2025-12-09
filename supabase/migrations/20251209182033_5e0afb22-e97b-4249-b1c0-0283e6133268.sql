-- Insert Fashion Street
INSERT INTO streets (id, name, slug, category, description, is_active)
VALUES (
  'c47a5e60-1111-4b5a-9c8d-123456789abc',
  'Fashion Street',
  'fashion',
  'fashion',
  'The premier destination for clothing, accessories, and style in the virtual city.',
  true
);

-- Insert shop spots for Fashion Street matching exact 3D positions
-- Main Boulevard - Right Side (x=18, facing left with rotation -π/2)
INSERT INTO shop_spots (street_id, spot_label, position_3d, sort_order) VALUES
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'R1', '{"x": 18, "z": 40, "rotation": -1.5707963}', 1),
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'R2', '{"x": 18, "z": 28, "rotation": -1.5707963}', 2),
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'R3', '{"x": 18, "z": 16, "rotation": -1.5707963}', 3),
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'R4', '{"x": 18, "z": -16, "rotation": -1.5707963}', 4),
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'R5', '{"x": 18, "z": -28, "rotation": -1.5707963}', 5),
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'R6', '{"x": 18, "z": -40, "rotation": -1.5707963}', 6),
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'R7', '{"x": 18, "z": -52, "rotation": -1.5707963}', 7);

-- Main Boulevard - Left Side (x=-18, facing right with rotation π/2)
INSERT INTO shop_spots (street_id, spot_label, position_3d, sort_order) VALUES
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'L1', '{"x": -18, "z": 40, "rotation": 1.5707963}', 8),
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'L2', '{"x": -18, "z": 28, "rotation": 1.5707963}', 9),
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'L3', '{"x": -18, "z": 16, "rotation": 1.5707963}', 10),
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'L4', '{"x": -18, "z": -16, "rotation": 1.5707963}', 11),
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'L5', '{"x": -18, "z": -28, "rotation": 1.5707963}', 12),
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'L6', '{"x": -18, "z": -40, "rotation": 1.5707963}', 13),
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'L7', '{"x": -18, "z": -52, "rotation": 1.5707963}', 14);

-- Cross Street - North Side (z=18, facing south with rotation π)
INSERT INTO shop_spots (street_id, spot_label, position_3d, sort_order) VALUES
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'N1', '{"x": 35, "z": 18, "rotation": 3.1415926}', 15),
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'N2', '{"x": 47, "z": 18, "rotation": 3.1415926}', 16),
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'N3', '{"x": 59, "z": 18, "rotation": 3.1415926}', 17),
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'N4', '{"x": -35, "z": 18, "rotation": 3.1415926}', 18),
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'N5', '{"x": -47, "z": 18, "rotation": 3.1415926}', 19),
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'N6', '{"x": -59, "z": 18, "rotation": 3.1415926}', 20);

-- Cross Street - South Side (z=-18, facing north with rotation 0)
INSERT INTO shop_spots (street_id, spot_label, position_3d, sort_order) VALUES
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'S1', '{"x": 35, "z": -18, "rotation": 0}', 21),
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'S2', '{"x": 47, "z": -18, "rotation": 0}', 22),
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'S3', '{"x": 59, "z": -18, "rotation": 0}', 23),
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'S4', '{"x": -35, "z": -18, "rotation": 0}', 24),
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'S5', '{"x": -47, "z": -18, "rotation": 0}', 25),
  ('c47a5e60-1111-4b5a-9c8d-123456789abc', 'S6', '{"x": -59, "z": -18, "rotation": 0}', 26);

-- Insert Food Street (coming soon)
INSERT INTO streets (id, name, slug, category, description, is_active)
VALUES (
  'c47a5e60-2222-4b5a-9c8d-123456789abc',
  'Food Street',
  'food',
  'food',
  'Restaurants, cafes, and culinary delights from around the world.',
  false
);

-- Insert Tech Street (coming soon)
INSERT INTO streets (id, name, slug, category, description, is_active)
VALUES (
  'c47a5e60-3333-4b5a-9c8d-123456789abc',
  'Tech Street',
  'tech',
  'tech',
  'Electronics, gadgets, and cutting-edge technology stores.',
  false
);