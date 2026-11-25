// Emergency SOS Dispatch & Live GPS Tracking Service

export const SOS_STATUSES = {
  IDLE: 'IDLE',
  SEARCHING: 'SEARCHING',
  ASSIGNED: 'ASSIGNED',
  EN_ROUTE: 'EN_ROUTE',
  ARRIVED: 'ARRIVED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;

export type SosStatus = typeof SOS_STATUSES[keyof typeof SOS_STATUSES];

export interface DispatchDriver {
  id: string;
  name: string;
  company: string;
  role: string;
  phone: string;
  vehicle: string;
  rating: number;
  completedRescues: number;
  avatar: string;
  currentLocation: {
    lat: number;
    lng: number;
  };
}

export interface SosChatMessage {
  id: string;
  sender: 'system' | 'driver' | 'user';
  text: string;
  timestamp: string;
}

export interface SosRequest {
  id: string;
  createdAt: string;
  serviceType: string;
  serviceName: string;
  vehicle: string;
  vehicleType?: string;
  vehiclePlate?: string;
  notes: string;
  userLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  status: SosStatus;
  etaMins: number;
  estimatedCost: number;
  assignedDriver: DispatchDriver | null;
  driverPath: Array<{ lat: number; lng: number }>;
  currentStepIndex: number;
  messages: SosChatMessage[];
}

const SOS_STORAGE_KEY = 'mech_connect_active_sos';

export const DEFAULT_DISPATCH_DRIVER: DispatchDriver = {
  id: 'drv-402',
  name: 'Dave Miller',
  company: 'RapidRescue 24/7 Mobile Mechanics',
  role: 'Master Roadside Field Tech',
  phone: '+1 (415) 555-0199',
  vehicle: 'Ford Transit Mobile Workshop (Plate: 8RAPID1)',
  rating: 4.9,
  completedRescues: 840,
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  currentLocation: {
    lat: 37.7850,
    lng: -122.4100
  }
};

export const sosDispatchService = {
  getActiveRequest: (): SosRequest | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(SOS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading SOS request:', e);
    }
    return null;
  },

  saveActiveRequest: (request: SosRequest | null): void => {
    if (typeof window === 'undefined') return;
    try {
      if (!request) {
        localStorage.removeItem(SOS_STORAGE_KEY);
      } else {
        localStorage.setItem(SOS_STORAGE_KEY, JSON.stringify(request));
      }
    } catch (e) {
      console.error('Error saving SOS request:', e);
    }
  },

  createEmergencyRequest: async (formData: {
    serviceType?: string;
    serviceName?: string;
    vehicle?: string;
    vehicleType?: string;
    vehiclePlate?: string;
    notes?: string;
    cost?: number;
    userLocation?: { lat: number; lng: number; address: string };
  }): Promise<SosRequest> => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const userLoc = formData.userLocation || {
      lat: 37.7749,
      lng: -122.4194,
      address: 'Market St & 7th St, San Francisco, CA'
    };

    const newRequest: SosRequest = {
      id: 'SOS-' + Math.floor(100000 + Math.random() * 900000),
      createdAt: new Date().toISOString(),
      serviceType: formData.serviceType || 'Roadside Assistance',
      serviceName: formData.serviceName || 'Emergency Assistance',
      vehicle: formData.vehicle || '2023 Tesla Model Y',
      vehicleType: formData.vehicleType || '🚗 Car / 4-Wheeler',
      vehiclePlate: formData.vehiclePlate || '7XYZ892',
      notes: formData.notes || 'Car disabled on roadside',
      userLocation: userLoc,
      status: SOS_STATUSES.SEARCHING,
      etaMins: 11,
      estimatedCost: formData.cost || 49,
      assignedDriver: null,
      driverPath: [
        { lat: userLoc.lat + 0.013, lng: userLoc.lng + 0.012 },
        { lat: userLoc.lat + 0.009, lng: userLoc.lng + 0.008 },
        { lat: userLoc.lat + 0.006, lng: userLoc.lng + 0.005 },
        { lat: userLoc.lat + 0.003, lng: userLoc.lng + 0.002 },
        { lat: userLoc.lat, lng: userLoc.lng }
      ],
      currentStepIndex: 0,
      messages: [
        {
          id: 'msg-1',
          sender: 'system',
          text: 'Emergency SOS beacon broadcasted. Priority radar alert dispatched to 8 nearby mobile units.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    sosDispatchService.saveActiveRequest(newRequest);
    return newRequest;
  },

  simulateAssignDriver: (request: SosRequest): SosRequest => {
    const updated: SosRequest = {
      ...request,
      status: SOS_STATUSES.ASSIGNED,
      assignedDriver: {
        ...DEFAULT_DISPATCH_DRIVER,
        currentLocation: request.driverPath[0] || DEFAULT_DISPATCH_DRIVER.currentLocation
      },
      messages: [
        ...request.messages,
        {
          id: 'msg-assign',
          sender: 'system',
          text: `Master Mechanic ${DEFAULT_DISPATCH_DRIVER.name} (${DEFAULT_DISPATCH_DRIVER.company}) has accepted your emergency rescue!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        {
          id: 'msg-driver-hello',
          sender: 'driver',
          text: 'I am rolling your way with battery booster, hydraulic jack, and scan tools. Keep your hazard lights on!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    sosDispatchService.saveActiveRequest(updated);
    return updated;
  },

  advanceDriverStep: (request: SosRequest): SosRequest => {
    const nextIndex = Math.min(request.currentStepIndex + 1, request.driverPath.length - 1);
    const isLast = nextIndex === request.driverPath.length - 1;
    const nextStatus: SosStatus = isLast ? SOS_STATUSES.ARRIVED : SOS_STATUSES.EN_ROUTE;
    const remainingSteps = request.driverPath.length - 1 - nextIndex;
    const etaMins = Math.max(1, remainingSteps * 3);

    const updated: SosRequest = {
      ...request,
      status: nextStatus,
      currentStepIndex: nextIndex,
      etaMins,
      assignedDriver: request.assignedDriver ? {
        ...request.assignedDriver,
        currentLocation: request.driverPath[nextIndex]
      } : null,
      messages: isLast && request.status !== SOS_STATUSES.ARRIVED ? [
        ...request.messages,
        {
          id: 'msg-arrived',
          sender: 'system',
          text: 'Mobile Mechanic unit has arrived at your exact location.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ] : request.messages
    };

    sosDispatchService.saveActiveRequest(updated);
    return updated;
  },

  sendChatMessage: (request: SosRequest, text: string): SosRequest => {
    const newMsg: SosChatMessage = {
      id: 'msg-' + Math.random().toString(36).substring(2, 7),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated: SosRequest = {
      ...request,
      messages: [...request.messages, newMsg]
    };

    sosDispatchService.saveActiveRequest(updated);
    return updated;
  },

  cancelEmergency: (request: SosRequest): SosRequest => {
    const updated: SosRequest = {
      ...request,
      status: SOS_STATUSES.CANCELLED,
      messages: [
        ...request.messages,
        {
          id: 'msg-cancel',
          sender: 'system',
          text: 'Emergency request has been cancelled by driver.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    sosDispatchService.saveActiveRequest(null);
    return updated;
  },

  completeEmergency: (request: SosRequest): SosRequest => {
    const updated: SosRequest = {
      ...request,
      status: SOS_STATUSES.COMPLETED,
      messages: [
        ...request.messages,
        {
          id: 'msg-complete',
          sender: 'system',
          text: 'Vehicle rescue completed successfully. Digital receipt generated.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    sosDispatchService.saveActiveRequest(null);
    return updated;
  }
};
