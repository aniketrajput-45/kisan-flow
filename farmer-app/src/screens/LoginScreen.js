import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import ErrorAlert from '../components/ErrorAlert';
import { DEMO_FARMER_CREDENTIALS } from '../config';

export const LoginScreen = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoFilled, setAutoFilled] = useState(false);

  const handleSubmit = async () => {
    const cleanPhone = phone.trim();
    if (!cleanPhone || !password) {
      setError('Please enter both phone number and password.');
      return;
    }

    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await login(cleanPhone, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
    }
  };

  const fillDemoFarmer = () => {
    setPhone(DEMO_FARMER_CREDENTIALS.phone);
    setPassword(DEMO_FARMER_CREDENTIALS.password);
    setAutoFilled(true);
    setError(null);
    setTimeout(() => setAutoFilled(false), 3000);
  };

  const isValidPhone = phone.trim().length === 10;

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🌾</Text>
          </View>
          <Text style={styles.brandTitle}>KisanFlow</Text>
          <Text style={styles.brandSubtitle}>Smart APMC Mandi Logistics Platform</Text>
        </View>

        {/* Top Segmented Mode Switcher */}
        <View style={styles.segmentedTab}>
          <TouchableOpacity style={[styles.tabBtn, styles.tabBtnActive]} activeOpacity={1}>
            <Text style={[styles.tabBtnText, styles.tabBtnTextActive]}>🔑 Login / लॉगिन</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabBtn} onPress={onSwitchToRegister} activeOpacity={0.8}>
            <Text style={styles.tabBtnText}>📝 Register / पंजीकरण</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Farmer Login / किसान लॉगिन</Text>
          <Text style={styles.cardSub}>
            Enter your mobile number and password to manage mandi tokens
          </Text>
        </View>

        {/* Quick Demo Access Pill */}
        <TouchableOpacity 
          style={[styles.demoBanner, autoFilled && styles.demoBannerSuccess]} 
          onPress={fillDemoFarmer}
          activeOpacity={0.85}
        >
          <View style={styles.demoLeft}>
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>⚡ DEMO ACCESS</Text>
            </View>
            <Text style={styles.demoTitle}>Ramesh Kumar (Farmer)</Text>
            <Text style={styles.demoSub}>Phone: 9876543210  |  Pass: password123</Text>
          </View>
          <View style={[styles.fillBtn, autoFilled && styles.fillBtnSuccess]}>
            <Text style={styles.fillBtnText}>
              {autoFilled ? '✓ Filled' : '1-Click Fill'}
            </Text>
          </View>
        </TouchableOpacity>

        <ErrorAlert error={error} onDismiss={() => setError(null)} />

        {/* Mobile Phone Field */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Mobile Phone Number / मोबाइल नंबर *</Text>
            {isValidPhone && (
              <Text style={styles.validBadge}>✓ 10 Digits Valid</Text>
            )}
          </View>
          <View style={styles.inputWrapper}>
            <View style={styles.countryCodeBadge} pointerEvents="none">
              <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="9876543210"
              value={phone}
              onChangeText={(txt) => setPhone(txt.replace(/[^0-9]/g, ''))}
              keyboardType="phone-pad"
              maxLength={10}
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        {/* Password Field */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password / पासवर्ड *</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputIcon} pointerEvents="none">🔒</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity 
              style={styles.toggleShowBtn} 
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              <Text style={styles.toggleShowText}>
                {showPassword ? '🙈 Hide' : '👁️ Show'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>
            {loading ? 'Securing Connection...' : 'Login to Farmer Portal ➔'}
          </Text>
        </TouchableOpacity>

        {/* Switch Link */}
        <View style={styles.switchRow}>
          <Text style={styles.switchText}>New Farmer? </Text>
          <TouchableOpacity onPress={onSwitchToRegister} activeOpacity={0.7}>
            <Text style={styles.switchLink}>Register a new account (नया खाता)</Text>
          </TouchableOpacity>
        </View>

        {/* Security Footers */}
        <View style={styles.trustBadgesRow}>
          <View style={styles.trustBadge}>
            <Text style={styles.trustIcon}>🔒</Text>
            <Text style={styles.trustText}>256-Bit Encrypted</Text>
          </View>
          <View style={styles.trustBadgeDot} />
          <View style={styles.trustBadge}>
            <Text style={styles.trustIcon}>🛡️</Text>
            <Text style={styles.trustText}>APMC Govt. Verified</Text>
          </View>
        </View>

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#064e3b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#064e3b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoEmoji: {
    fontSize: 28,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#064e3b',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
    marginTop: 2,
    textAlign: 'center',
  },
  segmentedTab: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#064e3b',
    fontWeight: '800',
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  demoBanner: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  demoBannerSuccess: {
    backgroundColor: '#dcfce7',
    borderColor: '#4ade80',
  },
  demoLeft: {
    flex: 1,
    marginRight: 8,
  },
  demoBadge: {
    backgroundColor: '#dcfce7',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 3,
  },
  demoBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803d',
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  demoSub: {
    fontSize: 11,
    color: '#15803d',
    marginTop: 1,
  },
  fillBtn: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  fillBtnSuccess: {
    backgroundColor: '#166534',
  },
  fillBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  validBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  countryCodeBadge: {
    marginRight: 8,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#cbd5e1',
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  inputIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  toggleShowBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  toggleShowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  submitBtn: {
    width: '100%',
    backgroundColor: '#064e3b',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#064e3b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledBtn: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  switchText: {
    fontSize: 13,
    color: '#64748b',
  },
  switchLink: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '800',
  },
  trustBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    gap: 8,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustIcon: {
    fontSize: 12,
  },
  trustText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  trustBadgeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
  },
});

export default LoginScreen;
