"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import phosaiLogo from "@/assets/phosai_logo.png"
import {
  BarChart,
  Brain,
  Book,
  Mic,
  Workflow,
  History,
  LogOut,
  Sliders,
} from "lucide-react"

const NAV_ITEMS = [
  { id: "dashboard", label: "Analytics", icon: BarChart },
  { id: "builder", label: "Agents", icon: Brain },
  { id: "voices", label: "Voice Library", icon: Mic },
  { id: "workflows", label: "Workflows", icon: Workflow },
  { id: "knowledge", label: "Knowledge Base", icon: Book },
  { id: "integrations", label: "Integrations", icon: Sliders },
  { id: "logs", label: "Conversations", icon: History },
]

const sidebarMenuButtonStyles = `
  .sidebar-item[data-active="true"] svg {
    color: #ffffff !important;
  }
  .sidebar-item[data-active="true"] span {
    color: #ffffff !important;
  }
  .sidebar-item:not([data-active="true"]):hover svg {
    color: #ffffff !important;
  }
  .sidebar-item:not([data-active="true"]):hover span {
    color: #ffffff !important;
  }
`

export function AppSidebar({
  activeView,
  onNavigate,
  onSignOut,
  profileDisplayName,
  profileEmail,
  profilePhotoUrl,
  profileInitials,
}: {
  activeView: string
  onNavigate: (view: string) => void
  onSignOut: () => void
  profileDisplayName: string
  profileEmail: string
  profilePhotoUrl: string | null
  profileInitials: string
}) {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  return (
    <>
      <style>{sidebarMenuButtonStyles}</style>
      <Sidebar collapsible="icon">
      {/* ── Header ── */}
      <SidebarHeader className="p-3">
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-2"} px-1`}>
          <img src={phosaiLogo} alt="" className="h-8 w-8 shrink-0 object-contain" />
          {!collapsed && (
            <span className="text-sm font-extrabold tracking-wider text-white">PhosAI Studio</span>
          )}
        </div>
      </SidebarHeader>
      <SidebarSeparator className="mx-3 bg-white/10" />

      {/* ── Navigation ── */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive = activeView === item.id
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={collapsed ? item.label : undefined}
                      onClick={() => onNavigate(item.id)}
                      className={`sidebar-item ${isActive ? "active" : ""}`}
                    >
                      <Icon className="text-sidebar-foreground" />
                      {!collapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer (user profile) ── */}
      <SidebarFooter className="border-t border-white/10 p-3">
        {collapsed ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex flex-col items-center gap-2">
                {profilePhotoUrl ? (
                  <img
                    src={profilePhotoUrl}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-full border-2 object-cover"
                    style={{ borderColor: "#fcd34d" }}
                  />
                ) : (
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ backgroundColor: "#f0ad44", color: "#211d1e" }}
                  >
                    {profileInitials}
                  </div>
                )}
                <button
                  onClick={onSignOut}
                  className="flex items-center justify-center rounded-md p-1.5"
                  style={{ backgroundColor: "#f0ad44", color: "#161617" }}
                >
                  <LogOut size={14} />
                </button>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {profilePhotoUrl ? (
                <img
                  src={profilePhotoUrl}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded-full border-2 object-cover"
                  style={{ borderColor: "#fcd34d" }}
                />
              ) : (
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: "#f0ad44", color: "#211d1e" }}
                >
                  {profileInitials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-white">{profileDisplayName}</div>
                {profileEmail && (
                  <div className="truncate text-xs font-medium text-white/70" title={profileEmail}>
                    {profileEmail}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onSignOut}
              className="flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold"
              style={{ backgroundColor: "#f0ad44", color: "#161617" }}
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
    </>
  )
}
