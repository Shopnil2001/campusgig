"use client";

export const dynamic = "force-dynamic";

import React, { Component, FormEvent, ReactNode, useEffect, useState } from "react";

// Robust Error Boundary to guarantee Vercel / Client never crashes
interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("CampusGigs Error Boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "60px 20px", textAlign: "center", maxWidth: "600px", margin: "40px auto", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}>
          <span style={{ fontSize: "42px", display: "block", marginBottom: "12px" }}>⚠️</span>
          <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>Workspace refreshed</h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>An unexpected render issue occurred while loading this view.</p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            style={{ background: "#f97316", color: "#fff", border: 0, padding: "10px 20px", borderRadius: "8px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

type User = {
  user_id: number;
  name: string;
  email: string;
  department: string;
  batch: number;
  role_flag: "student" | "admin";
  avatar_color: string;
  skills?: Skill[];
  average_rating?: number;
  completed_gigs?: number;
  reviews?: Review[];
};

type Skill = { skill_id: number; skill_name: string; category: string };

type Gig = {
  gig_id: number;
  title: string;
  description: string;
  budget: string;
  deadline: string;
  status: string;
  client_id: number;
  client_name: string;
  department: string;
  bid_count: number;
  skills: string | null;
  accepted_freelancer_id?: number;
  accepted_freelancer_name?: string;
  accepted_freelancer_email?: string;
};

type Bid = {
  bid_id: number;
  gig_id: number;
  freelancer_id: number;
  freelancer_name: string;
  freelancer_rating?: string | number;
  department: string;
  proposed_price: string;
  message: string;
  status: string;
  avatar_color: string;
  gig_title?: string;
  gig_budget?: string;
  gig_status?: string;
  client_name?: string;
};

type Transaction = {
  transaction_id: number;
  gig_id: number;
  amount: string;
  payment_status: "Pending" | "Paid" | "Refunded";
  completed_at: string;
  gig_title: string;
  client_name: string;
  client_id: number;
  freelancer_name?: string;
  freelancer_id?: number;
};

type Dispute = {
  dispute_id: number;
  gig_id: number;
  title: string;
  raised_by: number;
  raised_by_name: string;
  reason: string;
  status: string;
  resolution?: string;
  resolved_at?: string;
};

type TopFreelancer = {
  user_id: number;
  name: string;
  department: string;
  avatar_color?: string;
  completed_gigs: number;
  average_rating: string | number;
};

type Review = {
  review_id?: number;
  rating: number;
  comment: string;
  reviewer_name: string;
  created_at?: string;
};

const API = process.env.NEXT_PUBLIC_API_URL || "https://campusgig-tyeh.onrender.com";

const demoUsers: User[] = [
  { user_id: 1, name: "Aisha Rahman", email: "aisha@campus.edu", department: "Computer Science", batch: 2026, role_flag: "student", avatar_color: "coral" },
  { user_id: 2, name: "Rafi Hasan", email: "rafi@campus.edu", department: "Electrical Engineering", batch: 2027, role_flag: "student", avatar_color: "blue" },
  { user_id: 3, name: "Nadia Karim", email: "nadia@campus.edu", department: "Business Administration", batch: 2026, role_flag: "student", avatar_color: "mint" },
  { user_id: 4, name: "CampusGigs Admin", email: "admin@campus.edu", department: "Administration", batch: 2026, role_flag: "admin", avatar_color: "navy" },
];

const demoSkills: Skill[] = [
  { skill_id: 1, skill_name: "Web Development", category: "Technology" },
  { skill_id: 2, skill_name: "Graphic Design", category: "Creative" },
  { skill_id: 3, skill_name: "Mathematics Tutoring", category: "Academic" },
  { skill_id: 4, skill_name: "Photography", category: "Creative" },
  { skill_id: 5, skill_name: "Video Editing", category: "Creative" },
  { skill_id: 6, skill_name: "Circuit Repair", category: "Technical" },
  { skill_id: 7, skill_name: "Content Writing", category: "Writing" },
  { skill_id: 8, skill_name: "Excel & Data", category: "Business" },
];

const demoGigs: Gig[] = [
  { gig_id: 1, title: "Design a student club launch poster", description: "We need a bold, print-ready poster for our fall orientation event. Include editable source files.", budget: "35.00", deadline: "Aug 18, 2026", status: "Open", client_id: 2, client_name: "Rafi Hasan", department: "Electrical Engineering", bid_count: 1, skills: "Graphic Design" },
  { gig_id: 2, title: "Build a responsive portfolio landing page", description: "Looking for a frontend developer to turn our Figma direction into a polished one-page site.", budget: "180.00", deadline: "Aug 28, 2026", status: "Open", client_id: 1, client_name: "Aisha Rahman", department: "Computer Science", bid_count: 1, skills: "Graphic Design, Web Development" },
  { gig_id: 3, title: "Photograph our campus society event", description: "Two hours of event coverage with 30 edited photos delivered within one week.", budget: "75.00", deadline: "Aug 15, 2026", status: "In Progress", client_id: 3, client_name: "Nadia Karim", department: "Business Administration", bid_count: 1, skills: "Photography" },
];

function getInitials(name?: string): string {
  if (!name) return "CG";
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function safeLower(str?: string): string {
  return (str || "").toLowerCase();
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [gigs, setGigs] = useState<Gig[]>(demoGigs);
  const [myGigs, setMyGigs] = useState<Gig[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [skills, setSkills] = useState<Skill[]>(demoSkills);
  const [stats, setStats] = useState({ total: 12, open_count: 8, completed_count: 4, completion_rate: 33 });
  const [view, setView] = useState<"Discover" | "Top Freelancers" | "My gigs" | "My bids" | "Transactions" | "Admin" | "Profile">("Discover");
  const [status, setStatus] = useState("Open");
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState(0);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [gigReviews, setGigReviews] = useState<Review[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [topFreelancers, setTopFreelancers] = useState<TopFreelancer[]>([]);
  const [modal, setModal] = useState<"post" | "edit" | "bid" | "profile" | "skills" | "review" | "dispute" | "login" | "register" | null>(null);
  const [reviewGig, setReviewGig] = useState<Gig | null>(null);
  const [disputeGig, setDisputeGig] = useState<Gig | null>(null);
  const [editingGig, setEditingGig] = useState<Gig | null>(null);
  const [rating, setRating] = useState(5);
  const [notice, setNotice] = useState("");
  const [connected, setConnected] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Global & Form Loading States
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Restore session from localStorage on initial mount
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("campusgigs_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.user_id) {
          setUser(parsed);
          void loadUserData(parsed.user_id);
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  function handleSetUser(u: User | null) {
    setUser(u);
    if (u) {
      localStorage.setItem("campusgigs_user", JSON.stringify(u));
      void loadUserData(u.user_id);
    } else {
      localStorage.removeItem("campusgigs_user");
      setMyGigs([]);
      setMyBids([]);
      setTransactions([]);
    }
  }

  async function loadGigs() {
    try {
      const response = await fetch(`${API}/index.php?action=dashboard&status=All`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (Array.isArray(data.gigs)) setGigs(data.gigs);
      if (Array.isArray(data.skills)) setSkills(data.skills);
      if (data.stats) {
        setStats({
          total: Number(data.stats.total || 0),
          open_count: Number(data.stats.open_count || 0),
          completed_count: Number(data.stats.completed_count || 0),
          completion_rate: Number(data.stats.completion_rate || 0),
        });
      }
      setConnected(true);
    } catch {
      // Keep existing gigs in case network is offline
    }
  }

  async function loadTopFreelancers() {
    try {
      const res = await fetch(`${API}/index.php?action=top_freelancers`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.top_freelancers)) {
          setTopFreelancers(data.top_freelancers);
        }
      }
    } catch {
      // Fallback
    }
  }

  useEffect(() => {
    if (mounted) {
      void loadGigs();
      void loadTopFreelancers();
    }
  }, [mounted]);

  async function loadUserData(targetUserId?: number) {
    const activeId = targetUserId || user?.user_id;
    if (!activeId) return;

    try {
      const myGigsRes = await fetch(`${API}/index.php?action=my_gigs&user_id=${activeId}`);
      if (myGigsRes.ok) {
        const data = await myGigsRes.json();
        if (Array.isArray(data.gigs)) setMyGigs(data.gigs);
      }

      const myBidsRes = await fetch(`${API}/index.php?action=my_bids&user_id=${activeId}`);
      if (myBidsRes.ok) {
        const data = await myBidsRes.json();
        if (Array.isArray(data.bids)) setMyBids(data.bids);
      }

      const txRes = await fetch(`${API}/index.php?action=transactions&user_id=${activeId}`);
      if (txRes.ok) {
        const data = await txRes.json();
        if (Array.isArray(data.transactions)) setTransactions(data.transactions);
      }

      const meRes = await fetch(`${API}/index.php?action=me&user_id=${activeId}`);
      if (meRes.ok) {
        const data = await meRes.json();
        if (data.user) {
          setUser((prev) => (prev ? { ...prev, ...data.user } : data.user));
          localStorage.setItem("campusgigs_user", JSON.stringify(data.user));
        }
      }

      if (user?.role_flag === "admin") {
        const adminRes = await fetch(`${API}/index.php?action=admin&user_id=${activeId}`);
        if (adminRes.ok) {
          const data = await adminRes.json();
          if (Array.isArray(data.disputes)) setDisputes(data.disputes);
          if (Array.isArray(data.top_freelancers)) setTopFreelancers(data.top_freelancers);
        }
      }
    } catch {
      // Ignored
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadGigs();
    }, 200);
    return () => window.clearTimeout(timer);
  }, [status, skillFilter, search]);

  useEffect(() => {
    if (view === "Top Freelancers" || view === "Admin") {
      void loadTopFreelancers();
    }
    if (view !== "Discover" && user?.user_id) {
      void loadUserData(user.user_id);
    }
  }, [view, user?.user_id]);

  async function request(action: string, body?: Record<string, unknown>, loadingMsg?: string) {
    if (!user && (action === "create_gig" || action === "create_bid" || action === "review" || action === "dispute" || action === "update_skills" || action === "create_skill")) {
      setModal("login");
      showNotice("Please sign in to perform this action.");
      return null;
    }

    setLoadingAction(loadingMsg || "Processing request...");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API}/index.php?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, user_id: user?.user_id }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || `Action failed: ${action}`);
      }

      showNotice(data.message || "Operation completed successfully.");
      await loadGigs();
      await loadTopFreelancers();
      if (user?.user_id) {
        await loadUserData(user.user_id);
      }

      if (selectedGig) {
        await openGig(selectedGig);
      }

      setModal(null);
      return data;
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Action failed. Please try again.");
      return null;
    } finally {
      setLoadingAction(null);
      setIsSubmitting(false);
    }
  }

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }

  async function openGig(gig: Gig) {
    const initialGig: Gig = {
      ...gig,
      client_id: gig.client_id || user?.user_id || 0,
      client_name: gig.client_name || user?.name || "Campus Client",
      department: gig.department || user?.department || "",
    };
    setSelectedGig(initialGig);
    try {
      const activeId = user?.user_id || 0;
      const response = await fetch(`${API}/index.php?action=gig&gig_id=${gig.gig_id}&user_id=${activeId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.gig) {
          setSelectedGig({
            ...initialGig,
            ...data.gig,
            skills: data.gig.skills || initialGig.skills,
          });
        }
        if (Array.isArray(data.bids)) {
          setBids(data.bids);
        } else {
          setBids([]);
        }
        if (Array.isArray(data.reviews)) setGigReviews(data.reviews);
      }
    } catch {
      setBids([]);
    }
  }

  async function submitLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").toLowerCase().trim();
    const password = String(form.get("password") || "");

    setIsSubmitting(true);
    setLoadingAction("Signing you in...");

    try {
      const res = await fetch(`${API}/index.php?action=login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Invalid email or password");
      }
      handleSetUser(data.user);
      setModal(null);
      showNotice(`Welcome back, ${data.user.name}!`);
    } catch (err) {
      // Fallback for offline demo accounts
      const matchedDemo = demoUsers.find((u) => u.email.toLowerCase() === email);
      if (matchedDemo && (password === "password" || !connected)) {
        handleSetUser(matchedDemo);
        setModal(null);
        showNotice(`Signed in as demo profile: ${matchedDemo.name}`);
      } else {
        showNotice(err instanceof Error ? err.message : "Sign in failed.");
      }
    } finally {
      setIsSubmitting(false);
      setLoadingAction(null);
    }
  }

  async function submitRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const selectedSkillIds = form.getAll("skills").map(Number);
    const payload = {
      name: String(form.get("name") || "").trim(),
      email: String(form.get("email") || "").trim(),
      password: String(form.get("password") || ""),
      department: String(form.get("department") || "").trim(),
      batch: Number(form.get("batch") || 2026),
      role_flag: String(form.get("role_flag") || "student"),
      skills: selectedSkillIds,
    };

    setIsSubmitting(true);
    setLoadingAction("Creating your student account...");

    try {
      const res = await fetch(`${API}/index.php?action=register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Registration failed");
      }
      handleSetUser(data.user);
      setModal(null);
      showNotice(`Account registered! Welcome to CampusGigs, ${data.user.name}.`);
    } catch (err) {
      showNotice(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
      setLoadingAction(null);
    }
  }

  async function submitCreateGig(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const skillIds = form.getAll("skills").map(Number);

    const payload = {
      title: String(form.get("title") || ""),
      description: String(form.get("description") || ""),
      budget: String(form.get("budget") || ""),
      deadline: String(form.get("deadline") || ""),
      skills: skillIds,
    };

    await request("create_gig", payload, "Publishing your gig...");
  }

  async function submitEditGig(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingGig) return;
    const form = new FormData(e.currentTarget);
    const skillIds = form.getAll("skills").map(Number);
    const payload = {
      gig_id: editingGig.gig_id,
      title: String(form.get("title") || ""),
      description: String(form.get("description") || ""),
      budget: String(form.get("budget") || ""),
      deadline: String(form.get("deadline") || ""),
      skills: skillIds,
    };

    await request("edit_gig", payload, "Saving gig changes...");
    setEditingGig(null);
  }

  async function handleDeleteGig(gigId: number) {
    if (!confirm("Are you sure you want to delete this gig?")) return;
    await request("delete_gig", { gig_id: gigId }, "Deleting gig...");
  }

  async function submitBid(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedGig) return;
    const form = new FormData(e.currentTarget);
    const payload = {
      gig_id: selectedGig.gig_id,
      proposed_price: String(form.get("proposed_price") || ""),
      message: String(form.get("message") || ""),
    };

    await request("create_bid", payload, "Submitting your proposal...");
  }

  async function handleDeleteBid(bidId: number) {
    if (!confirm("Are you sure you want to withdraw this proposal?")) return;
    await request("delete_bid", { bid_id: bidId }, "Withdrawing proposal...");
  }

  async function submitReview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!reviewGig || !user) return;
    const form = new FormData(e.currentTarget);
    const isClient = reviewGig.client_id === user.user_id;
    const targetRevieweeId = isClient ? reviewGig.accepted_freelancer_id : reviewGig.client_id;

    const payload = {
      gig_id: reviewGig.gig_id,
      reviewee_id: targetRevieweeId,
      rating: rating,
      comment: String(form.get("comment") || ""),
    };

    await request("review", payload, "Publishing review...");
    setReviewGig(null);
  }

  async function submitDispute(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!disputeGig) return;
    const form = new FormData(e.currentTarget);
    const payload = {
      gig_id: disputeGig.gig_id,
      reason: String(form.get("reason") || ""),
    };

    await request("dispute", payload, "Filing dispute with administration...");
    setDisputeGig(null);
  }

  async function submitSkills(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const selectedSkills = form.getAll("skills").map(Number);
    await request("update_skills", { skills: selectedSkills }, "Saving your skills profile...");
    setModal(null);
  }

  async function submitAddSkill(skillName: string, category: string) {
    const res = await request("create_skill", { skill_name: skillName, category }, "Adding new skill category...");
    if (res && Array.isArray((res as { skills?: Skill[] }).skills)) {
      setSkills((res as { skills: Skill[] }).skills);
    }
  }

  function quickSwitchUser(target: User) {
    handleSetUser(target);
    setShowSwitcher(false);
    showNotice(`Switched to active profile: ${target.name} (${target.role_flag})`);
  }

  const filteredGigs = (gigs || []).filter((gig) => {
    if (!gig) return false;
    const matchesStatus = status === "All" || gig.status === status;
    const matchesSkill =
      skillFilter === 0 ||
      (gig.skills && gig.skills.toLowerCase().includes((skills.find((s) => s.skill_id === skillFilter)?.skill_name || "").toLowerCase()));
    const matchesSearch =
      !search ||
      (gig.title && gig.title.toLowerCase().includes(search.toLowerCase())) ||
      (gig.description && gig.description.toLowerCase().includes(search.toLowerCase())) ||
      (gig.department && gig.department.toLowerCase().includes(search.toLowerCase()));

    return matchesStatus && (matchesSkill || skillFilter === 0) && matchesSearch;
  });

  const myProposalForSelectedGig = user && selectedGig
    ? (bids || []).find((b) => b.freelancer_id === user.user_id)
    : null;

  return (
    <ErrorBoundary>
      <main className="campus-shell">
        <aside className="campus-sidebar">
          <div className="cg-brand">
            <span>🎓</span>
            <div>
              CampusGigs<span>.</span>
              <small>UNIVERSITY MARKETPLACE</small>
            </div>
          </div>

          <nav className="campus-nav">
            <p>MAIN NAVIGATION</p>
            <button
              className={view === "Discover" ? "campus-nav-link active" : "campus-nav-link"}
              onClick={() => setView("Discover")}
            >
              <span>❖</span> Discover Gigs <b>{gigs.length}</b>
            </button>

            <button
              className={view === "Top Freelancers" ? "campus-nav-link active" : "campus-nav-link"}
              onClick={() => setView("Top Freelancers")}
            >
              <span>🏆</span> Top Freelancers <b>{topFreelancers.length || 5}</b>
            </button>

            <p className="nav-spacer">MY WORKSPACE</p>
            <button
              className={view === "My gigs" ? "campus-nav-link active" : "campus-nav-link"}
              onClick={() => setView("My gigs")}
            >
              <span>✦</span> My Gigs <b>{user ? (myGigs.length || (gigs || []).filter((g) => g.client_id === user.user_id).length) : 0}</b>
            </button>

            <button
              className={view === "My bids" ? "campus-nav-link active" : "campus-nav-link"}
              onClick={() => setView("My bids")}
            >
              <span>◇</span> My Proposals <b>{user ? myBids.length : 0}</b>
            </button>

            <button
              className={view === "Transactions" ? "campus-nav-link active" : "campus-nav-link"}
              onClick={() => setView("Transactions")}
            >
              <span>💳</span> Transactions <b>{user ? transactions.length : 0}</b>
            </button>

            {user?.role_flag === "admin" && (
              <button
                className={view === "Admin" ? "campus-nav-link active" : "campus-nav-link"}
                onClick={() => setView("Admin")}
              >
                <span>⚖</span> Admin Panel <b>{disputes.length}</b>
              </button>
            )}

            <button
              className={view === "Profile" ? "campus-nav-link active" : "campus-nav-link"}
              onClick={() => setView("Profile")}
            >
              <span>👤</span> Student Profile
            </button>
          </nav>

          <div className="campus-side-footer">
            {user ? (
              <>
                <div className={`campus-avatar ${user.avatar_color}`}>{getInitials(user.name)}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</strong>
                  <small style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.department}</small>
                </div>
                <button
                  onClick={() => {
                    handleSetUser(null);
                    showNotice("Signed out successfully.");
                  }}
                  title="Sign Out"
                  style={{ background: "none", border: 0, color: "#94a3b8", cursor: "pointer", fontSize: "12px", padding: "4px" }}
                >
                  🚪
                </button>
              </>
            ) : (
              <button
                className="action-btn primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => setModal("login")}
              >
                Sign In <span>→</span>
              </button>
            )}
          </div>
        </aside>

        <section className="campus-content">
          <header className="campus-header">
            <div className="campus-search">
              <span>🔍</span>
              <input
                placeholder="Search gigs, skills, departments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{ background: "none", border: 0, color: "var(--muted)", cursor: "pointer", fontSize: "14px" }}
                >
                  ×
                </button>
              )}
            </div>

            <div className="header-actions">
              <button
                className="post-button"
                onClick={() => (user ? setModal("post") : setModal("login"))}
              >
                + Post a Gig
              </button>

              <div className="user-switcher-wrap">
                {user ? (
                  <button
                    className="user-badge-btn"
                    onClick={() => setShowSwitcher(!showSwitcher)}
                  >
                    <div className={`small-avatar ${user.avatar_color}`}>{getInitials(user.name)}</div>
                    <div>
                      <strong>{user.name}</strong>
                      <small>{user.role_flag.toUpperCase()}</small>
                    </div>
                    <span style={{ fontSize: "10px", color: "var(--muted)" }}>▾</span>
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="action-btn"
                      onClick={() => setModal("login")}
                    >
                      Sign In
                    </button>
                    <button
                      className="action-btn primary"
                      onClick={() => setModal("register")}
                    >
                      Join
                    </button>
                  </div>
                )}

                {showSwitcher && (
                  <div className="switcher-menu">
                    <div className="switcher-header">SWITCH TEST ACCOUNT</div>
                    {demoUsers.map((du) => (
                      <button
                        key={du.user_id}
                        className={user?.user_id === du.user_id ? "switcher-item active" : "switcher-item"}
                        onClick={() => quickSwitchUser(du)}
                      >
                        <div className={`small-avatar ${du.avatar_color}`}>{getInitials(du.name)}</div>
                        <div>
                          <strong>{du.name}</strong>
                          <small>{du.department}</small>
                        </div>
                        <span className={`role-badge ${du.role_flag}`}>{du.role_flag}</span>
                      </button>
                    ))}
                    <div style={{ borderTop: "1px solid var(--line)", marginTop: "6px", paddingTop: "4px" }}>
                      <button
                        className="switcher-item"
                        style={{ color: "#dc2626" }}
                        onClick={() => {
                          handleSetUser(null);
                          setShowSwitcher(false);
                          showNotice("Signed out.");
                        }}
                      >
                        <span style={{ fontSize: "14px" }}>🚪</span>
                        <strong>Sign Out</strong>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div className="campus-main">
            {view === "Discover" && (
              <>
                {!user && (
                  <div className="guest-hero-banner">
                    <div>
                      <h2>University Freelance Marketplace</h2>
                      <p>Connect with talented peers on campus for projects, design, tutoring, and technical tasks.</p>
                    </div>
                    <div className="guest-actions">
                      <button className="action-btn primary" onClick={() => setModal("register")}>
                        Create Account
                      </button>
                      <button className="action-btn secondary" onClick={() => setModal("login")}>
                        Sign In
                      </button>
                    </div>
                  </div>
                )}

                <div className="hero-row">
                  <div>
                    <p className="overline">
                      CAMPUS CONNECTIVITY ·
                      <span className={connected ? "online" : "offline"}>
                        {connected ? " LIVE DATABASE CONNECTED" : " LOCAL RESILIENCE ACTIVE"}
                      </span>
                    </p>
                    <h1>
                      Your campus. <em>Your market.</em>
                    </h1>
                    <p className="hero-copy">
                      Hire student talent or earn cash by completing gigs right here at university.
                    </p>
                  </div>
                </div>

                <div className="market-stats">
                  <div>
                    <span>ACTIVE GIGS</span>
                    <strong>{stats.open_count}</strong>
                    <small>Open for proposals</small>
                  </div>
                  <div>
                    <span>TOTAL LISTED</span>
                    <strong>{stats.total}</strong>
                    <small>All time listings</small>
                  </div>
                  <div>
                    <span>COMPLETED</span>
                    <strong>{stats.completed_count}</strong>
                    <small>{stats.completion_rate}% completion rate</small>
                  </div>
                  <div className="stats-art">
                    <span>✦</span>
                    <span>✧</span>
                    <span>★</span>
                  </div>
                </div>

                <div className="browse-heading">
                  <div>
                    <h2>Browse Opportunities</h2>
                    <p>Filter by skill requirements, status, or search for specialized projects.</p>
                  </div>
                </div>

                <div className="browse-controls">
                  <div className="status-tabs">
                    {["All", "Open", "In Progress", "Completed"].map((tab) => (
                      <button
                        key={tab}
                        className={status === tab ? "selected" : ""}
                        onClick={() => setStatus(tab)}
                      >
                        {tab} Gigs
                      </button>
                    ))}
                  </div>

                  <select
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(Number(e.target.value))}
                  >
                    <option value={0}>All Skill Categories</option>
                    {(skills || []).map((s) => (
                      <option key={s.skill_id} value={s.skill_id}>
                        {s.skill_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="gig-grid">
                  {filteredGigs.length > 0 ? (
                    filteredGigs.map((gig) => (
                      <div
                        className="gig-card"
                        key={gig.gig_id}
                        onClick={() => openGig(gig)}
                      >
                        <div className="gig-card-top">
                          <span className={`gig-symbol ${gig.department.includes("Computer") ? "blue" : gig.department.includes("Business") ? "mint" : "coral"}`}>
                            ✦
                          </span>
                          <span className={`gig-status ${safeLower(gig.status).replace(/\s+/g, "-")}`}>
                            <i /> {gig.status}
                          </span>
                        </div>

                        <h3>{gig.title}</h3>
                        <p>{gig.description}</p>

                        <div className="tag-row">
                          {(gig.skills || "General")
                            .split(",")
                            .map((tag) => tag.trim())
                            .filter(Boolean)
                            .slice(0, 3)
                            .map((tag, idx) => (
                              <button key={idx} onClick={(e) => e.stopPropagation()}>
                                #{tag}
                              </button>
                            ))}
                        </div>

                        <div className="gig-card-footer">
                          <div className="client-line">
                            <div className="small-avatar coral">{getInitials(gig.client_name)}</div>
                            <div>
                              <strong>{gig.client_name}</strong>
                              <small>{gig.department}</small>
                            </div>
                          </div>
                          <div className="gig-meta">
                            <strong>${gig.budget}</strong>
                            <small>due {gig.deadline}</small>
                          </div>
                        </div>

                        <div className="bid-count">
                          <span>{gig.bid_count} proposals</span>
                          <span style={{ fontSize: "12px", color: "var(--coral)", fontWeight: 700 }}>
                            View details →
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <span>✦</span>
                      <h3>No gigs matching your criteria</h3>
                      <p>Try clearing filters or search terms to see available opportunities.</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {view === "Top Freelancers" && (
              <TopFreelancersView topFreelancers={topFreelancers} />
            )}

            {view === "My gigs" && (
              user ? (
                <MyGigs
                  gigs={myGigs.length ? myGigs : (gigs || []).filter((gig) => gig.client_id === user.user_id)}
                  onOpen={openGig}
                  onEdit={(gig) => {
                    setEditingGig(gig);
                    setModal("edit");
                  }}
                  onDelete={(gigId) => void handleDeleteGig(gigId)}
                  onReview={(gig) => {
                    setReviewGig(gig);
                    setModal("review");
                  }}
                  onDispute={(gig) => {
                    setDisputeGig(gig);
                    setModal("dispute");
                  }}
                  request={request}
                />
              ) : (
                <AuthPrompt
                  title="Sign In to Manage Your Gigs"
                  copy="Post requests, review candidate proposals, and track project deliveries."
                  onSignIn={() => setModal("login")}
                  onQuickSwitch={quickSwitchUser}
                />
              )
            )}

            {view === "My bids" && (
              user ? (
                <MyBids
                  bids={myBids}
                  onNotice={showNotice}
                  onDeleteBid={(bidId) => void handleDeleteBid(bidId)}
                  onDeliver={async (gigId) => {
                    await request("update_status", { gig_id: gigId, status: "Submitted" }, "Delivering work for client review...");
                  }}
                  onReview={(bid) => {
                    setReviewGig({
                      gig_id: bid.gig_id,
                      title: bid.gig_title || `Gig #${bid.gig_id}`,
                      client_id: 0,
                      accepted_freelancer_id: user.user_id,
                      description: "",
                      budget: bid.proposed_price,
                      deadline: "",
                      status: "Completed",
                      client_name: bid.client_name || "Client",
                      department: "",
                      bid_count: 0,
                      skills: null,
                    });
                    setModal("review");
                  }}
                />
              ) : (
                <AuthPrompt
                  title="Sign In to View Proposals"
                  copy="Track active assignments, submitted proposals, and campus freelance earnings."
                  onSignIn={() => setModal("login")}
                  onQuickSwitch={quickSwitchUser}
                />
              )
            )}

            {view === "Transactions" && (
              user ? (
                <TransactionsView transactions={transactions} user={user} />
              ) : (
                <AuthPrompt
                  title="Sign In to View Financial Ledger"
                  copy="Access your payments made, freelance earnings received, and platform invoice history."
                  onSignIn={() => setModal("login")}
                  onQuickSwitch={quickSwitchUser}
                />
              )
            )}

            {view === "Admin" && (
              user?.role_flag === "admin" ? (
                <AdminPanel
                  disputes={disputes}
                  topFreelancers={topFreelancers}
                  skills={skills}
                  onAddSkill={submitAddSkill}
                  onResolve={async (disputeId, resolution) => {
                    await request("resolve_dispute", { dispute_id: disputeId, resolution }, "Resolving dispute...");
                  }}
                />
              ) : (
                <div className="subpage">
                  <h2>Admin Access Restricted</h2>
                  <p className="page-copy">Please switch to the <strong>CampusGigs Admin</strong> account using the profile switcher in the top header.</p>
                </div>
              )
            )}

            {view === "Profile" && (
              user ? (
                <Profile
                  user={user}
                  skills={user.skills && user.skills.length ? user.skills : (skills || []).slice(0, 3)}
                  onEditSkills={() => setModal("skills")}
                />
              ) : (
                <AuthPrompt
                  title="Sign In to View Profile"
                  copy="Manage your verified student credentials, registered skills, and platform reputation."
                  onSignIn={() => setModal("login")}
                  onQuickSwitch={quickSwitchUser}
                />
              )
            )}

            <footer className="campus-footer">
              <span>
                <i className={connected ? "footer-dot live" : "footer-dot"} />{" "}
                {connected ? `Connected to Live Backend (${API})` : "Local Resilience Mode Active"}
              </span>
              <span>Built for CSE-311 · CampusGigs</span>
            </footer>
          </div>
        </section>

        {modal === "login" && (
          <Modal title="Sign In to CampusGigs" close={() => !isSubmitting && setModal(null)}>
            <form className="modal-form" onSubmit={submitLogin}>
              <label>
                Student Email
                <input name="email" type="email" required placeholder="student@campus.edu" defaultValue="aisha@campus.edu" />
              </label>
              <label>
                Password
                <input name="password" type="password" required placeholder="••••••••" defaultValue="password" />
              </label>

              <button className="modal-submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="cg-spinner" /> Signing in...
                  </>
                ) : (
                  <>
                    Sign In <span>→</span>
                  </>
                )}
              </button>

              <p className="modal-help">
                Default password for all seed accounts is <code>password</code>. Switch test profiles anytime via the top header.
              </p>
            </form>
          </Modal>
        )}

        {modal === "register" && (
          <Modal title="Join CampusGigs" close={() => !isSubmitting && setModal(null)}>
            <form className="modal-form" onSubmit={submitRegister}>
              <label>
                Full Name
                <input name="name" required placeholder="e.g. Tanvir Ahmed" />
              </label>
              <div className="form-split">
                <label>
                  Campus Email
                  <input name="email" type="email" required placeholder="tanvir@campus.edu" />
                </label>
                <label>
                  Password
                  <input name="password" type="password" required placeholder="••••••••" />
                </label>
              </div>
              <div className="form-split">
                <label>
                  Department
                  <input name="department" required placeholder="e.g. Computer Science" />
                </label>
                <label>
                  Graduation Batch
                  <input name="batch" type="number" required defaultValue={2026} />
                </label>
              </div>
              <label>
                Account Role
                <select name="role_flag" defaultValue="student">
                  <option value="student">Student / Freelancer</option>
                  <option value="admin">Platform Administrator</option>
                </select>
              </label>

              <label>
                Select Your Skills & Categories
                <div className="skills-checkbox-grid">
                  {(skills || []).map((skill) => (
                    <label key={skill.skill_id} className="skill-checkbox-item">
                      <input type="checkbox" name="skills" value={skill.skill_id} />
                      <span>{skill.skill_name} ({skill.category})</span>
                    </label>
                  ))}
                </div>
              </label>

              <button className="modal-submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="cg-spinner" /> Creating Account...
                  </>
                ) : (
                  <>
                    Create Account & Join <span>→</span>
                  </>
                )}
              </button>
            </form>
          </Modal>
        )}

        {modal === "post" && user && (
          <Modal title="Post a New Gig" close={() => !isSubmitting && setModal(null)}>
            <form className="modal-form" onSubmit={submitCreateGig}>
              <label>
                Gig Title
                <input name="title" required placeholder="e.g. Need assistance with calculus homework review" />
              </label>
              <label>
                Description & Deliverables
                <textarea name="description" required rows={4} placeholder="Describe the task, timeline, and exact requirements..." />
              </label>
              <div className="form-split">
                <label>
                  Budget ($ USD)
                  <input name="budget" type="number" step="0.01" required placeholder="50.00" />
                </label>
                <label>
                  Deadline
                  <input name="deadline" type="date" required defaultValue={new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]} />
                </label>
              </div>

              <label>
                Required Skills
                <div className="skills-checkbox-grid">
                  {(skills || []).map((skill) => (
                    <label key={skill.skill_id} className="skill-checkbox-item">
                      <input type="checkbox" name="skills" value={skill.skill_id} />
                      <span>{skill.skill_name} ({skill.category})</span>
                    </label>
                  ))}
                </div>
              </label>

              <button className="modal-submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="cg-spinner" /> Publishing Gig...
                  </>
                ) : (
                  <>
                    Publish Gig <span>→</span>
                  </>
                )}
              </button>
            </form>
          </Modal>
        )}

        {modal === "edit" && editingGig && (
          <Modal title="Edit Gig" close={() => !isSubmitting && setModal(null)}>
            <form className="modal-form" onSubmit={submitEditGig}>
              <label>
                Gig Title
                <input name="title" required defaultValue={editingGig.title} />
              </label>
              <label>
                Description
                <textarea name="description" required rows={4} defaultValue={editingGig.description} />
              </label>
              <div className="form-split">
                <label>
                  Budget ($)
                  <input name="budget" type="number" step="0.01" required defaultValue={editingGig.budget} />
                </label>
                <label>
                  Deadline
                  <input name="deadline" type="date" required defaultValue={editingGig.deadline} />
                </label>
              </div>

              <label>
                Required Skills
                <div className="skills-checkbox-grid">
                  {(skills || []).map((skill) => (
                    <label key={skill.skill_id} className="skill-checkbox-item">
                      <input
                        type="checkbox"
                        name="skills"
                        value={skill.skill_id}
                        defaultChecked={editingGig.skills?.includes(skill.skill_name)}
                      />
                      <span>{skill.skill_name}</span>
                    </label>
                  ))}
                </div>
              </label>

              <button className="modal-submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="cg-spinner" /> Saving Changes...
                  </>
                ) : (
                  <>
                    Save Changes <span>→</span>
                  </>
                )}
              </button>
            </form>
          </Modal>
        )}

        {modal === "bid" && selectedGig && (
          <Modal title="Submit Proposal" close={() => !isSubmitting && setModal(null)}>
            <p className="modal-context">
              Applying for: <strong>{selectedGig.title}</strong> (Client Budget: ${selectedGig.budget})
            </p>
            <form className="modal-form" onSubmit={submitBid}>
              <label>
                Proposed Price ($)
                <input name="proposed_price" type="number" step="0.01" required defaultValue={selectedGig.budget} />
              </label>
              <label>
                Cover Note / Pitch
                <textarea name="message" required rows={4} placeholder="Introduce yourself, your experience, and how you will solve this problem..." />
              </label>

              <button className="modal-submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="cg-spinner" /> Submitting Proposal...
                  </>
                ) : (
                  <>
                    Submit Proposal <span>→</span>
                  </>
                )}
              </button>
            </form>
          </Modal>
        )}

        {modal === "review" && reviewGig && (
          <Modal title="Leave a Review" close={() => !isSubmitting && setModal(null)}>
            <p className="modal-context">
              Reviewing: <strong>{reviewGig.title}</strong>
            </p>
            <form className="modal-form" onSubmit={submitReview}>
              <label>
                Rating Score
                <div className="rating-select">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={rating >= s ? "rating-star filled" : "rating-star"}
                      onClick={() => setRating(s)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </label>
              <label>
                Comments & Feedback
                <textarea name="comment" required rows={4} placeholder="Describe the collaboration quality, communication, and punctuality..." />
              </label>

              <button className="modal-submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="cg-spinner" /> Submitting Review...
                  </>
                ) : (
                  <>
                    Submit Review <span>→</span>
                  </>
                )}
              </button>
            </form>
          </Modal>
        )}

        {modal === "dispute" && disputeGig && (
          <Modal title="Raise Dispute to Admin" close={() => !isSubmitting && setModal(null)}>
            <p className="modal-context">
              Reporting issue on: <strong>{disputeGig.title}</strong>
            </p>
            <form className="modal-form" onSubmit={submitDispute}>
              <label>
                Reason for dispute
                <textarea name="reason" required rows={5} placeholder="Describe the disagreement, deliverable issue, or payment concern in detail..." />
              </label>

              <button className="action-btn danger" disabled={isSubmitting} style={{ width: "100%", padding: "12px", fontSize: "13px" }}>
                {isSubmitting ? (
                  <>
                    <span className="cg-spinner" /> Submitting Dispute...
                  </>
                ) : (
                  <>
                    Submit Dispute to Admin <span>→</span>
                  </>
                )}
              </button>
            </form>
          </Modal>
        )}

        {modal === "skills" && user && (
          <Modal title="Manage Your Skills" close={() => !isSubmitting && setModal(null)}>
            <form className="modal-form" onSubmit={submitSkills}>
              <p className="modal-context">Select the skill categories you offer to campus clients.</p>
              <div className="skills-checkbox-grid">
                {(skills || []).map((skill) => (
                  <label key={skill.skill_id} className="skill-checkbox-item">
                    <input
                      type="checkbox"
                      name="skills"
                      value={skill.skill_id}
                      defaultChecked={user.skills?.some((s) => s.skill_id === skill.skill_id)}
                    />
                    <span>{skill.skill_name} ({skill.category})</span>
                  </label>
                ))}
              </div>
              <button className="modal-submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="cg-spinner" /> Saving Skills...
                  </>
                ) : (
                  <>
                    Save Skills <span>→</span>
                  </>
                )}
              </button>
            </form>
          </Modal>
        )}

        {selectedGig && !modal && (
          <GigDrawer
            gig={selectedGig}
            bids={bids}
            reviews={gigReviews}
            user={user}
            myProposal={myProposalForSelectedGig}
            isSubmitting={isSubmitting}
            onClose={() => setSelectedGig(null)}
            onBid={() => (user ? setModal("bid") : setModal("login"))}
            onDeleteBid={(bidId) => void handleDeleteBid(bidId)}
            onReview={() => {
              setReviewGig(selectedGig);
              setModal("review");
            }}
            onDispute={() => {
              setDisputeGig(selectedGig);
              setModal("dispute");
            }}
            request={request}
          />
        )}

        {/* Global Action Loading Overlay */}
        {loadingAction && (
          <div className="action-loading-overlay">
            <div className="action-loading-card">
              <div className="action-loading-spinner" />
              <strong>{loadingAction}</strong>
              <small>Communicating with live database...</small>
            </div>
          </div>
        )}

        {notice && (
          <div className="toast">
            <span>ℹ️ {notice}</span>
            <button onClick={() => setNotice("")}>×</button>
          </div>
        )}
      </main>
    </ErrorBoundary>
  );
}

