import { FullAnalysis } from '../types';

declare module './emailService.js' {
  export function sendAnalysisEmail(analysis: FullAnalysis, email: string): Promise<{
    success: boolean;
    message: string;
  }>;
} 