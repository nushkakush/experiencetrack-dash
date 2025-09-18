import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AttendanceService } from '@/services/attendance.service';
import { supabase } from '@/integrations/supabase/client';
import type { CohortEpic } from '@/types/attendance';

interface EpicSelectorDebugProps {
  cohortId: string;
}

export const EpicSelectorDebug: React.FC<EpicSelectorDebugProps> = ({
  cohortId,
}) => {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDebug = async () => {
    setLoading(true);
    console.log('🔍 EpicSelectorDebug: Starting comprehensive debug...');

    try {
      // Test database connection
      await AttendanceService.debugDatabaseConnection();

      // Test direct cohort_epics query
      const { data: directEpics, error: directError } = await supabase
        .from('cohort_epics')
        .select('*')
        .eq('cohort_id', cohortId);

      console.log('🔍 EpicSelectorDebug: Direct cohort_epics query:', {
        data: directEpics,
        error: directError,
        count: directEpics?.length || 0,
      });

      // Test join query
      const { data: joinEpics, error: joinError } = await supabase
        .from('cohort_epics')
        .select(
          `
          *,
          epic:epics(*)
        `
        )
        .eq('cohort_id', cohortId)
        .order('position', { ascending: true });

      console.log('🔍 EpicSelectorDebug: Join query:', {
        data: joinEpics,
        error: joinError,
        count: joinEpics?.length || 0,
      });

      // Test AttendanceService method
      const serviceEpics = await AttendanceService.getCohortEpics(cohortId);
      console.log('🔍 EpicSelectorDebug: AttendanceService result:', {
        data: serviceEpics,
        count: serviceEpics?.length || 0,
      });

      // Check if cohort exists
      const { data: cohort, error: cohortError } = await supabase
        .from('cohorts')
        .select('*')
        .eq('id', cohortId)
        .single();

      console.log('🔍 EpicSelectorDebug: Cohort check:', {
        data: cohort,
        error: cohortError,
      });

      setDebugData({
        directEpics: {
          data: directEpics,
          error: directError,
          count: directEpics?.length || 0,
        },
        joinEpics: {
          data: joinEpics,
          error: joinError,
          count: joinEpics?.length || 0,
        },
        serviceEpics: {
          data: serviceEpics,
          count: serviceEpics?.length || 0,
        },
        cohort: {
          data: cohort,
          error: cohortError,
        },
      });
    } catch (error) {
      console.error('❌ EpicSelectorDebug: Error during debug:', error);
      setDebugData({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cohortId) {
      runDebug();
    }
  }, [cohortId]);

  return (
    <Card className='w-full max-w-4xl'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          🔍 Epic Selector Debug
          <Button
            onClick={runDebug}
            disabled={loading}
            size='sm'
            variant='outline'
          >
            {loading ? 'Running...' : 'Refresh Debug'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div>
          <h4 className='font-semibold mb-2'>Cohort ID:</h4>
          <code className='bg-gray-100 p-2 rounded'>{cohortId}</code>
        </div>

        {debugData && (
          <div className='space-y-4'>
            {/* Cohort Check */}
            <div>
              <h4 className='font-semibold mb-2'>Cohort Check:</h4>
              {debugData.cohort?.error ? (
                <Badge variant='destructive'>
                  Error: {debugData.cohort.error.message}
                </Badge>
              ) : (
                <div className='space-y-2'>
                  <Badge variant='outline'>✅ Cohort found</Badge>
                  <div className='text-sm'>
                    <p>
                      <strong>Name:</strong> {debugData.cohort?.data?.name}
                    </p>
                    <p>
                      <strong>ID:</strong> {debugData.cohort?.data?.id}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Query */}
            <div>
              <h4 className='font-semibold mb-2'>Direct cohort_epics Query:</h4>
              {debugData.directEpics?.error ? (
                <Badge variant='destructive'>
                  Error: {debugData.directEpics.error.message}
                </Badge>
              ) : (
                <div className='space-y-2'>
                  <Badge variant='outline'>
                    ✅ {debugData.directEpics?.count || 0} epics found
                  </Badge>
                  {debugData.directEpics?.data?.map(
                    (epic: any, index: number) => (
                      <div
                        key={index}
                        className='text-sm bg-gray-50 p-2 rounded'
                      >
                        <p>
                          <strong>ID:</strong> {epic.id}
                        </p>
                        <p>
                          <strong>Position:</strong> {epic.position}
                        </p>
                        <p>
                          <strong>Active:</strong>{' '}
                          {epic.is_active ? 'Yes' : 'No'}
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Join Query */}
            <div>
              <h4 className='font-semibold mb-2'>
                Join Query (cohort_epics + epics):
              </h4>
              {debugData.joinEpics?.error ? (
                <Badge variant='destructive'>
                  Error: {debugData.joinEpics.error.message}
                </Badge>
              ) : (
                <div className='space-y-2'>
                  <Badge variant='outline'>
                    ✅ {debugData.joinEpics?.count || 0} epics found
                  </Badge>
                  {debugData.joinEpics?.data?.map(
                    (epic: any, index: number) => (
                      <div
                        key={index}
                        className='text-sm bg-gray-50 p-2 rounded'
                      >
                        <p>
                          <strong>ID:</strong> {epic.id}
                        </p>
                        <p>
                          <strong>Epic Name:</strong>{' '}
                          {epic.epic?.name || 'No name'}
                        </p>
                        <p>
                          <strong>Position:</strong> {epic.position}
                        </p>
                        <p>
                          <strong>Active:</strong>{' '}
                          {epic.is_active ? 'Yes' : 'No'}
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Service Method */}
            <div>
              <h4 className='font-semibold mb-2'>
                AttendanceService.getCohortEpics():
              </h4>
              <div className='space-y-2'>
                <Badge variant='outline'>
                  ✅ {debugData.serviceEpics?.count || 0} epics returned
                </Badge>
                {debugData.serviceEpics?.data?.map(
                  (epic: any, index: number) => (
                    <div key={index} className='text-sm bg-gray-50 p-2 rounded'>
                      <p>
                        <strong>ID:</strong> {epic.id}
                      </p>
                      <p>
                        <strong>Epic Name:</strong>{' '}
                        {epic.epic?.name || 'No name'}
                      </p>
                      <p>
                        <strong>Position:</strong> {epic.position}
                      </p>
                      <p>
                        <strong>Active:</strong> {epic.is_active ? 'Yes' : 'No'}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {debugData?.error && (
          <div>
            <Badge variant='destructive'>Debug Error: {debugData.error}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
