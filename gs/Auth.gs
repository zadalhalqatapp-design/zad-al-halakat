/**
 * تسجيل الدخول — يبحث في المديرين والمشرفين والطلاب
 */
function login(email, password) {
  if (!email || !password) {
    var e = new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.'); // تم التصحيح
    e.code = 'INVALID_CREDENTIALS';
    throw e;
  }

  email = String(email).trim().toLowerCase();

  // البحث في المديرين
  var user = findUserByEmail(SHEETS.ADMINS, email);
  var role = 'admin';
  // البحث في المشرفين
  if (!user) {
    user = findUserByEmail(SHEETS.SUPERVISORS, email);
    role = 'supervisor';
  }
  // البحث في الطلاب
  if (!user) {
    user = findUserByEmail(SHEETS.STUDENTS, email);
    role = 'student';
  }

  if (!user || !verifyPassword(password, user.passwordHash)) {
    var err = new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.'); // تم التصحيح
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }

  // التحقق من حالة الطالب
  if (role === 'student') {
    if (user.status === 'pending') {
      var pe = new Error('حسابك قيد المراجعة من قبل الإدارة.');
      pe.code = 'PENDING';
      throw pe;
    }
    if (user.status === 'rejected') {
      var re = new Error(user.rejectionReason || 'تم رفض حسابك.');
      re.code = 'REJECTED';
      throw re;
    }
    if (user.status === 'suspended') {
      var se = new Error(user.suspensionReason || 'تم إيقاف حسابك.');
      se.code = 'SUSPENDED';
      throw se;
    }
  }

  // إنشاء جلسة
  var session = createSession(user, role);
  logOperation(user, 'تسجيل الدخول', 'نجاح');

  return {
    session: session,
    user: sanitizeUser(Object.assign(user, { role: role }))
  };
}

/**
 * تسجيل الخروج
 */
function logout(token) {
  if (!token) return { success: true };
  var sessionSheet = getSheet(SHEETS.SESSIONS);
  var sessions = sheetToObjects(sessionSheet);
  var session = sessions.find(function(s) { return s.token === token; });
  if (session) {
    // تم التعديل هنا ليعتمد دائماً على token لتجنب الأخطاء إذا لم يوجد عمود id
    deleteRowById(sessionSheet, session.token); 
    logOperation({ id: session.userId, name: session.name, role: session.role }, 'تسجيل الخروج', 'نجاح');
  }
  return { success: true };
}
