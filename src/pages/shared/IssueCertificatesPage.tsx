import { useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { api } from '@/api';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Badge,
  EmptyState,
} from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { Dialog } from '@/components/ui/Dialog';
import {
  Select,
  Input,
} from '@/components/ui/Input';

import type {
  User,
  Certificate,
  Cycle,
} from '@/types';

import {
  Award,
  Search,
  X,
  CheckCircle,
} from 'lucide-react';

import { CertificateTemplate } from '@/components/certificates/CertificateTemplate';

export function IssueCertificatesPage() {
  const { notify } = useToast();

  const {
    data: studentsData,
    loading,
  } = useAsync(
    () =>
      api.getStudents() as Promise<User[]>,
    [],
  );

  const {
    data: certsData,
    reload: reloadCerts,
  } = useAsync(
    () =>
      api.getCertificates() as Promise<Certificate[]>,
    [],
  );

  const {
    data: cyclesData,
  } = useAsync(
    () =>
      api.getCycles() as Promise<Cycle[]>,
    [],
  );

  const [search, setSearch] =
    useState('');

  const [issueOpen, setIssueOpen] =
    useState(false);

  const [previewOpen, setPreviewOpen] =
    useState(false);

  const [target, setTarget] =
    useState<User | null>(null);

  const [cycleId, setCycleId] =
    useState('');

  const [issuing, setIssuing] =
    useState(false);

  const students =
    (studentsData || []).filter(
      (s) =>
        s.status === 'approved',
    );

  const certificates =
    certsData || [];

  const cycles =
    cyclesData || [];

  const filtered =
    students.filter(
      (s) =>
        s.name.includes(search) ||
        s.email.includes(search),
    );

  const hasCert = (
    studentId: string,
  ) =>
    certificates.some(
      (c) =>
        c.studentId === studentId,
    );

  /**
   * فتح نافذة اختيار الدورة
   */
  const openIssue = (
    student: User,
  ) => {
    setTarget(student);

    setCycleId(
      cycles.find(
        (c) =>
          c.status === 'active',
      )?.id ||
        cycles[0]?.id ||
        '',
    );

    setIssueOpen(true);
  };

  /**
   * الانتقال إلى المعاينة
   */
  const openPreview = () => {
    if (!target) {
      notify(
        'لم يتم اختيار الطالب.',
        'warning',
      );

      return;
    }

    if (!cycleId) {
      notify(
        'يرجى اختيار الدورة.',
        'warning',
      );

      return;
    }

    setIssueOpen(false);
    setPreviewOpen(true);
  };

  /**
   * إغلاق كل النوافذ
   */
  const closeAll = () => {
    setIssueOpen(false);
    setPreviewOpen(false);
    setTarget(null);
    setCycleId('');
  };

  /**
   * اعتماد الشهادة فعليًا
   *
   * هنا فقط يتم استدعاء API
   */
  const handleIssue = async () => {
    if (!target || !cycleId) {
      notify(
        'يرجى اختيار الطالب والدورة.',
        'warning',
      );

      return;
    }

    setIssuing(true);

    try {
      await api.issueCertificate(
        target.id,
        cycleId,
      );

      notify(
        `تم إصدار شهادة ${target.name}`,
        'success',
      );

      setPreviewOpen(false);
      setTarget(null);
      setCycleId('');

      reloadCerts();
    } catch (err) {
      notify(
        err instanceof Error
          ? err.message
          : 'فشل إصدار الشهادة.',
        'error',
      );
    } finally {
      setIssuing(false);
    }
  };

  /**
   * إنشاء شهادة وهمية للمعاينة فقط.
   *
   * لا يتم حفظها في قاعدة البيانات.
   */
  const previewCertificate:
    | Certificate
    | null =
    target && cycleId
      ? {
          id: 'preview',
          certificateNumber:
            'معاينة',
          studentId:
            target.id,
          studentName:
            target.name,
          cycleId:
            cycleId,
          cycleName:
            cycles.find(
              (c) =>
                c.id === cycleId,
            )?.name ||
            '',
          issueDate:
            new Date()
              .toISOString()
              .slice(0, 10),
          progressPercent: 0,
          qrCode: '',
        }
      : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        جارٍ التحميل...
      </div>
    );
  }

  return (
    <div dir="rtl">

      <PageHeader
        title="إصدار الشهادات"
        description="معاينة واعتماد شهادات الطلاب"
      />

      {students.length === 0 ? (
        <Card>
          <EmptyState
            icon={
              <Award size={40} />
            }
            title="لا يوجد طلاب معتمدون"
          />
        </Card>
      ) : (
        <>
          {/* البحث */}
          <div className="mb-4">
            <Input
              placeholder="بحث..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value,
                )
              }
              icon={
                <Search size={18} />
              }
            />
          </div>

          {/* الجدول */}
          <Card padded={false}>
            <DataTable<User>
              columns={[
                {
                  key: 'name',
                  label: 'الاسم',
                  render: (s) => (
                    <span className="font-medium">
                      {s.name}
                    </span>
                  ),
                },

                {
                  key: 'email',
                  label: 'البريد',
                  render: (s) => (
                    <span dir="ltr">
                      {s.email}
                    </span>
                  ),
                },

                {
                  key: 'createdAt',
                  label:
                    'تاريخ التسجيل',
                },

                {
                  key: 'cert',
                  label: 'الشهادة',
                  render: (s) =>
                    hasCert(s.id) ? (
                      <Badge variant="success">
                        مصدرة
                      </Badge>
                    ) : (
                      <Badge variant="neutral">
                        لا توجد
                      </Badge>
                    ),
                },

                {
                  key: 'actions',
                  label: 'إجراء',
                  render: (s) => (
                    <Button
                      size="sm"
                      icon={
                        <Award
                          size={16}
                        />
                      }
                      onClick={() =>
                        openIssue(s)
                      }
                      disabled={hasCert(
                        s.id,
                      )}
                    >
                      إصدار شهادة
                    </Button>
                  ),
                },
              ]}
              rows={filtered}
              emptyMessage="لا يوجد طلاب"
            />
          </Card>

          {/* =====================================================
              نافذة اختيار الدورة
          ===================================================== */}

          <Dialog
            open={issueOpen}
            onClose={closeAll}
            title="إصدار شهادة"
            actions={
              <>
                <Button
                  variant="text"
                  onClick={
                    closeAll
                  }
                >
                  إلغاء
                </Button>

                <Button
                  onClick={
                    openPreview
                  }
                  icon={
                    <Award
                      size={18}
                    />
                  }
                >
                  معاينة الشهادة
                </Button>
              </>
            }
          >
            <p className="text-sm text-on-surface-variant mb-4">
              سيتم تجهيز شهادة للطالب{' '}
              <strong className="text-on-surface">
                {target?.name}
              </strong>
              .
            </p>

            <Select
              label="الدورة"
              value={cycleId}
              onChange={(e) =>
                setCycleId(
                  e.target.value,
                )
              }
            >
              <option value="">
                اختر الدورة...
              </option>

              {cycles.map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                >
                  {c.name}{' '}
                  (
                  {c.status ===
                  'active'
                    ? 'نشطة'
                    : 'مكتملة'}
                  )
                </option>
              ))}
            </Select>

            {cycles.length ===
              0 && (
              <p className="text-xs text-warning-600 mt-2">
                لا توجد دورات.
                يجب إنشاء دورة
                أولًا من إدارة
                البرنامج.
              </p>
            )}
          </Dialog>

          {/* =====================================================
              نافذة المعاينة
          ===================================================== */}

          <Dialog
            open={previewOpen}
            onClose={() => {
              setPreviewOpen(false);
            }}
            title="معاينة الشهادة قبل الاعتماد"
            actions={
              <>
                <Button
                  variant="text"
                  onClick={() => {
                    setPreviewOpen(
                      false,
                    );

                    setIssueOpen(
                      true,
                    );
                  }}
                  icon={
                    <X size={18} />
                  }
                >
                  العودة
                </Button>

                <Button
                  onClick={
                    handleIssue
                  }
                  loading={issuing}
                  icon={
                    <CheckCircle
                      size={18}
                    />
                  }
                >
                  اعتماد وإصدار الشهادة
                </Button>
              </>
            }
          >
            <div className="mb-4 rounded-lg bg-warning-50 border border-warning-200 p-3 text-sm text-warning-800">
              <strong>
                تنبيه:
              </strong>{' '}
              هذه معاينة فقط.
              لن يتم إصدار
              الشهادة أو حفظها
              حتى تضغط على
              «اعتماد وإصدار
              الشهادة».
            </div>

            {previewCertificate && (
              <div className="w-full overflow-auto rounded-lg border border-outline bg-gray-100 p-3">
                <div className="flex justify-center">
                  <div
                    style={{
                      transform:
                        'scale(0.65)',
                      transformOrigin:
                        'top center',
                      marginBottom:
                        '-75mm',
                    }}
                  >
                    <CertificateTemplate
                      certificate={
                        previewCertificate
                      }
                      preview
                    />
                  </div>
                </div>
              </div>
            )}
          </Dialog>
        </>
      )}
    </div>
  );
}
