import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { Certificate } from '@/types';
import './CertificateTemplate.css';

interface CertificateTemplateProps {
  certificate: Certificate;
}

export function CertificateTemplate({
  certificate,
}: CertificateTemplateProps) {
  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
    let mounted = true;

    const generateQR = async () => {
      try {
        const verificationData = JSON.stringify({
          id: certificate.id,
          number: certificate.certificateNumber,
          student: certificate.studentName,
          cycle: certificate.cycleName,
          issueDate: certificate.issueDate,
        });

        const dataUrl = await QRCode.toDataURL(
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
        {/* =========================================
            الزخارف
        ========================================= */}

        <div className="certificate-corner certificate-corner-top-right" />
        <div className="certificate-corner certificate-corner-top-left" />
        <div className="certificate-corner certificate-corner-bottom-right" />
        <div className="certificate-corner certificate-corner-bottom-left" />

        {/* =========================================
            المحتوى الرئيسي
        ========================================= */}

        <div className="certificate-content">

          {/* الشعار */}
          <div className="certificate-logo-wrapper">
            <img
              src="/logo.png"
              alt="شعار زاد الحلقات"
              className="certificate-logo"
            />
          </div>

          {/* اسم المؤسسة */}
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

          {/* النص */}
          <p className="certificate-introduction">
            تشهد إدارة <strong>زاد الحلقات</strong> بأن
          </p>

          {/* اسم الطالب */}
          <h2 className="certificate-student-name">
            {certificate.studentName}
          </h2>

          <div className="certificate-name-line" />

          {/* وصف الشهادة */}
          <p className="certificate-description">
            قد أتم بنجاح برنامج
          </p>

          {/* اسم الدورة */}
          <div className="certificate-cycle">
            {certificate.cycleName}
          </div>

          {/* نسبة الإنجاز */}
          <div className="certificate-progress">
            <span>نسبة الإنجاز</span>
            <strong>
              {certificate.progressPercent}%
            </strong>
          </div>

          {/* =========================================
              معلومات الشهادة
          ========================================= */}

          <div className="certificate-details">

            <div className="certificate-detail">
              <span className="certificate-detail-label">
                رقم الشهادة
              </span>

              <strong
                className="certificate-detail-value certificate-number"
                dir="ltr"
              >
                {certificate.certificateNumber}
              </strong>
            </div>

            <div className="certificate-detail">
              <span className="certificate-detail-label">
                تاريخ الإصدار
              </span>

              <strong className="certificate-detail-value">
                {certificate.issueDate}
              </strong>
            </div>

          </div>

          {/* =========================================
              أسفل الشهادة
          ========================================= */}

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
                رمز التحقق
              </span>
            </div>

            {/* الختم */}
            <div className="certificate-seal">
              <div className="certificate-seal-inner">
                <span>شهادة</span>
                <strong>معتمدة</strong>
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

          {/* رقم داخلي */}
          <div
            className="certificate-id"
            dir="ltr"
          >
            {certificate.certificateNumber}
          </div>

        </div>
      </div>
    </div>
  );
}
