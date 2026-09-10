import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export const QRCodeCard = ({ tokenNumber, qrCode, crop, quantityKg, centreName, slotTime, bookingDate }) => {
  const qrUri = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrCode || tokenNumber || 'KF-TOKEN')}`;

  return (
    <View style={styles.cardContainer}>
      {/* Card Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Official Token Pass</Text>
          <Text style={styles.headerTitle}>KisanFlow</Text>
        </View>
        <View style={styles.approvedBadge}>
          <Text style={styles.approvedBadgeText}>GOVT APPROVED</Text>
        </View>
      </View>

      {/* QR Code Container */}
      <View style={styles.qrContainer}>
        <Image
          source={{ uri: qrUri }}
          style={styles.qrImage}
          resizeMode="cover"
        />
        <View style={styles.tokenNumberBox}>
          <Text style={styles.tokenLabel}>TOKEN NUMBER</Text>
          <Text style={styles.tokenNumber}>{tokenNumber || 'BDW-000'}</Text>
        </View>
      </View>

      {/* Booking Details Grid */}
      <View style={styles.gridContainer}>
        <View style={styles.gridCol}>
          <Text style={styles.gridLabel}>CROP & QUANTITY</Text>
          <Text style={styles.gridValue}>
            {crop || 'Wheat'} ({quantityKg || 0} kg)
          </Text>
        </View>
        <View style={styles.gridCol}>
          <Text style={styles.gridLabel}>PROCUREMENT CENTRE</Text>
          <Text style={styles.gridValue}>{centreName || 'Central Mandi'}</Text>
        </View>
        <View style={[styles.gridCol, { marginTop: 10 }]}>
          <Text style={styles.gridLabel}>DATE</Text>
          <Text style={styles.gridValue}>{bookingDate || 'Today'}</Text>
        </View>
        <View style={[styles.gridCol, { marginTop: 10 }]}>
          <Text style={styles.gridLabel}>SLOT TIME</Text>
          <Text style={styles.gridValue}>{slotTime || '09:00 - 11:00'}</Text>
        </View>
      </View>

      <Text style={styles.footerNote}>
        Show this QR token to the officer upon arrival at the mandi
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#047857',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerSub: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#a7f3d0',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  approvedBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approvedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#022c22',
  },
  qrContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  qrImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  tokenNumberBox: {
    marginTop: 10,
    alignItems: 'center',
  },
  tokenLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tokenNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  gridCol: {
    width: '50%',
  },
  gridLabel: {
    color: '#a7f3d0',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  gridValue: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  footerNote: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 11,
    color: '#6ee7b7',
  },
});

export default QRCodeCard;
