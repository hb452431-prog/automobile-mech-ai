// Emergency Request & Tracking Service for Partner Mechanics

export interface EmergencyRequestItem {
  id: string;
  userName: string;
  userPhone: string;
  vehicleType: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePlate: string;
  problem: string;
  problemType: string;
  urgency: string;
  notes: string;
  distance: string;
  location: string;
  time: string;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED';
  lat: number;
  lng: number;
}

export interface CompletedRequestItem {
  id: string;
  userName: string;
  vehicleType: string;
  problem: string;
  date: string;
  garage: string;
  fee: string;
}

const REQUESTS_STORAGE_KEY = 'mech_connect_emergency_requests';
const COMPLETED_STORAGE_KEY = 'mech_connect_completed_requests';

const INITIAL_ACTIVE_REQUESTS: EmergencyRequestItem[] = [
  {
    id: 'REQ-101',
    userName: 'Sarah Jenkins',
    userPhone: '+1 555-9821',
    vehicleType: '🚗 Car / 4-Wheeler',
    vehicleBrand: 'Toyota',
    vehicleModel: 'Camry',
    vehiclePlate: 'CA-9ABC12',
    problem: 'Flat Tyre on roadside',
    problemType: 'Flat Tyre',
    urgency: '⚡ Highway / Danger Zone',
    notes: 'Front right tyre blown on bridge approach, hazard lights on',
    distance: '1.4 km',
    location: '450 10th St, Downtown',
    time: '5 mins ago',
    status: 'PENDING',
    lat: 37.7749,
    lng: -122.4194
  },
  {
    id: 'REQ-102',
    userName: 'Michael Chang',
    userPhone: '+1 555-3344',
    vehicleType: '🏍️ Bike / 2-Wheeler',
    vehicleBrand: 'Yamaha',
    vehicleModel: 'MT-07',
    vehiclePlate: 'CA-2MOTO5',
    problem: 'Battery dead / won\'t crank',
    problemType: 'Battery Problem',
    urgency: '🟡 Roadside Breakdown',
    notes: 'Ignition clicking, starter motor not turning over',
    distance: '2.1 km',
    location: '780 Mission Street',
    time: '12 mins ago',
    status: 'PENDING',
    lat: 37.7810,
    lng: -122.4110
  }
];

const INITIAL_COMPLETED_REQUESTS: CompletedRequestItem[] = [
  {
    id: 'REQ-098',
    userName: 'Elena Gomez',
    vehicleType: '🚗 Car / 4-Wheeler',
    problem: 'Jumpstart & 12V Battery Check',
    date: 'Yesterday, 4:30 PM',
    garage: 'Apex Auto Care & Diagnostics',
    fee: '$49.00'
  },
  {
    id: 'REQ-095',
    userName: 'Robert Taylor',
    vehicleType: '🚚 Heavy Commercial',
    problem: 'Emergency Flat Tyre Replacement',
    date: '20 Sep 2026',
    garage: 'Apex Auto Care & Diagnostics',
    fee: '$55.00'
  }
];

export const emergencyService = {
  getActiveRequests: (): EmergencyRequestItem[] => {
    if (typeof window === 'undefined') return INITIAL_ACTIVE_REQUESTS;
    try {
      const data = localStorage.getItem(REQUESTS_STORAGE_KEY);
      return data ? JSON.parse(data) : INITIAL_ACTIVE_REQUESTS;
    } catch (e) {
      return INITIAL_ACTIVE_REQUESTS;
    }
  },

  saveActiveRequests: (requests: EmergencyRequestItem[]): EmergencyRequestItem[] => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
    }
    return requests;
  },

  getCompletedRequests: (): CompletedRequestItem[] => {
    if (typeof window === 'undefined') return INITIAL_COMPLETED_REQUESTS;
    try {
      const data = localStorage.getItem(COMPLETED_STORAGE_KEY);
      return data ? JSON.parse(data) : INITIAL_COMPLETED_REQUESTS;
    } catch (e) {
      return INITIAL_COMPLETED_REQUESTS;
    }
  },

  saveCompletedRequests: (completed: CompletedRequestItem[]): CompletedRequestItem[] => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(completed));
    }
    return completed;
  },

  acceptRequest: (reqId: string, mechanicInfo?: any): EmergencyRequestItem[] => {
    const active = emergencyService.getActiveRequests();
    const updated = active.map((r) => (r.id === reqId ? { ...r, status: 'ACCEPTED' as const } : r));
    emergencyService.saveActiveRequests(updated);
    return updated;
  },

  rejectRequest: (reqId: string): EmergencyRequestItem[] => {
    const active = emergencyService.getActiveRequests();
    const updated = active.filter((r) => r.id !== reqId);
    emergencyService.saveActiveRequests(updated);
    return updated;
  },

  completeRequest: (reqId: string): EmergencyRequestItem[] => {
    const active = emergencyService.getActiveRequests();
    const req = active.find((r) => r.id === reqId);
    if (req) {
      const completed = emergencyService.getCompletedRequests();
      const newCompleted: CompletedRequestItem = {
        id: req.id,
        userName: req.userName,
        vehicleType: req.vehicleType,
        problem: req.problem,
        date: 'Just now',
        garage: 'Apex Auto Care & Diagnostics',
        fee: '$49.00'
      };
      emergencyService.saveCompletedRequests([newCompleted, ...completed]);
    }
    const updated = active.filter((r) => r.id !== reqId);
    emergencyService.saveActiveRequests(updated);
    return updated;
  }
};
