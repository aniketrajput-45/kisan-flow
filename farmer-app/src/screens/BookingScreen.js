import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { getCentres } from '../api/centres';
import { getSlots } from '../api/slots';
import { createBooking } from '../api/bookings';
import ErrorAlert from '../components/ErrorAlert';

const CROPS = [
  { id: 'WHEAT', name: 'Wheat (गेहूं)', icon: '🌾' },
  { id: 'PADDY', name: 'Paddy / Rice (धान)', icon: '🌾' },
  { id: 'MUSTARD', name: 'Mustard (सरसों)', icon: '🌱' },
  { id: 'GRAM', name: 'Gram / Chana (चना)', icon: '🫘' },
  { id: 'COTTON', name: 'Cotton (कपास)', icon: '☁️' },
  { id: 'SUGARCANE', name: 'Sugarcane (गन्ना)', icon: '🎋' },
  { id: 'MAIZE', name: 'Maize / Corn (मक्का)', icon: '🌽' },
  { id: 'SOYBEAN', name: 'Soybean (सोयाबीन)', icon: '🫛' },
  { id: 'PULSES', name: 'Pulses / Tur (दाल / तुअर)', icon: '🫘' },
  { id: 'GROUNDNUT', name: 'Groundnut (मूंगफली)', icon: '🥜' },
  { id: 'POTATO', name: 'Potato (आलू)', icon: '🥔' },
  { id: 'ONION', name: 'Onion (प्याज)', icon: '🧅' },
  { id: 'BARLEY', name: 'Barley (जौ)', icon: '🌾' },
  { id: 'BAJRA', name: 'Bajra (बाजरा)', icon: '🌾' },
  { id: 'JOWAR', name: 'Jowar (ज्वार)', icon: '🌾' },
  { id: 'OTHER', name: 'Other Crop (अन्य फसल / manual)', icon: '✍️' },
];

const SUGGESTED_CUSTOM_CROPS = [
  'Sunflower (सूरजमुखी)',
  'Jute (पटसन)',
  'Sesame (तिल)',
  'Garlic (लहसुन)',
  'Chilli (मिर्च)',
  'Coriander (धनिया)',
  'Turmeric (हल्दी)',
  'Jeera (जीरा)',
];

const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Helper to generate 7-column calendar matrix for given year & month (month is 0-indexed)
const getCalendarMatrix = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay(); // 0 = Sun, ...
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks = [];
  let dayCount = 1;

  for (let weekIndex = 0; weekIndex < 6; weekIndex++) {
    const days = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      if ((weekIndex === 0 && dayIndex < startDayOfWeek) || dayCount > daysInMonth) {
        days.push(null);
      } else {
        const mStr = String(month + 1).padStart(2, '0');
        const dStr = String(dayCount).padStart(2, '0');
        days.push({
          dayNumber: dayCount,
          isoDate: `${year}-${mStr}-${dStr}`,
        });
        dayCount++;
      }
    }
    weeks.push(days);
    if (dayCount > daysInMonth) break;
  }

  return weeks;
};

const formatDateForDisplay = (isoStr) => {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length !== 3) return isoStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const dateObj = new Date(y, m, d);

  if (isNaN(dateObj.getTime())) return isoStr;

  const todayStr = new Date().toISOString().split('T')[0];
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  const tomStr = tom.toISOString().split('T')[0];

  let prefix = '';
  if (isoStr === todayStr) prefix = 'Today, ';
  else if (isoStr === tomStr) prefix = 'Tomorrow, ';

  const dayName = FULL_DAY_NAMES[dateObj.getDay()];
  const monthName = FULL_MONTH_NAMES[dateObj.getMonth()];

  return `${prefix}${d} ${monthName} ${y} (${dayName})`;
};

