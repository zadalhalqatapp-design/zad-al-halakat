import { useAsync } from '@/hooks/useAsync';
import { api } from '@/api';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import type {
  AppSettings,
  OperationLog,
  Backup,
} from '@/types';
import {
  useEffect,
  useState,
} from 'react';
import {
  Save,
  Upload,
  DatabaseBackup,
  FolderOpen,
  RefreshCw,
  ExternalLink,
  Download,
  FileText,
  Music,
  Image,
  Video,
  File,
} from 'lucide-react';


/* ============================================================
   إعدادات النظام
   ============================================================ */

export function SettingsPage() {
  const { notify } = useToast();

  const {
    data,
    loading,
    reload,
  } = useAsync(
    () =>
      api.getSettings() as unknown as Promise<AppSettings>,
    [],
  );

  const [form, setForm] =
    useState<AppSettings | null>(null);

  const [saving, setSaving] =
    useState(false);


  useEffect(() => {
    if (data) {
      setForm(data);
    }
  }, [data]);


  const handleSave = async () => {
    if (!form) return;

    setSaving(true);

    try {
      await api.updateSettings(
        form as unknown as Record<string, unknown>,
      );

      notify(
        'تم حفظ الإعدادات',
        'success',
      );

      reload();

    } catch (err) {

      notify(
        err instanceof Error
          ? err.message
          : 'فشل الحفظ.',
        'error',
      );

    } finally {
      setSaving(false);
    }
  };


  if (loading || !form) {
    return (
      <div className="py-20 text-center text-on-surface-variant">
        جارٍ التحميل...
      </div>
    );
  }


  return (
    <div className="animate-fade-in">

      <PageHeader
        title="الإعدادات"
        subtitle="إعدادات النظام والهوية البصرية"
      />


      <div className="grid lg:grid-cols-2 gap-6">

        {/* الهوية البصرية */}

        <Card>

          <CardHeader
            title="الهوية البصرية"
            subtitle="اسم الموقع والشعار والألوان"
          />

          <div className="space-y-4">

            <Input
              label="اسم الموقع"
              value={form.appName}
              onChange={(e) =>
                setForm({
                  ...form,
                  appName: e.target.value,
                })
              }
            />

            <Input
              label="رابط الشعار"
              value={form.logoUrl}
              onChange={(e) =>
                setForm({
                  ...form,
                  logoUrl: e.target.value,
                })
              }
              dir="ltr"
            />

            <div className="grid grid-cols-2 gap-4">

              <div>

                <label className="text-sm font-medium text-on-surface mb-1.5 block">
                  اللون الأساسي
                </label>

                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      primaryColor:
                        e.target.value,
                    })
                  }
                  className="w-full h-11 rounded-xl border border-outline-variant cursor-pointer"
                />

              </div>


              <div>

                <label className="text-sm font-medium text-on-surface mb-1.5 block">
                  اللون الثانوي
                </label>

                <input
                  type="color"
                  value={form.secondaryColor}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      secondaryColor:
                        e.target.value,
                    })
                  }
                  className="w-full h-11 rounded-xl border border-outline-variant cursor-pointer"
                />

              </div>

            </div>

          </div>

        </Card>


        {/* معلومات التواصل */}

        <Card>

          <CardHeader
            title="معلومات التواصل"
            subtitle="البريد والجوال ونص التعريف"
          />

          <div className="space-y-4">

            <Input
              label="بريد التواصل"
              value={form.contactEmail}
              onChange={(e) =>
                setForm({
                  ...form,
                  contactEmail:
                    e.target.value,
                })
              }
              dir="ltr"
            />

            <Input
              label="جوال التواصل"
              value={form.contactPhone}
              onChange={(e) =>
                setForm({
                  ...form,
                  contactPhone:
                    e.target.value,
                })
              }
              dir="ltr"
            />

            <Textarea
              label="نبذة عن البرنامج"
              value={form.aboutText}
              onChange={(e) =>
                setForm({
                  ...form,
                  aboutText:
                    e.target.value,
                })
              }
            />

          </div>

        </Card>


        {/* نسب إكمال الوسائط */}

        <Card>

          <CardHeader
            title="نسب إكمال الوسائط"
            subtitle="النسبة المطلوبة لاعتبار المادة مكتملة تلقائيًا للطالب"
          />

          <div className="grid grid-cols-3 gap-4">

            <Input
              type="number"
              min={1}
              max={100}
              label="نسبة إكمال الفيديو %"
              value={
                form.videoCompletionThreshold
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  videoCompletionThreshold:
                    Number(
                      e.target.value,
                    ),
                })
              }
            />

            <Input
              type="number"
              min={1}
              max={100}
              label="نسبة إكمال الصوت %"
              value={
                form.audioCompletionThreshold
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  audioCompletionThreshold:
                    Number(
                      e.target.value,
                    ),
                })
              }
            />

            <Input
              type="number"
              min={1}
              max={100}
              label="نسبة إكمال PDF %"
              value={
                form.pdfCompletionThreshold
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  pdfCompletionThreshold:
                    Number(
                      e.target.value,
                    ),
                })
              }
            />

          </div>

        </Card>

      </div>


      <div className="mt-6">

        <Button
          onClick={handleSave}
          loading={saving}
          icon={<Save size={18} />}
          size="lg"
        >
          حفظ الإعدادات
        </Button>

      </div>

    </div>
  );
}


