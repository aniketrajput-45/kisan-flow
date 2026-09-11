import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { getPaymentStatus } from '../api/payments';
import StatusBadge from '../components/StatusBadge';
import ErrorAlert from '../components/ErrorAlert';

const STAGES = [
  { id: 'RECORDED', label: 'Procurement Recorded', desc: 'Weight & grade verified by officer' },
  { id: 'INITIATED', label: 'Payment Initiated', desc: 'Payment file generated for processing' },
  { id: 'PROCESSING', label: 'Bank Processing', desc: 'Under clearance with beneficiary bank' },
  { id: 'CREDITED', label: 'Directly Credited', desc: 'Funds deposited in farmer bank account' },
];

export const PaymentScreen = ({ bookingId, onBack, onBookSlot }) => {
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (bookingId) {
      fetchPayment(bookingId);
    } else {
      setLoading(false);
    }
  }, [bookingId]);

  const fetchPayment = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPaymentStatus(id);
      const data = res.data || res;
      setPaymentData(data);
    } catch (err) {
      if (err?.status === 401) return;
      if (err?.status === 403) {
        setPaymentData(null);
        setError({
          status: 403,
          message: 'This booking pass belongs to a different farmer session. Please select your own active booking pass from Dashboard or My Passes.',
        });
        return;
      }
      if (err?.status === 404) {
        setPaymentData({ pending: true });
        return;
      }
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const getStageIndex = (status) => {
    switch (status) {
      case 'RECORDED': return 0;
      case 'INITIATED': return 1;
      case 'PROCESSING': return 2;
      case 'CREDITED': return 3;
      default: return 0;
    }
  };

  const currentStageIndex = getStageIndex(paymentData?.status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Procurement Payment Tracker</Text>
        </View>
        {paymentData && <StatusBadge status={paymentData.status} />}
      </View>

      <ErrorAlert
        error={error}
        onRetry={() => fetchPayment(bookingId)}
        onDismiss={() => setError(null)}
      />

      {!bookingId ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Please select a booking pass to view its procurement payment status.
          </Text>
        </View>
      ) : loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading payment record from backend...</Text>
        </View>
      ) : paymentData ? (
        <View>
          {/* Payment Amount Card */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Backend Calculated Total Payout Amount</Text>
            <Text style={styles.amountValue}>
              ₹{Number(paymentData.amount || 0).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.referenceText}>
              Payment Reference:{' '}
              <Text style={styles.referenceNumber}>
                {paymentData.reference_number || 'PAY-REF-PENDING'}
              </Text>
            </Text>
          </View>

          {/* Payment Pipeline Stepper */}
          <View style={styles.stepperCard}>
            <Text style={styles.stepperTitle}>Direct Benefit Transfer (DBT) Progress</Text>

            <View style={styles.stagesList}>
              {STAGES.map((stage, idx) => {
                const isPassed = idx <= currentStageIndex;
                const isCurrent = idx === currentStageIndex;

                return (
                  <View key={stage.id} style={styles.stageRow}>
                    {/* Circle indicator */}
                    <View
                      style={[
                        styles.stageCircle,
                        isPassed ? styles.stageCirclePassed : styles.stageCirclePending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stageCircleText,
                          isPassed ? styles.stageCircleTextPassed : styles.stageCircleTextPending,
                        ]}
                      >
                        {isPassed ? '✓' : String(idx + 1)}
                      </Text>
                    </View>

                    {/* Stage info */}
                    <View style={styles.stageInfo}>
                      <Text
                        style={[
                          styles.stageLabel,
                          isCurrent && styles.stageLabelCurrent,
                          !isPassed && !isCurrent && styles.stageLabelPending,
                        ]}
                      >
                        {stage.label}
                      </Text>
                      <Text style={styles.stageDesc}>{stage.desc}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
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
  emptyCard: {
    padding: 24,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    fontSize: 14,
  },
  loadingCard: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748b',
    marginTop: 12,
    textAlign: 'center',
  },
  amountCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    backgroundColor: '#0f172a',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 8,
  },
  amountLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amountValue: {
    fontSize: 34,
    fontWeight: '900',
    color: '#34d399',
    marginVertical: 6,
  },
  referenceText: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  referenceNumber: {
    fontWeight: '700',
    color: '#ffffff',
  },
  stepperCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  stepperTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 20,
  },
  stagesList: {
    gap: 20,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  stageCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageCirclePassed: {
    backgroundColor: '#059669',
  },
  stageCirclePending: {
    backgroundColor: '#e2e8f0',
  },
  stageCircleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  stageCircleTextPassed: {
    color: '#ffffff',
  },
  stageCircleTextPending: {
    color: '#94a3b8',
  },
  stageInfo: {
    flex: 1,
  },
  stageLabel: {
    fontWeight: '600',
    fontSize: 15,
    color: '#0f172a',
  },
  stageLabelCurrent: {
    fontWeight: '800',
    color: '#059669',
  },
  stageLabelPending: {
    color: '#94a3b8',
  },
  stageDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});

export default PaymentScreen;
