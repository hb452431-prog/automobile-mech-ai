// AI Diagnostic Engine with NLP, Acoustic analysis, OBD-II decoder, and Dashboard scanner

import { MOCK_OBD_CODES, MOCK_ACOUSTIC_SAMPLES, MOCK_WARNING_LIGHTS, type ObdCodeItem, type AcousticSampleItem, type WarningLightItem } from './mockData';

export interface DiagnosticResult {
  title: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  severityColor: string;
  confidenceScore: number;
  explanation: string;
  canDrive: string;
  diySafety: string;
  estimatedCost: string;
  troubleshootingSteps: string[];
  relatedDtc: string | null;
}

const SYMPTOM_KNOWLEDGE_BASE: Array<{
  keywords: string[];
  title: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  severityColor: string;
  confidenceScore: number;
  explanation: string;
  canDrive: string;
  diySafety: string;
  estimatedCost: string;
  troubleshootingSteps: string[];
  relatedDtc: string | null;
}> = [
  {
    keywords: ['shake', 'shaking', 'vibrate', 'vibration', 'brake', 'braking', 'pedal'],
    title: 'Warped Brake Rotors & Uneven Pad Wear',
    category: 'Brakes & Suspension',
    severity: 'Medium',
    severityColor: 'amber',
    confidenceScore: 96.2,
    explanation: 'Vibrations felt through the steering wheel or brake pedal specifically during deceleration are almost always caused by lateral runout (warped brake rotors) or uneven brake pad resin transfer.',
    canDrive: 'Yes (Safe for low speeds, but increases stopping distance in emergency braking)',
    diySafety: 'Moderate (Wheel removal & rotor replacement with torque wrench)',
    estimatedCost: '$190 - $380',
    troubleshootingSteps: [
      'Inspect brake disc rotor surface for deep blue heat discoloration or grooves.',
      'Measure brake rotor runout using a dial indicator gauge (< 0.05mm is normal).',
      'Check caliper guide slide pins for seized grease or stuck rubber boots.',
      'Replace front brake pads and resurface or replace brake rotors in pairs.'
    ],
    relatedDtc: 'C0035'
  },
  {
    keywords: ['white smoke', 'smoke', 'steam', 'overheating', 'sweet smell', 'coolant'],
    title: 'Blown Cylinder Head Gasket / Internal Coolant Leak',
    category: 'Engine Internal & Cooling',
    severity: 'Critical',
    severityColor: 'rose',
    confidenceScore: 98.4,
    explanation: 'Thick billowy sweet-smelling white smoke from the exhaust indicates coolant is entering the combustion chamber through a breached cylinder head gasket or cracked engine block.',
    canDrive: 'NO / Emergency (Driving will cause hydrostatic engine lock or engine fire)',
    diySafety: 'Professional Repair Only',
    estimatedCost: '$1,400 - $2,900',
    troubleshootingSteps: [
      'Pull over safely and turn off engine immediately.',
      'Check engine oil dipstick for milky "chocolate milkshake" discoloration.',
      'Perform a block combustion chemical leak test on cooling system.',
      'Inspect spark plugs for steam-cleaned white ceramic electrodes.'
    ],
    relatedDtc: 'P0128'
  },
  {
    keywords: ['click', 'clicking', 'turn', 'turning', 'sharp', 'wheel', 'cv joint'],
    title: 'Worn CV Axle Shaft & Outer Joint Failure',
    category: 'Drivetrain & Axles',
    severity: 'High',
    severityColor: 'amber',
    confidenceScore: 94.8,
    explanation: 'Rhythmic metallic clicking or popping sounds heard when making sharp U-turns or turning into parking spaces indicate torn Constant Velocity (CV) rubber boot and grease loss.',
    canDrive: 'Limited (Can drive short distance to garage; axle will separate if ignored)',
    diySafety: 'Moderate to Hard (Requires axle nut socket and ball joint separation)',
    estimatedCost: '$220 - $480',
    troubleshootingSteps: [
      'Turn steering wheel full lock and inspect accordion-style rubber CV boots behind front wheels.',
      'Look for splattered black axle grease inside the wheel rim.',
      'Replace half-shaft CV axle assembly with new axle nut torqued to specification.'
    ],
    relatedDtc: null
  },
  {
    keywords: ['sputter', 'sputtering', 'hesitation', 'acceleration', 'choke', 'misfire', 'jerk'],
    title: 'Ignition Cylinder Misfire / Fouled Spark Plug / Clogged Injector',
    category: 'Ignition & Fuel Delivery',
    severity: 'High',
    severityColor: 'amber',
    confidenceScore: 97.1,
    explanation: 'Engine jerking or sputtering under load is typically caused by incomplete combustion in one or more cylinders due to a failing coil pack, worn spark plug, or dirty fuel injector.',
    canDrive: 'Caution (Do not tow or drive above 50 mph; avoid unburned fuel in cat)',
    diySafety: 'Easy to Moderate',
    estimatedCost: '$120 - $420',
    troubleshootingSteps: [
      'Read OBD-II DTC codes to identify specific misfiring cylinder (e.g. P0301 = Cyl 1).',
      'Swap ignition coil between Cyl 1 and Cyl 2 to check if misfire code moves.',
      'Inspect spark plug gap and ceramic insulator for carbon tracking.',
      'Verify fuel injector pulse and electrical resistance.'
    ],
    relatedDtc: 'P0300'
  },
  {
    keywords: ['dead', 'won\'t start', 'clicking start', 'no crank', 'battery', 'starter'],
    title: 'Depleted 12V Starter Battery or High Starter Resistance',
    category: 'Electrical & Starting System',
    severity: 'High',
    severityColor: 'rose',
    confidenceScore: 99.1,
    explanation: 'Rapid clicking sound when turning key or pressing Start button with flickering dash lights indicates low battery voltage (< 11.8V) unable to engage the starter motor solenoid.',
    canDrive: 'Vehicle inoperable until jumped or battery replaced',
    diySafety: 'Easy (Jumpstart or 10mm wrench battery replacement)',
    estimatedCost: '$49 - $190',
    troubleshootingSteps: [
      'Check battery terminal clamps for white or green powdery corrosion.',
      'Measure resting voltage with digital multimeter (12.6V is 100% charged; < 12.0V is discharged).',
      'Use 12V jump booster pack or connect jumper cables to start engine.',
      'Test charging voltage with engine running (should be 13.8V - 14.5V from alternator).'
    ],
    relatedDtc: null
  }
];

