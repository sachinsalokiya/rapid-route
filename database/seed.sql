-- Seed data for Rapid Route
-- 10 real Indian transport hubs with actual coordinates

INSERT INTO hubs (name, city, type, latitude, longitude) VALUES
('Indira Gandhi International Airport', 'Delhi', 'air', 28.5665, 77.1031),
('Chhatrapati Shivaji Maharaj Airport', 'Mumbai', 'air', 19.0896, 72.8656),
('Chennai International Airport', 'Chennai', 'air', 12.9941, 80.1709),
('Howrah Railway Station', 'Kolkata', 'rail', 22.5839, 88.3424),
('Mumbai Port', 'Mumbai', 'water', 18.9322, 72.8375),
('Chennai Port', 'Chennai', 'water', 13.0827, 80.2707),
('Delhi Cantt Railway Station', 'Delhi', 'rail', 28.5959, 77.1353),
('Bangalore International Airport', 'Bangalore', 'air', 13.1986, 77.7066),
('Hyderabad Rajiv Gandhi Airport', 'Hyderabad', 'air', 17.2403, 78.4294),
('Nhava Sheva Port', 'Mumbai', 'water', 18.9500, 72.9333);

-- Routes between hubs
-- format: from_hub_id, to_hub_id, mode, distance_km, cost, duration_hours

INSERT INTO routes (from_hub_id, to_hub_id, mode, distance_km, cost, duration_hours) VALUES
-- Air routes
(1, 2, 'air', 1148, 5000, 2.5),
(2, 1, 'air', 1148, 5000, 2.5),
(1, 3, 'air', 2184, 7000, 3.5),
(3, 1, 'air', 2184, 7000, 3.5),
(1, 8, 'air', 2150, 6500, 3.0),
(8, 1, 'air', 2150, 6500, 3.0),
(2, 8, 'air', 984,  4000, 2.0),
(8, 2, 'air', 984,  4000, 2.0),
(1, 9, 'air', 1568, 5500, 2.5),
(9, 1, 'air', 1568, 5500, 2.5),

-- Rail routes
(7, 4, 'rail', 1472, 1200, 17.0),
(4, 7, 'rail', 1472, 1200, 17.0),
(7, 3, 'rail', 2180, 1500, 28.0),
(3, 7, 'rail', 2180, 1500, 28.0),
(7, 8, 'rail', 2150, 1400, 24.0),
(8, 7, 'rail', 2150, 1400, 24.0),

-- Water routes
(5, 6, 'water', 1175, 2000, 18.0),
(6, 5, 'water', 1175, 2000, 18.0),
(5, 10, 'water', 10,   100,  1.0),
(10, 5, 'water', 10,   100,  1.0),

-- Road routes
(1, 9, 'road', 1568, 3000, 24.0),
(9, 1, 'road', 1568, 3000, 24.0),
(9, 8, 'road', 570,  1500, 10.0),
(8, 9, 'road', 570,  1500, 10.0),
(2, 8, 'road', 984,  2000, 16.0),
(8, 2, 'road', 984,  2000, 16.0);