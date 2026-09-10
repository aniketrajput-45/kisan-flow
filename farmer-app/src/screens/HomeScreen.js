import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { getMyBookings } from '../api/bookings';
import QRCodeCard from '../components/QRCodeCard';
import StatusBadge from '../components/StatusBadge';
import ErrorAlert from '../components/ErrorAlert';
import { useAuth } from '../context/AuthContext';

export const HomeScreen = ({ onBookSlot, onSelectBooking, onGoToQueue, onGoToPayment }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyBookings();
      const list = res.data || res || [];
      setBookings(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const activeBooking = bookings.find(
    (b) => b.status === 'BOOKED' || b.status === 'ARRIVED' || b.status === 'IN_QUEUE' || b.status === 'PROCESSING'
  ) || bookings[0];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Welcome Banner */}
      <View style={styles.welcomeBanner}>
        <View style={styles.welcomeTextCol}>
          <Text style={styles.welcomeTitle}>
            Namaste, {user?.name || 'Farmer'}! 👋
          </Text>
          <Text style={styles.welcomeSub}>
            Welcome to KisanFlow Procurement & Live Queue Portal
          </Text>
        </View>
        <TouchableOpacity style={styles.bookBtn} onPress={onBookSlot}>
          <Text style={styles.bookBtnText}>+ Book Slot</Text>
        </TouchableOpacity>
      </View>

      <ErrorAlert error={error} onDismiss={() => setError(null)} />

      {/* Active Token Hero Pass */}
      {activeBooking ? (
        <View style={styles.sectionMargin}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Active Procurement Token Pass</Text>
            <StatusBadge status={activeBooking.status} />
          </View>
          <QRCodeCard
            tokenNumber={activeBooking.token_number || activeBooking.token}
            qrCode={activeBooking.qr_code || activeBooking.qrToken}
            crop={activeBooking.crop}
            quantityKg={activeBooking.quantity_kg}
            centreName={activeBooking.centre_name || activeBooking.centre?.name}
            slotTime={activeBooking.slot_time}
            bookingDate={activeBooking.booking_date}
          />
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.queueBtn}
              onPress={() => onGoToQueue(activeBooking.id)}
            >
              <Text style={styles.actionBtnText}>⏳ Track Live Queue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.paymentBtn}
              onPress={() => onGoToPayment(activeBooking.id)}
            >
              <Text style={styles.actionBtnText}>💳 Payment Status</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>📜</Text>
          <Text style={styles.emptyTitle}>No Active Booking Token</Text>
          <Text style={styles.emptySub}>
            Book a slot at your nearest procurement centre to receive an official token and QR pass.
          </Text>
          <TouchableOpacity style={styles.emptyBookBtn} onPress={onBookSlot}>
            <Text style={styles.emptyBookBtnText}>Book Slot Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bookings History */}
      <View style={styles.sectionMargin}>
        <Text style={styles.sectionTitle}>My Booking Passes</Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#059669" />
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        ) : bookings.length === 0 ? (
          <Text style={styles.emptyListText}>No previous bookings found.</Text>
        ) : (
          <View style={styles.bookingsList}>
            {bookings.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                onPress={() => onSelectBooking(booking)}
                style={styles.bookingRow}
              >
                <View>
                  <Text style={styles.bookingToken}>
                    {booking.token_number || booking.token}
                  </Text>
                  <Text style={styles.bookingMeta}>
                    {booking.crop} • {booking.quantity_kg} kg
                  </Text>
                </View>
                <StatusBadge status={booking.status} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  welcomeBanner: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeTextCol: {
    flex: 1,
    marginRight: 10,
  },
  welcomeTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#065f46',
  },
  welcomeSub: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },
  bookBtn: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionMargin: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  queueBtn: {
    flex: 1,
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  paymentBtn: {
    flex: 1,
    backgroundColor: '#047857',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    marginBottom: 24,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyBookBtn: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyBookBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingBox: {
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 13,
  },
  emptyListText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
  },
  bookingsList: {
    gap: 10,
    marginTop: 8,
  },
  bookingRow: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingToken: {
    fontWeight: '800',
    fontSize: 15,
    color: '#0f172a',
  },
  bookingMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});

export default HomeScreen;
