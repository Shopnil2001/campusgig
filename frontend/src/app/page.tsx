"use client";

import { FormEvent, useEffect, useState } from "react";

type User = {
  user_id: number;
  name: string;
  email: string;
  department: string;
  batch: number;
  role_flag: "student" | "admin";
  avatar_color: string;
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
};

type Bid = {
  bid_id: number;
  gig_id: number;
  freelancer_id: number;
  freelancer_name: string;
  department: string;
  proposed_price: string;
  message: string;
  status: string;
  avatar_color: string;
  gig_title?: string;
  client_name?: string;
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

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost/311-peoject/backend/api";

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

export default function Home() {
  const [user, setUser] = useState<User>(demoUsers[0]);
  const [gigs, setGigs] = useState<Gig[]>(demoGigs);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [skills, setSkills] = useState<Skill[]>(demoSkills);
  const [stats, setStats] = useState({ total: 12, open_count: 8, completed_count: 4, completion_rate: 33 });
  const [view, setView] = useState("Discover");
  const [status, setStatus] = useState("Open");
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState(0);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [gigReviews, setGigReviews] = useState<Review[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [topFreelancers, setTopFreelancers] = useState<TopFreelancer[]>([]);
  const [modal, setModal] = useState<"post" | "bid" | "profile" | "review" | "dispute" | "login" | "register" | null>(null);
  const [reviewGig, setReviewGig] = useState<Gig | null>(null);
  const [disputeGig, setDisputeGig] = useState<Gig | null>(null);
  const [rating, setRating] = useState(5);
  const [notice, setNotice] = useState("");
  const [connected, setConnected] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  async function loadGigs() {
    try {
      const response = await fetch(
        `${API}/index.php?action=dashboard&status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}&skill_id=${skillFilter}`
      );
      if (!response.ok) throw new Error();
      const data = await response.json();
      setGigs(data.gigs);
      setSkills(data.skills);
      setStats(data.stats);
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }

  async function loadUserData() {
    if (!connected) return;
    try {
      const myGigsRes = await fetch(`${API}/index.php?action=my_gigs&user_id=${user.user_id}`);
      if (myGigsRes.ok) {
        const data = await myGigsRes.json();
        if (data.gigs) setGigs(data.gigs);
      }
      const myBidsRes = await fetch(`${API}/index.php?action=my_bids&user_id=${user.user_id}`);
      if (myBidsRes.ok) {
        const data = await myBidsRes.json();
        if (data.bids) setMyBids(data.bids);
      }
      if (user.role_flag === "admin") {
        const adminRes = await fetch(`${API}/index.php?action=admin&user_id=${user.user_id}`);
        if (adminRes.ok) {
          const data = await adminRes.json();
          if (data.disputes) setDisputes(data.disputes);
          if (data.top_freelancers) setTopFreelancers(data.top_freelancers);
        }
      }
    } catch {
      // Fallback
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadGigs();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [status, skillFilter]);

  useEffect(() => {
    if (view === "My gigs" || view === "My bids" || view === "Admin") {
      void loadUserData();
    }
  }, [view, user]);

  async function request(action: string, body?: Record<string, unknown>) {
    try {
      const response = await fetch(`${API}/index.php?action=${action}`, {
        method: body ? "POST" : "GET",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify({ ...body, user_id: user.user_id }) : undefined,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      showNotice(data.message ?? "Action completed");
      void loadGigs();
      void loadUserData();
      return data;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Demo mode active";
      showNotice(connected ? errMsg : "Demo mode active: connect database to enable live API persistence.");
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
      }
    } catch {
      setBids([]);
      setGigReviews([]);
    }
  }

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await request("create_gig", {
      title: form.get("title"),
      description: form.get("description"),
      budget: form.get("budget"),
      deadline: form.get("deadline"),
      skills: [Number(form.get("skill"))],
    });
    if (result) {
      setModal(null);
      void loadGigs();
    }
  }

  async function submitBid(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    const result = await request("login", {
      email: form.get("email"),
      password: form.get("password"),
    });
    if (result && result.user) {
      setUser(result.user);
      setModal(null);
      showNotice(`Welcome back, ${result.user.name}!`);
    }
  }

  async function submitRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = await request("register", {
      name: form.get("name"),
      email: form.get("email"),
      department: form.get("department"),
      batch: Number(form.get("batch")),
      password: form.get("password"),
    });
    if (result && result.user) {
      setUser(result.user);
      setModal(null);
      showNotice(`Account registered! Welcome to CampusGigs, ${result.user.name}!`);
    }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reviewGig) return;
    const form = new FormData(event.currentTarget);
    const result = await request("review", {
      gig_id: reviewGig.gig_id,
      reviewee_id: reviewGig.client_id === user.user_id ? 3 : reviewGig.client_id,
      rating: rating,
      comment: form.get("comment"),
    });
    if (result) {
      setModal(null);
      setReviewGig(null);
    }
  }

  async function submitDispute(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!disputeGig) return;
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

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  const filteredGigs = gigs.filter((gig) =>
    `${gig.title} ${gig.description} ${gig.skills ?? ""}`.toLowerCase().includes(search.toLowerCase())
  );

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
          <button className={view === "My gigs" ? "campus-nav-link active" : "campus-nav-link"} onClick={() => setView("My gigs")}>
            <span>▣</span> My gigs <b>{gigs.filter((g) => g.client_id === user.user_id).length}</b>
          </button>
          <button className={view === "My bids" ? "campus-nav-link active" : "campus-nav-link"} onClick={() => setView("My bids")}>
            <span>◇</span> My proposals
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
        </div>
        <div className="campus-side-footer">
          <div className={`campus-avatar ${user.avatar_color}`}>{initials}</div>
          <div>
            <strong>{user.name}</strong>
            <small>{user.department}</small>
          </div>
        </div>
      </aside>

      <section className="campus-content">
        <header className="campus-header">
          <div className="mobile-brand">✦ CampusGigs</div>
          <div className="campus-search">
            <span>⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void loadGigs()}
              placeholder="Search gigs, skills, or keywords"
            />
          </div>
          <div className="header-actions">
            <button className="action-btn" onClick={() => setModal("login")}>
              Sign In
            </button>
            <button className="action-btn primary" onClick={() => setModal("register")}>
              Register
            </button>

            <div className="user-switcher">
              <button className="header-user" onClick={() => setSwitcherOpen(!switcherOpen)}>
                <span className={`campus-avatar ${user.avatar_color}`}>{initials}</span>
                <span>
                  <strong>{user.name}</strong>
                  <small>{user.role_flag === "admin" ? "System Admin" : "Student account"}</small>
                </span>
                <b>⌄</b>
              </button>

              {switcherOpen && (
                <div className="switcher-menu">
                  <div className="switcher-header">SWITCH TEST ACCOUNT</div>
                  {demoUsers.map((u) => (
                    <button
                      key={u.user_id}
                      className={u.user_id === user.user_id ? "switcher-item active" : "switcher-item"}
                      onClick={() => {
                        setUser(u);
                        setSwitcherOpen(false);
                        showNotice(`Switched active user to ${u.name}`);
                      }}
                    >
                      <span className={`campus-avatar ${u.avatar_color}`}>{u.name.slice(0, 2)}</span>
                      <div>
                        <strong>{u.name}</strong>
                        <small>{u.department}</small>
                      </div>
                      <span className={`role-badge ${u.role_flag}`}>{u.role_flag}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="campus-main">
          <div className="hero-row">
            <div>
              <p className="overline">
                CAMPUS MARKETPLACE <span className={connected ? "online" : "offline"}>● {connected ? "LIVE" : "DEMO MODE"}</span>
              </p>
              <h1>
                Find your next <em>opportunity.</em>
              </h1>
              <p className="hero-copy">A trusted place for students to exchange skills, build experience, and get things done together.</p>
            </div>
            <button className="post-button" onClick={() => setModal("post")}>
              ＋ Post a gig
            </button>
          </div>

          {view === "Discover" && (
            <>
              <div className="market-stats">
                <div>
                  <span>Open gigs</span>
                  <strong>{stats.open_count || 8}</strong>
                  <small>↗ New this week</small>
                </div>
                <div>
                  <span>Completed locally</span>
                  <strong>{stats.completed_count || 4}</strong>
                  <small>↗ 92% satisfaction</small>
                </div>
                <div>
                  <span>Student earners</span>
                  <strong>248</strong>
                  <small>Across campus</small>
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
                  <p>Opportunities posted by people in your campus community.</p>
                </div>
              </div>

              <div className="browse-controls">
                <div className="status-tabs">
                  {["Open", "In Progress", "Completed"].map((item) => (
                    <button key={item} className={status === item ? "selected" : ""} onClick={() => setStatus(item)}>
                      {item}
                    </button>
                  ))}
                </div>
                <select value={skillFilter} onChange={(e) => setSkillFilter(Number(e.target.value))}>
                  <option value={0}>All skills</option>
                  {skills.map((skill) => (
                    <option value={skill.skill_id} key={skill.skill_id}>
                      {skill.skill_name}
                    </option>
                  ))}
                </select>
              </div>

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
                            <span key={tag}>{tag}</span>
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
                    <h3>No gigs found</h3>
                    <p>Try another search or be the first to post this kind of gig.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {view === "My gigs" && (
            <MyGigs
              gigs={gigs.filter((gig) => gig.client_id === user.user_id)}
              onOpen={openGig}
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
          )}

          {view === "My bids" && <MyBids bids={myBids} onNotice={showNotice} />}

          {view === "Admin" && (
            <AdminPanel
              disputes={disputes}
              topFreelancers={topFreelancers}
              onResolve={async (disputeId, resolution) => {
                await request("resolve_dispute", { dispute_id: disputeId, resolution });
              }}
            />
          )}

          {view === "Profile" && <Profile user={user} skills={skills} />}

          <footer className="campus-footer">
            <span>
              <i className={connected ? "footer-dot live" : "footer-dot"} />{" "}
              {connected ? "Connected to CampusGigs API" : "Demo mode · Connect database to enable backend"}
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
              <input name="email" type="email" required placeholder="student@campus.edu" defaultValue="aisha@campus.edu" />
            </label>
            <label>
              Password
              <input name="password" type="password" required placeholder="••••••••" defaultValue="password" />
            </label>
            <button className="modal-submit primary">
              Sign In <span>→</span>
            </button>
            <p className="modal-help">
              Don&apos;t have an account?{" "}
              <a href="#register" onClick={() => setModal("register")} style={{ color: "var(--coral)", fontWeight: 700 }}>
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
              Required skill
              <select name="skill" required>
                {skills.map((skill) => (
                  <option value={skill.skill_id} key={skill.skill_id}>
                    {skill.skill_name}
                  </option>
                ))}
              </select>
            </label>
            <button className="modal-submit">
              Publish gig <span>→</span>
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
            <button className="modal-submit">
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
            <button className="modal-submit">
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

      {modal === "profile" && (
        <Modal title="Your student profile" close={() => setModal(null)}>
          <Profile user={user} skills={skills} compact />
        </Modal>
      )}

      {selectedGig && !modal && (
        <GigDrawer
          gig={selectedGig}
          bids={bids}
          reviews={gigReviews}
          user={user}
          onClose={() => setSelectedGig(null)}
          onBid={() => setModal("bid")}
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

function MyGigs({
  gigs,
  onOpen,
  onReview,
  onDispute,
  request,
}: {
  gigs: Gig[];
  onOpen: (gig: Gig) => void;
  onReview: (gig: Gig) => void;
  onDispute: (gig: Gig) => void;
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
                  {gig.bid_count} proposals · due {gig.deadline}
                </small>
              </div>
              <b>${gig.budget}</b>
              <em>{gig.status}</em>
              <div style={{ display: "flex", gap: "6px" }}>
                {gig.status === "In Progress" && (
                  <button className="action-btn secondary" onClick={() => void request("update_status", { gig_id: gig.gig_id, status: "Completed" })}>
                    Complete
                  </button>
                )}
                {gig.status === "Completed" && (
                  <button className="action-btn primary" onClick={() => onReview(gig)}>
                    Review
                  </button>
                )}
                {gig.status !== "Completed" && gig.status !== "Disputed" && (
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

function MyBids({ bids, onNotice }: { bids: Bid[]; onNotice: (message: string) => void }) {
  return (
    <div className="subpage">
      <p className="overline">FREELANCER WORKSPACE</p>
      <h2>My proposals</h2>
      <p className="page-copy">Track the opportunities you&apos;ve applied for.</p>
      <div className="proposal-summary">
        <strong>{bids.length || 2}</strong>
        <span>active proposals</span>
        <strong>${bids.reduce((sum, b) => sum + Number(b.proposed_price || 0), 0) || 250}</strong>
        <span>potential earnings</span>
      </div>
      <div className="simple-list">
        {bids.length ? (
          bids.map((bid) => (
            <div className="simple-row" key={bid.bid_id}>
              <span className="gig-symbol blue">✦</span>
              <div>
                <strong>{bid.gig_title || `Gig #${bid.gig_id}`}</strong>
                <small>Client: {bid.client_name || "Campus Client"}</small>
              </div>
              <b>${bid.proposed_price}</b>
              <em className={`proposal-${bid.status.toLowerCase()}`}>{bid.status}</em>
            </div>
          ))
        ) : (
          <div
            className="simple-row"
            onClick={() => onNotice("Connect to database to view real proposal status updates.")}
            style={{ cursor: "pointer" }}
          >
            <span className="gig-symbol blue">✦</span>
            <div>
              <strong>Build a responsive portfolio landing page</strong>
              <small>Submitted Aug 09 · Client: Aisha Rahman</small>
            </div>
            <b>$160</b>
            <em className="proposal-pending">Pending</em>
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



function GigDrawer({
  gig,
  bids,
  reviews,
  user,
  onClose,
  onBid,
  request,
}: {
  gig: Gig;
  bids: Bid[];
  reviews: Review[];
  user: User;
  onClose: () => void;
  onBid: () => void;
  request: (action: string, body?: Record<string, unknown>) => Promise<unknown>;
}) {
  const isOwner = gig.client_id === user.user_id;
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

        {isOwner && (
          <>
            <h3>
              Proposals <span>{bids.length}</span>
            </h3>
            <div className="bid-list">
              {bids.length ? (
                bids.map((bid) => (
                  <div className="bid-row" key={bid.bid_id}>
                    <div className="small-avatar">{bid.freelancer_name.split(" ").map((w) => w[0]).join("")}</div>
                    <div>
                      <strong>{bid.freelancer_name}</strong>
                      <small>{bid.message}</small>
                    </div>
                    <b>${bid.proposed_price}</b>
                    {bid.status === "Pending" && (
                      <button className="action-btn primary" onClick={() => void request("accept_bid", { bid_id: bid.bid_id })}>
                        Accept Proposal
                      </button>
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

function Profile({ user, skills, compact = false }: { user: User; skills: Skill[]; compact?: boolean }) {
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
          <small>Skills</small>
          <strong>{skills.slice(0, 3).map((s) => s.skill_name).join(" · ")}</strong>
        </div>
        <div>
          <small>Reputation</small>
          <strong>
            4.9 <span className="stars">★★★★★</span>
          </strong>
        </div>
      </div>
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