export const BookingScreen = ({ onBookingCreated, onGoToMyBookings }) => {
  const [step, setStep] = useState(1);
  const [crop, setCrop] = useState('WHEAT');
  const [customCrop, setCustomCrop] = useState('');
  const [quantityKg, setQuantityKg] = useState('4800');
  
  const [centres, setCentres] = useState([]);
  const [selectedCentre, setSelectedCentre] = useState(null);
  
  // Set default date to active backend schedule date (2026-09-10)
  const defaultDateIso = '2026-09-10';
  const [selectedDate, setSelectedDate] = useState(defaultDateIso);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(8); // September (0-indexed 8)

  const calendarMatrix = React.useMemo(() => getCalendarMatrix(calYear, calMonth), [calYear, calMonth]);

  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  const handleQuickJump = (daysAhead) => {
    const d = new Date(2026, 8, 10);
    d.setDate(d.getDate() + daysAhead);
    const y = d.getFullYear();
    const m = d.getMonth();
    const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setCalYear(y);
    setCalMonth(m);
    setSelectedDate(iso);
    setIsCalendarOpen(false);
  };

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Centres on Mount
  useEffect(() => {
    fetchCentres();
  }, []);

  const fetchCentres = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCentres();
      const centreList = res.data || res.centres || res || [];
      if (Array.isArray(centreList) && centreList.length > 0) {
        setCentres(centreList);
        setSelectedCentre(centreList[0]);
      } else {
        setCentres([]);
        setSelectedCentre(null);
      }
    } catch (err) {
      if (err?.status === 401) return;
      setError(err.message || 'Failed to load procurement centres from backend.');
      setCentres([]);
      setSelectedCentre(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Slots when Centre or Date changes
  useEffect(() => {
    if (selectedCentre && selectedDate) {
      fetchSlots(selectedCentre.id, selectedDate);
    }
  }, [selectedCentre, selectedDate]);

  const fetchSlots = async (centreId, dateStr) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSlots(centreId, dateStr);
      const slotList = res.data || res.slots || res || [];
      if (Array.isArray(slotList) && slotList.length > 0) {
        setSlots(slotList);
        setSelectedSlot(slotList[0]);
      } else {
        setSlots([]);
        setSelectedSlot(null);
      }
    } catch (err) {
      if (err?.status === 401) return;
      setError(err.message || 'Failed to load available slots for this date.');
      setSlots([]);
      setSelectedSlot(null);
    } finally {
      setLoading(false);
    }
  };

  const finalCropName = crop === 'OTHER' ? (customCrop.trim() || 'Custom Crop') : crop;
  const isStep1Valid = Boolean(crop) && (crop !== 'OTHER' || customCrop.trim().length > 0) && Number(quantityKg || 0) > 0;

  const handleBookingSubmit = async () => {
    if (!selectedCentre || !selectedSlot || !finalCropName || !quantityKg) {
      setError('Please ensure centre, slot, crop, and quantity are selected.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      /**
       * CRITICAL CONSTITUTION RULE:
       * Request payload MUST ONLY contain: centre_id, slot_id, crop, quantity_kg.
       */
      const res = await createBooking({
        centre_id: selectedCentre.id,
        slot_id: selectedSlot.id,
        crop: finalCropName,
        quantity_kg: Number(quantityKg),
      });

      const newBooking = res.data || res.booking || res;
      setLoading(false);

      if (onBookingCreated) {
        onBookingCreated(newBooking);
      }
    } catch (err) {
      setLoading(false);
      if (err?.status === 401) return;
      
      const errMsg = err?.message || (typeof err === 'string' ? err : '');
      const isDuplicateError = errMsg.toLowerCase().includes('already have an active booking');
      
      if (isDuplicateError) {
        setError({
          ...err,
          isDuplicate: true,
          message: 'You already have an active procurement token pass for this slot.',
        });
      } else {
        setError(err);
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Book Procurement Slot</Text>
        <Text style={styles.subtitle}>
          Reserve your token and arrival time slot at government procurement centres
        </Text>
      </View>

      {/* Progress Steps */}
      <View style={styles.progressRow}>
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={[
              styles.progressBar,
              step >= s ? styles.progressBarActive : styles.progressBarInactive
            ]}
          />
        ))}
      </View>

      {error?.isDuplicate ? (
        <View style={styles.duplicateAlertCard}>
          <Text style={styles.duplicateAlertTitle}>⚠️ Active Booking Exists</Text>
          <Text style={styles.duplicateAlertMsg}>
            You already have an active procurement token pass reserved for this slot at {selectedCentre?.name}.
          </Text>
          <View style={styles.duplicateActionsRow}>
            {onGoToMyBookings && (
              <TouchableOpacity style={styles.viewPassBtn} onPress={onGoToMyBookings} activeOpacity={0.8}>
                <Text style={styles.viewPassBtnText}>🎫 View My Active Booking Pass</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.pickOtherBtn} onPress={() => setError(null)} activeOpacity={0.8}>
              <Text style={styles.pickOtherBtnText}>Select Different Date/Slot</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ErrorAlert error={error} onDismiss={() => setError(null)} />
      )}

      {/* STEP 1: Crop & Quantity */}
      {step === 1 && (
        <View style={styles.card}>
          <Text style={styles.stepTitle}>Step 1: Select Crop & Quantity</Text>

          {/* Crop Grid */}
          <View style={styles.sectionMargin}>
            <Text style={styles.label}>Select Crop Type (फसल का प्रकार चुनें)</Text>
            <View style={styles.cropGrid}>
              {CROPS.map((c) => {
                const isSelected = crop === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setCrop(c.id)}
                    style={[styles.cropBtn, isSelected && styles.cropBtnSelected]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cropIcon}>{c.icon}</Text>
                    <Text style={[styles.cropText, isSelected && styles.cropTextSelected]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Custom Crop Manual Text Box */}
          <View style={[styles.customCropContainer, crop === 'OTHER' && styles.customCropContainerActive]}>
            <View style={styles.customCropHeader}>
              <Text style={styles.customCropTitle}>
                ✍️ Type Unlisted Crop Name (यदि आपकी फसल ऊपर नहीं है तो यहाँ नाम दर्ज करें)
              </Text>
              <Text style={styles.customCropSub}>
                Enter any crop name manually if not in the options list above
              </Text>
            </View>

            <TextInput
              style={styles.customCropInput}
              placeholder="Type your crop name (e.g. Barley, Jowar, Sunflower, Chilli...)"
              value={customCrop}
              onChangeText={(txt) => {
                setCustomCrop(txt);
                if (txt.trim().length > 0) {
                  setCrop('OTHER');
                }
              }}
              onFocus={() => setCrop('OTHER')}
              placeholderTextColor="#94a3b8"
            />

            {/* Quick Suggestion Pills */}
            <Text style={styles.suggestionLabel}>Popular Suggestions / लोकप्रिय विकल्प:</Text>
            <View style={styles.suggestionRow}>
              {SUGGESTED_CUSTOM_CROPS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.suggestionPill}
                  onPress={() => {
                    setCrop('OTHER');
                    setCustomCrop(item.split(' ')[0]);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionText}>+ {item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quantity Section */}
          <View style={styles.sectionMargin}>
            <Text style={styles.label}>Quantity in Kilograms (मात्रा किलोग्राम में)</Text>
            <View style={styles.quantityRow}>
              <TextInput
                style={styles.quantityInput}
                value={quantityKg}
                onChangeText={setQuantityKg}
                placeholder="e.g. 4800"
                keyboardType="numeric"
                placeholderTextColor="#94a3b8"
              />
              <Text style={styles.quintalText}>
                kg ({(Number(quantityKg || 0) / 100).toFixed(1)} Quintals)
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, !isStep1Valid && styles.disabledBtn]}
            onPress={() => setStep(2)}
            disabled={!isStep1Valid}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Next: Select Procurement Centre →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* STEP 2: Procurement Centre Selection */}
      {step === 2 && (
        <View style={styles.card}>
          <Text style={styles.stepTitle}>Step 2: Select Procurement Centre (क्रय केंद्र)</Text>

          {/* Selected Crop Summary Pill */}
          <View style={styles.selectedSummaryBar}>
            <Text style={styles.summaryText}>
              🌾 Selected Crop: <Text style={styles.summaryHighlight}>{finalCropName}</Text> | Quantity: <Text style={styles.summaryHighlight}>{quantityKg} kg</Text>
            </Text>
          </View>

          {loading && centres.length === 0 ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#059669" />
              <Text style={styles.loadingText}>Loading procurement centres from backend...</Text>
            </View>
          ) : (
            <View style={styles.centreList}>
              {centres.map((centre) => {
                const isSelected = selectedCentre?.id === centre.id;
                return (
                  <TouchableOpacity
                    key={centre.id}
                    onPress={() => setSelectedCentre(centre)}
                    style={[styles.centreRow, isSelected && styles.centreRowSelected]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.centreName}>{centre.name}</Text>
                      <Text style={styles.centreMeta}>
                        District: {centre.district}, {centre.state} | Capacity: {centre.capacity || 500}
                      </Text>
                    </View>
                    {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(1)}>
              <Text style={styles.secondaryBtnText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, { flex: 2 }, !selectedCentre && styles.disabledBtn]}
              onPress={() => setStep(3)}
              disabled={!selectedCentre}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Next: Select Time Slot →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STEP 3: Slot Selection & Final Submission */}
      {step === 3 && (
        <View style={styles.card}>
          <Text style={styles.stepTitle}>Step 3: Choose Date & Available Slot</Text>

          {/* Summary */}
          <View style={styles.selectedSummaryBar}>
            <Text style={styles.summaryText}>
              🌾 Crop: <Text style={styles.summaryHighlight}>{finalCropName}</Text> | Centre: <Text style={styles.summaryHighlight}>{selectedCentre?.name}</Text>
            </Text>
          </View>

          {/* Calendar Date Picker Dropdown (Single Unified Component) */}
          <View style={styles.sectionMargin}>
            <Text style={styles.label}>
              📅 Select Procurement Date (क्रय की तिथि का चयन करें)
            </Text>

            {/* Dropdown Calendar Trigger Box */}
            <TouchableOpacity
              style={[styles.calendarTrigger, isCalendarOpen && styles.calendarTriggerActive]}
              onPress={() => setIsCalendarOpen(!isCalendarOpen)}
              activeOpacity={0.85}
            >
              <View style={styles.calendarTriggerLeft}>
                <View style={styles.calendarIconBadge}>
                  <Text style={styles.calendarIconText}>📅</Text>
                </View>
                <View>
                  <Text style={styles.calendarTriggerSub}>Selected Date (चुनी गई तिथि):</Text>
                  <Text style={styles.calendarTriggerTitle}>
                    {formatDateForDisplay(selectedDate)}
                  </Text>
                </View>
              </View>
              <View style={styles.calendarTriggerBtn}>
                <Text style={styles.calendarTriggerBtnText}>
                  {isCalendarOpen ? '▲ Close' : '📅 Pick Date ▼'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Visual Calendar Dropdown Card */}
            {isCalendarOpen && (
              <View style={styles.calendarCard}>
                {/* Month Navigation Header */}
                <View style={styles.monthHeader}>
                  <TouchableOpacity
                    style={styles.monthNavBtn}
                    onPress={handlePrevMonth}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.monthNavText}>‹ Prev</Text>
                  </TouchableOpacity>

                  <Text style={styles.monthTitle}>
                    {FULL_MONTH_NAMES[calMonth]} {calYear}
                  </Text>

                  <TouchableOpacity
                    style={styles.monthNavBtn}
                    onPress={handleNextMonth}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.monthNavText}>Next ›</Text>
                  </TouchableOpacity>
                </View>

                {/* Weekdays Row */}
                <View style={styles.weekdaysRow}>
                  {WEEKDAY_HEADERS.map((dayHeader) => (
                    <Text key={dayHeader} style={styles.weekdayText}>
                      {dayHeader}
                    </Text>
                  ))}
                </View>

                {/* Calendar Days Matrix */}
                <View style={styles.matrixContainer}>
                  {calendarMatrix.map((week, wIdx) => (
                    <View key={wIdx} style={styles.weekRow}>
                      {week.map((cell, dIdx) => {
                        if (!cell) {
                          return <View key={dIdx} style={styles.emptyDayCell} />;
                        }

                        const isPast = cell.isoDate < todayIso;
                        const isSelected = cell.isoDate === selectedDate;
                        const isToday = cell.isoDate === todayIso;

                        return (
                          <TouchableOpacity
                            key={cell.isoDate}
                            disabled={isPast}
                            onPress={() => {
                              setSelectedDate(cell.isoDate);
                              setIsCalendarOpen(false);
                            }}
                            style={[
                              styles.dayCell,
                              isPast && styles.dayCellPast,
                              isToday && styles.dayCellToday,
                              isSelected && styles.dayCellSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.dayCellText,
                                isPast && styles.dayCellTextPast,
                                isToday && styles.dayCellTextToday,
                                isSelected && styles.dayCellTextSelected,
                              ]}
                            >
                              {cell.dayNumber}
                            </Text>
                            {isToday && !isSelected && (
                              <Text style={styles.todayDot}>•</Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>

                {/* Quick Selection Shortcuts Bar */}
                <View style={styles.quickShortcutsRow}>
                  <Text style={styles.quickShortcutsLabel}>Quick Jump:</Text>
                  <TouchableOpacity
                    style={[styles.shortcutBtn, selectedDate === todayIso && styles.shortcutBtnActive]}
                    onPress={() => handleQuickJump(0)}
                  >
                    <Text style={[styles.shortcutText, selectedDate === todayIso && styles.shortcutTextActive]}>
                      Today
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shortcutBtn}
                    onPress={() => handleQuickJump(1)}
                  >
                    <Text style={styles.shortcutText}>Tomorrow</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shortcutBtn}
                    onPress={() => handleQuickJump(7)}
                  >
                    <Text style={styles.shortcutText}>+1 Week</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shortcutBtn}
                    onPress={() => handleQuickJump(14)}
                  >
                    <Text style={styles.shortcutText}>+2 Weeks</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={styles.sectionMargin}>
            <Text style={styles.label}>
              Available Time Slots at {selectedCentre?.name}
            </Text>

            {loading && slots.length === 0 ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color="#059669" />
                <Text style={styles.loadingText}>Fetching backend slot availability...</Text>
              </View>
            ) : slots.length === 0 ? (
              <View style={styles.noSlotsBox}>
                <Text style={styles.noSlotsText}>
                  No slots available for the selected date. Please pick a different date.
                </Text>
              </View>
            ) : (
              <View style={styles.slotGrid}>
                {slots.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  const availableSeats = slot.available_seats !== undefined ? slot.available_seats : (slot.available_count !== undefined ? slot.available_count : (slot.capacity - (slot.booked_count || 0)));
                  const isFull = availableSeats <= 0;
                  const isAlreadyBooked = Boolean(slot.is_already_booked);

                  return (
                    <TouchableOpacity
                      key={slot.id}
                      disabled={isFull || isAlreadyBooked}
                      onPress={() => setSelectedSlot(slot)}
                      style={[
                        styles.slotBtn,
                        isSelected && styles.slotBtnSelected,
                        isFull && styles.slotBtnFull,
                        isAlreadyBooked && styles.slotBtnBooked,
                      ]}
                    >
                      <Text style={[styles.slotTime, isFull && styles.slotTimeFull, isAlreadyBooked && styles.slotTimeBooked]}>
                        {slot.start_time} - {slot.end_time}
                      </Text>
                      <Text style={[styles.slotMeta, isAlreadyBooked ? styles.slotBookedText : (isFull ? styles.slotFullText : styles.slotAvailText)]}>
                        {isAlreadyBooked ? '✓ Already Booked by You' : (isFull ? 'SLOT FULL' : `${availableSeats} seats available`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(2)}>
              <Text style={styles.secondaryBtnText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, { flex: 2 }, (loading || !selectedSlot) && styles.disabledBtn]}
              onPress={handleBookingSubmit}
              disabled={loading || !selectedSlot}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? 'Confirming...' : 'Confirm & Generate Token'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  progressBarActive: {
    backgroundColor: '#059669',
  },
  progressBarInactive: {
    backgroundColor: '#e2e8f0',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  sectionMargin: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  cropGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cropBtn: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cropBtnSelected: {
    borderWidth: 2,
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  cropIcon: {
    fontSize: 20,
  },
  cropText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  cropTextSelected: {
    color: '#047857',
    fontWeight: '700',
  },
  customCropContainer: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  customCropContainerActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  customCropHeader: {
    marginBottom: 8,
  },
  customCropTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  customCropSub: {
    fontSize: 11,
    color: '#15803d',
    marginTop: 2,
  },
  customCropInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 10,
  },
  suggestionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 6,
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionPill: {
    backgroundColor: '#ffffff',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  suggestionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803d',
  },
  selectedSummaryBar: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 12,
    color: '#064e3b',
  },
  summaryHighlight: {
    fontWeight: '800',
    color: '#047857',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  quintalText: {
    fontWeight: '600',
    color: '#64748b',
    fontSize: 13,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  centreList: {
    gap: 12,
    marginBottom: 20,
  },
  centreRow: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  centreRowSelected: {
    borderWidth: 2,
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  centreName: {
    fontWeight: '700',
    fontSize: 15,
    color: '#0f172a',
  },
  centreMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  checkIcon: {
    fontSize: 18,
    color: '#059669',
    fontWeight: '800',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotBtn: {
    width: '48%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  slotBtnSelected: {
    borderWidth: 2,
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  slotBtnFull: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  slotTime: {
    fontWeight: '700',
    fontSize: 14,
    color: '#0f172a',
  },
  slotTimeFull: {
    color: '#9ca3af',
  },
  slotMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  slotAvailText: {
    color: '#059669',
  },
  slotFullText: {
    color: '#ef4444',
  },
  noSlotsBox: {
    padding: 16,
    backgroundColor: '#fffbe6',
    borderRadius: 10,
  },
  noSlotsText: {
    color: '#b45309',
    fontSize: 13,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  secondaryBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledBtn: {
    backgroundColor: '#94a3b8',
  },
  loadingBox: {
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 13,
  },

  // Calendar Selector Styles
  calendarTrigger: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#059669',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    elevation: 2,
  },
  calendarTriggerActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#047857',
  },
  calendarTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  calendarIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIconText: {
    fontSize: 20,
  },
  calendarTriggerSub: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  calendarTriggerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#064e3b',
    marginTop: 2,
  },
  calendarTriggerBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  calendarTriggerBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  calendarCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#059669',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    elevation: 4,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  monthNavBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  monthNavText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: '#047857',
  },
  matrixContainer: {
    gap: 4,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyDayCell: {
    width: '14.28%',
    height: 38,
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  dayCellPast: {
    opacity: 0.35,
    backgroundColor: '#f8fafc',
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#059669',
  },
  dayCellSelected: {
    backgroundColor: '#059669',
  },
  dayCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  dayCellTextPast: {
    color: '#94a3b8',
  },
  dayCellTextToday: {
    fontWeight: '800',
    color: '#047857',
  },
  dayCellTextSelected: {
    color: '#ffffff',
    fontWeight: '800',
  },
  todayDot: {
    fontSize: 12,
    color: '#059669',
    marginTop: -6,
    fontWeight: '900',
  },
  quickShortcutsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexWrap: 'wrap',
  },
  quickShortcutsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginRight: 2,
  },
  shortcutBtn: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  shortcutBtnActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#059669',
  },
  shortcutText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  shortcutTextActive: {
    color: '#047857',
  },
  duplicateAlertCard: {
    backgroundColor: '#fffbe6',
    borderColor: '#ffe58f',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  duplicateAlertTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#d46b08',
    marginBottom: 4,
  },
  duplicateAlertMsg: {
    fontSize: 13,
    color: '#873800',
    lineHeight: 18,
    marginBottom: 12,
  },
  duplicateActionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  viewPassBtn: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  viewPassBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  pickOtherBtn: {
    backgroundColor: '#ffffff',
    borderColor: '#d9d9d9',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pickOtherBtnText: {
    color: '#595959',
    fontSize: 12,
    fontWeight: '600',
  },
  slotBtnBooked: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
    borderWidth: 1.5,
    opacity: 0.85,
  },
  slotTimeBooked: {
    color: '#166534',
    fontWeight: '700',
  },
  slotBookedText: {
    color: '#15803d',
    fontWeight: '700',
  },
});

export default BookingScreen;