/* ============================================================
   سجل العمليات
   ============================================================ */

export function OperationLogPage() {

  const {
    data,
    loading,
  } = useAsync(
    () =>
      api.getOperationLog() as unknown as Promise<OperationLog[]>,
    [],
  );


  if (loading) {
    return (
      <div className="py-20 text-center text-on-surface-variant">
        جارٍ التحميل...
      </div>
    );
  }


  const logs = data || [];


  return (
    <div className="animate-fade-in">

      <PageHeader
        title="سجل العمليات"
        subtitle={`${logs.length} عملية مسجّلة`}
      />

      <Card padded={false}>

        <DataTable<OperationLog>
          columns={[
            {
              key: 'timestamp',
              label: 'التاريخ والوقت',
            },

            {
              key: 'userName',
              label: 'المستخدم',
              render: (l) => (
                <span className="font-medium">
                  {l.userName}
                </span>
              ),
            },

            {
              key: 'userRole',
              label: 'الدور',
              render: (l) =>
                l.userRole === 'admin'
                  ? 'مدير'
                  : l.userRole === 'supervisor'
                    ? 'مشرف'
                    : 'طالب',
            },

            {
              key: 'operation',
              label: 'العملية',
            },

            {
              key: 'details',
              label: 'التفاصيل',
              render: (l) => (
                <span className="text-xs text-on-surface-variant">
                  {l.details}
                </span>
              ),
            },
          ]}
          rows={logs}
          emptyMessage="لا توجد عمليات مسجّلة"
        />

      </Card>

    </div>
  );
}


/* ============================================================
   النسخ الاحتياطية
   ============================================================ */

export function BackupsPage() {

  const { notify } = useToast();

  const {
    data,
    loading,
    reload,
  } = useAsync(
    () =>
      api.getBackups() as unknown as Promise<Backup[]>,
    [],
  );


  const [name, setName] =
    useState('');

  const [acting, setActing] =
    useState(false);


  const handleBackup = async () => {

    setActing(true);

    try {

      const backupName =
        name.trim() ||
        `نسخة ${new Date().toLocaleString('ar')}`;

      await api.backupDatabase(
        backupName,
      );

      notify(
        'تم إنشاء نسخة احتياطية',
        'success',
      );

      setName('');

      reload();

    } catch (err) {

      notify(
        err instanceof Error
          ? err.message
          : 'فشلت العملية.',
        'error',
      );

    } finally {

      setActing(false);

    }
  };


  const handleRestore = async (
    backup: Backup,
  ) => {

    if (
      !confirm(
        `هل تريد استعادة النسخة "${backup.name}"؟ سيتم استبدال البيانات الحالية.`,
      )
    ) {
      return;
    }


    setActing(true);

    try {

      await api.restoreBackup(
        backup.id,
      );

      notify(
        'تمت استعادة النسخة',
        'success',
      );

    } catch (err) {

      notify(
        err instanceof Error
          ? err.message
          : 'فشلت الاستعادة.',
        'error',
      );

    } finally {

      setActing(false);

    }
  };


  if (loading) {
    return (
      <div className="py-20 text-center text-on-surface-variant">
        جارٍ التحميل...
      </div>
    );
  }


  const backups = data || [];


  return (
    <div className="animate-fade-in">

      <PageHeader
        title="النسخ الاحتياطية"
        subtitle="إنشاء واستعادة نسخ من قاعدة البيانات"
      />


      <Card className="mb-6">

        <CardHeader
          title="إنشاء نسخة جديدة"
        />

        <div className="flex flex-col sm:flex-row gap-3">

          <Input
            placeholder="اسم النسخة (اختياري)"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="flex-1"
          />

          <Button
            onClick={handleBackup}
            loading={acting}
            icon={
              <DatabaseBackup size={18} />
            }
          >
            إنشاء نسخة
          </Button>

        </div>

      </Card>


      {backups.length === 0 ? (

        <Card>

          <div className="text-center py-8 text-on-surface-variant">
            لا توجد نسخ احتياطية
          </div>

        </Card>

      ) : (

        <Card padded={false}>

          <DataTable<Backup>
            columns={[

              {
                key: 'name',
                label: 'الاسم',
                render: (b) => (
                  <span className="font-medium">
                    {b.name}
                  </span>
                ),
              },

              {
                key: 'createdAt',
                label: 'التاريخ',
              },

              {
                key: 'size',
                label: 'الحجم',
              },

              {
                key: 'createdBy',
                label: 'أنشأها',
              },

              {
                key: 'actions',
                label: 'إجراء',
                render: (b) => (
                  <Button
                    size="sm"
                    variant="outlined"
                    icon={
                      <Upload size={16} />
                    }
                    onClick={() =>
                      handleRestore(b)
                    }
                    disabled={acting}
                  >
                    استعادة
                  </Button>
                ),
              },

            ]}
            rows={backups}
            emptyMessage="لا توجد نسخ"
          />

        </Card>

      )}

    </div>
  );
}


