// Page wrapper for admin user plan management
import React from 'react';
import UserPlans from './UserPlans';

export default function UserPlansPage() {
  const token = localStorage.getItem('token');
  return <UserPlans token={token} />;
}
