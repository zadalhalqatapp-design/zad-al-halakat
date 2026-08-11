import { useAsync } from '@/hooks/useAsync';
import { api } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState, Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Certificate } from '@/types';
import { Award, Download, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export function StudentCertificates() {
  const { user } = useAuth();
  const { notify } = useToast();

  const { data, loading } = useAsync(
    () => api.getCertificates(user!.id) as Promise<Certificate[]>,
    [user?.id],
  );

  const certificates = data || [];

  const generatePDF = async (cert: Certificate) => {
    try {
      notify('جارٍ إعداد الشهادة...', 'info');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      /*
       * ============================================================
       * خلفية الشهادة
       * ============================================================
       */

      pdf.setFillColor(247, 249, 248);
      pdf.rect(0, 0, pageW, pageH, 'F');

      /*
       * ============================================================
       * الإطار الخارجي
       * ============================================================
       */

      pdf.setDrawColor(45, 128, 104);
      pdf.setLineWidth(2);
      pdf.rect(10, 10, pageW - 20, pageH - 20);

      /*
       * الإطار الداخلي
       */

      pdf.setDrawColor(216, 143, 32);
      pdf.setLineWidth(0.5);
      pdf.rect(14, 14, pageW - 28, pageH - 28);

      /*
       * ============================================================
       * الشعار
       * ============================================================
       *
       * شعار المشروع موجود في:
       * public/logo.png
       *
       * يتم تحميله وتحويله إلى Data URL قبل إضافته إلى PDF.
       */

      try {
        const logoResponse = await fetch('/logo.png');

        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob();

          const logoDataUrl = await new Promise<string>(
            (resolve, reject) => {
              const reader = new FileReader();

              reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                  resolve(reader.result);
                } else {
                  reject(new Error('تعذر قراءة الشعار'));
                }
              };

              reader.onerror = () => {
                reject(new Error('تعذر تحميل الشعار'));
              };

              reader.readAsDataURL(logoBlob);
            },
          );

          /*
           * الشعار في أعلى الشهادة
           */
          pdf.addImage(
            logoDataUrl,
            'PNG',
            pageW / 2 - 18,
            20,
            36,
            25,
          );
        }
      } catch {
        /*
         * في حال تعذر تحميل الشعار لا نوقف إنشاء الشهادة.
         */
      }

      /*
       * ============================================================
       * اسم البرنامج
       * ============================================================
       */

      pdf.setTextColor(31, 102, 79);
      pdf.setFontSize(25);
      pdf.setFont('helvetica', 'bold');

      pdf.text(
        'زاد الحلقات',
        pageW / 2,
        55,
        {
          align: 'center',
        },
      );

      /*
       * ============================================================
       * عنوان الشهادة
       * ============================================================
       */

      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(66, 74, 69);

      pdf.text(
        'شهادة إتمام',
        pageW / 2,
        65,
        {
          align: 'center',
        },
      );

      /*
       * ============================================================
       * الخط الفاصل
       * ============================================================
       */

      pdf.setDrawColor(216, 143, 32);
      pdf.setLineWidth(1);

      pdf.line(
        pageW / 2 - 40,
        71,
        pageW / 2 + 40,
        71,
      );

      /*
       * ============================================================
       * اسم الطالب
       * ============================================================
       */

      pdf.setFontSize(23);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(26, 31, 28);

      pdf.text(
        cert.studentName,
        pageW / 2,
        90,
        {
          align: 'center',
        },
      );

      /*
       * ============================================================
       * نص الشهادة
       * ============================================================
       */

      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(66, 74, 69);

      pdf.text(
        'تشهد إدارة زاد الحلقات بأن الطالب قد أتم البرنامج بنجاح',
        pageW / 2,
        105,
        {
          align: 'center',
        },
      );

      /*
       * ============================================================
       * اسم الدورة
       * ============================================================
       */

      pdf.setFontSize(19);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(31, 102, 79);

      pdf.text(
        cert.cycleName,
        pageW / 2,
        118,
        {
          align: 'center',
        },
      );

      /*
       * ============================================================
       * نسبة الإنجاز
       * ============================================================
       */

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(66, 74, 69);

      pdf.text(
        `نسبة الإنجاز: ${cert.progressPercent}%`,
        pageW / 2,
        132,
        {
          align: 'center',
        },
      );

      /*
       * ============================================================
       * معلومات الشهادة
       * ============================================================
       */

      pdf.setFontSize(10);

      pdf.text(
        `رقم الشهادة: ${cert.certificateNumber}`,
        pageW / 2,
        143,
        {
          align: 'center',
        },
      );

      pdf.text(
        `تاريخ الإصدار: ${cert.issueDate}`,
        pageW / 2,
        150,
        {
          align: 'center',
        },
      );

      /*
       * ============================================================
       * QR Code
       * ============================================================
       */

      try {
        const qrData = JSON.stringify({
          id: cert.id,
          certificateNumber: cert.certificateNumber,
          studentName: cert.studentName,
          issueDate: cert.issueDate,
        });

        const qrDataUrl = await QRCode.toDataURL(qrData, {
          width: 250,
          margin: 1,
          errorCorrectionLevel: 'M',
        });

        pdf.addImage(
          qrDataUrl,
          'PNG',
          20,
          pageH - 55,
          35,
          35,
        );
      } catch {
        /*
         * فشل إنشاء QR لا يمنع إنشاء الشهادة.
         */
      }

      /*
       * ============================================================
       * التوقيع
       * ============================================================
       */

      pdf.setDrawColor(120, 120, 120);
      pdf.setLineWidth(0.3);

      pdf.line(
        pageW - 75,
        pageH - 28,
        pageW - 30,
        pageH - 28,
      );

      pdf.setFontSize(9);
      pdf.setTextColor(66, 74, 69);

      pdf.text(
        'التوقيع المعتمد',
        pageW - 52.5,
        pageH - 22,
        {
          align: 'center',
        },
      );

      /*
       * ============================================================
       * حفظ الملف
       * ============================================================
       */

      pdf.save(
        `certificate-${cert.certificateNumber}.pdf`,
      );

      notify('تم تنزيل الشهادة بنجاح', 'success');
    } catch (error) {
      console.error('Certificate PDF error:', error);

      notify(
        'تعذّر إنشاء ملف الشهادة.',
        'error',
      );
    }
  };

  /*
   * ================================================================
   * حالة التحميل
   * ================================================================
   */

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-16"
        dir="rtl"
      >
        جارٍ التحميل...
      </div>
    );
  }

  /*
   * ================================================================
   * الصفحة
   * ================================================================
   */

  return (
    <div dir="rtl" className="space-y-6">

      <PageHeader
        title="الشهادات"
        subtitle="استعرض شهادات إتمام البرامج التي أنجزتها وقم بتنزيلها بصيغة PDF."
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
                    <span className="flex items-center gap-1">
                      <CheckCircle size={14} />
                      معتمدة
                    </span>
                  </Badge>

                </div>

                <h3 className="text-lg font-bold mt-3">
                  {cert.cycleName}
                </h3>

              </div>

              {/* معلومات الشهادة */}
              <div className="space-y-3 mb-5">

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

              {/* زر التنزيل */}
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

/*
 * ================================================================
 * صف معلومات الشهادة
 * ================================================================
 */

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-outline/50 last:border-b-0">

      <span className="text-sm text-on-surface-variant">
        {label}
      </span>

      <span className="text-sm font-medium text-on-surface text-left">
        {value}
      </span>

    </div>
  );
}
