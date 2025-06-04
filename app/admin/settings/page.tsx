import DashboardLayout from '../../components/DashboardLayout';
import BackupControl from '../components/BackupControl';
import RecentBackups from '../components/RecentBackups';

export default function AdminSettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-black">Admin Settings</h1>
        
        <div className="grid gap-6">
          <BackupControl />
          <RecentBackups />
          
          {/* Add more admin settings sections here */}
        </div>
      </div>
    </DashboardLayout>
  );
} 