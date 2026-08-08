function addHadith(data, session) {
  requireRole(session, ['admin']);
  if (!data.text || !data.explanation) throw new Error('النص والشرح مطلوبان.');

  var sheet = getSheet(SHEETS.HADITHS);
  
  // -- التعديل يبدأ هنا لحساب الرقم الصحيح للحديث --
  var hadithNumber = Number(data.number);
  if (!hadithNumber) {
    var existingHadiths = sheetToObjects(sheet);
    var maxNumber = 0;
    for (var i = 0; i < existingHadiths.length; i++) {
      var currentNum = Number(existingHadiths[i].number) || 0;
      if (currentNum > maxNumber) {
        maxNumber = currentNum;
      }
    }
    hadithNumber = maxNumber + 1;
  }
  // -- نهاية التعديل --

  var hadith = {
    id: uuid(),
    number: hadithNumber,
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
