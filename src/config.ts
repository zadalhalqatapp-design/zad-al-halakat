export const APP_CONFIG = {
  // ضع هنا رابط Google Apps Script Web App الذي سينشر من ملف gs/
 APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwYeu0Fi4IOv5yFDJm7Z2pWIiQDzKvedcRKkChWs6Ts4G4_Vq-mfPLr3lfSyPshMESKjQ/exec',
  APP_NAME: 'زاد الحلقات',
  APP_NAME_EN: 'Zad Al-Halaqat',
  LOGO_URL: '/image copy.png',
  PROGRAM_DAYS: 20,
  HADITHS_COUNT: 40,
  HADITHS_PER_DAY: 2,
  SESSION_KEY: 'zad_session',
  SESSION_TIMEOUT_MS: 1000 * 60 * 60 * 8, // 8 hours
};

export type UserRole = 'admin' | 'supervisor' | 'student';

export function isConfigured(): boolean {
  return Boolean(APPS_CONFIG.APPS_SCRIPT_URL);
}

export const APPS_CONFIG = APP_CONFIG;
