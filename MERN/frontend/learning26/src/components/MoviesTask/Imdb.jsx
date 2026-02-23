import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import "../../assets/imdb.css"

export const Imdb = () => {
    const { id } = useParams();

    const [data, setdata] = useState({})
    useEffect(() => {
        const details = async () => {
            const res = await axios.get(`http://www.omdbapi.com/?apikey=2c2edd99&i=${id}`);
            console.log(res.data);
            setdata(res.data);
        };
        details();
    }, [id])
    if (!data || !data.Title) return <h2 className="imdb-loading">Loading...</h2>;

    return (
        <div className="imdb-page">

            <div className="imdb-top">
                <img
                    className="imdb-poster"
                    src={data.Poster !== "N/A" ? data.Poster : "/noPoster.png"}
                    alt="poster"
                />

                <div>
                    <div className="imdb-title">{data.Title}</div>
                    <div className="imdb-meta">{data.Year} • {data.Rated} • {data.Runtime}</div>
                    <div className="imdb-meta">{data.Genre}</div>

                    <div className="imdb-rating">⭐ {data.imdbRating} / 10</div>
                    <div className="imdb-meta">{data.imdbVotes} votes • Metascore {data.Metascore}</div>

                    <div className="imdb-ratingsBox">
                        {data.Ratings?.map((r, i) => (
                            <div key={i} className="imdb-chip">
                                <b>{r.Source}</b><br />{r.Value}
                            </div>
                        ))}
                    </div>

                    <div className="imdb-grid">
                        <div className="imdb-label">Director</div><div>{data.Director}</div>
                        <div className="imdb-label">Writer</div><div>{data.Writer}</div>
                        <div className="imdb-label">Actors</div><div>{data.Actors}</div>
                        <div className="imdb-label">Released</div><div>{data.Released}</div>
                        <div className="imdb-label">Language</div><div>{data.Language}</div>
                        <div className="imdb-label">Country</div><div>{data.Country}</div>
                        <div className="imdb-label">Awards</div><div>{data.Awards}</div>
                        <div className="imdb-label">Box Office</div><div>{data.BoxOffice}</div>
                    </div>
                </div>
            </div>

            <div className="imdb-section">
                <h2>Plot</h2>
                <p>{data.Plot}</p>
            </div>
        </div>
    );
}
