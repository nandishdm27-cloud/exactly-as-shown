import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Search,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import campusCourtyard from "@/assets/campus-courtyard.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Campus Intelligence · Student Console" },
      {
        name: "description",
        content: "A calm, intelligent command center for student success, campus life, and academic progress.",
      },
      { property: "og:title", content: "Campus Intelligence · Student Console" },
      {
        property: "og:description",
        content: "Track your day, coursework, attendance, and campus signals from one intelligent workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CampusIntelligence,
});

type Role = "student" | "faculty" | "admin";
type ViewKey = "overview" | "schedule" | "assignments" | "attendance" | "analytics" | "ai" | "events" | "support";

type Assignment = {
  subject: string;
  title: string;
  due_label: string;
  status: string;
  accent: "coral" | "cobalt" | "gold";
};

type Announcement = { title: string; source: string; published_label: string; accent: "mint" | "gold" | "coral" };
type EventItem = { title: string; category: string; location: string; event_date: string; event_time: string; attendees_label: string };
type Attendance = { subject: string; attended_count: number; total_count: number; trend_label: string };

const demoAssignments: Assignment[] = [
  { subject: "Statistics", title: "Problem Set 6", due_label: "Due in 3 days · 23:59", status: "pending", accent: "coral" },
  { subject: "Data Structures", title: "Lab report · pair submission", due_label: "Due in 6 days", status: "pending", accent: "cobalt" },
  { subject: "Machine Learning", title: "Quiz 2 · 30 min", due_label: "Due in 11 days", status: "submitted", accent: "gold" },
];

const demoAnnouncements: Announcement[] = [
  { title: "Library open until 2 AM during finals week", source: "Student Affairs", published_label: "2h ago", accent: "mint" },
  { title: "New AI tutoring rooms in the east wing", source: "Academic Services", published_label: "yesterday", accent: "gold" },
  { title: "Spring career fair — bring 10 resumes", source: "Career Center", published_label: "2d ago", accent: "coral" },
];

const demoEvents: EventItem[] = [
  { title: "AI & Robotics Fair", category: "Technical", location: "Innovation Hub", event_date: "2026-05-21", event_time: "14:00", attendees_label: "328 registered" },
  { title: "Designing for Climate Futures", category: "Seminar", location: "North Auditorium", event_date: "2026-05-24", event_time: "11:30", attendees_label: "Open to campus" },
  { title: "Campus Night Run", category: "Sports", location: "East Quad", event_date: "2026-05-28", event_time: "18:00", attendees_label: "146 registered" },
];

const demoAttendance: Attendance[] = [
  { subject: "Linear Algebra", attended_count: 18, total_count: 19, trend_label: "+2% this month" },
  { subject: "Data Structures", attended_count: 13, total_count: 14, trend_label: "On track" },
  { subject: "Statistics", attended_count: 11, total_count: 13, trend_label: "Needs attention" },
  { subject: "Machine Learning", attended_count: 12, total_count: 13, trend_label: "+4% this month" },
];

const navGroups = [
  {
    label: "Overview",
    items: [
      { key: "overview" as ViewKey, label: "Overview", icon: LayoutDashboard },
      { key: "schedule" as ViewKey, label: "My schedule", icon: CalendarDays },
      { key: "assignments" as ViewKey, label: "Assignments", icon: FileText },
      { key: "attendance" as ViewKey, label: "Attendance", icon: Activity },
      { key: "analytics" as ViewKey, label: "Analytics", icon: Target },
      { key: "ai" as ViewKey, label: "AI Studio", icon: Sparkles },
    ],
  },
  {
    label: "Campus",
    items: [
      { key: "events" as ViewKey, label: "Campus events", icon: CalendarDays },
      { key: "support" as ViewKey, label: "Support center", icon: CircleHelp },
    ],
  },
];

const viewTitles: Record<ViewKey, { eyebrow: string; title: string; description: string }> = {
  overview: { eyebrow: "Tuesday · 14 May · Week 11", title: "Good afternoon, Maya.", description: "You're 82% on track this term — two sessions today and one deadline before Friday." },
  schedule: { eyebrow: "Tuesday · 14 May · Week 11", title: "Your day, in sequence.", description: "Three classes, one study group, and enough space to keep your evening clear." },
  assignments: { eyebrow: "Coursework · Spring term", title: "Keep the queue moving.", description: "Two items need attention this week. Your next best action is already queued." },
  attendance: { eyebrow: "Attendance · Spring term", title: "Presence compounds.", description: "Your overall attendance is strong, with one subject worth watching before finals." },
  analytics: { eyebrow: "Personal analytics · Spring term", title: "See the pattern, not just the score.", description: "Your study consistency is trending upward across the last four weeks." },
  ai: { eyebrow: "AI Studio · Guided support", title: "Make the next hour count.", description: "Campus AI has one adaptive quiz and a focused revision block ready for you." },
  events: { eyebrow: "Campus life · This month", title: "Find your next room.", description: "Technical, cultural, and community events happening around campus." },
  support: { eyebrow: "Support center · Private by design", title: "Ask for help early.", description: "Track a complaint, report a lost item, or find the right campus service." },
};

