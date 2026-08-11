import { useAsync } from '@/hooks/useAsync';
import { api } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState, Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Certificate } from '@/types';
import { Award, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

/**
 * تحميل ملف الخط وتحويله إلى Base64
 * حتى يمكن تضمينه داخل ملف PDF.
 */
async function loadFontAsBase64(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`تعذر تحميل الخط: ${url}`);
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result as string;

      if (!result.includes(',')) {
        reject(new Error('تعذر قراءة ملف الخط.'));
        return;
      }

      resolve(result.split(',')[1]);
    };

    reader.onerror = () => {
      reject(new Error('تعذر قراءة ملف الخط.'));
    };

    reader.readAsDataURL(blob);
  });
}

/**
 * تحميل صورة وتحويلها إلى Data URL
 */
async function loadImageAsDataUrl(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`تعذر تحميل الصورة: ${url}`);
  }

  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      reject(new Error('تعذر قراءة الصورة.'));
    };

    reader.readAsDataURL(blob);
  });
}

/**
 * تجهيز النص العربي إذا كانت نسخة jsPDF الحالية
 * توفر processArabic.
 */
function prepareArabicText(pdf: jsPDF, text: string): string {
  const processor = (pdf as unknown as {
    processArabic?: (value: string) => string;
  }).processArabic;

  if (typeof processor === 'function') {
    return processor(text);
  }

  return text;
}

