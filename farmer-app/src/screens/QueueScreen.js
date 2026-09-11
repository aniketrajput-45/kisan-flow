import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { getQueueStatus, markArrival } from '../api/queue';
import StatusBadge from '../components/StatusBadge';
import ErrorAlert from '../components/ErrorAlert';
import BookingTimeline from '../components/BookingTimeline';

const POLLING_INTERVAL_MS = 6000; // 6 seconds live poll

export const QueueScreen = ({ bookingId, onBack, onGoToPayment, onBookSlot }) => {
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [arriving, setArriving] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    if (!bookingId) {
      setLoading(false);
      return;
    }

    // Initial fetch
    fetchQueue(bookingId, true);

    // Setup live polling
    const timerId = setInterval(() => {
      if (isMountedRef.current) {
        fetchQueue(bookingId, false);
      }
    }, POLLING_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      clearInterval(timerId);
    };
  }, [bookingId]);

  const fetchQueue = async (id, isInitial = false) => {
    if (isInitial) setLoading(true);
    setError(null);

    try {
      const res = await getQueueStatus(id);
      const data = res.data || res;
      if (isMountedRef.current) {
        setQueueData(data);
        setLastRefreshed(new Date());
      }
    } catch (err) {
      if (err?.status === 401) return;
      if (err?.status === 403) {
        if (isMountedRef.current) {
          setQueueData(null);
          setError({
            status: 403,
            message: 'This booking pass belongs to a different farmer session. Please select your own active booking pass from Dashboard or My Passes.',
          });
        }
        return;
      }
      if (isMountedRef.current && isInitial) {
        setError(err);
      }
    } finally {
      if (isMountedRef.current && isInitial) {
        setLoading(false);
      }
    }
  };

  const handleMarkArrived = async () => {
    if (!bookingId || arriving) return;
    setArriving(true);
    setError(null);

    try {
      const res = await markArrival(bookingId);
      const updatedData = res.data || res;
      setQueueData(updatedData);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err);
    } finally {
      setArriving(false);
    }
  };

  const currentStatus = queueData?.status || 'BOOKED';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>Live Queue & Counter Status</Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshButton, loading && styles.refreshButtonDisabled]}
          onPress={() => fetchQueue(bookingId, true)}
          disabled={loading}
        >
          <Text style={styles.refreshButtonText}>
            🔄 {loading ? 'Fetching...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      <ErrorAlert error={error} onRetry={() => fetchQueue(bookingId, true)} onDismiss={() => setError(null)} />

      {!bookingId ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🎫</Text>
          <Text style={styles.emptyTitle}>No Active Booking Selected</Text>
          <Text style={styles.emptySub}>
            You don't have an active slot booking selected. Please select an active booking from Dashboard or create a new slot booking.
          </Text>
          {onBookSlot && (
            <TouchableOpacity
              onPress={onBookSlot}
              style={{ marginTop: 14, backgroundColor: '#059669', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>+ Book Slot Now</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : loading && !queueData ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>
            Loading your authoritative live queue status from server...
          </Text>
        </View>
      ) : queueData ? (
        <View>
          <BookingTimeline currentStatus={currentStatus} />
          {/* STEP A: Status = BOOKED (Farmer has not arrived at procurement centre yet) */}
          {currentStatus === 'BOOKED' && (
            <View style={styles.card}>
              <View style={styles.tokenHeroBanner}>
                <Text style={styles.heroSub}>Your Booking Token</Text>
                <Text style={styles.heroTokenText}>{queueData.token}</Text>
                <StatusBadge status="BOOKED" />
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>📍 Arrival Confirmation Required</Text>
                <Text style={styles.infoBoxText}>
                  Your slot booking is confirmed. Once you reach the procurement centre, tap the button below to mark your arrival and enter the live queue.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.arriveBtn, arriving && styles.disabledBtn]}
                onPress={handleMarkArrived}
                disabled={arriving}
                activeOpacity={0.85}
              >
                {arriving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.arriveBtnText}>📍 I've Arrived at Centre (क्रय केंद्र पहुँच गए हैं)</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* STEP B: Status = IN_QUEUE or ARRIVED */}
          {(currentStatus === 'IN_QUEUE' || currentStatus === 'ARRIVED') && (
            <View>
              {/* Token Hero Card */}
              <View style={styles.heroCard}>
                <Text style={styles.heroLabel}>Your Token Number</Text>
                <Text style={styles.heroToken}>{queueData.token}</Text>
                <StatusBadge status={currentStatus} />
              </View>

              {/* Live Queue Metrics Grid */}
              <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>YOUR POSITION</Text>
                  <Text style={styles.metricValueGreen}>
                    #{queueData.queue_position !== null && queueData.queue_position !== undefined ? queueData.queue_position : '-'}
                  </Text>
                </View>

                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>PEOPLE AHEAD</Text>
                  <Text style={styles.metricValueAmber}>
                    {queueData.people_ahead !== null && queueData.people_ahead !== undefined ? queueData.people_ahead : 0}
                  </Text>
                </View>
              </View>

              {/* Currently Processing Banner */}
              <View style={styles.servingBanner}>
                <Text style={styles.servingLabel}>CURRENTLY SERVING AT COUNTER</Text>
                <Text style={styles.servingToken}>
                  {queueData.currently_processing ? queueData.currently_processing : 'Waiting for officer to start'}
                </Text>
              </View>

              {/* ETA Card */}
              <View style={styles.etaCard}>
                <Text style={styles.etaLabel}>ESTIMATED WAITING TIME (ETA)</Text>
                <Text style={styles.etaValue}>
                  {queueData.estimated_wait_minutes !== null && queueData.estimated_wait_minutes !== undefined
                    ? `~${queueData.estimated_wait_minutes} mins`
                    : 'Calculating...'}
                </Text>
                <Text style={styles.etaSubtext}>
                  Calculated live by backend based on centre serving rates
                </Text>
              </View>

              {/* Live Stepper Progress */}
              <View style={styles.stepperCard}>
                <Text style={styles.stepperTitle}>Live Queue Journey</Text>
                <View style={styles.stepperRow}>
                  <View style={styles.stepDone}>
                    <Text style={styles.stepText}>✓ Booked</Text>
                  </View>
                  <Text style={styles.stepArrow}>→</Text>
                  <View style={styles.stepDone}>
                    <Text style={styles.stepText}>✓ Arrived</Text>
                  </View>
                  <Text style={styles.stepArrow}>→</Text>
                  <View style={styles.stepActive}>
                    <Text style={styles.stepTextActive}>★ In Queue (#{queueData.queue_position})</Text>
                  </View>
                  <Text style={styles.stepArrow}>→</Text>
                  <View style={styles.stepPending}>
                    <Text style={styles.stepTextPending}>Processing</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* STEP C: Status = PROCESSING (Your Turn!) */}
          {currentStatus === 'PROCESSING' && (
            <View style={styles.processingCard}>
              <Text style={styles.processingEmoji}>🎉</Text>
              <Text style={styles.processingTitle}>YOUR TURN NOW!</Text>
              <Text style={styles.processingToken}>{queueData.token}</Text>
              <Text style={styles.processingSub}>
                Please proceed immediately to the procurement counter / weighing scale. Your crop inspection and weighing is in progress.
              </Text>
              <View style={styles.processingBadgeRow}>
                <StatusBadge status="PROCESSING" />
              </View>
            </View>
          )}

          {/* STEP D: Status = COMPLETED */}
          {currentStatus === 'COMPLETED' && (
            <View style={styles.completedCard}>
              <Text style={styles.completedEmoji}>✅</Text>
              <Text style={styles.completedTitle}>Procurement Completed!</Text>
              <Text style={styles.completedToken}>Token: {queueData.token}</Text>
              <Text style={styles.completedSub}>
                Your crop procurement has been verified and completed successfully by the procurement officer.
              </Text>
              {onGoToPayment && (
                <TouchableOpacity
                  style={styles.paymentLinkBtn}
                  onPress={() => onGoToPayment(queueData.booking_id)}
                >
                  <Text style={styles.paymentLinkBtnText}>💳 View Payment & Settlement Status →</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {lastRefreshed && (
            <Text style={styles.lastUpdated}>
              Live poll status • Last updated: {lastRefreshed.toLocaleTimeString()}
            </Text>
          )}
        </View>
      ) : null}
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
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  refreshButton: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  refreshButtonDisabled: {
    opacity: 0.6,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  emptySub: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 13,
  },
  loadingCard: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748b',
    marginTop: 14,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  tokenHeroBanner: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroSub: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroTokenText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#065f46',
    marginVertical: 4,
  },
  infoBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  infoBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  infoBoxText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  arriveBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  arriveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  disabledBtn: {
    backgroundColor: '#94a3b8',
  },
  heroCard: {
    backgroundColor: '#047857',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 4,
  },
  heroLabel: {
    fontSize: 12,
    color: '#a7f3d0',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  heroToken: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    marginVertical: 6,
    letterSpacing: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    elevation: 2,
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricValueGreen: {
    fontSize: 28,
    fontWeight: '900',
    color: '#059669',
    marginTop: 4,
  },
  metricValueAmber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#d97706',
    marginTop: 4,
  },
  servingBanner: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  servingLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369a1',
    textTransform: 'uppercase',
  },
  servingToken: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0284c7',
    marginTop: 2,
  },
  etaCard: {
    backgroundColor: '#fffbe6',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  etaLabel: {
    fontSize: 12,
    color: '#b45309',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  etaValue: {
    fontSize: 30,
    fontWeight: '900',
    color: '#b45309',
    marginVertical: 4,
  },
  etaSubtext: {
    fontSize: 11,
    color: '#d97706',
    textAlign: 'center',
  },
  stepperCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  stepperTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepDone: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stepText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  stepActive: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stepTextActive: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  stepPending: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stepTextPending: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  stepArrow: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 12,
  },
  processingCard: {
    backgroundColor: '#ecfdf5',
    borderWidth: 2,
    borderColor: '#059669',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  processingEmoji: {
    fontSize: 42,
    marginBottom: 6,
  },
  processingTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#065f46',
    marginBottom: 4,
  },
  processingToken: {
    fontSize: 32,
    fontWeight: '900',
    color: '#047857',
    marginVertical: 6,
  },
  processingSub: {
    fontSize: 13,
    color: '#047857',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
  },
  processingBadgeRow: {
    marginTop: 4,
  },
  completedCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#16a34a',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  completedEmoji: {
    fontSize: 42,
    marginBottom: 6,
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#15803d',
    marginBottom: 4,
  },
  completedToken: {
    fontSize: 18,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 6,
  },
  completedSub: {
    fontSize: 13,
    color: '#15803d',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  paymentLinkBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  paymentLinkBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  lastUpdated: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 20,
  },
});

export default QueueScreen;
