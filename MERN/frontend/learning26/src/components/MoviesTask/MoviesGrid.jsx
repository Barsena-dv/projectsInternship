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
        <div>
            <div style={{ textAlign: "center" }}>
                <h1>Movies</h1>
                <input type="text" value={param} 
                onChange={(e) => setparam(e.target.value)}  
                onKeyDown={(e) => { if (e.key === "Enter") {moviesSearch();} }} />
                <button onClick={() => { moviesSearch() }}>Search</button>
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
            {/* <CardComponent /> */}
        </div>
    )
}
