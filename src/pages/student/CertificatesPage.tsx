import { useEffect, useRef, useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { api } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState, Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Certificate } from '@/types';
import {
  Award,
  Download,
  X,
} from 'lucide-react';
import { CertificateTemplate } from '@/components/certificates/CertificateTemplate';

export function StudentCertificates() {
  const { user } = useAuth();
  const { notify } = useToast();

  const {
    data,
    loading,
  } = useAsync(
    () =>
      api.getCertificates(
        user!.id,
      ) as Promise<Certificate[]>,
    [user?.id],
  );

  const certificates = data || [];

  const [printCertificate, setPrintCertificate] =
    useState<Certificate | null>(null);

  const printContainerRef =
    useRef<HTMLDivElement>(null);

  /**
   * مراقبة حالة الشهادة التي سيتم طباعتها.
   *
   * بعد عرض الشهادة في DOM ننتظر حتى يتم تحميل
   * الصور و QR ثم نفتح نافذة الطباعة.
   */
  useEffect(() => {
    if (!printCertificate) {
      return;
    }

    const handleAfterPrint = () => {
      setPrintCertificate(null);
    };

    window.addEventListener(
      'afterprint',
      handleAfterPrint,
    );

    const waitForImagesAndPrint =
      async () => {
        // انتظار بسيط حتى يتم بناء الشهادة
        await new Promise((resolve) =>
          setTimeout(resolve, 500),
        );

        const container =
          printContainerRef.current;

        if (!container) {
          return;
        }

        const images =
          Array.from(
            container.querySelectorAll(
              'img',
            ),
          );

        await Promise.all(
          images.map(
            (image) => {
              if (image.complete) {
                return Promise.resolve();
              }

              return new Promise<void>(
                (resolve) => {
                  image.onload = () =>
                    resolve();

                  image.onerror = () =>
                    resolve();
                },
              );
            },
          ),
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 300),
        );

        window.print();
      };

    waitForImagesAndPrint();

    return () => {
      window.removeEventListener(
        'afterprint',
        handleAfterPrint,
      );
    };
  }, [printCertificate]);

  /**
   * فتح الشهادة وتجهيزها للطباعة.
   */
  const generatePDF = (
    certificate: Certificate,
  ) => {
    try {
      setPrintCertificate(
        certificate,
      );
    } catch (error) {
      console.error(error);

      notify(
        'تعذر تجهيز الشهادة للطباعة.',
        'error',
      );
    }
  };

  /**
   * إغلاق معاينة الشهادة.
   */
  const closePrintPreview = () => {
    setPrintCertificate(null);
  };

  // =====================================================
  // التحميل
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        جارٍ التحميل...
      </div>
    );
  }

  // =====================================================
  // معاينة الشهادة قبل الطباعة
  // =====================================================

  if (printCertificate) {
    return (
      <div
        ref={printContainerRef}
        className="fixed inset-0 z-[9999] overflow-auto bg-surface"
        dir="rtl"
      >
        {/* شريط التحكم - لا يظهر عند الطباعة */}
        <div className="print:hidden sticky top-0 z-50 flex items-center justify-between gap-3 border-b border-outline bg-surface px-4 py-3 shadow-sm">
          <div>
            <h2 className="font-bold text-on-surface">
              معاينة الشهادة
            </h2>

            <p className="text-xs text-on-surface-variant">
              اضغط على «طباعة / حفظ PDF» ثم اختر «حفظ كملف PDF».
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              icon={<Download size={18} />}
              onClick={() =>
                window.print()
              }
            >
              طباعة / حفظ PDF
            </Button>

            <Button
              variant="text"
              icon={<X size={18} />}
              onClick={
                closePrintPreview
              }
            >
              إغلاق
            </Button>
          </div>
        </div>

        {/* الشهادة */}
        <div className="min-h-full flex items-start justify-center py-8 print:p-0">
          <CertificateTemplate
            certificate={
              printCertificate
            }
          />
        </div>
      </div>
    );
  }

  // =====================================================
  // لا توجد شهادات
  // =====================================================

  return (
    <div dir="rtl">
      <PageHeader
        title="الشهادات"
        description="الشهادات الصادرة لك من زاد الحلقات"
      />

      {certificates.length === 0 ? (
        <Card>
          <EmptyState
            icon={
              <Award size={48} />
            }
            title="لا توجد شهادات بعد"
            description="ستظهر شهاداتك هنا بعد إكمال البرنامج وإصدارها من قبل المشرف."
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {certificates.map(
            (cert) => (
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
                    value={
                      cert.certificateNumber
                    }
                  />

                  <Row
                    label="تاريخ الإصدار"
                    value={
                      cert.issueDate
                    }
                  />

                  <Row
                    label="نسبة الإنجاز"
                    value={`${cert.progressPercent}%`}
                  />
                </div>

                {/* زر الشهادة */}
                <Button
                  fullWidth
                  icon={
                    <Download
                      size={18}
                    />
                  }
                  onClick={() =>
                    generatePDF(
                      cert,
                    )
                  }
                >
                  تنزيل الشهادة (PDF)
                </Button>
              </Card>
            ),
          )}
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
