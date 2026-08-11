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


/* ============================================================
   أنواع عامة
   ============================================================ */

type AnyData =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null
  | object;


/* ============================================================
   خطأ API
   ============================================================ */

export class ApiError extends Error {

  code?: string;

  constructor(
    message: string,
    code?: string
  ) {

    super(message);

    this.name = 'ApiError';

    this.code = code;
  }
}


/* ============================================================
   أنواع Google Drive
   ============================================================ */

export interface DriveRoot {

  id: string;

  name: string;

  url?: string;
}


export interface DriveFolder {

  id: string;

  name: string;

  folderId: string;

  url: string;

  icon?: string;

  public?: boolean;
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


/* ============================================================
   أنواع تسجيل الدخول
   ============================================================ */

export interface LoginResponse {

  session: Session;

  user: User;
}


/* ============================================================
   استخراج Token
   ============================================================ */

function getStoredToken(): string | null {

  if (
    typeof localStorage ===
    'undefined'
  ) {

    return null;
  }


  const stored =
    localStorage.getItem(
      APPS_CONFIG.SESSION_KEY
    );


  if (!stored) {

    return null;
  }


  try {

    /*
     * إذا كان التخزين:
     *
     * {
     *   token: "..."
     * }
     */

    const parsed =
      JSON.parse(stored) as {
        token?: string;
      };


    if (parsed.token) {

      return parsed.token;
    }


    /*
     * احتياطًا إذا كان مخزنًا
     * كنص مباشر.
     */

    return stored;


  } catch {

    /*
     * إذا لم يكن JSON
     * نعتبر القيمة Token مباشرة.
     */

    return stored;
  }
}


/* ============================================================
   الطلب الرئيسي
   ============================================================ */

async function request<
  T extends AnyData
>(
  action: string,
  payload: Record<
    string,
    unknown
  > = {},
  method:
    | 'GET'
    | 'POST' = 'POST',
): Promise<T> {


  /* ----------------------------------------------------------
     التأكد من وجود رابط Apps Script
     ---------------------------------------------------------- */

  if (
    !APPS_CONFIG.APPS_SCRIPT_URL
  ) {

    throw new ApiError(
      'لم يتم ضبط رابط Google Apps Script. يرجى إضافة VITE_APPS_SCRIPT_URL.',
      'NOT_CONFIGURED'
    );
  }


  /* ----------------------------------------------------------
     Token
     ---------------------------------------------------------- */

  const token =
    getStoredToken();


  /* ----------------------------------------------------------
     بناء الطلب
     ---------------------------------------------------------- */

  const requestPayload =
    {
      action,
      ...payload,
      token,
    };


  const body =
    JSON.stringify(
      requestPayload
    );


  try {

    let response: Response;


    /* ========================================================
       GET
       ======================================================== */

    if (
      method === 'GET'
    ) {

      const params =
        new URLSearchParams();


      params.set(
        'payload',
        body
      );


      const url =
        `${APPS_CONFIG.APPS_SCRIPT_URL}?${params.toString()}`;


      response =
        await fetch(
          url,
          {
            method: 'GET',
            redirect: 'follow',
          }
        );


    }


    /* ========================================================
       POST
       ======================================================== */

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
          }
        );
    }


    /* --------------------------------------------------------
       قراءة الاستجابة
       -------------------------------------------------------- */

    const text =
      await response.text();


    if (!text) {

      throw new ApiError(
        'الخادم أعاد استجابة فارغة.',
        'EMPTY_RESPONSE'
      );
    }


    let json:
      ApiResponse<T>;


    try {

      json =
        JSON.parse(
          text
        ) as ApiResponse<T>;


    } catch (parseError) {

      console.error(
        '[API] JSON Parse Error:',
        {
          action,
          text:
            text.slice(
              0,
              1000
            ),
          parseError,
        }
      );


      throw new ApiError(
        'استجابة غير صالحة من Google Apps Script.',
        'PARSE_ERROR'
      );
    }


    /* --------------------------------------------------------
       خطأ من Apps Script
       -------------------------------------------------------- */

    if (
      !json.success
    ) {

      console.error(
        '[API] Server error:',
        {
          action,
          error:
            json.error,
          code:
            json.code,
        }
      );


      throw new ApiError(
        json.error ||
          'حدث خطأ في الخادم.',
        json.code
      );
    }


    return json.data;


  } catch (err) {

    /*
     * أخطاء API الحقيقية
     * لا نحولها إلى NETWORK_ERROR.
     */

    if (
      err instanceof ApiError
    ) {

      throw err;
    }


    console.error(
      '[API] Network error:',
      {
        action,
        error: err,
      }
    );


    throw new ApiError(
      'تعذّر الاتصال بخادم Google Apps Script. تحقق من رابط النشر والاتصال بالإنترنت.',
      'NETWORK_ERROR'
    );
  }
}