function CampusIntelligence() {
  const [activeView, setActiveView] = useState<ViewKey>("overview");
  const [role, setRole] = useState<Role>("student");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [assignments, setAssignments] = useState(demoAssignments);
  const [announcements, setAnnouncements] = useState(demoAnnouncements);
  const [events, setEvents] = useState(demoEvents);
  const [attendance, setAttendance] = useState(demoAttendance);
  const [notifications, setNotifications] = useState([
    { title: "Dr. Osei posted Lecture 12 notes", detail: "Linear Algebra · 18 minutes ago", read: false },
    { title: "Your study plan was optimized", detail: "Campus AI · Yesterday", read: false },
    { title: "Career fair registration is open", detail: "Campus Events · 2 days ago", read: true },
  ]);

  useEffect(() => {
    let active = true;
    const loadCloudData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user || !active) return;

      const [assignmentResult, announcementResult, eventResult, attendanceResult, notificationResult] = await Promise.all([
        supabase.from("assignments").select("subject,title,due_label,status,accent").order("created_at", { ascending: false }),
        supabase.from("campus_announcements").select("title,source,published_label,accent").order("created_at", { ascending: false }),
        supabase.from("campus_events").select("title,category,location,event_date,event_time,attendees_label").order("event_date", { ascending: true }),
        supabase.from("attendance_records").select("subject,attended_count,total_count,trend_label").order("created_at", { ascending: true }),
        supabase.from("notifications").select("title,detail,read_at").order("created_at", { ascending: false }),
      ]);

      if (!active) return;
      if (assignmentResult.data?.length) setAssignments(assignmentResult.data as Assignment[]);
      if (announcementResult.data?.length) setAnnouncements(announcementResult.data as Announcement[]);
      if (eventResult.data?.length) setEvents(eventResult.data as EventItem[]);
      if (attendanceResult.data?.length) setAttendance(attendanceResult.data as Attendance[]);
      if (notificationResult.data?.length) {
        setNotifications(notificationResult.data.map((notification) => ({
          title: notification.title,
          detail: notification.detail,
          read: Boolean(notification.read_at),
        })));
      }
    };

    void loadCloudData();
    return () => {
      active = false;
    };
  }, []);

  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const filteredAssignments = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return assignments;
    return assignments.filter((item) => `${item.subject} ${item.title}`.toLowerCase().includes(normalized));
  }, [assignments, search]);

  const selectView = (view: ViewKey) => {
    setActiveView(view);
    setMobileNavOpen(false);
  };

  const handleDemoRole = (nextRole: Role) => {
    setRole(nextRole);
    setProfileMenuOpen(false);
    toast.success(`${capitalize(nextRole)} demo workspace selected`, { description: "Your view is ready to explore." });
  };

  const handleGoogleSignIn = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Google sign-in is unavailable", { description: result.error.message });
  };

  const markAssignmentComplete = (title: string) => {
    setAssignments((current) => current.map((item) => (item.title === title ? { ...item, status: "completed" } : item)));
    toast.success("Assignment marked complete", { description: title });
  };

  const markNotificationsRead = () => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    toast.success("Notifications marked as read");
  };

  const currentCopy = viewTitles[activeView];

  return (
    <div className="min-h-screen overflow-x-hidden bg-parchment font-body text-ink antialiased selection:bg-lime/40">
      <div className="pointer-events-none fixed left-[8%] top-[-6%] size-72 rounded-full bg-gradient-to-br from-mint/50 via-cobalt/20 to-transparent blur-3xl" />
      <div className="pointer-events-none fixed right-[-5%] top-[30%] size-80 rounded-full bg-gradient-to-br from-coral/40 via-gold/20 to-transparent blur-3xl" />

      <div className="mx-auto flex max-w-[1440px]">
        <Sidebar activeView={activeView} role={role} onSelect={selectView} />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar
            role={role}
            search={search}
            onSearch={setSearch}
            unreadCount={unreadCount}
            notificationsOpen={notificationsOpen}
            profileMenuOpen={profileMenuOpen}
            onToggleNotifications={() => {
              setNotificationsOpen((value) => !value);
              setProfileMenuOpen(false);
            }}
            onToggleProfile={() => {
              setProfileMenuOpen((value) => !value);
              setNotificationsOpen(false);
            }}
            onMenu={() => setMobileNavOpen(true)}
            onDemoRole={handleDemoRole}
            onGoogleSignIn={handleGoogleSignIn}
            onMarkRead={markNotificationsRead}
            notifications={notifications}
          />

          <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:pb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-cobalt">{currentCopy.eyebrow}</p>
                <h1 className="mt-1 max-w-[30ch] font-display text-3xl font-semibold leading-tight text-balance sm:text-4xl">{currentCopy.title}</h1>
                <p className="mt-1.5 max-w-[48ch] text-sm text-ink/60 text-pretty">{currentCopy.description}</p>
              </div>
              <Button onClick={() => setAiOpen(true)} className="pulse-ai self-start rounded-full bg-gradient-to-r from-charcoal to-ink px-4 py-2.5 text-ivory ring-1 ring-white/15 hover:-translate-y-0.5 hover:bg-charcoal sm:self-auto">
                <span className="grid size-6 place-items-center rounded-full bg-lime text-ink"><Sparkles className="size-3.5" /></span>
                Ask Campus AI
                <span className="ml-1 hidden text-xs text-ivory/50 sm:inline">beta</span>
              </Button>
            </div>

            {activeView === "overview" && (
              <OverviewView attendance={attendance} assignments={assignments} announcements={announcements} onOpenAi={() => setAiOpen(true)} onComplete={markAssignmentComplete} />
            )}
            {activeView === "schedule" && <ScheduleView />}
            {activeView === "assignments" && <AssignmentsView assignments={filteredAssignments} onComplete={markAssignmentComplete} />}
            {activeView === "attendance" && <AttendanceView attendance={attendance} />}
            {activeView === "analytics" && <AnalyticsView attendance={attendance} assignments={assignments} />}
            {activeView === "ai" && <AiStudioView onOpenChat={() => setAiOpen(true)} />}
            {activeView === "events" && <EventsView events={events} />}
            {activeView === "support" && <SupportView onOpenAi={() => setAiOpen(true)} />}
          </main>
        </div>
      </div>

      <MobileNav activeView={activeView} onSelect={selectView} onOpenAi={() => setAiOpen(true)} />
      {mobileNavOpen && <MobileMenu activeView={activeView} onSelect={selectView} onClose={() => setMobileNavOpen(false)} />}
      {aiOpen && <AiAssistant onClose={() => setAiOpen(false)} />}
    </div>
  );
}

