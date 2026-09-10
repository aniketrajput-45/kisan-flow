import React, { useState } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import BookingScreen from '../screens/BookingScreen';
import BookingDetailsScreen from '../screens/BookingDetailsScreen';
import QueueScreen from '../screens/QueueScreen';
import PaymentScreen from '../screens/PaymentScreen';

export const AppNavigator = () => {
  const { token, loading } = useAuth();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'booking' | 'my-bookings' | 'queue' | 'payment'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedQueueBookingId, setSelectedQueueBookingId] = useState(null);
  const [selectedPaymentBookingId, setSelectedPaymentBookingId] = useState(null);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#047857" />
        <Text style={styles.loadingText}>Loading KisanFlow Farmer Portal...</Text>
      </View>
    );
  }

  // Auth Guard
  if (!token) {
    return (
      <SafeAreaView style={styles.authContainer}>
        {authMode === 'login' ? (
          <LoginScreen onSwitchToRegister={() => setAuthMode('register')} />
        ) : (
          <RegisterScreen onSwitchToLogin={() => setAuthMode('login')} />
        )}
      </SafeAreaView>
    );
  }

  // Main Farmer Application Shell
  return (
    <SafeAreaView style={styles.appContainer}>
      <Navbar currentTab={currentTab} onTabChange={(tab) => setCurrentTab(tab)} />

      <View style={styles.mainContent}>
        {currentTab === 'home' && (
          <HomeScreen
            onBookSlot={() => setCurrentTab('booking')}
            onSelectBooking={(b) => {
              setSelectedBooking(b);
              setCurrentTab('details');
            }}
            onGoToQueue={(bId) => {
              setSelectedQueueBookingId(bId);
              setCurrentTab('queue');
            }}
            onGoToPayment={(bId) => {
              setSelectedPaymentBookingId(bId);
              setCurrentTab('payment');
            }}
          />
        )}

        {currentTab === 'booking' && (
          <BookingScreen
            onBookingCreated={(newBooking) => {
              setSelectedBooking(newBooking);
              setSelectedQueueBookingId(newBooking.id);
              setSelectedPaymentBookingId(newBooking.id);
              setCurrentTab('details');
            }}
          />
        )}

        {currentTab === 'my-bookings' && (
          <HomeScreen
            onBookSlot={() => setCurrentTab('booking')}
            onSelectBooking={(b) => {
              setSelectedBooking(b);
              setCurrentTab('details');
            }}
            onGoToQueue={(bId) => {
              setSelectedQueueBookingId(bId);
              setCurrentTab('queue');
            }}
            onGoToPayment={(bId) => {
              setSelectedPaymentBookingId(bId);
              setCurrentTab('payment');
            }}
          />
        )}

        {currentTab === 'details' && (
          <BookingDetailsScreen
            booking={selectedBooking}
            onBack={() => setCurrentTab('home')}
            onGoToQueue={(bId) => {
              setSelectedQueueBookingId(bId);
              setCurrentTab('queue');
            }}
            onGoToPayment={(bId) => {
              setSelectedPaymentBookingId(bId);
              setCurrentTab('payment');
            }}
          />
        )}

        {currentTab === 'queue' && (
          <QueueScreen
            bookingId={selectedQueueBookingId || selectedBooking?.id}
            onBack={() => setCurrentTab('home')}
            onGoToPayment={(bId) => {
              setSelectedPaymentBookingId(bId);
              setCurrentTab('payment');
            }}
          />
        )}

        {currentTab === 'payment' && (
          <PaymentScreen
            bookingId={selectedPaymentBookingId || selectedBooking?.id}
            onBack={() => setCurrentTab('home')}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#047857',
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  mainContent: {
    flex: 1,
  },
});

export default AppNavigator;
