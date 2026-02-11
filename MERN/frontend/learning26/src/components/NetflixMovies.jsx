import React from 'react'
import "../assets/moviesCard.css"
import { Link } from 'react-router-dom'
import { CardComponent } from './CardComponent';

export const NetflixMovies = () => {

    const movies = [
        {
            id: 1,
            title: "Dhurandhar",
            year: 2024,
            genre: "Action, Drama",
            rating: 8.2,
            duration: "2h 25m",
            description: "A fierce story of power, revenge, and survival where one man challenges the system.",
            poster: "https://i.pinimg.com/1200x/60/35/e9/6035e92d87c52e013e3b4e68bca13b56.jpg"
        },
        {
            id: 2,
            title: "Unstoppable",
            year: 2010,
            genre: "Action, Thriller",
            rating: 6.8,
            duration: "1h 38m",
            description: "A runaway train threatens disaster, and two men risk everything to stop it.",
            poster: "https://i.pinimg.com/736x/24/44/9f/24449feae4a9ca5575142f60ea86d197.jpg"
        },
        {
            id: 3,
            title: "Avengers: Endgame",
            year: 2019,
            genre: "Action, Sci-Fi",
            rating: 8.4,
            duration: "3h 1m",
            description: "The Avengers assemble for one final mission to undo Thanos' destruction.",
            poster: "https://i.pinimg.com/1200x/95/26/68/9526684fe11e38cf6bb6fbd48e37de6a.jpg"
        }
    ];


    return (
        <div style={{ textAlign: "center" }}>
            <h1 style={{ textAlign: "left", padding: "12px 0px 0px 12px" }}>NetflixMovies</h1>
            <div className="movie-row">
                {
                    movies.map((movie) => (
                        <CardComponent
                            key={movie.id}
                            // title={movie.title}
                            image={movie.poster}
                            rating={movie.rating}
                            year={movie.year}
                            subtitle={movie.genre}
                            description={movie.description}
                            extra={movie.duration}
                            link={`/watch/${movie.title}`}
                        />
                    ))
                }
            </div>

        </div>
    )
}
