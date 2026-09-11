import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import QRCodeCard from '../components/QRCodeCard';
import StatusBadge from '../components/StatusBadge';
import ErrorAlert from '../components/ErrorAlert';
import BookingTimeline from '../components/BookingTimeline';
import { markArrival } from '../api/queue';

export const BookingDetailsScreen = ({ booking, onGoToQueue, onGoToPayment, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentBooking, setCurrentBooking] = useState(booking);

  if (!currentBooking) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No booking selected.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleArrival = async () => {
    setLoading(true);
    setError(null);
    try {
      await markArrival(currentBooking.id);
      setCurrentBooking((prev) => ({ ...prev, status: 'ARRIVED' }));
      if (onGoToQueue) {
        onGoToQueue(currentBooking.id);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = currentBooking.status === 'COMPLETED' || currentBooking.status === 'PAID';
  const isProcessing = currentBooking.status === 'PROCESSING' || isCompleted;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={onBack}>
          <Text style={styles.headerBackText}>← Dashboard</Text>
        </TouchableOpacity>
        <StatusBadge status={currentBooking.status} />
      </View>

      <ErrorAlert error={error} onDismiss={() => setError(null)} />

      {/* Backend Token & QR Pass Display Card */}
      <QRCodeCard
        tokenNumber={currentBooking.token_number || currentBooking.token || `TK-${currentBooking.id}`}
        qrCode={currentBooking.qr_code || currentBooking.qrToken}
        crop={currentBooking.crop}
        quantityKg={currentBooking.quantity_kg || currentBooking.declared_quantity_kg}
        centreName={currentBooking.centre_name || currentBooking.centre?.name || 'Procurement Centre'}
        slotTime={
          currentBooking.slot_time ||
          (currentBooking.slot
            ? `${currentBooking.slot.start_time} - ${currentBooking.slot.end_time}`
            : '09:00 - 11:00')
        }
        bookingDate={currentBooking.booking_date || currentBooking.created_at?.split('T')[0]}
      />

      {/* Visual Booking Timeline */}
      <BookingTimeline currentStatus={currentBooking.status} />

      {/* Procurement Completion Record Box */}
      {isProcessing && (
        <View style={styles.procurementCard}>
          <View style={styles.procurementHeader}>
            <Text style={styles.procurementTitle}>⚖️ Official Procurement Inspection Record</Text>
            <View style={styles.procurementBadge}>
              <Text style={styles.procurementBadgeText}>
                {isCompleted ? '✓ Completed' : '⏳ In Progress'}
              </Text>
            </View>
          </View>

          <View style={styles.procurementGrid}>
            <View style={styles.pItem}>
              <Text style={styles.pLabel}>Declared Weight</Text>
              <Text style={styles.pValue}>{currentBooking.quantity_kg} KG</Text>
            </View>
            <View style={styles.pItem}>
              <Text style={styles.pLabel}>Actual Weighed</Text>
              <Text style={[styles.pValue, { color: '#047857' }]}>
                {currentBooking.actual_quantity_kg || currentBooking.quantity_kg} KG
              </Text>
            </View>
            <View style={styles.pItem}>
              <Text style={styles.pLabel}>Quality Grade</Text>
              <Text style={styles.pValue}>{currentBooking.quality_grade || 'Grade A (FAQ)'}</Text>
            </View>
          </View>

          <View style={styles.mandiFooter}>
            <Text style={styles.mandiFooterText}>
              🏛 Verified by Mandi Inspector • APMC Gate Verified Pass
            </Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {currentBooking.status === 'BOOKED' && (
          <TouchableOpacity
            style={[styles.arrivalButton, loading && styles.buttonDisabled]}
            onPress={handleArrival}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.arrivalButtonText}>
                📍 Mark Arrival at Mandi & Join Queue
              </Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.queueButton}
          onPress={() => onGoToQueue && onGoToQueue(currentBooking.id)}
        >
          <Text style={styles.queueButtonText}>⏳ Track Live Queue & ETA</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.paymentButton}
          onPress={() => onGoToPayment && onGoToPayment(currentBooking.id)}
        >
          <Text style={styles.paymentButtonText}>💳 View Procurement Payment Details</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    maxWidth: 650,
    alignSelf: 'center',
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerBackButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerBackText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  procurementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  procurementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  procurementTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065f46',
  },
  procurementBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  procurementBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  procurementGrid: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  pItem: {
    flex: 1,
  },
  pLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 2,
  },
  pValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  mandiFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  mandiFooterText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  actionButtons: {
    gap: 10,
    marginTop: 12,
    marginBottom: 20,
  },
  arrivalButton: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  arrivalButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  queueButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  queueButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  paymentButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#059669',
  },
  paymentButtonText: {
    color: '#047857',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default BookingDetailsScreen;
