'use client';

import DashboardLayout from '../../components/DashboardLayout';
import { Card, Title, AreaChart } from '@tremor/react';

const chartdata = [
  {
    date: '2024-03-01',
    'API Requests': 351,
    'Error Rate': 2,
  },
  {
    date: '2024-03-02',
    'API Requests': 422,
    'Error Rate': 3,
  },
  {
    date: '2024-03-03',
    'API Requests': 483,
    'Error Rate': 1,
  },
  // Add more mock data as needed
];

export default function MonitoringPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-black">System Monitoring</h1>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <Title className="text-black">API Performance</Title>
            <AreaChart
              className="mt-4 h-72"
              data={chartdata}
              index="date"
              categories={['API Requests', 'Error Rate']}
              colors={['blue', 'red']}
            />
          </Card>

          <Card>
            <Title className="text-black">System Health</Title>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-black">API Status</span>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-black">Operational</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-black">Database Status</span>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-black">Operational</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-black">Cache Status</span>
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-black">Operational</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 