import React from "react";
import "../assets/netflixhome.css"
import { Link } from "react-router-dom";

export const NetflixHome = () => {
    return (
        <div className="netflix-home">
            {/* Hero Section */}
            <div className="hero">
                <div className="hero-overlay"></div>

                <div className="hero-content">
                    <h1 className="hero-title">Welcome to Netflix</h1>
                    <p className="hero-subtitle">
                        Watch trending movies, shows and explore collections.
                    </p>

                    <div className="hero-buttons">
                        <button className="btn-play">▶ Play</button>
                        <button className="btn-info">ℹ More Info</button>
                    </div>
                </div>
            </div>
            
            <div className="home-links">
                <Link to="/netflixshows" className="home-card">Netflix Shows</Link>
                <Link to="/netflixmovies" className="home-card">Netflix Movies</Link>
                <Link to="/iplteams" className="home-card">IPL Teams</Link>
                <Link to="/books" className="home-card">Books</Link>
            </div>
        </div>
    );
};
