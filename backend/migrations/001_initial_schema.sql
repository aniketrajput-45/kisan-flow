-- Initial Schema Migration for KisanFlow Database

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('FARMER', 'OFFICER', 'ADMIN')),
    password_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS centres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    capacity INT DEFAULT 500,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS slots (
    id SERIAL PRIMARY KEY,
    centre_id INT REFERENCES centres(id) ON DELETE RESTRICT,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INT NOT NULL DEFAULT 50 CHECK (capacity > 0),
    booked_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_centre_slot_composite UNIQUE (id, centre_id),
    CONSTRAINT chk_capacity CHECK (booked_count >= 0 AND booked_count <= capacity)
);

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE RESTRICT,
    centre_id INT REFERENCES centres(id) ON DELETE RESTRICT,
    slot_id INT REFERENCES slots(id) ON DELETE RESTRICT,
    -- booking_date is derived from the selected slot's slot_date via backend business logic
    booking_date DATE NOT NULL,
    token_number VARCHAR(50) NOT NULL,
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    crop VARCHAR(100) NOT NULL,
    quantity_kg INT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'BOOKED' CHECK (status IN ('BOOKED', 'ARRIVED', 'IN_QUEUE', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Enforce Centre ↔ Slot relational integrity (RESTRICT delete to preserve historical records)
    CONSTRAINT fk_booking_centre_slot FOREIGN KEY (slot_id, centre_id) REFERENCES slots(id, centre_id) ON DELETE RESTRICT,
    -- Strictly monotonic token uniqueness scoped to Centre across all dates
    CONSTRAINT uq_centre_token UNIQUE (centre_id, token_number)
);

-- Partial unique index preventing double-booking active slots for a farmer
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_farmer_slot 
ON bookings (user_id, slot_id) 
WHERE status IN ('BOOKED', 'ARRIVED', 'IN_QUEUE', 'PROCESSING');

CREATE TABLE IF NOT EXISTS procurements (
    id SERIAL PRIMARY KEY,
    booking_id INT UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    officer_id INT REFERENCES users(id),
    weight_kg NUMERIC(10,2) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('COMPLETED', 'DISPUTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    procurement_id INT UNIQUE REFERENCES procurements(id) ON DELETE CASCADE,
    booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
    farmer_id INT REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'RECORDED' CHECK (status IN ('RECORDED', 'INITIATED', 'PROCESSING', 'CREDITED')),
    reference_number VARCHAR(100) UNIQUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sms_verifications (
    id SERIAL PRIMARY KEY,
    procurement_id INT REFERENCES procurements(id) ON DELETE CASCADE,
    farmer_phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('OUTBOUND', 'INBOUND')),
    response VARCHAR(10),
    status VARCHAR(20) NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'CONFIRMED', 'DISPUTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_slots_centre_date ON slots(centre_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_bookings_slot_id ON bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_centre_date ON bookings(centre_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_token_number ON bookings(token_number);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_farmer_id ON payments(farmer_id);


