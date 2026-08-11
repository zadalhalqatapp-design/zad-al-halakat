/**
 * ============================================================
 * زاد الحلقات — Google Apps Script Backend
 * Code.gs
 * ============================================================
 *
 * نقطة الدخول الرئيسية للويب أب
 *
 * يدعم:
 * - Authentication
 * - Students
 * - Supervisors
 * - Admins
 * - Hadiths
 * - Progress
 * - Cycles
 * - Certificates
 * - Messages
 * - Notifications
 * - Profile
 * - Settings
 * - Operation Log
 * - Backups
 * - Google Drive
 *
 * Google Drive:
 * جميع عمليات الملفات تمر من خلال Drive.gs
 * ومقيدة بمجلد:
 *
 * 📁 زاد الحلقات
 *
 * ============================================================
 */


/**
 * ============================================================
 * GET
 * ============================================================
 */
function doGet(e) {
  return handleRequest(e, 'GET');
}


/**
 * ============================================================
 * POST
 * ============================================================
 */
function doPost(e) {
  return handleRequest(e, 'POST');
}


/**
 * ============================================================
 * المعالج الرئيسي
 * ============================================================
 */
function handleRequest(e, method) {

  var payload = {};

  try {

    /**
     * ----------------------------------------
     * GET
     * ----------------------------------------
     *
     * مثال:
     *
     * ?payload={"action":"getDriveFolders","token":"..."}
     */
    if (method === 'GET') {

      var param =
        e &&
        e.parameter &&
        e.parameter.payload;

      if (param) {
        payload = JSON.parse(param);
      }

    }

    /**
     * ----------------------------------------
     * POST
     * ----------------------------------------
     */
    else {

      var body =
        e &&
        e.postData &&
        e.postData.contents;

      if (body) {
        payload = JSON.parse(body);
      }

    }

  } catch (err) {

    return jsonError(
      'صيغة الطلب غير صالحة.',
      'PARSE_ERROR'
    );
  }


  /**
   * التأكد من وجود العملية
   */
  var action =
    payload.action;

  if (!action) {

    return jsonError(
      'لم يتم تحديد العملية.',
      'NO_ACTION'
    );
  }


  /**
   * ========================================================
   * العمليات العامة التي لا تحتاج جلسة
   * ========================================================
   */

  var publicActions = [

    'login',

    'register',

    'verifySession',

    /**
     * اختبار الاتصال
     */
    'test',

    /**
     * اختبار Google Drive الرئيسي
     *
     * لا نستخدمه من الواجهة العامة عادة،
     * لكنه مفيد للاختبار.
     */
    'testDriveRoot'

  ];


  /**
   * ========================================================
   * التحقق من الجلسة
   * ========================================================
   */

  if (
    publicActions.indexOf(action) === -1
  ) {

    var token =
      payload.token;

    var session =
      verifyToken(token);

    if (!session) {

      return jsonError(
        'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.',
        'UNAUTHORIZED'
      );
    }

    payload._session =
      session;
  }


  /**
   * ========================================================
   * تنفيذ العملية
   * ========================================================
   */

  try {

    var result =
      routeAction(
        action,
        payload
      );

    return jsonSuccess(
      result
    );

  } catch (err) {

    logError(
      action,
      err
    );

    return jsonError(
      err &&
      err.message
        ? err.message
        : 'حدث خطأ غير معروف.',
      err &&
      err.code
        ? err.code
        : 'SERVER_ERROR'
    );
  }
}


/**
 * ============================================================
 * توجيه العمليات
 * ============================================================
 */
