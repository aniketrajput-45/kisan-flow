-- Migration 002: Add Twilio & Notification fields to sms_verifications

ALTER TABLE sms_verifications
  ADD COLUMN IF NOT EXISTS booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS farmer_id INT REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'PROCUREMENT_CONFIRMATION',
  ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'SIMULATED',
  ADD COLUMN IF NOT EXISTS provider_message_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS provider_status VARCHAR(30),
  ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(30),
  ADD COLUMN IF NOT EXISTS error_code VARCHAR(100),
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP WITH TIME ZONE;

-- Drop old check constraint on status if it exists and add expanded constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sms_verifications_status_check'
    ) THEN
        ALTER TABLE sms_verifications DROP CONSTRAINT sms_verifications_status_check;
    END IF;
END $$;

ALTER TABLE sms_verifications 
  ADD CONSTRAINT sms_verifications_status_check 
  CHECK (status IN ('QUEUED', 'SENT', 'DELIVERED', 'UNDELIVERED', 'FAILED', 'CONFIRMED', 'DISPUTED'));

-- Performance, Correlation & Idempotency Indexes
CREATE INDEX IF NOT EXISTS idx_sms_booking_id ON sms_verifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_sms_farmer_id ON sms_verifications(farmer_id);
CREATE INDEX IF NOT EXISTS idx_sms_message_type ON sms_verifications(booking_id, message_type);
CREATE INDEX IF NOT EXISTS idx_sms_provider_msg_id ON sms_verifications(provider_message_id);

-- Database-Level Idempotency Index preventing duplicate OUTBOUND SMS for same booking_id + message_type
CREATE UNIQUE INDEX IF NOT EXISTS uq_sms_booking_message_type
ON sms_verifications (booking_id, message_type)
WHERE direction = 'OUTBOUND' AND booking_id IS NOT NULL AND message_type IS NOT NULL;

