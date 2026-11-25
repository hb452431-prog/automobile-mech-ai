// Mechanic Directory & Appointment Service

import { MOCK_MECHANICS, type MechanicItem } from './mockData';

export interface BookingItem {
  id: string;
  createdAt: string;
  status: 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  mechanicId: string;
  mechanicName: string;
  mechanicAddress: string;
  serviceName: string;
  date: string;
  timeSlot: string;
  vehicleName: string;
  estimatedTotal: number;
}

const BOOKINGS_STORAGE_KEY = 'mech_connect_user_bookings';

const DEFAULT_BOOKINGS: BookingItem[] = [
  {
    id: 'BK-992144',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    mechanicId: 'mech-1',
    mechanicName: 'Apex Precision Automotive & EV Lab',
    mechanicAddress: '450 10th St, SoMa, San Francisco, CA',
    serviceName: 'Full AI Diagnostic & OBD-II Scan',
    date: '2026-11-28',
    timeSlot: '10:30 AM',
    vehicleName: '2023 Tesla Model Y',
    estimatedTotal: 65,
    status: 'CONFIRMED'
  }
];

export const mechanicService = {
  getAllMechanics: (filters: {
    search?: string;
    specialty?: string;
    is247Only?: boolean;
    isMobileOnly?: boolean;
    maxDistance?: number;
    minRating?: number;
    sortBy?: 'rating' | 'distance' | 'price';
  } = {}): MechanicItem[] => {
    let list = [...MOCK_MECHANICS];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.specialties.some((s) => s.toLowerCase().includes(q)) ||
          m.address.toLowerCase().includes(q)
      );
    }

    if (filters.specialty && filters.specialty !== 'all') {
      const spec = filters.specialty.toLowerCase();
      list = list.filter((m) =>
        m.specialties.some((s) => s.toLowerCase().includes(spec))
      );
    }

    if (filters.is247Only) {
      list = list.filter((m) => m.isOpen247);
    }

    if (filters.isMobileOnly) {
      list = list.filter((m) => m.isMobileUnit);
    }

    if (filters.maxDistance) {
      list = list.filter((m) => m.distanceKm <= filters.maxDistance!);
    }

    if (filters.minRating) {
      list = list.filter((m) => m.rating >= filters.minRating!);
    }

    if (filters.sortBy === 'distance') {
      list.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (filters.sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (filters.sortBy === 'price') {
      list.sort((a, b) => a.hourlyRate - b.hourlyRate);
    }

    return list;
  },

  getMechanicById: (id: string): MechanicItem | null => {
    return MOCK_MECHANICS.find((m) => m.id === id) || null;
  },

  createBooking: async (bookingData: {
    mechanicId: string;
    mechanicName: string;
    mechanicAddress: string;
    serviceName: string;
    date: string;
    timeSlot: string;
    vehicleName: string;
    estimatedTotal: number;
  }): Promise<BookingItem> => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const newBooking: BookingItem = {
      id: 'BK-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: new Date().toISOString(),
      status: 'CONFIRMED',
      ...bookingData
    };

    try {
      const existing = mechanicService.getUserBookings();
      const updated = [newBooking, ...existing];
      if (typeof window !== 'undefined') {
        localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.error('Error saving booking:', e);
    }

    return newBooking;
  },

  getUserBookings: (): BookingItem[] => {
    if (typeof window === 'undefined') return DEFAULT_BOOKINGS;
    try {
      const stored = localStorage.getItem(BOOKINGS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading bookings:', e);
    }
    return DEFAULT_BOOKINGS;
  }
};
