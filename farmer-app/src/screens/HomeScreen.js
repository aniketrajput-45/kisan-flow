import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { getMyBookings } from '../api/bookings';
import { getQueueStatus, markArrival } from '../api/queue';
import StatusBadge from '../components/StatusBadge';
import ErrorAlert from '../components/ErrorAlert';
import BookingTimeline from '../components/BookingTimeline';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const HomeScreen = ({ onBookSlot, onSelectBooking, onGoToQueue, onGoToPayment }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queueLoading, setQueueLoading] = useState(false);
  const [arriving, setArriving] = useState(false);
  const [error, setError] = useState(null);
  const [queueData, setQueueData] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyBookings();
      const list = res.data || res || [];
      const bookingList = Array.isArray(list) ? list : [];
      setBookings(bookingList);

      const active = bookingList.find(
        (b) => b.status === 'BOOKED' || b.status === 'ARRIVED' || b.status === 'IN_QUEUE' || b.status === 'PROCESSING'
      ) || bookingList[0];

      if (active && active.id) {
        fetchQueueInfo(active.id);
      }
    } catch (err) {
      if (err?.status === 401) return;
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQueueInfo = async (bookingId) => {
    setQueueLoading(true);
    try {
      const res = await getQueueStatus(bookingId);
      if (res && res.data) {
        setQueueData(res.data);
      } else if (res) {
        setQueueData(res);
      }
    } catch (err) {
      // Non-blocking queue error
    } finally {
      setQueueLoading(false);
    }
  };

  const handleMarkArrival = async (bookingId) => {
    if (!bookingId || arriving) return;
    setArriving(true);
    try {
      await markArrival(bookingId);
      await fetchBookings();
    } catch (err) {
      setError(err);
    } finally {
      setArriving(false);
    }
  };

  const activeBooking = bookings.find(
    (b) => b.status === 'BOOKED' || b.status === 'ARRIVED' || b.status === 'IN_QUEUE' || b.status === 'PROCESSING'
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Welcome Banner */}
      <View style={styles.welcomeBanner}>
        <View style={styles.welcomeTextCol}>
          <Text style={styles.welcomeTitle}>
            {t('welcome')}, {user?.name || 'Farmer'}! 👋
          </Text>
          <Text style={styles.welcomeSub}>
            {t('welcomeSub')}
          </Text>
        </View>
        <TouchableOpacity style={styles.bookBtn} onPress={onBookSlot} activeOpacity={0.8}>
          <Text style={styles.bookBtnText}>+ {t('bookSlot')}</Text>
        </TouchableOpacity>
      </View>

      <ErrorAlert error={error} onDismiss={() => setError(null)} />

      {/* Active Token Hero Pass */}
      {activeBooking ? (
        <View style={styles.activeCard}>
          <View style={styles.activeCardHeader}>
            <View style={styles.livePulseDot} />
            <Text style={styles.activeCardTitle}>{t('activeBookingTitle')}</Text>
            <StatusBadge status={activeBooking.status} />
          </View>

          <View style={styles.activeCardBody}>
            {/* Token & Crop Row */}
            <View style={styles.activeCardTop}>
              <View style={styles.tokenTag}>
                <Text style={styles.tokenTagLabel}>{t('tokenNumber')}</Text>
                <Text style={styles.tokenTagValue}>
                  {activeBooking.token_number || activeBooking.token || `TK-${activeBooking.id}`}
                </Text>
              </View>
              <View style={styles.cropBadge}>
                <Text style={styles.cropBadgeText}>🌾 {activeBooking.crop}</Text>
              </View>
            </View>

            {/* Details Grid */}
            <View style={styles.detailsGrid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>{t('quantity')}</Text>
                <Text style={styles.gridValue}>{activeBooking.quantity_kg} KG</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>{t('centre')}</Text>
                <Text style={styles.gridValue} numberOfLines={1}>
                  {activeBooking.centre_name || activeBooking.centre?.name || 'APMC Mandi Centre'}
                </Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridLabel}>{t('dateSlot')}</Text>
                <Text style={styles.gridValue}>
                  {activeBooking.booking_date || 'Today'} • {activeBooking.slot_time || 'Morning'}
                </Text>
              </View>
            </View>

            {/* Live Queue Overview Widget */}
            <View style={styles.queueStatsBox}>
              <View style={styles.queueStatItem}>
                <Text style={styles.queueStatValue}>
                  {queueData?.people_ahead ?? queueData?.queue_position ?? '—'}
                </Text>
                <Text style={styles.queueStatLabel}>{t('peopleAhead')}</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.queueStatItem}>
                <Text style={styles.queueStatValue}>
                  {queueData?.estimated_wait_minutes
                    ? `${queueData.estimated_wait_minutes} mins`
                    : '15 mins'}
                </Text>
                <Text style={styles.queueStatLabel}>{t('estimatedWait')}</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.queueStatItem}>
                <Text style={styles.queueStatValue} numberOfLines={1}>
                  {queueData?.currently_processing || queueData?.processing_token || 'TK-001'}
                </Text>
                <Text style={styles.queueStatLabel}>{t('currentlyProcessing')}</Text>
              </View>
            </View>

            {/* Timeline component */}
            <BookingTimeline currentStatus={activeBooking.status} />

            {/* Mark Arrival Gate Button if only Booked */}
            {activeBooking.status === 'BOOKED' && (
              <TouchableOpacity
                style={styles.arriveDirectBtn}
                onPress={() => handleMarkArrival(activeBooking.id)}
                disabled={arriving}
                activeOpacity={0.85}
              >
                <Text style={styles.arriveDirectBtnText}>
                  {arriving ? 'Checking in at gate...' : `📍 ${t('iveArrived')} (गेट पर उपस्थिति दर्ज करें)`}
                </Text>
              </TouchableOpacity>
            )}

            {/* Action buttons */}
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={styles.viewPassBtn}
                onPress={() => onSelectBooking(activeBooking)}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnText}>🎫 {t('viewPassDetails')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.queueBtn}
                onPress={() => onGoToQueue(activeBooking.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnText}>⏳ {t('trackQueue')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <EmptyState
          icon="📜"
          title={t('noActiveBooking')}
          subtitle={t('noActiveBookingSub')}
          actionLabel={t('bookSlotNow')}
          onAction={onBookSlot}
        />
      )}

      {/* My Passes History */}
      <View style={styles.sectionMargin}>
        <Text style={styles.sectionTitle}>{t('myPasses')}</Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#059669" />
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon="🌾"
            title="No Bookings Found"
            subtitle="You have not created any slot bookings yet."
            actionLabel={t('bookSlotNow')}
            onAction={onBookSlot}
          />
        ) : (
          <View style={styles.bookingsList}>
            {bookings.map((booking) => (
              <View key={booking.id} style={styles.bookingRow}>
                <View style={styles.rowLeft}>
                  <View style={styles.rowCropIcon}>
                    <Text style={styles.rowCropEmoji}>🌾</Text>
                  </View>
                  <View>
                    <Text style={styles.bookingToken}>
                      {booking.token_number || booking.token || `TK-${booking.id}`}
                    </Text>
                    <Text style={styles.bookingMeta}>
                      {booking.crop} • {booking.quantity_kg} kg • {booking.centre_name || booking.centre?.name || 'Mandi Centre'}
                    </Text>
                    <Text style={styles.bookingDate}>
                      📅 {booking.booking_date || 'Date N/A'} ({booking.slot_time || 'Slot N/A'})
                    </Text>
                  </View>
                </View>

                <View style={styles.rowRight}>
                  <StatusBadge status={booking.status} />
                  <TouchableOpacity
                    style={styles.detailsSmallBtn}
                    onPress={() => onSelectBooking(booking)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.detailsSmallBtnText}>View Details ➔</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
    maxWidth: 650,
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
    fontSize: 18,
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
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
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  activeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  activeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  tokenTag: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  tokenTagLabel: {
    fontSize: 9,
    color: '#047857',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tokenTagValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#064e3b',
  },
  cropBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  cropBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
  },
  detailsGrid: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    gap: 8,
    marginBottom: 14,
  },
  gridItem: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  queueStatsBox: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  queueStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  queueStatValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803d',
  },
  queueStatLabel: {
    fontSize: 10,
    color: '#166534',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#bbf7d0',
  },
  arriveDirectBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#047857',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  arriveDirectBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  viewPassBtn: {
    flex: 1,
    backgroundColor: '#047857',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  queueBtn: {
    flex: 1,
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
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
  bookingsList: {
    gap: 12,
    marginTop: 8,
  },
  bookingRow: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowCropIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCropEmoji: {
    fontSize: 20,
  },
  bookingToken: {
    fontWeight: '800',
    fontSize: 15,
    color: '#0f172a',
  },
  bookingMeta: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  bookingDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  detailsSmallBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailsSmallBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
});

export default HomeScreen;
