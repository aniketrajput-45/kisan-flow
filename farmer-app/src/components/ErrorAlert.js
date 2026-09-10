import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const ErrorAlert = ({ error, onRetry, onDismiss }) => {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message || 'An error occurred';
  const statusCode = error.status ? `[HTTP ${error.status}] ` : '';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{statusCode}Action Failed</Text>
        <Text style={styles.message}>{errorMessage}</Text>
      </View>
      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
            <Text style={styles.dismissBtnText}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontWeight: '700',
    color: '#991b1b',
    fontSize: 13,
    marginBottom: 2,
  },
  message: {
    color: '#b91c1c',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  retryBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  dismissBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dismissBtnText: {
    color: '#7f1d1d',
    fontSize: 12,
  },
});

export default ErrorAlert;
