import React, { useState } from 'react'
import { CardComponent } from '../CardComponent'
import axios from 'axios'

export const MoviesGrid = () => {

    const [movies, setmovies] = useState([]);
    const [param, setparam] = useState("")

    const moviesSearch = async () => {
        const response = await axios.get(`http://www.omdbapi.com/?apikey=2c2edd99&s=${param}`);
        console.log(response.data);
        setmovies(response.data.Search);
    }

    return (
            <div className='page-container'>
                <div className="search-section">
                    <h1 className="page-heading">Movies</h1>
                    <div className="search-bar">
                        <input type="text" value={param}
                            onChange={(e) => setparam(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { moviesSearch(); } }} />
                        <button onClick={() => { moviesSearch() }}>Search</button>
                    </div>
                </div>
                <div className="results-section">
                    <div className="movie-row">
                        {
                            movies.map((movie) => (
                                <CardComponent
                                    key={movie.imdbID}
                                    title={movie.Title}
                                    image={movie.Poster}
                                    year={movie.Year}
                                    link={`/imdb/${movie.imdbID}`}
                                />
                            ))
                        }
                    </div>
                </div>
            </div>
    )
}
