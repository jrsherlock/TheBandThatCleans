/**
 * Type definitions for Gemini AI Service
 */

export interface AnalysisResult {
  count: number;
  studentNames: string[];
  illegibleNames: string[];
  lotIdentified: string;
  zoneIdentified: string;
  confidence: 'high' | 'medium' | 'low';
  notes: string;
  rawResponse: string;
  analyzedAt: string;
  eventDate?: string;
}

export interface Lot {
  id: string;
  name: string;
  // Add other relevant lot properties as needed
}

