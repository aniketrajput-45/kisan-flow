import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import ErrorAlert from '../components/ErrorAlert';

export const RegisterScreen = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const handleSubmit = async () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanPhone || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please check and try again.');
      return;
    }

    setLoading(true);
    setError(null);

    // CRITICAL: Public registration MUST NOT send a role parameter
    const result = await register(cleanName, cleanPhone, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
    }
  };

  const isValidName = name.trim().length >= 2;
  const isValidPhone = phone.trim().length === 10;
  const isPasswordMinLen = password.length >= 6;
  const isPasswordMatched = confirmPassword.length > 0 && password === confirmPassword;
  const isPasswordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <KeyboardAvoidingView
      style={[styles.keyboardView, darkMode && styles.keyboardViewDark]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Layered Card Stack Background Effect */}
        <View style={styles.cardStackContainer}>
          {/* Rotated Backing Cards for Layered Depth */}
          <View style={styles.cardBackingLayer2} pointerEvents="none" />
          <View style={styles.cardBackingLayer1} pointerEvents="none" />

          {/* Top Anchor Emblem Crest */}
          <View style={styles.crestEmblemAnchor}>
            <View style={styles.crestEmblemCircle}>
              <Text style={styles.crestEmblemIcon}>🌿</Text>
            </View>
          </View>

          {/* Main Card Shell */}
          <View style={[styles.card, darkMode && styles.cardDark]}>
            {/* Top Bar with Govt Pill & Dark Mode Toggle */}
            <View style={styles.topHeaderBar}>
              <View style={styles.govtVerifyPill}>
                <Text style={styles.govtVerifyText}>✓ APMC MANDI PORTAL</Text>
              </View>

              {/* Light / Dark Mode Toggle */}
              <TouchableOpacity
                style={styles.themeToggleBtn}
                onPress={() => setDarkMode(!darkMode)}
                activeOpacity={0.7}
              >
                <Text style={styles.themeToggleIcon}>
                  {darkMode ? '🌙' : '☀️'}
                </Text>
                <View style={[styles.themeSwitchDot, darkMode && styles.themeSwitchDotDark]} />
              </TouchableOpacity>
            </View>

            {/* Brand Header */}
            <View style={styles.brandHeader}>
              <Text style={styles.brandTitle}>KisanFlow</Text>
            </View>

            {/* Segmented Mode Switcher (Tab Bar) */}
            <View style={styles.segmentedTab}>
              <TouchableOpacity style={styles.tabBtn} onPress={onSwitchToLogin} activeOpacity={0.8}>
                <Text style={styles.tabBtnText}>🔑 Login / लॉगिन</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tabBtn, styles.tabBtnActive]} activeOpacity={1}>
                <Text style={[styles.tabBtnText, styles.tabBtnTextActive]}>📝 Register / पंजीकरण</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Create Account / किसान पंजीकरण</Text>
              <Text style={styles.cardSub}>
                Book mandi slots, track live gate queues & receive digital gate passes
              </Text>
            </View>

            <ErrorAlert error={error} onDismiss={() => setError(null)} />

            {/* Full Name Input Field */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Full Name / किसान का पूरा नाम *</Text>
                {isValidName && <Text style={styles.validBadge}>✓ Valid Name</Text>}
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === 'name' && styles.inputWrapperFocused,
                  isValidName && styles.inputWrapperValid,
                ]}
              >
                <Text style={styles.inputIcon} pointerEvents="none">👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor="#6f8577"
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Mobile Phone Input Field */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Mobile Phone Number / मोबाइल नंबर *</Text>
                {isValidPhone && <Text style={styles.validBadge}>✓ 10 Digits Valid</Text>}
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === 'phone' && styles.inputWrapperFocused,
                  isValidPhone && styles.inputWrapperValid,
                ]}
              >
                <View style={styles.countryCodeBadge} pointerEvents="none">
                  <Text style={styles.countryCodeText}>IN +91</Text>
                  <Text style={styles.countryCodeDivider}>|</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="9876543210"
                  value={phone}
                  onChangeText={(txt) => setPhone(txt.replace(/[^0-9]/g, ''))}
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholderTextColor="#6f8577"
                />
              </View>
            </View>

            {/* Password Input Field */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password / पासवर्ड *</Text>
                {isPasswordMinLen && <Text style={styles.validBadge}>✓ Min 6 Chars</Text>}
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === 'password' && styles.inputWrapperFocused,
                  isPasswordMinLen && styles.inputWrapperValid,
                ]}
              >
                <Text style={styles.inputIcon} pointerEvents="none">🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#6f8577"
                />
                <TouchableOpacity
                  style={styles.toggleShowBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.toggleShowIcon}>{showPassword ? '👁️' : '👁️'}</Text>
                  <Text style={styles.toggleShowText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input Field */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Confirm Password / पासवर्ड की पुष्टि करें *</Text>
                {isPasswordMatched && (
                  <Text style={styles.validBadge}>✓ Passwords Match</Text>
                )}
                {isPasswordMismatch && (
                  <Text style={styles.errorBadge}>⚠️ Passwords Mismatch</Text>
                )}
              </View>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === 'confirmPassword' && styles.inputWrapperFocused,
                  isPasswordMatched && styles.inputWrapperValid,
                  isPasswordMismatch && styles.inputWrapperError,
                ]}
              >
                <Text style={styles.inputIcon} pointerEvents="none">🔐</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor="#6f8577"
                />
                <TouchableOpacity
                  style={styles.toggleShowBtn}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.toggleShowIcon}>{showConfirmPassword ? '👁️' : '👁️'}</Text>
                  <Text style={styles.toggleShowText}>
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Metallic Emerald Glow Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.disabledBtn]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {/* Golden Waveform Glow Overlay Effect */}
              <View style={styles.waveformGlowLine} pointerEvents="none" />
              {loading ? (
                <View style={styles.loadingBtnContent}>
                  <ActivityIndicator size="small" color="#faeed6" />
                  <Text style={styles.submitBtnText}> Creating Account...</Text>
                </View>
              ) : (
                <Text style={styles.submitBtnText}>Register as Farmer ➔</Text>
              )}
            </TouchableOpacity>

            {/* Switch Link */}
            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Already registered? </Text>
              <TouchableOpacity onPress={onSwitchToLogin} activeOpacity={0.7}>
                <Text style={styles.switchLink}>Login here (लॉगिन करें)</Text>
              </TouchableOpacity>
            </View>

            {/* 3D Wax Stamps & Security Seals Footer */}
            <View style={styles.stampsRow}>
              <View style={styles.stampItem}>
                <View style={[styles.stampWaxBadge, styles.stampWaxRed]}>
                  <Text style={styles.stampWaxTopText}>256-Bit</Text>
                  <Text style={styles.stampWaxBottomText}>Security</Text>
                  <Text style={styles.stampWaxIcon}>🌾</Text>
                </View>
              </View>

              <View style={styles.stampItem}>
                <View style={[styles.stampWaxBadge, styles.stampWaxGreen]}>
                  <Text style={styles.stampWaxTopText}>APMC</Text>
                  <Text style={styles.stampWaxIcon}>🌾</Text>
                </View>
              </View>

              <View style={styles.stampItem}>
                <View style={[styles.stampWaxBadge, styles.stampWaxBronze]}>
                  <Text style={styles.stampWaxTopText}>Instant</Text>
                  <Text style={styles.stampWaxBottomText}>Pass</Text>
                  <Text style={styles.stampWaxIcon}>🌾</Text>
                </View>
              </View>
            </View>

            {/* Security Footer Labels */}
            <View style={styles.trustBadgesRow}>
              <View style={styles.trustBadge}>
                <Text style={styles.trustIcon}>🔒</Text>
                <Text style={styles.trustText}>256-Bit Encrypted</Text>
              </View>
              <Text style={styles.trustDot}>•</Text>
              <View style={styles.trustBadge}>
                <Text style={styles.trustDotBlue}>🔵</Text>
                <Text style={styles.trustText}>APMC Mandi Verified</Text>
              </View>
              <Text style={styles.trustDot}>•</Text>
              <View style={styles.trustBadge}>
                <Text style={styles.trustIcon}>⚡</Text>
                <Text style={styles.trustText}>Free Gate Pass</Text>
              </View>
            </View>

          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: '#0a2316',
  },
  keyboardViewDark: {
    backgroundColor: '#04120b',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardStackContainer: {
    width: '100%',
    maxWidth: 450,
    alignItems: 'center',
    position: 'relative',
  },
  cardBackingLayer2: {
    position: 'absolute',
    width: '97%',
    height: '98%',
    top: 10,
    backgroundColor: '#194531',
    borderColor: '#2e6349',
    borderWidth: 1.5,
    borderRadius: 28,
    transform: [{ rotate: '-2.5deg' }],
  },
  cardBackingLayer1: {
    position: 'absolute',
    width: '98.5%',
    height: '99%',
    top: 4,
    backgroundColor: '#e6e4d9',
    borderColor: '#d0ccc0',
    borderWidth: 1.5,
    borderRadius: 26,
    transform: [{ rotate: '1.5deg' }],
  },
  crestEmblemAnchor: {
    position: 'absolute',
    top: -24,
    zIndex: 10,
    alignItems: 'center',
  },
  crestEmblemCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#123b28',
    borderColor: '#d97706',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  crestEmblemIcon: {
    fontSize: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#f6f5ef',
    borderRadius: 24,
    padding: 24,
    paddingTop: 28,
    borderWidth: 1.5,
    borderColor: '#d2cebf',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  cardDark: {
    backgroundColor: '#112117',
    borderColor: '#244531',
  },
  topHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  govtVerifyPill: {
    backgroundColor: '#d8e5dc',
    borderColor: '#b4c9bb',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  govtVerifyText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1a3a2a',
    letterSpacing: 0.5,
  },
  themeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6e9e4',
    borderColor: '#b9c4b7',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  themeToggleIcon: {
    fontSize: 13,
  },
  themeSwitchDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#d97706',
  },
  themeSwitchDotDark: {
    backgroundColor: '#3b82f6',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 18,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#7b5a17',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(217, 119, 6, 0.25)',
    textShadowOffset: { width: 1, height: 1.5 },
    textShadowRadius: 2,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2d3f34',
    marginTop: 2,
    textAlign: 'center',
  },
  featuresStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  featureChip: {
    fontSize: 11,
    fontWeight: '700',
    color: '#44574b',
  },
  featureChipDot: {
    fontSize: 11,
    color: '#a2b5a7',
  },
  segmentedTab: {
    flexDirection: 'row',
    backgroundColor: '#e4e7e2',
    borderColor: '#c6cfc4',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: '#f6f7f4',
    borderColor: '#b2c0b0',
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#55685c',
  },
  tabBtnTextActive: {
    color: '#1a3627',
    fontWeight: '900',
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#73500e',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: '#45594d',
    lineHeight: 18,
    fontWeight: '500',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e3328',
  },
  validBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
    backgroundColor: '#dcfeeb',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  errorBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f4f1',
    borderWidth: 1.5,
    borderColor: '#a3b5a8',
    borderRadius: 16,
    paddingHorizontal: 14,
    minHeight: 50,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  inputWrapperFocused: {
    borderColor: '#059669',
    backgroundColor: '#ffffff',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  inputWrapperValid: {
    borderColor: '#16a34a',
  },
  inputWrapperError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e3328',
    marginRight: 8,
  },
  countryCodeDivider: {
    fontSize: 14,
    color: '#a3b5a8',
    marginRight: 4,
  },
  inputIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  toggleShowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  toggleShowIcon: {
    fontSize: 13,
  },
  toggleShowText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e3328',
  },
  submitBtn: {
    width: '100%',
    backgroundColor: '#0f422c',
    borderColor: '#2e7a54',
    borderWidth: 1.5,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 8,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#064e3b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  waveformGlowLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '20%',
    width: '60%',
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderRadius: 10,
    transform: [{ skewX: '-20deg' }],
  },
  disabledBtn: {
    backgroundColor: '#789082',
    borderColor: '#a0b5a8',
    shadowOpacity: 0,
  },
  submitBtnText: {
    color: '#faeed6',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  loadingBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  switchText: {
    fontSize: 13,
    color: '#55685c',
  },
  switchLink: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '900',
  },
  stampsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 22,
    marginBottom: 10,
  },
  stampItem: {
    alignItems: 'center',
  },
  stampWaxBadge: {
    width: 64,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  stampWaxRed: {
    backgroundColor: '#862020',
    borderColor: '#b83b3b',
  },
  stampWaxGreen: {
    backgroundColor: '#1b5b38',
    borderColor: '#3ca669',
  },
  stampWaxBronze: {
    backgroundColor: '#825419',
    borderColor: '#bc8334',
  },
  stampWaxTopText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  stampWaxBottomText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  stampWaxIcon: {
    fontSize: 12,
    marginTop: 1,
  },
  trustBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    gap: 6,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustIcon: {
    fontSize: 12,
  },
  trustDotBlue: {
    fontSize: 10,
  },
  trustText: {
    fontSize: 10,
    color: '#55685c',
    fontWeight: '700',
  },
  trustDot: {
    fontSize: 10,
    color: '#b2c0b0',
  },
});

export default RegisterScreen;
