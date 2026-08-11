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


/**
 * ============================================================
 * أنواع البيانات العامة
 * ============================================================
 */

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
 * خطأ API
 * ============================================================
 */

export class ApiError extends Error {

  code?: string;

  constructor(
    message: string,
    code?: string,
  ) {

    super(message);

    this.name = 'ApiError';

    this.code = code;
  }
}


/**
 * ============================================================
 * طلب API الرئيسي
 * ============================================================
 */

async function request<T extends AnyData>(
  action: string,
  payload: Record<string, unknown> = {},
  method: 'GET' | 'POST' = 'POST',
): Promise<T> {


  /**
   * ==========================================================
   * التأكد من وجود رابط Apps Script
   * ==========================================================
   */

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

  const storedToken =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem(
          APPS_CONFIG.SESSION_KEY,
        )
      : null;


  let tokenValue: string | null = null;


  if (storedToken) {

    try {

      const parsed =
        JSON.parse(storedToken) as {
          token?: string;
        };


      tokenValue =
        parsed.token ?? null;

    } catch {

      /**
       * قد تكون الجلسة مخزنة كنص مباشر.
       */

      tokenValue =
        storedToken;
    }
  }


  /**
   * ==========================================================
   * تنفيذ الطلب
   * ==========================================================
   */

  try {

    const body =
      JSON.stringify({
        action,
        ...payload,
        token: tokenValue,
      });


    let response: Response;


    /**
     * ========================================================
     * GET
     * ========================================================
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
     * ========================================================
     * POST
     * ========================================================
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
        text.slice(0, 1000),
      );


      throw new ApiError(
        'استجابة غير صالحة من الخادم.',
        'PARSE_ERROR',
      );
    }


    /**
     * ========================================================
     * خطأ صادر من Apps Script
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
     * الاستجابة الناجحة
     * ========================================================
     */

    return json.data as T;


  } catch (err) {


    /**
     * لا نحول ApiError إلى NETWORK_ERROR
     */

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
      'تعذّر الاتصال بالخادم. تحقق من الاتصال بالإنترنت أو رابط Google Apps Script.',
      'NETWORK_ERROR',
    );
  }
}


/**
 * ============================================================
 * Login
 * ============================================================
 */

export interface LoginResponse {

  session: Session;

  user: User;
}


/**
 * ============================================================
 * Google Drive Types
 * ============================================================
 */

export interface DriveFolder {

  id: string;

  name: string;

  folderId: string;

  url: string;

  icon?: string;
}


export interface DriveFoldersResponse {

  root: {

    id: string;

    name: string;

    url: string;
  };

  folders: DriveFolder[];
}


export interface DriveFile {

  id: string;

  name: string;

  mimeType: string;

  size: number;

  category: string;

  folderName: string;

  url: string;

  viewUrl: string;

  downloadUrl: string;

  createdAt: string;

  updatedAt: string;
}


export interface DriveFilesResponse {

  success: boolean;

  category: string;

  folder: {

    id: string;

    name: string;

    url: string;
  };

  count: number;

  files: DriveFile[];
}


export interface DriveFolderInfo {

  id: string;

  name: string;

  folderId: string;

  url: string;

  public: boolean;

  icon?: string;
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
  // Operation Log
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

  /**
   * الحصول على مجلدات زاد الحلقات
   *
   * النتيجة:
   *
   * root
   * folders
   *
   * ولن تظهر:
   *
   * قاعدة البيانات
   * النسخ الاحتياطية
   *
   * لأنها مجلدات خاصة.
   */

  getDriveFolders: () =>
    request<DriveFoldersResponse>(
      'getDriveFolders',
      {},
      'GET',
    ),


  /**
   * الحصول على الملفات داخل مجلد معين.
   *
   * مثال:
   *
   * api.getDriveFiles('pdf')
   *
   * api.getDriveFiles('audio')
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
   * معلومات مجلد معين.
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


  /**
   * الحصول على ملف بواسطة ID.
   *
   * Apps Script يتحقق أولًا
   * أن الملف داخل زاد الحلقات.
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
};


/**
 * ============================================================
 * نوع API
 * ============================================================
 */

export type Api = typeof api;