/* ============================================================
   إدارة ملفات Google Drive
   ============================================================ */

export function FilesPage() {

  const { notify } =
    useToast();


  const [
    folders,
    setFolders,
  ] = useState<
    import('@/api').DriveFolder[]
  >([]);


  const [
    files,
    setFiles,
  ] = useState<
    import('@/api').DriveFile[]
  >([]);


  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState<string | null>(
    null,
  );


  const [
    loadingFolders,
    setLoadingFolders,
  ] = useState(true);


  const [
    loadingFiles,
    setLoadingFiles,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );


  /* ==========================================================
     تحميل المجلدات
     ========================================================== */

  const loadFolders = async () => {

    setLoadingFolders(true);
    setError(null);

    try {

      const result =
        await api.getDriveFolders();

      setFolders(
        result.folders || [],
      );

    } catch (err) {

      const message =
        err instanceof Error
          ? err.message
          : 'تعذر الوصول إلى Google Drive.';

      setError(message);

      notify(
        message,
        'error',
      );

    } finally {

      setLoadingFolders(false);

    }
  };


  /* ==========================================================
     تحميل الملفات
     ========================================================== */

  const loadFiles = async (
    category: string,
  ) => {

    setSelectedCategory(
      category,
    );

    setLoadingFiles(true);
    setError(null);
    setFiles([]);

    try {

      const result =
        await api.getDriveFiles(
          category,
        );

      setFiles(
        result.files || [],
      );

    } catch (err) {

      const message =
        err instanceof Error
          ? err.message
          : 'تعذر تحميل ملفات المجلد.';

      setError(message);

      notify(
        message,
        'error',
      );

    } finally {

      setLoadingFiles(false);

    }
  };


  /* ==========================================================
     تحميل المجلدات عند فتح الصفحة
     ========================================================== */

  useEffect(() => {
    loadFolders();
  }, []);


  /* ==========================================================
     بيانات المجلدات
     ========================================================== */

  const folderMeta: Record<
    string,
    {
      icon: string;
      description: string;
    }
  > = {

    pdf: {
      icon: '📄',
      description:
        'ملفات PDF للأحاديث والمقررات',
    },

    audio: {
      icon: '🎵',
      description:
        'الملفات الصوتية',
    },

    certificates: {
      icon: '🏆',
      description:
        'شهادات الطلاب',
    },

    studentPhotos: {
      icon: '🖼️',
      description:
        'صور الطلاب',
    },

    branding: {
      icon: '🎨',
      description:
        'الشعارات والهوية البصرية',
    },

    documents: {
      icon: '📁',
      description:
        'المستندات والملفات العامة',
    },
  };


  /* ==========================================================
     أيقونة الملف
     ========================================================== */

  const getFileIcon = (
    file: import('@/api').DriveFile,
  ) => {

    const mime =
      file.mimeType || '';

    const name =
      file.name.toLowerCase();


    if (
      mime.includes('pdf') ||
      name.endsWith('.pdf')
    ) {
      return (
        <FileText
          size={28}
          className="text-primary"
        />
      );
    }


    if (
      mime.startsWith('audio/') ||
      /\.(mp3|wav|m4a|ogg|aac)$/i.test(
        name,
      )
    ) {
      return (
        <Music
          size={28}
          className="text-primary"
        />
      );
    }


    if (
      mime.startsWith('image/') ||
      /\.(jpg|jpeg|png|webp|gif)$/i.test(
        name,
      )
    ) {
      return (
        <Image
          size={28}
          className="text-primary"
        />
      );
    }


    if (
      mime.startsWith('video/') ||
      /\.(mp4|webm|mov|avi)$/i.test(
        name,
      )
    ) {
      return (
        <Video
          size={28}
          className="text-primary"
        />
      );
    }


    return (
      <File
        size={28}
        className="text-on-surface-variant"
      />
    );
  };


  /* ==========================================================
     حجم الملف
     ========================================================== */

  const formatFileSize = (
    size: number,
  ) => {

    if (!size || size <= 0) {
      return '—';
    }


    if (size < 1024) {
      return `${size} بايت`;
    }


    if (
      size <
      1024 * 1024
    ) {
      return `${(
        size / 1024
      ).toFixed(1)} KB`;
    }


    if (
      size <
      1024 *
        1024 *
        1024
    ) {
      return `${(
        size /
        (1024 * 1024)
      ).toFixed(1)} MB`;
    }


    return `${(
      size /
      (1024 * 1024 * 1024)
    ).toFixed(1)} GB`;
  };


  /* ==========================================================
     فتح الملف
     ========================================================== */

  const openFile = (
    file: import('@/api').DriveFile,
  ) => {

    const url =
      file.viewUrl ||
      file.url;


    if (!url) {

      notify(
        'لا يوجد رابط لهذا الملف.',
        'error',
      );

      return;
    }


    window.open(
      url,
      '_blank',
      'noopener,noreferrer',
    );
  };


  /* ==========================================================
     تحميل الملف
     ========================================================== */

  const downloadFile = (
    file: import('@/api').DriveFile,
  ) => {

    const url =
      file.downloadUrl ||
      file.url ||
      file.viewUrl;


    if (!url) {

      notify(
        'لا يوجد رابط تحميل لهذا الملف.',
        'error',
      );

      return;
    }


    window.open(
      url,
      '_blank',
      'noopener,noreferrer',
    );
  };


  /* ==========================================================
     جاري تحميل المجلدات
     ========================================================== */

  if (loadingFolders) {

    return (

      <div className="animate-fade-in">

        <PageHeader
          title="إدارة الملفات"
          subtitle="ملفات Google Drive — زاد الحلقات"
        />

        <Card>

          <div className="py-16 text-center text-on-surface-variant">

            <RefreshCw
              size={28}
              className="mx-auto mb-4 animate-spin"
            />

            <div className="font-medium">
              جارٍ الاتصال بـ Google Drive...
            </div>

            <p className="text-sm mt-2">
              يتم تحميل مجلدات زاد الحلقات
            </p>

          </div>

        </Card>

      </div>
    );
  }


  /* ==========================================================
     الصفحة الرئيسية للملفات
     ========================================================== */

  return (

    <div className="animate-fade-in">

      <PageHeader
        title="إدارة الملفات"
        subtitle="ملفات Google Drive — زاد الحلقات"
      />


      {/* ======================================================
          خطأ
          ====================================================== */}

      {error && (

        <Card className="mb-6">

          <div className="p-4 rounded-xl bg-error-50 border border-error-200">

            <div className="flex items-center justify-between gap-4">

              <div>

                <h4 className="font-semibold text-error-700">
                  تعذر تحميل الملفات
                </h4>

                <p className="text-sm text-error-600 mt-1">
                  {error}
                </p>

              </div>


              <Button
                size="sm"
                variant="outlined"
                onClick={() =>
                  selectedCategory
                    ? loadFiles(
                        selectedCategory,
                      )
                    : loadFolders()
                }
                icon={
                  <RefreshCw size={16} />
                }
              >
                إعادة المحاولة
              </Button>

            </div>

          </div>

        </Card>
      )}


      {/* ======================================================
          مجلدات Google Drive
          ====================================================== */}

      <Card>

        <CardHeader
          title="مجلدات زاد الحلقات"
          subtitle="اختر المجلد لعرض الملفات الموجودة داخله"
        />


        {folders.length === 0 ? (

          <div className="py-12 text-center text-on-surface-variant">

            <FolderOpen
              size={42}
              className="mx-auto mb-3"
            />

            <p className="font-medium">
              لا توجد مجلدات متاحة
            </p>

            <p className="text-sm mt-1">
              تأكد من إعداد مجلد زاد الحلقات في Google Drive.
            </p>


            <Button
              size="sm"
              variant="outlined"
              className="mt-4"
              onClick={loadFolders}
              icon={
                <RefreshCw size={16} />
              }
            >
              تحديث
            </Button>

          </div>

        ) : (

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {folders.map(
              (folder) => {

                const meta =
                  folderMeta[
                    folder.id
                  ] || {
                    icon: '📁',
                    description:
                      'ملفات مجلد زاد الحلقات',
                  };


                const selected =
                  selectedCategory ===
                  folder.id;


                return (

                  <button
                    key={folder.id}
                    type="button"
                    onClick={() =>
                      loadFiles(
                        folder.id,
                      )
                    }
                    className={`
                      text-right
                      border
                      rounded-xl
                      p-4
                      transition-all
                      hover:shadow-sm
                      ${
                        selected
                          ? 'border-primary bg-primary-50'
                          : 'border-outline-variant hover:border-primary-300'
                      }
                    `}
                  >

                    <div className="flex items-start justify-between">

                      <div className="text-3xl">
                        {meta.icon}
                      </div>

                      <FolderOpen
                        size={18}
                        className={
                          selected
                            ? 'text-primary'
                            : 'text-on-surface-variant'
                        }
                      />

                    </div>


                    <h4 className="font-semibold text-on-surface mt-3">
                      {folder.name}
                    </h4>


                    <p className="text-xs text-on-surface-variant mt-1">
                      {meta.description}
                    </p>

                  </button>
                );
              },
            )}

          </div>
        )}


        <div className="mt-6 p-4 bg-accent-50 rounded-xl border border-accent-200">

          <p className="text-sm text-accent-700">

            يتم جلب الملفات مباشرة من مجلد
            <strong> «زاد الحلقات» </strong>
            في Google Drive.

          </p>

        </div>

      </Card>


      {/* ======================================================
          ملفات المجلد المحدد
          ====================================================== */}

      {selectedCategory && (

        <Card className="mt-6">

          <CardHeader
            title={
              folders.find(
                (folder) =>
                  folder.id ===
                  selectedCategory,
              )?.name ||
              'الملفات'
            }
            subtitle={
              loadingFiles
                ? 'جارٍ تحميل الملفات...'
                : `${files.length} ملف`
            }
          />


          {/* جاري التحميل */}

          {loadingFiles ? (

            <div className="py-12 text-center">

              <RefreshCw
                size={28}
                className="mx-auto mb-3 animate-spin"
              />

              <div className="text-on-surface-variant">
                جارٍ تحميل الملفات من Google Drive...
              </div>

            </div>

          ) : files.length === 0 ? (

            /* ==================================================
               لا توجد ملفات
               ================================================== */

            <div className="py-12 text-center text-on-surface-variant">

              <FolderOpen
                size={42}
                className="mx-auto mb-3"
              />

              <p className="font-medium">
                لا توجد ملفات في هذا المجلد
              </p>

              <p className="text-sm mt-1">
                أضف الملفات من Google Drive ثم أعد المحاولة.
              </p>


              <Button
                size="sm"
                variant="outlined"
                className="mt-4"
                onClick={() =>
                  loadFiles(
                    selectedCategory,
                  )
                }
                icon={
                  <RefreshCw size={16} />
                }
              >
                تحديث الملفات
              </Button>

            </div>

          ) : (

            /* ==================================================
               الملفات
               ================================================== */

            <div className="space-y-3">

              {files.map(
                (file) => (

                  <div
                    key={file.id}
                    className="
                      flex
                      flex-col
                      sm:flex-row
                      sm:items-center
                      gap-3
                      p-4
                      border
                      border-outline-variant
                      rounded-xl
                      hover:border-primary-300
                      transition-colors
                    "
                  >

                    {/* أيقونة */}

                    <div className="shrink-0">
                      {getFileIcon(file)}
                    </div>


                    {/* معلومات الملف */}

                    <div className="flex-1 min-w-0">

                      <h4 className="font-medium text-on-surface truncate">
                        {file.name}
                      </h4>


                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">

                        <span className="text-xs text-on-surface-variant">
                          {formatFileSize(
                            file.size,
                          )}
                        </span>


                        {file.mimeType && (

                          <span className="text-xs text-on-surface-variant">
                            {file.mimeType}
                          </span>

                        )}

                      </div>

                    </div>


                    {/* الأزرار */}

                    <div className="flex gap-2 shrink-0">

                      <Button
                        size="sm"
                        variant="outlined"
                        onClick={() =>
                          openFile(file)
                        }
                        icon={
                          <ExternalLink
                            size={15}
                          />
                        }
                      >
                        فتح
                      </Button>


                      <Button
                        size="sm"
                        onClick={() =>
                          downloadFile(file)
                        }
                        icon={
                          <Download
                            size={15}
                          />
                        }
                      >
                        تحميل
                      </Button>

                    </div>

                  </div>

                ),
              )}

            </div>
          )}

        </Card>
      )}

    </div>
  );
}
