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
    if (!data || !data.Title) return <h2>Loading...</h2>;

    return (
        <div className="page">

            <div className="top">
                <img
                    className="poster"
                    src={data.Poster !== "N/A" ? data.Poster : "/noPoster.png"}
                    alt="poster"
                />

                <div>
                    <div className="title">{data.Title}</div>
                    <div className="meta">{data.Year} • {data.Rated} • {data.Runtime}</div>
                    <div className="meta">{data.Genre}</div>

                    <div className="rating">⭐ {data.imdbRating} / 10</div>
                    <div className="meta">{data.imdbVotes} votes • Metascore {data.Metascore}</div>

                    <div className="ratingsBox">
                        {data.Ratings?.map((r, i) => (
                            <div key={i} className="chip">
                                <b>{r.Source}</b><br />{r.Value}
                            </div>
                        ))}
                    </div>

                    <div className="grid">
                        <div className="label">Director</div><div>{data.Director}</div>
                        <div className="label">Writer</div><div>{data.Writer}</div>
                        <div className="label">Actors</div><div>{data.Actors}</div>
                        <div className="label">Released</div><div>{data.Released}</div>
                        <div className="label">Language</div><div>{data.Language}</div>
                        <div className="label">Country</div><div>{data.Country}</div>
                        <div className="label">Awards</div><div>{data.Awards}</div>
                        <div className="label">Box Office</div><div>{data.BoxOffice}</div>
                    </div>
                </div>
            </div>

            <div className="section">
                <h2>Plot</h2>
                <p>{data.Plot}</p>
            </div>
        </div>
    );
}
