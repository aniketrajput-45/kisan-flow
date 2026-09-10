import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STATUS_CONFIG = {
  BOOKED: { label: 'Booking Confirmed', bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  ARRIVED: { label: 'Arrived at Centre', bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' },
  IN_QUEUE: { label: 'In Queue', bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
  PROCESSING: { label: 'Being Processed', bg: '#f3e8ff', text: '#7e22ce', border: '#d8b4fe' },
  COMPLETED: { label: 'Procurement Completed', bg: '#d1fae5', text: '#047857', border: '#6ee7b7' },
  CANCELLED: { label: 'Cancelled', bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
  NO_SHOW: { label: 'No Show', bg: '#f3f4f6', text: '#4b5563', border: '#d1d5db' },

  // Payment statuses
  RECORDED: { label: 'Payment Recorded', bg: '#e0f2fe', text: '#0284c7', border: '#bae6fd' },
  INITIATED: { label: 'Payment Initiated', bg: '#fef3c7', text: '#d97706', border: '#fde68a' },
  CREDITED: { label: 'Directly Credited to Bank', bg: '#dcfce7', text: '#16a34a', border: '#86efac' },
};

export const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || { label: status || 'Unknown', bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.border }
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text style={[styles.label, { color: config.text }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default StatusBadge;
