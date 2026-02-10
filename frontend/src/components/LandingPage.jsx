import React from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  const modules = [
    { title: "Attendance", desc: "Mark, track, and export attendance reports." },
    { title: "Library", desc: "Issue/return books, fine tracking, catalog search." },
    { title: "Hostel", desc: "Room allocation, fees, complaints, visitor log." },
    { title: "CV / Portfolio", desc: "Student CV builder with templates & downloads." },
    { title: "Fees", desc: "Online payments, invoices, due reminders." },
    { title: "Exams & Results", desc: "Create exams, publish results, transcripts." },
    { title: "Classes & Timetable", desc: "Schedules, sections, teacher assignment." },
    { title: "Notices", desc: "Announcements for students, teachers, hostel, etc." },
  ];

  const roles = [
    {
      title: "Admin",
      points: ["Manage users & roles", "Control modules & settings", "Reports & analytics"],
    },
    {
      title: "Teacher",
      points: ["Attendance & grades", "Assignments & notices", "Student performance"],
    },
    {
      title: "Student",
      points: ["Track attendance", "Library & hostel access", "CV + results dashboard"],
    },
  ];

  return (
    <div className="sms">
      {/* Navbar */}
      <header className="nav">
        <div className="nav__inner">
          <a className="brand" href="#top" aria-label="Student Management System Home">
            <span className="brand__logo">SMS</span>
            <span className="brand__text">Student Management System</span>
          </a>

          <nav className="nav__links" aria-label="Primary">
            <a href="#modules">Modules</a>
            <a href="#roles">Roles</a>
            <a href="#features">Features</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="nav__actions">
            <Link className="btn btn--ghost" to="/login">Login</Link>
            
          </div>
        </div>
      </header>

      {/* Hero */}
      <main id="top" className="hero">
        <div className="hero__inner">
          <div className="hero__content">
            <p className="badge">Campus OS - All-in-one platform</p>
            <h1 className="hero__title">
              All your campus operations, <span>beautifully unified</span>
            </h1>
            <p className="hero__subtitle">
              Attendance, library, hostel, CV builder, results, fees, notices and more —
              in one clean dashboard for Admin, Teacher, and Student.
            </p>

            <div className="hero__cta">
              <Link className="btn btn--primary btn--lg" to="/login">Open Login</Link>
              <a className="btn btn--ghost btn--lg" href="#modules">Explore Modules</a>
            </div>

            <div className="hero__stats" aria-label="Quick highlights">
              <div className="stat">
                <div className="stat__num">3</div>
                <div className="stat__label">User Roles</div>
              </div>
              <div className="stat">
                <div className="stat__num">10+</div>
                <div className="stat__label">Modules</div>
              </div>
              <div className="stat">
                <div className="stat__num">Secure</div>
                <div className="stat__label">Role-Based Access</div>
              </div>
            </div>
          </div>

          <div className="hero__panel" aria-label="Preview panel">
            <div className="panel">
              <div className="panel__top">
                <div className="dots">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="panel__title">Dashboard Preview</div>
              </div>

              <div className="panel__body">
                <div className="kpiGrid">
                  <div className="kpi">
                    <div className="kpi__label">Total Students</div>
                    <div className="kpi__value">1,240</div>
                    <div className="kpi__hint">+12 this month</div>
                  </div>
                  <div className="kpi">
                    <div className="kpi__label">Attendance Today</div>
                    <div className="kpi__value">92%</div>
                    <div className="kpi__hint">All sections</div>
                  </div>
                  <div className="kpi">
                    <div className="kpi__label">Library Issues</div>
                    <div className="kpi__value">38</div>
                    <div className="kpi__hint">Due: 6</div>
                  </div>
                  <div className="kpi">
                    <div className="kpi__label">Hostel Rooms</div>
                    <div className="kpi__value">84%</div>
                    <div className="kpi__hint">Occupancy</div>
                  </div>
                </div>

                <div className="miniList">
                  <div className="miniList__title">Recent Activity</div>
                  <ul>
                    <li><span className="pill">Notice</span> Exam schedule updated</li>
                    <li><span className="pill">Library</span> Book returned: DBMS</li>
                    <li><span className="pill">Hostel</span> Complaint resolved</li>
                    <li><span className="pill">CV</span> Resume downloaded</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="panel__note">
              Fast, responsive UI built with React + CSS.
            </div>
          </div>
        </div>
      </main>

      {/* Modules */}
      <section id="modules" className="section">
        <div className="container">
          <div className="sectionHead">
            <h2>Modules</h2>
            <p>Start with core modules and expand anytime.</p>
          </div>

          <div className="grid grid--cards">
            {modules.map((m) => (
              <article className="card" key={m.title}>
                <h3 className="card__title">{m.title}</h3>
                <p className="card__desc">{m.desc}</p>
                <a className="card__link" href="/login">
                  Learn more <span aria-hidden="true">→</span>
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="section section--alt">
        <div className="container">
          <div className="sectionHead">
            <h2>Built for every role</h2>
            <p>Admin controls the system, teachers manage learning, students track progress.</p>
          </div>

          <div className="grid grid--roles">
            {roles.map((r) => (
              <article className="roleCard" key={r.title}>
                <div className="roleCard__top">
                  <div className="roleIcon" aria-hidden="true">
                    {r.title[0]}
                  </div>
                  <h3 className="roleCard__title">{r.title}</h3>
                </div>
                <ul className="roleCard__list">
                  {r.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                <a className="btn btn--ghost btn--full" href="/login">
                  Open {r.title} Dashboard
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section">
        <div className="container">
          <div className="sectionHead">
            <h2>Key features</h2>
            <p>Everything you need for a modern student management system.</p>
          </div>

          <div className="grid grid--features">
            <div className="feature">
              <h3>Role-based access</h3>
              <p>Secure permissions for Admin, Teacher, and Student screens.</p>
            </div>
            <div className="feature">
              <h3>Clean dashboards</h3>
              <p>Quick KPIs, recent activity, and smart shortcuts.</p>
            </div>
            <div className="feature">
              <h3>Export & reports</h3>
              <p>Attendance, fees, results, library fines — all report-ready.</p>
            </div>
            <div className="feature">
              <h3>Mobile friendly</h3>
              <p>Responsive layout that works well on phones and tablets.</p>
            </div>
          </div>

          <div className="ctaCard">
            <div className="ctaCard__text">
              <h3>Ready to launch your system?</h3>
              <p>Connect your backend APIs and start managing your campus.</p>
            </div>
          <div className="ctaCard__actions">
              <Link className="btn btn--primary" to="/login">Open Login</Link>
              <a className="btn btn--ghost" href="#contact">Contact</a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="section section--alt">
        <div className="container">
          <div className="sectionHead">
            <h2>Contact</h2>
            <p>Want a demo or help integrating modules? Send a message.</p>
          </div>

          <form className="form" onSubmit={(e) => e.preventDefault()}>
            <div className="form__row">
              <label>
                Name
                <input type="text" placeholder="Your name" required />
              </label>
              <label>
                Email
                <input type="email" placeholder="you@example.com" required />
              </label>
            </div>

            <label>
              Message
              <textarea placeholder="Write your message..." rows={5} required />
            </label>

            <button className="btn btn--primary" type="submit">Send</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer__inner">
          <div>
            <div className="footer__brand">Student Management System</div>
            <div className="footer__muted">© {new Date().getFullYear()} All rights reserved.</div>
          </div>

          <div className="footer__links">
            <a href="#modules">Modules</a>
            <a href="#roles">Roles</a>
            <a href="#features">Features</a>
            <a href="/privacy">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