function Sidebar({ activeView, role, onSelect }: { activeView: ViewKey; role: Role; onSelect: (view: ViewKey) => void }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-ink/5 bg-ivory/70 p-4 lg:flex">
      <Brand />
      <nav className="flex flex-1 flex-col gap-1 text-sm">
        {navGroups.map((group) => (
          <div key={group.label} className={group.label === "Campus" ? "mt-6" : ""}>
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-mist/70">{group.label}</p>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.key} onClick={() => onSelect(item.key)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${activeView === item.key ? "bg-gradient-to-r from-cobalt/15 to-mint/15 font-medium text-cobalt ring-1 ring-cobalt/20" : "text-ink/70 hover:bg-ink/5"}`}>
                  <span className="grid size-5 place-items-center rounded-md bg-ink/5"><Icon className="size-3.5" /></span>
                  {item.label}
                  {item.key === "assignments" && <span className="ml-auto rounded-full bg-coral/15 px-1.5 py-0.5 text-[10px] font-semibold text-coral">2</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="mt-3 rounded-2xl bg-gradient-to-br from-charcoal to-ink p-3.5 text-ivory ring-1 ring-white/10">
        <p className="text-[11px] uppercase tracking-wider text-mint/80">{role === "student" ? "Finals in 9 days" : `${capitalize(role)} workspace`}</p>
        <p className="mt-1 font-display text-sm font-medium">Stay on streak, Maya.</p>
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-ivory/15"><div className="draw h-full w-[72%] rounded-full bg-gradient-to-r from-lime to-mint" /></div>
      </div>
    </aside>
  );
}

function Brand() {
  return (
    <div className="mb-7 flex items-center gap-2.5 px-1">
      <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-cobalt via-mint to-gold font-display text-sm font-semibold text-ivory shadow-sm ring-1 ring-ivory/40">CI</div>
      <div><p className="font-display text-[15px] font-semibold leading-none">Campus Intelligence</p><p className="mt-0.5 text-[11px] text-ink/45">Student console</p></div>
    </div>
  );
}

function TopBar(props: {
  role: Role; search: string; onSearch: (value: string) => void; unreadCount: number; notificationsOpen: boolean; profileMenuOpen: boolean;
  onToggleNotifications: () => void; onToggleProfile: () => void; onMenu: () => void; onDemoRole: (role: Role) => void; onGoogleSignIn: () => void;
  onMarkRead: () => void; notifications: { title: string; detail: string; read: boolean }[];
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink/5 bg-parchment/80 px-4 py-3 backdrop-blur-sm sm:px-6">
      <Button variant="ghost" size="icon" className="rounded-xl bg-ivory text-navy lg:hidden" onClick={props.onMenu} aria-label="Open navigation"><Menu /></Button>
      <div className="flex items-center gap-2 lg:hidden"><div className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-cobalt via-mint to-gold font-display text-xs font-semibold text-ivory">CI</div><span className="font-display text-sm font-semibold">Campus Intelligence</span></div>
      <div className="relative ml-auto hidden sm:block sm:w-72"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist" /><Input value={props.search} onChange={(event) => props.onSearch(event.target.value)} placeholder="Search courses, deadlines, people…" className="h-10 rounded-full border-0 bg-ivory pl-9 text-sm ring-1 ring-ink/5 placeholder:text-mist/70 focus-visible:ring-cobalt" /></div>
      <div className="relative">
        <Button variant="ghost" size="icon" className="relative rounded-full bg-ivory text-ink/60 ring-1 ring-ink/5 hover:bg-ivory" onClick={props.onToggleNotifications} aria-label="Notifications"><Bell className="size-4" />{props.unreadCount > 0 && <span className="absolute right-0 top-0 size-2.5 rounded-full bg-coral ring-2 ring-parchment" />}</Button>
        {props.notificationsOpen && <NotificationPopover notifications={props.notifications} onMarkRead={props.onMarkRead} />}
      </div>
      <div className="relative">
        <button onClick={props.onToggleProfile} className="flex items-center gap-2.5 rounded-full bg-ivory py-1 pl-1 pr-3 ring-1 ring-ink/5">
          <div className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-coral to-gold font-display text-xs font-semibold text-ink">MP</div><span className="hidden text-sm font-medium sm:inline">Maya Park</span>
        </button>
        {props.profileMenuOpen && <ProfileMenu onDemoRole={props.onDemoRole} onGoogleSignIn={props.onGoogleSignIn} />}
      </div>
    </header>
  );
}

function NotificationPopover({ notifications, onMarkRead }: { notifications: { title: string; detail: string; read: boolean }[]; onMarkRead: () => void }) {
  return <div className="absolute right-0 top-12 w-80 rounded-2xl bg-ivory p-3 shadow-xl ring-1 ring-ink/10"><div className="flex items-center justify-between px-2 py-1"><p className="font-display text-sm font-semibold">Notifications</p><button className="text-xs font-medium text-cobalt" onClick={onMarkRead}>Mark all read</button></div><div className="mt-2 space-y-1">{notifications.map((notification) => <div key={notification.title} className="flex gap-2 rounded-xl p-2 hover:bg-ink/5"><span className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.read ? "bg-ink/15" : "bg-coral"}`} /><div><p className="text-xs font-medium">{notification.title}</p><p className="mt-0.5 text-[11px] text-mist">{notification.detail}</p></div></div>)}</div></div>;
}

function ProfileMenu({ onDemoRole, onGoogleSignIn }: { onDemoRole: (role: Role) => void; onGoogleSignIn: () => void }) {
  return <div className="absolute right-0 top-12 w-56 rounded-2xl bg-ivory p-2 shadow-xl ring-1 ring-ink/10"><p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-mist">Demo mode</p>{(["student", "faculty", "admin"] as Role[]).map((role) => <button key={role} onClick={() => onDemoRole(role)} className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm text-ink/75 hover:bg-ink/5"><Users className="size-3.5 text-cobalt" />{capitalize(role)} demo</button>)}<div className="my-1 h-px bg-ink/5" /><button onClick={onGoogleSignIn} className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm text-ink/75 hover:bg-ink/5"><ArrowUpRight className="size-3.5 text-cobalt" />Sign in with Google</button></div>;
}

function OverviewView({ attendance, assignments, announcements, onOpenAi, onComplete }: { attendance: Attendance[]; assignments: Assignment[]; announcements: Announcement[]; onOpenAi: () => void; onComplete: (title: string) => void }) {
  return <>
    <div className="mt-6 grid gap-4 lg:grid-cols-12">
      <AcademicHealth attendance={attendance} />
      <ScheduleCard />
    </div>
    <div className="mt-4 grid gap-4 lg:grid-cols-12">
      <ProgressCard attendance={attendance} />
      <DeadlinesCard assignments={assignments} onComplete={onComplete} />
      <AnnouncementCard announcements={announcements} />
    </div>
    <div className="mt-4 grid gap-4 lg:grid-cols-12">
      <div className="lg:col-span-8 rounded-3xl bg-ivory p-6 ring-1 ring-ink/5"><div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-semibold">Your Campus Insights</h2><p className="text-xs text-mist">Informational signals based on your recent activity</p></div><Sparkles className="size-5 text-cobalt" /></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><Insight icon={<Activity />} text="Assignment completion improved 12% this week." tone="mint" /><Insight icon={<AlertTriangle />} text="Statistics attendance is worth watching." tone="coral" /><Insight icon={<Target />} text="One focused revision block can unlock your next topic." tone="gold" /></div></div>
      <button onClick={onOpenAi} className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-cobalt to-mint p-6 text-left text-ivory ring-1 ring-ivory/30 transition-transform hover:-translate-y-0.5 lg:col-span-4"><div className="absolute -bottom-12 -right-8 size-40 rounded-full bg-lime/30 blur-2xl" /><div className="relative"><span className="grid size-10 place-items-center rounded-2xl bg-lime text-ink"><Sparkles className="size-5" /></span><h2 className="mt-5 font-display text-lg font-semibold">Campus AI has a plan.</h2><p className="mt-2 text-sm leading-relaxed text-ivory/80">A 25-minute graph theory block and an adaptive quiz are ready when you are.</p><span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-lime">Open assistant <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-1" /></span></div></button>
    </div>
  </>;
}

function AcademicHealth({ attendance }: { attendance: Attendance[] }) { const avg = Math.round(attendance.reduce((total, item) => total + (item.attended_count / item.total_count) * 100, 0) / Math.max(attendance.length, 1)); return <section className="lg:col-span-5 rounded-3xl bg-gradient-to-b from-ivory to-white p-6 shadow-[0_24px_60px_-32px_var(--shadow-ink)] ring-1 ring-ink/5"><div className="flex items-center justify-between"><p className="text-xs font-medium uppercase tracking-[0.16em] text-ink/45">Academic health</p><span className="rounded-full bg-mint/20 px-2.5 py-1 text-[11px] font-medium text-mint-deep">▲ 6 pts this week</span></div><div className="floaty mx-auto mt-4 grid size-52 place-items-center rounded-full bg-[conic-gradient(from_210deg,var(--cobalt),var(--mint)_45%,var(--lime)_70%,var(--gold)_92%,var(--cobalt))] shadow-[inset_0_0_0_1px_var(--shadow-light),0_18px_40px_-20px_var(--shadow-cobalt)]"><div className="grid size-40 place-items-center rounded-full bg-ivory ring-1 ring-ink/5"><div className="text-center"><p className="font-display text-5xl font-semibold leading-none">82</p><p className="mt-1 text-[11px] uppercase tracking-wider text-ink/45">Excellent</p></div></div></div><div className="mt-5 grid grid-cols-3 gap-3 text-center"><Metric label="GPA" value="3.7" tone="cobalt" /><Metric label="Attendance" value={`${avg}%`} tone="mint-deep" /><Metric label="Assignments" value="18" tone="coral" /></div></section>; }
function Metric({ label, value, tone }: { label: string; value: string; tone: string }) { return <div className="rounded-2xl bg-ink/3 py-3"><p className={`font-display text-lg font-semibold text-${tone}`}>{value}</p><p className="text-[11px] text-ink/45">{label}</p></div>; }
function ScheduleCard() { const items = [{ title: "Linear Algebra — Lecture 12", detail: "Hall B4 · Dr. Osei · Ch. 6 Eigenvalues", time: "09:00–10:30", tone: "cobalt" }, { title: "Data Structures Lab", detail: "Comp Lab 2 · bring your repo", time: "11:00–12:30", tone: "mint" }, { title: "Statistics — Tutorial", detail: "Room 210 · problem set 5 review", time: "14:00–15:00", tone: "gold" }, { title: "Study group · Finals prep", detail: "Library Loft · 4 friends joined", time: "16:00 · now", tone: "coral" }]; return <section className="lg:col-span-7 rounded-3xl bg-ivory p-6 ring-1 ring-ink/5"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Today's schedule</h2><button className="text-xs font-medium text-cobalt hover:underline">Full week →</button></div><ol className="mt-4 space-y-2.5">{items.map((item) => <li key={item.title} className={`flex gap-3 rounded-2xl p-3 ring-1 transition-transform duration-300 hover:-translate-y-0.5 ${item.tone === "coral" ? "bg-gradient-to-r from-cobalt/15 to-mint/10 ring-cobalt/20" : "bg-ink/3 ring-ink/5"}`}><div className="flex flex-col items-center"><span className={`h-2.5 w-2.5 rounded-full bg-${item.tone}`} /><span className="w-px flex-1 bg-ink/10" /></div><div className="min-w-0 flex-1"><div className="flex items-baseline justify-between gap-2"><p className="text-sm font-medium">{item.title}</p><span className="text-xs text-ink/45">{item.time}</span></div><p className="text-xs text-ink/55">{item.detail}</p></div></li>)}</ol></section>; }
function ProgressCard({ attendance }: { attendance: Attendance[] }) { return <section className="lg:col-span-4 rounded-3xl bg-ivory p-6 ring-1 ring-ink/5"><h2 className="font-display text-lg font-semibold">Academic progress</h2><p className="text-xs text-ink/50">Term 2 · Spring 2026</p><div className="mt-5 space-y-4">{attendance.map((item, index) => <div key={item.subject}><div className="flex justify-between text-xs font-medium"><span>{item.subject}</span><span className={index === 2 ? "text-coral" : "text-cobalt"}>{Math.round((item.attended_count / item.total_count) * 100)}%</span></div><div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink/6"><div className={`draw h-full rounded-full ${index === 2 ? "bg-gradient-to-r from-coral to-gold" : "bg-gradient-to-r from-cobalt to-mint"}`} style={{ width: `${Math.round((item.attended_count / item.total_count) * 100)}%` }} /></div></div>)}</div></section>; }
function DeadlinesCard({ assignments, onComplete }: { assignments: Assignment[]; onComplete: (title: string) => void }) { return <section className="lg:col-span-4 rounded-3xl bg-ivory p-6 ring-1 ring-ink/5"><div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-semibold">Upcoming deadlines</h2><p className="text-xs text-mist">{assignments.filter((item) => item.status === "pending").length} items need attention</p></div><FileText className="size-5 text-cobalt" /></div><ul className="mt-4 space-y-2.5">{assignments.map((item) => <li key={item.title} className="group flex items-center gap-3 rounded-2xl bg-ink/3 p-3 ring-1 ring-ink/5"><div className={`grid size-9 shrink-0 place-items-center rounded-xl bg-${item.accent}/15 text-center leading-none`}><span className={`font-display text-sm font-semibold text-${item.accent}`}>{item.subject.slice(0, 2).toUpperCase()}</span></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.subject} — {item.title}</p><p className="text-[11px] text-ink/45">{item.due_label}</p></div>{item.status === "pending" ? <button onClick={() => onComplete(item.title)} className="grid size-7 place-items-center rounded-full bg-ivory text-mist opacity-0 ring-1 ring-ink/10 transition-opacity group-hover:opacity-100" aria-label={`Mark ${item.title} complete`}><Check className="size-3.5" /></button> : <span className="text-[10px] font-semibold uppercase tracking-wider text-mint-deep">Done</span>}</li>)}</ul></section>; }
function AnnouncementCard({ announcements }: { announcements: Announcement[] }) { return <section className="overflow-hidden rounded-3xl bg-gradient-to-b from-charcoal to-ink p-6 text-ivory ring-1 ring-ivory/10 lg:col-span-4"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Campus announcements</h2><span className="size-2 rounded-full bg-lime" /></div><ul className="mt-4 space-y-3">{announcements.map((item) => <li key={item.title} className="flex gap-3"><span className={`mt-1.5 size-1.5 shrink-0 rounded-full bg-${item.accent}`} /><div><p className="text-sm font-medium text-ivory/90">{item.title}</p><p className="text-[11px] text-ivory/45">{item.source} · {item.published_label}</p></div></li>)}</ul><div className="mt-4 overflow-hidden rounded-2xl outline-1 -outline-offset-1 outline-ivory/10"><img src={campusCourtyard} alt="Students walking through a bright campus courtyard" loading="lazy" width={1024} height={512} className="aspect-[2/1] w-full object-cover" /></div></section>; }
function Insight({ icon, text, tone }: { icon: React.ReactNode; text: string; tone: "mint" | "coral" | "gold" }) { return <div className={`rounded-2xl bg-${tone}/10 p-4`}><div className={`grid size-8 place-items-center rounded-xl bg-${tone}/20 text-${tone}`} >{icon}</div><p className="mt-3 text-sm leading-relaxed text-ink/70">{text}</p></div>; }

function ScheduleView() { return <div className="mt-6 rounded-3xl bg-ivory p-6 ring-1 ring-ink/5"><div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-semibold">Tuesday, 14 May</h2><p className="text-xs text-mist">3 classes · 2 deadlines · 1 study group</p></div><CalendarDays className="size-5 text-cobalt" /></div><div className="mt-5 grid gap-3">{["09:00 · Linear Algebra — Lecture 12 · Hall B4", "11:00 · Data Structures Lab · Comp Lab 2", "14:00 · Statistics — Tutorial · Room 210", "16:00 · Study group · Finals prep · Library Loft"].map((item, index) => <div key={item} className="flex items-center gap-4 rounded-2xl bg-ink/3 p-4 ring-1 ring-ink/5"><span className={`grid size-10 place-items-center rounded-xl bg-${["cobalt", "mint", "gold", "coral"][index]}/15 text-xs font-semibold text-${["cobalt", "mint", "gold", "coral"][index]}`}>{String(index + 1).padStart(2, "0")}</span><p className="text-sm font-medium">{item}</p><ChevronRight className="ml-auto size-4 text-mist" /></div>)}</div></div>; }
function AssignmentsView({ assignments, onComplete }: { assignments: Assignment[]; onComplete: (title: string) => void }) { return <div className="mt-6 rounded-3xl bg-ivory p-6 ring-1 ring-ink/5"><div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-semibold">Assignment queue</h2><p className="text-xs text-mist">Track progress without losing the thread.</p></div><Button size="sm" onClick={() => toast.success("New assignment draft started")}>+ Add task</Button></div><div className="mt-5 overflow-x-auto"><div className="min-w-[620px] divide-y divide-ink/5">{assignments.map((item) => <div key={item.title} className="grid grid-cols-[1.3fr_1.6fr_1fr_100px] items-center gap-4 py-4 text-sm"><span className="font-medium">{item.subject}</span><span>{item.title}</span><span className="text-xs text-mist">{item.due_label}</span>{item.status === "completed" || item.status === "submitted" ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-mint-deep"><Check className="size-3.5" /> {item.status}</span> : <Button variant="outline" size="sm" onClick={() => onComplete(item.title)}>Mark done</Button>}</div>)}</div></div></div>; }
function AttendanceView({ attendance }: { attendance: Attendance[] }) { const total = attendance.reduce((sum, item) => sum + item.attended_count, 0); const sessions = attendance.reduce((sum, item) => sum + item.total_count, 0); return <div className="mt-6 grid gap-4 lg:grid-cols-12"><section className="rounded-3xl bg-gradient-to-br from-charcoal to-ink p-6 text-ivory ring-1 ring-ivory/10 lg:col-span-5"><p className="text-xs uppercase tracking-[0.16em] text-mint/80">Overall attendance</p><p className="mt-4 font-display text-6xl font-semibold">{Math.round((total / sessions) * 100)}%</p><p className="mt-2 text-sm text-ivory/60">{total} of {sessions} sessions present</p><div className="mt-8 h-2 rounded-full bg-ivory/15"><div className="h-full w-[92%] rounded-full bg-gradient-to-r from-lime to-mint" /></div><p className="mt-3 text-xs text-ivory/50">You are 4 points above the campus baseline.</p></section><section className="rounded-3xl bg-ivory p-6 ring-1 ring-ink/5 lg:col-span-7"><h2 className="font-display text-lg font-semibold">Subject breakdown</h2><div className="mt-5 space-y-4">{attendance.map((item) => { const percent = Math.round((item.attended_count / item.total_count) * 100); return <div key={item.subject}><div className="flex justify-between text-sm"><span className="font-medium">{item.subject}</span><span className={percent < 90 ? "text-coral" : "text-mint-deep"}>{percent}% · {item.trend_label}</span></div><div className="mt-2 h-2 rounded-full bg-ink/6"><div className={`h-full rounded-full ${percent < 90 ? "bg-gradient-to-r from-coral to-gold" : "bg-gradient-to-r from-cobalt to-mint"}`} style={{ width: `${percent}%` }} /></div></div>; })}</div></section></div>; }
function AnalyticsView({ attendance, assignments }: { attendance: Attendance[]; assignments: Assignment[] }) { return <div className="mt-6 grid gap-4 md:grid-cols-2"><section className="rounded-3xl bg-ivory p-6 ring-1 ring-ink/5"><div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-semibold">Momentum this term</h2><p className="text-xs text-mist">Weekly academic health signal</p></div><Activity className="size-5 text-cobalt" /></div><div className="mt-7 flex h-40 items-end gap-3">{[42, 55, 51, 68, 62, 76, 82].map((height, index) => <div key={height + index} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-xl bg-gradient-to-t from-cobalt to-mint" style={{ height: `${height}%` }} /><span className="text-[10px] text-mist">W{index + 5}</span></div>)}</div></section><section className="rounded-3xl bg-ivory p-6 ring-1 ring-ink/5"><h2 className="font-display text-lg font-semibold">What moved</h2><div className="mt-5 space-y-3"><div className="flex items-center justify-between rounded-2xl bg-mint/10 p-4"><span className="text-sm">Attendance consistency</span><span className="font-display text-lg font-semibold text-mint-deep">+4%</span></div><div className="flex items-center justify-between rounded-2xl bg-cobalt/10 p-4"><span className="text-sm">Tasks completed</span><span className="font-display text-lg font-semibold text-cobalt">{assignments.filter((item) => item.status !== "pending").length}/3</span></div><div className="flex items-center justify-between rounded-2xl bg-coral/10 p-4"><span className="text-sm">Subject to watch</span><span className="font-display text-lg font-semibold text-coral">Statistics</span></div></div></section></div>; }
function AiStudioView({ onOpenChat }: { onOpenChat: () => void }) { return <div className="mt-6 grid gap-4 lg:grid-cols-12"><section className="rounded-3xl bg-gradient-to-br from-cobalt to-mint p-7 text-ivory ring-1 ring-ivory/30 lg:col-span-7"><Sparkles className="size-6 text-lime" /><h2 className="mt-6 max-w-[14ch] font-display text-3xl font-semibold">A quieter way to study.</h2><p className="mt-3 max-w-[42ch] text-sm leading-relaxed text-ivory/80">Campus AI uses your schedule and recent progress to shape small, realistic next steps — not high-stakes predictions.</p><Button onClick={onOpenChat} className="mt-7 rounded-full bg-lime text-ink hover:bg-lime/90">Open Campus AI <ArrowUpRight className="size-4" /></Button></section><section className="rounded-3xl bg-ivory p-6 ring-1 ring-ink/5 lg:col-span-5"><h2 className="font-display text-lg font-semibold">Ready for you</h2><div className="mt-4 space-y-3"><AiTask title="Adaptive quiz · Graph theory" detail="8 questions · 12 minutes" tone="cobalt" /><AiTask title="Revision block · BFS traversal" detail="25 minutes · today at 16:00" tone="mint" /><AiTask title="Ask about your attendance" detail="See the subjects worth watching" tone="gold" /></div></section></div>; }
function AiTask({ title, detail, tone }: { title: string; detail: string; tone: string }) { return <div className="flex items-center gap-3 rounded-2xl bg-ink/3 p-3 ring-1 ring-ink/5"><span className={`grid size-9 place-items-center rounded-xl bg-${tone}/15 text-${tone}`}><Sparkles className="size-4" /></span><div><p className="text-sm font-medium">{title}</p><p className="text-[11px] text-mist">{detail}</p></div><ChevronRight className="ml-auto size-4 text-mist" /></div>; }
function EventsView({ events }: { events: EventItem[] }) { return <div className="mt-6 grid gap-4 md:grid-cols-3">{events.map((event, index) => <section key={event.title} className="overflow-hidden rounded-3xl bg-ivory ring-1 ring-ink/5"><div className={`h-2 bg-${["cobalt", "mint", "coral"][index]}`} /><div className="p-6"><div className="flex items-center justify-between"><span className="rounded-full bg-cobalt/10 px-2.5 py-1 text-[11px] font-medium text-cobalt">{event.category}</span><CalendarDays className="size-4 text-mist" /></div><h2 className="mt-5 font-display text-xl font-semibold">{event.title}</h2><p className="mt-2 text-sm text-mist">{event.location} · {event.event_time}</p><p className="mt-1 text-xs text-mist">{event.attendees_label}</p><Button variant="outline" className="mt-6 w-full" onClick={() => toast.success("Event saved to your calendar", { description: event.title })}>Register interest</Button></div></section>)}</div>; }
function SupportView({ onOpenAi }: { onOpenAi: () => void }) { return <div className="mt-6 grid gap-4 md:grid-cols-3"><SupportCard icon={<MessageCircle />} title="Campus AI" detail="Ask how to submit a complaint or find the right service." action="Ask now" onClick={onOpenAi} tone="cobalt" /><SupportCard icon={<AlertTriangle />} title="Submit a complaint" detail="Infrastructure, hostel, academics, IT, library, or transport." action="Start report" onClick={() => toast.success("Complaint draft started")} tone="coral" /><SupportCard icon={<Search />} title="Lost & found" detail="Search recent reports or create a new item match." action="Browse items" onClick={() => toast.success("Lost & found is ready to explore")} tone="mint" /></div>; }
function SupportCard({ icon, title, detail, action, onClick, tone }: { icon: React.ReactNode; title: string; detail: string; action: string; onClick: () => void; tone: string }) { return <section className="rounded-3xl bg-ivory p-6 ring-1 ring-ink/5"><div className={`grid size-11 place-items-center rounded-2xl bg-${tone}/15 text-${tone}`}>{icon}</div><h2 className="mt-5 font-display text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-mist">{detail}</p><Button variant="outline" className="mt-6" onClick={onClick}>{action} <ChevronRight className="size-4" /></Button></section>; }

function MobileNav({ activeView, onSelect, onOpenAi }: { activeView: ViewKey; onSelect: (view: ViewKey) => void; onOpenAi: () => void }) { return <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-ink/5 bg-ivory/90 px-2 py-2 backdrop-blur-sm lg:hidden"><button onClick={() => onSelect("overview")} className={`flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 ${activeView === "overview" ? "bg-cobalt/10 text-cobalt" : "text-ink/50"}`}><LayoutDashboard className="size-5" /><span className="text-[10px] font-medium">Home</span></button><button onClick={() => onSelect("schedule")} className="flex flex-col items-center gap-1 px-4 py-1.5 text-ink/50"><CalendarDays className="size-5" /><span className="text-[10px] font-medium">Schedule</span></button><button onClick={onOpenAi} className="pulse-ai -mt-6 grid size-14 place-items-center rounded-full bg-gradient-to-br from-cobalt via-mint to-lime text-ink shadow-lg ring-4 ring-parchment"><Sparkles className="size-6" /></button><button onClick={() => onSelect("assignments")} className="flex flex-col items-center gap-1 px-4 py-1.5 text-ink/50"><FileText className="size-5" /><span className="text-[10px] font-medium">Tasks</span></button><button onClick={() => onSelect("events")} className="flex flex-col items-center gap-1 px-4 py-1.5 text-ink/50"><MoreHorizontal className="size-5" /><span className="text-[10px] font-medium">More</span></button></nav>; }
function MobileMenu({ activeView, onSelect, onClose }: { activeView: ViewKey; onSelect: (view: ViewKey) => void; onClose: () => void }) { return <div className="fixed inset-0 z-50 bg-charcoal/30 lg:hidden"><div className="h-full w-[82%] max-w-sm bg-ivory p-5 shadow-2xl"><div className="flex items-center justify-between"><Brand /><button onClick={onClose} className="grid size-9 place-items-center rounded-xl bg-ink/5" aria-label="Close navigation"><X className="size-4" /></button></div><div className="mt-3 space-y-1">{navGroups.flatMap((group) => group.items).map((item) => { const Icon = item.icon; return <button key={item.key} onClick={() => onSelect(item.key)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm ${activeView === item.key ? "bg-cobalt/10 font-medium text-cobalt" : "text-ink/70"}`}><Icon className="size-4" />{item.label}</button>; })}</div></div></div>; }
function AiAssistant({ onClose }: { onClose: () => void }) { const [message, setMessage] = useState(""); const [messages, setMessages] = useState([{ from: "ai", text: "Good afternoon, Maya. I can help you plan, prioritize, or find something on campus." }]); const send = () => { if (!message.trim()) return; const text = message.trim(); setMessages((current) => [...current, { from: "you", text }, { from: "ai", text: "I found that in your workspace. Start with the 25-minute Graph Theory block at 16:00, then revisit the Statistics problem set." }]); setMessage(""); }; return <div className="fixed inset-0 z-50 flex items-end justify-end bg-charcoal/25 p-3 sm:p-6"><section className="flex h-[min(720px,calc(100vh-24px))] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-ivory shadow-2xl ring-1 ring-ink/10"><header className="flex items-center justify-between bg-gradient-to-r from-cobalt to-mint p-5 text-ivory"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-lime text-ink"><Sparkles className="size-5" /></span><div><p className="font-display text-lg font-semibold">Campus AI</p><p className="text-xs text-ivory/70">Private to your workspace</p></div></div><button onClick={onClose} className="grid size-9 place-items-center rounded-xl bg-ivory/15" aria-label="Close assistant"><X className="size-4" /></button></header><div className="flex-1 space-y-3 overflow-y-auto p-4">{messages.map((item, index) => <div key={`${item.text}-${index}`} className={`flex ${item.from === "you" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${item.from === "you" ? "bg-cobalt text-ivory" : "bg-ink/5 text-ink/80"}`}>{item.text}</div></div>)}<div className="flex flex-wrap gap-2 pt-2"><button onClick={() => setMessage("What assignments are pending?")} className="rounded-full bg-cobalt/10 px-3 py-1.5 text-xs font-medium text-cobalt">Pending assignments</button><button onClick={() => setMessage("What classes do I have today?")} className="rounded-full bg-mint/15 px-3 py-1.5 text-xs font-medium text-mint-deep">Today's classes</button></div></div><div className="border-t border-ink/5 p-3"><div className="flex gap-2"><Input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") send(); }} placeholder="Ask Campus AI…" className="h-11 rounded-xl bg-ink/3" /><Button onClick={send} size="icon" className="h-11 w-11 rounded-xl bg-cobalt hover:bg-cobalt/90" aria-label="Send message"><ArrowUpRight className="size-4" /></Button></div></div></section></div>; }

function capitalize(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }