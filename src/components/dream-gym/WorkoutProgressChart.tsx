'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { WorkoutLog } from '@/types/domain';

interface WorkoutProgressChartProps {
  workouts: WorkoutLog[];
  height?: number;
}

type ChartView = 'volume' | 'frequency' | 'duration';
type TimeRange = '7d' | '30d' | '90d' | 'all';

interface ChartDataPoint {
  date: string;
  fullDate: Date;
  volume: number;
  workouts: number;
  duration: number;
}

/**
 * WorkoutProgressChart - Visualize workout progress over time
 *
 * Shows volume trends, workout frequency, and duration patterns
 */
export function WorkoutProgressChart({
  workouts,
  height = 300,
}: WorkoutProgressChartProps) {
  const [chartView, setChartView] = useState<ChartView>('volume');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Filter workouts by time range
  const filteredWorkouts = useMemo(() => {
    if (timeRange === 'all') return workouts;

    const now = new Date();
    const daysMap: Record<TimeRange, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      'all': 0,
    };
    const cutoff = new Date(now.getTime() - daysMap[timeRange] * 24 * 60 * 60 * 1000);

    return workouts.filter((w) => new Date(w.date) >= cutoff);
  }, [workouts, timeRange]);

  // Aggregate data by day
  const chartData = useMemo(() => {
    const dataMap = new Map<string, ChartDataPoint>();

    filteredWorkouts.forEach((workout) => {
      const date = new Date(workout.date);
      const dateKey = date.toISOString().split('T')[0];

      const existing = dataMap.get(dateKey);
      if (existing) {
        existing.volume += workout.totalVolume || 0;
        existing.workouts += 1;
        existing.duration += workout.duration;
      } else {
        dataMap.set(dateKey, {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDate: date,
          volume: workout.totalVolume || 0,
          workouts: 1,
          duration: workout.duration,
        });
      }
    });

    // Sort by date
    return Array.from(dataMap.values()).sort(
      (a, b) => a.fullDate.getTime() - b.fullDate.getTime()
    );
  }, [filteredWorkouts]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalVolume = chartData.reduce((sum, d) => sum + d.volume, 0);
    const totalWorkouts = chartData.reduce((sum, d) => sum + d.workouts, 0);
    const totalDuration = chartData.reduce((sum, d) => sum + d.duration, 0);
    const avgVolume = totalWorkouts > 0 ? Math.round(totalVolume / totalWorkouts) : 0;
    const avgDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;

    return { totalVolume, totalWorkouts, totalDuration, avgVolume, avgDuration };
  }, [chartData]);

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          No workout data for selected period
        </div>
      );
    }

    switch (chartView) {
      case 'volume':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) =>
                  value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: unknown) => [`${Number(value).toLocaleString()} lbs`, 'Volume']}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#volumeGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'frequency':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: unknown) => [String(value), 'Workouts']}
              />
              <Bar dataKey="workouts" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'duration':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `${value}m`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: unknown) => [`${value} min`, 'Duration']}
              />
              <Line
                type="monotone"
                dataKey="duration"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: '#f59e0b', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-gray-800">Workout Progress</h3>

        <div className="flex items-center gap-3">
          {/* Chart View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {(['volume', 'frequency', 'duration'] as ChartView[]).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setChartView(view)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                  chartView === view
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          {/* Time Range */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="text-sm border rounded-md px-2 py-1 bg-white"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 divide-x border-b">
        <div className="px-4 py-2 text-center">
          <div className="text-lg font-bold text-purple-600">
            {stats.totalVolume >= 1000
              ? `${(stats.totalVolume / 1000).toFixed(1)}k`
              : stats.totalVolume.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Total Volume (lbs)</div>
        </div>
        <div className="px-4 py-2 text-center">
          <div className="text-lg font-bold text-green-600">{stats.totalWorkouts}</div>
          <div className="text-xs text-gray-500">Workouts</div>
        </div>
        <div className="px-4 py-2 text-center">
          <div className="text-lg font-bold text-amber-600">{stats.avgDuration}m</div>
          <div className="text-xs text-gray-500">Avg Duration</div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4">{renderChart()}</div>
    </div>
  );
}

export default WorkoutProgressChart;
