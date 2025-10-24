import { Link, useRouterState } from '@tanstack/react-router'
import { 
  LayoutDashboard, 
  FileType, 
  Image, 
  Settings,
  Server,
  FileText,
  Users,
  Shield
} from 'lucide-react'
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar'

export function Sidebar() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  const menuItems = [
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
    },
    {
      to: '/content-type-builder',
      icon: FileType,
      label: 'Content Types',
    },
    {
      to: '/content-manager',
      icon: FileText,
      label: 'Content Manager',
    },
    {
      to: '/user-management',
      icon: Users,
      label: 'User Management',
    },
    {
      to: '/role-management',
      icon: Shield,
      label: 'Role Management',
    },
    {
      to: '/api-dashboard',
      icon: Server,
      label: 'API Controller',
    },
    {
      to: '/media',
      icon: Image,
      label: 'Media',
    },
    {
      to: '/settings',
      icon: Settings,
      label: 'Settings',
      disabled: true,
    },
  ]

  return (
    <SidebarPrimitive collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-md">
            <Server className="h-4 w-4" />
          </div>
          <span className="font-semibold group-data-[collapsible=icon]:hidden">
            CMS
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  {item.disabled ? (
                    <SidebarMenuButton
                      tooltip={item.label}
                      disabled
                      className="cursor-not-allowed opacity-50"
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
                      isActive={currentPath === item.to}
                    >
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </SidebarPrimitive>
  )
}