function TopFreelancersView({ topFreelancers }: { topFreelancers: TopFreelancer[] }) {
  const safeTop = topFreelancers || [];

  return (
    <div className="subpage">
      <p className="overline">CAMPUS TALENT LEADERBOARD</p>
      <h2>Top Campus Freelancers</h2>
      <p className="page-copy">Recognizing the highest-rated and most active student freelancers across departments.</p>

      <div className="simple-list" style={{ marginTop: "24px" }}>
        {safeTop.length > 0 ? (
          safeTop.map((tf, index) => {
            const rankMedal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;
            return (
              <div className="simple-row" key={tf.user_id} style={{ gridTemplateColumns: "40px 42px 1fr auto auto" }}>
                <span style={{ fontSize: index < 3 ? "20px" : "14px", fontWeight: 800, color: index < 3 ? "var(--coral)" : "var(--muted)", textAlign: "center" }}>
                  {rankMedal}
                </span>
                <div className={`campus-avatar ${tf.avatar_color || "coral"}`}>
                  {getInitials(tf.name)}
                </div>
                <div>
                  <strong style={{ fontSize: "14px" }}>{tf.name}</strong>
                  <small>{tf.department} · Campus Verified</small>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong style={{ fontSize: "13px", color: "var(--navy)" }}>{tf.completed_gigs} Gigs</strong>
                  <small style={{ color: "var(--muted)" }}>Completed</small>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong style={{ fontSize: "14px", color: "#d97706" }}>{Number(tf.average_rating || 5).toFixed(1)} ★</strong>
                  <small style={{ color: "var(--muted)" }}>Reputation</small>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <span style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>🏆</span>
            <h3>Leaderboard Loading</h3>
            <p className="muted-copy">Complete gigs and leave ratings to climb the campus leaderboard.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AuthPrompt({
  title,
  copy,
  onSignIn,
  onQuickSwitch,
}: {
  title: string;
  copy: string;
  onSignIn: () => void;
  onQuickSwitch: (u: User) => void;
}) {
  return (
    <div className="subpage" style={{ maxWidth: "680px", margin: "20px auto" }}>
      <div className="profile-card" style={{ textAlign: "center", padding: "48px 32px" }}>
        <span style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>🔒</span>
        <h2>{title}</h2>
        <p className="page-copy" style={{ marginBottom: "28px" }}>{copy}</p>

        <button className="action-btn primary" onClick={onSignIn} style={{ padding: "12px 28px", fontSize: "13px" }}>
          Sign In with Student Account <span>→</span>
        </button>

        <div style={{ marginTop: "32px", borderTop: "1px solid var(--line)", paddingTop: "20px" }}>
          <p style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Or 1-Click Instant Demo Login:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginTop: "12px" }}>
            {demoUsers.map((du) => (
              <button
                key={du.user_id}
                className="action-btn"
                onClick={() => onQuickSwitch(du)}
                style={{ fontSize: "11px" }}
              >
                <div className={`small-avatar ${du.avatar_color}`} style={{ width: "18px", height: "18px", fontSize: "8px" }}>
                  {getInitials(du.name)}
                </div>
                {du.name.split(" ")[0]} ({du.role_flag})
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MyGigs({
  gigs,
  onOpen,
  onEdit,
  onDelete,
  onReview,
  onDispute,
  request,
}: {
  gigs: Gig[];
  onOpen: (gig: Gig) => void;
  onEdit: (gig: Gig) => void;
  onDelete: (gigId: number) => void;
  onReview: (gig: Gig) => void;
  onDispute: (gig: Gig) => void;
  request: (action: string, body?: Record<string, unknown>, msg?: string) => Promise<unknown>;
}) {
  const safeGigs = gigs || [];
  return (
    <div className="subpage">
      <p className="overline">CLIENT WORKSPACE</p>
      <h2>My Posted Gigs</h2>
      <p className="page-copy">Manage your requests, review candidate proposals, and track deliverables.</p>

      <div className="simple-list">
        {safeGigs.length > 0 ? (
          safeGigs.map((gig) => (
            <div className="simple-row" key={gig.gig_id}>
              <span className="gig-symbol coral">✦</span>
              <div style={{ cursor: "pointer" }} onClick={() => onOpen(gig)}>
                <strong>{gig.title}</strong>
                <small>
                  {gig.bid_count} proposals · due {gig.deadline}
                  {gig.accepted_freelancer_name ? ` · Freelancer: ${gig.accepted_freelancer_name}` : ""}
                </small>
              </div>
              <b>${gig.budget}</b>
              <em>{gig.status}</em>

              <div style={{ display: "flex", gap: "6px" }}>
                {gig.status === "Open" && (
                  <>
                    <button
                      className="action-btn"
                      onClick={() => onEdit(gig)}
                      style={{ padding: "5px 10px", fontSize: "11px" }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="action-btn danger"
                      onClick={() => void request("update_status", { gig_id: gig.gig_id, status: "Cancelled" }, "Cancelling gig...")}
                      style={{ padding: "5px 10px", fontSize: "11px" }}
                    >
                      Cancel
                    </button>
                  </>
                )}

                <button
                  className="action-btn danger"
                  onClick={() => onDelete(gig.gig_id)}
                  style={{ padding: "5px 10px", fontSize: "11px" }}
                >
                  🗑️
                </button>

                {(gig.status === "In Progress" || gig.status === "Submitted") && (
                  <button
                    className="action-btn secondary"
                    onClick={() => void request("update_status", { gig_id: gig.gig_id, status: "Completed" }, "Completing gig and recording transaction...")}
                  >
                    {gig.status === "Submitted" ? "Approve Delivery & Complete" : "Complete"}
                  </button>
                )}

                {gig.status === "Completed" && (
                  <button className="action-btn primary" onClick={() => onReview(gig)}>
                    Review Freelancer
                  </button>
                )}

                {gig.status !== "Completed" && gig.status !== "Disputed" && gig.status !== "Cancelled" && (
                  <button className="action-btn danger" onClick={() => onDispute(gig)}>
                    Dispute
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <EmptyView title="No posted gigs yet" copy="Post your first request and find talented students on campus." icon="＋" />
        )}
      </div>
    </div>
  );
}

function MyBids({
  bids,
  onNotice,
  onDeleteBid,
  onDeliver,
  onReview,
}: {
  bids: Bid[];
  onNotice: (message: string) => void;
  onDeleteBid: (bidId: number) => void;
  onDeliver: (gigId: number) => void;
  onReview: (bid: Bid) => void;
}) {
  const safeBids = bids || [];
  const activeCount = safeBids.length;
  const potentialEarnings = safeBids.reduce((sum, b) => sum + Number(b.proposed_price || 0), 0);

  return (
    <div className="subpage">
      <p className="overline">FREELANCER WORKSPACE</p>
      <h2>My Proposals & Assignments</h2>
      <p className="page-copy">Track the opportunities you&apos;ve applied for and manage active deliveries.</p>

      <div className="proposal-summary">
        <strong>{activeCount}</strong>
        <span>active proposals</span>
        <strong>${potentialEarnings.toFixed(2)}</strong>
        <span>potential earnings</span>
      </div>

      <div className="simple-list">
        {safeBids.length > 0 ? (
          safeBids.map((bid) => (
            <div className="simple-row" key={bid.bid_id}>
              <span className="gig-symbol blue">✦</span>
              <div>
                <strong>{bid.gig_title || `Gig #${bid.gig_id}`}</strong>
                <small>Client: {bid.client_name || "Campus Client"}{bid.gig_status ? ` · Gig Status: ${bid.gig_status}` : ""}</small>
              </div>
              <b>${bid.proposed_price}</b>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <em className={`proposal-${safeLower(bid.status)}`}>{bid.status}</em>

                {bid.status === "Pending" && (
                  <button
                    className="action-btn danger"
                    style={{ padding: "4px 8px", fontSize: "10px" }}
                    onClick={() => onDeleteBid(bid.bid_id)}
                    title="Withdraw proposal"
                  >
                    Withdraw
                  </button>
                )}

                {bid.status === "Accepted" && bid.gig_status === "In Progress" && (
                  <button
                    className="action-btn secondary"
                    onClick={() => onDeliver(bid.gig_id)}
                    title="Mark work as delivered for client review"
                  >
                    🚀 Deliver Work
                  </button>
                )}

                {bid.status === "Accepted" && bid.gig_status === "Submitted" && (
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#6366f1" }}>
                    ✓ Work Submitted
                  </span>
                )}

                {bid.status === "Accepted" && bid.gig_status === "Completed" && (
                  <button
                    className="action-btn primary"
                    onClick={() => onReview(bid)}
                  >
                    Review Client
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div
            className="simple-row"
            onClick={() => onNotice("Submit proposals on open gigs to view them here.")}
            style={{ cursor: "pointer" }}
          >
            <span className="gig-symbol blue">✦</span>
            <div>
              <strong>No proposals yet</strong>
              <small>Explore open gigs on the Discover feed and submit your proposals.</small>
            </div>
            <b>$0.00</b>
            <em className="proposal-pending">None</em>
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionsView({
  transactions,
  user,
}: {
  transactions: Transaction[];
  user: User;
}) {
  const safeTx = transactions || [];
  const isClient = (t: Transaction) => t.client_id === user.user_id;
  const totalPaid = safeTx
    .filter(isClient)
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalEarned = safeTx
    .filter((t) => !isClient(t))
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  return (
    <div className="subpage">
      <p className="overline">FINANCIAL LEDGER</p>
      <h2>Platform Transactions</h2>
      <p className="page-copy">Track payments made for completed campus gigs and earnings disbursed.</p>

      <div className="tx-summary-grid">
        <div className="tx-summary-card">
          <small>Total Transactions</small>
          <strong>{safeTx.length}</strong>
        </div>
        <div className="tx-summary-card">
          <small>Total Payments Made</small>
          <strong style={{ color: "#dc2626" }}>${totalPaid.toFixed(2)}</strong>
        </div>
        <div className="tx-summary-card">
          <small>Total Earnings Received</small>
          <strong style={{ color: "#10b981" }}>${totalEarned.toFixed(2)}</strong>
        </div>
      </div>

      <div className="tx-table-wrap">
        {safeTx.length > 0 ? (
          <table className="tx-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Gig Title</th>
                <th>Party Details</th>
                <th>Your Role</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Completed Date</th>
              </tr>
            </thead>
            <tbody>
              {safeTx.map((tx) => {
                const clientRole = isClient(tx);
                return (
                  <tr key={tx.transaction_id}>
                    <td style={{ fontFamily: "'DM Mono', monospace", color: "var(--muted)" }}>#{tx.transaction_id}</td>
                    <td>
                      <strong>{tx.gig_title}</strong>
                      <small style={{ display: "block", color: "var(--muted)" }}>Gig #{tx.gig_id}</small>
                    </td>
                    <td>
                      <div>Client: <strong>{tx.client_name}</strong></div>
                      {tx.freelancer_name && <small style={{ color: "var(--muted)" }}>Freelancer: {tx.freelancer_name}</small>}
                    </td>
                    <td>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: clientRole ? "#dc2626" : "#10b981" }}>
                        {clientRole ? "Payer (Client)" : "Earner (Freelancer)"}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: "13px" }}>${Number(tx.amount || 0).toFixed(2)}</strong>
                    </td>
                    <td>
                      <span className={`tx-badge ${safeLower(tx.payment_status)}`}>
                        {tx.payment_status}
                      </span>
                    </td>
                    <td style={{ color: "var(--muted)", font: "10px 'DM Mono', monospace" }}>
                      {tx.completed_at || "Recent"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <p className="muted-copy">No transactions recorded yet. Complete a gig to generate financial records.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminPanel({
  disputes,
  topFreelancers,
  skills,
  onAddSkill,
  onResolve,
}: {
  disputes: Dispute[];
  topFreelancers: TopFreelancer[];
  skills: Skill[];
  onAddSkill: (skillName: string, category: string) => Promise<void>;
  onResolve: (disputeId: number, resolution: string) => void;
}) {
  const [resolutionText, setResolutionText] = useState("");
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("Technology");
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  const safeDisputes = disputes || [];
  const safeTop = topFreelancers || [];

  async function handleSkillSubmit(e: FormEvent) {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    setIsAddingSkill(true);
    await onAddSkill(newSkillName.trim(), newSkillCategory);
    setNewSkillName("");
    setIsAddingSkill(false);
  }

  return (
    <div className="subpage">
      <p className="overline">ADMINISTRATION</p>
      <h2>Dispute Resolution, Skills & Metrics</h2>
      <p className="page-copy">Manage platform disputes, add new skill categories, and review top freelancers.</p>

      {/* Admin Add Skill Card */}
      <div className="admin-box" style={{ marginTop: "20px", marginBottom: "20px" }}>
        <h3>✨ Add New Skill Category</h3>
        <p className="page-copy" style={{ marginBottom: "14px" }}>
          Expand the skills database. Newly added skills immediately become available for student profiles and gig requirements.
        </p>
        <form onSubmit={handleSkillSubmit} style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
          <input
            style={{ flex: "2 1 200px", padding: "10px 14px", fontSize: "12px", border: "1px solid var(--line)", borderRadius: "8px" }}
            placeholder="e.g. Mobile App Development, UI/UX Design, Python..."
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            required
            disabled={isAddingSkill}
          />
          <select
            style={{ flex: "1 1 140px", padding: "10px 14px", fontSize: "12px", border: "1px solid var(--line)", borderRadius: "8px", background: "#fff" }}
            value={newSkillCategory}
            onChange={(e) => setNewSkillCategory(e.target.value)}
            disabled={isAddingSkill}
          >
            <option value="Technology">Technology</option>
            <option value="Creative">Creative</option>
            <option value="Academic">Academic</option>
            <option value="Business">Business</option>
            <option value="Technical">Technical</option>
            <option value="Writing">Writing</option>
            <option value="Other">Other</option>
          </select>
          <button
            type="submit"
            className="action-btn primary"
            disabled={isAddingSkill}
            style={{ padding: "10px 20px" }}
          >
            {isAddingSkill ? (
              <>
                <span className="cg-spinner" /> Adding...
              </>
            ) : (
              "+ Add Skill"
            )}
          </button>
        </form>

        <div style={{ marginTop: "16px" }}>
          <small style={{ color: "var(--muted)", fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "6px" }}>CURRENT PLATFORM SKILLS ({skills.length}):</small>
          <div className="tag-row">
            {skills.map((s) => (
              <span key={s.skill_id} style={{ background: "#f1f5f9", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", color: "var(--ink)" }}>
                {s.skill_name} <small style={{ color: "var(--muted)" }}>({s.category})</small>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-columns">
        <div className="admin-box">
          <h3>Active Disputes ({safeDisputes.length})</h3>
          {safeDisputes.length > 0 ? (
            safeDisputes.map((dispute) => (
              <div key={dispute.dispute_id} className="dispute-card">
                <div className="dispute-card-header">
                  <strong>{dispute.title}</strong>
                  <em className="role-badge admin">{dispute.status}</em>
                </div>
                <small>Raised by: {dispute.raised_by_name}</small>
                <div className="dispute-body">&ldquo;{dispute.reason}&rdquo;</div>

                {dispute.status !== "Resolved" && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                    <input
                      style={{ flex: 1, padding: "8px", fontSize: "12px", border: "1px solid var(--line)", borderRadius: "6px" }}
                      placeholder="Enter resolution details..."
                      onChange={(e) => setResolutionText(e.target.value)}
                    />
                    <button
                      className="action-btn primary"
                      onClick={() => onResolve(dispute.dispute_id, resolutionText || "Resolved by admin after review.")}
                    >
                      Resolve
                    </button>
                  </div>
                )}
                {dispute.status === "Resolved" && dispute.resolution && (
                  <small style={{ color: "#15803d", display: "block", marginTop: "6px" }}>
                    Resolution: {dispute.resolution}
                  </small>
                )}
              </div>
            ))
          ) : (
            <p className="muted-copy">No active disputes reported.</p>
          )}
        </div>

        <div className="admin-box">
          <h3>Top Freelancers Leaderboard</h3>
          {safeTop.length > 0 ? (
            safeTop.map((tf, index) => (
              <div key={tf.user_id} className="rank-row">
                <b>#{index + 1}</b>
                <div>
                  <strong>{tf.name}</strong>
                  <small>{tf.department}</small>
                </div>
                <div>
                  <small>{tf.completed_gigs} completed</small>
                  <em>{tf.average_rating} ★</em>
                </div>
              </div>
            ))
          ) : (
            <div className="rank-row">
              <b>#1</b>
              <div>
                <strong>Aisha Rahman</strong>
                <small>Computer Science</small>
              </div>
              <div>
                <small>4 completed</small>
                <em>4.9 ★</em>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Profile({
  user,
  skills,
  compact = false,
  onEditSkills,
}: {
  user: User;
  skills: Skill[];
  compact?: boolean;
  onEditSkills?: () => void;
}) {
  const ratingDisplay = user.average_rating && user.average_rating > 0 ? Number(user.average_rating).toFixed(1) : "5.0";
  const safeSkills = skills || [];

  return (
    <div className={compact ? "profile-card compact-profile" : "subpage profile-page"}>
      <div className="profile-hero">
        <div className={`profile-avatar ${user.avatar_color}`}>{getInitials(user.name)}</div>
        <div>
          <p className="overline">
            VERIFIED {safeLower(user.role_flag).toUpperCase()} · BATCH {user.batch}
          </p>
          <h2>{user.name}</h2>
          <p>{user.department} · Campus community member</p>
        </div>
        <span className="verified">✓ Verified</span>
      </div>

      <div className="profile-fields">
        <div>
          <small>Student Email</small>
          <strong>{user.email}</strong>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <small style={{ margin: 0 }}>Registered Skills</small>
            {onEditSkills && !compact && (
              <button
                onClick={onEditSkills}
                style={{ background: "none", border: 0, color: "var(--coral)", fontSize: "11px", fontWeight: 700, cursor: "pointer", padding: 0 }}
              >
                ✏️ Edit Skills
              </button>
            )}
          </div>
          <strong>
            {safeSkills.length > 0
              ? safeSkills.map((s) => s.skill_name).join(" · ")
              : "No skills configured yet"}
          </strong>
        </div>
        <div>
          <small>Student Reputation</small>
          <strong>
            {ratingDisplay} <span className="stars">★★★★★</span>
          </strong>
        </div>
      </div>
    </div>
  );
}

function GigDrawer({
  gig,
  bids,
  reviews,
  user,
  myProposal,
  isSubmitting,
  onClose,
  onBid,
  onDeleteBid,
  onReview,
  onDispute,
  request,
}: {
  gig: Gig;
  bids: Bid[];
  reviews: Review[];
  user: User | null;
  myProposal?: Bid | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onBid: () => void;
  onDeleteBid: (bidId: number) => void;
  onReview: () => void;
  onDispute: () => void;
  request: (action: string, body?: Record<string, unknown>, msg?: string) => Promise<unknown>;
}) {
  const isOwner = Boolean(user && Number(gig.client_id) === Number(user.user_id));
  const isAcceptedFreelancer = Boolean(user && Number(gig.accepted_freelancer_id) === Number(user.user_id));
  const safeBids = bids || [];
  const safeReviews = reviews || [];

  return (
    <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="gig-drawer">
        <button className="drawer-close" onClick={onClose}>
          ×
        </button>
        <p className="overline">GIG DETAILS · {safeLower(gig.status).toUpperCase()}</p>
        <h2>{gig.title}</h2>
        <p className="drawer-description">{gig.description}</p>

        <div className="drawer-meta">
          <div>
            <small>Budget</small>
            <strong>${gig.budget}</strong>
          </div>
          <div>
            <small>Deadline</small>
            <strong>{gig.deadline}</strong>
          </div>
          <div>
            <small>Proposals</small>
            <strong>{gig.bid_count}</strong>
          </div>
        </div>

        <div className="drawer-client">
          <div className="small-avatar coral">{getInitials(gig.client_name)}</div>
          <div>
            <small>Posted by</small>
            <strong>{gig.client_name}</strong>
            <span>{gig.department}</span>
          </div>
        </div>

        {gig.skills && (
          <div style={{ marginBottom: "20px" }}>
            <small style={{ color: "var(--muted)", fontSize: "11px", fontWeight: 700, display: "block", marginBottom: "6px" }}>REQUIRED SKILLS</small>
            <div className="tag-row">
              {gig.skills.split(",").map((s, i) => (
                <button key={i} type="button">#{s.trim()}</button>
              ))}
            </div>
          </div>
        )}

        {/* Proposals List for Gig Owner */}
        {isOwner && (
          <>
            <h3>
              Proposals <span>{safeBids.length}</span>
            </h3>
            <div className="bid-list">
              {safeBids.length > 0 ? (
                safeBids.map((bid) => (
                  <div className="bid-row" key={bid.bid_id}>
                    <div className="small-avatar blue">{getInitials(bid.freelancer_name)}</div>
                    <div>
                      <strong>{bid.freelancer_name}</strong>
                      <small>{bid.message}</small>
                    </div>
                    <b>${bid.proposed_price}</b>
                    {bid.status === "Pending" && (
                      <button
                        className="action-btn primary"
                        disabled={isSubmitting}
                        onClick={() => void request("accept_bid", { bid_id: bid.bid_id }, "Accepting proposal...")}
                      >
                        Accept Proposal
                      </button>
                    )}
                    {bid.status !== "Pending" && (
                      <em className={`role-badge ${bid.status === "Accepted" ? "student" : "admin"}`}>
                        {bid.status}
                      </em>
                    )}
                  </div>
                ))
              ) : (
                <p className="muted-copy">No proposals submitted yet.</p>
              )}
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "24px" }}>
          {!isOwner && gig.status === "Open" && !myProposal && (
            <button className="drawer-cta" onClick={onBid}>
              Submit a proposal <span>→</span>
            </button>
          )}

          {!isOwner && myProposal && (
            <div style={{ background: "var(--line-light)", padding: "14px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ fontSize: "12px", display: "block" }}>Your Proposal: ${myProposal.proposed_price}</strong>
                <small style={{ color: "var(--muted)" }}>Status: {myProposal.status}</small>
              </div>
              {myProposal.status === "Pending" && (
                <button className="action-btn danger" disabled={isSubmitting} onClick={() => onDeleteBid(myProposal.bid_id)}>
                  Withdraw
                </button>
              )}
            </div>
          )}

          {isAcceptedFreelancer && gig.status === "In Progress" && (
            <button
              className="action-btn secondary"
              disabled={isSubmitting}
              style={{ width: "100%", padding: "12px", fontSize: "13px" }}
              onClick={() => void request("update_status", { gig_id: gig.gig_id, status: "Submitted" }, "Delivering work for client review...")}
            >
              🚀 Deliver Work / Mark Submitted
            </button>
          )}

          {isOwner && (gig.status === "In Progress" || gig.status === "Submitted") && (
            <button
              className="action-btn secondary"
              disabled={isSubmitting}
              style={{ width: "100%", padding: "12px", fontSize: "13px" }}
              onClick={() => void request("update_status", { gig_id: gig.gig_id, status: "Completed" }, "Approving work and completing gig...")}
            >
              {gig.status === "Submitted" ? "Approve Delivery & Complete Gig" : "Mark as Completed"}
            </button>
          )}

          {(isOwner || isAcceptedFreelancer) && gig.status === "Completed" && (
            <button
              className="action-btn primary"
              style={{ width: "100%", padding: "12px", fontSize: "13px" }}
              onClick={onReview}
            >
              ★ Leave Feedback & Rating
            </button>
          )}

          {(isOwner || isAcceptedFreelancer) && gig.status !== "Completed" && gig.status !== "Disputed" && gig.status !== "Cancelled" && (
            <button
              className="action-btn danger"
              style={{ width: "100%", padding: "10px", fontSize: "12px" }}
              onClick={onDispute}
            >
              Raise Dispute to Admin
            </button>
          )}
        </div>

        {safeReviews.length > 0 && (
          <div style={{ marginTop: "28px" }}>
            <h3>Reviews & Feedback</h3>
            {safeReviews.map((r, idx) => (
              <div key={r.review_id || idx} className="review-card">
                <div className="review-card-top">
                  <strong>{r.reviewer_name}</strong>
                  <span>{"★".repeat(r.rating || 5)}</span>
                </div>
                <p>&ldquo;{r.comment}&rdquo;</p>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}

function EmptyView({ title, copy, icon }: { title: string; copy: string; icon: string }) {
  return (
    <div className="empty-view">
      <span>{icon}</span>
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
  );
}

function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="modal">
        <button className="modal-close" onClick={close}>
          ×
        </button>
        <p className="overline">CAMPUSGIGS</p>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
