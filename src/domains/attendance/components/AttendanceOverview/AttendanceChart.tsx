/**
 * Attendance Chart Component
 * Visual representation of attendance trends over time
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, BarChart3 } from 'lucide-react';

export interface AttendanceChartData {
  date: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

interface AttendanceChartProps {
  data: AttendanceChartData[];
  timeframe: string;
  loading?: boolean;
}

export const AttendanceChart: React.FC<AttendanceChartProps> = React.memo(({
  data,
  timeframe,
  loading = false,
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Attendance Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-32"></div>
            <div className="h-40 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Attendance Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No data available for the selected timeframe
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall trend
  const firstWeek = data.slice(0, Math.min(7, data.length));
  const lastWeek = data.slice(-Math.min(7, data.length));
  
  const firstWeekAvg = firstWeek.reduce((sum, d) => sum + d.percentage, 0) / firstWeek.length;
  const lastWeekAvg = lastWeek.reduce((sum, d) => sum + d.percentage, 0) / lastWeek.length;
  const trendDirection = lastWeekAvg > firstWeekAvg ? 'up' : lastWeekAvg < firstWeekAvg ? 'down' : 'stable';
  const trendPercentage = Math.abs(lastWeekAvg - firstWeekAvg);

  // Find max values for scaling
  const maxTotal = Math.max(...data.map(d => d.total));
  const maxPercentage = Math.max(...data.map(d => d.percentage));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Attendance Trend
          </CardTitle>
          <div className="flex items-center gap-2">
            <TrendingUp className={`h-4 w-4 ${
              trendDirection === 'up' ? 'text-green-600' : 
              trendDirection === 'down' ? 'text-red-600' : 'text-muted-foreground'
            }`} />
            <Badge variant={
              trendDirection === 'up' ? 'default' : 
              trendDirection === 'down' ? 'destructive' : 'secondary'
            }>
              {trendDirection === 'stable' ? 'Stable' : 
               `${trendDirection === 'up' ? '+' : '-'}${trendPercentage.toFixed(1)}%`}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart Legend */}
        <div className="flex items-center gap-4 mb-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Late</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Absent</span>
          </div>
        </div>

        {/* Simple Bar Chart */}
        <div className="space-y-2">
          {data.slice(-20).map((item, index) => { // Show last 20 data points
            const date = new Date(item.date);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            
            return (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className="w-16 text-muted-foreground">
                  {date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                
                <div className="flex-1 relative">
                  <div className="flex h-6 bg-muted rounded overflow-hidden">
                    {/* Present bar */}
                    <div 
                      className="bg-green-500 transition-all duration-300"
                      style={{ 
                        width: `${item.total > 0 ? (item.present / item.total) * 100 : 0}%` 
                      }}
                    />
                    {/* Late bar */}
                    <div 
                      className="bg-yellow-500 transition-all duration-300"
                      style={{ 
                        width: `${item.total > 0 ? (item.late / item.total) * 100 : 0}%` 
                      }}
                    />
                    {/* Absent bar */}
                    <div 
                      className="bg-red-500 transition-all duration-300"
                      style={{ 
                        width: `${item.total > 0 ? (item.absent / item.total) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  
                  {/* Percentage overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-white drop-shadow-sm">
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div className="w-16 text-right">
                  <span className="font-medium">{item.total}</span>
                  <span className="text-muted-foreground"> sessions</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <div className="font-medium text-green-600">
                {data.reduce((sum, d) => sum + d.present, 0)}
              </div>
              <div className="text-muted-foreground">Present</div>
            </div>
            <div>
              <div className="font-medium text-yellow-600">
                {data.reduce((sum, d) => sum + d.late, 0)}
              </div>
              <div className="text-muted-foreground">Late</div>
            </div>
            <div>
              <div className="font-medium text-red-600">
                {data.reduce((sum, d) => sum + d.absent, 0)}
              </div>
              <div className="text-muted-foreground">Absent</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

AttendanceChart.displayName = 'AttendanceChart';
