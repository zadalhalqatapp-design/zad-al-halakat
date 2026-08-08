function startCycle(name, studentIds, session) {
  requireRole(session, ['admin']);
  if (!name || !name.trim()) throw new Error('اسم الدورة مطلوب.');

  var sheet = getSheet(SHEETS.CYCLES);

  // إنهاء أي دورة نشطة سابقة
  var cycles = sheetToObjects(sheet);
  cycles.forEach(function(c) {
    if (c.status === 'active') {
      updateRow(sheet, c.id, { status: 'completed' });
    }
  });

  var startDate = new Date();
  var endDate = new Date(startDate.getTime() + PROGRAM_DAYS * 24 * 60 * 60 * 1000);

  var cycle = {
    id: uuid(),
    name: name.trim(),
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    status: 'active',
    studentIds: (studentIds || []).join(',')
  };
  appendRow(sheet, cycle);

  // -- التعديل يبدأ هنا (تحديث مجمع للطلاب لتجنب مشكلة الأداء) --
  if (studentIds && studentIds.length > 0) {
    var studentsSheet = getSheet(SHEETS.STUDENTS);
    var dataRange = studentsSheet.getDataRange();
    var values = dataRange.getValues();
    
    var headers = values[0];
    var idIndex = headers.indexOf('id');
    var cycleIdIndex = headers.indexOf('cycleId');
    var needsUpdate = false;

    if (idIndex !== -1 && cycleIdIndex !== -1) {
      for (var i = 1; i < values.length; i++) {
        var currentStudentId = values[i][idIndex];
        if (studentIds.indexOf(currentStudentId) !== -1) {
          values[i][cycleIdIndex] = cycle.id;
          needsUpdate = true;
        }
      }
      // حفظ البيانات دفعة واحدة بطلب واحد فقط
      if (needsUpdate) {
        dataRange.setValues(values);
      }
    }
  }
  // -- نهاية التعديل --

  logOperation(session, 'بدء دورة', name);
  return { success: true, cycleId: cycle.id };
}
