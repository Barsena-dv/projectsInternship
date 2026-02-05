import React from "react";
import "../assets/netflixshows.css"

export const NetflixShows = () => {
    return (
        <div className="shows-page">
            {/* Header */}
            <div className="shows-header">
                <h1 className="shows-title">Netflix Shows</h1>
                <p className="shows-subtitle">
                    Browse popular series, trending shows, and classics — simple and clean UI.
                </p>
            </div>

            {/* Controls */}
            <div className="shows-controls">
                <input
                    type="text"
                    placeholder="Search shows..."
                    className="shows-search"
                />

                <select className="shows-filter">
                    <option>All Genres</option>
                    <option>Drama</option>
                    <option>Action</option>
                    <option>Comedy</option>
                    <option>Thriller</option>
                    <option>Sci-Fi</option>
                </select>

                <select className="shows-filter">
                    <option>Sort By</option>
                    <option>Latest</option>
                    <option>Oldest</option>
                    <option>Top Rated</option>
                    <option>A → Z</option>
                </select>
            </div>

            {/* List / Table */}
            <div className="shows-list">
                <div className="shows-row shows-row-head">
                    <span>#</span>
                    <span>Show Name</span>
                    <span>Genre</span>
                    <span>Year</span>
                    <span>Rating</span>
                </div>

                {/* sample shows just for UI */}
                {Array.from({ length: 8 }).map((_, i) => (
                    <div className="shows-row" key={i}>
                        <span>{i + 1}</span>
                        <span>Sample Show {i + 1}</span>
                        <span>Drama</span>
                        <span>202{(i % 5) + 0}</span>
                        <span className="rating-chip">{(8.1 + i * 0.1).toFixed(1)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
