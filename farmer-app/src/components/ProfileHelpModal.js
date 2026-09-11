import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const FAQ_ITEMS = [
  {
    q: 'How to book a slot for crop procurement?',
    a: 'Tap on "+ Book Slot" on your Dashboard. Select your crop, enter quantity in KG, choose your nearest APMC Procurement Centre, select an available date/time slot, and confirm to generate your official token.',
  },
  {
    q: 'How do I use the QR Code and Token Number?',
    a: 'When you arrive at the APMC Procurement Centre, show your digital QR Pass or Token Number from the "My Passes" or "Dashboard" tab to the Mandi Officer for instant verification.',
  },
  {
    q: 'What happens after I reach the centre?',
    a: 'Tap the "I\'ve Arrived" button on your Live Queue screen. The backend system will place your token into the live queue sequence and estimate your waiting time.',
  },
  {
    q: 'How does the Live Queue tracking work?',
    a: 'The Live Queue tab automatically fetches your token position, number of farmers ahead, and currently processing token directly from the APMC server.',
  },
  {
    q: 'How are procurement payouts calculated and credited?',
    a: 'Once your crop is weighed and graded by the Procurement Officer, the official MSP amount is recorded by the backend and transferred directly to your registered bank account.',
  },
];

export const ProfileHelpModal = ({ visible, onClose, initialTab = 'profile' }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const toggleFaq = (idx) => {
    setExpandedFaq(expandedFaq === idx ? null : idx);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header & Tabs */}
          <View style={styles.header}>
            <View style={styles.tabHeaderRow}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'profile' && styles.tabBtnActive]}
                onPress={() => setActiveTab('profile')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'profile' && styles.tabBtnTextActive]}>
                  👤 Farmer Profile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'help' && styles.tabBtnActive]}
                onPress={() => setActiveTab('help')}
              >
                <Text style={[styles.tabBtnText, activeTab === 'help' && styles.tabBtnTextActive]}>
                  ❓ Help & FAQ
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <ScrollView contentContainerStyle={styles.content}>
            {activeTab === 'profile' ? (
              <View style={styles.profileSection}>
                {/* Avatar Badge */}
                <View style={styles.avatarCard}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarEmoji}>👨‍🌾</Text>
                  </View>
                  <Text style={styles.farmerName}>{user?.name || 'Ramesh Kumar'}</Text>
                  <Text style={styles.farmerPhone}>📞 +91 {user?.phone || '9876543210'}</Text>
                  <View style={styles.verifiedTag}>
                    <Text style={styles.verifiedTagText}>✓ Registered Mandi Farmer</Text>
                  </View>
                </View>

                {/* Account Details List */}
                <View style={styles.infoCard}>
                  <Text style={styles.cardTitle}>Account Summary</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Farmer Role</Text>
                    <Text style={styles.infoValue}>Authorized APMC Seller</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Account Status</Text>
                    <Text style={[styles.infoValue, { color: '#059669' }]}>Active / Verified</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Direct Bank Payout</Text>
                    <Text style={styles.infoValue}>DBT Enabled (Aadhaar Linked)</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <TouchableOpacity
                  style={styles.logoutBtn}
                  onPress={() => {
                    onClose();
                    logout();
                  }}
                >
                  <Text style={styles.logoutBtnText}>🚪 Log Out of Portal</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.helpSection}>
                <Text style={styles.helpHeaderTitle}>Frequently Asked Questions</Text>
                <Text style={styles.helpHeaderSub}>
                  Get quick answers about slot booking, token passes, queue, and payouts.
                </Text>

                <View style={styles.faqList}>
                  {FAQ_ITEMS.map((item, idx) => {
                    const isExpanded = expandedFaq === idx;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={styles.faqCard}
                        onPress={() => toggleFaq(idx)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.faqHeader}>
                          <Text style={styles.faqQuestion}>{item.q}</Text>
                          <Text style={styles.faqChevron}>{isExpanded ? '▲' : '▼'}</Text>
                        </View>
                        {isExpanded && <Text style={styles.faqAnswer}>{item.a}</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabHeaderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  tabBtnActive: {
    backgroundColor: '#047857',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  profileSection: {
    gap: 16,
  },
  avatarCard: {
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  farmerName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#064e3b',
  },
  farmerPhone: {
    fontSize: 14,
    color: '#047857',
    fontWeight: '600',
    marginTop: 2,
  },
  verifiedTag: {
    backgroundColor: '#047857',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 10,
  },
  verifiedTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  logoutBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  helpSection: {
    gap: 12,
  },
  helpHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  helpHeaderSub: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  faqList: {
    gap: 10,
  },
  faqCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    paddingRight: 8,
  },
  faqChevron: {
    fontSize: 12,
    color: '#047857',
  },
  faqAnswer: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
  },
});

export default ProfileHelpModal;