export function StudentCertificates() {
  const { user } = useAuth();
  const { notify } = useToast();

  const { data, loading } = useAsync(
    () =>
      api.getCertificates(user!.id) as Promise<Certificate[]>,
    [user?.id],
  );

  const certificates = data || [];

  /**
   * إنشاء شهادة PDF
   */
  const generatePDF = async (cert: Certificate) => {
    try {
      notify('جارٍ إعداد الشهادة...', 'info');

      // =====================================================
      // إنشاء ملف PDF
      // =====================================================

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // =====================================================
      // تحميل الخط العربي
      // =====================================================

      const regularFont = await loadFontAsBase64(
        '/fonts/Tajawal-Regular.ttf',
      );

      const boldFont = await loadFontAsBase64(
        '/fonts/Tajawal-Bold.ttf',
      );

      pdf.addFileToVFS(
        'Tajawal-Regular.ttf',
        regularFont,
      );

      pdf.addFont(
        'Tajawal-Regular.ttf',
        'Tajawal',
        'normal',
      );

      pdf.addFileToVFS(
        'Tajawal-Bold.ttf',
        boldFont,
      );

      pdf.addFont(
        'Tajawal-Bold.ttf',
        'Tajawal',
        'bold',
      );

      pdf.setFont('Tajawal', 'normal');

      // =====================================================
      // دعم RTL
      // =====================================================

      const rtlPdf = pdf as unknown as {
        setR2L?: (value: boolean) => void;
      };

      if (typeof rtlPdf.setR2L === 'function') {
        rtlPdf.setR2L(true);
      }

      // =====================================================
      // ألوان التصميم
      // =====================================================

      const green: [number, number, number] = [
        24,
        91,
        70,
      ];

      const greenLight: [number, number, number] = [
        45,
        128,
        104,
      ];

      const gold: [number, number, number] = [
        190,
        139,
        43,
      ];

      const goldLight: [number, number, number] = [
        225,
        210,
        170,
      ];

      const dark: [number, number, number] = [
        45,
        48,
        46,
      ];

      const gray: [number, number, number] = [
        95,
        99,
        96,
      ];

      const cream: [number, number, number] = [
        250,
        249,
        244,
      ];

      // =====================================================
      // الخلفية
      // =====================================================

      pdf.setFillColor(...cream);

      pdf.rect(
        0,
        0,
        pageW,
        pageH,
        'F',
      );

      // =====================================================
      // الإطار الخارجي
      // =====================================================

      pdf.setDrawColor(...green);
      pdf.setLineWidth(2);

      pdf.rect(
        7,
        7,
        pageW - 14,
        pageH - 14,
      );

      // =====================================================
      // الإطار الذهبي
      // =====================================================

      pdf.setDrawColor(...gold);
      pdf.setLineWidth(0.8);

      pdf.rect(
        11,
        11,
        pageW - 22,
        pageH - 22,
      );

      // =====================================================
      // الإطار الداخلي
      // =====================================================

      pdf.setDrawColor(...goldLight);
      pdf.setLineWidth(0.35);

      pdf.rect(
        15,
        15,
        pageW - 30,
        pageH - 30,
      );

      // =====================================================
      // زخارف بسيطة في الزوايا
      // =====================================================

      const drawCornerDecoration = (
        x: number,
        y: number,
        flipX = false,
        flipY = false,
      ) => {
        const directionX = flipX ? -1 : 1;
        const directionY = flipY ? -1 : 1;

        pdf.setDrawColor(...gold);
        pdf.setLineWidth(0.5);

        pdf.line(
          x,
          y,
          x + 12 * directionX,
          y,
        );

        pdf.line(
          x,
          y,
          x,
          y + 12 * directionY,
        );

        pdf.setDrawColor(...greenLight);
        pdf.setLineWidth(0.35);

        pdf.line(
          x + 3 * directionX,
          y,
          x + 9 * directionX,
          y + 6 * directionY,
        );

        pdf.line(
          x,
          y + 3 * directionY,
          x + 6 * directionX,
          y + 9 * directionY,
        );
      };

      drawCornerDecoration(20, 20);
      drawCornerDecoration(pageW - 20, 20, true, false);
      drawCornerDecoration(20, pageH - 20, false, true);
      drawCornerDecoration(
        pageW - 20,
        pageH - 20,
        true,
        true,
      );

      // =====================================================
      // الشعار
      // =====================================================

      try {
        const logoData = await loadImageAsDataUrl(
          '/logo.png',
        );

        pdf.addImage(
          logoData,
          'PNG',
          pageW / 2 - 15,
          18,
          30,
          30,
          undefined,
          'FAST',
        );
      } catch (logoError) {
        console.warn(
          'تعذر تحميل شعار زاد الحلقات:',
          logoError,
        );
      }

      // =====================================================
      // اسم المؤسسة
      // =====================================================

      pdf.setFont(
        'Tajawal',
        'bold',
      );

      pdf.setFontSize(18);

      pdf.setTextColor(...green);

      pdf.text(
        prepareArabicText(
          pdf,
          'زاد الحلقات',
        ),
        pageW / 2,
        53,
        {
          align: 'center',
        },
      );

      // =====================================================
      // عنوان الشهادة
      // =====================================================

      pdf.setFontSize(26);

      pdf.setTextColor(...green);

      pdf.text(
        prepareArabicText(
          pdf,
          'شهادة إتمام البرنامج',
        ),
        pageW / 2,
        67,
        {
          align: 'center',
        },
      );

      // =====================================================
      // الخط الذهبي
      // =====================================================

      pdf.setDrawColor(...gold);
      pdf.setLineWidth(1);

      pdf.line(
        pageW / 2 - 45,
        73,
        pageW / 2 + 45,
        73,
      );

      // =====================================================
      // النص التعريفي
      // =====================================================

      pdf.setFont(
        'Tajawal',
        'normal',
      );

      pdf.setFontSize(12);

      pdf.setTextColor(...gray);

      pdf.text(
        prepareArabicText(
          pdf,
          'تشهد إدارة زاد الحلقات بأن',
        ),
        pageW / 2,
        84,
        {
          align: 'center',
        },
      );

      // =====================================================
      // اسم الطالب
      // =====================================================

      pdf.setFont(
        'Tajawal',
        'bold',
      );

      pdf.setFontSize(24);

      pdf.setTextColor(...green);

      pdf.text(
        prepareArabicText(
          pdf,
          cert.studentName,
        ),
        pageW / 2,
        98,
        {
          align: 'center',
        },
      );

      // =====================================================
      // خط أسفل الاسم
      // =====================================================

      pdf.setDrawColor(...gold);
      pdf.setLineWidth(0.6);

      pdf.line(
        pageW / 2 - 45,
        103,
        pageW / 2 + 45,
        103,
      );

      // =====================================================
      // النص
      // =====================================================

      pdf.setFont(
        'Tajawal',
        'normal',
      );

      pdf.setFontSize(12);

      pdf.setTextColor(...gray);

      pdf.text(
        prepareArabicText(
          pdf,
          'قد أتم بنجاح برنامج',
        ),
        pageW / 2,
        114,
        {
          align: 'center',
        },
      );

      // =====================================================
      // اسم الدورة
      // =====================================================

      pdf.setFont(
        'Tajawal',
        'bold',
      );

      pdf.setFontSize(19);

      pdf.setTextColor(...green);

      pdf.text(
        prepareArabicText(
          pdf,
          cert.cycleName,
        ),
        pageW / 2,
        126,
        {
          align: 'center',
        },
      );

      // =====================================================
      // نسبة الإنجاز
      // =====================================================

      pdf.setFont(
        'Tajawal',
        'normal',
      );

      pdf.setFontSize(12);

      pdf.setTextColor(...dark);

      pdf.text(
        prepareArabicText(
          pdf,
          `نسبة الإنجاز: ${cert.progressPercent}%`,
        ),
        pageW / 2,
        138,
        {
          align: 'center',
        },
      );

      // =====================================================
      // خط فاصل
      // =====================================================

      pdf.setDrawColor(210, 205, 190);
      pdf.setLineWidth(0.4);

      pdf.line(
        65,
        148,
        pageW - 65,
        148,
      );

      // =====================================================
      // رقم الشهادة
      // =====================================================

      pdf.setFont(
        'Tajawal',
        'normal',
      );

      pdf.setFontSize(9);

      pdf.setTextColor(...gray);

      pdf.text(
        prepareArabicText(
          pdf,
          'رقم الشهادة',
        ),
        90,
        158,
        {
          align: 'center',
        },
      );

      pdf.setFont(
        'Tajawal',
        'bold',
      );

      pdf.setFontSize(10);

      pdf.setTextColor(...dark);

      pdf.text(
        cert.certificateNumber,
        90,
        166,
        {
          align: 'center',
        },
      );

      // =====================================================
      // تاريخ الإصدار
      // =====================================================

      pdf.setFont(
        'Tajawal',
        'normal',
      );

      pdf.setFontSize(9);

      pdf.setTextColor(...gray);

      pdf.text(
        prepareArabicText(
          pdf,
          'تاريخ الإصدار',
        ),
        pageW / 2,
        158,
        {
          align: 'center',
        },
      );

      pdf.setFont(
        'Tajawal',
        'bold',
      );

      pdf.setFontSize(10);

      pdf.setTextColor(...dark);

      pdf.text(
        cert.issueDate,
        pageW / 2,
        166,
        {
          align: 'center',
        },
      );

      // =====================================================
      // QR Code
      // =====================================================

      try {
        const qrData = JSON.stringify({
          id: cert.id,
          num: cert.certificateNumber,
          student: cert.studentName,
          cycle: cert.cycleName,
          date: cert.issueDate,
        });

        const qrDataUrl =
          await QRCode.toDataURL(
            qrData,
            {
              width: 400,
              margin: 1,
              errorCorrectionLevel: 'H',
            },
          );

        pdf.addImage(
          qrDataUrl,
          'PNG',
          20,
          pageH - 56,
          38,
          38,
          undefined,
          'FAST',
        );

        pdf.setFont(
          'Tajawal',
          'normal',
        );

        pdf.setFontSize(7);

        pdf.setTextColor(...gray);

        pdf.text(
          prepareArabicText(
            pdf,
            'رمز التحقق',
          ),
          39,
          pageH - 14,
          {
            align: 'center',
          },
        );
      } catch (qrError) {
        console.warn(
          'تعذر إنشاء QR Code:',
          qrError,
        );
      }

      // =====================================================
      // ختم "شهادة معتمدة"
      // =====================================================

      pdf.setDrawColor(...gold);
      pdf.setLineWidth(1);

      pdf.circle(
        pageW / 2,
        pageH - 32,
        14,
      );

      pdf.setDrawColor(...green);
      pdf.setLineWidth(0.4);

      pdf.circle(
        pageW / 2,
        pageH - 32,
        11,
      );

      pdf.setFont(
        'Tajawal',
        'bold',
      );

      pdf.setFontSize(9);

      pdf.setTextColor(...green);

      pdf.text(
        prepareArabicText(
          pdf,
          'شهادة',
        ),
        pageW / 2,
        pageH - 34,
        {
          align: 'center',
        },
      );

      pdf.text(
        prepareArabicText(
          pdf,
          'معتمدة',
        ),
        pageW / 2,
        pageH - 28,
        {
          align: 'center',
        },
      );

      // =====================================================
      // التوقيع
      // =====================================================

      pdf.setDrawColor(100, 100, 100);
      pdf.setLineWidth(0.3);

      pdf.line(
        pageW - 75,
        pageH - 25,
        pageW - 30,
        pageH - 25,
      );

      pdf.setFont(
        'Tajawal',
        'normal',
      );

      pdf.setFontSize(8);

      pdf.setTextColor(...gray);

      pdf.text(
        prepareArabicText(
          pdf,
          'التوقيع المعتمد',
        ),
        pageW - 52.5,
        pageH - 19,
        {
          align: 'center',
        },
      );

      // =====================================================
      // رقم الشهادة بشكل صغير أسفل الصفحة
      // =====================================================

      pdf.setFont(
        'Tajawal',
        'normal',
      );

      pdf.setFontSize(6);

      pdf.setTextColor(150, 150, 150);

      pdf.text(
        cert.certificateNumber,
        pageW / 2,
        pageH - 10,
        {
          align: 'center',
        },
      );

      // =====================================================
      // حفظ الملف
      // =====================================================

      pdf.save(
        `شهادة-${cert.certificateNumber}.pdf`,
      );

      notify(
        'تم تنزيل الشهادة بنجاح',
        'success',
      );
    } catch (error) {
      console.error(
        'Certificate PDF Error:',
        error,
      );

      notify(
        'تعذّر إنشاء ملف الشهادة. تأكد من وجود ملفات الخط العربي.',
        'error',
      );
    }
  };

  // =======================================================
  // حالة التحميل
  // =======================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        جارٍ التحميل...
      </div>
    );
  }

  // =======================================================
  // الصفحة
  // =======================================================

  return (
    <div dir="rtl">
      <PageHeader
        title="الشهادات"
        description="الشهادات الصادرة لك من زاد الحلقات"
      />

      {certificates.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Award size={48} />}
            title="لا توجد شهادات بعد"
            description="ستظهر شهاداتك هنا بعد إكمال البرنامج وإصدارها من قبل المشرف."
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {certificates.map((cert) => (
            <Card
              key={cert.id}
              className="overflow-hidden"
            >
              {/* رأس بطاقة الشهادة */}
              <div className="bg-gradient-to-l from-primary-600 to-primary-700 text-white p-5 -m-5 mb-4">
                <div className="flex items-center justify-between">
                  <Award size={32} />

                  <Badge variant="success">
                    معتمدة
                  </Badge>
                </div>

                <h3 className="text-lg font-bold mt-3">
                  {cert.cycleName}
                </h3>

                <p className="text-sm opacity-90 mt-1">
                  شهادة إتمام البرنامج
                </p>
              </div>

              {/* معلومات الشهادة */}
              <div className="space-y-2 mb-4">
                <Row
                  label="رقم الشهادة"
                  value={cert.certificateNumber}
                />

                <Row
                  label="تاريخ الإصدار"
                  value={cert.issueDate}
                />

                <Row
                  label="نسبة الإنجاز"
                  value={`${cert.progressPercent}%`}
                />
              </div>

              {/* زر التحميل */}
              <Button
                fullWidth
                icon={<Download size={18} />}
                onClick={() => generatePDF(cert)}
              >
                تنزيل الشهادة (PDF)
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// =========================================================
// صف معلومات الشهادة
// =========================================================

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 py-2"
      dir="rtl"
    >
      <span className="text-sm text-on-surface-variant">
        {label}
      </span>

      <span className="font-medium text-on-surface">
        {value}
      </span>
    </div>
  );
}