function routeAction(action, p) {

  switch (action) {

    /**
     * ========================================================
     * اختبار الاتصال
     * ========================================================
     */

    case 'test':

      return {
        status: 'OK',
        message: 'تم الاتصال بـ Google Apps Script بنجاح.'
      };


    /**
     * ========================================================
     * Authentication
     * ========================================================
     */

    case 'login':

      return login(
        p.email,
        p.password
      );


    case 'register':

      return register(
        p
      );


    case 'logout':

      return logout(
        p.token
      );


    case 'verifySession':

      return verifySession(
        p.token
      );


    /**
     * ========================================================
     * Dashboard
     * ========================================================
     */

    case 'getDashboard':

      return getDashboard(
        p._session
      );


    /**
     * ========================================================
     * Students
     * ========================================================
     */

    case 'getStudents':

      return getStudents();


    case 'approveStudent':

      return approveStudent(
        p.studentId,
        p._session
      );


    case 'rejectStudent':

      return rejectStudent(
        p.studentId,
        p.reason,
        p._session
      );


    case 'suspendStudent':

      return suspendStudent(
        p.studentId,
        p.reason,
        p._session
      );


    case 'reinstateStudent':

      return reinstateStudent(
        p.studentId,
        p._session
      );


    case 'updateStudent':

      return updateStudent(
        p.studentId,
        p.data,
        p._session
      );


    case 'deleteStudent':

      return deleteStudent(
        p.studentId,
        p._session
      );


    /**
     * ========================================================
     * Supervisors
     * ========================================================
     */

    case 'getSupervisors':

      return getSupervisors();


    case 'addSupervisor':

      return addSupervisor(
        p,
        p._session
      );


    case 'updateSupervisor':

      return updateSupervisor(
        p.id,
        p.data,
        p._session
      );


    case 'deleteSupervisor':

      return deleteSupervisor(
        p.id,
        p._session
      );


    /**
     * ========================================================
     * Admins
     * ========================================================
     */

    case 'getAdmins':

      return getAdmins();


    case 'addAdmin':

      return addAdmin(
        p,
        p._session
      );


    case 'updateAdmin':

      return updateAdmin(
        p.id,
        p.data,
        p._session
      );


    case 'deleteAdmin':

      return deleteAdmin(
        p.id,
        p._session
      );


    /**
     * ========================================================
     * Hadiths
     * ========================================================
     */

    case 'getHadiths':

      return getHadiths();


    case 'getHadith':

      return getHadith(
        p.hadithId
      );


    case 'addHadith':

      return addHadith(
        p,
        p._session
      );


    case 'updateHadith':

      return updateHadith(
        p.hadithId,
        p.data,
        p._session
      );


    case 'deleteHadith':

      return deleteHadith(
        p.hadithId,
        p._session
      );


    /**
     * ========================================================
     * Progress
     * ========================================================
     */

    case 'getProgress':

      return getProgress(
        p.studentId
      );


    case 'saveProgress':

      return saveProgress(
        p.hadithId,
        p.field,
        p.value,
        p._session
      );


    case 'saveMediaProgress':

      return saveMediaProgress(
        p.hadithId,
        p.mediaType,
        p.data,
        p._session
      );


    case 'getDailyLessons':

      return getDailyLessons(
        p._session
      );


    /**
     * ========================================================
     * Cycles
     * ========================================================
     */

    case 'getCycles':

      return getCycles();


    case 'startCycle':

      return startCycle(
        p.name,
        p.studentIds,
        p._session
      );


    case 'completeCycle':

      return completeCycle(
        p.cycleId,
        p._session
      );


    /**
     * ========================================================
     * Certificates
     * ========================================================
     */

    case 'getCertificates':

      return getCertificates(
        p.studentId
      );


    case 'issueCertificate':

      return issueCertificate(
        p.studentId,
        p.cycleId,
        p._session
      );


    case 'downloadCertificate':

      return downloadCertificate(
        p.certificateId
      );


    /**
     * ========================================================
     * Messages
     * ========================================================
     */

    case 'getMessages':

      return getMessages(
        p.userId
      );


    case 'sendMessage':

      return sendMessage(
        p.toId,
        p.subject,
        p.body,
        p._session
      );


    case 'markMessageRead':

      return markMessageRead(
        p.messageId,
        p._session
      );


    /**
     * ========================================================
     * Notifications
     * ========================================================
     */

    case 'getNotifications':

      return getNotifications();


    case 'sendNotification':

      return sendNotification(
        p,
        p._session
      );


    /**
     * ========================================================
     * Profile
     * ========================================================
     */

    case 'updateProfile':

      return updateProfile(
        p,
        p._session
      );


    case 'changePassword':

      return changePassword(
        p.oldPassword,
        p.newPassword,
        p._session
      );


    case 'resetPassword':

      return resetPassword(
        p.studentId,
        p._session
      );


    /**
     * ========================================================
     * Settings
     * ========================================================
     */

    case 'getSettings':

      return getSettings();


    case 'updateSettings':

      return updateSettings(
        p.data,
        p._session
      );


    /**
     * ========================================================
     * Operation Log
     * ========================================================
     */

    case 'getOperationLog':

      return getOperationLog();


    /**
     * ========================================================
     * Backups
     * ========================================================
     */

    case 'getBackups':

      return getBackups();


    case 'backupDatabase':

      return backupDatabase(
        p.name,
        p._session
      );


    case 'restoreBackup':

      return restoreBackup(
        p.backupId,
        p._session
      );


    /**
     * ========================================================
     * GOOGLE DRIVE
     * ========================================================
     *
     * هذه هي الإضافات المهمة.
     *
     * الصفحة تطلب:
     *
     * getDriveFolders
     *
     * getDriveFiles
     *
     * getDriveFolderInfo
     *
     * لذلك يجب أن تكون هنا.
     * ========================================================
     */


    /**
     * جلب المجلدات العامة
     *
     * من داخل:
     *
     * 📁 زاد الحلقات
     */
    case 'getDriveFolders':

      return getDriveFolders();


    /**
     * جلب الملفات داخل مجلد معين
     *
     * مثال:
     *
     * category = pdf
     *
     * أو:
     *
     * audio
     * certificates
     * studentPhotos
     * branding
     * documents
     */
    case 'getDriveFiles':

      return getDriveFiles(
        p.category
      );


    /**
     * معلومات مجلد معين
     */
    case 'getDriveFolderInfo':

      return getDriveFolderInfo(
        p.category
      );


    /**
     * جلب ملف محدد
     */
    case 'getDriveFile':

      return getDriveFile(
        p.fileId
      );


    /**
     * فحص بنية Drive
     *
     * للاختبار فقط.
     */
    case 'setupDriveFolders':

      return setupDriveFolders();


    /**
     * اختبار الوصول للمجلد الرئيسي
     */
    case 'testDriveRoot':

      return testDriveRoot();


    /**
     * اختبار جميع مجلدات Drive
     */
    case 'testAllDriveFolders':

      return testAllDriveFolders();


    /**
     * ========================================================
     * عملية غير معروفة
     * ========================================================
     */

    default:

      throw new Error(
        'عملية غير معروفة: ' + action
      );
  }
}


