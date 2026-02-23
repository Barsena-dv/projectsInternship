import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import "../assets/navbar.css";

export const NavBar = () => {
    const [open, setOpen] = useState(false);
    const close = () => setOpen(false);

    return (
        <>
            {/* ── Fixed top bar ── */}
            <header className="topbar">
                <button
                    className={`topbar-toggle ${open ? "topbar-toggle--open" : ""}`}
                    onClick={() => setOpen(o => !o)}
                    aria-label="Toggle navigation"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <Link to="/" className="topbar-logo" onClick={close}>
                    Learning<span>26</span>
                </Link>
            </header>

            {/* ── Backdrop ── */}
            {open && <div className="sidebar-backdrop" onClick={close} />}

            {/* ── Sidebar ── */}
            <aside className={`sidebar ${open ? "sidebar--open" : ""}`}>
                <nav className="sidebar-nav">

                    <p className="sidebar-section-label">Streaming</p>
                    <NavLink to="/netflixhome" onClick={close}>Netflix Home</NavLink>
                    <NavLink to="/netflixshows" onClick={close}>Netflix Shows</NavLink>
                    <NavLink to="/netflixmovies" onClick={close}>Netflix Movies</NavLink>
                    <NavLink to="/moviesGrid" onClick={close}>Movies Grid</NavLink>
                    <NavLink to="/iplteams" onClick={close}>IPL Teams</NavLink>

                    <div className="sidebar-divider" />
                    <p className="sidebar-section-label">Collections</p>
                    <NavLink to="/mapdemo6" onClick={close}>Cars</NavLink>
                    <NavLink to="/mapdemo7" onClick={close}>Watches</NavLink>
                    <NavLink to="/mapdemo8" onClick={close}>Bikes</NavLink>
                    <NavLink to="/mapdemo9" onClick={close}>Books</NavLink>
                    <NavLink to="/mapdemo10" onClick={close}>Ships</NavLink>
                    <NavLink to="/country" onClick={close}>Countries</NavLink>

                    <div className="sidebar-divider" />
                    <p className="sidebar-section-label">State</p>
                    <NavLink to="/state1" onClick={close}>State 1</NavLink>
                    <NavLink to="/state2" onClick={close}>State 2</NavLink>
                    <NavLink to="/alert1" onClick={close}>Alert 1</NavLink>

                    <div className="sidebar-divider" />
                    <p className="sidebar-section-label">Forms</p>
                    <NavLink to="/formtask1" onClick={close}>Form 1</NavLink>
                    <NavLink to="/formtask2" onClick={close}>Form 2</NavLink>
                    <NavLink to="/formtask3" onClick={close}>Form 3</NavLink>
                    <NavLink to="/inputtask1" onClick={close}>Input 1</NavLink>
                    <NavLink to="/inputtask2" onClick={close}>Input 2</NavLink>
                    <NavLink to="/validationtask1" onClick={close}>Validate 1</NavLink>
                    <NavLink to="/validationtask2" onClick={close}>Validate 2</NavLink>
                    <NavLink to="/validationtask3" onClick={close}>Validate 3</NavLink>

                    <div className="sidebar-divider" />
                    <p className="sidebar-section-label">API</p>
                    <NavLink to="/api1" onClick={close}>API 1 — Users</NavLink>
                    <NavLink to="/api2" onClick={close}>API 2 — Products</NavLink>
                    <NavLink to="/api3" onClick={close}>API 3 — Comments</NavLink>
                    <NavLink to="/api4" onClick={close}>API 4 — Post User</NavLink>
                </nav>
            </aside>
        </>
    )
}
