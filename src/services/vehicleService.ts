// Digital Garage & Predictive Maintenance Service

import { MOCK_VEHICLES, type VehicleItem } from './mockData';

const GARAGE_STORAGE_KEY = 'mech_connect_user_garage';

export const vehicleService = {
  getGarageVehicles: (): VehicleItem[] => {
    if (typeof window === 'undefined') return MOCK_VEHICLES;
    try {
      const stored = localStorage.getItem(GARAGE_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error reading garage vehicles:', e);
    }
    return MOCK_VEHICLES;
  },

  saveGarageVehicles: (vehicles: VehicleItem[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(GARAGE_STORAGE_KEY, JSON.stringify(vehicles));
    } catch (e) {
      console.error('Error saving garage vehicles:', e);
    }
  },

  addVehicle: async (vehicleData: {
    make: string;
    model: string;
    year: string | number;
    mileage: string | number;
    vin?: string;
    licensePlate?: string;
    fuelType?: string;
    trim?: string;
  }): Promise<VehicleItem> => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const mileageNum = parseInt(String(vehicleData.mileage), 10) || 32000;
    let healthScore = 92;
    if (mileageNum > 80000) healthScore -= 15;
    else if (mileageNum > 40000) healthScore -= 8;

    const newVehicle: VehicleItem = {
      id: 'veh-' + Math.random().toString(36).substring(2, 8),
      make: vehicleData.make || 'Toyota',
      model: vehicleData.model || 'Camry',
      year: parseInt(String(vehicleData.year), 10) || 2022,
      trim: vehicleData.trim || 'SE',
      vin: vehicleData.vin || '4T1B11HK5MU' + Math.floor(100000 + Math.random() * 900000),
      licensePlate: vehicleData.licensePlate || '8ABC123',
      mileage: mileageNum,
      healthScore,
      fuelType: vehicleData.fuelType || 'Gasoline',
      batteryHealth: 94,
      status: 'Healthy',
      oilLifePercent: 65,
      brakePadLifePercent: 75,
      tyreTreadPercent: 80,
      image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=600&q=80',
      upcomingServices: [
        { item: 'Full Synthetic Oil & Filter Replacement', dueDate: 'In 4,500 mi', priority: 'Medium' },
        { item: 'Tyre Rotation & Brake Pad Check', dueDate: 'In 4,500 mi', priority: 'Medium' }
      ]
    };

    const current = vehicleService.getGarageVehicles();
    const updated = [newVehicle, ...current];
    vehicleService.saveGarageVehicles(updated);
    return newVehicle;
  },

  deleteVehicle: (vehicleId: string): VehicleItem[] => {
    const current = vehicleService.getGarageVehicles();
    const updated = current.filter((v) => v.id !== vehicleId);
    vehicleService.saveGarageVehicles(updated);
    return updated;
  },

  simulateVinLookup: async (vin: string) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const cleanVin = vin.toUpperCase().trim();

    if (cleanVin.startsWith('5YJ') || cleanVin.includes('TESLA')) {
      return {
        make: 'Tesla',
        model: 'Model 3 Performance',
        year: 2023,
        fuelType: 'Electric',
        engine: 'Dual AC Permanent Magnet Motor',
        drivetrain: 'AWD',
        manufacturedIn: 'Fremont, CA, USA'
      };
    } else if (cleanVin.startsWith('WBA') || cleanVin.includes('BMW')) {
      return {
        make: 'BMW',
        model: 'M340i xDrive',
        year: 2022,
        fuelType: 'Gasoline Turbo',
        engine: '3.0L B58 TwinPower Turbo Inline-6',
        drivetrain: 'AWD',
        manufacturedIn: 'Munich, Germany'
      };
    } else if (cleanVin.startsWith('2T3') || cleanVin.includes('TOYOTA')) {
      return {
        make: 'Toyota',
        model: 'RAV4 Hybrid',
        year: 2021,
        fuelType: 'Hybrid',
        engine: '2.5L 4-Cylinder Hybrid Synergy Drive',
        drivetrain: 'AWD',
        manufacturedIn: 'Georgetown, KY, USA'
      };
    } else {
      return {
        make: 'Honda',
        model: 'Civic Sport Touring',
        year: 2022,
        fuelType: 'Gasoline',
        engine: '1.5L Turbo 4-Cylinder DOHC',
        drivetrain: 'FWD',
        manufacturedIn: 'Alliston, Ontario, Canada'
      };
    }
  }
};