export const aiDiagnosticService = {
  diagnoseSymptomText: async (text: string): Promise<DiagnosticResult> => {
    await new Promise((r) => setTimeout(r, 650));
    const lower = text.toLowerCase();

    for (const item of SYMPTOM_KNOWLEDGE_BASE) {
      if (item.keywords.some((k) => lower.includes(k))) {
        return { ...item };
      }
    }

    return {
      title: 'Multimodal Sensor & Powertrain Anomaly Detected',
      category: 'General Vehicle Diagnostics',
      severity: 'Medium',
      severityColor: 'amber',
      confidenceScore: 89.5,
      explanation: `Based on your description ("${text}"), our AI identifies potential irregularities in sensor calibration, air-fuel distribution, or chassis suspension.`,
      canDrive: 'Drive cautiously to nearest verified workshop for full electronic scan.',
      diySafety: 'Moderate (Visual fluid & belt inspection recommended first)',
      estimatedCost: '$85 - $320',
      troubleshootingSteps: [
        'Check dashboard for steady or flashing warning lamps.',
        'Inspect underneath vehicle for fluid drips or leaks (oil, coolant, brake fluid).',
        'Connect OBD-II scan tool to retrieve active and pending fault codes.',
        'Verify tyre pressures and wheel lug nut torque.'
      ],
      relatedDtc: 'P0300'
    };
  },

  diagnoseAcousticSample: async (sample: AcousticSampleItem): Promise<DiagnosticResult> => {
    await new Promise((r) => setTimeout(r, 800));
    return {
      title: sample.name,
      category: sample.category,
      severity: sample.severity,
      severityColor: sample.severityColor,
      confidenceScore: sample.confidenceScore,
      explanation: `${sample.description} Likely root cause: ${sample.likelyRootCause}`,
      canDrive: sample.dangerLevel,
      diySafety: sample.severity === 'Critical' ? 'Professional Repair Only' : 'Moderate',
      estimatedCost: sample.estimatedCost,
      troubleshootingSteps: [
        `Isolate acoustic resonance frequency around ${sample.frequencyHz}.`,
        'Perform mechanical stethoscope check on cylinder head / accessory pulleys.',
        'Check fluid levels (motor oil, brake fluid, or power steering).',
        'Avoid high RPM revving until certified technician inspection.'
      ],
      relatedDtc: sample.category.includes('Engine') ? 'P0300' : null
    };
  },

  diagnoseWarningLight: async (light: WarningLightItem): Promise<DiagnosticResult> => {
    await new Promise((r) => setTimeout(r, 500));
    return {
      title: `${light.name} Alert`,
      category: 'Dashboard Warning Lamp',
      severity: light.severity.includes('Critical') ? 'Critical' : light.severity.includes('High') ? 'High' : 'Medium',
      severityColor: light.color === '#E11D48' ? 'rose' : 'amber',
      confidenceScore: light.urgencyScore,
      explanation: light.description,
      canDrive: light.action,
      diySafety: 'Check owner manual & fluid dipstick immediately',
      estimatedCost: '$65 - $450',
      troubleshootingSteps: [
        'Inspect warning light symbol against manufacturer spec.',
        light.action,
        'Plug in OBD-II scanner to read associated trouble code.',
        'Clear code only after completing verified repair.'
      ],
      relatedDtc: light.id === 'light-engine' ? 'P0420' : light.id === 'light-temp' ? 'P0128' : null
    };
  },

  getObdCodes: () => MOCK_OBD_CODES,
  getAcousticSamples: () => MOCK_ACOUSTIC_SAMPLES,
  getWarningLights: () => MOCK_WARNING_LIGHTS,
};