/**
 * ============================================================
 * استجابة ناجحة
 * ============================================================
 */
function jsonSuccess(data) {

  return ContentService
    .createTextOutput(
      JSON.stringify({
        success: true,
        data: data
      })
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}


/**
 * ============================================================
 * استجابة خطأ
 * ============================================================
 */
function jsonError(message, code) {

  return ContentService
    .createTextOutput(
      JSON.stringify({
        success: false,
        error: message,
        code: code || 'ERROR'
      })
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}


/**
 * ============================================================
 * تسجيل الأخطاء
 * ============================================================
 */
function logError(action, err) {

  try {

    var ss =
      getSpreadsheet();

    if (!ss) {
      return;
    }

    var sheet =
      ss.getSheetByName(
        SHEETS.OPERATION_LOG
      );

    if (!sheet) {
      return;
    }

    sheet.appendRow([

      uuid(),

      new Date().toISOString(),

      'system',

      'النظام',

      'system',

      'خطأ',

      'العملية: ' +
        action +
        ' — الخطأ: ' +
        (
          err &&
          err.message
            ? err.message
            : String(err)
        )

    ]);

  } catch (e) {

    /**
     * لا نسمح لفشل تسجيل الخطأ
     * بإيقاف الاستجابة الأصلية.
     */

  }
}
