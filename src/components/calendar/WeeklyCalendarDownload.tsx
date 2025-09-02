import React, { useRef, useState } from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Button } from '../ui/button';
import { Download, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import type { Session } from '@/domains/sessions/types';
import type { CalendarDay } from '@/domains/calendar/types';
import type { UserProfile } from '@/types/auth';

interface WeeklyCalendarDownloadProps {
  currentWeek: Date;
  sessions: Session[];
  calendarDays: CalendarDay[];
  cohortId: string;
  cohortName?: string;
  programCode?: string;
  mentors?: UserProfile[];
}

interface WeeklyEvent {
  date: Date;
  dayNumber: string;
  dayName: string;
  events: {
    title: string;
    description: string;
    time: string;
    type: string;
  }[];
}

export const WeeklyCalendarDownload: React.FC<WeeklyCalendarDownloadProps> = ({
  currentWeek,
  sessions,
  calendarDays,
  cohortId,
  cohortName,
  programCode = 'CP02',
  mentors = [],
}) => {
  console.log('🚀 WeeklyCalendarDownload component rendered with:', {
    sessionsCount: sessions.length,
    sessions: sessions.slice(0, 2).map(s => ({
      id: s.id,
      title: s.title,
      start_time: s.start_time,
      end_time: s.end_time,
      session_date: s.session_date,
    })),
    currentWeek,
    cohortId,
    cohortName,
    programCode,
  });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isGeneratingRef = useRef(false); // Prevent multiple simultaneous generations

  // Callback ref to ensure canvas is available
  const setCanvasRef = React.useCallback((node: HTMLCanvasElement | null) => {
    if (node) {
      canvasRef.current = node;
      console.log('Canvas ref set:', node);
    }
  }, []);

  // Helper functions
  const formatSessionTime = (
    startTime?: string | null,
    endTime?: string | null
  ): string => {
    console.log('🕐 formatSessionTime called with:', { startTime, endTime });

    // If either is missing, return a short placeholder instead of a fixed time
    if (!startTime || !endTime) {
      console.log('⚠️ Missing start_time or end_time, using placeholder');
      return '(Time TBA)';
    }

    // Parse and format a variety of time formats including ISO strings and HH:mm
    const parseAndFormat = (raw: string): string => {
      try {
        // ISO or full datetime string
        if (
          /\d{4}-\d{2}-\d{2}T/.test(raw) ||
          raw.includes('Z') ||
          raw.includes('-T')
        ) {
          const d = new Date(raw);
          if (!isNaN(d.getTime())) {
            return d.toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            });
          }
        }

        // HH:mm or HH:mm:ss
        const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
        if (match) {
          const hour = Number(match[1]);
          const minutes = match[2];
          const displayHour = (hour % 12 || 12).toString();
          const ampm = hour >= 12 ? 'PM' : 'AM';
          return `${displayHour}:${minutes} ${ampm}`;
        }

        // Already human formatted (e.g., "9:00 PM") – return as-is
        if (/\d{1,2}:\d{2}\s?(AM|PM)/i.test(raw)) {
          return raw.toUpperCase();
        }
      } catch (e) {
        console.warn('Failed to parse time string:', raw, e);
      }

      // Fallback generic marker
      return 'TBA';
    };

    const formatted = `(${parseAndFormat(startTime)} - ${parseAndFormat(endTime)})`;
    console.log('✅ Formatted time:', formatted);
    return formatted;
  };

  const getSessionTypeTitle = (type: string): string => {
    const titles: Record<string, string> = {
      cbl: 'CBL SESSION',
      learn: 'LECTURE',
      innovate: 'INNOVATE ARENA',
      transform: 'TRANSFORM ARENA',
      workshop: 'WORKSHOP',
      masterclass: 'MASTERCLASS',
      challenge_intro: 'CHALLENGE INTRO',
      reflection: 'REFLECTION',
      mock_challenge: 'MOCK CHALLENGE',
      gap: 'GAP SESSION',
    };
    return titles[type] || 'SESSION';
  };

  const getSessionTypeDescription = (type: string): string => {
    const descriptions: Record<string, string> = {
      cbl: 'Challenge-Based Learning Session',
      learn: 'The Ad Plot: Storytelling in Social Media Ads',
      innovate: 'Scaling your storytelling skillsets',
      transform: 'Transforming ideas into action',
      workshop: 'Hands-on learning experience',
      masterclass: 'Expert-led deep dive',
      challenge_intro: 'Introduction to new challenges',
      reflection: 'Reflection and learning',
      mock_challenge: 'Practice challenge session',
      gap: 'Addressing knowledge gaps',
    };
    return descriptions[type] || 'Learning session';
  };

  const getDefaultEventTitle = (dayIndex: number): string => {
    const titles = [
      'LECTURE',
      'INNOVATE ARENA',
      'WORKSHOP',
      'TRANSFORM ARENA',
      'LECTURE',
    ];
    return titles[dayIndex] || 'SESSION';
  };

  const getDefaultEventDescription = (dayIndex: number): string => {
    const descriptions = [
      'The Ad Plot: Storytelling in Social Media Ads',
      'Scaling your storytelling skillsets',
      'Hands-on learning experience',
      'Transforming ideas into action',
      'The Ad Plot: Storytelling in Social Media Ads',
    ];
    return descriptions[dayIndex] || 'Learning session';
  };

  const getDefaultEventTime = (dayIndex: number): string => {
    const times = [
      '(10:30 AM - 01:00 PM)',
      '(02:00 PM - 04:00 PM)',
      '(10:30 AM - 01:00 PM)',
      '(02:00 PM - 04:00 PM)',
      '(10:30 AM - 01:00 PM)',
    ];
    return times[dayIndex] || '(10:30 AM - 01:00 PM)';
  };

  // Generate weekly events from sessions
  const weeklyEvents: WeeklyEvent[] = React.useMemo(() => {
    console.log(
      '🗓️ MEMOIZATION RUNNING - Generating weekly events with sessions:',
      sessions
    );
    console.log('🗓️ MEMOIZATION RUNNING - This should appear in console!');
    console.log(
      '🗓️ MEMOIZATION RUNNING - If you see this, the memoization is working!'
    );
    console.log(
      '🗓️ Sessions data sample:',
      sessions.slice(0, 3).map(s => ({
        id: s.id,
        title: s.title,
        start_time: s.start_time,
        end_time: s.end_time,
        session_date: s.session_date,
      }))
    );

    // Check if sessions have timing data
    const sessionsWithTimes = sessions.filter(s => s.start_time && s.end_time);
    const sessionsWithoutTimes = sessions.filter(
      s => !s.start_time || !s.end_time
    );
    console.log('⏰ Sessions with times:', sessionsWithTimes.length);
    console.log('❌ Sessions without times:', sessionsWithoutTimes.length);
    if (sessionsWithoutTimes.length > 0) {
      console.log(
        '❌ Sessions missing times:',
        sessionsWithoutTimes.map(s => ({
          id: s.id,
          title: s.title,
          start_time: s.start_time,
          end_time: s.end_time,
        }))
      );
    }

    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday start
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

    console.log('📅 Week calculation:', {
      currentWeek: currentWeek.toDateString(),
      weekStart: weekStart.toDateString(),
      weekEnd: weekEnd.toDateString(),
    });

    const events: WeeklyEvent[] = [];

    // Generate events for each day of the week (Monday to Friday)
    for (let i = 0; i < 5; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);

      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.session_date);
        const matches = sessionDate.toDateString() === date.toDateString();
        if (matches) {
          console.log(`✅ Session matches ${date.toDateString()}:`, {
            sessionId: session.id,
            sessionDate: session.session_date,
            startTime: session.start_time,
            endTime: session.end_time,
            title: session.title,
          });
        }
        return matches;
      });

      console.log(
        `📅 Day ${i + 1} (${date.toDateString()}): Found ${daySessions.length} sessions`
      );

      const dayEvents = daySessions.map(session => {
        console.log('📅 Processing session:', {
          id: session.id,
          title: session.title,
          session_type: session.session_type,
          start_time: session.start_time,
          end_time: session.end_time,
          session_date: session.session_date,
        });

        return {
          title: getSessionTypeTitle(session.session_type),
          description:
            session.title || getSessionTypeDescription(session.session_type),
          time: formatSessionTime(session.start_time, session.end_time),
          type: session.session_type,
        };
      });

      // If no sessions, add placeholder events based on the design
      if (dayEvents.length === 0) {
        dayEvents.push({
          title: getDefaultEventTitle(i),
          description: getDefaultEventDescription(i),
          time: getDefaultEventTime(i),
          type: 'default',
        });
      }

      events.push({
        date,
        dayNumber: format(date, 'dd'),
        dayName: format(date, 'EEE').toUpperCase(),
        events: dayEvents,
      });
    }

    console.log('Generated weekly events:', events);
    return events;
  }, [currentWeek, sessions]);

  // Debug: Log when weeklyEvents changes
  React.useEffect(() => {
    console.log('🔄 weeklyEvents changed:', weeklyEvents);
    console.log(
      '🔄 weeklyEvents details:',
      weeklyEvents.map(day => ({
        date: day.date.toDateString(),
        events: day.events.map(event => ({
          title: event.title,
          time: event.time,
          description: event.description,
        })),
      }))
    );
  }, [weeklyEvents]);

  // Force re-computation to see if memoization is working
  console.log(
    '🔍 Current sessions for memoization:',
    sessions.length,
    sessions.slice(0, 2)
  );
  console.log('🔍 Current week for memoization:', currentWeek.toDateString());

  // Let's manually check what's in the sessions
  console.log(
    '🔍 Manual session check:',
    sessions.map(s => ({
      id: s.id,
      title: s.title,
      start_time: s.start_time,
      end_time: s.end_time,
      session_date: s.session_date,
    }))
  );

  // Let's also check the weeklyEvents array directly
  console.log('🔍 WeeklyEvents array exists:', weeklyEvents.length);
  console.log(
    '🔍 WeeklyEvents sample:',
    weeklyEvents[0]
      ? {
          date: weeklyEvents[0].date.toDateString(),
          events: weeklyEvents[0].events.map(e => ({
            title: e.title,
            time: e.time,
            description: e.description,
          })),
        }
      : 'No events'
  );

  const generateCalendarImageOnCanvas = async (
    canvas: HTMLCanvasElement
  ): Promise<void> => {
    console.log('🎨 Starting calendar image generation...');
    console.log('Weekly events:', weeklyEvents);
    console.log(
      'Weekly events details:',
      weeklyEvents.map(day => ({
        date: day.date.toDateString(),
        dayNumber: day.dayNumber,
        dayName: day.dayName,
        events: day.events.map(event => ({
          title: event.title,
          time: event.time,
          description: event.description,
        })),
      }))
    );
    console.log('Mentors:', mentors);
    console.log('Program code:', programCode);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not found');

    // Clear the entire canvas first to prevent any artifacts
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set high-resolution canvas size - 40% thinner with more height for all 5 sessions
    const width = 960; // 1600 * 0.6 = 40% thinner
    const height = 1400; // Further increased height to accommodate all sessions
    const scale = 2; // 2x resolution for crisp quality

    canvas.width = width * scale;
    canvas.height = height * scale;

    // Scale the context to match the increased canvas size
    ctx.scale(scale, scale);

    // Improve rendering quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Add subtle dot pattern
    ctx.fillStyle = '#333333';
    for (let x = 0; x < width; x += 30) {
      for (let y = 0; y < height; y += 30) {
        if ((x + y) % 60 === 0) {
          ctx.beginPath();
          ctx.arc(x, y, 0.5, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }

    // Load and draw the actual LIT logo
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';

    await new Promise((resolve, reject) => {
      logoImg.onload = () => {
        // Draw the LIT logo at top left
        const logoSize = 80;
        ctx.drawImage(logoImg, 40, 20, logoSize, logoSize);
        resolve(void 0);
      };
      logoImg.onerror = error => {
        console.error('Failed to load logo, falling back to text:', error);
        // Fallback to text if logo fails to load
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 60px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('LIT', 40, 70);
        resolve(void 0);
      };
      logoImg.src =
        'https://ghmpaghyasyllfvamfna.supabase.co/storage/v1/object/public/lit-nav/lit-logo.svg';
    });

    // Cohort name and date - positioned at top right
    ctx.fillStyle = '#45b7d1';
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.textAlign = 'right';
    // Use cohort name if available, otherwise fallback to program code
    const displayName =
      cohortName && cohortName.trim() !== '' ? cohortName : programCode;
    ctx.fillText(displayName, width - 40, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial, sans-serif';
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday

    // Check if there are any sessions on Sunday
    const sunday = new Date(weekStart);
    sunday.setDate(weekStart.getDate() + 6); // Sunday is 6 days after Monday
    const hasSundaySession = sessions.some(session => {
      const sessionDate = new Date(session.session_date);
      return sessionDate.toDateString() === sunday.toDateString();
    });

    // End date is Friday unless there are Sunday sessions
    const weekEnd = new Date(weekStart);
    if (hasSundaySession) {
      weekEnd.setDate(weekStart.getDate() + 6); // Sunday
    } else {
      weekEnd.setDate(weekStart.getDate() + 4); // Friday
    }

    const dateRange = `${format(weekStart, 'dd MMM')} - ${format(weekEnd, 'dd MMM')}`;
    ctx.fillText(dateRange, width - 40, 100);

    // Weekly Schedule vertical text - spanning entire height with much larger font
    ctx.save();
    ctx.translate(200, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#45b7d1';
    ctx.font = 'bold 108px Arial, sans-serif'; // Increased by another 50% (72px * 1.5 = 108px)
    ctx.textAlign = 'center';
    ctx.fillText('WEEKLY SCHEDULE', 0, 0);
    ctx.restore();

    // Daily events - increased gap from WEEKLY SCHEDULE
    let yOffset = 180; // Start higher to give more space
    const dayColumnWidth = 60; // Narrower day column
    const dayColumnX = 280; // Increased gap from WEEKLY SCHEDULE title
    const eventColumnStart = 340; // Events start with more separation
    const eventColumnWidth = width - eventColumnStart - 40; // Full width available since mentors are hidden

    weeklyEvents.forEach((day, index) => {
      // Calculate the center point of all events for this day first
      const eventsStartY = yOffset + 15; // Start events at the top of the day section
      let maxEventY = eventsStartY;
      const eventSpacing = 75; // Slightly reduced spacing to fit more events

      // Calculate the total height of all events for this day
      day.events.forEach((event, eventIndex) => {
        const eventStartY = eventsStartY + eventIndex * eventSpacing;
        // Estimate event height (title + description + time + spacing)
        const estimatedEventHeight = 60; // Approximate height per event
        maxEventY = Math.max(maxEventY, eventStartY + estimatedEventHeight);
      });

      // Calculate the vertical center of all events for this day
      const eventsCenterY = eventsStartY + (maxEventY - eventsStartY) / 2;

      // Day number and name - vertically centered with the events
      const dayNumberY = eventsCenterY - 10; // Slightly above center
      const dayNameY = eventsCenterY + 20; // Slightly below center

      // Center-align day numbers with the event content
      ctx.fillStyle = '#45b7d1';
      ctx.font = 'bold 60px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(day.dayNumber, dayColumnX, dayNumberY);

      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(day.dayName, dayColumnX, dayNameY);

      day.events.forEach((event, eventIndex) => {
        const eventStartY = eventsStartY + eventIndex * eventSpacing;

        // Event title - bold and prominent
        ctx.fillStyle = '#45b7d1';
        ctx.font = 'bold 22px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(event.title, eventColumnStart, eventStartY + 25);

        // Event description - smaller and offset
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial, sans-serif';

        // Wrap long descriptions if needed
        const maxDescriptionWidth = eventColumnWidth - 20;
        const words = event.description.split(' ');
        let line = '';
        let lineY = eventStartY + 48;

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;

          if (testWidth > maxDescriptionWidth && n > 0) {
            ctx.fillText(line, eventColumnStart, lineY);
            line = words[n] + ' ';
            lineY += 18;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, eventColumnStart, lineY);

        // Event time - smaller and at bottom
        ctx.fillStyle = '#cccccc';
        ctx.font = '14px Arial, sans-serif';
        ctx.fillText(event.time, eventColumnStart, lineY + 20);

        maxEventY = Math.max(maxEventY, lineY + 30);
      });

      // Calculate next day position based on actual event heights
      const dayHeight = Math.max(120, maxEventY - yOffset + 30);

      // Separator line - drawn after all day content with proper spacing
      if (index < weeklyEvents.length - 1) {
        const separatorY = yOffset + dayHeight;
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(dayColumnX - 20, separatorY); // Start separator closer to day column
        ctx.lineTo(width - 40, separatorY); // Extend to full width since mentors are hidden
        ctx.stroke();
      }

      yOffset += dayHeight + 15; // Reduced padding between days to fit more content
    });

    // Mentors section - HIDDEN as requested
    // const mentorsY = height - 200;
    //
    // // Only render mentors section if we have mentors
    // if (mentors && mentors.length > 0) {
    //   ctx.fillStyle = '#ffffff';
    //   ctx.font = 'bold 16px Arial, sans-serif';
    //   ctx.textAlign = 'left';
    //   ctx.fillText('THIS WEEK\'S', width - 190, mentorsY);
    //
    //   ctx.fillStyle = '#45b7d1';
    //   ctx.font = 'bold 16px Arial, sans-serif';
    //   ctx.fillText('MENTOR\'S', width - 190, mentorsY + 20);
    //
    //   // Mentor avatars and names - compact layout
    //   const mentorSpacing = 55;
    //   const startX = width - 190;
    //   const maxMentors = Math.min(3, mentors.length); // Limit to 3 mentors max
    //
    //   for (let i = 0; i < maxMentors; i++) {
    //     const mentor = mentors[i];
    //     const x = startX + (i * mentorSpacing);
    //
    //     // Mentor avatar (circle)
    //     ctx.beginPath();
    //     ctx.arc(x, mentorsY + 55, 18, 0, 2 * Math.PI);
    //     ctx.fillStyle = '#333333';
    //     ctx.fill();
    //     ctx.strokeStyle = '#45b7d1';
    //     ctx.lineWidth = 1.5;
    //     ctx.stroke();
    //
    //     // Mentor name - single line with proper spacing
    //     ctx.fillStyle = '#ffffff';
    //     ctx.font = '9px Arial, sans-serif';
    //     ctx.textAlign = 'center';
    //     const firstName = mentor.first_name || '';
    //     const lastName = mentor.last_name || '';
    //
    //     // Display first name on first line, last name on second line
    //     if (firstName) {
    //       ctx.fillText(firstName, x, mentorsY + 85);
    //     }
    //     if (lastName) {
    //       ctx.fillText(lastName, x, mentorsY + 96);
    //     }
    //   }
    // }

    console.log('Calendar image generation completed');
  };

  const generateCalendarImage = async (): Promise<string> => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas ref is null, creating temporary canvas');
      // Create a temporary canvas if ref is null
      const tempCanvas = document.createElement('canvas');
      await generateCalendarImageOnCanvas(tempCanvas);
      return tempCanvas.toDataURL('image/png');
    }
    await generateCalendarImageOnCanvas(canvas);
    return canvas.toDataURL('image/png');
  };

  // Generate the calendar image when the preview modal opens
  React.useEffect(() => {
    if (isPreviewOpen) {
      console.log('🖼️ Preview modal opened, canvas ref:', canvasRef.current);
      setIsGeneratingPreview(true);

      // Use requestAnimationFrame to ensure DOM is ready
      const generatePreview = async () => {
        // Prevent multiple simultaneous generations
        if (isGeneratingRef.current) {
          console.log('🚫 Generation already in progress, skipping...');
          setIsGeneratingPreview(false);
          return;
        }

        isGeneratingRef.current = true;

        try {
          // Wait for canvas to be available
          let attempts = 0;
          const maxAttempts = 10;

          while (!canvasRef.current && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }

          if (canvasRef.current) {
            console.log('✅ Canvas found, generating single image...');
            await generateCalendarImage();
          } else {
            console.error('❌ Canvas ref is still null after waiting');
          }
        } catch (error) {
          console.error('❌ Error generating preview:', error);
        } finally {
          isGeneratingRef.current = false;
          setIsGeneratingPreview(false);
        }
      };

      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        generatePreview();
      });
    }
  }, [isPreviewOpen]);

  const downloadImage = async () => {
    setIsDownloading(true);
    try {
      // Create a temporary canvas for download
      const tempCanvas = document.createElement('canvas');
      await generateCalendarImageOnCanvas(tempCanvas);

      // Convert to JPG format with maximum quality
      const dataUrl = tempCanvas.toDataURL('image/jpeg', 1.0);

      const link = document.createElement('a');
      link.download = `weekly-calendar-${format(weekStart, 'yyyy-MM-dd')}.jpg`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading image:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });

  return (
    <div className='flex gap-2'>
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogTrigger asChild>
          <Button variant='outline' size='sm'>
            <Eye className='h-4 w-4 mr-2' />
            Preview
          </Button>
        </DialogTrigger>
        <DialogContent className='max-w-6xl max-h-[90vh] overflow-auto'>
          <DialogHeader>
            <DialogTitle>Weekly Calendar Preview</DialogTitle>
            <DialogDescription>
              Preview of the weekly calendar for {format(weekStart, 'MMM dd')} -{' '}
              {format(
                endOfWeek(weekStart, { weekStartsOn: 1 }),
                'MMM dd, yyyy'
              )}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='flex justify-center'>
              <div className='relative'>
                {isGeneratingPreview && (
                  <div className='absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10'>
                    <div className='text-center'>
                      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2'></div>
                      <p className='text-gray-600'>
                        Generating calendar preview...
                      </p>
                    </div>
                  </div>
                )}
                <canvas
                  ref={setCanvasRef}
                  className='border rounded-lg'
                  style={{ maxWidth: '100%', height: 'auto' }}
                  width={960}
                  height={1400}
                />
              </div>
            </div>
            <div className='flex gap-2 justify-between'>
              <Button
                variant='outline'
                onClick={async () => {
                  if (isGeneratingRef.current) {
                    console.log(
                      '🚫 Manual generation blocked - already in progress'
                    );
                    return;
                  }

                  try {
                    setIsGeneratingPreview(true);
                    isGeneratingRef.current = true;
                    await generateCalendarImage();
                  } catch (error) {
                    console.error('Manual generation error:', error);
                  } finally {
                    isGeneratingRef.current = false;
                    setIsGeneratingPreview(false);
                  }
                }}
                disabled={isGeneratingPreview}
              >
                {isGeneratingPreview ? 'Generating...' : 'Regenerate Preview'}
              </Button>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={downloadImage}
                  disabled={isDownloading}
                >
                  <Download className='h-4 w-4 mr-2' />
                  Download JPG
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        variant='outline'
        size='sm'
        onClick={() => downloadImage('png')}
        disabled={isDownloading}
      >
        <Download className='h-4 w-4 mr-2' />
        {isDownloading ? 'Downloading...' : 'Download'}
      </Button>
    </div>
  );
};
