import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { Certificate } from '@/types';
import './CertificateTemplate.css';

interface CertificateTemplateProps {
  certificate: Certificate;
  preview?: boolean;
}

export function CertificateTemplate({
  certificate,
  preview = false,
}: CertificateTemplateProps) {
  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
    let mounted = true;

    const generateQR = async () => {
      try {
        const verificationData = JSON.stringify({
          id: certificate.id || 'preview',
          number:
            certificate.certificateNumber ||
            'PREVIEW',
          student: certificate.studentName,
          cycle: certificate.cycleName,
          issueDate: certificate.issueDate,
        });

        const dataUrl =
          await QRCode.toDataURL(
            verificationData,
            {
              width: 500,
              margin: 1,
              errorCorrectionLevel: 'H',
            },
          );

        if (mounted) {
          setQrCode(dataUrl);
        }
      } catch (error) {
        console.error(
          'تعذر إنشاء رمز QR:',
          error,
        );
      }
    };

    generateQR();

    return () => {
      mounted = false;
    };
  }, [certificate]);

  return (
    <div
      className="certificate-print-page"
      dir="rtl"
    >
      <div className="certificate">

        {/* علامة المعاينة */}
        {preview && (
          <div className="certificate-preview-badge">
            معاينة قبل الاعتماد
          </div>
        )}

        {/* الزوايا */}
        <div className="certificate-corner certificate-corner-top-right" />
        <div className="certificate-corner certificate-corner-top-left" />
        <div className="certificate-corner certificate-corner-bottom-right" />
        <div className="certificate-corner certificate-corner-bottom-left" />

        <div className="certificate-content">

          {/* الشعار */}
          <div className="certificate-logo-wrapper">
            <img
              src="/logo.png"
              alt="شعار زاد الحلقات"
              className="certificate-logo"
            />
          </div>

          {/* اسم البرنامج */}
          <div className="certificate-brand">
            زاد الحلقات
          </div>

          {/* العنوان */}
          <h1 className="certificate-title">
            شهادة إتمام البرنامج
          </h1>

          <div className="certificate-title-decoration">
            <span />
            <b>✦</b>
            <span />
          </div>

          {/* المقدمة */}
          <p className="certificate-introduction">
            تشهد إدارة <strong>زاد الحلقات</strong> بأن
          </p>

          {/* الطالب */}
          <h2 className="certificate-student-name">
            {certificate.studentName}
          </h2>

          <div className="certificate-name-line" />

          <p className="certificate-description">
            قد أتم بنجاح برنامج
          </p>

          {/* الدورة */}
          <div className="certificate-cycle">
            {certificate.cycleName}
          </div>

          {/* نسبة الإنجاز */}
          <div className="certificate-progress">
            <span>نسبة الإنجاز</span>

            <strong>
              {preview
                ? 'تحدد عند الاعتماد'
                : `${certificate.progressPercent}%`}
            </strong>
          </div>

          {/* التفاصيل */}
          <div className="certificate-details">

            <div className="certificate-detail">
              <span className="certificate-detail-label">
                رقم الشهادة
              </span>

              <strong
                className="certificate-detail-value certificate-number"
                dir="ltr"
              >
                {preview
                  ? 'يحدد عند الاعتماد'
                  : certificate.certificateNumber}
              </strong>
            </div>

            <div className="certificate-detail">
              <span className="certificate-detail-label">
                تاريخ الإصدار
              </span>

              <strong className="certificate-detail-value">
                {preview
                  ? 'يحدد عند الاعتماد'
                  : certificate.issueDate}
              </strong>
            </div>

          </div>

          {/* الأسفل */}
          <div className="certificate-footer">

            {/* QR */}
            <div className="certificate-qr-section">
              {qrCode ? (
                <img
                  src={qrCode}
                  alt="رمز التحقق من الشهادة"
                  className="certificate-qr"
                />
              ) : (
                <div className="certificate-qr-loading">
                  جاري إنشاء رمز التحقق...
                </div>
              )}

              <span>
                {preview
                  ? 'رمز معاينة'
                  : 'رمز التحقق'}
              </span>
            </div>

            {/* الختم */}
            <div className="certificate-seal">
              <div className="certificate-seal-inner">
                <span>زاد الحلقات</span>
                <strong>
                  {preview ? 'معاينة' : 'معتمدة'}
                </strong>
              </div>
            </div>

            {/* التوقيع */}
            <div className="certificate-signature">
              <div className="certificate-signature-line" />

              <span>
                التوقيع المعتمد
              </span>
            </div>

          </div>

          {!preview && (
            <div
              className="certificate-id"
              dir="ltr"
            >
              {certificate.certificateNumber}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
