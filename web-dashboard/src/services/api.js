import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

// Request interceptor injecting JWT bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kisanflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error routing
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('kisanflow_token');
      localStorage.removeItem('kisanflow_user');
      // If unauthorized and not already on login, redirect
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Fallback in-memory demo data store for uninterrupted presentation
const mockDemoBookings = [
  {
    booking_id: 101,
    token_number: 'BDW-001',
    qr_code: 'KF-BKG-101-BDW-001',
    farmer_name: 'Ramesh Kumar',
    farmer_phone: '9876543210',
    crop: 'Wheat (गेहूँ - Sharbati)',
    booked_quantity_kg: 5000,
    expected_quintals: 50,
    booking_status: 'ARRIVED',
    centre_id: 1,
    centre_name: 'Burdwan Central Procurement Centre (बर्धमान केंद्रीय खरीद केंद्र)',
    centre_code: 'BDW-01',
    slot_id: 1,
    slot_date: '2026-09-10',
    start_time: '10:00:00',
    end_time: '11:00:00',
    vehicle_number: 'WB-39-B-8142 (Tractor Trolley)',
    farmer_aadhaar_last4: '4821',
  },
  {
    booking_id: 102,
    token_number: 'BDW-002',
    qr_code: 'KF-BKG-102-BDW-002',
    farmer_name: 'Gurpreet Singh',
    farmer_phone: '9876543220',
    crop: 'Paddy (धान - Common)',
    booked_quantity_kg: 4200,
    expected_quintals: 42,
    booking_status: 'IN_QUEUE',
    centre_id: 1,
    centre_name: 'Burdwan Central Procurement Centre',
    centre_code: 'BDW-01',
    slot_id: 1,
    slot_date: '2026-09-10',
    start_time: '10:00:00',
    end_time: '11:00:00',
    vehicle_number: 'WB-39-C-1904',
    farmer_aadhaar_last4: '7729',
  },
  {
    booking_id: 103,
    token_number: 'BDW-003',
    qr_code: 'KF-BKG-103-BDW-003',
    farmer_name: 'Rajendra Prasad Patel',
    farmer_phone: '9876543225',
    crop: 'Wheat (गेहूँ - Lokwan)',
    booked_quantity_kg: 3500,
    expected_quintals: 35,
    booking_status: 'BOOKED',
    centre_id: 1,
    centre_name: 'Burdwan Central Procurement Centre',
    centre_code: 'BDW-01',
    slot_id: 2,
    slot_date: '2026-09-10',
    start_time: '11:00:00',
    end_time: '12:00:00',
    vehicle_number: 'WB-39-A-6510',
    farmer_aadhaar_last4: '9012',
  },
];

