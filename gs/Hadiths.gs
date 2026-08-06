/**
 * إدارة الأحاديث والإنجاز والمقرر اليومي
 */

// ===== الأحاديث =====

function getHadiths() {
  var sheet = getSheet(SHEETS.HADITHS);
  var hadiths = sheetToObjects(sheet);
  hadiths.sort(function(a, b) { return Number(a.number) - Number(b.number); });
  return hadiths.map(function(h) {
    h.number = Number(h.number);
    h._row = undefined;
    return h;
  });
}

function getHadith(hadithId) {
  var sheet = getSheet(SHEETS.HADITHS);
  return sanitizeHadith(findById(sheet, hadithId));
}

function addHadith(data, session) {
  requireRole(session, ['admin']);
  if (!data.text || !data.explanation) throw new Error('النص والشرح مطلوبان.');

  var sheet = getSheet(SHEETS.HADITHS);
  var hadith = {
    id: uuid(),
    number: Number(data.number) || (sheet.getLastRow()),
    text: data.text,
    explanation: data.explanation,
    youtubeUrl: data.youtubeUrl || '',
    audioUrl: data.audioUrl || '',
    pdfUrl: data.pdfUrl || '',
    category: data.category || '',
    narrator: data.narrator || ''
  };
  appendRow(sheet, hadith);
  logOperation(session, 'إضافة حديث', 'رقم ' + hadith.number);
  return { success: true };
}

function updateHadith(hadithId, data, session) {
  requireRole(session, ['admin']);
  var sheet = getSheet(SHEETS.HADITHS);
  var hadith = findById(sheet, hadithId);
  if (!hadith) throw new Error('الحديث غير موجود.');

  var updates = {};
  ['number', 'text', 'explanation', 'youtubeUrl', 'audioUrl', 'pdfUrl', 'category', 'narrator'].forEach(function(f) {
    if (data[f] !== undefined) updates[f] = data[f];
  });
  updateRow(sheet, hadithId, updates);
  logOperation(session, 'تعديل حديث', 'رقم ' + hadith.number);
  return { success: true };
}

function deleteHadith(hadithId, session) {
  requireRole(session, ['admin']);
  var sheet = getSheet(SHEETS.HADITHS);
  var hadith = findById(sheet, hadithId);
  if (!hadith) throw new Error('الحديث غير موجود.');

  deleteRowById(sheet, hadithId);
  logOperation(session, 'حذف حديث', 'رقم ' + hadith.number);
  return { success: true };
}

function sanitizeHadith(h) {
  if (!h) return null;
  delete h._row;
  if (h.number !== undefined) h.number = Number(h.number);
  return h;
}

// ===== الإنجاز =====

function getProgress(studentId) {
  var sheet = getSheet(SHEETS.PROGRESS);
  var all = sheetToObjects(sheet);
  return all.filter(function(p) { return p.studentId === studentId; }).map(function(p) {
    p.memorized = toBool(p.memorized);
    p.listened = toBool(p.listened);
    p.read = toBool(p.read);
    delete p._row;
    return p;
  });
}

function saveProgress(hadithId, field, value, session) {
  requireRole(session, ['student']);
  var studentId = session.userId;
  var sheet = getSheet(SHEETS.PROGRESS);

  // البحث عن سجل موجود
  var rows = sheetToObjects(sheet);
  var existing = null;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].studentId === studentId && rows[i].hadithId === hadithId) {
      existing = rows[i];
      break;
    }
  }

  if (existing) {
    var updates = {};
    updates[field] = value;
    updates.updatedAt = new Date().toISOString();
    updateRow(sheet, existing.id, updates);
  } else {
    var newRecord = {
      id: uuid(),
      studentId: studentId,
      hadithId: hadithId,
      memorized: field === 'memorized' ? value : false,
      listened: field === 'listened' ? value : false,
      read: field === 'read' ? value : false,
      updatedAt: new Date().toISOString()
    };
    appendRow(sheet, newRecord);
  }

  return { success: true };
}

// ===== المقرر اليومي =====

function getDailyLessons(session) {
  var hadiths = getHadiths();
  var cycle = getActiveCycle();

  // حساب اليوم الحالي
  var currentDay = 1;
  var cycleDate = cycle ? new Date(cycle.startDate) : new Date();
  var today = new Date();
  var diffMs = today.getTime() - cycleDate.getTime();
  var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  currentDay = Math.min(diffDays + 1, PROGRAM_DAYS);

  // أحاديث اليوم
  var startIdx = (currentDay - 1) * HADITHS_PER_DAY;
  var dayHadiths = hadiths.slice(startIdx, startIdx + HADITHS_PER_DAY);

  return {
    day: currentDay,
    date: formatDate(today),
    hadiths: dayHadiths
  };
}

function getActiveCycle() {
  var sheet = getSheet(SHEETS.CYCLES);
  var cycles = sheetToObjects(sheet);
  for (var i = 0; i < cycles.length; i++) {
    if (cycles[i].status === 'active') return cycles[i];
  }
  return null;
}
