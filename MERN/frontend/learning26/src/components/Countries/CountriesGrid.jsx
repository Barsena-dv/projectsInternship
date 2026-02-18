import React, { useState } from 'react'
import { CardComponent } from '../CardComponent'
import axios from 'axios'

export const CountriesGrid = () => {

    const [countries, setCountries] = useState([]);
    const [param, setParam] = useState("");

    const searchCountry = async () => {
        if (!param) return;

        try {
            const response = await axios.get(
                `https://restcountries.com/v3.1/name/${param}`
            );
            setCountries(response.data);
        } catch (err) {
            console.log(err);
            setCountries([]);
        }
    };

    return (
        <div>
            <div style={{ textAlign: "center" }}>
                <h1>Countries Explorer</h1>

                <input
                    type="text"
                    value={param}
                    placeholder="Search country..."
                    onChange={(e) => setParam(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            searchCountry();
                        }
                    }}
                />

                <button onClick={searchCountry}>Search</button>

                <div className="movie-row">
                    {countries.map((country) => (
                        <CardComponent
                            key={country.cca3}
                            title={country.name.common}
                            image={country.flags?.png}
                            subtitle={country.region}
                            year={`Pop: ${country.population.toLocaleString()}`}
                            link={`/country/${country.name.common}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
