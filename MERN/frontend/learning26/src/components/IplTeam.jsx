import React from 'react'
import "../assets/moviesCard.css"
import { Link } from 'react-router-dom'

export const IplTeam = () => {

    const iplTeams = [
        {
            id: 1,
            teamName: "Chennai Super Kings",
            rating: 9.3,
            year: 2008,
            description:
                "One of the most consistent IPL teams, known for calm leadership, smart strategy, and loyal fanbase (Yellow Army).",
            posterImage:
                "https://i.pinimg.com/1200x/10/28/45/102845c28bd32233a24934e2aed5e142.jpg",
        },
        {
            id: 2,
            teamName: "Mumbai Indians",
            rating: 9.4,
            year: 2008,
            description:
                "The most successful IPL franchise, famous for scouting talent, big-match performance, and star players.",
            posterImage:
                "https://i.pinimg.com/1200x/2e/82/b2/2e82b229b9eef3c8fe1baa7970c99610.jpg",
        },
        {
            id: 3,
            teamName: "Royal Challengers Bangalore",
            rating: 9.0,
            year: 2008,
            description:
                "A fan-favorite franchise with iconic players and an exciting aggressive style of cricket.",
            posterImage:
                "https://i.pinimg.com/736x/27/8f/08/278f08cce7595964a738380ee21c0f22.jpg",
        },
        {
            id: 4,
            teamName: "Kolkata Knight Riders",
            rating: 9.1,
            year: 2008,
            description:
                "Known for explosive performances, strong team identity, and passionate Kolkata fans (Korbo Lorbo Jeetbo).",
            posterImage:
                "https://i.pinimg.com/1200x/c8/e9/e6/c8e9e65d1d2f9d2472dd64a875c5c238.jpg"
        },
        {
            id: 5,
            teamName: "Delhi Capitals",
            rating: 8.7,
            year: 2008,
            description:
                "A young and dynamic team with a focus on building emerging talent and fearless cricket.",
            posterImage:
                "https://i.pinimg.com/1200x/17/aa/4d/17aa4d5dbc9e82a77e159b9f8bade5fc.jpg",
        },
        {
            id: 6,
            teamName: "Rajasthan Royals",
            rating: 8.9,
            year: 2008,
            description:
                "The original underdogs who won the first IPL season and remain known for smart picks and teamwork.",
            posterImage:
                "https://i.pinimg.com/1200x/bc/26/de/bc26dea4ac81c65d038fa352d363e3cc.jpg",
        },
        {
            id: 7,
            teamName: "Sunrisers Hyderabad",
            rating: 8.8,
            year: 2013,
            description:
                "Famous for their disciplined bowling attacks and balanced team combinations.",
            posterImage:
                "https://i.pinimg.com/1200x/81/30/26/813026418f3ec75b2a6298fb3e81f0e0.jpg",
        },
        {
            id: 8,
            teamName: "Punjab Kings",
            rating: 8.5,
            year: 2008,
            description:
                "An unpredictable but entertaining franchise, always packed with power hitters and thrilling matches.",
            posterImage:
                "https://i.pinimg.com/1200x/ad/c5/fe/adc5fe8570e3fbe976e743c7589cf719.jpg",
        },
        {
            id: 9,
            teamName: "Gujarat Titans",
            rating: 9.0,
            year: 2022,
            description:
                "One of the strongest new-era teams, known for discipline, strong leadership, and consistent performances.",
            posterImage:
                "https://i.pinimg.com/736x/ea/df/52/eadf52ed1b962b079801ed8e912c7e10.jpg",
        },
        {
            id: 10,
            teamName: "Lucknow Super Giants",
            rating: 8.8,
            year: 2022,
            description: "A new franchise with a solid squad, modern strategy, and quick rise as a strong competitor.",
            posterImage: "https://i.pinimg.com/736x/42/82/fe/4282fec174f445b9655dd8d7347a72e5.jpg",
        },
    ];



    return (
        <div style={{ textAlign: "center" }}>
            <h1 style={{ textAlign: "left", padding: "12px 0px 0px 12px" }}>IPL Teams</h1>
            <div className='movie-row'>
                {
                    iplTeams.map((iplTeam) => {
                        return <li>
                            <Link to={`/play/${iplTeam.teamName}`}>
                                <div className='card' style={{ backgroundImage: `url(${iplTeam.posterImage})` }}>
                                    <p className='rating'>{iplTeam.rating}</p>
                                    <div className='specs'>
                                        {/* <p>{iplTeam.year} • {iplTeam.genre}</p> */}
                                        <p className='specs description'>{iplTeam.description}</p>
                                    </div>
                                    {/* <p className='duration'>{iplTeam.duration}</p> */}
                                </div>
                            </Link>
                        </li>
                    })
                }
            </div>
        </div>
    )
}
