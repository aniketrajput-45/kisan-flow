import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const Navbar = ({ currentTab, onTabChange, onOpenNotifications, onOpenProfile }) => {
  const { user } = useAuth();
  const { lang, setLang, t } = useLanguage();

  const tabs = [
    { id: 'home', label: t('dashboard'), icon: '🏠' },
    { id: 'my-bookings', label: t('myPasses'), icon: '🎫' },
    { id: 'queue', label: t('liveQueue'), icon: '⏳' },
    { id: 'payment', label: t('payments'), icon: '💰' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          {/* Logo & Brand */}
          <TouchableOpacity
            style={styles.logoRow}
            onPress={() => onTabChange('home')}
            activeOpacity={0.85}
          >
            <View style={styles.logoIcon}>
              <Text style={styles.logoEmoji}>🌾</Text>
            </View>
            <View>
              <Text style={styles.brandTitle}>KisanFlow</Text>
              <Text style={styles.brandSub}>Farmer Portal</Text>
            </View>
          </TouchableOpacity>

          {/* Controls: Language Selector, Notifications, Profile */}
          <View style={styles.controlsRow}>
            {/* Language Selector Pill */}
            <View style={styles.langPill}>
              <TouchableOpacity
                style={[styles.langOption, lang === 'en' && styles.langOptionActive]}
                onPress={() => setLang('en')}
              >
                <Text style={[styles.langText, lang === 'en' && styles.langTextActive]}>EN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langOption, lang === 'hi' && styles.langOptionActive]}
                onPress={() => setLang('hi')}
              >
                <Text style={[styles.langText, lang === 'hi' && styles.langTextActive]}>हिं</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langOption, lang === 'bn' && styles.langOptionActive]}
                onPress={() => setLang('bn')}
              >
                <Text style={[styles.langText, lang === 'bn' && styles.langTextActive]}>বাং</Text>
              </TouchableOpacity>
            </View>

            {/* Notification Bell Icon */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onOpenNotifications}
              activeOpacity={0.8}
            >
              <Text style={styles.btnIcon}>🔔</Text>
              <View style={styles.badgeDot} />
            </TouchableOpacity>

            {/* Profile & Help Trigger */}
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={onOpenProfile}
              activeOpacity={0.8}
            >
              <Text style={styles.profileAvatar}>👨‍🌾</Text>
              <Text style={styles.profileName} numberOfLines={1}>
                {user?.name?.split(' ')[0] || 'Farmer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Navigation Tabs Bar */}
        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => onTabChange(tab.id)}
                style={[
                  styles.tabItem,
                  isActive && styles.tabItemActive
                ]}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#064e3b',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    backgroundColor: '#064e3b',
  },
  topBar: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 18,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 10,
    color: '#a7f3d0',
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langPill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    padding: 2,
  },
  langOption: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
  },
  langOptionActive: {
    backgroundColor: '#10b981',
  },
  langText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d1fae5',
  },
  langTextActive: {
    color: '#ffffff',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  btnIcon: {
    fontSize: 14,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    position: 'absolute',
    top: 4,
    right: 4,
    borderWidth: 1,
    borderColor: '#064e3b',
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  profileAvatar: {
    fontSize: 14,
  },
  profileName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    maxWidth: 65,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#064e3b',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#34d399',
  },
  tabIcon: {
    fontSize: 15,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    color: '#a7f3d0',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
});

export default Navbar;
