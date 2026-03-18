 -- Drop tables if they exist (useful when resetting)
DROP TABLE IF EXISTS parcel_events;
DROP TABLE IF EXISTS parcels;
DROP TABLE IF EXISTS routes;
DROP TABLE IF EXISTS hubs;

-- Table 1: Hubs
-- Stores all transport locations (airports, ports, stations)
CREATE TABLE hubs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('air', 'rail', 'road', 'water')),
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL
);

-- Table 2: Routes
-- Stores connections between hubs
CREATE TABLE routes (
  id SERIAL PRIMARY KEY,
  from_hub_id INT REFERENCES hubs(id),
  to_hub_id INT REFERENCES hubs(id),
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('air', 'rail', 'road', 'water')),
  distance_km FLOAT NOT NULL,
  cost FLOAT NOT NULL,
  duration_hours FLOAT NOT NULL
);

-- Table 3: Parcels
-- Stores all shipments
CREATE TABLE parcels (
  id SERIAL PRIMARY KEY,
  tracking_id VARCHAR(20) UNIQUE NOT NULL,
  origin_hub_id INT REFERENCES hubs(id),
  destination_hub_id INT REFERENCES hubs(id),
  status VARCHAR(30) DEFAULT 'pending'
    CHECK (status IN ('pending', 'in-transit', 'delivered')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table 4: Parcel Events
-- Records every movement of a parcel (for tracking timeline)
CREATE TABLE parcel_events (
  id SERIAL PRIMARY KEY,
  parcel_id INT REFERENCES parcels(id),
  hub_id INT REFERENCES hubs(id),
  event_type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);
