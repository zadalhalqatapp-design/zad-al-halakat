import { useAsync } from '@/hooks/useAsync';
import { api } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Badge';
import type { Hadith } from '@/types';
import { APPS_CONFIG } from '@/config';
import { CalendarDays, Play, FileText, CheckCircle } from 'lucide-react';

export function DailyLessonsPage() {
  const { user } = useAuth();
  const { data: hadithsData } = useAsync(() => api.getHadiths() as Promise<Hadith[]>, []);
  const { data: progressData } = useAsync(
    () => api.getProgress(user!.id) as Promise<{ hadithId: string; memorized: boolean; listened: boolean; read: boolean }[]>,
    [user?.id],
  );
  const { data: lessonsData } = useAsync(() => api.getDailyLessons() as Promise<{ day: number; date: string; hadiths: Hadith[] }>, []);

  const hadiths = hadithsData || [];
  const progress = progressData || [];
  const currentDay = lessonsData?.day || 1;

  const getProgress = (hid: string) => progress.find((p) => p.hadithId === hid);

  // Build all 20 days (2 hadiths each)
  const allDays = Array.from({ length: APPS_CONFIG.PROGRAM_DAYS }, (_, i) => {
    const day = i + 1;
    const dayHadiths = hadiths.filter((h) => h.number > i * APPS_CONFIG.HADITHS_PER_DAY && h.number <= (i + 1) * APPS_CONFIG.HADITHS_PER_DAY);
    return { day, hadiths: dayHadiths };
  });

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="المقرر اليومي"
        subtitle={`اليوم ${currentDay} من ${APPS_CONFIG.PROGRAM_DAYS} — حديثان يوميًا`}
      />

      {lessonsData && (
        <Card className="mb-6 bg-primary-50 border-primary-200">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-primary-600" size={28} />
            <div>
              <p className="font-semibold text-primary-800">مقرر اليوم {currentDay}</p>
              <p className="text-sm text-primary-600">{lessonsData.date}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {allDays.map(({ day, hadiths: dayHadiths }) => {
          const isCurrent = day === currentDay;
          const isPast = day < currentDay;
          const isFuture = day > currentDay;
          const allDone = dayHadiths.length > 0 && dayHadiths.every((h) => {
            const p = getProgress(h.id);
            return p?.memorized && p?.listened && p?.read;
          });

          return (
            <Card
              key={day}
              className={isCurrent ? 'border-primary-400 ring-1 ring-primary-300' : ''}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    isCurrent ? 'bg-primary-600 text-white' : isPast ? 'bg-success-100 text-success-700' : 'bg-surface-dim text-on-surface-variant'
                  }`}>
                    {day}
                  </div>
                  <div>
                    <p className="font-semibold text-on-surface">اليوم {day}</p>
                    {isPast && allDone && <p className="text-xs text-success-600">مكتمل</p>}
                    {isCurrent && <p className="text-xs text-primary-600">اليوم الحالي</p>}
                    {isFuture && <p className="text-xs text-on-surface-variant">قادم</p>}
                  </div>
                </div>
                {allDone && <CheckCircle className="text-success-600" size={24} />}
              </div>

              {dayHadiths.length === 0 ? (
                <p className="text-sm text-on-surface-variant py-2">لا توجد أحاديث مضافة لهذا اليوم.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {dayHadiths.map((h) => {
                    const p = getProgress(h.id);
                    const tasks = [p?.memorized, p?.listened, p?.read].filter(Boolean).length;
                    return (
                      <div key={h.id} className="border border-outline-variant rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-primary-600">حديث #{h.number}</span>
                          <span className="text-xs text-on-surface-variant">{tasks}/3</span>
                        </div>
                        <p className="font-arabic text-sm text-on-surface line-clamp-2 mb-2 leading-relaxed">{h.text}</p>
                        <div className="flex gap-2">
                          <a href={h.youtubeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-accent-600 hover:underline">
                            <Play size={12} /> يوتيوب
                          </a>
                          <a href={h.audioUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-accent-600 hover:underline">
                            <Play size={12} /> صوت
                          </a>
                          <a href={h.pdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-accent-600 hover:underline">
                            <FileText size={12} /> PDF
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {hadiths.length === 0 && (
        <Card><EmptyState icon={<CalendarDays size={40} />} title="لا توجد أحاديث" description="لم تتم إضافة أحاديث البرنامج بعد." /></Card>
      )}
    </div>
  );
}