/* ============================================================
   API
   ============================================================ */

export const api = {


  /* ==========================================================
     Auth
     ========================================================== */

  login: (
    email: string,
    password: string
  ) =>
    request<LoginResponse>(
      'login',
      {
        email,
        password,
      }
    ),


  register: (
    data: {
      name: string;
      email: string;
      password: string;
      phone?: string;
    }
  ) =>
    request(
      'register',
      data
    ),


  logout: () =>
    request(
      'logout'
    ),


  verifySession: (
    token: string
  ) =>
    request<LoginResponse>(
      'verifySession',
      {
        token,
      }
    ),



  /* ==========================================================
     Students
     ========================================================== */

  getStudents: () =>
    request<User[]>(
      'getStudents',
      {},
      'GET'
    ),


  approveStudent: (
    studentId: string
  ) =>
    request(
      'approveStudent',
      {
        studentId,
      }
    ),


  rejectStudent: (
    studentId: string,
    reason: string
  ) =>
    request(
      'rejectStudent',
      {
        studentId,
        reason,
      }
    ),


  suspendStudent: (
    studentId: string,
    reason: string
  ) =>
    request(
      'suspendStudent',
      {
        studentId,
        reason,
      }
    ),


  reinstateStudent: (
    studentId: string
  ) =>
    request(
      'reinstateStudent',
      {
        studentId,
      }
    ),


  updateStudent: (
    studentId: string,
    data: Record<string, unknown>
  ) =>
    request(
      'updateStudent',
      {
        studentId,
        data,
      }
    ),


  deleteStudent: (
    studentId: string
  ) =>
    request(
      'deleteStudent',
      {
        studentId,
      }
    ),



  /* ==========================================================
     Supervisors
     ========================================================== */

  getSupervisors: () =>
    request<User[]>(
      'getSupervisors',
      {},
      'GET'
    ),


  addSupervisor: (
    data: {
      name: string;
      email: string;
      password: string;
      phone?: string;
    }
  ) =>
    request(
      'addSupervisor',
      data
    ),


  updateSupervisor: (
    id: string,
    data: Record<string, unknown>
  ) =>
    request(
      'updateSupervisor',
      {
        id,
        data,
      }
    ),


  deleteSupervisor: (
    id: string
  ) =>
    request(
      'deleteSupervisor',
      {
        id,
      }
    ),



  /* ==========================================================
     Admins
     ========================================================== */

  getAdmins: () =>
    request<User[]>(
      'getAdmins',
      {},
      'GET'
    ),


  addAdmin: (
    data: {
      name: string;
      email: string;
      password: string;
      phone?: string;
    }
  ) =>
    request(
      'addAdmin',
      data
    ),


  updateAdmin: (
    id: string,
    data: Record<string, unknown>
  ) =>
    request(
      'updateAdmin',
      {
        id,
        data,
      }
    ),


  deleteAdmin: (
    id: string
  ) =>
    request(
      'deleteAdmin',
      {
        id,
      }
    ),



  /* ==========================================================
     Hadiths
     ========================================================== */

  getHadiths: () =>
    request<Hadith[]>(
      'getHadiths',
      {},
      'GET'
    ),


  getHadith: (
    hadithId: string
  ) =>
    request<Hadith>(
      'getHadith',
      {
        hadithId,
      },
      'GET'
    ),


  addHadith: (
    data: Record<string, unknown>
  ) =>
    request(
      'addHadith',
      data
    ),


  updateHadith: (
    hadithId: string,
    data: Record<string, unknown>
  ) =>
    request(
      'updateHadith',
      {
        hadithId,
        data,
      }
    ),


  deleteHadith: (
    hadithId: string
  ) =>
    request(
      'deleteHadith',
      {
        hadithId,
      }
    ),



  /* ==========================================================
     Progress
     ========================================================== */

  getProgress: (
    studentId: string
  ) =>
    request<ProgressRecord[]>(
      'getProgress',
      {
        studentId,
      },
      'GET'
    ),


  saveProgress: (
    hadithId: string,
    field:
      | 'memorized'
      | 'listened'
      | 'read',
    value: boolean
  ) =>
    request(
      'saveProgress',
      {
        hadithId,
        field,
        value,
      }
    ),


  saveMediaProgress: (
    hadithId: string,
    mediaType:
      | 'video'
      | 'audio'
      | 'pdf',
    data: Record<string, unknown>
  ) =>
    request(
      'saveMediaProgress',
      {
        hadithId,
        mediaType,
        data,
      }
    ),


  getDailyLessons: () =>
    request<DailyLesson>(
      'getDailyLessons',
      {},
      'GET'
    ),



  /* ==========================================================
     Cycles
     ========================================================== */

  getCycles: () =>
    request<Cycle[]>(
      'getCycles',
      {},
      'GET'
    ),


  startCycle: (
    name: string,
    studentIds: string[]
  ) =>
    request(
      'startCycle',
      {
        name,
        studentIds,
      }
    ),


  completeCycle: (
    cycleId: string
  ) =>
    request(
      'completeCycle',
      {
        cycleId,
      }
    ),



  /* ==========================================================
     Certificates
     ========================================================== */

  getCertificates: (
    studentId?: string
  ) =>
    request<Certificate[]>(
      'getCertificates',
      {
        studentId,
      },
      'GET'
    ),


  issueCertificate: (
    studentId: string,
    cycleId: string
  ) =>
    request(
      'issueCertificate',
      {
        studentId,
        cycleId,
      }
    ),


  downloadCertificate: (
    certificateId: string
  ) =>
    request(
      'downloadCertificate',
      {
        certificateId,
      },
      'GET'
    ),



  /* ==========================================================
     Messages
     ========================================================== */

  getMessages: (
    userId: string
  ) =>
    request<Message[]>(
      'getMessages',
      {
        userId,
      },
      'GET'
    ),


  sendMessage: (
    toId: string,
    subject: string,
    body: string
  ) =>
    request(
      'sendMessage',
      {
        toId,
        subject,
        body,
      }
    ),


  markMessageRead: (
    messageId: string
  ) =>
    request(
      'markMessageRead',
      {
        messageId,
      }
    ),



  /* ==========================================================
     Notifications
     ========================================================== */

  getNotifications: () =>
    request<Notification[]>(
      'getNotifications',
      {},
      'GET'
    ),


  sendNotification: (
    data: {
      title: string;
      body: string;
      target: string;
      targetId?: string;
    }
  ) =>
    request(
      'sendNotification',
      data
    ),



  /* ==========================================================
     Profile
     ========================================================== */

  updateProfile: (
    data: Record<string, unknown>
  ) =>
    request(
      'updateProfile',
      data
    ),


  changePassword: (
    oldPassword: string,
    newPassword: string
  ) =>
    request(
      'changePassword',
      {
        oldPassword,
        newPassword,
      }
    ),


  resetPassword: (
    studentId: string
  ) =>
    request(
      'resetPassword',
      {
        studentId,
      }
    ),



  /* ==========================================================
     Dashboard
     ========================================================== */

  getDashboard: () =>
    request<DashboardData>(
      'getDashboard',
      {},
      'GET'
    ),



  /* ==========================================================
     Settings
     ========================================================== */

  getSettings: () =>
    request<AppSettings>(
      'getSettings',
      {},
      'GET'
    ),


  updateSettings: (
    data: Record<string, unknown>
  ) =>
    request(
      'updateSettings',
      {
        data,
      }
    ),



  /* ==========================================================
     Operation Log
     ========================================================== */

  getOperationLog: () =>
    request<OperationLog[]>(
      'getOperationLog',
      {},
      'GET'
    ),



  /* ==========================================================
     Backups
     ========================================================== */

  getBackups: () =>
    request<Backup[]>(
      'getBackups',
      {},
      'GET'
    ),


  backupDatabase: (
    name: string
  ) =>
    request(
      'backupDatabase',
      {
        name,
      }
    ),


  restoreBackup: (
    backupId: string
  ) =>
    request(
      'restoreBackup',
      {
        backupId,
      }
    ),



  /* ==========================================================
     GOOGLE DRIVE
     ========================================================== */


  /**
   * جلب مجلدات زاد الحلقات
   */
  getDriveFolders: () =>
    request<DriveFoldersResponse>(
      'getDriveFolders',
      {},
      'GET'
    ),


  /**
   * جلب الملفات داخل مجلد
   */
  getDriveFiles: (
    category: string
  ) =>
    request<DriveFilesResponse>(
      'getDriveFiles',
      {
        category,
      },
      'GET'
    ),


  /**
   * معلومات مجلد
   */
  getDriveFolderInfo: (
    category: string
  ) =>
    request<DriveFolder>(
      'getDriveFolderInfo',
      {
        category,
      },
      'GET'
    ),


  /**
   * الحصول على ملف محدد
   */
  getDriveFile: (
    fileId: string
  ) =>
    request<DriveFile>(
      'getDriveFile',
      {
        fileId,
      },
      'GET'
    ),


  /**
   * اختبار المجلد الرئيسي
   */
  testDriveRoot: () =>
    request(
      'testDriveRoot',
      {},
      'GET'
    ),


  /**
   * فحص بنية المجلدات
   */
  setupDriveFolders: () =>
    request(
      'setupDriveFolders',
      {},
      'GET'
    ),


  /**
   * فحص جميع مجلدات Drive
   */
  testAllDriveFolders: () =>
    request(
      'testAllDriveFolders',
      {},
      'GET'
    ),
};


/* ============================================================
   نوع API
   ============================================================ */

export type Api =
  typeof api;
