"use client";

import React, { Component, FormEvent, ReactNode, useEffect, useState } from "react";

// Robust Error Boundary to guarantee Vercel / Client never crashes into 'page not available'
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
    console.error("CampusGigs App Error caught:", error, errorInfo);
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
  client_email?: string;
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
  freelancer_email?: string;
  freelancer_rating?: number;
  skills?: string[];
  department: string;
  batch?: number;
  proposed_price: string;
  message: string;
  status: string;
  avatar_color: string;
  gig_title?: string;
  gig_budget?: string;
  gig_status?: string;
  client_name?: string;
  client_email?: string;
  client_department?: string;
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
};

type TopFreelancer = {
  user_id: number;
  name: string;
  department: string;
  completed_gigs: number;
  average_rating: string;
};

type Review = {
  review_id: number;
  rating: number;
  comment: string;
  reviewer_name: string;
};

const API = process.env.NEXT_PUBLIC_API_URL || "https://campusgig-tyeh.onrender.com";

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
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [myGigs, setMyGigs] = useState<Gig[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [stats, setStats] = useState({ total: 0, open_count: 0, completed_count: 0, completion_rate: 0 });
  const [view, setView] = useState("Discover");
  const [status, setStatus] = useState("Open");
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState(0);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [gigReviews, setGigReviews] = useState<Review[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [topFreelancers, setTopFreelancers] = useState<TopFreelancer[]>([]);
  const [modal, setModal] = useState<"post" | "edit" | "bid" | "profile" | "skills" | "review" | "dispute" | "login" | "register" | "user_profile" | null>(null);
  const [viewingProfileUser, setViewingProfileUser] = useState<User | null>(null);
  const [reviewGig, setReviewGig] = useState<Gig | null>(null);
  const [disputeGig, setDisputeGig] = useState<Gig | null>(null);
  const [editingGig, setEditingGig] = useState<Gig | null>(null);
  const [rating, setRating] = useState(5);
  const [notice, setNotice] = useState("");
  const [connected, setConnected] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [loadingGigs, setLoadingGigs] = useState(true);
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [gigsError, setGigsError] = useState(false);

  // Restore session
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("campusgigs_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // Ignored
    }
  }, []);

  function handleSetUser(u: User | null) {
    setUser(u);
    if (u) {
      localStorage.setItem("campusgigs_user", JSON.stringify(u));
    } else {
      localStorage.removeItem("campusgigs_user");
    }
  }

  async function openUserProfile(targetUserId: number) {
    try {
      const res = await fetch(`${API}/index.php?action=user_profile&user_id=${targetUserId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setViewingProfileUser(data.user);
          setModal("user_profile");
          return;
        }
      }
      showNotice("Could not load user profile.");
    } catch {
      showNotice("Could not load user profile.");
    }
  }

  async function loadGigs() {
    setLoadingGigs(true);
    setGigsError(false);
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
      setConnected(false);
      setGigsError(true);
    } finally {
      setLoadingGigs(false);
    }
  }

  useEffect(() => {
    if (mounted) {
      void loadGigs();
    }
  }, [mounted]);

  async function loadUserData() {
    if (!user) return;
    setLoadingUserData(true);
    try {
      const [myGigsRes, myBidsRes, txRes, meRes, adminRes] = await Promise.allSettled([
        fetch(`${API}/index.php?action=my_gigs&user_id=${user.user_id}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${API}/index.php?action=my_bids&user_id=${user.user_id}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${API}/index.php?action=transactions&user_id=${user.user_id}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${API}/index.php?action=me&user_id=${user.user_id}`).then((r) => (r.ok ? r.json() : null)),
        user.role_flag === "admin"
          ? fetch(`${API}/index.php?action=admin&user_id=${user.user_id}`).then((r) => (r.ok ? r.json() : null))
          : Promise.resolve(null),
      ]);

      if (myGigsRes.status === "fulfilled" && myGigsRes.value && Array.isArray(myGigsRes.value.gigs)) {
        setMyGigs(myGigsRes.value.gigs);
      }
      if (myBidsRes.status === "fulfilled" && myBidsRes.value && Array.isArray(myBidsRes.value.bids)) {
        setMyBids(myBidsRes.value.bids);
      }
      if (txRes.status === "fulfilled" && txRes.value && Array.isArray(txRes.value.transactions)) {
        setTransactions(txRes.value.transactions);
      }
      if (meRes.status === "fulfilled" && meRes.value && meRes.value.user) {
        const freshUser = meRes.value.user;
        setUser((prev) => {
          if (!prev) return freshUser;
          if (prev.average_rating === freshUser.average_rating && prev.name === freshUser.name && prev.department === freshUser.department && JSON.stringify(prev.skills) === JSON.stringify(freshUser.skills)) {
            return prev;
          }
          return { ...prev, ...freshUser };
        });
      }
      if (adminRes.status === "fulfilled" && adminRes.value) {
        if (Array.isArray(adminRes.value.disputes)) setDisputes(adminRes.value.disputes);
        if (Array.isArray(adminRes.value.top_freelancers)) setTopFreelancers(adminRes.value.top_freelancers);
      }
    } catch (e) {
      console.error("loadUserData error:", e);
    } finally {
      setLoadingUserData(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadGigs();
    }, 200);
    return () => window.clearTimeout(timer);
  }, [status, skillFilter, search]);

  useEffect(() => {
    if (view === "My gigs" || view === "My bids" || view === "Transactions" || view === "Admin" || view === "Profile") {
      if (user?.user_id) {
        void loadUserData();
      } else {
        setLoadingUserData(false);
      }
    }
  }, [view, user?.user_id]);

  async function request(action: string, body?: Record<string, unknown>) {
    if (!user && (action === "create_gig" || action === "create_bid" || action === "review" || action === "dispute" || action === "update_skills")) {
      setModal("login");
      showNotice("Please sign in to perform this action.");
      return null;
    }
    try {
      const response = await fetch(`${API}/index.php?action=${action}`, {
        method: body ? "POST" : "GET",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify({ ...body, user_id: user?.user_id || 1 }) : undefined,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      showNotice(data.message ?? "Action completed successfully");
      void loadGigs();
      void loadUserData();
      return data;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      showNotice(errMsg);
      return null;
    }
  }

  async function openGig(gig: Gig) {
    setSelectedGig(gig);
    try {
      const response = await fetch(`${API}/index.php?action=gig&id=${gig.gig_id}`);
      const data = await response.json();
      if (response.ok) {
        setBids(data.bids || []);
        setGigReviews(data.reviews || []);
        if (data.gig) {
          setSelectedGig(data.gig);
        }
      }
    } catch {
      setBids([]);
      setGigReviews([]);
    }
  }

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setModal("login");
      return;
    }
    const form = new FormData(event.currentTarget);
    const selectedSkillIds = form.getAll("skills").map(Number).filter((id) => id > 0);

    if (selectedSkillIds.length === 0) {
      showNotice("Please select at least one required skill.");
      return;
    }

    const result = await request("create_gig", {
      title: form.get("title"),
      description: form.get("description"),
      budget: form.get("budget"),
      deadline: form.get("deadline"),
      skills: selectedSkillIds,
    });

    if (result) {
      setModal(null);
      setView("Discover");
      setStatus("Open");
      void loadGigs();
    }
  }

  async function submitEditGig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !editingGig) return;
    const form = new FormData(event.currentTarget);
    const selectedSkillIds = form.getAll("skills").map(Number).filter((id) => id > 0);

    const result = await request("edit_gig", {
      gig_id: editingGig.gig_id,
      user_role: user.role_flag,
      title: form.get("title"),
      description: form.get("description"),
      budget: form.get("budget"),
      deadline: form.get("deadline"),
      skills: selectedSkillIds,
    });

    if (result) {
      setModal(null);
      setEditingGig(null);
      void loadGigs();
    }
  }

  async function handleDeleteGig(gigId: number) {
    if (!window.confirm("Are you sure you want to delete this gig? This action cannot be undone.")) return;
    const result = await request("delete_gig", {
      gig_id: gigId,
      user_role: user?.role_flag,
    });
    if (result) {
      setSelectedGig(null);
      void loadGigs();
    }
  }

  async function handleDeleteBid(bidId: number) {
    if (!window.confirm("Are you sure you want to withdraw this proposal?")) return;
    const result = await request("delete_bid", {
      bid_id: bidId,
      user_role: user?.role_flag,
    });
    if (result) {
      void loadUserData();
      void loadGigs();
    }
  }

  async function submitBid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setModal("login");
      return;
    }
    if (!selectedGig) return;
    const form = new FormData(event.currentTarget);
    const result = await request("create_bid", {
      gig_id: selectedGig.gig_id,
      proposed_price: form.get("price"),
      message: form.get("message"),
    });
    if (result) setModal(null);
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password")).trim();

    const result = await request("login", { email, password });
    if (result && result.user) {
      handleSetUser(result.user);
      setModal(null);
      showNotice(`Welcome back, ${result.user.name}!`);
      return;
    }

    showNotice("We couldn't sign you in. Check your email and password and try again.");
  }

  async function submitRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name")).trim();
    const email = String(form.get("email")).trim();
    const department = String(form.get("department")).trim();
    const batch = Number(form.get("batch"));
    const password = String(form.get("password")).trim();

    const result = await request("register", { name, email, department, batch, password });
    if (result && result.user) {
      handleSetUser(result.user);
      setModal(null);
      showNotice(`Account registered! Welcome, ${result.user.name}!`);
      return;
    }

    showNotice("We couldn't create your account. Please try again.");
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reviewGig || !user) return;
    const form = new FormData(event.currentTarget);
    const targetRevieweeId =
      user.user_id === reviewGig.client_id
        ? (reviewGig.accepted_freelancer_id || 0)
        : reviewGig.client_id;

    const result = await request("review", {
      gig_id: reviewGig.gig_id,
      reviewee_id: targetRevieweeId,
      rating: rating,
      comment: form.get("comment"),
    });
    if (result) {
      setModal(null);
      setReviewGig(null);
      void loadUserData();
    }
  }

  async function submitSkills(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const form = new FormData(event.currentTarget);
    const selectedSkillIds = form.getAll("skills").map(Number).filter((id) => id > 0);

    const result = await request("update_skills", {
      skills: selectedSkillIds,
    });
    if (result) {
      const selectedSkillObjects = skills.filter((s) => selectedSkillIds.includes(s.skill_id));
      const updatedUser = { ...user, skills: selectedSkillObjects };
      handleSetUser(updatedUser);
      setModal(null);
    }
  }

  async function submitDispute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!disputeGig || !user) return;
    const form = new FormData(event.currentTarget);
    const result = await request("dispute", {
      gig_id: disputeGig.gig_id,
      reason: form.get("reason"),
    });
    if (result) {
      setModal(null);
      setDisputeGig(null);
    }
  }

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4200);
  }

  const initials = user
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
    : "G";

  // Filter gigs by Status, Selected Skill, and Keyword Search
  const filteredGigs = gigs.filter((gig) => {
    // 1. Status Filter
    if (status !== "All" && gig.status !== status) return false;

    // 2. Category Skill Filter
    if (skillFilter > 0) {
      const selectedSkillObj = skills.find((s) => s.skill_id === skillFilter);
      if (selectedSkillObj) {
        const gigSkillsLower = (gig.skills || "").toLowerCase();
        const selectedNameLower = selectedSkillObj.skill_name.toLowerCase();
        if (!gigSkillsLower.includes(selectedNameLower)) {
          return false;
        }
      }
    }

    // 3. Keyword Search Filter
    const query = search.trim().toLowerCase();
    if (query) {
      const titleMatch = gig.title.toLowerCase().includes(query);
      const descMatch = gig.description.toLowerCase().includes(query);
      const skillMatch = (gig.skills || "").toLowerCase().includes(query);
      const clientMatch = gig.client_name.toLowerCase().includes(query);
      const deptMatch = gig.department.toLowerCase().includes(query);
      if (!titleMatch && !descMatch && !skillMatch && !clientMatch && !deptMatch) {
        return false;
      }
    }

    return true;
  });

  return (
    <main className="campus-shell">
      <aside className="campus-sidebar">
        <div className="cg-brand">
          <span>✦</span>
          <div>
            Campus<span>Gigs</span>
            <small>YOUR CAMPUS. YOUR MARKET.</small>
          </div>
        </div>

        <div className="campus-nav">
          <p>WORKSPACE</p>
          <button className={view === "Discover" ? "campus-nav-link active" : "campus-nav-link"} onClick={() => setView("Discover")}>
            <span>⌕</span> Discover gigs
          </button>

          {user && (
            <>
              <button className={view === "My gigs" ? "campus-nav-link active" : "campus-nav-link"} onClick={() => setView("My gigs")}>
                <span>▣</span> My gigs <b>{gigs.filter((g) => g.client_id === user.user_id).length}</b>
              </button>

              <button className={view === "My bids" ? "campus-nav-link active" : "campus-nav-link"} onClick={() => setView("My bids")}>
                <span>◇</span> My proposals
              </button>

              <button className={view === "Transactions" ? "campus-nav-link active" : "campus-nav-link"} onClick={() => setView("Transactions")}>
                <span>💳</span> Transactions <b>{transactions.length}</b>
              </button>

              {user.role_flag === "admin" && (
                <button className={view === "Admin" ? "campus-nav-link active" : "campus-nav-link"} onClick={() => setView("Admin")}>
                  <span>⚖</span> Admin Panel
                </button>
              )}

              <p className="nav-spacer">ACCOUNT</p>
              <button className={view === "Profile" ? "campus-nav-link active" : "campus-nav-link"} onClick={() => setView("Profile")}>
                <span>◎</span> My profile
              </button>
            </>
          )}
        </div>

        {user ? (
          <div className="campus-side-footer">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, cursor: "pointer", overflow: "hidden" }} onClick={() => setView("Profile")} title="View Profile">
              <div className={`campus-avatar ${user.avatar_color}`}>{initials}</div>
              <div style={{ overflow: "hidden" }}>
                <strong style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{user.name}</strong>
                <small>{user.department}</small>
              </div>
            </div>
            <button
              onClick={() => {
                handleSetUser(null);
                showNotice("Logged out successfully.");
              }}
              style={{ color: "#b91c1c", fontWeight: 700, fontSize: "10px", padding: "4px 8px" }}
              title="Log Out"
            >
              Exit
            </button>
          </div>
        ) : (
          <div className="campus-side-footer" style={{ flexDirection: "column", alignItems: "stretch", gap: "8px" }}>
            <button className="action-btn primary" onClick={() => setModal("register")}>
              Sign Up Free
            </button>
            <button className="action-btn" onClick={() => setModal("login")}>
              Sign In
            </button>
          </div>
        )}
      </aside>

      <section className="campus-content">
        <header className="campus-header">
          <div className="mobile-brand">✦ CampusGigs</div>

          <div className="campus-search">
            <span>⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search gigs, skills, or students..."
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ background: "none", border: 0, color: "#999", fontSize: "14px", padding: "0 4px" }}
              >
                ×
              </button>
            )}
          </div>

          <div className="header-actions">
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div className="header-user" onClick={() => setView("Profile")} style={{ cursor: "pointer" }} title="View Profile">
                  <span className={`campus-avatar ${user.avatar_color}`}>{initials}</span>
                  <span>
                    <strong>{user.name}</strong>
                    <small>{user.role_flag === "admin" ? "System Admin" : user.department}</small>
                  </span>
                </div>
                <button
                  className="action-btn danger"
                  onClick={() => {
                    handleSetUser(null);
                    showNotice("Logged out successfully.");
                  }}
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="action-btn" onClick={() => setModal("login")}>
                  Sign In
                </button>
                <button className="action-btn primary" onClick={() => setModal("register")}>
                  Register
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="campus-main">
          {!user && (
            <div className="guest-hero-banner">
              <div>
                <h2>Welcome to CampusGigs ✦</h2>
                <p>The exclusive marketplace for university students to offer services, find gig help, and earn on campus.</p>
              </div>
              <div className="guest-actions">
                <button className="action-btn primary" onClick={() => setModal("register")}>
                  Join Campus Market ➔
                </button>
              </div>
            </div>
          )}

          <div className="hero-row">
            <div>
              <p className="overline">
                CAMPUS MARKETPLACE{" "}
                <span className={connected ? "online" : "offline"}>
                  ● {connected ? "LIVE" : "CONNECTING..."}
                </span>
              </p>
              <h1>
                Find your next <em>opportunity.</em>
              </h1>
              <p className="hero-copy">A trusted place for students to exchange skills, build experience, and get things done together.</p>
            </div>

            <button className="post-button" onClick={() => (user ? setModal("post") : setModal("login"))}>
              ＋ Post a gig
            </button>
          </div>

          {view === "Discover" && (
            <>
              <div className="market-stats">
                <div>
                  <span>Open gigs</span>
                  <strong>{loadingGigs ? "—" : stats.open_count}</strong>
                  <small>↗ Available on campus</small>
                </div>
                <div>
                  <span>Completed locally</span>
                  <strong>{loadingGigs ? "—" : stats.completed_count}</strong>
                  <small>↗ Track record so far</small>
                </div>
                <div>
                  <span>Total gigs posted</span>
                  <strong>{loadingGigs ? "—" : stats.total}</strong>
                  <small>Across departments</small>
                </div>
                <div className="stats-art">
                  <span>✦</span>
                  <span>↗</span>
                  <span>◇</span>
                </div>
              </div>

              <div className="browse-heading">
                <div>
                  <h2>Browse gigs</h2>
                  <p>Opportunities posted by students in your university community.</p>
                </div>
              </div>

              <div className="browse-controls">
                <div className="status-tabs">
                  {["Open", "In Progress", "Completed", "All"].map((item) => (
                    <button key={item} className={status === item ? "selected" : ""} onClick={() => setStatus(item)}>
                      {item}
                    </button>
                  ))}
                </div>

                <select value={skillFilter} onChange={(e) => setSkillFilter(Number(e.target.value))}>
                  <option value={0}>All skill categories</option>
                  {skills.map((skill) => (
                    <option value={skill.skill_id} key={skill.skill_id}>
                      {skill.skill_name}
                    </option>
                  ))}
                </select>
              </div>

              {loadingGigs ? (
                <div className="gig-grid">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div className="gig-card gig-card-skeleton" key={i}>
                      <div className="skeleton-line skeleton-badge" />
                      <div className="skeleton-line skeleton-title" />
                      <div className="skeleton-line skeleton-text" />
                      <div className="skeleton-line skeleton-text short" />
                      <div className="skeleton-line skeleton-footer" />
                    </div>
                  ))}
                </div>
              ) : gigsError ? (
                <div className="empty-state">
                  <span>⚠</span>
                  <h3>Couldn&apos;t load gigs</h3>
                  <p>The marketplace server didn&apos;t respond. Check your connection and try again.</p>
                  <button className="action-btn primary" onClick={() => void loadGigs()} style={{ marginTop: "12px" }}>
                    Retry
                  </button>
                </div>
              ) : (
                <div className="gig-grid">
                  {filteredGigs.length ? (
                    filteredGigs.map((gig) => (
                      <article className="gig-card" key={gig.gig_id} onClick={() => void openGig(gig)}>
                        <div className="gig-card-top">
                          <span className={`gig-symbol ${gig.gig_id % 3 === 0 ? "mint" : gig.gig_id % 2 === 0 ? "blue" : "coral"}`}>✦</span>
                          <span className={`gig-status ${gig.status.toLowerCase().replace(" ", "-")}`}>
                            <i />
                            {gig.status}
                          </span>
                        </div>

                        <h3>{gig.title}</h3>
                        <p>{gig.description}</p>

                        <div className="tag-row">
                          {(gig.skills ?? "General")
                            .split(", ")
                            .slice(0, 3)
                            .map((tag) => (
                              <button
                                key={tag}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const found = skills.find((s) => s.skill_name.toLowerCase() === tag.toLowerCase());
                                  if (found) setSkillFilter(found.skill_id);
                                  else setSearch(tag);
                                }}
                                title={`Filter by ${tag}`}
                              >
                                {tag}
                              </button>
                            ))}
                        </div>

                        <div className="gig-card-footer">
                          <div className="client-line">
                            <span className="small-avatar">{gig.client_name.split(" ").map((w) => w[0]).join("")}</span>
                            <div>
                              <strong>{gig.client_name}</strong>
                              <small>{gig.department}</small>
                            </div>
                          </div>

                          <div className="gig-meta">
                            <strong>${gig.budget}</strong>
                            <small>due {gig.deadline.replace(", 2026", "")}</small>
                          </div>
                        </div>

                        <div className="bid-count">
                          {gig.bid_count} proposal{Number(gig.bid_count) === 1 ? "" : "s"} <span>→</span>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="empty-state">
                      <span>⌁</span>
                      <h3>No gigs found matching criteria</h3>
                      <p>Try clearing filters or searching another term.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {view === "My gigs" && user && (
            loadingUserData ? (
              <SubpageSkeleton />
            ) : (
              <MyGigs
                gigs={myGigs.length ? myGigs : gigs.filter((gig) => gig.client_id === user.user_id)}
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
                onViewProfile={openUserProfile}
                request={request}
              />
            )
          )}

          {view === "My bids" && user && (
            loadingUserData ? (
              <SubpageSkeleton />
            ) : (
              <MyBids
                bids={myBids}
                onNotice={showNotice}
                onDeleteBid={(bidId) => void handleDeleteBid(bidId)}
                onDeliver={async (gigId) => {
                  await request("update_status", { gig_id: gigId, status: "Submitted" });
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
            )
          )}

          {view === "Transactions" && user && (
            loadingUserData ? <SubpageSkeleton /> : <TransactionsView transactions={transactions} user={user} />
          )}

          {view === "Admin" && user && user.role_flag === "admin" && (
            loadingUserData ? (
              <SubpageSkeleton />
            ) : (
              <AdminPanel
                disputes={disputes}
                topFreelancers={topFreelancers}
                onResolve={async (disputeId, resolution) => {
                  await request("resolve_dispute", { dispute_id: disputeId, resolution });
                }}
              />
            )
          )}

          {view === "Profile" && user && (
            <Profile
              user={user}
              skills={user.skills && user.skills.length ? user.skills : skills.slice(0, 3)}
              onEditSkills={() => setModal("skills")}
            />
          )}

          <footer className="campus-footer">
            <span>
              <i className={connected ? "footer-dot live" : "footer-dot"} />{" "}
              {connected ? `Connected to Live Backend (${API})` : "Connecting to backend..."}
            </span>
            <span>Built for CSE-311 · CampusGigs</span>
          </footer>
        </div>
      </section>

      {modal === "login" && (
        <Modal title="Sign In to CampusGigs" close={() => setModal(null)}>
          <form className="modal-form" onSubmit={submitLogin}>
            <label>
              Student Email
              <input name="email" type="email" required placeholder="student@campus.edu" />
            </label>
            <label>
              Password
              <input name="password" type="password" required placeholder="••••••••" />
            </label>

            <button className="modal-submit primary">
              Sign In <span>→</span>
            </button>

            <p className="modal-help">
              Don&apos;t have an account?{" "}
              <a
                href="#register"
                onClick={(e) => {
                  e.preventDefault();
                  setModal("register");
                }}
                style={{ color: "var(--coral)", fontWeight: 700 }}
              >
                Register here
              </a>
            </p>
          </form>
        </Modal>
      )}

      {modal === "register" && (
        <Modal title="Register Student Account" close={() => setModal(null)}>
          <form className="modal-form" onSubmit={submitRegister}>
            <label>
              Full Name
              <input name="name" required placeholder="e.g., Tanvir Ahmed" />
            </label>
            <label>
              Campus Email
              <input name="email" type="email" required placeholder="tanvir@campus.edu" />
            </label>

            <div className="form-split">
              <label>
                Department
                <input name="department" required placeholder="Computer Science" />
              </label>
              <label>
                Graduation Batch Year
                <input name="batch" type="number" min="2020" max="2030" required defaultValue="2026" />
              </label>
            </div>

            <label>
              Password
              <input name="password" type="password" required placeholder="Create a secure password" />
            </label>

            <button className="modal-submit primary">
              Create Account <span>→</span>
            </button>
          </form>
        </Modal>
      )}

      {modal === "post" && (
        <Modal title="Post a new gig" close={() => setModal(null)}>
          <form className="modal-form" onSubmit={submitPost}>
            <label>
              Gig title
              <input name="title" required placeholder="What do you need help with?" />
            </label>

            <label>
              Description
              <textarea name="description" required placeholder="Describe the work, deliverables, and context..." rows={4} />
            </label>

            <div className="form-split">
              <label>
                Budget (USD)
                <input name="budget" type="number" min="1" required placeholder="50" />
              </label>
              <label>
                Deadline
                <input name="deadline" type="date" required />
              </label>
            </div>

            <label>
              Required Skills (Select one or more)
              <div className="skills-checkbox-grid">
                {skills.map((skill) => (
                  <label key={skill.skill_id} className="skill-checkbox-item">
                    <input type="checkbox" name="skills" value={skill.skill_id} />
                    <span>{skill.skill_name}</span>
                  </label>
                ))}
              </div>
            </label>

            <button className="modal-submit primary">
              Publish Gig <span>→</span>
            </button>
          </form>
        </Modal>
      )}

      {modal === "edit" && editingGig && (
        <Modal title="Edit Gig" close={() => { setModal(null); setEditingGig(null); }}>
          <form className="modal-form" onSubmit={submitEditGig}>
            <label>
              Gig title
              <input name="title" required defaultValue={editingGig.title} />
            </label>

            <label>
              Description
              <textarea name="description" required defaultValue={editingGig.description} rows={4} />
            </label>

            <div className="form-split">
              <label>
                Budget (USD)
                <input name="budget" type="number" min="1" required defaultValue={editingGig.budget} />
              </label>
              <label>
                Deadline
                <input name="deadline" type="date" required />
              </label>
            </div>

            <label>
              Required Skills (Select one or more)
              <div className="skills-checkbox-grid">
                {skills.map((skill) => (
                  <label key={skill.skill_id} className="skill-checkbox-item">
                    <input
                      type="checkbox"
                      name="skills"
                      value={skill.skill_id}
                      defaultChecked={(editingGig.skills || "").toLowerCase().includes(skill.skill_name.toLowerCase())}
                    />
                    <span>{skill.skill_name}</span>
                  </label>
                ))}
              </div>
            </label>

            <button className="modal-submit primary">
              Save Changes <span>→</span>
            </button>
          </form>
        </Modal>
      )}

      {modal === "bid" && selectedGig && (
        <Modal title="Send a proposal" close={() => setModal(null)}>
          <p className="modal-context">
            You&apos;re applying for <strong>{selectedGig.title}</strong>
          </p>

          <form className="modal-form" onSubmit={submitBid}>
            <label>
              Your price (USD)
              <input name="price" type="number" min="1" defaultValue={selectedGig.budget} required />
            </label>
            <label>
              Message to the client
              <textarea name="message" required rows={5} placeholder="Introduce yourself and explain why you're a good fit..." />
            </label>

            <button className="modal-submit primary">
              Submit proposal <span>→</span>
            </button>
          </form>
        </Modal>
      )}

      {modal === "review" && reviewGig && (
        <Modal title="Leave a review" close={() => setModal(null)}>
          <p className="modal-context">
            Reviewing work for <strong>{reviewGig.title}</strong>
          </p>

          <form className="modal-form" onSubmit={submitReview}>
            <label>Rating</label>
            <div className="rating-select">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  className={`rating-star ${star <= rating ? "filled" : ""}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>

            <label>
              Comment / Feedback
              <textarea name="comment" required rows={4} placeholder="Share how the collaboration went..." />
            </label>

            <button className="modal-submit primary">
              Publish Review <span>→</span>
            </button>
          </form>
        </Modal>
      )}

      {modal === "dispute" && disputeGig && (
        <Modal title="Raise a dispute" close={() => setModal(null)}>
          <p className="modal-context">
            Reporting issue on <strong>{disputeGig.title}</strong>
          </p>

          <form className="modal-form" onSubmit={submitDispute}>
            <label>
              Reason for dispute
              <textarea name="reason" required rows={5} placeholder="Describe the issue or disagreement in detail..." />
            </label>

            <button className="modal-submit danger">
              Submit Dispute to Admin <span>→</span>
            </button>
          </form>
        </Modal>
      )}

      {modal === "skills" && user && (
        <Modal title="Manage Your Skills" close={() => setModal(null)}>
          <form className="modal-form" onSubmit={submitSkills}>
            <p className="modal-context">Select the skill categories you offer to clients on campus.</p>
            <div className="skills-checkbox-grid">
              {skills.map((skill) => (
                <label key={skill.skill_id} className="skill-checkbox-item">
                  <input
                    type="checkbox"
                    name="skills"
                    value={skill.skill_id}
                    defaultChecked={user.skills?.some((s) => s.skill_id === skill.skill_id)}
                  />
                  <span>{skill.skill_name}</span>
                </label>
              ))}
            </div>
            <button className="modal-submit primary">
              Save Skills <span>→</span>
            </button>
          </form>
        </Modal>
      )}

      {modal === "profile" && user && (
        <Modal title="Your student profile" close={() => setModal(null)}>
          <Profile user={user} skills={user.skills && user.skills.length ? user.skills : skills.slice(0, 3)} compact />
        </Modal>
      )}

      {modal === "user_profile" && viewingProfileUser && (
        <Modal title={`${viewingProfileUser.name}'s Profile`} close={() => setModal(null)}>
          <div className="profile-hero" style={{ marginBottom: "16px" }}>
            <div className={`profile-avatar ${viewingProfileUser.avatar_color || "coral"}`}>
              {getInitials(viewingProfileUser.name)}
            </div>
            <div>
              <p className="overline">VERIFIED STUDENT · BATCH {viewingProfileUser.batch || 2026}</p>
              <h2>{viewingProfileUser.name}</h2>
              <p>{viewingProfileUser.department} · Campus Member</p>
            </div>
            <span className="verified">✓ Verified</span>
          </div>

          <div className="profile-fields" style={{ marginBottom: "16px" }}>
            <div>
              <small>Campus Email</small>
              <strong>
                <a href={`mailto:${viewingProfileUser.email}`} style={{ color: "var(--coral)", textDecoration: "none" }}>
                  ✉️ {viewingProfileUser.email}
                </a>
              </strong>
            </div>
            <div>
              <small>Student Reputation</small>
              <strong>
                {Number(viewingProfileUser.average_rating || 5.0).toFixed(1)} <span className="stars">★★★★★</span>
              </strong>
            </div>
            <div>
              <small>Gigs Completed</small>
              <strong>{viewingProfileUser.completed_gigs ?? 0} finished</strong>
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <small style={{ color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.08em" }}>
              Offered Skills
            </small>
            <div className="bid-skills-tags" style={{ marginTop: "6px" }}>
              {viewingProfileUser.skills && viewingProfileUser.skills.length > 0 ? (
                viewingProfileUser.skills.map((s) => (
                  <span key={s.skill_id} style={{ fontSize: "11px", padding: "4px 8px" }}>
                    {s.skill_name}
                  </span>
                ))
              ) : (
                <p style={{ fontSize: "12px", color: "var(--muted)" }}>No skills listed yet.</p>
              )}
            </div>
          </div>

          {viewingProfileUser.reviews && viewingProfileUser.reviews.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <small style={{ color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", fontSize: "10px", letterSpacing: "0.08em" }}>
                Client Reviews ({viewingProfileUser.reviews.length})
              </small>
              <div style={{ display: "grid", gap: "8px", marginTop: "8px", maxHeight: "180px", overflowY: "auto" }}>
                {viewingProfileUser.reviews.map((r, i) => (
                  <div key={i} className="review-card" style={{ padding: "10px 14px" }}>
                    <div className="review-card-top" style={{ marginBottom: "4px" }}>
                      <strong>{r.reviewer_name}</strong>
                      <span style={{ color: "#f59e0b" }}>{"★".repeat(r.rating)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "11px" }}>&ldquo;{r.comment}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
            <a
              href={`mailto:${viewingProfileUser.email}`}
              className="action-btn primary"
              style={{ flex: 1, textDecoration: "none", textAlign: "center" }}
            >
              ✉️ Send Email to {viewingProfileUser.name.split(" ")[0]}
            </a>
            <button className="action-btn" onClick={() => setModal(null)}>
              Close
            </button>
          </div>
        </Modal>
      )}

      {selectedGig && !modal && (
        <GigDrawer
          gig={selectedGig}
          bids={bids}
          reviews={gigReviews}
          user={user}
          onClose={() => setSelectedGig(null)}
          onBid={() => (user ? setModal("bid") : setModal("login"))}
          onReview={(gig) => {
            setReviewGig(gig);
            setModal("review");
          }}
          onViewProfile={openUserProfile}
          request={request}
        />
      )}

      {notice && (
        <div className="toast">
          {notice}
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}
    </main>
  );
}

function SubpageSkeleton() {
  return (
    <div className="subpage">
      <div className="skeleton-line skeleton-title" style={{ width: "180px", height: "22px", marginBottom: "20px" }} />
      <div className="simple-list">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="simple-row skeleton-row" key={i}>
            <div className="skeleton-line skeleton-badge" />
            <div style={{ flex: 1 }}>
              <div className="skeleton-line skeleton-text" />
              <div className="skeleton-line skeleton-text short" />
            </div>
          </div>
        ))}
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
  onViewProfile,
  request,
}: {
  gigs: Gig[];
  onOpen: (gig: Gig) => void;
  onEdit: (gig: Gig) => void;
  onDelete: (gigId: number) => void;
  onReview: (gig: Gig) => void;
  onDispute: (gig: Gig) => void;
  onViewProfile?: (userId: number) => void;
  request: (action: string, body?: Record<string, unknown>) => Promise<unknown>;
}) {
  return (
    <div className="subpage">
      <p className="overline">CLIENT WORKSPACE</p>
      <h2>My posted gigs</h2>
      <p className="page-copy">Manage your requests and choose the right student for the job.</p>

      <div className="simple-list">
        {gigs.length ? (
          gigs.map((gig) => (
            <div className="simple-row" key={gig.gig_id}>
              <span className="gig-symbol coral">✦</span>
              <div style={{ cursor: "pointer" }} onClick={() => onOpen(gig)}>
                <strong>{gig.title}</strong>
                <small>
                  {gig.bid_count} proposal{Number(gig.bid_count) === 1 ? "" : "s"} · due {gig.deadline}
                </small>
                {gig.accepted_freelancer_name && (
                  <div className="accepted-contact-chip">
                    <span>Freelancer: <strong>{gig.accepted_freelancer_name}</strong></span>
                    {gig.accepted_freelancer_email && (
                      <a href={`mailto:${gig.accepted_freelancer_email}`} className="email-chip" title="Send email">
                        ✉️ {gig.accepted_freelancer_email}
                      </a>
                    )}
                    {gig.accepted_freelancer_id && onViewProfile && (
                      <button
                        className="text-chip-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewProfile(gig.accepted_freelancer_id!);
                        }}
                      >
                        View Profile ➔
                      </button>
                    )}
                  </div>
                )}
              </div>
              <b>${gig.budget}</b>
              <em>{gig.status}</em>

              <div style={{ display: "flex", gap: "6px" }}>
                {gig.status === "Open" && (
                  <>
                    <button
                      className="action-btn"
                      onClick={() => onEdit(gig)}
                      style={{ background: "#f3f4f6", border: 0, padding: "4px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="action-btn danger"
                      onClick={() => void request("update_status", { gig_id: gig.gig_id, status: "Cancelled" })}
                      style={{ background: "#fee2e2", color: "#dc2626", border: 0, padding: "4px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </>
                )}

                <button
                  className="action-btn danger"
                  onClick={() => onDelete(gig.gig_id)}
                  style={{ background: "#fee2e2", color: "#dc2626", border: 0, padding: "4px 8px", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
                >
                  🗑️ Delete
                </button>

                {(gig.status === "In Progress" || gig.status === "Submitted") && (
                  <button className="action-btn secondary" onClick={() => void request("update_status", { gig_id: gig.gig_id, status: "Completed" })}>
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
          <EmptyView title="No posted gigs yet" copy="Post a gig and find talented students on campus." icon="＋" />
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
  return (
    <div className="subpage">
      <p className="overline">FREELANCER WORKSPACE</p>
      <h2>My proposals</h2>
      <p className="page-copy">Track the opportunities you&apos;ve applied for and manage active assignments.</p>

      <div className="proposal-summary">
        <strong>{bids.length}</strong>
        <span>active proposals</span>
        <strong>${bids.reduce((sum, b) => sum + Number(b.proposed_price || 0), 0)}</strong>
        <span>potential earnings</span>
      </div>

      <div className="simple-list">
        {bids.length ? (
          bids.map((bid) => (
            <div className="simple-row" key={bid.bid_id} style={{ flexDirection: "column", alignItems: "stretch", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span className="gig-symbol blue">✦</span>
                <div style={{ flex: 1 }}>
                  <strong>{bid.gig_title || `Gig #${bid.gig_id}`}</strong>
                  <small>Client: {bid.client_name || "Campus Client"}{bid.gig_status ? ` · Gig Status: ${bid.gig_status}` : ""}</small>
                </div>
                <b>${bid.proposed_price}</b>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <em className={`proposal-${bid.status.toLowerCase()}`}>{bid.status}</em>

                  {bid.status === "Pending" && (
                    <button
                      style={{ background: "#fee2e2", color: "#dc2626", border: 0, padding: "4px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, cursor: "pointer" }}
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
                    <span style={{ fontSize: "9px", fontStyle: "italic", color: "#4f46e5" }}>
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

              {bid.status === "Accepted" && (
                <div className="accepted-contact-banner" style={{ margin: "4px 0 0" }}>
                  <div>
                    <strong>🎉 Proposal Accepted!</strong>
                    <p>Client: <strong>{bid.client_name}</strong> {bid.client_department ? `(${bid.client_department})` : ""}</p>
                  </div>
                  {bid.client_email && (
                    <a href={`mailto:${bid.client_email}`} className="email-chip">
                      ✉️ Contact Client ({bid.client_email})
                    </a>
                  )}
                </div>
              )}
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
            <b>$0</b>
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
  const isClient = (t: Transaction) => t.client_id === user.user_id;
  const totalPaid = transactions
    .filter(isClient)
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalEarned = transactions
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
          <strong>{transactions.length}</strong>
        </div>
        <div className="tx-summary-card">
          <small>Total Payments Made</small>
          <strong style={{ color: "#dc2626" }}>${totalPaid.toFixed(2)}</strong>
        </div>
        <div className="tx-summary-card">
          <small>Total Earnings Received</small>
          <strong style={{ color: "#16a34a" }}>${totalEarned.toFixed(2)}</strong>
        </div>
      </div>

      <div className="tx-table-wrap">
        {transactions.length > 0 ? (
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
              {transactions.map((tx) => {
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
                      <span style={{ fontSize: "10px", fontWeight: 700, color: clientRole ? "#dc2626" : "#16a34a" }}>
                        {clientRole ? "Payer (Client)" : "Earner (Freelancer)"}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: "12px" }}>${tx.amount}</strong>
                    </td>
                    <td>
                      <span className={`tx-badge ${tx.payment_status.toLowerCase()}`}>
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
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
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
  onResolve,
}: {
  disputes: Dispute[];
  topFreelancers: TopFreelancer[];
  onResolve: (disputeId: number, resolution: string) => void;
}) {
  const [resolutionText, setResolutionText] = useState("");
  return (
    <div className="subpage">
      <p className="overline">ADMINISTRATION</p>
      <h2>Dispute Resolution & Platform Metrics</h2>
      <p className="page-copy">Manage platform disputes and view top-performing campus freelancers.</p>

      <div className="admin-columns">
        <div className="admin-box">
          <h3>Active Disputes ({disputes.length})</h3>
          {disputes.length ? (
            disputes.map((dispute) => (
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
                      style={{ flex: 1, padding: "6px", fontSize: "10px", border: "1px solid var(--line)" }}
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
              </div>
            ))
          ) : (
            <p className="muted-copy">No active disputes reported.</p>
          )}
        </div>

        <div className="admin-box">
          <h3>Top Freelancers Leaderboard</h3>
          {topFreelancers.length ? (
            topFreelancers.map((tf, index) => (
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
            <p className="muted-copy">No freelancer activity recorded yet.</p>
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
  return (
    <div className={compact ? "profile-card compact-profile" : "subpage profile-page"}>
      <div className="profile-hero">
        <div className={`profile-avatar ${user.avatar_color}`}>{user.name.split(" ").map((p) => p[0]).join("")}</div>
        <div>
          <p className="overline">
            VERIFIED {user.role_flag.toUpperCase()} · BATCH {user.batch}
          </p>
          <h2>{user.name}</h2>
          <p>{user.department} · Campus community member</p>
        </div>
        <span className="verified">✓ Verified</span>
      </div>

      <div className="profile-fields">
        <div>
          <small>Email</small>
          <strong>{user.email}</strong>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
            <small style={{ margin: 0 }}>Registered Skills</small>
            {onEditSkills && !compact && (
              <button
                onClick={onEditSkills}
                style={{ background: "none", border: 0, color: "var(--coral)", fontSize: "10px", fontWeight: 700, cursor: "pointer", padding: 0 }}
              >
                ✏️ Edit Skills
              </button>
            )}
          </div>
          <strong>
            {skills && skills.length
              ? skills.map((s) => s.skill_name).join(" · ")
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
  onClose,
  onBid,
  onReview,
  onViewProfile,
  request,
}: {
  gig: Gig;
  bids: Bid[];
  reviews: Review[];
  user: User | null;
  onClose: () => void;
  onBid: () => void;
  onReview?: (gig: Gig) => void;
  onViewProfile?: (userId: number) => void;
  request: (action: string, body?: Record<string, unknown>) => Promise<unknown>;
}) {
  const isOwner = user && gig.client_id === user.user_id;
  const isAcceptedFreelancer = user && gig.accepted_freelancer_id === user.user_id;

  return (
    <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="gig-drawer">
        <button className="drawer-close" onClick={onClose}>
          ×
        </button>
        <p className="overline">GIG DETAILS · {gig.status.toUpperCase()}</p>
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
          <span className="small-avatar">{gig.client_name.split(" ").map((w) => w[0]).join("")}</span>
          <div>
            <small>Posted by</small>
            <strong>{gig.client_name}</strong>
            <span>{gig.department}</span>
          </div>
        </div>

        {isAcceptedFreelancer && (
          <div className="accepted-contact-banner" style={{ margin: "14px 0" }}>
            <div>
              <strong>🎉 Your Proposal Was Accepted!</strong>
              <p>Client: <strong>{gig.client_name}</strong></p>
            </div>
            {gig.client_email && (
              <a href={`mailto:${gig.client_email}`} className="email-chip">
                ✉️ Email Client ({gig.client_email})
              </a>
            )}
          </div>
        )}

        {isOwner && (
          <>
            <h3>
              Proposals <span>{bids.length}</span>
            </h3>
            <div className="bid-list">
              {bids.length ? (
                bids.map((bid) => (
                  <div className="bid-row" key={bid.bid_id} style={{ flexDirection: "column", alignItems: "stretch", gap: "8px", padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div
                        style={{ display: "flex", alignItems: "center", gap: "10px", cursor: onViewProfile ? "pointer" : "default" }}
                        onClick={() => onViewProfile && onViewProfile(bid.freelancer_id)}
                        title="View Applicant Profile"
                      >
                        <div className={`small-avatar ${bid.avatar_color || "coral"}`}>
                          {getInitials(bid.freelancer_name)}
                        </div>
                        <div>
                          <strong style={{ color: "var(--navy)", display: "flex", alignItems: "center", gap: "6px" }}>
                            {bid.freelancer_name}
                            {bid.freelancer_rating && (
                              <span style={{ color: "#f59e0b", fontSize: "11px", fontWeight: 700 }}>
                                {Number(bid.freelancer_rating).toFixed(1)} ★
                              </span>
                            )}
                          </strong>
                          <small style={{ color: "var(--muted)", fontSize: "10px" }}>
                            {bid.department}{bid.batch ? ` · Batch ${bid.batch}` : ""}
                          </small>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <b style={{ fontSize: "14px", color: "var(--ink)" }}>${bid.proposed_price}</b>
                        <span className={`proposal-${bid.status.toLowerCase()}`} style={{ display: "block", fontSize: "9px", marginTop: "2px" }}>
                          {bid.status}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: "12px", color: "var(--ink-secondary)", margin: "4px 0", background: "#f8fafc", padding: "8px 12px", borderRadius: "6px" }}>
                      &ldquo;{bid.message}&rdquo;
                    </p>

                    {bid.skills && bid.skills.length > 0 && (
                      <div className="bid-skills-tags">
                        {bid.skills.map((sk) => (
                          <span key={sk}>{sk}</span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px", gap: "8px" }}>
                      {onViewProfile && (
                        <button
                          className="action-btn"
                          style={{ fontSize: "11px", padding: "4px 10px", background: "#fff" }}
                          onClick={() => onViewProfile(bid.freelancer_id)}
                        >
                          👤 View Profile
                        </button>
                      )}

                      {bid.status === "Pending" && (
                        <button className="action-btn primary" onClick={() => void request("accept_bid", { bid_id: bid.bid_id })}>
                          Accept Proposal ➔
                        </button>
                      )}
                    </div>

                    {bid.status === "Accepted" && (
                      <div className="accepted-contact-banner" style={{ margin: "6px 0 0" }}>
                        <div>
                          <strong>✓ Accepted Freelancer</strong>
                          <p>Contact: <strong>{bid.freelancer_email || "Email verified"}</strong></p>
                        </div>
                        {bid.freelancer_email && (
                          <a href={`mailto:${bid.freelancer_email}`} className="email-chip">
                            ✉️ Send Email
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="muted-copy">No proposals submitted yet.</p>
              )}
            </div>
          </>
        )}

        {!isOwner && gig.status === "Open" && (
          <button className="drawer-cta" onClick={onBid}>
            Submit a proposal <span>→</span>
          </button>
        )}

        {user && gig.status === "Completed" && (user.user_id === gig.client_id || user.user_id === gig.accepted_freelancer_id) && onReview && (
          <button
            className="drawer-cta"
            style={{ marginTop: "12px", background: "linear-gradient(135deg, #10b981, #059669)" }}
            onClick={() => onReview(gig)}
          >
            ★ Leave a Review for this Gig
          </button>
        )}

        {reviews.length > 0 && (
          <div style={{ marginTop: "24px" }}>
            <h3>Reviews & Feedback</h3>
            {reviews.map((r) => (
              <div key={r.review_id} className="review-card">
                <div className="review-card-top">
                  <strong>{r.reviewer_name}</strong>
                  <span>{"★".repeat(r.rating)}</span>
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

function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
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
