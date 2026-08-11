import { APPS_CONFIG } from '@/config';
import type {
  ApiResponse,
  Session,
  User,
  Hadith,
  ProgressRecord,
  DailyLesson,
  Cycle,
  Certificate,
  Message,
  Notification,
  DashboardData,
  AppSettings,
  OperationLog,
  Backup,
} from '@/types';

type AnyData =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null
  | object;


/**
 * ============================================================
 * أخطاء API
 * ============================================================
 */

export class ApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}


/**
 * ============================================================
 * Google Drive Types
 * ============================================================
 */

export interface DriveRoot {
  id: string;
  name: string;
  url?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  folderId: string;
  url?: string;
  icon?: string;
}

export interface DriveFoldersResponse {
  root: DriveRoot;
  folders: DriveFolder[];
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  category: string;
  folderName: string;
  url?: string;
  viewUrl?: string;
  downloadUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DriveFilesResponse {
  success?: boolean;
  category: string;
  folder: {
    id: string;
    name: string;
    url?: string;
  };
  count: number;
  files: DriveFile[];
}

export interface DriveFolderInfo {
  id: string;
  name: string;
  folderId: string;
  url?: string;
  public: boolean;
  icon?: string;
}


/**
 * ============================================================
 * الطلب الأساسي
 * ============================================================
 */

async function request<T extends AnyData>(
  action: string,
  payload: Record<string, unknown> = {},
  method: 'GET' | 'POST' = 'POST',
): Promise<T> {

  if (!APPS_CONFIG.APPS_SCRIPT_URL) {
    throw new ApiError(
      'لم يتم ضبط رابط Google Apps Script. يرجى إضافته في ملف .env باسم VITE_APPS_SCRIPT_URL.',
      'NOT_CONFIGURED',
    );
  }


  /**
   * ==========================================================
   * قراءة جلسة المستخدم
   * ==========================================================
   */

  const token =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem(
          APPS_CONFIG.SESSION_KEY,
        )
      : null;


  let tokenValue: string | null = null;


  if (token) {

    try {

      tokenValue =
        (
          JSON.parse(token) as {
            token?: string;
          }
        ).token ?? null;

    } catch {

      /**
       * إذا كان المخزن يحتوي على
       * token كنص مباشر.
       */

      tokenValue = token;
    }
  }


  /**
   * ==========================================================
   * تنفيذ الطلب
   * ==========================================================
   */

  try {

    let response: Response;


    const body =
      JSON.stringify({
        action,
        ...payload,
        token: tokenValue,
      });


    /**
     * --------------------------------------------------------
     * GET
     * --------------------------------------------------------
     */

    if (method === 'GET') {

      const params =
        new URLSearchParams({
          payload: body,
        });


      response =
        await fetch(
          `${APPS_CONFIG.APPS_SCRIPT_URL}?${params.toString()}`,
          {
            method: 'GET',
            redirect: 'follow',
            headers: {
              'Content-Type':
                'text/plain;charset=utf-8',
            },
          },
        );

    }


    /**
     * --------------------------------------------------------
     * POST
     * --------------------------------------------------------
     */

    else {

      response =
        await fetch(
          APPS_CONFIG.APPS_SCRIPT_URL,
          {
            method: 'POST',
            redirect: 'follow',
            headers: {
              'Content-Type':
                'text/plain;charset=utf-8',
            },
            body,
          },
        );
    }


    /**
     * ========================================================
     * قراءة الاستجابة
     * ========================================================
     */

    const text =
      await response.text();


    let json: ApiResponse<T>;


    try {

      json =
        JSON.parse(
          text,
        ) as ApiResponse<T>;

    } catch {

      console.error(
        '[API] Parse error:',
        action,
        '| Raw:',
        text.slice(0, 500),
      );


      throw new ApiError(
        'استجابة غير صالحة من الخادم.',
        'PARSE_ERROR',
      );
    }


    /**
     * ========================================================
     * معالجة أخطاء الخادم
     * ========================================================
     */

    if (!json.success) {

      console.error(
        '[API] Server error:',
        action,
        '| Error:',
        json.error,
        '| Code:',
        json.code,
      );


      throw new ApiError(
        json.error ||
          'حدث خطأ في الخادم.',
        json.code,
      );
    }


    /**
     * ========================================================
     * نجاح
     * ========================================================
     */

    return json.data;

  } catch (err) {

    if (err instanceof ApiError) {
      throw err;
    }


    console.error(
      '[API] Network error:',
      action,
      '| Error:',
      err,
    );


    throw new ApiError(
      'تعذّر الاتصال بالخادم. تحقق من الاتصال بالإنترنت أو رابط Apps Script.',
      'NETWORK_ERROR',
    );
  }
}


/**
 * ============================================================
 * Login Response
 * ============================================================
 */

export interface LoginResponse {
  session: Session;
  user: User;
}


/**
 * ============================================================
 * API
 * ============================================================
 */

export const api = {

  // ==========================================================
  // Auth
  // ==========================================================

  login: (
    email: string,
    password: string,
  ) =>
    request<LoginResponse>(
      'login',
      {
        email,
        password,
      },
    ),


  register: (
    data: {
      name: string;
      email: string;
      password: string;
      phone?: string;
    },
  ) =>
    request(
      'register',
      data,
    ),


  logout: () =>
    request(
      'logout',
      {},
    ),


  verifySession: (
    token: string,
  ) =>
    request<LoginResponse>(
      'verifySession',
      {
        token,
      },
    ),


  // ==========================================================
  // Students
  // ==========================================================

  getStudents: () =>
    request<User[]>(
      'getStudents',
      {},
      'GET',
    ),


  approveStudent: (
    studentId: string,
  ) =>
    request(
      'approveStudent',
      {
        studentId,
      },
    ),


  rejectStudent: (
    studentId: string,
    reason: string,
  ) =>
    request(
      'rejectStudent',
      {
        studentId,
        reason,
      },
    ),


  suspendStudent: (
    studentId: string,
    reason: string,
  ) =>
    request(
      'suspendStudent',
      {
        studentId,
        reason,
      },
    ),


  reinstateStudent: (
    studentId: string,
  ) =>
    request(
      'reinstateStudent',
      {
        studentId,
      },
    ),


  updateStudent: (
    studentId: string,
    data: Record<string, unknown>,
  ) =>
    request(
      'updateStudent',
      {
        studentId,
        data,
      },
    ),


  deleteStudent: (
    studentId: string,
  ) =>
    request(
      'deleteStudent',
      {
        studentId,
      },
    ),


  // ==========================================================
  // Supervisors
  // ==========================================================

  getSupervisors: () =>
    request<User[]>(
      'getSupervisors',
      {},
      'GET',
    ),


  addSupervisor: (
    data: {
      name: string;
      email: string;
      password: string;
      phone?: string;
    },
  ) =>
    request(
      'addSupervisor',
      data,
    ),


  updateSupervisor: (
    id: string,
    data: Record<string, unknown>,
  ) =>
    request(
      'updateSupervisor',
      {
        id,
        data,
      },
    ),


  deleteSupervisor: (
    id: string,
  ) =>
    request(
      'deleteSupervisor',
      {
        id,
      },
    ),


  // ==========================================================
  // Admins
  // ==========================================================

  getAdmins: () =>
    request<User[]>(
      'getAdmins',
      {},
      'GET',
    ),


  addAdmin: (
    data: {
      name: string;
      email: string;
      password: string;
      phone?: string;
    },
  ) =>
    request(
      'addAdmin',
      data,
    ),


  updateAdmin: (
    id: string,
    data: Record<string, unknown>,
  ) =>
    request(
      'updateAdmin',
      {
        id,
        data,
      },
    ),


  deleteAdmin: (
    id: string,
  ) =>
    request(
      'deleteAdmin',
      {
        id,
      },
    ),


  // ==========================================================
  // Hadiths
  // ==========================================================

  getHadiths: () =>
    request<Hadith[]>(
      'getHadiths',
      {},
      'GET',
    ),


  getHadith: (
    hadithId: string,
  ) =>
    request<Hadith>(
      'getHadith',
      {
        hadithId,
      },
      'GET',
    ),


  addHadith: (
    data: Record<string, unknown>,
  ) =>
    request(
      'addHadith',
      data,
    ),


  updateHadith: (
    hadithId: string,
    data: Record<string, unknown>,
  ) =>
    request(
      'updateHadith',
      {
        hadithId,
        data,
      },
    ),


  deleteHadith: (
    hadithId: string,
  ) =>
    request(
      'deleteHadith',
      {
        hadithId,
      },
    ),


  // ==========================================================
  // Progress
  // ==========================================================

  getProgress: (
    studentId: string,
  ) =>
    request<ProgressRecord[]>(
      'getProgress',
      {
        studentId,
      },
      'GET',
    ),


  saveProgress: (
    hadithId: string,
    field:
      | 'memorized'
      | 'listened'
      | 'read',
    value: boolean,
  ) =>
    request(
      'saveProgress',
      {
        hadithId,
        field,
        value,
      },
    ),


  saveMediaProgress: (
    hadithId: string,
    mediaType:
      | 'video'
      | 'audio'
      | 'pdf',
    data: Record<string, unknown>,
  ) =>
    request<{
      success: boolean;
      completed: boolean;
      threshold: number;
    }>(
      'saveMediaProgress',
      {
        hadithId,
        mediaType,
        data,
      },
    ),


  getDailyLessons: () =>
    request<DailyLesson>(
      'getDailyLessons',
      {},
      'GET',
    ),


  // ==========================================================
  // Cycles
  // ==========================================================

  getCycles: () =>
    request<Cycle[]>(
      'getCycles',
      {},
      'GET',
    ),


  startCycle: (
    name: string,
    studentIds: string[],
  ) =>
    request(
      'startCycle',
      {
        name,
        studentIds,
      },
    ),


  completeCycle: (
    cycleId: string,
  ) =>
    request(
      'completeCycle',
      {
        cycleId,
      },
    ),


  // ==========================================================
  // Certificates
  // ==========================================================

  getCertificates: (
    studentId?: string,
  ) =>
    request<Certificate[]>(
      'getCertificates',
      {
        studentId,
      },
      'GET',
    ),


  issueCertificate: (
    studentId: string,
    cycleId: string,
  ) =>
    request(
      'issueCertificate',
      {
        studentId,
        cycleId,
      },
    ),


  downloadCertificate: (
    certificateId: string,
  ) =>
    request(
      'downloadCertificate',
      {
        certificateId,
      },
      'GET',
    ),


  // ==========================================================
  // Messages
  // ==========================================================

  getMessages: (
    userId: string,
  ) =>
    request<Message[]>(
      'getMessages',
      {
        userId,
      },
      'GET',
    ),


  sendMessage: (
    toId: string,
    subject: string,
    body: string,
  ) =>
    request(
      'sendMessage',
      {
        toId,
        subject,
        body,
      },
    ),


  markMessageRead: (
    messageId: string,
  ) =>
    request(
      'markMessageRead',
      {
        messageId,
      },
    ),


  // ==========================================================
  // Notifications
  // ==========================================================

  getNotifications: () =>
    request<Notification[]>(
      'getNotifications',
      {},
      'GET',
    ),


  sendNotification: (
    data: {
      title: string;
      body: string;
      target: string;
      targetId?: string;
    },
  ) =>
    request(
      'sendNotification',
      data,
    ),


  // ==========================================================
  // Profile
  // ==========================================================

  updateProfile: (
    data: Record<string, unknown>,
  ) =>
    request(
      'updateProfile',
      data,
    ),


  changePassword: (
    oldPassword: string,
    newPassword: string,
  ) =>
    request(
      'changePassword',
      {
        oldPassword,
        newPassword,
      },
    ),


  resetPassword: (
    studentId: string,
  ) =>
    request(
      'resetPassword',
      {
        studentId,
      },
    ),


  // ==========================================================
  // Dashboard
  // ==========================================================

  getDashboard: () =>
    request<DashboardData>(
      'getDashboard',
      {},
      'GET',
    ),


  // ==========================================================
  // Settings
  // ==========================================================

  getSettings: () =>
    request<AppSettings>(
      'getSettings',
      {},
      'GET',
    ),


  updateSettings: (
    data: Record<string, unknown>,
  ) =>
    request(
      'updateSettings',
      {
        data,
      },
    ),


  // ==========================================================
  // Operations Log
  // ==========================================================

  getOperationLog: () =>
    request<OperationLog[]>(
      'getOperationLog',
      {},
      'GET',
    ),


  // ==========================================================
  // Backups
  // ==========================================================

  getBackups: () =>
    request<Backup[]>(
      'getBackups',
      {},
      'GET',
    ),


  backupDatabase: (
    name: string,
  ) =>
    request(
      'backupDatabase',
      {
        name,
      },
    ),


  restoreBackup: (
    backupId: string,
  ) =>
    request(
      'restoreBackup',
      {
        backupId,
      },
    ),


  // ==========================================================
  // Google Drive
  // ==========================================================
  //
  // المجلد الرئيسي:
  //
  // 📁 زاد الحلقات
  //
  // والمجلدات العامة:
  //
  // 📄 الكتب PDF
  // 🎵 الصوتيات
  // 🏆 الشهادات
  // 🖼️ صور الطلاب
  // 🎨 الشعارات والهوية
  // 📁 المستندات
  //
  // ==========================================================


  /**
   * الحصول على مجلدات زاد الحلقات
   */
  getDriveFolders: () =>
    request<DriveFoldersResponse>(
      'getDriveFolders',
      {},
      'GET',
    ),


  /**
   * الحصول على ملفات مجلد معين
   *
   * أمثلة:
   *
   * api.getDriveFiles('pdf')
   * api.getDriveFiles('audio')
   * api.getDriveFiles('certificates')
   * api.getDriveFiles('studentPhotos')
   * api.getDriveFiles('branding')
   * api.getDriveFiles('documents')
   */
  getDriveFiles: (
    category: string,
  ) =>
    request<DriveFilesResponse>(
      'getDriveFiles',
      {
        category,
      },
      'GET',
    ),


  /**
   * الحصول على ملف محدد
   */
  getDriveFile: (
    fileId: string,
  ) =>
    request<DriveFile>(
      'getDriveFile',
      {
        fileId,
      },
      'GET',
    ),


  /**
   * الحصول على معلومات مجلد
   */
  getDriveFolderInfo: (
    category: string,
  ) =>
    request<DriveFolderInfo>(
      'getDriveFolderInfo',
      {
        category,
      },
      'GET',
    ),
};


/**
 * ============================================================
 * نوع API
 * ============================================================
 */

export type Api = typeof api;
