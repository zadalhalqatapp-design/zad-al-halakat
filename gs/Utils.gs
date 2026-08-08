/**
 * البحث عن صف بمعرّف — تم التعديل ليدعم البحث عن معرّفات بأسماء مختلفة (مثل token أو key)
 */
function findById(sheet, id) {
  var rows = sheetToObjects(sheet);
  for (var i = 0; i < rows.length; i++) {
    // البحث في الخصائص الأساسية إذا لم يكن المعرف اسمه id
    if (rows[i].id === id || rows[i].token === id || rows[i].key === id) return rows[i];
  }
  return null;
}

/**
 * تحديث صف بمعرّف — تم التصحيح لكتابة البيانات دفعة واحدة حقيقية
 */
function updateRow(sheet, id, updates) {
  var sheetName = sheet.getName();
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var updatedCols = [];

    for (var j = 0; j < headers.length; j++) {
      if (updates[headers[j]] !== undefined) {
        updatedCols.push({ index: j, value: updates[headers[j]] });
      }
    }

    if (updatedCols.length === 0) return false;

    // تحديد عمود المعرف ديناميكياً (غالباً id أو token أو key)
    var idColIndex = headers.indexOf('id');
    if (idColIndex === -1) idColIndex = headers.indexOf('token');
    if (idColIndex === -1) idColIndex = headers.indexOf('key');
    if (idColIndex === -1) idColIndex = 0; // احتياطي

    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][idColIndex] === id) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) return false;

    // -- التصحيح: كتابة جميع التحديثات دفعة واحدة باستخدام setValues --
    var targetRange = sheet.getRange(rowIndex + 1, 1, 1, headers.length);
    var rowData = targetRange.getValues()[0]; // جلب بيانات الصف الحالي
    
    for (var c = 0; c < updatedCols.length; c++) {
      rowData[updatedCols[c].index] = updatedCols[c].value; // تحديث القيم في الذاكرة
    }
    
    targetRange.setValues([rowData]); // كتابة الصف بأكمله دفعة واحدة
    // -- نهاية التصحيح --

    afterSheetWrite(sheetName);
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
  return true;
}

/**
 * حذف صف بمعرّف — تم التعديل لتحديد عمود المعرف ديناميكياً
 */
function deleteRowById(sheet, id) {
  var sheetName = sheet.getName();
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return false;
    
    var headers = data[0];
    var idColIndex = headers.indexOf('id');
    if (idColIndex === -1) idColIndex = headers.indexOf('token');
    if (idColIndex === -1) idColIndex = headers.indexOf('key');
    if (idColIndex === -1) idColIndex = 0; // احتياطي

    for (var i = 1; i < data.length; i++) {
      if (data[i][idColIndex] === id) { // الاعتماد على العمود الديناميكي
        sheet.deleteRow(i + 1);
        afterSheetWrite(sheetName);
        return true;
      }
    }
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
  return false;
}
