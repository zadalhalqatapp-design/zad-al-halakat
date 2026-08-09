import { useAsync } from '@/hooks/useAsync';
import { api } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState, Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Certificate } from '@/types';
import { Award, Download, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export function StudentCertificates() {
  const { user } = useAuth();
  const { notify } = useToast();
  const { data, loading, reload } = useAsync(
    () => api.getCertificates(user!.id) as Promise<Certificate[]>,
    [user?.id],
  );

  const certificates = data || [];

  const generatePDF = async (cert: Certificate) => {
    try {
      notify('جارٍ إعداد الشهادة...', 'info');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // Background
      pdf.setFillColor(247, 249, 248);
      pdf.rect(0, 0, pageW, pageH, 'F');

      // Decorative border
      pdf.setDrawColor(45, 128, 104);
      pdf.setLineWidth(2);
      pdf.rect(10, 10, pageW - 20, pageH - 20);
      pdf.setDrawColor(216, 143, 32);
      pdf.setLineWidth(0.5);
      pdf.rect(14, 14, pageW - 28, pageH - 28);

      // Header
      pdf.setTextColor(31, 102, 79);
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Zad Al-Halaqat', pageW / 2, 40, { align: 'center' });

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(66, 74, 69);
      pdf.text('Certificate of Completion', pageW / 2, 50, { align: 'center' });

      // Divider
      pdf.setDrawColor(216, 143, 32);
      pdf.setLineWidth(1);
      pdf.line(pageW / 2 - 40, 56, pageW / 2 + 40, 56);

      // Student name
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(26, 31, 28);
      pdf.text(cert.studentName, pageW / 2, 75, { align: 'center' });

      // Body text
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(66, 74, 69);
      pdf.text('Has successfully completed the program', pageW / 2, 90, { align: 'center' });

      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(31, 102, 79);
      pdf.text(cert.cycleName, pageW / 2, 102, { align: 'center' });

      // Stats
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(66, 74, 69);
      pdf.text(`Progress: ${cert.progressPercent}%`, pageW / 2, 115, { align: 'center' });

      // Certificate number
      pdf.setFontSize(10);
      pdf.text(`Certificate No: ${cert.certificateNumber}`, pageW / 2, 125, { align: 'center' });
      pdf.text(`Issue Date: ${cert.issueDate}`, pageW / 2, 132, { align: 'center' });

      // QR Code
      try {
        const qrData = JSON.stringify({ id: cert.id, num: cert.certificateNumber, student: cert.studentName, date: cert.issueDate });
        const qrDataUrl = await QRCode.toDataURL(qrData, { width: 200, margin: 1 });
        pdf.addImage(qrDataUrl, 'PNG', 20, pageH - 50, 30, 30);
      } catch {
        // QR generation failure shouldn't block the PDF
      }

      // Signature line
      pdf.setDrawColor(120, 120, 120);
      pdf.setLineWidth(0.3);
      pdf.line(pageW - 70, pageH - 25, pageW - 30, pageH - 25);
      pdf.setFontSize(9);
      pdf.text('Authorized Signature', pageW - 50, pageH - 21, { align: 'center' });

      pdf.save(`certificate-${cert.certificateNumber}.pdf`);
      notify('تم تنزيل الشهادة', 'success');
    } catch {
      notify('تعذّر إنشاء ملف الشهادة.', 'error');
    }
  };

  if (loading) return <div className="py-20 text-center text-on-surface-variant">جارٍ التحميل...</div>;

  return (
    <div className="animate-fade-in">
      <PageHeader title="شهاداتي" subtitle="الشهادات التي حصلت عليها من البرنامج" />

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
            <Card key={cert.id} className="overflow-hidden">
              <div className="bg-gradient-to-l from-primary-600 to-primary-700 text-white p-5 -m-5 mb-4">
                <div className="flex items-center justify-between">
                  <Award size={32} />
                  <Badge variant="success">معتمدة</Badge>
                </div>
                <h3 className="text-lg font-bold mt-3">{cert.cycleName}</h3>
              </div>
              <div className="space-y-2 mb-4">
                <Row label="رقم الشهادة" value={cert.certificateNumber} />
                <Row label="تاريخ الإصدار" value={cert.issueDate} />
                <Row label="نسبة الإنجاز" value={`${cert.progressPercent}%`} />
              </div>
              <Button fullWidth icon={<Download size={18} />} onClick={() => generatePDF(cert)}>
                تنزيل الشهادة (PDF)
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-medium text-on-surface">{value}</span>
    </div>
  );
}
