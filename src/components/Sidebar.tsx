import { Link } from '@tanstack/react-router'
import { 
  LayoutDashboard, 
  FileType, 
  Image, 
  Settings, 
  Menu, 
  X,
  Server,
  FileText
} from 'lucide-react'
import { Button } from './ui/button'

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-slate-900 text-white z-50
          transition-transform duration-300 ease-in-out
          ${isCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
          ${isCollapsed ? 'lg:w-16' : 'w-64'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold">CMS</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-white hover:bg-slate-800 lg:hover:bg-slate-800"
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-2">
          <SidebarLink
            to="/dashboard"
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            isCollapsed={isCollapsed}
          />
          <SidebarLink
            to="/content-type-builder"
            icon={<FileType size={20} />}
            label="Content Types"
            isCollapsed={isCollapsed}
          />
          <SidebarLink
            to="/content-manager"
            icon={<FileText size={20} />}
            label="Content Manager"
            isCollapsed={isCollapsed}
          />
          <SidebarLink
            to="/api-dashboard"
            icon={<Server size={20} />}
            label="API Controller"
            isCollapsed={isCollapsed}
          />
          <SidebarLink
            to="/media"
            icon={<Image size={20} />}
            label="Media"
            isCollapsed={isCollapsed}
          />
          <SidebarLink
            to="/settings"
            icon={<Settings size={20} />}
            label="Settings"
            isCollapsed={isCollapsed}
            disabled
          />
        </nav>
      </aside>
    </>
  )
}

interface SidebarLinkProps {
  to: string
  icon: React.ReactNode
  label: string
  isCollapsed: boolean
  disabled?: boolean
}

function SidebarLink({ to, icon, label, isCollapsed, disabled }: SidebarLinkProps) {
  if (disabled) {
    return (
      <div
        className={`
          flex items-center gap-3 px-3 py-2 rounded-md
          text-slate-400 cursor-not-allowed
          ${isCollapsed ? 'justify-center' : ''}
        `}
        title={isCollapsed ? label : undefined}
      >
        {icon}
        {!isCollapsed && <span className="text-sm">{label}</span>}
      </div>
    )
  }

  return (
    <Link
      to={to}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-md
        text-slate-300 hover:bg-slate-800 hover:text-white
        transition-colors
        [&.active]:bg-blue-600 [&.active]:text-white
        ${isCollapsed ? 'justify-center' : ''}
      `}
      activeProps={{ className: 'active' }}
      title={isCollapsed ? label : undefined}
    >
      {icon}
      {!isCollapsed && <span className="text-sm">{label}</span>}
    </Link>
  )
}
