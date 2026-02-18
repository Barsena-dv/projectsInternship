import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import "../../assets/country.css"


export const CountryDetails = () => {

    const { name } = useParams();
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await axios.get(
                    `https://restcountries.com/v3.1/name/${name}`
                );
                setData(res.data[0]);
            } catch (err) {
                console.log(err);
            }
        };
        fetchDetails();
    }, [name]);

    if (!data) return <h2 style={{ textAlign: "center" }}>Loading...</h2>;

    return (
        <div className="country-page">

            <div className="country-hero">
                <div className="flag-card">
                    <img
                        className="flag-img"
                        src={data.flags?.png}
                        alt="flag"
                    />
                </div>

                <div className="country-info">
                    <h1 className="country-title">{data.name.common}</h1>
                    <p className="country-sub">
                        {data.region} • {data.subregion}
                    </p>

                    <div className="population-badge">
                        Population: {data.population.toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="country-details">
                <div className="detail-card">
                    <span>Capital</span>
                    <strong>{data.capital?.[0]}</strong>
                </div>

                <div className="detail-card">
                    <span>Area</span>
                    <strong>{data.area} km²</strong>
                </div>

                <div className="detail-card">
                    <span>Languages</span>
                    <strong>
                        {data.languages &&
                            Object.values(data.languages).join(", ")
                        }
                    </strong>
                </div>

                <div className="detail-card">
                    <span>Currencies</span>
                    <strong>
                        {data.currencies &&
                            Object.values(data.currencies)
                                .map((c) => c.name)
                                .join(", ")
                        }
                    </strong>
                </div>

                <div className="detail-card wide">
                    <span>Timezones</span>
                    <strong>{data.timezones?.join(", ")}</strong>
                </div>
            </div>

            <div className="overview-section">
                <h2>About {data.name.common}</h2>
                <p>
                    {data.name.common} is located in {data.region}.
                    It has a population of {data.population.toLocaleString()}
                    and covers an area of {data.area} square kilometers.
                </p>
            </div>

        </div>
    );

}
