import { useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { api } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import type { Hadith, ProgressRecord } from '@/types';
import { BookOpen, Play, FileText, BookMarked, Headphones, Check, ChevronLeft } from 'lucide-react';

export function HadithsPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const { data: hadithsData, loading } = useAsync(() => api.getHadiths() as Promise<Hadith[]>, []);
  const { data: progressData, reload: reloadProgress } = useAsync(
    () => api.getProgress(user!.id) as Promise<ProgressRecord[]>,
    [user?.id],
  );

  const hadiths = hadithsData || [];
  const progress = progressData || [];
  const [selected, setSelected] = useState<Hadith | null>(null);
  const [toggling, setToggling] = useState(false);

  const getProgress = (hid: string) => progress.find((p) => p.hadithId === hid);

  const toggleProgress = async (field: 'memorized' | 'listened' | 'read', currentVal: boolean) => {
    if (!selected) return;
    setToggling(true);
    try {
      await api.saveProgress(selected.id, field, !currentVal);
      await reloadProgress();
      notify('تم تحديث التقدّم', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'فشل التحديث.', 'error');
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-on-surface-variant">جارٍ التحميل...</div>;

  return (
    <div className="animate-fade-in">
      <PageHeader title="الأحاديث" subtitle="جميع أحاديث برنامج زاد الحلقات — 40 حديثًا" />

      {hadiths.length === 0 ? (
        <Card><EmptyState icon={<BookOpen size={40} />} title="لا توجد أحاديث متاحة بعد" description="سيتم إضافة الأحاديث قريبًا." /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hadiths.map((h) => {
            const p = getProgress(h.id);
            const done = p?.memorized && p?.listened && p?.read;
            const tasks = [p?.memorized, p?.listened, p?.read].filter(Boolean).length;
            return (
              <Card
                key={h.id}
                className="cursor-pointer hover:border-primary-300 hover:shadow-md transition-all"
                onClick={() => setSelected(h)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary-50 text-primary-700 text-sm font-bold">
                    {h.number}
                  </span>
                  {done ? (
                    <span className="inline-flex items-center gap-1 text-xs text-success-600 font-medium">
                      <Check size={14} /> مكتمل
                    </span>
                  ) : (
                    <span className="text-xs text-on-surface-variant">{tasks}/3</span>
                  )}
                </div>
                <p className="font-arabic text-base text-on-surface leading-relaxed line-clamp-3 mb-3">{h.text}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant bg-surface-dim px-2 py-0.5 rounded-full">{h.category}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-primary-600 font-medium">
                    عرض <ChevronLeft size={14} />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `الحديث رقم ${selected.number}` : ''}
        size="lg"
      >
        {selected && (
          <div className="space-y-5">
            <div className="bg-primary-50 rounded-xl p-4 border border-primary-100">
              <p className="font-arabic text-lg text-on-surface leading-loose">{selected.text}</p>
              {selected.narrator && <p className="text-xs text-on-surface-variant mt-2">الراوي: {selected.narrator}</p>}
            </div>

            <div>
              <h4 className="font-semibold text-on-surface mb-2">الشرح</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">{selected.explanation}</p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <a href={selected.youtubeUrl} target="_blank" rel="noreferrer">
                <Button variant="outlined" fullWidth icon={<Play size={16} />}>يوتيوب</Button>
              </a>
              <a href={selected.audioUrl} target="_blank" rel="noreferrer">
                <Button variant="outlined" fullWidth icon={<Headphones size={16} />}>صوت</Button>
              </a>
              <a href={selected.pdfUrl} target="_blank" rel="noreferrer">
                <Button variant="outlined" fullWidth icon={<FileText size={16} />}>PDF</Button>
              </a>
            </div>

            <div className="border-t border-outline-variant pt-4">
              <h4 className="font-semibold text-on-surface mb-3">تتبّع إنجازك</h4>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { field: 'memorized' as const, label: 'تم الحفظ', icon: BookMarked },
                  { field: 'listened' as const, label: 'تم الاستماع', icon: Headphones },
                  { field: 'read' as const, label: 'تمت القراءة', icon: FileText },
                ].map(({ field, label, icon: Icon }) => {
                  const p = getProgress(selected.id);
                  const val = p?.[field] ?? false;
                  return (
                    <button
                      key={field}
                      onClick={() => toggleProgress(field, val)}
                      disabled={toggling}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        val ? 'border-success-400 bg-success-50 text-success-700' : 'border-outline-variant text-on-surface-variant hover:border-primary-300'
                      }`}
                    >
                      <Icon size={24} />
                      <span className="text-xs font-medium">{label}</span>
                      {val && <Check size={16} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
