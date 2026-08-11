/**
 * ============================================================
 * زاد الحلقات — Google Apps Script
 * Code.gs
 * ============================================================
 *
 * نقطة الدخول الرئيسية للـ Web App
 *
 * المسؤوليات:
 * - استقبال GET / POST
 * - قراءة action
 * - التحقق من الجلسة
 * - توجيه الطلب إلى الدالة المناسبة
 * - ربط Google Drive
 *
 * الملفات الأخرى:
 * Auth.gs
 * Communication.gs
 * Config.gs
 * Cycles.gs
 * Hadiths.gs
 * Management.gs
 * Setup.gs
 * Staff.gs
 * Students.gs
 * Utils.gs
 * Drive.gs
 * ============================================================
 */


/* ============================================================
   GET
   ============================================================ */

function doGet(e) {
  return handleRequest(e, 'GET');
}


/* ============================================================
   POST
   ============================================================ */

function doPost(e) {
  return handleRequest(e, 'POST');
}


/* ============================================================
   المعالج الرئيسي
   ============================================================ */

function handleRequest(e, method) {

  var payload = {};

  try {

    /* --------------------------------------------------------
       قراءة البيانات
       -------------------------------------------------------- */

    if (method === 'GET') {

      var rawPayload =
        e &&
        e.parameter &&
        e.parameter.payload;

      if (rawPayload) {
        payload = JSON.parse(rawPayload);
      }

    } else {

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


  /* ----------------------------------------------------------
     التأكد من وجود action
     ---------------------------------------------------------- */

  var action = payload.action;

  if (!action) {

    return jsonError(
      'لم يتم تحديد العملية.',
      'NO_ACTION'
    );
  }


  /* ----------------------------------------------------------
     العمليات العامة
     ---------------------------------------------------------- */

  var publicActions = [
    'login',
    'register',
    'verifySession'
  ];


  /* ----------------------------------------------------------
     التحقق من الجلسة
     ---------------------------------------------------------- */

  if (publicActions.indexOf(action) === -1) {

    var token = payload.token;

    var session;

    try {

      session = verifyToken(token);

    } catch (err) {

      return jsonError(
        err.message || 'تعذر التحقق من الجلسة.',
        err.code || 'UNAUTHORIZED'
      );
    }


    if (!session) {

      return jsonError(
        'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.',
        'UNAUTHORIZED'
      );
    }


    payload._session = session;
  }


  /* ----------------------------------------------------------
     تنفيذ العملية
     ---------------------------------------------------------- */

  try {

    var result =
      routeAction(
        action,
        payload
      );

    return jsonSuccess(result);

  } catch (err) {

    logError(
      action,
      err
    );

    return jsonError(
      err.message ||
        'حدث خطأ غير معروف في الخادم.',
      err.code ||
        'SERVER_ERROR'
    );
  }
}


/* ============================================================
   توجيه العمليات
   ============================================================ */

function routeAction(action, p) {

  switch (action) {


    /* ========================================================
       المصادقة
       ======================================================== */

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



    /* ========================================================
       لوحة التحكم
       ======================================================== */

    case 'getDashboard':
      return getDashboard(
        p._session
      );



    /* ========================================================
       الطلاب
       ======================================================== */

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



    /* ========================================================
       المشرفون
       ======================================================== */

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



    /* ========================================================
       المديرون
       ======================================================== */

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



    /* ========================================================
       الأحاديث
       ======================================================== */

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



    /* ========================================================
       الإنجاز
       ======================================================== */

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



    /* ========================================================
       الدورات
       ======================================================== */

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



    /* ========================================================
       الشهادات
       ======================================================== */

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



    /* ========================================================
       الرسائل
       ======================================================== */

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



    /* ========================================================
       الإشعارات
       ======================================================== */

    case 'getNotifications':
      return getNotifications();


    case 'sendNotification':
      return sendNotification(
        p,
        p._session
      );



    /* ========================================================
       الملف الشخصي
       ======================================================== */

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



    /* ========================================================
       الإعدادات
       ======================================================== */

    case 'getSettings':
      return getSettings();


    case 'updateSettings':
      return updateSettings(
        p.data,
        p._session
      );



    /* ========================================================
       سجل العمليات
       ======================================================== */

    case 'getOperationLog':
      return getOperationLog();



    /* ========================================================
       النسخ الاحتياطية
       ======================================================== */

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



    /* ========================================================
       GOOGLE DRIVE
       ======================================================== */

    /*
     * جلب مجلدات زاد الحلقات
     */
    case 'getDriveFolders':

      return getDriveFolders();



    /*
     * جلب الملفات من مجلد معين
     *
     * مثال:
     * category = pdf
     * category = audio
     * category = certificates
     * category = studentPhotos
     * category = branding
     * category = documents
     */
    case 'getDriveFiles':

      return getDriveFiles(
        p.category
      );



    /*
     * معلومات مجلد
     */
    case 'getDriveFolderInfo':

      return getDriveFolderInfo(
        p.category
      );



    /*
     * ملف محدد
     */
    case 'getDriveFile':

      return getDriveFile(
        p.fileId
      );



    /* ========================================================
       اختبارات Google Drive
       ======================================================== */

    case 'testDriveRoot':

      return testDriveRoot();



    case 'setupDriveFolders':

      return setupDriveFolders();



    case 'testAllDriveFolders':

      return testAllDriveFolders();



    /* ========================================================
       عملية غير معروفة
       ======================================================== */

    default:

      throw new Error(
        'عملية غير معروفة: ' +
        action
      );
  }
}


/* ============================================================
   استجابة ناجحة
   ============================================================ */

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


/* ============================================================
   استجابة خطأ
   ============================================================ */

function jsonError(
  message,
  code
) {

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


/* ============================================================
   تسجيل الأخطاء
   ============================================================ */

function logError(
  action,
  err
) {

  try {

    if (
      typeof getSpreadsheet !==
      'function'
    ) {
      return;
    }


    var ss =
      getSpreadsheet();


    if (!ss) {
      return;
    }


    if (
      typeof SHEETS ===
      'undefined'
    ) {
      return;
    }


    if (
      !SHEETS.OPERATION_LOG
    ) {
      return;
    }


    var sheet =
      ss.getSheetByName(
        SHEETS.OPERATION_LOG
      );


    if (!sheet) {
      return;
    }


    var errorMessage =
      err &&
      err.message
        ? err.message
        : String(err);


    var id =
      typeof uuid === 'function'
        ? uuid()
        : Utilities.getUuid();


    sheet.appendRow([
      id,
      new Date().toISOString(),
      'system',
      'النظام',
      'system',
      'خطأ',
      'العملية: ' +
        action +
        ' — الخطأ: ' +
        errorMessage
    ]);


  } catch (e) {

    /*
     * لا نوقف الطلب إذا فشل تسجيل الخطأ.
     */

    console.error(
      'logError failed:',
      e
    );
  }
}
