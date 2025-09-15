import React from 'react';
import { View } from '../types';
import { InboxIcon, UsersIcon, CogIcon, CalendarIcon, SparklesIcon, LogoutIcon } from './Icons';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  unreadCount: number;
  onLogout: () => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badgeCount?: number;
}> = ({ icon, label, isActive, onClick, badgeCount }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors duration-200 rounded-lg ${
      isActive
        ? 'bg-yellow-500 bg-opacity-20 text-yellow-300'
        : 'text-gray-400 hover:bg-gray-700'
    }`}
  >
    {icon}
    <span className="ml-4">{label}</span>
    {badgeCount && badgeCount > 0 ? (
        <span className="ml-auto bg-yellow-400 text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{badgeCount}</span>
    ) : null}
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, unreadCount, onLogout }) => {
  return (
    <div className="flex flex-col w-64 h-screen px-4 py-8 bg-gray-800 border-r border-gray-700">
        <div className="flex items-center px-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <h2 className="text-2xl font-semibold text-white ml-2">Meta<span className="text-yellow-400">Luxe</span></h2>
        </div>
      
      <div className="relative mt-6">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
        </span>
        <input type="text" className="w-full py-2 pl-10 pr-4 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:border-yellow-500 focus:ring-yellow-500 focus:ring-opacity-40 focus:outline-none focus:ring" placeholder="Search" />
      </div>

      <div className="flex flex-col justify-between flex-1 mt-6">
        <nav>
          <NavItem
            icon={<InboxIcon className="w-5 h-5" />}
            label="Inbox"
            isActive={activeView === 'inbox'}
            onClick={() => setActiveView('inbox')}
            badgeCount={unreadCount}
          />
          <NavItem
            icon={<UsersIcon className="w-5 h-5" />}
            label="Customers"
            isActive={activeView === 'customers'}
            onClick={() => setActiveView('customers')}
          />
          <NavItem
            icon={<SparklesIcon className="w-5 h-5" />}
            label="Automation"
            isActive={activeView === 'automation'}
            onClick={() => setActiveView('automation')}
          />
          <NavItem
            icon={<CalendarIcon className="w-5 h-5" />}
            label="Calendar"
            isActive={activeView === 'calendar'}
            onClick={() => setActiveView('calendar')}
          />
           <NavItem
            icon={<CogIcon className="w-5 h-5" />}
            label="Integrations"
            isActive={activeView === 'settings'}
            onClick={() => setActiveView('settings')}
          />
        </nav>

        <div className="mt-6">
            <button
                onClick={onLogout}
                className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-400 hover:bg-gray-700 rounded-lg transition-colors duration-200"
            >
                <LogoutIcon className="w-5 h-5" />
                <span className="ml-4">Logout</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;