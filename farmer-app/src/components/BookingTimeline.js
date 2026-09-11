import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STAGES = [
  { id: 'BOOKED', label: 'Booked', icon: '📝' },
  { id: 'ARRIVED', label: 'Arrived', icon: '📍' },
  { id: 'IN_QUEUE', label: 'In Queue', icon: '⏳' },
  { id: 'PROCESSING', label: 'Processing', icon: '⚖️' },
  { id: 'COMPLETED', label: 'Completed', icon: '✅' },
];

export const BookingTimeline = ({ currentStatus }) => {
  const normalizedStatus = (currentStatus || 'BOOKED').toUpperCase();

  const getStageIndex = (status) => {
    switch (status) {
      case 'BOOKED':
        return 0;
      case 'ARRIVED':
        return 1;
      case 'IN_QUEUE':
      case 'WAITING':
        return 2;
      case 'PROCESSING':
      case 'IN_PROGRESS':
        return 3;
      case 'COMPLETED':
      case 'PAID':
        return 4;
      default:
        return 0;
    }
  };

  const currentIndex = getStageIndex(normalizedStatus);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Booking Progress Timeline</Text>
      <View style={styles.timelineRow}>
        {STAGES.map((stage, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const isUpcoming = idx > currentIndex;

          return (
            <React.Fragment key={stage.id}>
              {/* Connector line before dot */}
              {idx > 0 && (
                <View
                  style={[
                    styles.connectorLine,
                    idx <= currentIndex && styles.connectorLineActive,
                  ]}
                />
              )}

              {/* Node Circle */}
              <View style={styles.nodeWrapper}>
                <View
                  style={[
                    styles.nodeCircle,
                    isDone && styles.nodeDone,
                    isCurrent && styles.nodeCurrent,
                    isUpcoming && styles.nodeUpcoming,
                  ]}
                >
                  <Text style={styles.nodeIcon}>
                    {isDone ? '✓' : stage.icon}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.nodeLabel,
                    isCurrent && styles.nodeLabelCurrent,
                    isDone && styles.nodeLabelDone,
                  ]}
                  numberOfLines={1}
                >
                  {stage.label}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nodeWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  nodeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  nodeDone: {
    backgroundColor: '#047857',
    borderColor: '#047857',
  },
  nodeCurrent: {
    backgroundColor: '#10b981',
    borderColor: '#047857',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  nodeUpcoming: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
  },
  nodeIcon: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
  nodeLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  nodeLabelCurrent: {
    color: '#047857',
    fontWeight: '800',
  },
  nodeLabelDone: {
    color: '#334155',
    fontWeight: '600',
  },
  connectorLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#e2e8f0',
    marginTop: -18,
  },
  connectorLineActive: {
    backgroundColor: '#047857',
  },
});

export default BookingTimeline;
