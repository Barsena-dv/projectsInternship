import React from 'react'
import { Link } from 'react-router-dom'
import "../assets/navbar.css"

export const NavBar = () => {
    return (
        <header className="nav">
            <div className="nav-logo">Navbar</div>

            <nav className="nav-links">
                <Link to="/netflixhome">Netflix Home</Link>
                <Link to="/netflixshows">Netflix Shows</Link>
                <Link to="/netflixmovies">Netflix Movies</Link>
                <Link to="/iplteams">IPL Teams</Link>
                <Link to="/mapdemo6">Cars</Link>
                <Link to="/mapdemo7">Watches</Link>
                <Link to="/mapdemo8">Bikes</Link>
                <Link to="/mapdemo9">Books</Link>
                <Link to="/mapdemo10">Ships</Link>
                <Link to="/state1">State1</Link>
                <Link to="/state2">State2</Link>
                <Link to="/alert1">Alert1</Link>
                <Link to="/formtask1">Form1</Link>
                <Link to="/formtask2">Form2</Link>
                <Link to="/formtask3">Form3</Link>
                <Link to="/inputtask1">Input1</Link>
                <Link to="/validationtask1">Validate1</Link>
                <Link to="/validationtask2">Validate2 </Link>
                <Link to="/validationtask3">Validate3 </Link>
            </nav>
        </header>
    )
}
