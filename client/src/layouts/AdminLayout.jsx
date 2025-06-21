// ✅ Correct layout: AdminLayout.jsx
import { Outlet } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';

const AdminLayout = () => (
  <>
    <AdminNavbar />
    <Outlet />
  </>
);

export default AdminLayout;