export const authService = {
  async login(phone, password) {
    try {
      const response = await apiClient.post('/auth/login', { phone, password });
      if (response.data?.success) {
        localStorage.setItem('kisanflow_token', response.data.data.token);
        localStorage.setItem('kisanflow_user', JSON.stringify(response.data.data.user));
        return response.data;
      }
    } catch (err) {
      // Fallback for offline prototype demo
      if (phone === '9876543211' && password === 'password123') {
        const mockOfficer = {
          id: 2,
          name: 'Suresh Sharma',
          phone: '9876543211',
          role: 'OFFICER',
          designation: 'Nodal Procurement Officer (ग्रेड-1)',
          centre_code: 'BDW-01',
          centre_name: 'Burdwan Central Procurement Centre',
        };
        const mockToken = 'mock_jwt_officer_token_' + Date.now();
        localStorage.setItem('kisanflow_token', mockToken);
        localStorage.setItem('kisanflow_user', JSON.stringify(mockOfficer));
        return { success: true, data: { user: mockOfficer, token: mockToken } };
      }
      if (phone === '9876543212' && password === 'password123') {
        const mockAdmin = {
          id: 3,
          name: 'Anita Roy',
          phone: '9876543212',
          role: 'ADMIN',
          designation: 'District Food & Supplies Controller (DFSO)',
        };
        const mockToken = 'mock_jwt_admin_token_' + Date.now();
        localStorage.setItem('kisanflow_token', mockToken);
        localStorage.setItem('kisanflow_user', JSON.stringify(mockAdmin));
        return { success: true, data: { user: mockAdmin, token: mockToken } };
      }
      throw err.response?.data?.error || err.message || 'Invalid credentials';
    }
  },

  getCurrentUser() {
    try {
      const user = localStorage.getItem('kisanflow_user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem('kisanflow_token');
    localStorage.removeItem('kisanflow_user');
  }
};

export const officerService = {
  async lookupBooking(tokenOrQuery) {
    const cleanQuery = (tokenOrQuery || '').trim();
    try {
      const response = await apiClient.get(`/officer/booking/lookup?query=${encodeURIComponent(cleanQuery)}`);
      if (response.data?.success) {
        return response.data.data;
      }
    } catch (err) {
      // Prototype resilient fallback: match token or QR in mock bookings
      const found = mockDemoBookings.find(
        b => b.token_number.toLowerCase() === cleanQuery.toLowerCase() ||
             b.qr_code.toLowerCase() === cleanQuery.toLowerCase() ||
             b.farmer_phone === cleanQuery
      );
      if (found) {
        return found;
      }
      throw err.response?.data?.error || 'No booking found matching token/query';
    }
  },

  async recordProcurement({ booking_id, weight_kg, grade, moisture_pct = 11.2 }) {
    try {
      const response = await apiClient.post('/procurements', {
        booking_id,
        weight_kg: parseFloat(weight_kg),
        grade,
      });
      if (response.data?.success) {
        return response.data.data;
      }
    } catch (err) {
      // Prototype fallback
      const totalAmount = (parseFloat(weight_kg) * 22.75).toFixed(2);
      const mockResult = {
        procurement: {
          id: Math.floor(100 + Math.random() * 900),
          booking_id,
          officer_id: 2,
          weight_kg: parseFloat(weight_kg),
          grade,
          moisture_pct: parseFloat(moisture_pct),
          rate_per_kg: 22.75,
          rate_per_quintal: 2275.00,
          total_amount: parseFloat(totalAmount),
          status: 'COMPLETED',
          created_at: new Date().toISOString(),
        },
        payment: {
          id: Math.floor(1000 + Math.random() * 9000),
          procurement_id: 101,
          booking_id,
          farmer_id: 1,
          amount: parseFloat(totalAmount),
          status: 'RECORDED',
          reference_number: `PAY-2026-${booking_id}-${Date.now()}`,
          updated_at: new Date().toISOString(),
        },
        sms: {
          success: true,
          status: 'SENT',
          phone: '9876543210',
          message: `भारत सरकार खरीद पावती:\nकिसान: Ramesh Kumar\nफसल: Wheat\nवजन: ${weight_kg} kg\nग्रेड: ${grade}\nकुल भुगतान: ₹${totalAmount}\nReply 1 to CONFIRM, 2 to DISPUTE`,
        }
      };
      return mockResult;
    }
  },

  async getKpiData() {
    return {
      totalTokensToday: 48,
      servedTokens: 31,
      pendingTokens: 17,
      procuredWeightTons: 155.8,
      procuredWeightQuintals: 1558,
      totalPayoutToday: '₹35,44,450',
      availableBardanaBags: 3420, // WOW Feature 3 (Jute gunny bags stock)
      allocatedBardanaBags: 1850,
      currentServingToken: 'BDW-031',
      averageServingTimeMins: 9.5,
    };
  }
};

// Admin Service Store & Actions
let mockAdminCentres = [
  {
    id: 1,
    name: 'Burdwan Central Procurement Centre',
    code: 'BDW-01',
    district: 'Paschim Bardhaman',
    capacity: 500,
    current_queue: 14,
    avg_wait_mins: 16,
    status: 'MODERATE', // Yellow dot
    live_token: 'BDW-031',
  },
  {
    id: 2,
    name: 'Durgapur Sub-Division Procurement Centre',
    code: 'DGP-01',
    district: 'Paschim Bardhaman',
    capacity: 400,
    current_queue: 6,
    avg_wait_mins: 8,
    status: 'NORMAL', // Green dot
    live_token: 'DGP-018',
  },
  {
    id: 3,
    name: 'Asansol North Procurement Centre',
    code: 'ASN-01',
    district: 'Paschim Bardhaman',
    capacity: 350,
    current_queue: 38,
    avg_wait_mins: 45,
    status: 'CONGESTED', // Red dot
    live_token: 'ASN-044',
  },
];

let mockDisputes = [
  {
    id: 'PROC-98',
    procurement_id: 98,
    farmer_name: 'Rameshwar Yadav',
    farmer_phone: '9876501122',
    centre_name: 'Burdwan Central Mandi (BDW-01)',
    crop: 'Wheat (Sharbati)',
    weight_kg: 4200,
    issue: 'Officer recorded Grade B at scale; grain certified Sharbati Premium by block agronomist. Farmer replied 2 to SMS.',
    status: 'DISPUTED',
    timestamp: '2026-09-09 16:40 IST',
  },
  {
    id: 'PROC-94',
    procurement_id: 94,
    farmer_name: 'Manjit Singh',
    farmer_phone: '9876503344',
    centre_name: 'Asansol North Mandi (ASN-01)',
    crop: 'Paddy (Common)',
    weight_kg: 5500,
    issue: 'Excess tare weight deducted (180kg). Moisture measured 11.1% but penalised. Disputed via SMS gateway.',
    status: 'DISPUTED',
    timestamp: '2026-09-09 14:15 IST',
  },
];

let mockPaymentEscalations = [
  {
    id: 'BKG-720',
    booking_id: 720,
    farmer_name: 'Tarun Mondal',
    farmer_phone: '9876505566',
    centre_code: 'BDW-01',
    amount: 98450.00,
    days_pending: 6,
    status: 'PROCESSING',
    reason: 'Bank gateway timeout during NEFT batch transmission.',
  }
];

export const adminService = {
  async getOverview(date) {
    try {
      const response = await apiClient.get(`/admin/overview?date=${date || '2026-09-10'}`);
      if (response.data?.success) {
        return response.data.data;
      }
    } catch {
      // Fallback
      return {
        total_farmers: 450,
        active_centres: 3,
        farmers_in_queue: 58,
        total_procured_tons: 91.4,
        total_procured_quintals: 914,
        avg_wait_minutes: 18,
        total_payout_amount: 2079350.00,
        booking_stats: {
          total: 120,
          booked: 35,
          arrived: 22,
          in_queue: 18,
          processing: 8,
          completed: 37,
        },
        payment_stats: {
          recorded: 12,
          initiated: 15,
          processing: 10,
          credited: 37,
        },
        queue_available: true,
      };
    }
  },

  async getCentres() {
    return [...mockAdminCentres];
  },

  async getDisputes() {
    return [...mockDisputes];
  },

  async resolveDispute(procurementId) {
    mockDisputes = mockDisputes.map(d => 
      d.id === procurementId || d.procurement_id === procurementId 
        ? { ...d, status: 'RESOLVED' } 
        : d
    );
    return { success: true };
  },

  async getPaymentEscalations() {
    return [...mockPaymentEscalations];
  },

  async forcePay(bookingId) {
    mockPaymentEscalations = mockPaymentEscalations.map(p => 
      p.id === bookingId || p.booking_id === bookingId 
        ? { ...p, status: 'CREDITED', days_pending: 0 } 
        : p
    );
    return { success: true };
  },

  // WOW Feature 5: Simulate 5-Day Delay
  simulateDelay() {
    const newDelays = [
      {
        id: `BKG-${Math.floor(750 + Math.random() * 50)}`,
        booking_id: Math.floor(750 + Math.random() * 50),
        farmer_name: 'Sukhdev Singh Gill',
        farmer_phone: '9876541188',
        centre_code: 'BDW-01',
        amount: 113750.00,
        days_pending: 7,
        status: 'PROCESSING',
        reason: 'PFMS batch pending state agency clearance (>5 days).',
      },
      {
        id: `BKG-${Math.floor(800 + Math.random() * 50)}`,
        booking_id: Math.floor(800 + Math.random() * 50),
        farmer_name: 'Harishankar Sharma',
        farmer_phone: '9876542299',
        centre_code: 'DGP-01',
        amount: 95550.00,
        days_pending: 6,
        status: 'RECORDED',
        reason: 'Officer scale batch sync stalled; escalated by automated SLA monitor.',
      },
      {
        id: `BKG-${Math.floor(850 + Math.random() * 50)}`,
        booking_id: Math.floor(850 + Math.random() * 50),
        farmer_name: 'Bikas Ranjan Mondal',
        farmer_phone: '9876543300',
        centre_code: 'ASN-01',
        amount: 147875.00,
        days_pending: 8,
        status: 'INITIATED',
        reason: 'NPCI Aadhaar Payment Bridge mapping delayed over 5 working days.',
      },
    ];

    mockPaymentEscalations = [...newDelays, ...mockPaymentEscalations];
    return [...mockPaymentEscalations];
  }
};

